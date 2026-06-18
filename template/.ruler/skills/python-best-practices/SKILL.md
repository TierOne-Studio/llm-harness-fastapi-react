---
name: python-best-practices
description: Python backend best practices for FastAPI repositories: typing, package layout, pyproject tooling, Ruff, mypy/pyright, pytest, async boundaries, logging, errors, dependencies, and maintainable Python style. Index + topics for code style, type safety, error handling, resilience, and resource management. Use for Python code quality outside FastAPI-specific framework wiring.
harness:
  tier: backend
  family: backend-fastapi
  gist: "Python typing, tooling, async boundaries, pytest, logging, maintainable backend style"
---

# Python Best Practices

The always-loaded essence is below. Depth lives in `topics/`, loaded on demand —
read the one that matches the task instead of pulling the whole skill.

## Topics

| Read | When |
|---|---|
| [topics/code-style.md](./topics/code-style.md) | Readability: naming, guard clauses, RORO, comprehensions, function/module size, docstrings, magic values |
| [topics/type-safety.md](./topics/type-safety.md) | Typing depth: `Protocol`, generics, `TypedDict`, `Literal`, `NewType`, narrowing, `X \| None`, escaping `Any`, mypy/pyright strictness |
| [topics/error-handling.md](./topics/error-handling.md) | Exception hierarchies, `raise … from`, EAFP vs LBYL, domain errors, the `except` smells, mapping to the FastAPI boundary, redacted logging |
| [topics/resilience.md](./topics/resilience.md) | Outbound timeouts, bounded + idempotent retries, backoff, circuit breaking, no blind retries on non-idempotent ops |
| [topics/resource-management.md](./topics/resource-management.md) | Context managers, `contextlib`, pools/handles, async resources, request-scoped lifetime, deterministic clocks/IDs/randomness |

Related skills (do not duplicate them here): `async-python-patterns` for asyncio
mechanics (`gather`/`TaskGroup`/cancellation), `python-design-patterns` for
class/module structure and SOLID, `pydantic-v2-patterns` for schema/DTO design,
`fastapi-patterns` for framework wiring, `fastapi-testing` for API tests.

## Defaults

- Type public functions and boundary objects. Do not use `Any` to silence the checker — see [topics/type-safety.md](./topics/type-safety.md).
- Prefer small explicit functions and modules over clever dynamic behavior.
- Use guard clauses and early returns for edge cases and preconditions; keep the happy path last and avoid deep `else` nesting (prefer if-return). Depth in [topics/code-style.md](./topics/code-style.md).
- Follow RORO (Receive an Object, Return an Object) at function and use-case boundaries — take and return structured objects/models rather than long positional argument lists — so signatures stay stable, validated, and easy to evolve.
- Name booleans and predicates with auxiliary verbs (`is_active`, `has_permission`).
- Keep dependency versions and tooling in `pyproject.toml` unless the repo convention says otherwise.
- Use Ruff and the repo's chosen type checker (`mypy`, `pyright`, or `ty`) as gates.
- Prefer pytest fixtures over global mutable test state.

## Package Layout

- Keep code in an importable package (a `src/`-style layout is fine) with `pyproject.toml` as the single source of build and tooling config.
- Name modules, packages, and files in `lowercase_with_underscores` (e.g. `routers/user_routes.py`), per PEP 8.
- Group modules by domain/feature rather than by technical kind once a package outgrows a few files; expose a small public surface and avoid reaching into another package's internals.
- This skill covers generic Python packaging only — defer the FastAPI domain-module structure (presentation/application/domain/infrastructure layering) to `fastapi-clean-architecture` and `repo-conventions`.

## Async Boundaries

- Do not mix blocking I/O into async routes without an explicit threadpool/background strategy. For the asyncio mechanics (offloading with `run_in_executor`/`anyio.to_thread`, `gather` vs `TaskGroup`, cancellation), see `async-python-patterns`.
- Keep async DB sessions and sync DB sessions from crossing incorrectly. Follow the repo's SQLAlchemy/SQLModel convention.
- Timeouts belong on outbound network calls; do not add blind retries around non-idempotent operations — see [topics/resilience.md](./topics/resilience.md).

## Tooling Expectations

- Ruff/format/typecheck/pytest should be repo gates, not optional cleanups. Enable Ruff's FastAPI rule set (`FAST`) in FastAPI repositories.
- New dependencies belong in the repo's package manager convention (`pyproject.toml`, lockfile, uv/poetry/pip-tools) and need approval when they change dependency state.
- Avoid one-off per-file tool configuration unless it is documented in `repo-conventions`.

## Review Smells

- A route/service imports environment variables directly.
- Tests rely on execution order or global mutable state.
- A broad `except Exception` logs and continues without preserving failure semantics ([topics/error-handling.md](./topics/error-handling.md)).
- Async code calls blocking filesystem/network/database functions in the hot path.
- A coroutine is called without `await`, so it never executes (silent no-op, often only a `RuntimeWarning`).
- Repository/service functions return untyped dicts across layers ([topics/type-safety.md](./topics/type-safety.md)).
- A resource (session, file, client) is opened without a `with`/`async with` or `finally` to release it ([topics/resource-management.md](./topics/resource-management.md)).
