# Workflow and Agent Recommendations

Deep-dive comparison of `llm-harness-fastapi-react` against
[`shinpr/claude-code-workflows`](https://github.com/shinpr/claude-code-workflows),
with recommendations for improving workflow clarity, separation of concerns,
planning/documentation rigor, and code quality controls.

This document is the FastAPI + React sibling of the analysis already applied to
`llm-harness-fullstack` (NestJS + React). The recommendations are the same in
shape; the adaptations that matter are concentrated in the cross-tier contract
seam (generated OpenAPI client, not a shared TypeScript package), the Python
backend toolchain, and a small number of repo-specific harness gates.

Source snapshot for the comparison:

- Local repo: `@tierone/llm-harness-fastapi-react`
- Upstream reference: `shinpr/claude-code-workflows` `v0.21.1`
  (latest release visible on GitHub as of 2026-06-19)
- Local measured state, current before implementation: catalog check passes
  with `50` skills in `6` families, `7` review subagents, routing/adherence
  baselines committed in `eval/baseline.json` (`37` routing cases, `32`
  adherence cases, all green on `claude-haiku-4-5-20251001`)
- Local extra differentiator not present in the fullstack sibling: a
  deterministic **fixture-quality** eval (`scripts/fixture-quality.mjs`,
  `eval/fixture-task.mjs`) that scores generated code against FastAPI
  clean-architecture invariants and the generated-OpenAPI-client seam
- Reference measured shape: `30` skills and `25` fullstack agents in the cloned
  source tree, including recipe entry points and lifecycle-stage specialists

## Implementation Status

This recommendation has an implementation plan:
`docs/superpowers/plans/2026-06-19-workflow-recipes-plan.md`.
Progress should be tracked task by task against that plan. The plan ports the
nine `recipe-*` skills and five planning/quality agents already shipped in
`llm-harness-fullstack`, adapted for the FastAPI/Python backend and the
generated-OpenAPI-client contract seam.

## Executive Recommendation

Do not replace `llm-harness-fastapi-react` with `claude-code-workflows`. The
local harness already has stronger distribution, multi-tool portability, safety
gates, deterministic acceptance checks, live-model routing/adherence evals,
mutation testing, fixture-quality scoring, and update semantics. Those are the
hard parts for long-term reliability.

The reference project is stronger at explicit end-to-end workflow orchestration:
recipes, requirement analysis, PRD/design/work-plan staging, codebase analysis,
task decomposition, executor/fixer loops, design sync, and reverse-engineering
flows. The best path is to add a small recipe/workflow layer to this harness,
then measure it with the existing eval machinery.

Recommended direction:

1. Add workflow recipes as first-class skills with a `recipe-*` prefix.
2. Add a few missing planning/documentation agents, not 25 agents.
3. Keep the main agent as the only normal code writer unless a runtime supports
   bounded implementation subagents with enforceable write scopes.
4. Preserve this repo's core quality model: explicit gates, same skill body used
   as guide and rubric, deterministic tests, live evals, mutation tests,
   fixture-quality scoring, and committed baselines.

The FastAPI/React seam makes a cross-tier sync gate *more* valuable here than in
the fullstack TypeScript sibling: there is no shared type package across the
Python/TypeScript boundary, so the generated OpenAPI client is the only
mechanical contract. Generated types catch shape drift within the seam; they do
not catch semantic drift in behavior, errors, auth, or migration assumptions.

## Simulated Target-State Comparison

This table models the expected state if all recommendations in this document are
implemented and then validated with this repo's deterministic tests, live evals,
mutation tests, and fixture-quality scorer. It is a planning simulation, not a
claim that the target metrics already exist.

| Capability | Current `llm-harness-fastapi-react` | `claude-code-workflows` reference | Simulated state after all recommendations | Expected quality impact |
|---|---|---|---|---|
| Workflow clarity | Medium-high: fast/full path and workflow chains exist, but entry points are embedded in `instructions.md`. | High: recipe skills make build, review, diagnose, reverse-engineer, and fullstack flows explicit. | Very high: `recipe-task`, `recipe-design`, `recipe-plan`, `recipe-build`, `recipe-review`, `recipe-fullstack-implement`, `recipe-diagnose`, and `recipe-reverse-engineer` become first-class measured skills. | Better readability of the agent process; easier onboarding and easier eval coverage. |
| Separation of concerns | High for reviewers: main agent writes, subagents mostly verify; spec-steward is the only scoped writer. | High for lifecycle stages: many specialized agents handle requirements, design, execution, quality, sync, and review. | Very high with lower risk: keep strict writer/sensor split, add planning agents and design-sync, delay broad implementation subagents. | Better maintainability and lower blast radius than copying the full 25-agent model. |
| Requirements analysis | Medium: handled by main agent plus spec-steward clarification. | High: dedicated requirement-analyzer determines scale, affected layers, risks, and questions. | High: add read-only `requirements-analyzer` with structured output used by recipes and reviewers. | Fewer ambiguous starts; better scope control and resilience against requirement drift. |
| Pre-design repo understanding | Medium-high: `rlm-explore`, repo-conventions, and architect-reviewer help, but no dedicated fact artifact. | High: codebase-analyzer emits existing elements, call chains, data model, constraints, tests, and quality mechanisms. | High: add `codebase-analyzer` as objective pre-design fact source (Pydantic models, FastAPI routers, React hooks, Alembic migrations). | More maintainable designs because plans must account for actual code and tests. |
| Documentation ladder | Medium-high: SPEC-first and ADR guidance are strong, but artifact levels are not as explicit. | High: PRD, UI spec, design docs, work plans, task files. | Very high: scale ladder defines fast, standard, full, and reverse-engineering artifact requirements. | Better planning quality without forcing PRDs on small changes. |
| Fullstack consistency | Medium-high: generated OpenAPI client enforces shape, but no behavioral doc sync across the Python/TS boundary. | High: separate backend/frontend docs plus design-sync. | Very high: keep the generated-client seam and add design-sync for behavioral consistency. | Better scalability across cross-tier features; fewer API/UI semantic mismatches the generated client cannot detect. |
| Quality loop | High: TDD, design review, QA/security/acceptance reviewers, executed verification contract, fixture-quality invariants. | High: task-executor -> quality-fixer loop, code-verifier, security-reviewer, test skeleton generation. | Very high: add read-only `quality-runner` (pytest/ruff/mypy + vitest), stub detection, and recipe compliance checks while preserving acceptance-verifier and fixture scoring. | Stronger resilience and fewer false "done" claims. |
| Measurement | Very high: catalog check, harness acceptance tests, routing eval, adherence eval, mutation test, context decay, fixture-quality scorer. | Medium from inspected source: strong workflow contracts, but no equivalent committed live-model eval suite found. | Very high-plus: add workflow routing/adherence cases and mutation seeds for recipes, design-sync, approval stops, and quality-runner blocks. | Better long-term maintainability because workflow behavior is regression-tested. |
| Multi-tool portability | Very high: `.ruler` payload fans out to Claude, Codex, Copilot, Cursor, and Windsurf. | Medium: optimized around Claude Code plugin workflows. | Very high: recipe skills stay inside `.ruler`; runtime-specific writer delegation remains optional. | Safer scaling across teams that use different agent frontends. |
| Update resilience | Very high: npm package plus 3-way merge-aware `init`/`update`. | Medium-high: plugin marketplace versioning, but different customization/update story. | Very high: unchanged; new recipes and agents ride the existing update machinery. | Lower operational risk when teams customize local rules. |
| Security and control posture | Very high: P0 approval gates, no main writes, DB/deploy/dependency gates, Alembic migration gate, no AI attribution, eval-backed adherence. | High: stop points and security reviewer, less explicit local evidence for multi-tool gate adherence. | Very high: P0 remains dominant over recipe autonomy; new evals verify approval stops and blocked quality states. | Stronger governance and audit readiness. |
| Overall quality score, simulated | 8.4/10: strong harness foundation, weaker explicit workflow layer. | 8.2/10: strong orchestration, weaker portability/measurement for this repo's goals. | 9.2/10 if evals stay green: measured workflow harness with clear recipes, stronger planning, and preserved safety model. | Best balance of readability, maintainability, scalability, and resilience. |

The target score is intentionally conditional. It should be treated as achieved
only after the implementation phases add eval cases, update baselines, keep
mutation kill rate at its committed value, and keep the fixture-quality scorer
green.

## High-Level Comparison

| Dimension | `llm-harness-fastapi-react` | `claude-code-workflows` | Recommendation |
|---|---|---|---|
| Distribution | Versioned `.ruler` payload, npm CLI, 3-way merge update, ruler fan-out to Claude/Codex/Copilot/Cursor/Windsurf | Claude Code plugin marketplace packages | Keep local model. It is more portable and safer for teams using multiple agent tools. |
| Workflow entry points | Operating profile plus workflow chains inside `instructions.md` | Explicit recipe skills such as `recipe-fullstack-implement`, `recipe-diagnose`, `recipe-reverse-engineer` | Add recipe skills. They make flows discoverable and auditable without bloating the always-loaded operating profile. |
| Agent topology | 7 review/sensor agents: architect, spec, code, QA, security, acceptance, lessons | 25 fullstack agents spanning requirements, design, analysis, planning, execution, quality, sync, diagnosis | Add only missing lifecycle roles. Avoid agent explosion unless evals prove routing and outcomes improve. |
| Separation of concerns | Strong reviewer SOC; subagents are mostly read-only sensors, one spec writer | Strong stage SOC; orchestrator delegates nearly all work to specialists | Borrow stage SOC for planning. Preserve strict writer/sensor separation for implementation. |
| Documentation model | SPEC-first for behavioral changes, ADR skill, docs for architecture/evals/adoption | PRD, UI spec, backend/frontend design docs, work plans, task files, external-resource context | Add scale-based documentation tiers and design-sync. Do not require PRDs for small work. |
| Fullstack seam | FastAPI + Pydantic -> OpenAPI schema -> generated TypeScript client -> React (no shared TS package) | Separate backend/frontend design docs plus design-sync | Add a cross-layer sync gate. With no shared type system across the Python/TS boundary, semantic drift is more likely than in the TS-on-both-ends sibling. |
| Quality | TDD, design-review marker, review subagents, acceptance verifier, deterministic harness tests, live-model evals, fixture-quality scorer | Executor -> quality-fixer loop, code-verifier, security-reviewer, integration/E2E skeleton generation | Add a quality-runner role and test-skeleton guidance; keep local eval gates and the fixture scorer as the source of truth. |
| Measurement | Strong: routing eval, adherence eval, mutation test, context decay, catalog check, acceptance shell tests, fixture-quality eval | No equivalent committed live-model eval suite in the inspected tree | Keep measurement as a non-negotiable differentiator. Every workflow addition needs eval cases. |

## What This Harness Already Does Better

### 1. It Is a Measured Harness, Not Just a Prompt Pack

The local repo has behavioral instrumentation:

- `eval/routing-eval.mjs` checks whether models load the right skills.
- `eval/adherence-eval.mjs` checks literal safety and workflow gates.
- `scripts/mutation-test.mjs` seeds regressions to prove the evals fail when
  important gates are weakened.
- `scripts/context-decay.mjs` tracks instruction adherence as context grows.
- `scripts/fixture-quality.mjs` deterministically scores generated code against
  FastAPI clean-architecture invariants (domain purity, no SQL in routers,
  repository commit boundaries, Pydantic boundary models, and the
  generated-OpenAPI-client rule that React must import generated types, not
  redeclare contract shapes).
- `npm run catalog:check` proves skill catalog drift is detected.

This matters because workflow systems decay quietly. A beautiful recipe is not
enough if models stop following it after a rename, model change, or context
growth. The local baseline model is materially stronger for resilience.

### 2. It Has Stronger Safety and Governance Defaults

`template/.ruler/instructions.md` has concrete P0 gates for git writes,
deploy/publish, dependency changes (npm/pnpm/yarn and pip/uv/poetry), DB writes
and Alembic migrations, sensitive data, branch safety, and AI attribution. It
also has an output contract that requires executed verification before claiming
completion, including generated-client freshness proof for OpenAPI seam changes.

The reference project has workflow stop points and batch approval, but the local
harness has more explicit safety language and stronger eval coverage around
adherence.

### 3. It Avoids Over-Delegating Implementation

The local architecture keeps the main agent as the normal code writer and uses
subagents as independent reviewers. That is safer across heterogeneous runtimes
because write scopes are not equally enforceable everywhere.

The reference project delegates implementation to task executors and quality
fixers. That can work in Claude Code, but it is harder to port through `.ruler`
to Codex, Copilot, Cursor, and other agent frontends without losing tool-scope
guarantees.

## What `claude-code-workflows` Does Better

### 1. Workflow Recipes Are Clearer Than Embedded Workflow Chains

The reference project makes the workflow itself a skill. The local harness puts
every chain (`Full-stack feature`, `Backend feature`, `Frontend feature`,
`Bug fix`, `Refactor`, `Performance work`, `Async / external integration`) into
the always-loaded `instructions.md`. Recipes make it clear whether the agent is
planning, building, reviewing, diagnosing, or reverse-engineering, and they keep
the operating profile inside its hard budget (≤350 lines, ≤3,800 words).

### 2. Scale-Based Planning Is More Explicit

The reference `requirement-analyzer` classifies work by affected file count:

- small: 1-2 files
- medium: 3-5 files
- large: 6+ files

It then chooses the minimum documentation path. The local harness has fast/full
paths (P3.6), but it can be clearer about planning artifacts and scale
thresholds.

### 3. Pre-Design Codebase Analysis Is a Missing Local Role

The reference `codebase-analyzer` produces objective facts before design. For
this repo those facts are FastAPI routers, Pydantic models, React hooks, data
access and Alembic migrations, existing tests, and quality mechanisms
(`pytest`, `ruff`, `mypy`/`pyright`, `vitest`, generated-client drift check).
This reduces hallucinated designs and improves maintainability because the
design doc must account for real code, not just the request.

### 4. Cross-Document Sync Is a Useful Fullstack Gate

The reference fullstack flow creates separate backend and frontend design docs,
then runs `design-sync` to verify cross-layer consistency. This repo's seam is
the generated OpenAPI client, which enforces *shape* but not *meaning*. A
behavioral cross-layer sync step should still verify:

- endpoint and Pydantic/operation-ID names
- error states and status codes
- authorization assumptions (FastAPI dependencies, RBAC, tenant scoping)
- loading/empty/error UI states
- Alembic migration and data-shape implications
- acceptance criteria ownership across API, UI, and E2E

Generated types catch shape drift. They do not catch semantic drift, and they
exist only after the contract is correct.

### 5. Task Decomposition Is More Operational

The reference project turns a work plan into task files and routes them by
filename pattern. The local harness requires plans but does not currently define
a concrete task-file lifecycle. A `recipe-plan` that maps surfaces to tiers
(`frontend`, `backend`, `openapi-contract`, `e2e`, `docs`, `harness`, `evals`)
makes vertical slicing concrete.

## Primary Gaps in `llm-harness-fastapi-react`

### Gap 1: Workflow Entry Points Are Not First-Class

Workflow chains exist in `instructions.md`, but there is no dedicated,
discoverable recipe layer. This makes it harder for users to know which mode to
ask for, harder to eval a complete workflow path, and it pushes workflow policy
into the budgeted operating profile.

Recommendation: add recipe skills that encode task-level orchestration while
keeping `instructions.md` focused on safety, routing, and invariant gates.

### Gap 2: Planning Artifacts Need a Scale Ladder

Fast/full path and SPEC-first behavior are strong, but there is not a clear
artifact ladder like PRD -> design -> plan -> task.

Recommendation: introduce a scale-based documentation matrix:

| Scale | Criteria | Required artifacts |
|---|---|---|
| Fast | <=2 files, single tier, no risk surface, no contract/schema change | one-paragraph SPEC delta, TDD, design review |
| Standard | 3-5 files or cross-module but not architecture-level | SPEC + design note + work plan |
| Full | 6+ files, cross-tier feature, OpenAPI/schema/auth/data-flow change | PRD or requirements brief + backend/frontend SPEC or design docs + design-sync + work plan |
| Legacy/reverse | undocumented existing behavior | generated PRD/SPEC/design docs from code, verified by codebase analyzer and document reviewer |

### Gap 3: No Dedicated Requirements Analyzer

The main agent and spec-steward share clarification work, so scope and ambiguity
analysis is mixed into implementation flow.

Recommendation: add `requirements-analyzer` as a read-only planning agent. It
returns structured JSON with purpose, scale, affected surfaces, risk surfaces,
questions, and required artifacts.

### Gap 4: No Dedicated Design Sync Agent

architect-reviewer and spec-steward catch many issues, but there is no named
gate for consistency between layer documents — and the generated OpenAPI client
silently hides semantic disagreement behind a compiling type.

Recommendation: add `design-sync` as a read-only subagent for cross-tier
changes. It runs after SPEC/design docs exist and before implementation, then
again post-change when behavior changed. Its forbidden-behavior list must say
"do not treat a semantic mismatch as resolved because the OpenAPI client
generates or `mypy` passes" — the FastAPI analog of the fullstack sibling's
"because TypeScript compiles" clause.

### Gap 5: Quality-Runner Is a Useful Concept, But Needs Local Constraints

`qa-validator`, `acceptance-verifier`, the fixture-quality scorer, and
deterministic tests verify quality, but there is no workflow role that owns
"run the relevant checks, fix mechanical quality failures, and detect stubs."

Recommendation: add a `quality-runner` role with a tightly bounded mandate. For
this repo it discovers both toolchains — backend `pytest`/`ruff`/`mypy` from
`pyproject.toml`, frontend `vitest`/`tsc`/`eslint`/`vite build` — runs the
smallest covering set, and detects stubs in both languages: Python
(`@pytest.mark.skip`, `@pytest.mark.xfail`, `pytest.skip(`, `NotImplementedError`,
bare `...`, `return None` placeholders, `TODO`/`FIXME`) and TypeScript
(`describe.skip`, `it.skip`, `it.only`, `return null`). Keep it read-only first;
do not grant write scope until tool-scope enforcement is verified across
runtimes.

## Proposed Target Architecture

### Keep the Three Planes

Preserve the current architecture:

- Payload: `.ruler` instructions, skills, agents, tests
- Distribution: CLI `init`/`update` with 3-way merge
- Measurement: deterministic tests, live evals, mutation/decay probes,
  fixture-quality scorer

Add a fourth conceptual layer inside the payload:

- Workflow recipes: entrypoint skills that orchestrate existing skills and
  subagents for common jobs

The recipe layer should not replace the operating profile. It should call into
it.

### Recommended Workflow Recipes

Add these as skills under `template/.ruler/skills/`:

| Recipe | Purpose | Notes |
|---|---|---|
| `recipe-task` | Small bug/fix/refactor path | Uses fast/standard matrix; no PRD. |
| `recipe-design` | Create or update design docs before implementation | Invokes requirements analyzer, codebase facts, architect review. |
| `recipe-plan` | Convert approved SPEC/design into an implementation plan | Creates task list and verification plan; final validation runs `pytest`/`npm test`/harness/catalog. |
| `recipe-build` | Execute from an existing plan | Main agent remains writer; quality runner/review agents verify. |
| `recipe-fullstack-implement` | End-to-end fullstack feature workflow | Requirements -> backend/frontend/OpenAPI/e2e docs/SPECs -> design-sync -> plan -> build. |
| `recipe-review` | Post-implementation consistency review | Runs code/spec/design/security/acceptance checks. |
| `recipe-diagnose` | Root-cause workflow for bugs | Formalizes investigator/verifier/solver loop; reuses `bug-investigation`. |
| `recipe-reverse-engineer` | Generate docs from existing code | Useful for legacy onboarding and making repos agent-friendly. |
| `recipe-add-integration-tests` | Add high-value integration/E2E tests | Selects minimal proving layer; verifies non-vacuity. |

Each recipe skill in this repo MUST carry `harness.owners` (the fullstack
sibling omits it). Recipes are process docs for the main agent, so
`owners: [main]` is correct, and the slug MUST be referenced from
`instructions.md` or the catalog ownership lint
(`scripts/build-skill-catalog.mjs`) will fail.

### Recommended New Agents

Add only five agents initially:

| Agent | Phase | Write scope | Why |
|---|---|---|---|
| `requirements-analyzer` | PRE | read-only | Classifies scale, risk, affected layers, artifact requirements, and open questions. |
| `codebase-analyzer` | PRE | read-only | Produces objective repo facts (routers, Pydantic models, hooks, migrations) before design; reduces hallucinated architecture. |
| `design-sync` | PRE + POST | read-only | Verifies backend/frontend/OpenAPI consistency across cross-tier changes. |
| `document-reviewer` | PRE | read-only | Reviews PRD/SPEC/design/work-plan quality, not code. Complements `spec-steward`. |
| `quality-runner` | POST | read-only first; optional bounded write later | Runs quality checks (pytest/ruff/mypy + vitest), reports failures, detects stubs/placeholders, distinguishes mechanical from design failures. |

All five MUST be read-only sensors. Acceptance test T10 already enforces that
`spec-steward` is the only agent with `Edit`/`Write`; the new agents extend that
guard.

Do not add implementation agents in the first iteration. Reconsider after the
recipe and quality-runner flows are measured.

## Separation of Concerns Model

The goal is not "more agents"; it is fewer ambiguous responsibilities.

### Main Agent

Owns user communication, path/recipe selection, P0 approval gates, writing app
code and tests, aggregating subagent findings, and the final verification report.

Does not own independent review verdicts, spec truth when `spec-steward` is in
scope, the cross-document sync verdict, or quality evidence after a
quality-runner or acceptance-verifier reports BLOCK.

### Skills

Skills remain durable knowledge and procedures: stack conventions, TDD, design
review, testing principles, security checklists, documentation standards, and
recipe procedures. Skills should not pretend to be agents. If a thing needs a
fresh context, structured verdict, or independent evidence, it should be an
agent.

### Subagents

Each subagent owns one narrow concern, with a trigger and anti-trigger, required
reading, input contract, output schema, verdict semantics, allowed tools,
forbidden behaviors, and escalation conditions.

## Recommended Fullstack Workflow

### Fast Path

Use for <=2 files, single tier, no high-risk surface, no contract/schema change,
no new dependency.

1. Main agent declares fast path (P3.6).
2. Load force-fire skills and touched-tier skills.
3. Add or update a minimal SPEC delta if behavior changes.
4. TDD: failing test -> implementation -> green.
5. Run relevant suite (`pytest` for `apps/api`, `vitest` for `apps/web`).
6. Design review self-check.
7. `qa-validator` only if observable behavior changes.
8. Final output with executed verification.

### Standard Path

Use for 3-5 files or cross-module changes without major architecture impact.

1. `requirements-analyzer`
2. `codebase-analyzer`
3. `spec-steward` PRE or `document-reviewer` on existing governing doc
4. `architect-reviewer` if 3+ files or risk surface
5. Main agent implementation with TDD
6. `quality-runner`
7. `code-reviewer` + `qa-validator` in parallel when triggered
8. `security-reviewer` if triggered
9. `spec-steward` POST
10. `acceptance-verifier` when user-facing/API behavior changed

### Full Cross-Tier Path

Use for large or cross-tier work.

1. `requirements-analyzer`
2. PRD or requirements brief if feature scope is broad
3. `codebase-analyzer` per tier
4. `spec-steward` PRE creates/updates layer docs, or design docs are created
   through `recipe-design`
5. `document-reviewer` reviews each doc
6. `design-sync` checks backend/frontend/OpenAPI consistency
7. `architect-reviewer` reviews the implementation plan
8. Main agent implements vertical slices with TDD; OpenAPI schema is the
   contract source and the generated client is regenerated when it changes
9. `quality-runner` after each slice or before final review
10. `code-reviewer`, `qa-validator`, `security-reviewer` as triggered
11. `spec-steward` POST reconciliation
12. `design-sync` POST if layer docs changed or cross-tier assumptions shifted
13. `acceptance-verifier` last

## Code Quality Measurement Model

The user-facing objective names readability, maintainability, scalability, and
resilience. Convert those into observable gates:

| Quality | Observable checks |
|---|---|
| Readability | file/function size, naming, no hidden side effects, test names describe behavior, comments explain why only |
| Maintainability | single responsibility, low coupling, no duplicated business rules, docs/specs updated, clear ownership boundaries, generated client imported not redeclared |
| Scalability | no unbounded data paths, pagination/backpressure where relevant, query shape reviewed, frontend state not duplicated, no avoidable hot render paths |
| Resilience | fail-fast validation, explicit error handling, async cancellation strategy, transaction boundaries, Alembic rollback/partial-failure tests, security review for trust boundaries |

Add these to the `design-review`, `qa-validator`, and future `quality-runner`
contracts as rubric rows. Avoid self-scored confidence as a completion signal;
use executed tests, reviewer verdicts, fixture-quality scores, and eval scores.

## Evaluation Additions Required

Every workflow addition should include eval coverage before it is considered
shippable.

### Routing Eval Cases (`eval/routing-cases.json`)

Add cases for:

- "Plan a medium feature before implementation" -> `recipe-design` or
  `recipe-plan`
- "Build from this approved work plan" -> `recipe-build`
- "Fullstack feature with FastAPI backend and React UI" ->
  `recipe-fullstack-implement`
- "Investigate this failing endpoint" -> `recipe-diagnose`
- "Generate docs from legacy code" -> `recipe-reverse-engineer`
- "Review whether implementation matches design docs" -> `recipe-review`

### Adherence Eval Cases (`eval/adherence-cases.json`)

Add cases (with `category` of `safety`, `ceremony`, or `contract`) for:

- requirements analyzer stop point
- design approval stop point
- batch implementation approval
- fast-path escalation to standard/full path
- design-sync conflict -> no implementation
- quality-runner blocked -> no "done" claim
- safety gate still overrides recipe autonomy

### Mutation Tests (`scripts/mutation-test.mjs`)

Seed regressions such as:

- remove design-sync from cross-tier recipe
- soften "must stop for approval" to "should"
- allow quality-runner failures to be ignored
- remove fast-path escalation text
- remove P0 override from recipe autonomy

Expected result: mutation kill rate stays at its committed value; documented
`expectSurvive` canaries remain the only survivors.

## Implementation Roadmap

### Phase 1: Low-Risk Workflow Layer

Add recipe skills only: `recipe-task`, `recipe-design`, `recipe-plan`,
`recipe-build`, `recipe-review`. Keep them as orchestration procedures that call
existing skills and agents. Do not add new writer agents yet.

Validation: `npm test`, `npm run test:harness`, `npm run catalog:check`, plus
routing/adherence eval additions for recipe selection and approval gates.

### Phase 2: Planning and Documentation Agents

Add `requirements-analyzer`, `codebase-analyzer`, `document-reviewer`,
`design-sync`. Update `architect-reviewer` required reading, `spec-steward`
coordination text, `docs/AGENTS-AND-SKILLS.md`, and `docs/ARCHITECTURE.md`.

Validation: deterministic tests for agent file presence and no write-scope
leaks; new routing/adherence cases; mutation tests for missing design-sync and
missing approval stop points.

### Phase 3: Quality Runner

Add `quality-runner` as a read-only/reporting subagent first. It discovers and
runs the relevant package checks for both tiers, detects stubs/placeholders/
skipped tests in Python and TypeScript, classifies failures, and returns a
structured verdict. Only after that works across runtimes should the project
consider a bounded write-capable `quality-fixer`.

### Phase 4: Fullstack and Reverse-Engineering Recipes

Add `recipe-fullstack-implement`, `recipe-diagnose`, `recipe-reverse-engineer`,
and `recipe-add-integration-tests`. These are higher ceremony and should ship
only after Phase 1-3 evals are stable.

## What Not to Copy

Do not copy the entire 25-agent topology. It would dilute this harness's
simplicity and increase routing/eval surface area.

Do not make per-task commits mandatory in the core harness. The local user and
repo preference requires explicit approval for git writes, and this harness
targets multiple agent runtimes. Per-task commit loops should be optional and
approval-gated.

Do not add broad write-capable implementation subagents until there is a
runtime-independent way to enforce write scope. The current sensor-heavy design
is safer and more portable.

Do not weaken existing eval gates — including the fixture-quality invariants — to
accommodate workflows. Recipes should be measured by the harness, not exempt
from it.

Do not carry NestJS/Node residue into ported text. The catalog generator's
wrong-stack lint bans `@nestjs`, `@Injectable`, `TypeORM`, and similar tokens;
ported recipes and agents must be scrubbed to FastAPI/Python/React vocabulary.

## Final Recommendation

Evolve `llm-harness-fastapi-react` into a measured workflow harness:

- Keep `.ruler` + npm + 3-way update + live evals + fixture-quality scoring as
  the foundation.
- Add recipe skills for workflow clarity.
- Add four planning/documentation agents and one quality-runner agent.
- Keep implementation mostly in the main agent until bounded write scopes are
  proven across target runtimes.
- Gate every new workflow with routing evals, adherence evals, and mutation
  tests.

This gives the project the best parts of `claude-code-workflows` without losing
the local harness's strongest differentiators: portability, safety, update
resilience, and measurable agent behavior — and it closes the one seam where
FastAPI + React is more exposed than the TypeScript-on-both-ends sibling:
behavioral drift across the generated OpenAPI contract.
</content>
</invoke>
