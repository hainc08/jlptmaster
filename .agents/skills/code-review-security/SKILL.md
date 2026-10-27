---
name: code-review-security
description: Reviews changes for correctness, security, maintainability, and performance before release.
---

# code-review-security

Review diff against traceability IDs; run typecheck, lint, unit/integration/e2e. Verify RBAC, CSRF/session protections, safe file uploads, rate limit, input validation, sensitive fields and answer leakage, SQL injection via raw queries, secrets, audit logs and backups. Report findings by severity with file/line and reproduction; require critical/high fixes before release.

## Required evidence
Record files changed, commands actually run, test pass/fail and open issues in docs/phase-log.md. Do not proceed past the current approval gate.
