---
name: openapi-contracts
description: OpenAPI contract discipline for FastAPI + React: response models, stable operation IDs, generated TypeScript clients, schema drift gates, breaking-change review, and consumer updates. Use when a task explicitly changes or verifies FastAPI public route shapes, Pydantic DTOs used in the API, generated clients, frontend API hooks, or the FE↔BE seam. NOT for internal-only backend module architecture with no public API/schema change.
harness:
  tier: shared
  family: process
  gist: "FastAPI OpenAPI schema as the React contract; generated TypeScript client drift gates"
  owners: [main, architect-reviewer, code-reviewer, qa-validator, security-reviewer]
---

# OpenAPI Contracts

FastAPI + React uses OpenAPI as the contract seam. The backend owns the runtime schema; the frontend consumes generated TypeScript client/types.

## Hard Rules

1. **FastAPI is the contract source.** Public routes declare request and response models so OpenAPI represents real behavior.
2. **Operation IDs are stable.** If the generated client names depend on operation IDs, accidental renames are breaking changes.
3. **No hand-redeclared DTOs in React.** React imports generated client/types or a thin wrapper around them. Hand-written mirror interfaces are drift risks.
4. **Generated client freshness is a gate.** The repo must define whether generated files are committed or generated in CI; either way, a drift check must exist.
5. **Breaking changes are coordinated.** Removing/renaming fields, narrowing types, changing paths/methods/status codes, or changing auth requirements requires both producer and consumer updates or versioning.

## Contract Change Checklist

When a public FastAPI schema/route changes:

1. Update request/response Pydantic DTOs or route metadata.
2. Generate OpenAPI and the TypeScript client/types using the repo command.
3. Check the generated diff for accidental operation ID, path, enum, nullability, casing, or auth changes.
4. Update frontend consumers to import generated types/client surfaces.
5. Add backend route tests and frontend consumer tests that would fail with the old contract.
6. Run the repo's generated-client drift check.

## Breaking vs Non-Breaking

Usually non-breaking:

- additive optional response field,
- new endpoint,
- additive enum value only when consumers tolerate unknowns,
- broader accepted request input that preserves previous behavior.

Usually breaking:

- field rename/removal,
- optional -> required,
- response type narrowing,
- path/method/status code change,
- auth/scope requirement change,
- operation ID/client function rename,
- changing pagination/error envelope shape.

## Operation IDs

Operation IDs are client API names in many generators. Keep them deterministic. If the repo uses custom operation IDs, changing function names or router tags should not silently rename generated client functions.

## Frontend Rules

- Do not hand-write mirror interfaces for API responses.
- Keep thin wrappers around generated clients small and typed.
- Cache keys and optimistic update code should use generated types, not copied literals.
- When backend changes an error envelope, frontend error handling must be updated in the same slice.

## CI Gate Patterns

Good gates include:

- generate OpenAPI/client and fail on diff;
- compare committed OpenAPI JSON against app output;
- run typecheck/build after generated client update;
- run at least one seam test that proves a React consumer compiles and handles the changed shape.
