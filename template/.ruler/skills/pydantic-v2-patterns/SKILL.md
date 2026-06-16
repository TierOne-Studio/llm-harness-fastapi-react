---
name: pydantic-v2-patterns
description: Pydantic v2 patterns for FastAPI request/response schemas, validation, serialization, model_config, computed fields, DTO separation, settings models, and OpenAPI-safe schema evolution. Use when adding or reviewing Pydantic models or schema validation.
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
