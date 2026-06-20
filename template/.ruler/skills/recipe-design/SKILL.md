---
name: recipe-design
description: Use when the user asks to design, specify, scope, or architect a medium or large change before implementation. Produces requirements, codebase facts, SPEC/design docs, document review, and plan-review readiness. NOT for already-approved implementation; use recipe-build.
harness:
  tier: shared
  family: process
  gist: "Design recipe: requirements, codebase facts, SPEC/design docs, document review, and architecture readiness."
  owners: [main]
---

# Recipe: Design

## Purpose

Use this recipe to convert a request into implementable documentation without starting code.

## Non-Negotiables

- P0 safety and approval gates override this recipe.
- Do not implement application code.
- Resolve material ambiguity before producing a final plan.
- For cross-tier work, run or request `design-sync` before implementation.
- Cross-tier work must run `design-sync` before implementation approval and after implementation if docs or behavior changed.

## Procedure

1. Run `requirements-analyzer` when available; otherwise restate purpose, affected layers, risk surfaces, and questions.
2. Run `codebase-analyzer` when available; otherwise use `rlm-explore` to collect objective existing-code facts.
3. Create or update governing SPECs through `spec-workflow` and `spec-steward`.
4. For architecture decisions, apply `documentation-and-adrs`.
5. Run `document-reviewer` when available, or perform the document readiness rubric manually.
6. For cross-tier work, run `design-sync` when available.
7. Stop for user approval before implementation.

## Output

Return document paths, unresolved questions, risk surfaces, and the exact next recipe: `recipe-plan` or `recipe-build`.

## Planning agents

- `requirements-analyzer` for purpose, scale, risk, affected layers, and questions.
- `codebase-analyzer` for objective existing-code facts.
- `document-reviewer` for document readiness before implementation approval.
- `design-sync` for cross-tier consistency before implementation approval.
</content>
