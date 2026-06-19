---
name: pydantic-v2-patterns
description: Pydantic v2 patterns for FastAPI request/response schemas, validation, serialization, model_config, computed fields, DTO separation, settings models, and OpenAPI-safe schema evolution. Use when adding or reviewing Pydantic models, request/response DTOs, settings models, or schema validation. NOT for backend architecture discussions that do not mention Pydantic/schema validation.
harness:
  tier: backend
  family: backend-fastapi
  gist: "Pydantic v2 schema design, validation, serialization, settings, DTO evolution"
  owners: [main, architect-reviewer, code-reviewer, qa-validator, security-reviewer]
---

# Pydantic v2 Patterns

## Schema Boundaries

- Separate request, response, and persistence/domain shapes when they differ.
- Do not expose internal ORM/domain fields by returning models without an allowlisted response schema.
- Prefer additive changes for backwards compatibility. Renames, removals, and type narrowings are contract changes.

## Validation and Serialization

- Put syntactic validation in Pydantic models; put authorization and business invariants in services/domain code.
- Use Pydantic v2 serialization intentionally (`model_dump`, aliases, config) so the OpenAPI schema and runtime output agree.
- Avoid `Any` or overly broad unions in public response models unless the API really has that shape.

## DTO Boundary Rules

- Request DTOs model external input. They may contain optional fields for partial updates, but should not expose persistence-only fields.
- Set `model_config = ConfigDict(extra="forbid")` on request DTOs so unknown fields are rejected — silently accepting extras invites mass assignment (e.g. a client slipping in `is_admin: true`).
- Bound collection fields on request DTOs with `Field(max_length=...)` (and `min_length` where apt) — an unbounded inbound `list`/`dict` is a resource-exhaustion/DoS vector.
- Response DTOs model the public API. They should be allowlisted and stable for generated clients.
- Domain models/entities should not depend on FastAPI request/response DTOs unless the repo explicitly chooses that tradeoff.
- Persistence/ORM models are not public response models by default.

## Pydantic v2 Practices

- Set `model_config = ConfigDict(...)` intentionally for `from_attributes` (the v2 replacement for v1 `orm_mode`), alias handling, strictness, and extra-field policy — not a v1-style inner `class Config`.
- Prefer explicit field types with `Annotated[T, Field(...)]` constraints and `@field_validator`/`@model_validator` over broad `dict[str, Any]`.
- Prefer rich semantic types over bare `str` — `EmailStr`, `HttpUrl`, `UUID`, `IPvAnyAddress`, `date`/`datetime` — so validation happens at the boundary instead of in handlers.
- Use computed/serialized fields only when the runtime value and OpenAPI schema stay aligned.
- Use `model_dump()`/serialization controls deliberately when returning data outside FastAPI's response-model pipeline.
- Do not use Ellipsis (`...`) for required fields or parameters — required-ness comes from the absence of a default. Write `price: float = Field(gt=0)` and `name: str`, not `Field(..., gt=0)` or `name: str = ...`.
- Avoid `RootModel`; use plain annotations with validation instead — e.g. `Annotated[list[int], Field(min_length=1), Body()]` — and let Pydantic build the `TypeAdapter` automatically.
- For unions of models use a discriminated union with a `Literal` tag field; for plain unions, order members specific-first, since Pydantic validates members in order.

## Compatibility and Evolution

Additive optional fields are usually safer than renames/removals/type narrowing. Treat these as contract changes:

- field rename/removal,
- optional -> required,
- widening/narrowing enum values,
- changing nullability,
- changing date/time/string formats,
- changing alias/casing,
- changing response nesting.

Contract changes require `openapi-contracts` and generated-client freshness proof.

## Settings Models

Settings schemas use `BaseSettings` from the separate `pydantic-settings` package (it moved out of pydantic core in v2). They should validate required configuration early, but tests must be able to supply alternate settings without touching real secrets. Do not read production-only environment variables during import when an app factory or dependency can inject settings. See `fastapi-patterns` for the `get_settings` dependency seam.

## Anti-Patterns

- Using Pydantic validators to check database ownership or RBAC.
- Returning ORM objects without a response model and hoping serialization hides private fields.
- Hiding a contract change inside `model_config` alias or serialization tweaks.
- Using `Any` to make generated OpenAPI vague because the Python type is inconvenient.
- Mixing Pydantic v1 idioms into a v2 codebase: `@validator`/`@root_validator`, inner `class Config`, `.dict()`/`.json()`, or `orm_mode` instead of their v2 equivalents.
