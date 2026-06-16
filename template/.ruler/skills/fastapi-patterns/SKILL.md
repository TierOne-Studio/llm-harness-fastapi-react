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
