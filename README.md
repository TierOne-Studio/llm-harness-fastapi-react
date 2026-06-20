# llm-harness-fastapi-react

**A governed, measured agent harness for FastAPI + React monorepos.** It installs a `.ruler/` payload with operating instructions, skills, review agents, deterministic gate templates, and evals so AI coding agents follow the same engineering rules across tools.

This package ships a fullstack LLM harness for FastAPI/Python backends and React frontends, with the FE<->BE seam treated as an OpenAPI-driven contract:

~~~text
FastAPI + Pydantic models -> OpenAPI schema -> generated TypeScript client/types -> React
~~~

## What You Get

- Senior-engineer operating profile for FastAPI + React.
- React skills copied from the existing harness family.
- New FastAPI/Python/OpenAPI backend skills.
- Nine `recipe-*` workflow entry points: task, design, plan, build, review, fullstack-implement, diagnose, reverse-engineer, add-integration-tests.
- Seven review agents (architecture, spec, code, QA, security, acceptance, lessons) plus five read-only workflow agents (requirements-analyzer, codebase-analyzer, document-reviewer, design-sync, quality-runner).
- CLI `init` / `update` with 3-way merge preservation.
- Deterministic harness acceptance tests and live-model eval scaffolding.

## Quick Start

~~~bash
npx @tierone/llm-harness-fastapi-react init
npx @intellectronica/ruler apply
~~~

Then fill in `.ruler/skills/repo-conventions/SKILL.md`, especially the FastAPI app layout, Python tooling, OpenAPI client generation command, auth/RBAC contract, persistence choice, and frontend API consumption pattern.

## Development

~~~bash
npm test
npm run catalog:check
npm run test:harness
~~~

Live evals require the configured model CLI/API credentials and must be re-baselined for this package; do not copy fullstack baselines.
