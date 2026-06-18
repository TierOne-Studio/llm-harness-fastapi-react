---
name: fastapi-security
description: FastAPI API security review for backend changes: OAuth2/JWT/session cookies, Security/Depends auth dependencies, RBAC and tenant scoping, CORS/CSRF, request validation, SQL injection, secret handling, file uploads, rate limiting, and OpenAPI security schemes. Use when backend FastAPI code, API auth, server-side authorization, sensitive data, cross-origin policy, injection, upload/download, or security dependencies change. NOT for frontend-only protected routes, ordinary React data fetching, generic ADRs, or non-security route handlers.
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

## 401 vs 403

- Missing/invalid credentials should map to 401.
- Authenticated but unauthorized users should map to 403.
- Tests should cover both paths for protected routes, especially tenant/object ownership.

## Tenant and Object Scoping

Tenant scoping belongs where data is selected or mutated. A route-level dependency that loads `tenant_id` is not enough if repositories can still query unscoped rows. Make the tenant/actor context explicit in service/repository calls and test cross-tenant denial.

## CORS, Cookies, and CSRF

- Credentialed cross-origin cookies require explicit CORS origins, credentials settings, SameSite/Secure decisions, and CSRF mitigation.
- Bearer-token APIs still need CORS policy and token redaction, but CSRF risk differs from cookie-auth flows.
- Do not "fix" CORS by allowing all origins with credentials.

## OpenAPI Security Schemes

When auth is part of the public contract, use FastAPI security dependencies/schemes so `/docs`, generated clients, and consumers see the requirement. If `Security` scopes are used, keep scope names stable and documented.

## Logging and Observability

- Redact authorization headers, cookies, refresh tokens, passwords, API keys, and raw PII.
- Correlation/request IDs are useful; dumping request bodies is usually not.
- Failed auth logs should explain class of failure without leaking token contents or account enumeration details.

## Uploads and Downloads

- Validate content type, size, and file extension at the server boundary.
- Store uploads outside executable paths; never trust user filenames for paths.
- Downloads should check authorization for the specific object, not only that the user is authenticated.

## Review Checklist

For any auth/RBAC/CORS/CSRF/tenant/security dependency change, verify:

- denial tests exist for unauthenticated, unauthorized, wrong-tenant, and malformed-input cases;
- server-side checks remain even if React route guards exist;
- OpenAPI security metadata still matches runtime behavior;
- response models do not expose secrets/internal fields;
- logs and errors redact sensitive data.
