# Harness Architecture

`@tierone/llm-harness-fastapi-react` has three planes:

| Plane | Code | Job |
|---|---|---|
| Payload | `template/.ruler/` | Operating profile, 48 skills, 7 review agents, ruler config, harness tests |
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

## Contract Seam

FastAPI + React does not use shared TypeScript source as the default contract. The binding seam is:

```text
FastAPI route + Pydantic models -> OpenAPI schema -> generated TypeScript client/types -> React hooks/UI
```

`openapi-contracts` records the rules for operation IDs, generated-client freshness, breaking schema changes, and avoiding hand-redeclared DTOs in React.
