# Skill Catalog

<!-- GENERATED FILE — do not edit by hand. Source of truth: each skill's frontmatter
     (harness: tier/family/gist). Regenerate: npm run catalog. CI fails if stale. -->

55 skills in 6 families. The directories are **flat by requirement** — agent runtimes
(Claude Code, Codex, Cursor) discover skills as `skills/<name>/SKILL.md`, so grouping
lives here, not in the filesystem. Depth lives in each skill's `topics/` / `patterns/` /
`rules/` files, read on demand. Tier routing rules (what loads when) are in
`instructions.md` § P3.0 and § Skill Pointers; this page is the human-facing map.

```mermaid
mindmap
  root((skills))
    🧭 Process & discipline
      bug-investigation
      cross-repo-workspace
      decision-rules
      design-review
      documentation-and-adrs
      failure-mode-analysis
      git-workflow
      meta-skill-hygiene
      openapi-contracts
      plan-mode
      pushback-templates
      quality-gates
      recipe-build
      recipe-design
      recipe-plan
      recipe-review
      recipe-task
      repo-conventions
      rlm-explore
      spec-workflow
      tdd-workflow
    🔡 Language & code quality
      async-error-handling
      code-simplifier
      cyclomatic-complexity
      js-performance-patterns
      typescript-advanced-types
    ⚛️ React core
      react-2026
      react-data-fetching
      react-design-patterns
      react-forms
      react-patterns
      react-performance
      react-routing
      react-state-management
      react-testing
    🎨 Frontend platform & quality
      accessibility
      ai-ui-patterns
      bundle-size
      frontend-security
      playwright-best-practices
      shadcn
      tailwind-v4-shadcn
      vite
      vitest
    🏗️ Backend
      async-python-patterns
      fastapi-best-practices
      fastapi-clean-architecture
      fastapi-patterns
      fastapi-security
      fastapi-testing
      pydantic-v2-patterns
      python-best-practices
      python-design-patterns
    🗄️ Data & persistence
      database-transactions
      db-write-protocol
```

## 🧭 Process & discipline — apply on any tier (21)

| Skill | What it gives you |
|---|---|
| [bug-investigation](./bug-investigation/SKILL.md) | Ranked falsifiable hypotheses before any fix |
| [cross-repo-workspace](./cross-repo-workspace/SKILL.md) | Lens-switching when one session spans two or more repos |
| [decision-rules](./decision-rules/SKILL.md) | Defaults under ambiguity; the canonical skill-vs-repo conflict table |
| [design-review](./design-review/SKILL.md) | SOLID/DRY/KISS pass + the verification line, before declaring done |
| [documentation-and-adrs](./documentation-and-adrs/SKILL.md) | ADR format + the layered-router documentation principle |
| [failure-mode-analysis](./failure-mode-analysis/SKILL.md) | Edge cases enumerated BEFORE the failing test |
| [git-workflow](./git-workflow/SKILL.md) | Branch/commit/PR mutations done safely |
| [meta-skill-hygiene](./meta-skill-hygiene/SKILL.md) | Auditing this skill library itself (overlap, bloat, size ceilings) |
| [openapi-contracts](./openapi-contracts/SKILL.md) | FastAPI OpenAPI schema as the React contract; generated TypeScript client drift gates |
| [plan-mode](./plan-mode/SKILL.md) | Plans for 3+ step / multi-file / architectural work |
| [pushback-templates](./pushback-templates/SKILL.md) | How to disagree: observation, tradeoff, question — one round |
| [quality-gates](./quality-gates/SKILL.md) | CI, pre-commit & permission-gate templates (deterministic enforcement) |
| [recipe-build](./recipe-build/SKILL.md) | Build recipe: execute an approved plan task by task with TDD, quality checks, and reviewer gates. |
| [recipe-design](./recipe-design/SKILL.md) | Design recipe: requirements, codebase facts, SPEC/design docs, document review, and architecture readiness. |
| [recipe-plan](./recipe-plan/SKILL.md) | Planning recipe: turn approved docs into executable tasks with tests, risks, and verification commands. |
| [recipe-review](./recipe-review/SKILL.md) | Review recipe: reconcile code, docs, tests, security, quality gates, and acceptance criteria. |
| [recipe-task](./recipe-task/SKILL.md) | Small/standard task recipe: path selection, required skills, TDD or waiver, verification, and review. |
| [repo-conventions](./repo-conventions/SKILL.md) | YOUR repo's binding facts (fill-in skeleton, both tiers + seam) |
| [rlm-explore](./rlm-explore/SKILL.md) | Slice-based digestion of big or unfamiliar context |
| [spec-workflow](./spec-workflow/SKILL.md) | SPEC before code on behavioral changes; reconcile after |
| [tdd-workflow](./tdd-workflow/SKILL.md) | Failing test first, the waiver phrases, the test-quality rubric |

## 🔡 Language & code quality — any tier (5)

