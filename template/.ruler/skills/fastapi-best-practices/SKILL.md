---
name: fastapi-best-practices
description: FastAPI best practices for production APIs: APIRouter structure, dependency injection, request/response models, error handling, OpenAPI hygiene, lifespan resources, middleware, settings, and performance. Use when writing, reviewing, or refactoring FastAPI route handlers, routers, dependencies, services, middleware, or application setup. NOT for generic Python style questions (use python-best-practices) or contract generation details (use openapi-contracts).
harness:
  tier: backend
  family: backend-fastapi
  gist: "FastAPI production rules: routers, dependencies, schemas, errors, lifespan, OpenAPI"
  owners: [main, architect-reviewer, code-reviewer, qa-validator, security-reviewer, acceptance-verifier]
---

# FastAPI Best Practices

Use this skill for FastAPI application code. Repository-specific choices still live in `repo-conventions`; this skill supplies the generic framework rules.

## Hard Rules

1. **Routers by feature.** Organize non-trivial APIs with `APIRouter` per domain/feature, mounted from the app entrypoint. Avoid one giant `main.py` with unrelated route handlers.
2. **Boundary validation is explicit.** Every route with input has Pydantic request models or typed parameters. Every public response has a response model or precise return type. Do not return raw ORM objects unless the repo convention explicitly allows it and serialization is tested.
3. **Dependencies are contracts.** Auth, current-user lookup, DB sessions, tenant/scope resolution, settings, and clients enter through `Depends` / `Security`, not hidden globals.
4. **Errors map deliberately.** Raise `HTTPException` or project-specific exceptions mapped centrally. Do not let arbitrary `Exception` leak stack traces or inconsistent response shapes. When a critical dependency (DB, cache, upstream) is down, fail with `503` — never serve mock or fallback data in its place.
5. **Lifespan owns resources.** Startup/shutdown resources belong in FastAPI lifespan or the repo's app factory pattern, not module import side effects.
6. **OpenAPI is a product surface.** Tags, summaries, operation IDs, response models, and error responses are part of the React contract. Breaking schema changes require a coordinated consumer update or versioning.
7. **No silent structural adoption.** New middleware, auth libraries, ORMs, background queues, or global exception systems are structural changes. Ask first and record the decision when the repo uses ADRs. For what legitimately belongs in middleware versus a dependency or exception handler, see `fastapi-patterns`.

## Common Review Findings

- Route handler contains business rules that belong in an application service.
- Route returns a dict shape that is not represented by a Pydantic response model.
- DB session is imported from a global instead of injected.
- Authz is checked in the React route guard but not in the FastAPI dependency/service boundary.
- Startup work runs at import time, making tests flaky and workers hard to boot.
- OpenAPI operation IDs change accidentally, breaking generated clients.

## Do Not Flag (Idiomatic FastAPI)

These look problematic but are correct — do not raise them as findings, and flag the related concern only when the context below warrants it:

- A typed Pydantic parameter already validates the request body; no manual validation is needed. Flag missing validation only if the field is not already in a Pydantic model or a constrained `Query`/`Path`/`Body`.
- DB sessions and clients arrive via `Depends`, not as passed arguments. A type annotation on `Depends(...)` is documentation, not a runtime assertion.
- `async def` without an `await` is fine (sync deps or trivial work). Flag sync-in-async only when a call actually blocks — network, file, CPU-bound, or a sync DB driver.
- Returning a `dict` is fine when `response_model` is set — FastAPI validates and filters it. Flag missing auth only if no auth dependency is applied at the route, router, or app level.

Before flagging "missing" behavior, confirm FastAPI/Pydantic is not already handling it (request validation, response serialization, exception conversion).

## Route Handler Standard

Route handlers should be thin orchestration:

1. Accept validated request data and dependency-injected context.
2. Call one application/service function.
3. Translate domain/application outcomes into HTTP status codes.
4. Return a response model or a typed result that FastAPI can serialize predictably.

Do not put authorization policy, SQL query construction, external API calls, or multi-step business rules directly in the route unless the endpoint is a trivial projection and the repo convention allows it.

