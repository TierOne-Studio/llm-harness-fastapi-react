---
name: async-error-handling
description: Use when writing or reviewing async code in JavaScript/TypeScript — Promise composition (Promise.all/allSettled/race), error propagation, AbortSignal/timeouts, top-level handlers, where to catch vs let propagate. Applies to React data fetching, hooks, event handlers, and the non-React async paths in the frontend. The throw-don't-return-null / catch-at-the-boundary / no-retries philosophy is cross-tier, but native Python asyncio mechanics (event loop, gather/TaskGroup, cancellation, executors) live in async-python-patterns. NOT for synchronous code, framework-internal lifecycle handlers, or simple sequential awaits with no error-flow decision.
harness:
  tier: shared
  family: language
  gist: "Promise composition, AbortSignal, where to catch"
---

# Async Error Handling

The most LLM-error-prone area in JS/TS. The default model habits — wrapping every method in try/catch, returning `null` instead of throwing, defensively retrying — actively violate this codebase's fail-fast principle. This skill encodes the correct JS/TS patterns and the failure modes to catch.

**Scope.** The *error-flow philosophy* below — throw don't return `null`, catch at the boundary not every layer, no retries, fail fast — is cross-tier and worth reading on either side. But the concrete *mechanics* (Promise composition, `AbortSignal`) are JavaScript/TypeScript. Native **Python asyncio** mechanics on the FastAPI backend (event loop discipline, `gather`/`TaskGroup`, `asyncio.timeout`, cancellation, `run_in_executor`) live in **`async-python-patterns`** — the backend snippets here are TS-style pseudocode kept only to show the shared philosophy in a service/repository/boundary shape.

## When this fires

- Composing parallel async work (`Promise.all`, `Promise.allSettled`, `Promise.race`).
- Calling external services (HTTP, auth, DB) where partial failure is possible.
- Implementing timeouts, cancellation, or backpressure.
- Choosing where in a layered call chain to catch a specific error.
- Reviewing existing async code for silent-failure or wrong-layer-catch issues.
- TanStack Query / React Hook Form / event-handler async flows where errors affect UI state (frontend).

## When this does NOT fire

