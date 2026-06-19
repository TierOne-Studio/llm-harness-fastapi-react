#!/usr/bin/env bash
# simulate-prompts.sh — static skill-trigger simulation for the FULLSTACK harness.
#
# This is NOT an LLM run. It's a static contract test: for each canonical
# (prompt, expected_skills) case, assert that every expected skill's
# description contains enough keywords from the prompt that the LLM's
# description-match heuristic would plausibly load it.
#
# Failure means trigger drift: either a skill description was weakened,
# or the prompt's expected skill list is now stale. Fix the side that's wrong.
#
# Threshold: every expected skill must contain >=1 lowercased prompt token
# (length >= 4) in its description. Stop-words filtered.
#
# Usage: bash .ruler/tests/simulate-prompts.sh

set -uo pipefail

RULER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INSTRUCTIONS="$RULER_DIR/instructions.md"

PASS=0
FAIL=0
FAILED=""
WEAK=0
WEAK_LIST=""

STOP_WORDS="the a an this that these those is are was were be been being have has had do does did will would could should may might can must shall and or but if then else when while of in on at by for to from with into onto over under up down out off about our we i you they it its their my your add new use using fix update create make build write test"

skill_description() {
  local name="$1"
  local f="$RULER_DIR/skills/$name/SKILL.md"
  if [ ! -f "$f" ]; then echo ""; return; fi
  awk '/^description:/{sub(/^description:[[:space:]]*/,""); print; exit}' "$f" | tr '[:upper:]' '[:lower:]'
}

prompt_tokens() {
  local p="$1"
  echo "$p" | tr '[:upper:]' '[:lower:]' \
    | tr -c '[:alpha:]' ' ' \
    | tr ' ' '\n' \
    | awk -v stop="$STOP_WORDS" '
        BEGIN { n = split(stop, arr, " "); for (i=1;i<=n;i++) s[arr[i]] = 1 }
        length($0) >= 4 && !($0 in s) { print }
      ' \
    | sort -u
}

match_count() {
  local prompt="$1" desc="$2"
  local count=0
  while IFS= read -r tok; do
    [ -z "$tok" ] && continue
    if printf '%s' "$desc" | grep -q "$tok"; then count=$((count+1)); fi
  done <<EOF
$(prompt_tokens "$prompt")
EOF
  echo "$count"
}

# A match passes the floor at >=1 keyword overlap, but a single-keyword overlap is
# a WEAK (fragile) match — it could be a coincidental common word. WEAK matches still
# pass, but are counted and ratcheted: new ones above MAX_WEAK fail the build, so a
# weak description can't silently slip through on one shared word. MAX_WEAK only ratchets DOWN.
THRESHOLD=1
WEAK_THRESHOLD=2
MAX_WEAK=9
check_case() {
  local case_name="$1" prompt="$2" expected_skill="$3"
  local desc
  desc=$(skill_description "$expected_skill")
  if [ -z "$desc" ]; then
    echo "FAIL: $case_name — skill '$expected_skill' has no description (or skill missing)"
    FAIL=$((FAIL+1)); FAILED="$FAILED $case_name:$expected_skill"; return
  fi
  local n
  n=$(match_count "$prompt" "$desc")
  if [ "$n" -ge "$WEAK_THRESHOLD" ]; then
    echo "PASS: $case_name → $expected_skill ($n keyword(s) matched)"
    PASS=$((PASS+1))
  elif [ "$n" -ge "$THRESHOLD" ]; then
    echo "WEAK: $case_name → $expected_skill (single-keyword match — fragile; sharpen the description or the case prompt)"
    PASS=$((PASS+1)); WEAK=$((WEAK+1)); WEAK_LIST="$WEAK_LIST $case_name:$expected_skill"
  else
    echo "FAIL: $case_name → $expected_skill (only $n keyword(s), need >=$THRESHOLD)"
    echo "  prompt: $prompt"
    echo "  desc[:200]: ${desc:0:200}"
    FAIL=$((FAIL+1)); FAILED="$FAILED $case_name:$expected_skill"
  fi
}

run_case() {
  local id="$1" prompt="$2" expected_csv="$3"
  IFS=',' read -ra skills <<< "$expected_csv"
  for s in "${skills[@]}"; do check_case "$id" "$prompt" "$s"; done
}

check_workflow_chain_mentions() {
  local case_name="$1" expected_skills_csv="$2"
  local section
  section=$(awk '/^## WORKFLOW CHAINS/,/^---$/' "$INSTRUCTIONS")
  IFS=',' read -ra arr <<< "$expected_skills_csv"
  for s in "${arr[@]}"; do
    if printf '%s' "$section" | grep -q "$s"; then
      echo "PASS: $case_name workflow-chain mentions $s"; PASS=$((PASS+1))
    else
      echo "FAIL: $case_name workflow-chain missing $s"
      FAIL=$((FAIL+1)); FAILED="$FAILED $case_name:chain:$s"
    fi
  done
}

