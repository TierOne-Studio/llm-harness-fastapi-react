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
