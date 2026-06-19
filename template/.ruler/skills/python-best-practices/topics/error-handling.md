# Error Handling

Fail fast at boundaries; let typed errors propagate to the layer that can act on them.
The model's default habits — wrap every call in try/except, return `None` on failure,
log-and-continue — destroy error context and violate the codebase's fail-fast principle.

## Raise, don't return None

- Returning `None`/`False`/`-1` to signal failure forces every caller to check, drops the cause, and silently flows bad data downstream. Raise a typed error with context instead.
- Raise a **domain/application error** with typed meaning (`OrderNotFound`, `InsufficientStock`, `PermissionDenied`) in services/repositories — not a raw `HTTPException` deep in the domain. Map domain errors to HTTP at the FastAPI boundary (exception handler or the route), keeping the domain framework-agnostic. See `fastapi-patterns` for the handler seam and `fastapi-security` for 401-vs-403.

## Exception hierarchy

- Define a small package base (`class AppError(Exception): ...`) and derive specific errors from it, so a boundary can `except AppError` to map the family while still letting unexpected `Exception`s surface as 500s.
- Give errors structured attributes (`OrderNotFound(order_id=...)`), not just a formatted string — the boundary needs the fields to build the response/log.
- Don't subclass built-ins (`ValueError`, `KeyError`) for domain meaning; callers catching those for their normal purpose would swallow yours.

## Preserve the cause: `raise … from`

```python
try:
    row = await repo.get(order_id)
except DBConnectionError as exc:
    raise OrderLookupFailed(order_id) from exc   # keeps the traceback chain
```

- Use `raise NewError(...) from exc` when translating an exception so the original cause stays in the chain. Use `from None` only to deliberately suppress a noisy internal cause, and only when you've captured what matters.
- Never `raise` a fresh error inside an `except` without `from` — it produces a confusing "during handling of the above exception" chain and loses intent.

## Where to catch (boundary, not every layer)

- Repository throws → service lets it propagate → boundary maps it. Catching mid-stack only to re-`raise` is noise that erases the typed error.
- Valid reasons to catch: **translate** (add context, re-raise via `from`), **recover** (substitute a proven fallback — rare), **fan-in** (map many upstream failure kinds to one response at an aggregator boundary).
- Catch the **narrowest** exception that can actually occur. `except Exception` at a low level hides programming errors (typos, `AttributeError`) as if they were expected failures.

## EAFP vs LBYL

- Python favors EAFP ("easier to ask forgiveness"): `try: d[k] except KeyError` or `d.get(k, default)` over pre-checking `if k in d`. EAFP avoids the check/use race and reads cleanly for the expected-key case.
- Use LBYL when the check is cheap and the exception would be control-flow abuse (e.g. validating user input shape before a big operation — though prefer Pydantic at the boundary).

## The `except` smells (catch these in review)

- `except Exception: pass` / bare `except:` — forbidden. If ignoring is genuinely correct, catch the **specific** error, log at `warning` with context, and comment why.
- `except Exception: logger.error(...); continue` that hides a failure the caller needed to know about — it converts an error into silent wrong behavior.
- Catch-and-re-raise the same error just to log — the boundary handler logs already; the catch does nothing.
- Catching to return `None`/`{}` — see "Raise, don't return None".
- A bare `raise Exception("...")` instead of a typed error — gives callers nothing to branch on.
- Swallowing `asyncio.CancelledError` (or catching it in a broad `except`) — it must propagate; see `async-python-patterns`.

## Logging at the boundary

- Logs carry **event + context** (ids, operation, outcome), never raw request bodies, credentials, tokens, cookies, or PII.
- Use structured fields (`logger.warning("charge_failed", order_id=..., reason=...)`), not concatenated strings, so logs are queryable. Log the exception with `logger.exception(...)`/`exc_info=True` at the boundary that handles it — once, not at every layer it passed through.
- Don't log-and-raise at the same site: pick one. The handler that maps the error to a response is where it gets logged.
