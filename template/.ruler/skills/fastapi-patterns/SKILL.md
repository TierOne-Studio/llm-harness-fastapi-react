---
name: fastapi-patterns
description: Tactical FastAPI patterns: Depends/Security dependency composition, dependency overrides, APIRouter composition, lifespan resources, middleware, background tasks, app factories, and typed settings. Use when designing or reviewing FastAPI framework wiring. NOT for broad best-practice review (use fastapi-best-practices) or pure Python style (use python-best-practices).
harness:
  tier: backend
  family: backend-fastapi
  gist: "Depends/Security, APIRouter, lifespan, middleware, overrides, background tasks"
  owners: [main, architect-reviewer, code-reviewer, qa-validator, security-reviewer]
---

# FastAPI Tactical Patterns

## Dependency Composition

- Use `Depends` for DB sessions, settings, service factories, current-user lookup, and tenant/scope resolution.
- Use `Security` when scopes or security schemes matter to OpenAPI and generated clients.
- Keep dependencies small and named. A dependency that validates auth, resolves tenant, opens a DB session, and performs business rules should be split.
- Avoid hidden globals in dependencies; tests should be able to override them with FastAPI dependency overrides.
- Declare dependencies with the `Annotated` style behind a reusable type alias — `CurrentUserDep = Annotated[UserContext, Depends(get_current_user)]` consumed as `user: CurrentUserDep` — not `user: UserContext = Depends(...)` in the signature. The alias is reusable, keeps the signature usable outside FastAPI, and stays overrideable by identity.

## Router Composition

- One router per feature/domain for non-trivial APIs.
- Keep route prefix/tags consistent because they shape OpenAPI and generated clients.
- Keep public paths stable; breaking path/method changes are contract changes.
- Declare `prefix`, `tags`, and shared `dependencies=[Depends(...)]` on the `APIRouter(...)` itself, not as arguments to `include_router()`. Apply cross-cutting auth/scope dependencies at the router level rather than repeating them per route.

## Lifespan and App Factory

- Use lifespan or the repo's app factory for startup/shutdown resources.
- Do not connect to databases, queues, or remote services at module import time.
- Tests should create an app with controlled dependency overrides and settings.

## App Factory Pattern

Prefer a function such as `create_app(settings: Settings) -> FastAPI` when the repo has multiple environments or test modes. The factory should:

- create the `FastAPI` instance,
- register routers,
- attach exception handlers and middleware,
- configure lifespan/resources from explicit settings,
- avoid reading process-global configuration deep inside modules.

This keeps tests from mutating global app state and lets CI create an app with test DB URLs, fake clients, and deterministic feature flags.

## Typed Settings

Configuration should be a typed object, not scattered `os.environ` reads. Use a Pydantic settings model (`pydantic-settings` `BaseSettings`) exposed through a `get_settings() -> Settings` dependency so that:

- routes and services depend on `Settings` by injection, never on `os.environ` directly,
- tests override `get_settings` to supply deterministic config (test DB URLs, fake keys, feature flags),
- the app factory receives `settings` explicitly rather than reading process globals deep in module bodies.

Cache the settings object (e.g. `lru_cache` or a module-level singleton) so each request reuses one instance, but keep it overrideable by identity. See `pydantic-v2-patterns` for settings-model and validation depth.

## Dependency Override Shape

Dependencies should be overrideable by identity. Avoid wrapping dependencies in anonymous lambdas or constructing them inline inside route decorators when tests will need to override them.

Good dependency seams:

- `get_settings() -> Settings`
- `get_session() -> AsyncIterator[AsyncSession]`
- `get_current_user() -> UserContext`
- `get_service(session=Depends(get_session)) -> Service`

Avoid service constructors inside route bodies unless the constructor is trivial and has no external resources. The concrete names and module locations for these seams are repo conventions; see `repo-conventions`.

## Dependency Lifecycle (`yield` and `scope`)

