---
name: recipe-diagnose
description: Use to diagnose, root-cause, reproduce, or isolate a bug, failing test, or flaky CI before fixing. Reproduce, isolate the smallest failing command, find root cause, then route to a fix recipe. NOT for straightforward planned implementation.
harness:
  tier: shared
  family: process
  gist: "Diagnosis recipe: reproduce, isolate root cause, gather evidence, then route to task or plan."
  owners: [main]
---

# Recipe: Diagnose

## Procedure

1. Load `bug-investigation` and `failure-mode-analysis`.
2. Reproduce the failure, or record exactly why it is blocked.
3. Find the smallest failing command (`pytest -k`, a single `vitest` file, or a targeted request).
4. Isolate the root cause before proposing a fix.
5. Route to `recipe-task` for a focused fix or `recipe-plan` for a larger change.
6. Preserve a regression test that fails if the bug returns.

P0 remains dominant throughout the recipe.
</content>