- Single `await` followed by `return` with no error-flow decision.
- Synchronous control flow.
- React lifecycle inside `useEffect` cleanup (just don't crash; framework swallows).
- FastAPI lifespan startup/shutdown — let it throw; the app fails to start, which is correct.
- Native Python asyncio mechanics (`gather`/`TaskGroup`, `asyncio.timeout`, cancellation, offloading blocking calls) — use `async-python-patterns`.

## Core rules (override LLM defaults)

1. **Throw, don't return null.** Returning `null` to signal failure forces every caller to check, drops error context, and violates explicitness. On the backend, throw a FastAPI exception (`ForbiddenException`, `BadRequestException`, `NotFoundException`, etc.). On the frontend, throw a typed `Error` (or framework-typed exception per `repo-conventions`) and let TanStack Query / the error boundary / the toast handler surface it.

2. **Catch at the boundary, not at every layer.** Backend: a repository throws → the service lets it propagate → the controller's exception filter maps it to HTTP. Frontend: a service throws → the query/mutation hook lets it propagate → TanStack Query surfaces `error` via its return value → the consuming component renders an error state. Catching mid-stack only to rethrow is noise.

3. **Never catch-and-ignore.** `try { ... } catch {}` is forbidden. If you genuinely don't care about the error, log at `warn` with context AND comment why ignoring is correct.

4. **No retries.** Per CLAUDE.md P5. The caller decides retry policy; let the failure propagate with timing/URL/status context. On the frontend, TanStack Query has its own retry config — set it intentionally (e.g., `retry: false` for mutations) instead of wrapping fetches in custom retry loops.

5. **Fail fast at boundaries.** Validate inputs at the entry point — the controller (backend) or the form / route entry (frontend); surface invalid state early. Don't let bad data flow into the domain / data layer and crash unexpectedly.

## Promise composition (decision tree)

```
Multiple async ops, all must succeed:        Promise.all
Multiple async ops, partial success is OK:   Promise.allSettled
Take whichever completes first:              Promise.race
First success, ignore rejections:            Promise.any
Sequential dependence (b uses a's result):   await a; await b
Parallel-independent in a loop:              Promise.all(items.map(...))
Sequential in a loop:                        for-of with await (NOT .forEach)
```

### Common LLM mistake: `await` inside `.map()` is parallel, not sequential

```ts
// ❌ This runs all in parallel — items[i] doesn't wait for items[i-1]
items.map(async (item) => await processOne(item))

// ✅ Parallel (when that's what you want):
await Promise.all(items.map(item => processOne(item)))

// ✅ Sequential (when each step depends on the previous):
for (const item of items) {
  await processOne(item)
}
```

### Common LLM mistake: `Promise.all` when one rejection is acceptable

Frontend (React) — fanning out over independent data sources to build one view:

```ts
// ❌ Fetching from N data sources; one failure kills the whole render
const results = await Promise.all(sources.map(s => s.search(query)))

// ✅ Per-source independence:
const settled = await Promise.allSettled(sources.map(s => s.search(query)))
const ok = settled.filter((r): r is PromiseFulfilledResult<Result[]> => r.status === 'fulfilled').map(r => r.value)
const failed = settled.filter(r => r.status === 'rejected')
if (failed.length > 0) console.warn('partial source failure', { failedCount: failed.length })
return ok
```

Backend (FastAPI) — fanning out over independent data sources in a service:

```ts
// ❌ Fetching from 3 data sources; one failure kills everything
const results = await Promise.all(sources.map(s => s.search(query)))

// ✅ Per-source independence (chat-agent style):
const settled = await Promise.allSettled(sources.map(s => s.search(query)))
const ok = settled.filter(r => r.status === 'fulfilled').map(r => r.value)
const failed = settled.filter(r => r.status === 'rejected')
if (failed.length > 0) this.logger.warn('partial source failure', { failedCount: failed.length })
return ok
```

This pattern fits any fan-out over independent sources (e.g. firing several API calls in parallel to build one view, or querying several data sources and merging results): one slow or failing source shouldn't blank the whole result.

## Try/catch placement: at the boundary

The model habit is to wrap every function:

```ts
// ❌ Defensive try/catch everywhere — kills typed errors, adds noise, hides root cause
async function fetchProject(id: string) {
  try {
    return await api.get(`/projects/${id}`)
  } catch (e) {
    console.error('fetch failed', e)
    throw e   // re-throwing means the catch did nothing useful
  }
}
```

The correct shape: let typed errors propagate; catch only when you're transforming or genuinely handling.

Frontend (React) — axios throws on non-2xx; the query hook surfaces it; the component renders error state:

```ts
// ✅ axios throws on non-2xx; the query hook surfaces it; the component renders error state
async function fetchProject(id: string): Promise<Project> {
  const res = await api.get<Project>(`/projects/${id}`)
  return res.data
}

// In the component:
const { data, error, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => fetchProject(id) })
if (error) return <ErrorState error={error} />
```

Backend (FastAPI) — service throws a domain exception; FastAPI maps it to HTTP:

```ts
// ✅ Repo throws ForbiddenException; service propagates; FastAPI maps to 403
async findOne(id: string, organizationId: string) {
  const project = await this.repo.findById(id, organizationId)
  if (!project) throw new NotFoundException(`Project ${id} not found`)
  return project
}
```

### Valid reasons to catch

- **Transform** — catch low-level error, throw a higher-level one with more context.
- **Recover** — catch a specific failure mode and substitute a fallback (rare; prove the fallback is correct).
- **Boundary fan-in** — at a chat-agent, API-aggregator, or API-gateway level, mapping multiple kinds of upstream errors to a uniform response.
- **User-action handler** (frontend) — in a `<button onClick>` async handler, you typically `try { await mutate(...); toast.success(...) } catch (e) { toast.error(...) }` because the boundary IS the click handler.

### Forbidden reasons to catch

- "Just to log" — the exception filter (backend) / TanStack Query / error boundaries (frontend) log already if configured.
- "Just to be safe" — defensive programming becomes silent failure.
- "Because the linter complained" — fix the linter rule.
- "To return `null` instead" — see core rule #1.

## Timeouts and cancellation

Use `AbortSignal.timeout(ms)` (Node 18+ / modern browsers) for outbound calls. Propagate the signal so cancellation cascades. On the frontend, TanStack Query passes a `signal` to `queryFn` automatically — wire it through.

Frontend (React) — wire through the TanStack Query `signal`:

```ts
async function fetchProject({ signal }: QueryFunctionContext) {
  const timeoutSignal = AbortSignal.timeout(5_000)
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  const res = await fetch(`/api/projects/${id}`, { signal: combined })
  if (!res.ok) throw new Error(`upstream ${res.status}`)
  return res.json()
}
```

Backend (FastAPI) — accept an optional caller signal and combine with a timeout:

```ts
async fetchExternal(query: string, signal?: AbortSignal): Promise<Result> {
  const timeoutSignal = AbortSignal.timeout(5_000)
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
  const res = await fetch(this.url, { signal: combined })
  if (!res.ok) throw new HttpException(`upstream ${res.status}`, res.status)
  return res.json()
}
```

### Common LLM mistake: timeout via `Promise.race` without cleanup

```ts
// ❌ Operation continues running after race completes; resource leak; can't actually cancel the fetch
await Promise.race([slowOp(), new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))])

// ✅ AbortSignal cancels the underlying op
await fetch(url, { signal: AbortSignal.timeout(5000) })
```

## Top-level handlers

The runtime crashes on unhandled rejections by default — browsers fire an `unhandledrejection` event, Node 15+ exits the process. **Don't add a global handler (`window.addEventListener('unhandledrejection', ...)` in the browser, `process.on('unhandledRejection', ...)` in Node) just to swallow them — that defeats the safety.**

- Frontend: wire a real error monitor (Sentry, Bugsnag) at the app boundary if you need observability; otherwise let the dev console surface them. React's error boundary handles render-time errors; for async work outside the render tree (e.g., a `setInterval` callback you've added to global state), wrap the callback body in try/catch and decide.
- Backend: FastAPI's exception filter handles request-scoped errors; for true top-level work (e.g., a `setInterval` callback), wrap the callback body in try/catch and log + decide.

