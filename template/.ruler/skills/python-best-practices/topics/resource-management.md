# Resource Management

Every acquired resource — DB session, connection, file handle, socket, lock, client —
must have a deterministic release on every path, including the error path. Leaks show up
as exhausted pools, "too many open files", and flaky tests under load.

## Always use a context manager

- Acquire resources with `with`/`async with`, never a bare `open()`/`connect()` you hope to close later. The context manager releases on success, exception, and early return alike.

```python
# ❌ leaks the handle if read() raises
f = open(path)
data = f.read()
f.close()

# ✅ released on every path
with open(path) as f:
    data = f.read()
```

- For an async resource (DB session, `httpx.AsyncClient`, async lock) use `async with`. A FastAPI dependency that owns a resource should `yield` it and release in `finally` (see `fastapi-patterns` § Dependency Lifecycle).
- Acquire multiple resources in one `with a, b:` (or nested) so all are released in reverse order.

## Writing your own

- Prefer `@contextlib.contextmanager` (or `@asynccontextmanager`) over a hand-written `__enter__`/`__exit__` class for simple setup/teardown:

```python
from contextlib import contextmanager

@contextmanager
def advisory_lock(conn, key):
    conn.execute("SELECT pg_advisory_lock(%s)", [key])
    try:
        yield
    finally:
        conn.execute("SELECT pg_advisory_unlock(%s)", [key])
```

- Put the release in `finally` so it runs even when the body raises. Don't release after the `yield` without a `finally` — an exception would skip it.
- Use `contextlib.ExitStack` / `AsyncExitStack` to manage a dynamic number of resources, or to conditionally enter one, without deep nesting.
- `contextlib.closing(thing)` adapts an object that has `.close()` but isn't a context manager. `contextlib.suppress(SomeError)` replaces a `try/except: pass` when ignoring is genuinely intended.

## Pools & long-lived clients

- Connection pools (DB, HTTP) and clients are created **once** at startup (lifespan/app factory — `fastapi-patterns`), reused per request, and closed on shutdown. Do not open a new client/engine per request — it defeats pooling and leaks connections.
- Size the pool deliberately and set acquire/checkout timeouts; an undersized pool with no timeout deadlocks under load.
- Request-scoped sessions/clients must not be shared across concurrent requests or stored in module globals — see "Lifetime & sharing".

## Lifetime & sharing

- A request-scoped session/client lives and dies within one request. Capturing it in a closure, background task, or module-level variable outlives its transaction and corrupts the next request.
- Mutable module-level state is allowed only if it is read-only after startup (config, compiled regex, a singleton pool). Anything written per-request belongs in request scope.
- Release locks/semaphores in `finally`; a lock leaked on an error path stalls every waiter.

## Determinism: clocks, IDs, randomness

- Inject clocks, ID generators, and randomness for code whose tests must assert exact behavior. Don't bury `datetime.now()`, `uuid4()`, or `random.*` inside business logic — pass a `Clock`/`IdGenerator` port (`Protocol`) so tests substitute a fake (see `python-design-patterns`, `fastapi-testing`).
- Use timezone-aware UTC (`datetime.now(tz=UTC)`), never naive `datetime.utcnow()`, at boundaries.

## Review smells

- `open()`/`connect()`/`AsyncClient()` without a `with`/`async with` or a `finally` close.
- A new DB engine/HTTP client constructed inside a route or per call.
- A resource released after `yield`/after the work without a `finally` guarding the error path.
- A request-scoped session captured by a background task or module global.
- `datetime.utcnow()` (naive) or a hardcoded `datetime.now()` in logic a test needs to pin.
