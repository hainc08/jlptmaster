# PHASE 1 — FUNCTIONAL & USER JOURNEY AUDIT

Act as a Senior Product Owner and Senior QA Engineer.

Read Phase 0 findings first.

Do not implement fixes.

## FUNC-001 — Guest Journey

Audit the complete anonymous user flow:

Homepage → Explore levels → Register/Login → Onboarding → Dashboard

Verify:

- Navigation correctness
- CTA behavior
- Form validation
- Login/session behavior
- Error messages
- Redirects
- Existing-user handling

Test only with authorized test accounts.

## FUNC-002 — Onboarding Journey

Inspect:

- JLPT level selection
- Previous Japanese learning experience
- Daily study time
- Exam goals
- Study goals
- Saving preferences
- Returning users
- Changing goals later

Identify missing decisions that affect personalized learning.

## FUNC-003 — Dashboard

Inspect:

- Today’s learning goal
- Continue learning
- Streak
- Vocabulary progress
- Kanji progress
- Grammar progress
- SRS queue
- Latest mock exam
- Recommendation cards

Check whether displayed data matches the user's actual learning records.

## FUNC-004 — Curriculum and Lessons

For every implemented level:

1. Open curriculum.
2. Inspect lessons.
3. Start a lesson.
4. Navigate between lesson sections.
5. Complete exercises.
6. Finish the lesson.
7. Return to Dashboard.
8. Verify progress persistence when safe in an approved test environment.

Test:

- Prerequisite enforcement
- Completion status
- Previous/next navigation
- Resume learning
- Audio and Furigana
- Empty lessons
- Missing content

## FUNC-005 — Vocabulary, Grammar and Kanji

Check:

- Search
- Filters
- JLPT level filters
- Item detail
- Examples
- Readings
- Audio
- Bookmarking
- Exercise navigation
- Loading, empty and error states

Investigate the potential discrepancy between Dashboard vocabulary counts and the Vocabulary page.

## FUNC-006 — SRS Flashcards

Inspect:

- New card creation
- Front/back reveal
- Again/Hard/Good/Easy rating
- Scheduling logic
- Due date calculation
- Review persistence
- Duplicate card handling
- Overdue queue
- Progress statistics

Do not modify real user records without approval.

## FUNC-007 — Practice

Inspect:

- Skill selection
- JLPT level filtering
- Question loading
- Answer submission
- Correct/incorrect feedback
- Explanations
- Retry
- Result tracking
- Error handling

Check whether questions and explanations match their assigned topics.

## FUNC-008 — Mock Exam

Audit:

- Exam listing
- Starting an exam
- Timer
- Question navigation
- Answer selection
- Mark for review
- Exam pause/resume policies
- Submit confirmation
- Timeout behavior
- Result page
- Review wrong answers
- Attempt history

Investigate whether different exam IDs correctly load their own questions.

## FUNC-009 — Learning Progress

Check:

- Course completion
- Skill-level progress
- Study time
- Streak
- SRS mastery
- Exam history
- Learning recommendations

Check aggregation consistency across pages.

## FUNC-010 — Edge Cases

Include:

- First-time user
- User without progress
- Returning user
- User with completed lessons
- No pending SRS cards
- Empty vocabulary dataset
- Missing question data
- Expired session
- Invalid route
- Network/API failure
- Duplicate click or submission

## Deliverables

Write:
docs/audit/01-functional-audit.md

For each journey, provide:

- Journey ID
- Preconditions
- Step-by-step actions
- Expected result
- Actual result
- PASS / FAIL / BLOCKED / NOT_TESTED
- Evidence
- Defect ID
- Recommended action

Include a Functional Coverage Matrix and a list of missing features.

STOP and request Product Owner review.
