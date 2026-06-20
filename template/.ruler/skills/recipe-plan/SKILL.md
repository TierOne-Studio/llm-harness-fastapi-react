---
name: recipe-plan
description: Use when approved requirements, SPECs, or design docs need to be converted into an implementation plan with tasks, tests, risk notes, and verification commands. NOT for writing code directly.
harness:
  tier: shared
  family: process
  gist: "Planning recipe: turn approved docs into executable tasks with tests, risks, and verification commands."
  owners: [main]
---

# Recipe: Plan

## Purpose

Produce an implementation plan that another agent can execute task by task.

## Non-Negotiables

- P0 safety and approval gates override this recipe.
- The plan must name exact files, tests, commands, and review gates.
- Each task must be independently testable.
- No task may require broad write-capable subagents.

## Procedure

1. Read approved requirements, SPECs, ADRs, and design docs.
2. Use `requirements-analyzer` output for purpose, scale, risk, affected layers, and questions when available.
3. Use `codebase-analyzer` output for objective existing-code facts when available.
4. Run or request `document-reviewer` when the source docs are incomplete, inconsistent, or not implementation-ready.
5. Map touched surfaces to tiers: frontend, backend, openapi-contract, e2e, docs, harness payload, evals.
6. Split tasks by independently reviewable deliverables.
7. For each task, include files, interfaces, failing test, implementation notes, verification command, and approval-gated commit command.
8. Include final validation: the project's test suites (`pytest` for the API, `vitest`/`npm test` for the web app), the generated-OpenAPI-client freshness check when the contract changed, and targeted evals when harness workflow behavior changes.

## Output

A Markdown plan under the repo's plan location with checkbox steps.

## Planning agents

- `requirements-analyzer` for purpose, scale, risk, affected layers, and questions.
- `codebase-analyzer` for objective existing-code facts.
- `document-reviewer` for document readiness before implementation approval.
</content>
