---
name: tdd-frontend
description: Implements frontend from approved prototype using component test-first methodology and API contracts.
---

# tdd-frontend

For each approved UI module, write React Testing Library tests before replacing mock adapters with API calls. Cover loading, empty, error, success, Japanese ruby, keyboard navigation, mobile. Keep approved layout and tokens; use MSW to simulate contract responses. Run component tests plus browser visual regression where available. Any UI deviation requires owner approval.

## Required evidence
Record files changed, commands actually run, test pass/fail and open issues in docs/phase-log.md. Do not proceed past the current approval gate.
