---
name: fastapi-security
description: FastAPI API security review for backend changes: OAuth2/JWT/session cookies, Security/Depends auth dependencies, RBAC and tenant scoping, CORS/CSRF, request validation, SQL injection, secret handling, file uploads, rate limiting, and OpenAPI security schemes. Use when backend FastAPI code, API auth, server-side authorization, sensitive data, cross-origin policy, injection, upload/download, or security dependencies change. NOT for frontend-only protected routes, ordinary React data fetching, generic ADRs, or non-security route handlers.
harness:
  tier: backend
  family: backend-fastapi
  gist: "FastAPI auth dependencies, RBAC, CORS/CSRF, injection, secrets, rate limiting, security schemes"
  owners: [main, architect-reviewer, security-reviewer]
---

# FastAPI Security

## Trust Boundaries

- React route guards are UX only. FastAPI must authorize every protected route server-side.
- AuthN/current-user and authz/scope checks should be dependencies or application-service checks with tests for denial paths.
- Multi-tenant queries must scope at the data boundary, not only in a route-level dependency.

## Auth and Sessions

- OAuth2/JWT/bearer flows must use explicit security schemes when they are part of the public API.
- Cookie sessions require CSRF strategy and CORS/credential settings to be documented in `repo-conventions`.
- Signing keys, client secrets, and API keys must load from typed settings or a secret manager — never hardcoded, committed, or read ad hoc from `os.environ` deep in modules.
- Passwords must be stored as a strong adaptive hash (bcrypt, argon2, or scrypt — e.g. via `argon2-cffi` or `pwdlib`), never plaintext or reversible encoding; verify with the library's constant-time check and never roll your own.
- Model inbound secret fields (passwords, API keys, tokens) as Pydantic `SecretStr` so they are not accidentally logged or serialized; unwrap with `.get_secret_value()` only at the point of use.
- Prefer maintained auth/crypto libraries — `PyJWT` or `authlib` over the largely-unmaintained `python-jose`, and `pwdlib`/`argon2-cffi` over `passlib`; pin and track them, since auth-library CVEs are high-severity.
- Prefer short-lived access tokens with separate refresh tokens; validate the token `type` and `exp` claims on every request, and send `WWW-Authenticate: Bearer` on a 401 from a bearer scheme.
- Token, cookie, auth header, and raw PII logging is forbidden.

## Input, Output, and Injection

- Pydantic validates shape, not authorization. Validate ownership, scope, and business rules separately.
- SQL/NoSQL queries must be parameterized through the ORM/query builder or explicit bind parameters.
- API responses should be allowlisted by response model; do not accidentally serialize private ORM fields.

## 401 vs 403

- Missing/invalid credentials should map to 401.
- Authenticated but unauthorized users should map to 403.
- Tests should cover both paths for protected routes, especially tenant/object ownership.

## RBAC, Tenant, and Object Scoping

Tenant scoping belongs where data is selected or mutated. A route-level dependency that loads `tenant_id` is not enough if repositories can still query unscoped rows. Make the tenant/actor context explicit in service/repository calls and test cross-tenant denial.

Role checks are a separate axis from tenancy: a user can be in the right tenant but lack the role for an action. Resolve roles into the actor context and enforce role-specific invariants in the service/domain layer, not only in a route dependency — and test the denied-role path explicitly.

## CORS, Cookies, and CSRF

- Credentialed cross-origin cookies require explicit CORS origins, credentials settings, SameSite/Secure decisions, and CSRF mitigation.
- Bearer-token APIs still need CORS policy and token redaction, but CSRF risk differs from cookie-auth flows.
- Do not "fix" CORS by allowing all origins with credentials.

## WebSocket Security

- WebSocket upgrades are not covered by CORS or most auth middleware — authenticate the handshake explicitly and reject before accepting the connection. Prefer the WebSocket subprotocol header or a short-lived pre-issued ticket over a `?token=` query param, which leaks into access and proxy logs.
- Validate the `Origin` header on the handshake; browsers do not enforce same-origin for WebSockets.
- Re-check authorization for long-lived connections (tokens can expire mid-session) and apply per-connection message-size and rate limits.

## Rate Limiting and Abuse

- Authentication, token, and password-reset endpoints need rate limiting or lockout to resist brute force and account enumeration.
- Rate limiting is infrastructure (reverse proxy/gateway) or a middleware/dependency — decide and document the owner in `repo-conventions`; do not scatter ad hoc counters in route bodies.
- Limit by a stable key (authenticated principal, API key, or client IP behind a trusted proxy) and return `429` with a sane `Retry-After`; never reveal whether an account exists in the response.

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

For any auth/RBAC/CORS/CSRF/tenant/rate-limit/security dependency change, verify:

- denial tests exist for unauthenticated, unauthorized, wrong-tenant, wrong-role, and malformed-input cases;
- server-side checks remain even if React route guards exist;
- sensitive endpoints (auth, password reset, enumeration-prone lookups) have rate limiting or lockout;
- secrets load from typed settings/secret manager, not hardcoded or committed;
- passwords are stored as a strong adaptive hash (bcrypt/argon2), never plaintext;
- OpenAPI security metadata still matches runtime behavior;
- response models do not expose secrets/internal fields;
- logs and errors redact sensitive data.
