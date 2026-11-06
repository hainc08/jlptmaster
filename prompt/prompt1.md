# PHASE 0 — PROJECT DISCOVERY

Follow the JLPT ManabiHub Master Audit Rules.

Goal: Understand the existing system before evaluating quality or proposing changes.

## Task DISC-001 — Repository Inspection

Inspect:

- Project folders and application entry points
- package.json and lockfiles
- TypeScript and Next.js configuration
- Environment variable names, without disclosing their values
- Build and deployment configuration
- Test directories
- Documentation
- Git status without changing it

Identify architectural patterns, folder conventions and major dependencies.

## Task DISC-002 — Technology Verification

Identify the actual:

- Frontend framework and version
- Backend runtime/framework
- Database engine and ORM
- Authentication mechanism
- State management
- Styling and UI component libraries
- API design
- Background jobs
- Cache
- Media storage
- Hosting and deployment configuration

Mark anything not verifiable as UNKNOWN.

## Task DISC-003 — Route Inventory

Discover all routes, including dynamic routes.

For every route collect:

- Path
- Page name
- Purpose
- Required authentication
- Required role
- Connected APIs
- Loading and error handling
- Implementation status
- Screenshot availability

Include all existing routes rather than limiting the audit to known pages.

## Task DISC-004 — API Inventory

Identify API endpoints and server actions.

Document:

- HTTP method
- Path or action
- Authentication requirement
- Authorization requirement
- Request schema
- Response schema
- Validation
- Error handling
- Related database entities
- Consuming frontend features

Do not invoke write endpoints against production.

## Task DISC-005 — Database Inventory

Inspect schemas and migrations.

Map entities related to:

- Users and profiles
- JLPT levels and curricula
- Courses, lessons and learning materials
- Vocabulary and Kanji
- Grammar
- Questions and answers
- Exams and attempts
- User progress
- SRS cards and review history
- AI recommendations
- Admin and content publishing

Do not assume these tables exist.

## Task DISC-006 — Feature Matrix

Produce a matrix with:
Feature | Frontend | Backend | DB | Tests | User-facing status | Evidence

Classify:

- COMPLETE
- PARTIAL
- PLACEHOLDER
- MOCK_ONLY
- NOT_IMPLEMENTED
- UNKNOWN

## Task DISC-007 — Data Authenticity

Investigate whether displayed numbers are:

- Real user progress
- Demo fixtures
- Seed data
- Hardcoded placeholders
- Mock API responses
- Aggregated database results

Pay special attention to:

- Dashboard learning progress
- SRS queue
- Vocabulary count
- Mock exam results
- Streak and study minutes

## Deliverables

Write:
docs/audit/00-project-inventory.md

Include:

1. Project architecture overview
2. Route inventory
3. API inventory
4. Database entity map
5. Feature completeness matrix
6. Identified mock/seed data
7. Missing information
8. Phase 1 test scope

STOP after Phase 0. Do not implement fixes.
