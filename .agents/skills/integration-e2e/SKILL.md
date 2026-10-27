---
name: integration-e2e
description: Validates connected user journeys and end-to-end correctness with Playwright.
---

# integration-e2e

Test actual local FE+BE+test MariaDB end to end. Include signup->onboarding->lesson->quiz->SRS->exam->results and admin import/publish. Include unsuccessful login, unauthorized access, interrupted exam recovery, mobile viewports, time boundaries. Run tests, capture screenshots/traces, log failures and fixes; no claims without evidence.

## Required evidence
Record files changed, commands actually run, test pass/fail and open issues in docs/phase-log.md. Do not proceed past the current approval gate.