- A dependency that owns a resource (DB session, file handle, client) should `yield` it and release it in `finally`.
- The default `scope="request"` runs the cleanup after the response is sent; use `scope="function"` only when cleanup must run after the response data is generated but before it is sent. Choose deliberately — the default is usually correct.
- Prefer plain function dependencies over class dependencies. If a class instance is needed, return it from a function dependency (`Annotated[Service, Depends(get_service)]`) rather than depending on the class directly (`Annotated[Service, Depends()]`).

## Security Dependency Composition

- Use `Depends` for current-user lookup when no OpenAPI security scheme/scopes are required.
- Use `Security` when scopes need to be declared in the OpenAPI operation.
- Keep authentication and authorization separate enough to test 401 vs 403 behavior.
- Tenant/scope resolution should produce an explicit context object consumed by services/repositories.

## Background Tasks and Side Effects

FastAPI `BackgroundTasks` is for short, best-effort work tied to the request lifecycle. Do not use it for durable jobs, billing actions, critical notifications, or retry-sensitive integrations unless the repo has documented that tradeoff. Durable work belongs in a queue/worker pattern and is a structural decision — in an async codebase prefer an async-native worker (e.g. ARQ or Taskiq) over a sync-bridged one (Celery is battle-tested but bridges sync).

Background-task failures never reach the client and are easy to swallow silently — give them their own logging and error handling, and never spawn a task that can run unbounded or never complete (it leaks memory and connections).

## Middleware and Exception Handlers

Middleware should be rare and cross-cutting: request IDs, CORS, timing, tracing, security headers. Business rules do not belong in middleware. Exception handlers should normalize error envelopes without hiding programming errors during tests.

Conversely, dependencies should provide resources or context, not perform side effects — cross-cutting writes like request logging belong in middleware, not in a `Depends` that returns `None`.

Prefer pure ASGI middleware (`async def __call__(scope, receive, send)`) for cross-cutting work; `BaseHTTPMiddleware` buffers the entire response body into memory and breaks streaming/large responses — reach for it only when you must read or rewrite the `Request`/`Response`. Middleware runs LIFO (the last added is the outermost and runs first), so order it deliberately — error handling outermost, CORS innermost — so error responses still get CORS headers.

## Observability

- Emit structured logs (key/value fields), not concatenated strings, so events are queryable; never log secrets, tokens, or raw PII (see `fastapi-security`).
- Generate or propagate a request/correlation ID per request and bind it once into the logging context (e.g. `structlog` contextvars) so every log line in that request carries it automatically; echo it back in an `X-Request-ID` response header and forward it to outbound calls for end-to-end tracing.
- Split health checks: a cheap liveness probe, plus a readiness probe that checks critical dependencies and returns `503` when one is down. Distinguish degraded (a non-critical dependency is down — keep serving) from unhealthy (a critical dependency is down). Leave them unauthenticated only if they reveal nothing sensitive.
- Instrument latency/error/throughput through the repo's tracing/metrics stack (e.g. OpenTelemetry) rather than ad hoc timers: record exceptions on the active span and set its status to error, auto-instrument outbound HTTP/DB clients so trace context propagates, and set explicit histogram buckets so p95/p99 are usable.
- Keep metric label cardinality low — never label by raw path, user ID, or other unbounded values; use route templates and bounded enums. Decide and document the stack in `repo-conventions`.

## WebSocket Connection Lifecycle

- A WebSocket handler follows accept → receive loop → handle `WebSocketDisconnect` → clean up. Always remove the connection and release resources on disconnect, including the error path.
- For fan-out (chat, live updates), centralize sockets in a connection manager that tracks active connections and broadcasts; do not scatter per-connection state in module globals without cleanup.
- A connection manager only knows its own process's sockets — across multiple instances, fan out broadcasts through a shared bus (e.g. Redis pub/sub) instead of assuming one process holds every connection.
- Authenticate the handshake and re-check authorization for long-lived connections — see `fastapi-security` for the security rules.

## Pattern Selection

- Simple CRUD/projection endpoint: router + schema + injected session may be enough.
- Endpoint with invariants or multi-step writes: application service plus transaction boundary.
- Endpoint with auth/tenant behavior: explicit auth dependency plus service/repository tests for denial paths.
- Endpoint changing public shape: add `openapi-contracts` and generated-client proof.
