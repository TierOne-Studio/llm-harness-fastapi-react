---
name: fastapi-security
description: FastAPI API security review: OAuth2/JWT/session cookies, Security/Depends auth dependencies, RBAC and tenant scoping, CORS/CSRF, request validation, SQL injection, secret handling, file uploads, rate limiting, and OpenAPI security schemes. Use for auth, sessions, RBAC, PII, secrets, cross-origin, injection, upload/download, or dependency changes.
harness:
  tier: backend
  family: backend-fastapi
  gist: "FastAPI auth dependencies, RBAC, CORS/CSRF, injection, secrets, security schemes"
---

# FastAPI Security

## Trust Boundaries

- React route guards are UX only. FastAPI must authorize every protected route server-side.
- AuthN/current-user and authz/scope checks should be dependencies or application-service checks with tests for denial paths.
- Multi-tenant queries must scope at the data boundary, not only in a route guard/dependency.

## Auth and Sessions

- OAuth2/JWT/bearer flows must use explicit security schemes when they are part of the public API.
- Cookie sessions require CSRF strategy and CORS/credential settings to be documented in `repo-conventions`.
- Token, cookie, auth header, and raw PII logging is forbidden.

## Input, Output, and Injection

- Pydantic validates shape, not authorization. Validate ownership, scope, and business rules separately.
- SQL/NoSQL queries must be parameterized through the ORM/query builder or explicit bind parameters.
- API responses should be allowlisted by response model; do not accidentally serialize private ORM fields.
