---
name: repo-conventions
description: Use ALWAYS when implementing, reviewing, or refactoring executable code in this repository; pair with `tdd-workflow`. ALSO use when discussing this project's architecture, monorepo/workspace layout, the frontend (feature layout, state model, routing, auth flow, forms, styling, data fetching, error handling) OR the backend (FastAPI module layout, repository pattern, authz/RBAC, error handling, logging, DTO style) OR the shared contracts package — even on non-code turns. Documents the conventions specific to THIS fullstack codebase (the stack, the layering, the binding choices on both tiers). NOT for generic React/FastAPI questions (use the stack skills) or read-only investigations of unrelated codebases.
harness:
  tier: shared
  family: process
  gist: "YOUR repo's binding facts (fill-in skeleton, both tiers + seam)"
---

# Repo Conventions (Fullstack)

The grounding skill for *this* fullstack monorepo. Generic advice lives in the stack skills (the `react-*` / `nestjs-*` families); this skill captures the **binding decisions** of *this project* — the choices a contributor cannot infer from generic best practice and must not silently deviate from. Pair it with `tdd-workflow` and `design-review` on any code change. Diverge only with explicit reason and explicit user approval.

> **How to use this skeleton:** fill in each `<!-- FILL IN: ... -->` with what *your* project actually does. Delete sections that don't apply, add ones that do. The libraries named below (Vite, React Router, Zustand, TanStack Query, React Hook Form, Zod, Tailwind, Radix/shadcn on the frontend; FastAPI, TypeORM/Prisma/Mongoose, pytest/Vitest, JWT on the backend) are *illustrations* — record the ones you actually picked. Document load-bearing decisions as ADRs and cite them here for the *why*; this skill captures the *what*. See `documentation-and-adrs` for the discipline.

## 0. Domain glossary

Project-specific terms, roles, and entities a newcomer would otherwise misread. Use these terms exactly in code, tests, commits, and PR descriptions on **both** tiers — drift ("user vs account vs member") surfaces as bugs.

<!-- FILL IN: domain terms and their meanings, e.g. "Workspace = top-level tenant; a User belongs to 1+ Workspaces; the unit of authz scoping." -->

## 1. Monorepo layout & workspaces

This is a fullstack monorepo (commonly npm/pnpm workspaces). Document the workspaces, what each owns, and the rule for "where does this new code go?" — including which tier owns a given concern.

A common layout:

```
<repo>/
├── apps/
│   ├── web/        — the frontend (React + Vite); talks to the API over HTTP
│   └── api/        — the backend (FastAPI); owns persistence, authz, business rules
├── packages/
│   └── contracts/  — OpenAPI schema and generated TypeScript client imported by BOTH tiers (the FE↔BE seam)
└── e2e/            — end-to-end tests (e.g. Playwright) that exercise the live FE↔BE pair
```

