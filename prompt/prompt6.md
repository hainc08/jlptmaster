# PHASE 5 — QA, TEST COVERAGE & PERFORMANCE AUDIT

Act as Senior QA Lead and Performance Engineer.

Read previous audit reports.

Audit first; do not implement new tests without approval.

## QA-001 — Existing Test Inventory

Identify:

- Unit tests
- Integration tests
- API tests
- Component tests
- E2E tests
- Security tests
- Test fixtures
- CI test execution

Document which business features are covered and uncovered.

## QA-002 — Critical Journey Test Design

Create test cases for:

1. Register/Login
2. Onboarding
3. Start a lesson
4. Complete a lesson
5. Resume a lesson
6. Review SRS cards
7. Complete practice
8. Start a mock exam
9. Submit exam answers
10. View exam results
11. Analyze wrong answers
12. Admin authorization

Use Given/When/Then acceptance scenarios.

## QA-003 — Data and Boundary Tests

Design tests for:

- Empty datasets
- Duplicate records
- Invalid IDs
- Missing lesson content
- Partial exam attempts
- Expired sessions
- Network failure
- Repeated submissions
- Streak timezone boundaries
- SRS scheduling across midnight
- Invalid Japanese content records

## QA-004 — Performance Review

If tooling and permissions allow, inspect:

- Core Web Vitals
- LCP
- INP
- CLS
- Initial JavaScript payload
- Image and audio loading
- API latency
- Database query patterns
- Slow pages
- Mobile performance

Measure actual conditions and record the environment.

Do not invent benchmark numbers.

Do not run production load tests without explicit approval.

## QA-005 — Accessibility Test Plan

Include keyboard, screen reader and responsive tests.

Use WCAG 2.2 AA as the applicable target, noting which checks are automated versus manual.

## QA-006 — Test Automation Proposal

Recommend the appropriate tools based on the existing stack.

Consider:

- Vitest or Jest for units
- React Testing Library for components
- Playwright for E2E
- API integration testing
- MariaDB test fixtures

Avoid adding redundant frameworks.

## QA-007 — TDD Readiness

Evaluate whether requirements and components are testable.

For each critical feature, identify:

- Business rules
- Acceptance criteria
- Unit test cases
- Integration test cases
- E2E scenarios
- Required test data

## Deliverables

Write:
docs/audit/05-qa-performance-audit.md

Create:
docs/audit/test-cases/critical-user-journeys.md
docs/audit/test-cases/regression-test-plan.md

Provide:

- Test coverage matrix
- Existing test quality
- Missing automated tests
- Performance findings
- Prioritized test automation roadmap

STOP after reporting.
