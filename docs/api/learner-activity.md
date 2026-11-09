# Learner App — Activity, Progress & Preferences API/DB Contract

**Status:** Approved by the owner in chat on 2026-11-06 ("theo phương án 1 nhé"). Recorded in `docs/phase-state.yaml` → `learner_redesign`.
**UI reference:** `docs/design/learner-app/index.html` (frames 02, 03, 05, 09) · **UI approval:** `docs/ui-approval.md` §5
**Plan:** `docs/superpowers/plans/2026-11-06-learner-app-redesign.md`, Tasks 11–14 (Part B), wired in Task 15.

## 1. Conventions
- Base `/api/v1`, session cookie `jlpt_session`, JSON bodies, error envelope `{ "error": { "code", "message" } }`.
- Identity comes only from the session; any `userId` in a body or query is ignored.
- `401 UNAUTHORIZED` no session · `400 BAD_REQUEST` validation (zod, strict) · `500 <MODULE>_FAILED` unexpected.
- Local day = calendar day in the profile `timezone` (default `Asia/Ho_Chi_Minh`), computed with `Intl.DateTimeFormat("en-CA", { timeZone })`. Server local time is never used.
- Scores are internal estimates (SPEC §153); no field is named or described as an official JLPT score.

## 2. Endpoints

### 2.1 `POST /progress/activity` — study heartbeat (new, Task 11)
Sent by the lesson and exam pages every 60 s while the tab is visible.

| | |
|---|---|
| Body | `{ "minutes": 1–5 }` (integer) |
| `204` | Recorded: adds minutes to today's local-day row (upsert-increment) |
| `400 BAD_REQUEST` | missing, non-integer, `< 1` or `> 5` |
| `401 UNAUTHORIZED` | no session |

The service also clamps to 1–5 per call (defence in depth for internal callers).

### 2.2 `GET /progress/overview` — changed (Task 11)
Adds `activity`; **removes `currentStreak`** (it was `completed > 0 ? 1 : 0`, not a streak). Only `app/dashboard/page.tsx` and its test read it; both change in Part A/C.

```ts
type ActivitySummary = {
  todayMinutes: number;
  dailyGoalMinutes: number;          // from UserProfile, default 30
  streakDays: number;                // consecutive local days with minutes > 0,
                                     // ending today, or yesterday if today = 0
  week: { day: string /* YYYY-MM-DD */; minutes: number | null }[]; // Mon→Sun, length 7, future days null
};
// response: { data: { ...existing fields except currentStreak, activity: ActivitySummary } }
```

### 2.3 `GET /courses` — changed (Task 12)
Each lesson gains `progressStatus: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED"` from the session user's `lesson_progress` row; `NOT_STARTED` when there is no row or no session. One `findMany` per request (no N+1). Endpoint stays public.

### 2.4 `GET /exams` — changed (Task 13)
Each exam gains `bestInternalScore: number | null` (max `internal_score` over the user's `SUBMITTED` attempts) and `attemptCount: number` (count of `SUBMITTED` attempts). `null` / `0` when signed out. `IN_PROGRESS` and expired attempts are ignored.

### 2.5 `GET /attempts` — my attempt history (new, Task 13)

| | |
|---|---|
| Query | `limit` integer, clamped to 1–50, default 20 |
| `200` | `{ data: { id, examId, examTitle, internalScore, maxScore, submittedAt, durationSeconds }[] }` — session user's `SUBMITTED` attempts only, newest `submittedAt` first |
| `401 UNAUTHORIZED` | no session |

`maxScore` is 180 for N5 internal scoring; `durationSeconds = submittedAt − startedAt`. Another user's attempts are never returned (IDOR test).

### 2.6 `GET /profile` — changed (Task 14)
Adds `furiganaDefault: boolean` (default `true`) and `uiLanguage: "vi" | "en"` (default `"vi"`).

### 2.7 `PATCH /profile` — new (Task 14)

| | |
|---|---|
| Body (strict, partial) | `{ dailyGoalMinutes?: int 5–240, furiganaDefault?: boolean, uiLanguage?: "vi" \| "en" }` |
| `200` | the full `GET /profile` shape after the update |
| `400 BAD_REQUEST` | empty body `{}`, unknown key (other than an ignored `userId`), or invalid value |
| `401 UNAUTHORIZED` | no session |

Upserts the profile; does **not** touch `onboardingCompletedAt` or `targetLevel`. `POST /profile` (onboarding) is unchanged.

UI note: Profile's goal control offers 5/10/15/20 min; a stored value outside that set (e.g. the default 30) is shown as an extra selected chip, not silently changed.

## 3. Prisma diff (MariaDB, provider `mysql`)

```prisma
model StudyActivity {
  id      String   @id @default(uuid()) @db.Char(36)
  userId  String   @map("user_id") @db.Char(36)
  day     DateTime @db.Date            // local calendar day (see §1)
  minutes Int      @default(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, day])
  @@map("study_activities")
}

model User {
  // ...existing fields
  studyActivities StudyActivity[]
}

model UserProfile {
  // ...existing fields
  furiganaDefault Boolean @default(true) @map("furigana_default")
  uiLanguage      String  @default("vi") @map("ui_language") @db.Char(2)
}
```

Migrations: one for `study_activities` (Task 11), one for the two profile columns (Task 14). Both are additive; existing rows get the defaults. No change to `lesson_progress`, `exam_attempts` or admin tables.

## 4. Out of scope
- Exam question flags (client `sessionStorage`, UI question 6).
- Sequential lesson unlocking (UI question 4).
- Any official JLPT scaled score or pass prediction.
