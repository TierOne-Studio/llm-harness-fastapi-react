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
