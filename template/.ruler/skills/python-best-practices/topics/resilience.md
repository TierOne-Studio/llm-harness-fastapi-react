# Resilience

Resilience is bounded, deliberate, and idempotency-aware — not defensive retries
sprinkled everywhere. The caller owns retry policy; lower layers fail fast with context.
For the asyncio mechanics (`asyncio.timeout`, cancellation, bounding concurrency), see
`async-python-patterns`.

## Timeouts (always, on every outbound call)

- Every network/DB/external call gets an explicit timeout. A call with no timeout can hang a worker forever and exhaust the pool.
- Set timeouts at the client (`httpx.AsyncClient(timeout=...)`, DB statement/pool timeouts) and, for a specific call, wrap with `asyncio.timeout(seconds)` (3.11+) / `asyncio.wait_for`.
- Distinguish connect vs read vs total timeouts where the client supports it; a slow body is different from an unreachable host.
- Pick timeouts from the dependency's real latency budget, not a round number — and make them configurable via settings (`fastapi-patterns`).

## Retries: bounded and idempotency-aware

- **Do not blind-retry non-idempotent operations** (POST that charges a card, sends an email, decrements stock). A retry after a timeout may double the effect. Make the operation idempotent first (idempotency key, dedup, `INSERT … ON CONFLICT`) — then retrying is safe.
- Retries are **bounded**: a max attempt count AND a deadline. Unbounded retry loops turn a brief outage into a self-inflicted outage.
- Only retry **transient** failures (connection reset, 503, 429, deadlock) — never 4xx validation/auth errors; retrying those just wastes the budget.
- Don't stack retries at multiple layers (client retries × service retries × caller retries = combinatorial load). Decide one layer owns it; the others fail fast.

## Backoff & jitter

- Use exponential backoff with jitter, not a fixed sleep — synchronized clients retrying on the same interval create a thundering herd that prolongs the outage.
- Respect a server's `Retry-After` header for 429/503 over your own computed backoff.
- Cap the backoff (a max delay) and the total elapsed time; surface the final failure with timing/url/status context instead of retrying into the void.

## Circuit breaking & shedding

- When a dependency is failing fast and often, a circuit breaker (open → fail immediately for a cooldown → half-open probe) stops you from hammering a dead service and lets it recover. Use the repo's chosen library; don't hand-roll subtle state.
- Prefer failing fast with a clear error over queueing unbounded work behind a slow dependency (bounded queues / load shedding) — backpressure beats memory exhaustion.
- Degrade gracefully where the product allows: a non-critical dependency being down should degrade the feature, not blank the whole response (see the `Promise.allSettled`-style fan-in in `async-python-patterns` / `async-error-handling`).

## Idempotency & consistency

- For multi-step writes, make the unit atomic (one transaction) or compensating — never leave a partial write on failure. See `database-transactions`.
- An idempotency key (client-supplied or derived) lets a safe retry collapse to one effect; persist it with the result.

## Review smells

- A retry loop with no max count or no deadline.
- Retrying a POST/charge/send without an idempotency guarantee.
- A `requests`/`httpx` call with no timeout.
- Fixed-interval retries (no jitter) across many clients.
- Catching a timeout only to immediately retry in the same function, hiding the latency from the caller.
