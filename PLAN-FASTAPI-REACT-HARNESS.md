# Plan: Create `llm-harness-fastapi-react`

**Status:** proposed - not started  
**Target package:** `@tierone/llm-harness-fastapi-react`  
**Target GitHub repo:** `TierOne-Studio/llm-harness-fastapi-react`  
**Target local folder:** `/Users/mravinale/Repositories/Github/llm-harness-fastapi-react`  
**Source of truth for scaffolding:** `llm-harness-fastapi-react` plus the single-tier `llm-harness-react` / `llm-harness-nest` split plans  
**Confidence after investigation:** 9.2/10

## Goal

Create a governed, measured agent harness for FastAPI + React monorepos. Reuse the proven distribution, update, eval, acceptance-test, docs, and reviewer machinery from `llm-harness-fastapi-react`; replace the FastAPI/Python backend knowledge surface with first-party FastAPI/Python guidance; preserve the React frontend guidance; and make the cross-tier seam OpenAPI-driven instead of OpenAPI-contract-driven.

## Phase 0 - Repository and Local Project Bootstrap

This phase is explicit because it creates new project state outside the existing `llm-harness-fastapi-react` repo.

1. **Create the local project folder**
   - Path: `/Users/mravinale/Repositories/Github/llm-harness-fastapi-react`
   - Source: copy from `/Users/mravinale/Repositories/Github/llm-harness-fastapi-react`
   - Exclude generated/development-only state: `.git`, `node_modules`, temp artifacts, local caches.

2. **Initialize the new git repository**
   - `git init` inside the new folder.
   - Use the current default branch convention from TierOne harness repos, expected `main`.
   - Do not commit yet until package identity is rewritten and tests pass.

3. **Create the GitHub repository under TierOne-Studio**
   - Repository: `TierOne-Studio/llm-harness-fastapi-react`
   - Visibility: public, matching the existing published harness packages unless the user directs otherwise.
   - Recommended command after explicit approval:
     ```bash
     gh repo create TierOne-Studio/llm-harness-fastapi-react --public --source=. --remote=origin
     ```
   - This is a GitHub write and must be approval-gated before execution.

4. **First commit and push**
   - Commit only after Phases 1-4 are structurally green.
   - Push to `origin main` only if the repo was just created and branch protection/release flow is intentionally being initialized; otherwise use a feature branch and PR.
   - Git writes and GitHub writes require explicit user approval.

## Phase 1 - Package Identity and Distribution Reuse

1. Rewrite `package.json`:
   - `name`: `@tierone/llm-harness-fastapi-react`
   - `bin`: `llm-harness-fastapi-react`
   - keywords: `fastapi`, `python`, `react`, `openapi`, `pydantic`, `harness`
   - repository/bugs/homepage URLs to `TierOne-Studio/llm-harness-fastapi-react`

2. Rename CLI output strings and package references:
   - `llm-harness-fastapi-react` -> `llm-harness-fastapi-react`
   - `@tierone/llm-harness-fastapi-react` -> `@tierone/llm-harness-fastapi-react`

3. Reuse these modules unchanged unless package identity requires edits:
   - `lib/init.js`
   - `lib/update.js`
   - `lib/classify.js`
   - `lib/merge.js`
   - `lib/fetchBase.js`
   - `lib/version.js`
   - `lib/paths.js`
   - `lib/fsutil.js`

4. Gate:
   - `npm test`

## Phase 2 - Replace Backend Skill Family

Keep the React and shared/process skills from `llm-harness-fastapi-react`. Replace the FastAPI/Python backend family with FastAPI/Python skills.

### Keep from fullstack

- React core: `react-*`
- Frontend platform: `accessibility`, `frontend-security`, `bundle-size`, `playwright-best-practices`, `vite`, `vitest`, `shadcn`, `tailwind-v4-shadcn`, `ai-ui-patterns`
- Shared/process: `tdd-workflow`, `design-review`, `plan-mode`, `spec-workflow`, `repo-conventions`, `quality-gates`, `bug-investigation`, `failure-mode-analysis`, `decision-rules`, `documentation-and-adrs`, `git-workflow`, `pushback-templates`, `rlm-explore`, `cross-repo-workspace`, `meta-skill-hygiene`, `async-error-handling`, `code-simplifier`, `cyclomatic-complexity`

### Replace

Remove:

