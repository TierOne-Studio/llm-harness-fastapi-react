# Evals

The eval layer tests whether the shipped `.ruler` payload actually steers model behavior.

## Deterministic Checks

- `npm test`: CLI and merge/update unit tests.
- `npm run catalog:check`: generated skill catalog is current.
- `npm run test:harness`: structural acceptance plus static skill-trigger simulation.

## Live-Model Checks

- `npm run eval:routing`: model selects the right discretionary skills for prompts, including FastAPI/OpenAPI/React cases and negative cases.
- `npm run eval:adherence`: model obeys observable gates such as approval pauses, fast/full path declaration, TDD waivers, and routing exclusions.

## Baselines

This package needs its own `eval/baseline.json`. Do not copy scores from `llm-harness-fullstack`, `llm-harness-react`, or `llm-harness-nest`; this profile has different FastAPI/OpenAPI instructions and routing cases.

## Workflow Recipe Evals

The `recipe-*` entry-point skills and the planning/quality agents are measured like any other payload — workflow changes are not exempt from the harness.

- Routing (`eval/routing-cases.json`): `recipe-design-medium`, `recipe-build-approved-plan`, `recipe-review-completed-work` assert the right recipe is selected; the four advanced recipes (`recipe-fullstack-implement`, `recipe-diagnose`, `recipe-reverse-engineer`, `recipe-add-integration-tests`) add their own cases.
- Adherence (`eval/adherence-cases.json`): recipe-framed prompts must not bypass P0 (`recipe-p0-overrides-build`, `recipe-build-push-needs-approval`), `design-sync` must block implementation on a cross-tier conflict (`design-sync-conflict-blocks-implementation`), and `quality-runner` failures must not be reported as done (`quality-runner-block-not-done`).
- Mutation (`scripts/mutation-test.mjs`): `m-strip-recipe-build-desc` strips the `recipe-build` description and confirms the routing case goes red — recipe routing must be description-sensitive, not name-only.

Adding or renaming a recipe or workflow agent requires updating these cases and re-baselining `eval/baseline.json`.

## Meta-Evals

- `npm run eval:mutation`: seeded regressions should be killed.
- `npm run eval:decay`: probes whether instruction adherence degrades as context fills.