<!-- FILL IN: your actual workspace names, the package-manager workspace globs, dev/build/test scripts at the root, and the placement rule (which tier/package owns a new concern). Note any cross-workspace import rules (e.g. apps/* may import generated OpenAPI client but never each other's internals). -->

**Guidance worth keeping — the FE↔BE seam:** the frontend and backend communicate over an HTTP contract. Keep the *types* of that contract in the shared package (§ 17) so a breaking change is a compile error on both sides, not a runtime surprise. Never reach across from `apps/web` into `apps/api` source (or vice-versa) except through the shared package and the HTTP boundary.

## 2. Stack at a glance

The libraries and versions that define how each tier is built. Be specific — version-major matters (React Router 6 vs 7, Tailwind 3 vs 4, FastAPI 10 vs 11).

### Frontend (`apps/web`)

| Concern | Choice |
|---|---|
| Build tool / dev server | <!-- FILL IN: e.g. Vite --> |
| UI library | <!-- FILL IN: e.g. React 19 --> |
| Routing | <!-- FILL IN --> |
| Client state | <!-- FILL IN --> |
| Server cache | <!-- FILL IN --> |
| Forms + validation | <!-- FILL IN --> |
| Styling | <!-- FILL IN --> |
| Unit/component tests | <!-- FILL IN --> |

### Backend (`apps/api`)

- **Framework:** FastAPI (see `apps/api/package.json` for exact version).
- **Database / persistence:** <!-- FILL IN: e.g. Postgres + TypeORM, MongoDB + Mongoose, Prisma. State the default and any fallback. -->
- **Tests:** <!-- FILL IN: e.g. pytest with ts-jest, or Vitest. Where the config lives. -->
- **Other binding choices:** <!-- FILL IN: anything a newcomer would otherwise get wrong. -->

### Shared / cross-cutting

- **Auth:** <!-- FILL IN: the end-to-end flow — how a session is established, where the credential lives in the browser, how it's attached to API requests, how the API verifies it. This spans both tiers; document it once here. -->
- **OpenAPI contracts:** <!-- FILL IN: what lives in generated OpenAPI client and how it's consumed (see § 17). -->

---

## FRONTEND CONVENTIONS (`apps/web`)

## 3. Feature / folder layout (frontend)

How the frontend source tree is organized. Most React apps converge on a **feature-folder** layout (group by domain) or a **layer** layout (group by kind). State which, and the placement rule.

```
apps/web/src/
├── app/         — root entry, layout, route table, global styles
├── features/    — domain modules (each self-contained)
├── shared/      — cross-feature code (UI primitives, hooks, lib, types)
└── test/        — test setup
```

<!-- FILL IN: your actual src/ layout, the placement rule, and whether new top-level dirs need an ADR. Consumers import from a feature's index.ts, not internal sub-paths. -->

## 4. State management (local / context / client store / server cache)

The single most error-prone decision in a React app is *where state lives*. A common four-layer model:

| Layer | Where | When |
|---|---|---|
| Local | `useState`/`useReducer` | Default. Only this component cares. |
| Lifted | Common ancestor via props | 2+ siblings need the same value. |
| Context | React Context provider | App-wide, low-frequency (theme, current user). |
| Client store | e.g. Zustand/Redux | Truly app-wide, frequently-updated client state. |
| Server cache | e.g. TanStack Query | All server state — the source of truth for fetched data. |

**Guidance worth keeping:** server data belongs in the server-cache layer, not duplicated into a client store. With a selector-based store, subscribe via selectors (read one slice) to avoid over-rendering.

<!-- FILL IN: which layers you use, your store location/name, and the rule for promoting local → context → store. -->

## 5. Routing + route guards

<!-- FILL IN: where the route table lives, your guard components, the auth/RBAC pattern, code-splitting policy. -->

**Guidance worth keeping — defense in depth:** route guards are a UX affordance, **not** a security boundary. A guard keeps unauthorized users out of the UI, but **the API must still authorize every request** (§ 12). Never treat a client-side guard as the only check. Centralize permission logic in the guard — don't scatter `if (user.role === ...)` across route components.

## 6. Forms + validation

<!-- FILL IN: form library, validation library, where schemas live, your field/error display pattern. -->

**Guidance worth keeping:** validate on the client for UX, but the **server re-validates** — client validation is never the trust boundary. Wire `aria-invalid` / `aria-describedby` so errors are announced to assistive tech. Prefer the form library's submit handler over hand-rolled `preventDefault` + manual validation. Where possible, derive the form schema from the shared contract (§ 17) so client and server agree on shape.

## 7. Styling

<!-- FILL IN: styling approach, component primitive layer, variant strategy, dark-mode mechanism, where the class-merge helper lives. -->

**Guidance worth keeping:** wrap accessible primitives (e.g. Radix/shadcn) rather than rolling your own dialog/menu/tooltip — you get focus trap, ARIA, and keyboard handling for free. With utility classes, a class-merge helper (`clsx` + `tailwind-merge`) avoids conflicting-class bugs; a variant library (e.g. CVA) keeps variants declarative. Keep design tokens in one place.

## 8. Auth + token storage (frontend side)

<!-- FILL IN: where the token/session lives in the browser, how it's attached to API requests, where session/role helpers live. (The end-to-end auth flow is in § 2 "Shared".) -->

**Guidance worth keeping (security-critical):**
- **Never hardcode secrets in client code** — anything shipped to the browser is public. Client env vars (e.g. `VITE_*`) are visible to every user; put no secrets there.
- Token-in-`localStorage` is convenient but XSS-readable; httpOnly cookies resist XSS but require CSRF defense. State your choice and its tradeoff explicitly (cite an ADR).
- Attach the credential in **one** place (an interceptor or the auth client), not ad hoc per call.

## 9. Data fetching (talking to `apps/api`)

<!-- FILL IN: HTTP client, where service/fetch functions live, query-key conventions, mutation + invalidation pattern, the API base-URL env var (e.g. VITE_API_URL). -->

**Guidance worth keeping:**
- **Type requests and responses from the shared contract** (§ 17), not hand-redeclared interfaces — the shape you send is rarely the shape you get back; model them as distinct types.
- Wrap fetches in named hooks/services, not inline calls in components, so the key, fetch fn, and caching policy live in one place.
- Namespace cache keys per feature so you can invalidate without collateral damage.
- Avoid blind client-side retry loops; only retry genuinely idempotent operations.

## 10. Error handling (frontend)

<!-- FILL IN: error-boundary placement, toast/notification library, how async/fetch errors are rendered. -->

**Guidance worth keeping:** use an error boundary to contain render-time crashes and wrap route/feature trees with it. Surface async errors as visible UI state — don't catch-and-ignore. Map the API's error contract (§ 14) to user-facing messages in one place. Use one notification mechanism, not several in parallel.

---

## BACKEND CONVENTIONS (`apps/api`)

## 11. Module layout (per domain)

How a FastAPI domain module is structured. A common layout is a 4-layer (presentation / application / domain / infrastructure) split with a dependency rule pointing inward; a simpler feature-folder layout is fine for CRUD-only modules. Pick one and apply it consistently. For depth see `fastapi-clean-architecture` and `fastapi-patterns`.

```
apps/api/src/modules/<domain>/
├── api/
│   ├── controllers/<domain>.controller.ts
│   └── dto/<entity>.dto.ts
├── application/
│   └── services/<domain>.service.ts
├── domain/
│   └── repositories/<domain>.repository.interface.ts
├── infrastructure/
│   └── persistence/repositories/<domain>.repository.ts
└── <domain>.module.ts
```

<!-- FILL IN: your actual module layout, where cross-cutting code lives (config, decorators, guards, shared utils), and deviations for CRUD vs rich-domain modules. -->

## 12. RBAC / authz contract

If the app has authorization, this is its most load-bearing backend surface — document the contract so every new route applies it the same way. This is the **real** security boundary behind the frontend's route guards (§ 5). Treat authz as high-risk (defense in depth: guard the route AND scope the query).

<!-- FILL IN: your authz model. Suggested structure below. -->

### Decorator + guard
<!-- FILL IN: how a route declares its required permission/role, and which guard enforces it. -->

### Scope / tenant resolution
<!-- FILL IN: how the request's tenant/scope is resolved, the default, and when cross-tenant access is allowed (and who may). -->

### Error mapping for authz failures
<!-- FILL IN: the exact HTTP code per failure. Generic example: -->

| Failure | HTTP code |
|---|---|
| Authenticated but lacks the required permission | 403 |
| Invalid/malformed request | 400 |
| Missing required context | 403 |

Pick a deliberate hiding-vs-revealing policy (e.g. never return 404 to mask a permission failure) and state it.

### When you write a new route
1. Declare the required permission/role on the handler — no exceptions for "internal" routes.
2. Scope every query by the resolved tenant in the service/repository — never trust the guard alone.
3. Add a negative test (a caller from another tenant / without the permission is rejected).

## 13. Persistence / repository pattern

A common, testable pattern: define a domain interface (port), implement it with your ORM/driver (adapter), and depend on the interface in service code.

```ts
// port (domain)
export interface I<Domain>Repository {
  findById(id: string, tenantId: string): Promise<<Domain> | null>;
}

// adapter (infrastructure) — inject your ORM repo / db client
@Injectable()
export class <Domain>Repository implements I<Domain>Repository {
  async findById(id: string, tenantId: string) {
    /* always scope by tenant — defense in depth */
  }
}
```

<!-- FILL IN: your default persistence approach, the rules, when a fallback (e.g. raw SQL) is allowed, how migrations run, and any module load-order coupling. -->

Common rules worth adopting:
- Always scope tenant-owned queries by the tenant id, even behind a route guard.
- Depend on the interface in service code; wire the concrete via module providers.
- Parameterize all queries — never interpolate user input into SQL.
- Use a transaction for multi-statement writes (see `database-transactions`).

## 14. Error handling (backend)

FastAPI ships built-in HTTP exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`, …) that auto-map to status codes — a common default. Make it uniform so a plain `Error` never silently becomes an unhelpful 500. This error contract is what the frontend maps in § 10 — keep them in sync.

