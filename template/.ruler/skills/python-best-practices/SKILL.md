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