## Common LLM mistakes (catch these in `code-reviewer`)

1. **Defensive try/catch around every await.** Each one obliterates typed errors. Catch only when transforming or recovering or at the user-action boundary.
2. **Returning `null` on failure.** Throw with context — a FastAPI exception on the backend, a typed `Error` on the frontend.
3. **`await` inside `.map()` thinking it's sequential.** It runs in parallel.
4. **`.forEach(async ...)`.** Doesn't await — fire-and-forget. Use `for-of` or `Promise.all(map)`.
5. **`Promise.all` when partial-success is acceptable.** Use `Promise.allSettled`.
6. **Custom timeout via `Promise.race`.** Use `AbortSignal.timeout()`.
7. **Catching to log then re-throw.** The boundary (exception filter / TanStack Query / error boundary) handles it. The catch does nothing.
8. **Adding retries.** Forbidden by CLAUDE.md P5. The caller decides. If your data-fetching layer has built-in retries (e.g. TanStack Query), don't roll your own around it.
9. **Async functions returning `Promise<void>` and the caller not awaiting** — fire-and-forget. The error vanishes.
10. **`async` keyword on a function that has no `await`.** Wraps the return value in a Promise needlessly. Drop the keyword.
11. **Not propagating the `signal` from TanStack Query to the underlying fetch** (frontend). Cancellation never cascades; users navigate away but the request keeps running.

## Repo-fit examples

Frontend (commonly `apps/web`):

- `useChat` mutation — when a chat send fails, surface via toast + leave the optimistic message in an error state. Don't auto-retry.
- Multi-source chat agent search — should use `Promise.allSettled` so one source's failure doesn't blank the response.
- `axios` interceptors — don't add catch-all interceptors that swallow errors. Map specific status codes to typed errors and rethrow.
- `useEffect` async work — wrap in an inner `async` IIFE; abort on cleanup via `AbortController`.

Backend (commonly `apps/api`):

- Service-level parallel per-source search across a data-source array — should use `Promise.allSettled` so one source's failure doesn't blank the response. Filter to `ready` sources first (per `repo-conventions`).
- Repository methods (`*.database-repository.ts`) — let DB errors propagate; the service throws domain exceptions (`NotFoundException` etc.); the exception filter maps to HTTP.
- External HTTP calls — wrap in `AbortSignal.timeout()`; throw `HttpException` on non-2xx; let it propagate.

## Cross-references

- `async-python-patterns` — the Python asyncio counterpart (event loop, `gather`/`TaskGroup`, cancellation, executors); the right skill for FastAPI/Python backend async.
- `repo-conventions` § "Error handling" — the error surfaces this codebase uses (FastAPI exception types on the backend; toast, error boundary, query error state on the frontend).
- `failure-mode-analysis` — `network` and `partial` categories enumerate failure modes this skill helps handle.
- `react-data-fetching` — TanStack Query patterns and error-state UX (frontend).
- `fastapi-patterns/patterns/cross-cutting.md` — exception filter is the boundary handler (backend).
- `database-transactions` — error flow across transaction boundaries; an in-flight failure must roll back, not be swallowed (backend).
- `CLAUDE.md` P5 — fail-fast, no retries, root-cause focus.
