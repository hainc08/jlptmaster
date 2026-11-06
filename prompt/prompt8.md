# PHASE 7 — IMPLEMENTATION PLANNING ONLY

Act as Senior Product Owner, Technical Lead and QA Architect.

Prerequisite:
The Product Owner must have reviewed and approved the consolidated backlog.

Do not implement code.

## PLAN-001 — Select Approved Scope

Read the approved task IDs.

Do not include unapproved tasks.

Group tasks by dependencies and risk.

## PLAN-002 — Specification Per Task

For every selected task create:

1. Problem statement
2. Current behavior
3. Expected behavior
4. User story
5. Business rules
6. Acceptance criteria
7. Edge cases
8. UI changes
9. API changes
10. Database changes
11. Data migration needs
12. Unit test cases
13. Integration test cases
14. E2E test cases
15. Rollback considerations
16. Definition of Done

If implementation details are uncertain, document the uncertainty instead of inventing architecture.

## PLAN-003 — TDD Plan

Propose Red → Green → Refactor steps.

For each task:

RED:

- Define behavior through tests.
- Specify expected failing tests.

GREEN:

- Describe minimum implementation to pass tests.

REFACTOR:

- Identify safe cleanup after tests pass.

Plan the work; do not write implementation code yet.

## PLAN-004 — Design Review Gate

For UI tasks:

- Provide wireframes
- Provide component specifications
- Specify responsive behavior
- Specify interaction states
- Define accessibility expectations

Wait for visual design approval before implementation.

## PLAN-005 — Database/API Review Gate

For backend tasks:

- Provide proposed schema differences
- Provide migration plan
- Provide API contracts
- Identify backward compatibility risks
- Provide test fixture plan

Wait for approval before executing migrations or changing API behavior.

## PLAN-006 — Delivery Roadmap

Organize approved tasks into executable batches.

For each batch provide:

- Included tickets
- Dependencies
- Expected outputs
- QA conditions
- Regression scope
- Acceptance gate

## Deliverables

Write:
docs/audit/07-implementation-roadmap.md

Create individual approved-task specifications under:
docs/specs/

Deliver a review-ready implementation plan.

STOP before any source code changes.