- `fastapi-best-practices`
- `fastapi-clean-architecture`
- `fastapi-patterns`
- `python-best-practices`

Add:

- `fastapi-best-practices`
- `fastapi-clean-architecture`
- `fastapi-patterns`
- `fastapi-security`
- `fastapi-testing`
- `pydantic-v2-patterns`
- `python-best-practices`
- `openapi-contracts`

Adapt:

- `database-transactions` -> SQLAlchemy/SQLModel/Alembic transaction and migration guidance.
- `db-write-protocol` stays, with Python DB CLI/migration commands added.

### FastAPI source anchors

Use primary docs as the basis for these skills:

- FastAPI larger applications / `APIRouter`
- FastAPI dependency injection with `Depends`
- FastAPI dependency overrides for testing
- FastAPI lifespan events
- FastAPI SQL databases / SQLModel
- FastAPI settings and environment variables
- FastAPI security and OpenAPI security schemes
- FastAPI generated TypeScript SDKs from OpenAPI
- Pydantic v2 models, serialization, validation, settings
- pytest, Ruff, and Python typing/tooling docs

## Phase 3 - OpenAPI Contract Seam

FastAPI + React should not pretend it has a shared TypeScript contract package by default. The binding seam is:

```text
Pydantic/FastAPI route models
  -> FastAPI OpenAPI schema
  -> generated TypeScript client/types
  -> React data-fetching hooks and UI
```

1. Add `openapi-contracts` skill:
   - FastAPI route must declare request/response models.
   - Route tags and operation IDs must be stable enough for client generation.
   - Generated TS client/types are treated as build artifacts or committed artifacts according to `repo-conventions`.
   - React must consume generated types/client rather than hand-redeclaring DTOs.
   - Breaking OpenAPI changes require producer and consumer updates in the same PR or explicit versioning.

2. Update `repo-conventions`:
   - Replace `generated OpenAPI client` OpenAPI-generated TypeScript seam with OpenAPI generation seam.
   - Add FILL-IN sections for the generated-client command, output folder, committed-vs-generated policy, and schema drift gate.

3. Update quality gates:
   - Backend: `pytest`, `ruff`, type check (`mypy` or `pyright`, per repo convention), OpenAPI schema generation.
   - Frontend: `npm` tests/build.
   - Seam: generated client is current; e2e exercises at least one live FE-to-FastAPI path.

## Phase 4 - Instructions and Review Agents

1. Rewrite `template/.ruler/instructions.md`:
   - Title: `Fullstack: FastAPI + React`
   - Backend tier: `apps/api` FastAPI/Python
   - Frontend tier: `apps/web` React
   - Contract seam: OpenAPI-generated client/types
   - Tests: pytest/httpx/TestClient for API, Vitest/Testing Library for React, Playwright for the seam
   - Keep P0 safety, P3.6 fast/full path, P8.1 verification line, P7 lesson capture.

2. Update review agents:
   - `architect-reviewer`: FastAPI dependency graph, service/domain layering, OpenAPI seam impact.
   - `code-reviewer`: Python typing, Pydantic models, dependency injection, explicit error mapping, SOLID/DRY/KISS.
   - `qa-validator`: pytest coverage, dependency overrides, real DB tests where needed, generated-client drift.
   - `security-reviewer`: FastAPI `Security`/`Depends`, OAuth2/JWT/cookies, CORS, CSRF when cookies are used, RBAC dependencies, SQL injection, secret logging.
   - `acceptance-verifier`: run API integration tests plus Playwright seam tests; verify generated client is current.
   - `spec-steward`: replace `generated OpenAPI client` wording with OpenAPI/schema/generator wording.
   - `lessons-curator`: route backend corrections to FastAPI/Python skills.

## Phase 5 - Acceptance Tests and Skill Catalog

1. Update `scripts/build-skill-catalog.mjs`:
   - Replace `backend-nest` family with `backend-fastapi`.
   - Add or keep `data` family for DB/write protocol.

2. Update `template/.ruler/tests/run-acceptance.sh`:
   - Assert all FastAPI/Python skills exist.
   - Assert FastAPI/Python skills are not shipped.
   - Assert instructions name FastAPI + React.
   - Assert `repo-conventions` covers OpenAPI contract generation.
   - Assert agents reference FastAPI/Python skills and not `nestjs-*`.
   - Keep write-scope, instruction-budget, link-integrity, metadata, catalog, and permission-template checks.

