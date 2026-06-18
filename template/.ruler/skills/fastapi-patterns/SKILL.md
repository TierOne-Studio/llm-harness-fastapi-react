---
name: fastapi-patterns
description: Tactical FastAPI patterns: Depends/Security dependency composition, dependency overrides, APIRouter composition, lifespan resources, middleware, background tasks, app factories, and typed settings. Use when designing or reviewing FastAPI framework wiring. NOT for broad best-practice review (use fastapi-best-practices) or pure Python style (use python-best-practices).
harness:
  tier: backend
  family: backend-fastapi
  gist: "Depends/Security, APIRouter, lifespan, middleware, overrides, background tasks"
---

# FastAPI Tactical Patterns

## Dependency Composition

- Use `Depends` for DB sessions, settings, service factories, current-user lookup, and tenant/scope resolution.
- Use `Security` when scopes or security schemes matter to OpenAPI and generated clients.
- Keep dependencies small and named. A dependency that validates auth, resolves tenant, opens a DB session, and performs business rules should be split.
- Avoid hidden globals in dependencies; tests should be able to override them with FastAPI dependency overrides.

## Router Composition

- One router per feature/domain for non-trivial APIs.
- Keep route prefix/tags consistent because they shape OpenAPI and generated clients.
- Keep public paths stable; breaking path/method changes are contract changes.

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

## Dependency Override Shape

Dependencies should be overrideable by identity. Avoid wrapping dependencies in anonymous lambdas or constructing them inline inside route decorators when tests will need to override them.

Good dependency seams:

- `get_settings() -> Settings`
- `get_session() -> AsyncIterator[AsyncSession]`
- `get_current_user() -> UserContext`
- `get_service(session=Depends(get_session)) -> Service`

Avoid service constructors inside route bodies unless the constructor is trivial and has no external resources.

## Security Dependency Composition

- Use `Depends` for current-user lookup when no OpenAPI security scheme/scopes are required.
- Use `Security` when scopes need to be declared in the OpenAPI operation.
- Keep authentication and authorization separate enough to test 401 vs 403 behavior.
- Tenant/scope resolution should produce an explicit context object consumed by services/repositories.

## Background Tasks and Side Effects

FastAPI `BackgroundTasks` is for short, best-effort work tied to the request lifecycle. Do not use it for durable jobs, billing actions, critical notifications, or retry-sensitive integrations unless the repo has documented that tradeoff. Durable work belongs in a queue/worker pattern and is a structural decision.

## Middleware and Exception Handlers

Middleware should be rare and cross-cutting: request IDs, CORS, timing, tracing, security headers. Business rules do not belong in middleware. Exception handlers should normalize error envelopes without hiding programming errors during tests.

## Pattern Selection

- Simple CRUD/projection endpoint: router + schema + injected session may be enough.
- Endpoint with invariants or multi-step writes: application service plus transaction boundary.
- Endpoint with auth/tenant behavior: explicit auth dependency plus service/repository tests for denial paths.
- Endpoint changing public shape: add `openapi-contracts` and generated-client proof.
