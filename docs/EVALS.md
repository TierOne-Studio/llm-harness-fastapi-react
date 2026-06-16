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

## Meta-Evals

- `npm run eval:mutation`: seeded regressions should be killed.
- `npm run eval:decay`: probes whether instruction adherence degrades as context fills.