3. Update `template/.ruler/tests/simulate-prompts.sh`:
   - Replace FastAPI scenarios with FastAPI scenarios:
     - Add an `APIRouter` endpoint.
     - Add a dependency for current user/RBAC.
     - Add a Pydantic response model.
     - Test with dependency overrides.
     - Change OpenAPI schema and regenerate client.
     - Add SQLAlchemy/SQLModel transaction.

4. Gates:
   - `npm run catalog`
   - `npm run catalog:check`
   - `npm run test:harness`

## Phase 6 - Eval Harness and Baselines

1. Reuse eval machinery:
   - `eval/lib.mjs`
   - `eval/routing-eval.mjs`
   - `eval/adherence-eval.mjs`
   - `scripts/mutation-test.mjs`
   - `scripts/context-decay.mjs`

2. Replace routing cases:
   - `nestjs-*` cases become `fastapi-*` cases.
   - Add `openapi-contracts` cases.
   - Add Python tooling cases (`pytest`, `ruff`, type checking) if these are discretionary skills.
   - Preserve negative/confusable cases.

3. Update adherence cases:
   - Backend route examples become FastAPI paths.
   - Contract examples become OpenAPI/generated-client examples.
   - Keep safety cases unchanged where possible.
   - Add a schema-generation drift case.

4. Update mutation seeds:
   - Replace `react-routing` / `nestjs-*` skill mutation targets with FastAPI/OpenAPI targets.
   - Preserve safety, TDD, approval, and fast-path mutation seeds.

5. Re-baseline from scratch:
   - Do not copy `llm-harness-fastapi-react` numbers.
   - Commit fresh `eval/baseline.json`.
   - Start or reset `eval/history.jsonl` for this repo.

6. Gates:
   - `npm test`
   - `npm run test:harness`
   - `npm run eval:mutation`
   - Live evals when credentials/CLI are available.

## Phase 7 - Docs and README

1. Rewrite README:
   - Position as FastAPI + React harness.
   - Explain OpenAPI-generated client seam.
   - List actual skill families and counts from generated catalog.
   - Quote only this repo's eval baselines after they exist.

2. Adapt docs:
   - `docs/ARCHITECTURE.md`
   - `docs/AGENTS-AND-SKILLS.md`
   - `docs/WHY-A-HARNESS.md`
   - `docs/ADOPTION.md`
   - `docs/EVALS.md`

3. Gate:
   - Every quoted metric traces to this repo's `eval/baseline.json` or `eval/history.jsonl`.

## Phase 8 - CI, Release, and Publication

1. Add or adapt CI:
   - `npm test`
   - `npm run catalog:check`
   - `npm run test:harness`
   - Eval job that self-skips without live-model credentials.

2. Version:
   - Start at `0.1.0` if this is a new package.

3. Publish flow:
   - Package publication requires explicit approval.
   - `npm publish --access public` only after tests, harness tests, docs, and package metadata are verified.

4. GitHub release:
   - Optional after npm publish.
   - Requires explicit approval.

## Suggested PR / Commit Slicing

If the new repo starts empty, use commits instead of PR stack until the first publishable baseline exists:

1. `chore: scaffold fastapi react harness package`
2. `feat: add fastapi python backend skills`
3. `feat: define openapi react contract seam`
4. `test: adapt harness acceptance and simulations`
5. `test: add fastapi react eval baselines`
6. `docs: document fastapi react harness`
7. `ci: add catalog harness and eval gates`

If the repository is created before implementation, use feature branches and PRs after the initial scaffold commit.

## Open Decisions

- Repository visibility: default public, confirm before creation.
- Local folder source: direct copy from `llm-harness-fastapi-react` is fastest; alternatively generate from a clean template if we want less history/noise.
- Generated TypeScript client policy: committed artifact vs generated during CI. The harness should support both but require `repo-conventions` to choose one.
- Python type checker: mypy vs pyright. The harness should not mandate one globally; `repo-conventions` records the project choice.
- DB stack: SQLAlchemy, SQLModel, or both. FastAPI official docs use SQLModel, but many production FastAPI projects use SQLAlchemy directly. The skills should cover both with repo convention deciding the default.

## Main Risk

The only material risk is making a shallow FastAPI-to-FastAPI text port. The mitigation is to write first-party FastAPI/Python/OpenAPI skills from primary docs, then let acceptance tests and live evals prove the routing and gate adherence before publication.
