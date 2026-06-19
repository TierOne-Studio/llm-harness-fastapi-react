---
name: async-python-patterns
description: Python asyncio mechanics — never blocking the event loop, run_in_executor/anyio.to_thread for blocking calls, structured concurrency with TaskGroup vs gather, asyncio.timeout, bounding concurrency with Semaphore, cancellation and CancelledError discipline, async context managers and async generators, and fire-and-forget/orphan-task pitfalls. Use when writing or reviewing native Python async code. NOT for JavaScript/TypeScript async (async-error-handling), FastAPI route/dependency wiring (fastapi-patterns), or generic async-boundary policy (python-best-practices).
harness:
  tier: backend
  family: backend-fastapi
  gist: "asyncio: TaskGroup/gather, timeout, Semaphore, cancellation, executors"
  owners: [main, architect-reviewer, code-reviewer, qa-validator]
---

# Async Python Patterns

The asyncio mechanics that LLM-written Python most often gets wrong. This is the Python
counterpart to `async-error-handling` (which owns JS/TS Promise composition and is the
right skill for the frontend). For *where* to put async boundaries and the fail-fast
error policy, see `python-best-practices`; for FastAPI `Depends`/lifespan wiring, see
`fastapi-patterns`.

## Cardinal rule: never block the event loop

One event loop runs everything in the process. A synchronous blocking call inside a
coroutine freezes *every* concurrent request until it returns.

- Blocking offenders in an `async def`: `requests`, `time.sleep`, a sync DB driver, `open()/read()` on a slow disk, `subprocess.run`, CPU-bound loops, `bcrypt`/hashing.
- Use the async-native client instead (`httpx.AsyncClient`, `asyncio.sleep`, an async DB driver). When no async version exists, offload to a thread:

```python
import asyncio
from functools import partial

# ✅ blocking call moved off the loop
result = await asyncio.to_thread(blocking_fn, arg)          # 3.9+
# or, with a specific executor:
loop = asyncio.get_running_loop()
result = await loop.run_in_executor(None, partial(blocking_fn, arg))
```

- CPU-bound work belongs in a process pool (`ProcessPoolExecutor`) or a worker, not a thread — the GIL makes threads useless for CPU. (Durable/long jobs → a queue/worker, see `fastapi-patterns` § Background Tasks.)
- Under AnyIO/`asyncio`, `anyio.to_thread.run_sync` is the portable offload.

## Structured concurrency: prefer TaskGroup

`asyncio.TaskGroup` (3.11+) is the default for running several coroutines concurrently:
it awaits all children, and if one raises, it cancels the siblings and propagates.

```python
async with asyncio.TaskGroup() as tg:
    a = tg.create_task(fetch_user(uid))
    b = tg.create_task(fetch_orders(uid))
# both done here; a.result() / b.result() are safe
```

- TaskGroup gives you no orphaned tasks and no swallowed errors — the failure modes `gather` invites.
- Use `asyncio.gather(*coros)` when you need its specific behavior: it returns results positionally and, with `return_exceptions=True`, collects failures instead of cancelling siblings — the Python equivalent of `Promise.allSettled` for independent fan-out where one failure shouldn't blank the rest.

```python
# fan-out over independent sources; one failure must not kill the others
results = await asyncio.gather(*(src.search(q) for src in sources), return_exceptions=True)
ok = [r for r in results if not isinstance(r, Exception)]
failed = [r for r in results if isinstance(r, Exception)]
if failed:
    logger.warning("partial_source_failure", failed=len(failed))
```

- Default `gather` (without `return_exceptions`) raises the first exception but leaves the other tasks running — prefer TaskGroup unless you specifically want allSettled semantics.
- `asyncio.as_completed(coros)` when you want to process results as they arrive rather than waiting for all.

## Timeouts

```python
async with asyncio.timeout(5):      # 3.11+, cancels the body if it overruns
    data = await slow_call()
# older: data = await asyncio.wait_for(slow_call(), timeout=5)
```

- Every await on an external resource has a bound — at the client and/or with `asyncio.timeout`. An unbounded await can pin a worker forever. See `python-best-practices` § resilience for retry/backoff policy.
- A timeout cancels the wrapped task by raising `CancelledError` inside it — which is why cleanup must live in `finally`/`async with`.

## Bounding concurrency

Unbounded fan-out (`gather` over 10k items) opens 10k sockets and exhausts the pool. Bound it:

```python
sem = asyncio.Semaphore(10)
async def guarded(item):
    async with sem:
        return await fetch(item)
async with asyncio.TaskGroup() as tg:
    tasks = [tg.create_task(guarded(i)) for i in items]
```

- A `Semaphore` (or a worker-pool/`Queue`) caps in-flight work. Pick the bound from the downstream's capacity, not the input size.

## Cancellation discipline

- `asyncio.CancelledError` is **not an error to swallow** — it's how timeouts and shutdown unwind tasks. Never catch it in a broad `except Exception` (in 3.8+ it derives from `BaseException`, so `except Exception` won't catch it — but `except BaseException` or a bare `except` will; don't).
- If you must catch it for cleanup, re-raise:

```python
try:
    await work()
except asyncio.CancelledError:
    await rollback()
    raise                      # propagate so the cancellation completes
```

- Put resource release in `finally`/`async with`, not after the await — a cancellation skips code after the await point.
- Use `asyncio.shield(coro)` only for a critical section that must finish even if the caller is cancelled (rare); overusing it leaks tasks that ignore shutdown.

## Async context managers & generators

- Own async resources with `async with` (sessions, clients, locks). Write your own with `@contextlib.asynccontextmanager` and release in `finally`.
- Async generators must be closed so their `finally` runs; use `contextlib.aclosing(agen)` when iterating partially, or let `async for` consume fully.
- Don't mix sync iteration over async sources — use `async for`.

## Fire-and-forget & orphan tasks

- `asyncio.create_task(coro())` outside a TaskGroup returns a task you must keep a reference to and `await` (or add a done-callback that logs exceptions). A bare `create_task` whose result is never awaited can be garbage-collected mid-flight, and its exception vanishes.
- A coroutine called without `await` (`do_work()` instead of `await do_work()`) never runs — a silent no-op with only a `RuntimeWarning: coroutine was never awaited`.
- Don't call `asyncio.run()` inside an already-running loop (e.g. inside a FastAPI handler) — it raises. You're already in the loop; just `await`.
- `async def` with no `await` inside wraps a value in a coroutine for nothing — drop `async` or make it actually await.

## Review smells

- A blocking call (`requests`, `time.sleep`, sync DB, hashing, `subprocess`) inside `async def` on the hot path.
- `gather` over a large unbounded collection with no `Semaphore`.
- `except Exception`/bare `except` wrapping an await that can be cancelled, swallowing `CancelledError`.
- Cleanup placed after an await instead of in `finally`/`async with`.
- `create_task` whose handle is dropped (orphan; lost exception).
- A coroutine invoked without `await`; an `async def` with no `await`.
- An external await with no timeout.

## Cross-references

- `async-error-handling` — the JS/TS counterpart (Promise composition, AbortSignal); the right skill on the frontend.
- `python-best-practices` § async-boundaries / § resilience — where boundaries go; timeout/retry policy.
- `fastapi-patterns` — `Depends`/lifespan/background tasks; durable work belongs in a worker, not a fire-and-forget task.
- `database-transactions` — a cancellation mid-write must roll back, not leave a partial commit.
