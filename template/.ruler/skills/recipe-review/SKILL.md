---
name: recipe-review
description: Use when reviewing completed or in-progress work for consistency with requirements, SPECs, design docs, tests, security, and acceptance criteria. NOT for initial implementation; use recipe-build.
harness:
  tier: shared
  family: process
  gist: "Review recipe: reconcile code, docs, tests, security, quality gates, and acceptance criteria."
  owners: [main]
---

# Recipe: Review

## Purpose

Produce an evidence-backed review of whether the work is actually ready.

## Non-Negotiables

- P0 safety and approval gates override this recipe.
- Do not average reviewer verdicts; the most severe binding verdict wins.
- A missing executed acceptance criterion is not done.
- Do not self-score confidence as a substitute for tests and reviewer evidence.

## Procedure

1. Identify changed files and touched tiers.
2. Read governing SPECs, ADRs, and design docs.
3. Run `quality-runner` when available before final reviewer aggregation, or run relevant quality commands directly.
4. Invoke `code-reviewer`, `qa-validator`, `security-reviewer`, `spec-steward`, `design-sync`, and `acceptance-verifier` according to triggers.
5. Consolidate findings by severity and binding verdict.
6. Return required fixes before optional improvements.

Cross-tier work must run `design-sync` before implementation approval and after implementation if docs or behavior changed.

## Output

A review report with findings, executed commands, reviewer verdicts, and the binding status.
</content>
