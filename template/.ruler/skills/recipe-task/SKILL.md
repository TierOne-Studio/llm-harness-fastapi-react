---
name: recipe-task
description: Use when executing a small or standard single-task feature, fix, refactor, docs change, or config change and the user wants a clear workflow rather than ad hoc action. Routes through fast/standard path selection, required skill loading, TDD or exact waiver, verification, and review gates. NOT for multi-layer fullstack feature orchestration; use recipe-fullstack-implement.
harness:
  tier: shared
  family: process
  gist: "Small/standard task recipe: path selection, required skills, TDD or waiver, verification, and review."
  owners: [main]
---

# Recipe: Task

## Purpose

Use this recipe for one focused change where the main agent remains the writer.
It turns the operating profile into a short executable path.

## Non-Negotiables

- P0 safety and approval gates override this recipe.
- The main agent declares `Path: fast` or `Path: full` before code work.
- Code changes follow `tdd-workflow`; non-code changes use the exact waiver required by `instructions.md`.
- `repo-conventions` and touched-tier skills remain required.
- The final response uses the P8 verification line and names reviewers that ran.

## Procedure

1. Classify the path using P3.6.
2. Load force-fire skills from P3.4 and touched-tier skills from P3.0.
3. For behavioral changes, create or update the governing SPEC per `spec-workflow`.
4. Write the failing test first, or emit the exact non-code/type/config/ADR waiver.
5. Implement the smallest change that satisfies the test.
6. Run the relevant suite (`pytest` for `apps/api`, `vitest` for `apps/web`).
7. Invoke review subagents from P4 when their triggers match.
8. Address HIGH/CRITICAL/BLOCK findings and re-run the relevant evidence.
9. End with the P8 verification line.

## Escalation

If the change grows beyond fast-path limits, output `Path: full — escalated: <reason>` and continue with the full chain.
</content>