```ts
if (!entity) throw new NotFoundException('Entity not found');
if (!authorized) throw new ForbiddenException('Access denied');
if (!isValid(input)) throw new BadRequestException('Invalid input');
```

<!-- FILL IN: your error contract — built-in exceptions vs a custom error type, whether you use a global exception filter, and where a plain Error is acceptable (bootstrap/config, outside the request lifecycle). -->

## 15. Logger

<!-- FILL IN: your logger choice (FastAPI `Logger`, pino, winston), whether you have request-id/correlation + structured logging, and any redaction helper. -->

### Log-level discipline (adopt or adapt)
- `debug` — dev-time verbose tracing.
- `log`/info — normal-flow milestones worth keeping in prod.
- `warn` — degraded but recoverable / partial failure.
- `error` — an exception about to propagate or a genuine failure. Don't log expected conditions (user input errors) at `error`.

### What to log / never log
Include enough context to debug from the log alone: entity ids, operation name, outcome, caller scope.
NEVER log: passwords or hashes, session/bearer tokens, API keys, PII, billing data, or whole request bodies. If there's no automatic redaction, redact at the call site or don't log the field.

## 16. DTOs and validation

Two common FastAPI approaches: (a) `class-validator` decorators + a global `ValidationPipe` (auto-enforced), or (b) plain types/interfaces with manual validation. Pick one and apply it consistently; separate request shapes from response shapes either way, and derive both from the shared contract (§ 17) where practical.

