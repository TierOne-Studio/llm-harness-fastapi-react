---
name: recipe-add-integration-tests
description: Use to add minimal high-value integration or E2E tests from acceptance criteria, risk, or observed behavior, and verify the tests are non-vacuous. NOT for unit-only test changes.
harness:
  tier: shared
  family: process
  gist: "Integration-test recipe: select minimal high-value integration/E2E tests and verify non-vacuity."
  owners: [main]
---

# Recipe: Add Integration Tests

## Procedure

1. Read acceptance criteria, SPECs, and changed surfaces.
2. Choose the proving layer: FastAPI integration test (httpx/TestClient), fixture-backed e2e, or service-backed Playwright e2e.
3. Write the smallest test that proves the observable behavior.
4. Add a regression test that fails if the behavior is reverted.
5. Run the new test, then the broader suite.
6. Run `acceptance-verifier` when user-facing or API behavior is involved.

P0 remains dominant throughout the recipe.
</content>
