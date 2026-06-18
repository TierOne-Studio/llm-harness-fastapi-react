---
name: pydantic-v2-patterns
description: Pydantic v2 patterns for FastAPI request/response schemas, validation, serialization, model_config, computed fields, DTO separation, settings models, and OpenAPI-safe schema evolution. Use when adding or reviewing Pydantic models, request/response DTOs, settings models, or schema validation. NOT for backend architecture discussions that do not mention Pydantic/schema validation.
harness:
  tier: backend
  family: backend-fastapi
  gist: "Pydantic v2 schema design, validation, serialization, settings, DTO evolution"
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
- Response DTOs model the public API. They should be allowlisted and stable for generated clients.
- Domain models/entities should not depend on FastAPI request/response DTOs unless the repo explicitly chooses that tradeoff.
- Persistence/ORM models are not public response models by default.

## Pydantic v2 Practices

- Use `model_config` intentionally for ORM/from-attributes behavior, alias handling, strictness, and extra-field policy.
- Prefer explicit field types and validators over broad `dict[str, Any]`.
- Use computed/serialized fields only when the runtime value and OpenAPI schema stay aligned.
- Use `model_dump()`/serialization controls deliberately when returning data outside FastAPI's response-model pipeline.

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

Settings schemas should validate required configuration early, but tests must be able to supply alternate settings without touching real secrets. Do not read production-only environment variables during import when an app factory or dependency can inject settings.

## Anti-Patterns

- Using Pydantic validators to check database ownership or RBAC.
- Returning ORM objects without a response model and hoping serialization hides private fields.
- Hiding a contract change inside `model_config` alias or serialization tweaks.
- Using `Any` to make generated OpenAPI vague because the Python type is inconvenient.