| Skill | What it gives you |
|---|---|
| [async-error-handling](./async-error-handling/SKILL.md) | Promise composition, AbortSignal, where to catch |
| [code-simplifier](./code-simplifier/SKILL.md) | Surgical cleanup of recently-modified code, behavior preserved |
| [cyclomatic-complexity](./cyclomatic-complexity/SKILL.md) | Flattening branch-heavy, nested functions |
| [js-performance-patterns](./js-performance-patterns/SKILL.md) | Hot-path runtime performance — 12 patterns (index + topics) |
| [typescript-advanced-types](./typescript-advanced-types/SKILL.md) | Generics, conditional/mapped/template-literal types (index + topics) |

## ⚛️ React core — `apps/web` changes (9)

| Skill | What it gives you |
|---|---|
| [react-2026](./react-2026/SKILL.md) | The modern stack tour + composition idioms (index + topics) |
| [react-data-fetching](./react-data-fetching/SKILL.md) | Server data: caching, invalidation, optimistic updates — 11 patterns (index + topics) |
| [react-design-patterns](./react-design-patterns/SKILL.md) | Nine classic patterns — hooks, HOC, render props, provider, compound, presentational/container, module, mixin, proxy (index + patterns) |
| [react-forms](./react-forms/SKILL.md) | RHF + Zod, schema-first, accessible field errors |
| [react-patterns](./react-patterns/SKILL.md) | Components, hooks, lifting state, refs, lists |
| [react-performance](./react-performance/SKILL.md) | Measurement discipline + the 25-pattern deep render-mechanics catalog (index + topics) |
| [react-routing](./react-routing/SKILL.md) | Routes, guards, expired-session flow, code-split per route |
| [react-state-management](./react-state-management/SKILL.md) | WHERE state lives — the four-layer model; server data never in `useState` |
| [react-testing](./react-testing/SKILL.md) | Vitest + Testing Library + Playwright layer choice |

## 🎨 Frontend platform & quality (9)

| Skill | What it gives you |
|---|---|
| [accessibility](./accessibility/SKILL.md) | Semantic HTML, ARIA, focus & keyboard rules for UI changes |
| [ai-ui-patterns](./ai-ui-patterns/SKILL.md) | Streaming/chat AI interface patterns |
| [bundle-size](./bundle-size/SKILL.md) | Bundle audits, tree-shaking, lazy routes, dependency cost |
| [frontend-security](./frontend-security/SKILL.md) | XSS sinks, `VITE_*` leakage, token storage |
| [playwright-best-practices](./playwright-best-practices/SKILL.md) | E2E patterns by framework & surface (index + topic dirs) |
| [shadcn](./shadcn/SKILL.md) | Day-to-day shadcn component work |
| [tailwind-v4-shadcn](./tailwind-v4-shadcn/SKILL.md) | Tailwind v4 + shadcn setup, theming, dark mode (index + topics) |
| [vite](./vite/SKILL.md) | Vite config & build optimization |
| [vitest](./vitest/SKILL.md) | Vitest config and test API |

## 🏗️ Backend — FastAPI & Python — `apps/api` changes (9)

| Skill | What it gives you |
|---|---|
| [async-python-patterns](./async-python-patterns/SKILL.md) | asyncio: TaskGroup/gather, timeout, Semaphore, cancellation, executors |
| [fastapi-best-practices](./fastapi-best-practices/SKILL.md) | FastAPI production rules: routers, dependencies, schemas, errors, lifespan, OpenAPI |
| [fastapi-clean-architecture](./fastapi-clean-architecture/SKILL.md) | Layered FastAPI modules with route/service/domain/infrastructure dependency rule |
| [fastapi-patterns](./fastapi-patterns/SKILL.md) | Depends/Security, APIRouter, lifespan, middleware, overrides, background tasks |
| [fastapi-security](./fastapi-security/SKILL.md) | FastAPI auth dependencies, RBAC, CORS/CSRF, injection, secrets, rate limiting, security schemes |
| [fastapi-testing](./fastapi-testing/SKILL.md) | pytest, TestClient/httpx, dependency overrides, DB isolation, OpenAPI checks |
| [pydantic-v2-patterns](./pydantic-v2-patterns/SKILL.md) | Pydantic v2 schema design, validation, serialization, settings, DTO evolution |
| [python-best-practices](./python-best-practices/SKILL.md) | Python typing, tooling, async boundaries, pytest, logging, maintainable backend style |
| [python-design-patterns](./python-design-patterns/SKILL.md) | SOLID/DRY/KISS/SOC, DI, Protocol ports, Pythonic patterns, value objects |

## 🗄️ Data & persistence (2)

| Skill | What it gives you |
|---|---|
| [database-transactions](./database-transactions/SKILL.md) | Multi-statement writes made atomic |
| [db-write-protocol](./db-write-protocol/SKILL.md) | Approval + impact protocol for ANY database write |

## 🧭 Ownership — every skill maps to the agent(s) that apply it

Derived from each skill's `harness.owners`. `main` is the implementer (instructions.md);
the rest are the review/verify subagents that apply the skill at their phase. `catalog:check`
fails if a skill has no owner or a declared owner stops referencing it.

