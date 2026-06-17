---
name: python-best-practices
description: Python backend best practices for FastAPI repositories: typing, package layout, pyproject tooling, Ruff, mypy/pyright, pytest, async boundaries, logging, errors, dependencies, and maintainable Python style. Use for Python code quality outside FastAPI-specific framework wiring.
harness:
  tier: backend
  family: backend-fastapi
  gist: "Python typing, tooling, async boundaries, pytest, logging, maintainable backend style"
---

# Python Best Practices

## Defaults

- Type public functions and boundary objects. Do not use `Any` to silence the checker.
- Prefer small explicit functions and modules over clever dynamic behavior.
- Keep dependency versions and tooling in `pyproject.toml` unless the repo convention says otherwise.
- Use Ruff and the repo's chosen type checker (`mypy` or `pyright`) as gates.
- Prefer pytest fixtures over global mutable test state.

## Async Boundaries

- Do not mix blocking I/O into async routes without an explicit threadpool/background strategy.
- Keep async DB sessions and sync DB sessions from crossing incorrectly. Follow the repo's SQLAlchemy/SQLModel convention.
- Timeouts belong on outbound network calls; do not add blind retries around non-idempotent operations.

## Typed Surfaces

- Public functions, dependency functions, service methods, repository protocols, and DTO boundaries should be typed.
- Avoid `Any` as an escape hatch; if a third-party library is untyped, isolate it behind a typed adapter.
- Prefer `Protocol` for ports that have multiple implementations or need fakes in tests.
- Keep `Optional`/`None` semantics explicit. Do not use `None` as both "not found" and "not authorized".

## Tooling Expectations

- Ruff/format/typecheck/pytest should be repo gates, not optional cleanups.
- New dependencies belong in the repo's package manager convention (`pyproject.toml`, lockfile, uv/poetry/pip-tools) and need approval when they change dependency state.
- Avoid one-off per-file tool configuration unless it is documented in `repo-conventions`.

## Errors and Logging

- Raise domain/application errors with typed meaning; map them to HTTP errors at the FastAPI boundary.
- Logs should include event/context, not raw request bodies, credentials, tokens, or PII.
- Use structured logging fields where the repo supports them; avoid string-concatenated log blobs that are hard to query.

## Time, IDs, and Randomness

Inject clocks, ID generators, and randomness for code that needs deterministic tests. Do not hide `datetime.now()`, UUID generation, or random choices inside business logic when tests need to assert exact behavior.

## Concurrency and Resources

- Do not share request-scoped sessions/clients across concurrent requests.
- Avoid mutable module-level state unless it is read-only after startup.
- External calls need timeout and cancellation behavior; retries must be bounded and idempotency-aware.

## Review Smells

- A route/service imports environment variables directly.
- Tests rely on execution order or global mutable state.
- A broad `except Exception` logs and continues without preserving failure semantics.
- Async code calls blocking filesystem/network/database functions in the hot path.
- Repository/service functions return untyped dicts across layers.
