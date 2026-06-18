---
name: fastapi-clean-architecture
description: Clean architecture for FastAPI domain modules: route/presentation layer, application services/use-cases, pure domain model/rules, infrastructure adapters, repository ports, and dependency-rule checks. Use when designing a new FastAPI domain module or refactoring a module that has grown business invariants. NOT for flat CRUD endpoints with no domain behavior.
harness:
  tier: backend
  family: backend-fastapi
  gist: "Layered FastAPI modules with route/service/domain/infrastructure dependency rule"
---

# FastAPI Clean Architecture

Use this when a FastAPI module needs more than thin CRUD. The exact folder names are repo conventions, but the dependency direction is not optional.

## Default Layering

~~~text
apps/api/app/modules/<domain>/
├── api/              # APIRouter, request/response schemas if repo keeps them here
├── application/      # services / use cases / orchestration
├── domain/           # entities, value objects, policies, repository protocols
└── infrastructure/   # SQLAlchemy/SQLModel repositories, external adapters
~~~

## Dependency Rule

- Domain imports no FastAPI, SQLAlchemy, SQLModel, HTTP, or infrastructure modules.
- Application depends on domain ports/protocols, not concrete database adapters.
- Infrastructure implements ports and may import ORM/client libraries.
- API layer wires FastAPI dependencies and calls application services.

## When To Keep It Simpler

Flat feature modules are fine for simple CRUD/projection endpoints. Escalate to the layered structure when there are invariants, multi-step writes, authorization scoping, external integrations, or behavior that needs unit tests without HTTP/database setup.

## Layer Responsibilities

### API / Presentation

- Owns `APIRouter`, FastAPI dependencies, HTTP status codes, request/response DTOs, and OpenAPI metadata.
- Calls application services; it should not contain SQL query construction or durable business decisions.
- Translates application errors into HTTP errors through the repo's error mapping convention.

### Application

- Owns use cases and transaction orchestration.
- Accepts explicit context: actor/current user, tenant, request DTO, ports/repositories, clock/ID providers where needed.
- Coordinates domain rules, repositories, and external ports without importing FastAPI.

### Domain

- Owns invariants, value objects, policies, state transitions, and repository protocols.
- Imports only standard library and domain-local modules unless the repo documents a small dependency.
- Is testable with plain unit tests: no FastAPI app, DB, HTTP client, or environment variables.

### Infrastructure

- Implements repository protocols using SQLAlchemy/SQLModel/external clients.
- Owns query details, mapping, persistence exceptions, and adapter-specific retries/timeouts.
- May import ORM/client libraries but should not leak them into domain/application signatures.

## Transaction Boundary

Choose one owner for commits. Commonly the application service or unit-of-work dependency owns `commit`/`rollback`; repositories usually should not commit independently. If multiple repositories participate in one use case, prove the transaction is atomic and tested.

## Authorization Boundary

API dependencies can authenticate and build an actor/tenant context, but application/domain code should enforce business authorization too. Do not rely only on React guards or route-level dependencies for object ownership, tenant scoping, or role-specific invariants.

## Migration Path

When refactoring an existing flat module:

1. Extract tests that lock current behavior.
2. Move business rules to application/domain first.
3. Introduce repository protocols only where they remove concrete infrastructure coupling.
4. Keep route paths, response shapes, and operation IDs stable unless the task is a contract change.
5. Preserve generated-client compatibility or run `openapi-contracts`.

## Anti-Patterns

- Domain imports `fastapi`, `sqlalchemy`, or `pydantic` response DTOs.
- Application service returns ORM models directly to the route.
- Repository performs authorization checks that require user intent but receives no actor/tenant context.
- Every CRUD endpoint gets four folders before there is domain behavior.
- A migration/refactor changes public OpenAPI shape without contract review.
