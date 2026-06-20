# Agents And Skills

The harness combines guides and sensors.

## Skill Families

- Process and discipline: planning, TDD, design review, specs, git workflow, quality gates, repo conventions, RLM exploration, and nine `recipe-*` workflow entry points (task, design, plan, build, review, fullstack-implement, diagnose, reverse-engineer, add-integration-tests).
- Language and code quality: async error handling (JS/TS), simplification, complexity, JavaScript/TypeScript performance and types.
- React core: components, state, data fetching, routing, forms, testing, performance, modern React patterns.
- Frontend platform: accessibility, security, bundle size, Playwright, Vite, Vitest, Tailwind, shadcn, AI UI patterns.
- FastAPI/Python backend: FastAPI best practices, clean architecture, tactical dependency/router/lifespan patterns, security, testing, Pydantic v2, Python tooling/style, Python design patterns (SOLID/DI), and Python asyncio patterns.
- Data and persistence: database write approval and transaction discipline.

## Review Flow

For code changes the main agent declares fast/full path, loads required skills, writes failing tests first unless a legal waiver applies, implements minimally, runs the relevant suites, and then invokes triggered reviewers. Final status is the minimum reviewer verdict. A BLOCK from any required reviewer means the work is not done.

## Workflow Agents

Five read-only, structured-JSON agents back the recipe planning and quality phases. They never write (only `spec-steward` writes), and the acceptance suite enforces the no-Edit/no-Write scope:

- `requirements-analyzer`: classifies purpose, scale, affected layers, risk surfaces, required artifacts, and open questions before work starts.
- `codebase-analyzer`: gathers objective existing-code facts (FastAPI routers, Pydantic models, React hooks, SQLAlchemy/Alembic, tests, quality commands).
- `document-reviewer`: reviews PRD/SPEC/ADR/design/work-plan artifacts for readiness, not code.
- `design-sync`: verifies backend, frontend, and OpenAPI/contract docs agree before and after implementation; a semantic mismatch is not resolved just because the generated client compiles or `mypy` passes.
- `quality-runner`: discovers and runs both toolchains (`pytest`/`ruff`/`mypy` and `vitest`/`tsc`/`eslint`), detects Python and TypeScript stubs/skipped tests, and classifies failures. It runs commands (Bash) but cannot edit files.

## FastAPI-Specific Lenses

Reviewers check that route handlers stay thin, dependencies are explicit and overrideable, auth/RBAC is enforced server-side, Pydantic schemas match runtime responses, OpenAPI stays stable enough for the generated TypeScript client, and Python tooling gates are honored.
