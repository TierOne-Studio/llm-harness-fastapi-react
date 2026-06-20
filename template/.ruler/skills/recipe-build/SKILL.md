---
name: recipe-build
description: Use when an approved implementation plan exists and the user asks to execute it. Runs task-by-task implementation with TDD, quality checks, reviewer gates, and explicit approval before git writes. NOT for unplanned medium/large work; use recipe-design or recipe-plan first.
harness:
  tier: shared
  family: process
  gist: "Build recipe: execute an approved plan task by task with TDD, quality checks, and reviewer gates."
  owners: [main]
---

# Recipe: Build

## Purpose

Execute an approved plan without skipping verification.

## Non-Negotiables

- P0 safety and approval gates override this recipe.
- Git commits require explicit user approval.
- The main agent remains the application-code writer unless the runtime has a proven bounded write-scope implementation agent.
- Do not mark a task complete until its tests and triggered reviewers are green or non-blocking.

## Procedure

1. Read the plan and list remaining tasks.
2. Execute one task at a time.
3. For code tasks, run failing test first, implement, and run green verification.
4. Run `quality-runner` when available before final reviewer aggregation, or run the plan's quality commands directly.
5. Invoke P4 reviewers as triggered.
6. Ask for commit approval before each commit command.
7. Continue until all plan tasks are complete or a blocker requires user input.

## Output

Report task status, commands run, reviewer verdicts, open risks, and next task.
</content>
