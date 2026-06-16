# Why A Harness

AI coding agents are already changing FastAPI and React code. A harness makes that work governed instead of ad hoc.

This package gives every agent the same operating profile, the same FastAPI/React/OpenAPI skills, the same review sensors, and the same deterministic safety gates. The goal is predictable engineering behavior: spec-first when behavior changes, TDD for executable work, explicit approval for risky operations, and executed verification before done.

## Why It Matters For FastAPI + React

The highest-risk seam is API drift. FastAPI exposes Pydantic-backed OpenAPI; React consumes generated TypeScript client/types. Without a harness, agents often hand-redeclare DTOs, change response shapes without regenerating the client, or trust frontend route guards instead of enforcing RBAC in FastAPI. The harness makes those failures explicit review findings and test targets.

## Evidence Model

Deterministic tests validate the shipped payload structure and skill routing simulation. Live evals measure whether models follow the instructions. Baselines must be generated for this package before publishing measured claims; numbers from other harnesses are intentionally not reused.
