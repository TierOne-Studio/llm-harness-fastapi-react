---
name: recipe-reverse-engineer
description: Use when existing behavior lacks documentation and you must produce verified PRD/SPEC/architecture/workflow docs from the code itself. Distinguish confirmed from inferred behavior. NOT for implementing new behavior.
harness:
  tier: shared
  family: process
  gist: "Reverse-engineering recipe: generate verified docs from existing code behavior."
  owners: [main]
---

# Recipe: Reverse Engineer

## Procedure

1. Run `codebase-analyzer` on the target area.
2. Read existing tests and runtime entry points (FastAPI app/router includes, React route tree).
3. Produce docs that clearly distinguish confirmed behavior (covered by tests or traced in code) from inferred behavior.
4. Run `document-reviewer` on the generated docs.
5. Do not change application behavior.

P0 remains dominant throughout the recipe.
</content>
