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