echo "=== Skill-trigger simulation: prompt → expected skill descriptions (fullstack) ==="
echo
echo "NOTE: Per P3.4, several skills (tdd-workflow, repo-conventions, design-review,"
echo "failure-mode-analysis, plan-mode, react-patterns, accessibility, async-error-handling,"
echo "database-transactions, cross-repo-workspace) are MANDATORY for the matching code change —"
echo "they fire regardless of description match. Per-case keyword assertions below only cover"
echo "DISCRETIONARY skills (those whose triggering depends on the prompt's content)."
echo

# ============================ FRONTEND (apps/web) ===========================
echo "--- Case: frontend feature — new route + data fetching"
run_case "feat-route" \
  "Add a new protected route that fetches user profile data and shows a loading state" \
  "react-routing,react-data-fetching,react-state-management"

echo
echo "--- Case: form work"
run_case "feat-form" \
  "Add a new signup form with email validation and async submit error handling" \
  "react-forms,async-error-handling"

echo
echo "--- Case: rendering performance"
run_case "perf-rerender" \
  "Investigate why this component rerenders on every keystroke and reduce the rerender cost" \
  "react-performance,react-state-management"

echo
echo "--- Case: bundle work"
run_case "perf-bundle" \
  "Add a new dependency for date formatting and check the bundle size impact" \
  "bundle-size,frontend-security"

echo
echo "--- Case: a11y"
run_case "a11y-dialog" \
  "Add a confirmation dialog with keyboard navigation and focus management" \
  "accessibility,react-patterns"

echo
echo "--- Case: XSS / token storage (frontend security)"
run_case "sec-xss" \
  "Render user-submitted markdown safely without enabling raw HTML injection" \
  "frontend-security"
run_case "sec-tokens" \
  "Review how the auth token is stored and whether localStorage exposure is acceptable" \
  "frontend-security"

echo
echo "--- Case: route guard"
run_case "route-guard" \
  "Add an admin-only route that redirects unauthenticated users to /login" \
  "react-routing,frontend-security"

echo
echo "--- Case: frontend component test + e2e"
run_case "test-component" \
  "Write a Vitest test for this component using Testing Library queries" \
  "react-testing,vitest"
run_case "test-e2e" \
  "Write a Playwright test that walks the login flow including OAuth redirect handling" \
  "playwright-best-practices"

# ============================ BACKEND (apps/api) ============================
echo
echo "--- Case: multi-statement DB write"
run_case "multi-statement-db" \
  "implementing multi-statement database insert update delete across multiple rows tables atomic" \
  "database-transactions,db-write-protocol"

echo
echo "--- Case: single DB write"
run_case "single-write" \
  "delete inactive sessions from the database" \
  "db-write-protocol"

echo
echo "--- Case: FastAPI tactical patterns"
run_case "fastapi-dependency" \
  "design a FastAPI dependency with Depends Security APIRouter lifespan middleware" \
  "fastapi-patterns"

echo
echo "--- Case: FastAPI best-practice rules"
run_case "fastapi-rules" \
  "reviewing FastAPI routers dependencies request response models OpenAPI security and performance patterns" \
  "fastapi-best-practices"

echo
echo "--- Case: new domain module (clean architecture)"
run_case "clean-arch" \
  "designing a new domain module with the presentation application infrastructure layers dependency rule repository port" \
  "fastapi-clean-architecture"

echo
echo "--- Case: OpenAPI generated client seam"
run_case "openapi-client" \
  "change the FastAPI response schema OpenAPI operation ID and generated TypeScript client" \
  "openapi-contracts,pydantic-v2-patterns"

echo
echo "--- Case: FastAPI route testing"
run_case "fastapi-testing" \
  "write pytest FastAPI TestClient httpx tests with dependency overrides" \
  "fastapi-testing"

echo
echo "--- Case: FastAPI security"
run_case "fastapi-security" \
  "audit FastAPI Security Depends OAuth2 JWT cookie CORS CSRF RBAC SQL injection" \
  "fastapi-security"

echo
echo "--- Case: Python tooling / async / security decisions"
run_case "python-defaults" \
  "python typing ruff pytest async boundaries security and architecture decisions" \
  "python-best-practices"

# ============================ SHARED / PROCESS ==============================
echo
echo "--- Case: failing test / bug"
run_case "bug-failing-test" \
  "This test is failing intermittently in CI — investigate the root cause" \
  "bug-investigation,failure-mode-analysis"

echo
echo "--- Case: planning a non-trivial change"
run_case "plan-feat" \
  "Plan a refactor that splits the chat feature into three smaller modules" \
  "plan-mode,bug-investigation"

echo
echo "--- Case: structural decision / ADR"
run_case "adr-decision" \
  "We need to decide between Zustand and Jotai for the new feature; document the rationale" \
  "documentation-and-adrs,decision-rules"

echo
echo "--- Case: complex generics"
run_case "ts-generics" \
  "Define a type-safe generic hook with conditional return types based on the input shape" \
  "typescript-advanced-types"

