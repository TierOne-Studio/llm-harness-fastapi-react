---
name: fastapi-best-practices
description: FastAPI best practices for production APIs: APIRouter structure, dependency injection, request/response models, error handling, OpenAPI hygiene, lifespan resources, middleware, settings, and performance. Use when writing, reviewing, or refactoring FastAPI route handlers, routers, dependencies, services, middleware, or application setup. NOT for generic Python style questions (use python-best-practices) or contract generation details (use openapi-contracts).
harness:
  tier: backend
  family: backend-fastapi
  gist: "FastAPI production rules: routers, dependencies, schemas, errors, lifespan, OpenAPI"
---

# FastAPI Best Practices

Use this skill for FastAPI application code. Repository-specific choices still live in `repo-conventions`; this skill supplies the generic framework rules.

## Hard Rules

1. **Routers by feature.** Organize non-trivial APIs with `APIRouter` per domain/feature, mounted from the app entrypoint. Avoid one giant `main.py` with unrelated route handlers.
2. **Boundary validation is explicit.** Every route with input has Pydantic request models or typed parameters. Every public response has a response model or precise return type. Do not return raw ORM objects unless the repo convention explicitly allows it and serialization is tested.
3. **Dependencies are contracts.** Auth, current-user lookup, DB sessions, tenant/scope resolution, settings, and clients enter through `Depends` / `Security`, not hidden globals.
4. **Errors map deliberately.** Raise `HTTPException` or project-specific exceptions mapped centrally. Do not let arbitrary `Exception` leak stack traces or inconsistent response shapes.
5. **Lifespan owns resources.** Startup/shutdown resources belong in FastAPI lifespan or the repo's app factory pattern, not module import side effects.
6. **OpenAPI is a product surface.** Tags, summaries, operation IDs, response models, and error responses are part of the React contract. Breaking schema changes require a coordinated consumer update or versioning.
7. **No silent structural adoption.** New middleware, auth libraries, ORMs, background queues, or global exception systems are structural changes. Ask first and record the decision when the repo uses ADRs.

## Common Review Findings

- Route handler contains business rules that belong in an application service.
- Route returns a dict shape that is not represented by a Pydantic response model.
- DB session is imported from a global instead of injected.
- Authz is checked in the React route guard but not in the FastAPI dependency/service boundary.
- Startup work runs at import time, making tests flaky and workers hard to boot.
- OpenAPI operation IDs change accidentally, breaking generated clients.

## Route Handler Standard

Route handlers should be thin orchestration:

1. Accept validated request data and dependency-injected context.
2. Call one application/service function.
3. Translate domain/application outcomes into HTTP status codes.
4. Return a response model or a typed result that FastAPI can serialize predictably.

Do not put authorization policy, SQL query construction, external API calls, or multi-step business rules directly in the route unless the endpoint is a trivial projection and the repo convention allows it.

## Dependency Boundary

- Use `Depends` for ordinary dependencies such as settings, DB sessions, service factories, and request-scoped context.
- Use `Security` when OAuth2 scopes or security schemes must appear in OpenAPI.
- Keep dependency functions named and overrideable. A dependency that performs auth, tenant resolution, DB session creation, and business validation is too large.
- Avoid import-time singletons for DB engines, clients, or settings unless the app factory/lifespan pattern owns them.

## Lifespan and Resources

Use FastAPI lifespan/app-factory conventions for startup and shutdown work. Initialize long-lived resources there; close them there. Importing a module should not connect to a database, create a network client, run migrations, or read production-only secrets.

Tests that need lifespan behavior should exercise the app through the repo's TestClient/httpx fixture so startup and shutdown behavior is observable.

## Persistence and Migrations

- A request-scoped DB session should be injected, not globally imported by services.
- Multi-statement writes need explicit transaction ownership and rollback behavior.
- SQLAlchemy async and sync sessions must not cross. If the route is async, keep blocking ORM/database work out of the event loop.
- Alembic autogenerate output is a draft. Review generated migrations for data backfills, constraints, indexes, naming, downgrade behavior, and destructive operations.

## OpenAPI Hygiene

- Public routes declare request and response models so OpenAPI matches runtime behavior.
- Operation IDs used by generated clients must be stable and unique.
- Response examples, tags, summaries, and documented error responses are part of the product surface for frontend consumers.
- Any change to path, method, auth requirement, status code, field name, nullability, or enum value is a contract change; involve `openapi-contracts`.

## Verification Checklist

Before calling a FastAPI change complete, show:

- Route/service tests for success and denial/error paths.
- Dependency overrides or fakes for auth/current user/settings/external clients.
- OpenAPI schema/client freshness proof when public schemas change.
- Ruff/typecheck/pytest commands that actually ran, or a clear reason they could not.

Reference anchors: FastAPI APIRouter/bigger apps, response models, lifespan, testing dependency overrides, and operation ID/generate-client docs.
