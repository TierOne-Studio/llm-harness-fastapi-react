---
name: recipe-fullstack-implement
description: Use for medium or large fullstack features spanning the FastAPI backend, React frontend, the OpenAPI contract, Alembic migrations, API behavior, or E2E acceptance. Orchestrates requirements, codebase facts, docs, design-sync, plan, build, quality, review, and acceptance. NOT for single-tier small work; use recipe-task.
harness:
  tier: shared
  family: process
  gist: "Fullstack feature recipe: requirements, layer docs, design-sync, plan, vertical implementation, quality, and acceptance."
  owners: [main]
---

# Recipe: Fullstack Implement

## Procedure

1. Run `requirements-analyzer`.
2. Run `codebase-analyzer` per affected tier (backend, frontend, OpenAPI seam).
3. Create or update backend, frontend, OpenAPI/contract, and e2e SPEC/design docs as needed.
4. Run `document-reviewer` for each document.
5. Run `design-sync`; stop on conflicts.
6. Run `recipe-plan`.
7. Stop for user approval before implementation.
8. Run `recipe-build` task by task; regenerate the OpenAPI client when the contract changes.
9. Run `quality-runner`, P4 reviewers, `spec-steward` POST, `design-sync` POST, and `acceptance-verifier`.

P0 remains dominant throughout the recipe.
</content>