<!-- FILL IN: your DTO style (types vs validated classes), whether a global ValidationPipe is in place, and where runtime validation of user input happens. -->

---

## SHARED CONVENTIONS

## 17. OpenAPI contracts (`generated OpenAPI client`) — the FE↔BE type seam

The shared package holds the TypeScript types/contracts that BOTH tiers depend on. Getting this seam right is what makes the monorepo pay off.

<!-- FILL IN: what lives here (request/response DTOs, enums, shared Zod schemas, error codes), how each tier imports it, and the build/format (type-only erased at compile time, or a dual-format build when you need shared runtime code like a Zod schema). -->

**Guidance worth keeping:**
- A change to a shared contract is a **backward-compatibility event for both tiers**. Update the producer (API) and every consumer (web) in the same change, or version the contract. A breaking change reflected on only one side is a HIGH-severity defect.
- Prefer type-only exports (erased at compile time → no runtime coupling between an ESM frontend and a CommonJS backend). When you need shared *runtime* code (e.g. a Zod schema used by both), give the package a dual-format build step.
- Don't duplicate a contract type by hand on either side — import it. Hand-redeclared shapes drift.

## 18. Testing

| Tier | Layer | Common tooling | Lives in |
|---|---|---|---|
| Frontend | unit/component | Vitest + Testing Library | co-located `*.test.tsx` |
| Backend | unit | pytest (or Vitest) | co-located `*.spec.ts` |
| Backend | integration/e2e | TestClient/httpx / Nest testing module | `*.e2e-spec.ts` |
| Seam | end-to-end | Playwright | top-level `e2e/` |

