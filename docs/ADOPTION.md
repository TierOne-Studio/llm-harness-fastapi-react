# Adoption

Use this harness first in one active FastAPI + React repo.

## Install

```bash
npx @tierone/llm-harness-fastapi-react init
npx @intellectronica/ruler apply
```

## Customize

Fill in `.ruler/skills/repo-conventions/SKILL.md` with:

- actual workspace layout;
- FastAPI app factory/router/module layout;
- Python tooling (`ruff`, `pytest`, `mypy` or `pyright`);
- persistence and migration stack;
- auth/RBAC/session contract;
- OpenAPI generation command and generated-client location;
- React API consumption, state, routing, forms, styling, and testing rules.

## Gate

Copy the `quality-gates` templates into CI/pre-commit/agent-permission configuration. At minimum, gate Python lint/type/tests, frontend build/tests, generated-client freshness, and Playwright seam coverage for key flows.

## Measure

Run deterministic checks on every harness change:

```bash
npm test
npm run catalog:check
npm run test:harness
```

Run live evals when changing instructions or skill routing, then review the baseline diff.
