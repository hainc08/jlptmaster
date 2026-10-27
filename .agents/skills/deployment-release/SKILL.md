---
name: deployment-release
description: Prepares tested MariaDB Next.js release with CI/CD, rollout and rollback controls.
---

# deployment-release

Check deployment environment's Node runtime, persistent MariaDB, networking, environment variables, object storage and Hostinger plan constraints. Produce Docker local, CI workflow, deployment docs, migration runbook, backup and rollback plan, health checks. Never deploy to production or run destructive migrations without explicit owner approval. Verify staging first and record release evidence.

## Required evidence
Record files changed, commands actually run, test pass/fail and open issues in docs/phase-log.md. Do not proceed past the current approval gate.