echo
echo "--- Case: async error handling"
run_case "async-patterns" \
  "Refactor this Promise.all to allow partial failures using Promise.allSettled with AbortSignal" \
  "async-error-handling"

echo
echo "--- Case: cyclomatic complexity"
run_case "complexity-nested" \
  "Flatten the nested conditionals in this function using guard clauses and early returns" \
  "cyclomatic-complexity"

echo
echo "--- Case: hot-path performance"
run_case "perf-hotpath" \
  "optimize this hot loop performance for large datasets and high frequency events" \
  "js-performance-patterns"

echo
echo "--- Case: cleanup / simplification"
run_case "refactor-cleanup" \
  "simplify recently modified code clarity consistency maintainability preserve behavior cleanup" \
  "code-simplifier"

echo
echo "--- Case: design review"
run_case "design-review" \
  "before declaring this code change complete review against SOLID DRY KISS principles" \
  "design-review"

echo
echo "--- Case: skill-library audit"
run_case "skill-audit" \
  "review the skill library quality and check for misfiring overlapping skills" \
  "meta-skill-hygiene"

echo
echo "--- Case: PR creation"
run_case "git-pr" \
  "Commit the changes and open a pull request against main" \
  "git-workflow"

echo
echo "--- Case: simpler alternative + pushback"
run_case "pushback" \
  "The user proposed introducing a new library; surface a simpler alternative and the scope tradeoff before deciding the framing" \
  "pushback-templates,decision-rules"

echo
echo "--- Case: CI / pre-commit quality gate"
run_case "quality-gate" \
  "set up the CI pipeline and pre-commit hooks to run typecheck lint and tests on every pull request" \
  "quality-gates"

echo
echo "--- Case: unfamiliar codebase"
run_case "rlm" \
  "I'm new to this repo — help me understand the chat feature's architecture" \
  "rlm-explore,repo-conventions"

# ============================ FULLSTACK / SEAM ==============================
echo
echo "--- Case: cross-repo coordination"
run_case "cross-repo-feat" \
  "Add a /users/me endpoint in the backend repo and a useMe() hook in the frontend repo using TanStack Query with caching and optimistic updates" \
  "cross-repo-workspace,react-data-fetching"

echo
echo "--- Case: fullstack feature spanning both tiers + OpenAPI contract"
run_case "fullstack-contract" \
  "Add an endpoint in the backend, a hook in the frontend, and the OpenAPI contract type in the monorepo contracts package" \
  "repo-conventions"

# ============================ WORKFLOW-CHAIN MENTIONS =======================
echo
echo "=== Workflow-chain mention checks (instructions.md WORKFLOW CHAINS section) ==="
check_workflow_chain_mentions "fullstack-feature-flow" \
  "plan-mode,failure-mode-analysis,tdd-workflow,repo-conventions,design-review,react-patterns,fastapi-best-practices,database-transactions"
check_workflow_chain_mentions "frontend-feature-flow" \
  "react-patterns,react-state-management,react-routing,react-data-fetching,react-forms,accessibility,design-review"
check_workflow_chain_mentions "backend-feature-flow" \
  "fastapi-clean-architecture,fastapi-best-practices,fastapi-patterns,database-transactions,repo-conventions,design-review"
check_workflow_chain_mentions "bug-fix-flow" \
  "bug-investigation,failure-mode-analysis,tdd-workflow,repo-conventions,design-review"
check_workflow_chain_mentions "refactor-flow" \
  "plan-mode,tdd-workflow,code-simplifier,cyclomatic-complexity,repo-conventions,design-review"
check_workflow_chain_mentions "perf-flow" \
  "rlm-explore,js-performance-patterns,react-performance,bundle-size,failure-mode-analysis,design-review"
check_workflow_chain_mentions "async-flow" \
  "async-error-handling,failure-mode-analysis,tdd-workflow,repo-conventions,design-review"

# ============================ FINAL REPORT ==================================
echo
echo "============================================================"
echo "Simulation summary: $PASS PASS / $FAIL FAIL ($WEAK weak single-keyword matches; cap $MAX_WEAK)"
echo "============================================================"
if [ "$WEAK" -gt "$MAX_WEAK" ]; then
  echo "RATCHET: $WEAK weak (single-keyword) matches exceed the committed cap of $MAX_WEAK."
  echo "A case now routes on a single, possibly coincidental keyword. Sharpen the skill"
  echo "description (add the load-bearing term the prompt uses) or the case prompt — or lower"
  echo "MAX_WEAK if you just fixed one. Weak cases:$WEAK_LIST"
  FAIL=$((FAIL+1))
fi
if [ $FAIL -gt 0 ]; then
  echo "Failed cases:$FAILED"
  echo
  echo "Drift signal — either:"
  echo "  (a) a skill description was weakened (removed a load-bearing keyword), OR"
  echo "  (b) the test case is stale (the prompt's expected skill list no longer reflects intent)"
  echo
  echo "Fix the side that's actually wrong. Don't just rubber-stamp."
  exit 1
fi
exit 0
