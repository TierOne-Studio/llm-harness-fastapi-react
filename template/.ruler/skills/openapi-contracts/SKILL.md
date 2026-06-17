---
name: openapi-contracts
description: OpenAPI contract discipline for FastAPI + React: response models, stable operation IDs, generated TypeScript clients, schema drift gates, breaking-change review, and consumer updates. Use when a task explicitly changes or verifies FastAPI public route shapes, Pydantic DTOs used in the API, generated clients, frontend API hooks, or the FE↔BE seam. NOT for internal-only backend module architecture with no public API/schema change.
harness:
  tier: shared
  family: process
  gist: "FastAPI OpenAPI schema as the React contract; generated TypeScript client drift gates"
---

# OpenAPI Contracts

FastAPI + React uses OpenAPI as the contract seam. The backend owns the runtime schema; the frontend consumes generated TypeScript client/types.

## Hard Rules

1. **FastAPI is the contract source.** Public routes declare request and response models so OpenAPI represents real behavior.
2. **Operation IDs are stable.** If the generated client names depend on operation IDs, accidental renames are breaking changes.
3. **No hand-redeclared DTOs in React.** React imports generated client/types or a thin wrapper around them. Hand-written mirror interfaces are drift risks.
4. **Generated client freshness is a gate.** The repo must define whether generated files are committed or generated in CI; either way, a drift check must exist.
5. **Breaking changes are coordinated.** Removing/renaming fields, narrowing types, changing paths/methods/status codes, or changing auth requirements requires both producer and consumer updates or versioning.