<!-- FILL IN: your runners + config locations, the unit/component/e2e split per tier, where the FE↔BE Playwright suite lives, the coverage commands, and the root npm scripts. -->

**Guidance worth keeping:**
- Frontend: query by accessible attributes first (role → label → text), test-ids last; prefer user-event over low-level fire-event; wait on UI/network state, **no arbitrary sleeps**.
- Backend: test through the module's public surface; mock at the port (repository interface), not the ORM.
- **Always test the unauthorized/failure path** on both tiers — guard bypass, expired session, network error, empty state, cross-tenant access.
- The `e2e/` suite proves the contract holds across the real seam — keep at least a smoke path green.

## 19. Naming conventions

State the naming rules per tier so the codebase stays scannable.

**Frontend:** <!-- FILL IN: file casing (PascalCase components? kebab-case files?), hook naming, type naming, test file naming. --> Common defaults: hooks are `useX` and read like sentences (`useUserProfile`, not `useGetUser`); components are PascalCase.

**Backend:** <!-- FILL IN: class suffixes + file casing. Generic starting point: -->

| Suffix | Used for |
|---|---|
| `Service` | Application services (business logic) |
| `Controller` | HTTP route handlers |
| `Module` | FastAPI modules |
| `Repository` | Data-access classes |
| `Guard` | Auth/permission guards |

File names kebab-case with explicit suffixes (`<domain>.controller.ts`). Avoid `Manager`/`Helper`/`Util` as primary suffixes — they signal fuzzy responsibility (see `design-review` anti-patterns).

## 20. Anti-patterns (don't do these here)

<!-- FILL IN: your repo's real, observed anti-patterns. Common candidates worth keeping if they apply: -->

**Frontend:**
- Don't duplicate server state into a client store — let the server cache own it.
- Don't put permission/role checks inline in route components — centralize in the guard.
- Don't roll your own dialog/menu/tooltip — wrap an accessible primitive.
- Don't store secrets in client-side env vars.

**Backend:**
- Unparameterized SQL — always use placeholders; never concatenate user input.
- Tenant leakage via a missing scope filter — check every query when reviewing repository changes.
- Skipping the negative/unauthorized test — it's what catches authz regressions.
- Logging PII — every un-redacted log call is a potential leak point.

**Shared / seam:**
- Hand-redeclaring a contract type on one side instead of importing from `generated OpenAPI client`.
- Shipping a breaking contract change on only one tier.

## 21. When to deviate

No convention is absolute. Small in-scope deviations are fine with a comment explaining why. **Structural** changes (a new workspace, a new state library, a new auth mechanism, a new persistence layer, a new public-API/contract shape) are load-bearing decisions — document them as an ADR and cite it here, rather than restating the rationale inline. State the deviation explicitly in the response, name the reason, and propose updating this skill in the same change. NEVER deviate silently.

## Cross-references

- Frontend stack skills (`react-patterns`, `react-state-management`, `react-routing`, `react-forms`, `react-data-fetching`, `react-performance`, `accessibility`, `frontend-security`, `bundle-size`, `vite`, `vitest`, `shadcn`, `tailwind-v4-shadcn`, `playwright-best-practices`) — generic advice not specific to this repo.
- Backend stack skills (`fastapi-best-practices`, `fastapi-clean-architecture`, `fastapi-patterns`, `python-best-practices`, `database-transactions`, `db-write-protocol`) — same, for the API tier.
- `tdd-workflow`, `design-review`, `plan-mode`, `cross-repo-workspace` — process skills.
- `documentation-and-adrs` — ADR format and citation flow.
