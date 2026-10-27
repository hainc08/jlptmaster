---
name: tdd-backend
description: Implements backend features test-first with MariaDB, Prisma and security requirements.
---

# tdd-backend

Follow Red -> Green -> Refactor on each thin user-story slice. RED: write failing tests for behavior and edge cases. GREEN: minimum API/service code to pass. REFACTOR: clean and rerun. Use isolated test MariaDB; migrations applied to test DB only before approval for staging/prod. Cover auth/authorization, SRS due dates, exam time checks, answer secrecy, scoring, autosave, transactions. Attach exact commands and test results. Never fabricate results. Stop for module approval before next domain.

## Required evidence
Record files changed, commands actually run, test pass/fail and open issues in docs/phase-log.md. Do not proceed past the current approval gate.