| Skill | Applied by (owners) |
|---|---|
| [accessibility](./accessibility/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, acceptance-verifier |
| [ai-ui-patterns](./ai-ui-patterns/SKILL.md) | main, architect-reviewer, code-reviewer |
| [async-error-handling](./async-error-handling/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [async-python-patterns](./async-python-patterns/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator |
| [bug-investigation](./bug-investigation/SKILL.md) | main |
| [bundle-size](./bundle-size/SKILL.md) | main, architect-reviewer, code-reviewer, security-reviewer |
| [code-simplifier](./code-simplifier/SKILL.md) | main, code-reviewer |
| [cross-repo-workspace](./cross-repo-workspace/SKILL.md) | main |
| [cyclomatic-complexity](./cyclomatic-complexity/SKILL.md) | main, code-reviewer |
| [database-transactions](./database-transactions/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer, acceptance-verifier |
| [db-write-protocol](./db-write-protocol/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [decision-rules](./decision-rules/SKILL.md) | main, spec-steward, architect-reviewer |
| [design-review](./design-review/SKILL.md) | main, spec-steward, architect-reviewer, code-reviewer, qa-validator, security-reviewer, acceptance-verifier |
| [documentation-and-adrs](./documentation-and-adrs/SKILL.md) | main, spec-steward, architect-reviewer, code-reviewer |
| [failure-mode-analysis](./failure-mode-analysis/SKILL.md) | main, architect-reviewer, qa-validator |
| [fastapi-best-practices](./fastapi-best-practices/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer, acceptance-verifier |
| [fastapi-clean-architecture](./fastapi-clean-architecture/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [fastapi-patterns](./fastapi-patterns/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [fastapi-security](./fastapi-security/SKILL.md) | main, architect-reviewer, security-reviewer |
| [fastapi-testing](./fastapi-testing/SKILL.md) | main, qa-validator |
| [frontend-security](./frontend-security/SKILL.md) | main, architect-reviewer, code-reviewer, security-reviewer |
| [git-workflow](./git-workflow/SKILL.md) | main |
| [js-performance-patterns](./js-performance-patterns/SKILL.md) | main, code-reviewer |
| [meta-skill-hygiene](./meta-skill-hygiene/SKILL.md) | architect-reviewer, code-reviewer, security-reviewer, lessons-curator |
| [openapi-contracts](./openapi-contracts/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [plan-mode](./plan-mode/SKILL.md) | main, architect-reviewer, code-reviewer |
| [playwright-best-practices](./playwright-best-practices/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, acceptance-verifier |
| [pushback-templates](./pushback-templates/SKILL.md) | main |
| [pydantic-v2-patterns](./pydantic-v2-patterns/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [python-best-practices](./python-best-practices/SKILL.md) | main, architect-reviewer, code-reviewer, security-reviewer |
| [python-design-patterns](./python-design-patterns/SKILL.md) | main, architect-reviewer, code-reviewer |
| [quality-gates](./quality-gates/SKILL.md) | main, architect-reviewer |
| [react-2026](./react-2026/SKILL.md) | main, architect-reviewer |
| [react-data-fetching](./react-data-fetching/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator |
| [react-design-patterns](./react-design-patterns/SKILL.md) | main, architect-reviewer, code-reviewer |
| [react-forms](./react-forms/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [react-patterns](./react-patterns/SKILL.md) | main, architect-reviewer, code-reviewer |
| [react-performance](./react-performance/SKILL.md) | main, architect-reviewer, code-reviewer |
| [react-routing](./react-routing/SKILL.md) | main, architect-reviewer, code-reviewer, security-reviewer |
| [react-state-management](./react-state-management/SKILL.md) | main, architect-reviewer, code-reviewer |
| [react-testing](./react-testing/SKILL.md) | main, qa-validator, acceptance-verifier |
| [recipe-build](./recipe-build/SKILL.md) | main |
| [recipe-design](./recipe-design/SKILL.md) | main |
| [recipe-plan](./recipe-plan/SKILL.md) | main |
| [recipe-review](./recipe-review/SKILL.md) | main |
| [recipe-task](./recipe-task/SKILL.md) | main |
| [repo-conventions](./repo-conventions/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer, acceptance-verifier |
| [rlm-explore](./rlm-explore/SKILL.md) | main, architect-reviewer, code-reviewer, qa-validator, security-reviewer |
| [shadcn](./shadcn/SKILL.md) | main, code-reviewer |
| [spec-workflow](./spec-workflow/SKILL.md) | main, spec-steward |
| [tailwind-v4-shadcn](./tailwind-v4-shadcn/SKILL.md) | main, code-reviewer |
| [tdd-workflow](./tdd-workflow/SKILL.md) | main, architect-reviewer, qa-validator, acceptance-verifier |
| [typescript-advanced-types](./typescript-advanced-types/SKILL.md) | main, code-reviewer |
| [vite](./vite/SKILL.md) | main, architect-reviewer |
| [vitest](./vitest/SKILL.md) | main, qa-validator |

---

Adding a skill? Keep the directory flat, set `harness: tier/family/gist` in its
frontmatter, and run `npm run catalog` (the acceptance suite and `catalog:check` fail
if this file is stale). Respect the size ceiling (`meta-skill-hygiene` § Bloat: warn
>400 lines, fail >800 — split into index + topics).
