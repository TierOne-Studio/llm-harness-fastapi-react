# Harness Architecture

`@tierone/llm-harness-fastapi-react` has three planes:

| Plane | Code | Job |
|---|---|---|
| Payload | `template/.ruler/` | Operating profile, 59 skills (incl. 9 `recipe-*` entry points), 7 review agents + 5 read-only workflow agents, ruler config, harness tests |
| Distribution | `bin/cli.js`, `lib/` | `init` copies `.ruler`; `update` 3-way merges upstream harness changes over consumer edits |
| Measurement | `eval/`, `scripts/`, `template/.ruler/tests/` | Static acceptance checks, skill-trigger simulation, live routing/adherence evals, mutation and context-decay probes |

## Runtime Model

The main agent is the only writer of application code. It loads the compact always-on profile from `instructions.md`, force-loads mandatory skills from P3.4, and routes tier-specific work to the matching skill family.

The seven review agents are one-shot sensors in fresh context:

- `architect-reviewer`: plan-level risk and structure.
- `spec-steward`: owns `docs/specs/**` for behavioral requirements.
- `code-reviewer`: design principles and repo-convention compliance.
- `qa-validator`: coverage, edge cases, accessibility, compatibility.
- `security-reviewer`: OWASP, FastAPI auth/RBAC/CORS/CSRF, frontend XSS/token risks.
- `acceptance-verifier`: executed proof at the right layer.
- `lessons-curator`: turns user corrections into proposed harness improvements.

## Workflow Recipe Layer

Recipes are entry-point process skills (`recipe-*`) that orchestrate existing skills and agents for a whole job rather than a single concern — `recipe-task`, `recipe-design`, `recipe-plan`, `recipe-build`, `recipe-review`, `recipe-fullstack-implement`, `recipe-diagnose`, `recipe-reverse-engineer`, `recipe-add-integration-tests`. They are routed from `instructions.md` § Recipe Pointers and call into the operating profile; P0 safety and approval gates override every recipe.

Five read-only workflow agents back the planning and quality phases, all structured-JSON sensors with no write scope (only `spec-steward` writes):

- `requirements-analyzer`: classifies purpose, scale, affected layers, risk surfaces, and required artifacts.
- `codebase-analyzer`: objective existing-code facts (FastAPI routers, Pydantic models, React hooks, migrations, tests).
- `document-reviewer`: PRD/SPEC/ADR/design/work-plan readiness review.
- `design-sync`: cross-tier consistency over the OpenAPI seam (a semantic mismatch is not resolved just because the client generates or `mypy` passes).
- `quality-runner`: runs and classifies both toolchains (`pytest`/`ruff`/`mypy` and `vitest`/`tsc`) and detects Python and TypeScript stubs.

## Contract Seam

FastAPI + React does not use shared TypeScript source as the default contract. The binding seam is:

```text
FastAPI route + Pydantic models -> OpenAPI schema -> generated TypeScript client/types -> React hooks/UI
```

`openapi-contracts` records the rules for operation IDs, generated-client freshness, breaking schema changes, and avoiding hand-redeclared DTOs in React.
