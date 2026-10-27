# JLPT Master — Agent Rules

Read SPEC.md and docs/phase-state.yaml first. Use the appropriate `.agents/skills/*/SKILL.md`.

## HARD APPROVAL GATES
- The owner approves each phase in writing. Never self-approve.
- Current approved state is only stored in `docs/phase-state.yaml`.
- Never start API/database implementation before UI approval.
- Never start BE/FE implementation before API/DB contract approval.
- Never deploy production without explicit owner approval.
- Until approval, produce review artifacts and stop.

## Engineering
- TDD means failing test (RED), minimal implementation (GREEN), refactor, then regression tests; record commands and output.
- Feature slices, no giant all-in-one implementation. Follow acceptance criteria IDs.
- MariaDB only, Prisma provider `mysql`. No PostgreSQL.
- UI prototypes use mock data and no production DB/API.
- N5 first, N4–N1 structural support only.
- Never fabricate source content, official JLPT scoring, test results or approval.
- Do not replace approved screens without sign-off.