Use one function per HTTP operation. Do not multiplex methods with `api_route(methods=[...])` and branch on `request.method` — separate `@router.get`/`@router.post` handlers keep concerns and OpenAPI clean. Use conventional status codes — `201` for creates, `204` for deletes/no-content — and give `HTTPException` an actionable `detail`, not a bare status.

## Dependency Boundary

- Use `Depends` for ordinary dependencies such as settings, DB sessions, service factories, and request-scoped context.
- Use `Security` when OAuth2 scopes or security schemes must appear in OpenAPI.
- Keep dependency functions named and overrideable. A dependency that performs auth, tenant resolution, DB session creation, and business validation is too large.
- Avoid import-time singletons for DB engines, clients, or settings unless the app factory/lifespan pattern owns them. See `fastapi-patterns` for the typed-settings (`get_settings`) seam.

## Lifespan and Resources

Use FastAPI lifespan/app-factory conventions for startup and shutdown work — not the deprecated `@app.on_event('startup'/'shutdown')` hooks. Initialize long-lived resources there; close them there. Importing a module should not connect to a database, create a network client, run migrations, or read production-only secrets.

Tests that need lifespan behavior should exercise the app through the repo's TestClient/httpx fixture so startup and shutdown behavior is observable.

## Persistence and Migrations

- A request-scoped DB session should be injected, not globally imported by services.
- Multi-statement writes need explicit transaction ownership and rollback behavior.
- SQLAlchemy async and sync sessions must not cross. If the route is async, keep blocking ORM/database work out of the event loop.
- Alembic autogenerate output is a draft. Review generated migrations for data backfills, constraints, indexes, naming, downgrade behavior, and destructive operations.

## Performance

- List endpoints are paginated or explicitly bounded; unbounded `SELECT *`-style routes are a defect.
- Avoid N+1 access in route/service paths — load related rows with selective/eager loading at the repository, not lazy attribute access during serialization.
- Large response models cost real CPU to serialize; project to the fields the consumer needs and stream or paginate big payloads instead of materializing them whole.
- Connection-pool sizing for the DB engine and HTTP clients is owned by the lifespan/app-factory, not created per request.
- Add caching only with a documented invalidation strategy; an unbounded or never-invalidated cache is a correctness bug, not a speedup.
- Declare a return type or `response_model` and let Pydantic serialize the response (it runs in Rust). Do not reach for `ORJSONResponse`/`UJSONResponse` — they are deprecated.
- Await independent I/O concurrently with `asyncio.gather` instead of serializing awaits (fan-out to several queries/services), but bound the fan-out — unbounded task creation exhausts connections and memory, so cap it with a semaphore or batches.
- Batch database writes (bulk insert/update) instead of per-row round-trips in a loop.
- For async/blocking-I/O boundaries (threadpool offload, async vs sync sessions, blocking calls in the hot path), see `python-best-practices`.

## Async vs Sync Path Operations

- Use `async def` for a route or dependency only when its body is genuinely awaitable and non-blocking (everything slow is `await`ed).
- When in doubt, use a plain `def` — FastAPI runs it in a threadpool so it will not block the event loop. The same rule applies to dependencies.
- Never call blocking I/O inside an `async def` route/dependency; it works but stalls the loop and degrades throughput badly. See `python-best-practices` for offload strategies.

## Streaming Responses

- Stream JSON Lines or SSE by declaring an `AsyncIterable[Model]` return type and `yield`-ing items, so Pydantic still serializes and filters each one.
- For SSE use `response_class=EventSourceResponse` (from `fastapi.sse`); yield `ServerSentEvent` instances when you need control over `event`/`id`/`retry`.
- Harden long-lived SSE streams: send `Cache-Control: no-cache`, disable proxy buffering (`X-Accel-Buffering: no` behind Nginx), emit periodic keep-alive/heartbeat events, and support client resume via `Last-Event-ID`.
- For raw bytes, subclass `StreamingResponse` with the right `media_type` and `yield` the chunks, rather than constructing and returning a `StreamingResponse` directly.

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
