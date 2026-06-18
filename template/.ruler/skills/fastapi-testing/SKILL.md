---
name: fastapi-testing
description: FastAPI testing patterns with pytest, TestClient/httpx, dependency overrides, app factories, async tests, database isolation, OpenAPI schema checks, and non-vacuous API assertions. Use when the task explicitly writes, reviews, fixes, or designs FastAPI unit, integration, or contract tests. NOT for ordinary route implementation unless test strategy or pytest/httpx coverage is being discussed.
harness:
  tier: backend
  family: backend-fastapi
  gist: "pytest, TestClient/httpx, dependency overrides, DB isolation, OpenAPI checks"
---

# FastAPI Testing

## Layer Choice

- Pure domain logic: unit tests without FastAPI or a database.
- Application services: unit/integration tests with fake ports or transaction-scoped test DB.
- Routes: TestClient/httpx tests against the FastAPI app with dependency overrides.
- Data/RBAC/migration behavior: run against the real configured test database when the criterion depends on DB behavior.
- Contract seam: generate OpenAPI/client and verify React consumes the generated surface.

## Dependency Overrides

Use FastAPI dependency overrides to replace auth, current user, settings, DB sessions, and external clients in tests. Do not monkeypatch hidden globals when a dependency override can prove the real route path.

## Test Client Choice

- Sync app or simple route tests: `TestClient` is fine.
- Async services or async DB work: prefer `httpx.AsyncClient` with the repo's ASGI/app fixture and pytest async support.
- If lifespan resources matter, create the client through the fixture/context that actually runs lifespan startup and shutdown.

If the repo exposes an app factory, build the test app via `create_app(settings)` with deterministic test settings (test DB URL, fake clients, fixed feature flags) and install dependency overrides on that instance — never mutate a process-global app. See `fastapi-patterns` for the factory/override seam.

## Dependency Override Discipline

- Override the exact dependency function object registered by the route.
- Clear overrides after each test to avoid cross-test leakage.
- Prefer fixtures that install overrides and clean them up in `finally`.
- Override auth/current-user, DB sessions, settings, clocks, ID providers, and external clients at the dependency seam.

## Database Tests

Choose the lowest-cost layer that proves the behavior:

- Domain rules: no DB.
- Service orchestration: fake repository ports where possible.
- SQL query, constraints, transaction, migration, or tenant scoping: real test database.

For real DB tests, use transaction rollback, schema-per-test, or disposable containers according to `repo-conventions`. Do not point tests at a developer or production database.

## Assertions

Avoid vacuous assertions like "status code is not 500". Assert:

- status code,
- response shape and selected fields,
- error envelope for denial paths,
- DB side effects or absence of side effects,
- OpenAPI/client freshness when public schema changes.

## Coverage Map

For a route with auth and persistence, expect at least:

- success path,
- validation failure,
- unauthenticated request,
- authenticated but unauthorized/wrong-tenant request,
- repository/service failure mapped to the documented HTTP error,
- transaction rollback or no partial write for multi-step operations.

## Generated Contract Tests

When FastAPI public schemas change, add or run the repo's OpenAPI generation check (see `openapi-contracts`). The test should fail when generated TypeScript client/types are stale or when a frontend consumer still uses the old field shape.
