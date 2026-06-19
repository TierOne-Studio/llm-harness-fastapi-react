# Agents And Skills

The harness combines guides and sensors.

## Skill Families

- Process and discipline: planning, TDD, design review, specs, git workflow, quality gates, repo conventions, RLM exploration.
- Language and code quality: async error handling (JS/TS), simplification, complexity, JavaScript/TypeScript performance and types.
- React core: components, state, data fetching, routing, forms, testing, performance, modern React patterns.
- Frontend platform: accessibility, security, bundle size, Playwright, Vite, Vitest, Tailwind, shadcn, AI UI patterns.
- FastAPI/Python backend: FastAPI best practices, clean architecture, tactical dependency/router/lifespan patterns, security, testing, Pydantic v2, Python tooling/style, Python design patterns (SOLID/DI), and Python asyncio patterns.
- Data and persistence: database write approval and transaction discipline.

## Review Flow

For code changes the main agent declares fast/full path, loads required skills, writes failing tests first unless a legal waiver applies, implements minimally, runs the relevant suites, and then invokes triggered reviewers. Final status is the minimum reviewer verdict. A BLOCK from any required reviewer means the work is not done.

## FastAPI-Specific Lenses

Reviewers check that route handlers stay thin, dependencies are explicit and overrideable, auth/RBAC is enforced server-side, Pydantic schemas match runtime responses, OpenAPI stays stable enough for the generated TypeScript client, and Python tooling gates are honored.
