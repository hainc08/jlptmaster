# JLPT Master Learner App Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the learner-facing screens to match the learner design review: new tokens, a 5-tab shell (bottom bar on mobile, sidebar at ≥1024px), restyled Welcome, Home, Learn, Lesson, Mock lobby, Exam, Result and Kanji screens, and a new Profile page. All of it backed by real data, with no mock values.

**Architecture:** Part A swaps tokens and the shell, then restyles each page on the APIs that already exist. Part B adds the data the design needs and the APIs don't have yet: study activity (minutes, streak, week), per-lesson progress, best score per exam, attempt history and stored furigana/language preferences. These are small services in `src/server/services/` with thin `app/api/v1` routes. Part C wires that data into the screens and adds `/profile`. A widget whose data isn't available yet renders nothing rather than a placeholder number.

**Tech Stack:** Next.js 16.4 (App Router), React 19, Tailwind 4, lucide-react, Prisma 6 (`mysql` → MariaDB), zod 4, Vitest 3 + Testing Library, Playwright.

**Spec:** `docs/design/learner-app/index.html` (visual and behavioral reference; mobile frames 01–09, states S1–S4, desktop 02D/05D/06D), `SPEC.md` (FR furigana/ruby §114–115, scoring §153), `AGENTS.md` (gates).

## Global Constraints

- **Gates (AGENTS.md):** Task 1 is docs only and ends with a STOP. Part A (Tasks 2–10) needs the owner's written UI approval in `docs/phase-state.yaml`. Part B (Tasks 11–14) also needs the API/DB contract approval. Never self-approve. Never deploy production without explicit approval.
- This redesign replaces screens that are already approved (`docs/ui-approval.md`). Nothing ships until the owner signs off on Task 1's packet.
- Read the relevant guide in `node_modules/next/dist/docs/` before writing page, route or `next/font` code.
- TDD for every task: RED, then GREEN, then refactor, then regression (`npm test`, `npm run typecheck`, `npm run lint`). Paste the real command output into `docs/phase-log.md`.
- Tokens, copied exactly from the review's `:root`: primary `#3730A3`, on-primary-container `#1A1465`, primary-container `#E3E1FF`, accent `#C0331B`, accent-container `#FFDAD3`, surface `#FAF9FD`, on-surface `#1B1B22`, on-surface-variant `#46464F`, outline `#767680`, outline-variant `#CAC9D4`, ok `#14663A`/`#D3F0DC`, warn `#744C00`/`#FFE7B0`, err `#9A2B1B`/`#FFDAD3`, locked text `#5E5E68`. Cards 16px radius, controls 12px, 8px grid, touch targets ≥ 48px, WCAG AA, light mode only.
- Fonts: Noto Sans (subsets `latin`, `vietnamese`) for UI, Noto Sans JP for Japanese, both through `next/font/google`.
- Navigation: tabs in order **Trang chủ `/dashboard` · Học `/learn/n5` · Thi thử `/mock-exams` · Kanji `/kanji` · Hồ sơ `/profile`**. Bottom bar below 1024px, left sidebar at ≥1024px. Focus routes `/learn/n5/[slug]` and `/mock-exams/[attemptId]` show neither.
- Only N5 has content. N4–N1 show a lock icon and "Sắp ra mắt" and are `aria-disabled`; never a link to content.
- Scoring copy: every score reads "Điểm ước tính", next to the exact sentence "Điểm ước tính, không phải cách chấm điểm chính thức của JLPT." The 80/180 mark is labelled "Mốc tham khảo". Never fabricate content, scores or results.
- No social features, chat, payments or dark mode. Don't change `/admin/**`.
- One commit per task, conventional style, ending with the harness Co-Authored-By line.

## Review Focus

1. **Furigana preference without a working `localStorage`** (private mode, blocked storage) and on first server render: no crash, no hydration mismatch, defaults to On. Test in Task 3.
2. **Exam timer reaching 0 while the submit dialog is open:** auto-submit runs exactly once, the dialog closes, and a second click on "Nộp bài" doesn't send a second finish request. Test in Task 8.
3. **Streak and day boundaries in Asia/Ho_Chi_Minh:** study at 23:50 and again at 00:10 local counts as two consecutive days, even though the server runs on UTC. A gap of one day resets the streak to 1. Test in Task 11.
4. **Locked levels reached by keyboard or URL** (`/learn/n4`, Enter on the N4 chip, `?level=N4` on the lobby): the user sees the locked state (S4), never content, a 404 or an unhandled error. Test in Task 5.
5. **Narrow and long-text layouts:** at 320px wide with EN selected and the longest Vietnamese title, the top bar (title + furigana + VI/EN) and the level selector never scroll the page horizontally. Test in Task 4 (Playwright).

## Open questions for the owner (answer in the Task 1 approval)

1. **Navigation:** the new 5 tabs drop "Luyện tập" and "Tiến độ". Plan: Vocabulary, Grammar, Flashcards and Practice stay as routes and get a "Công cụ học" link row on the Learn screen. Progress moves to Home and Profile. Approve?
2. **Palette and font:** this replaces the vermilion-primary scheme and Be Vietnam Pro in `docs/design-system.md` with the Admin palette and Noto Sans. Approve?
3. **"Có khả năng đạt / Chưa đạt" chips:** SPEC §153 forbids *definitive* pass predictions. Plan: keep the chips, always paired with "ước tính" and the disclaimer. Approve, or show the percentage only?
4. **Sequential unlocking** ("Hoàn thành Bài 4 để mở khóa") would be a new business rule. Plan: **no** unlocking rule. Every published N5 lesson stays open, and locked applies only to N4–N1. Approve?
5. **EN scope:** the review translates navigation and headings only. Plan: the same, through a small dictionary, with full EN out of scope. Approve?
6. **Exam flags:** plan keeps them client-side in `sessionStorage` per attempt, with no schema change. Approve?

---

## File Structure

| Path | Responsibility |
|---|---|
| `app/globals.css` | New tokens and `@theme` mapping; ruby/furigana rules |
| `app/layout.tsx` | Fonts and providers; renders `AppShell` instead of `Navbar`/`BottomNav`/`Footer` |
| `app/components/nav-config.ts` | `LEARNER_TABS`, `getActiveTab()`, `isFocusPath()`, `showsFurigana()`; keeps `isCmsPath`, `postLoginTarget`, `JLPT_LEVELS` |
| `app/components/RubyText.tsx` | `FuriganaProvider` with `setFurigana`, persistence and server default |
| `app/components/i18n.tsx` | `LocaleProvider`, `useT()`, VI/EN dictionary (nav + headings) |
| `app/components/shell/{AppShell,TopBar,BottomTabs,SideNav}.tsx` | Learner chrome |
| `app/components/ui/{LevelSelector,ProgressRing,StateView,WeekBars}.tsx` | Shared primitives |
| `app/{login,register,dashboard,learn/n5,learn/n5/[lessonSlug],mock-exams,mock-exams/[attemptId],results/[attemptId],kanji}/page.tsx` | Restyled screens |
| `app/learn/[level]/page.tsx` | Locked state for N4–N1 |
| `app/profile/page.tsx` | New Profile screen |
| `prisma/schema.prisma` + migration | `StudyActivity`; `UserProfile.furiganaDefault`, `UserProfile.uiLanguage` |
| `src/server/services/study-activity-service.ts` | Record minutes; summary (today, streak, week) |
| `app/api/v1/progress/activity/route.ts` | POST heartbeat |
| `app/api/v1/attempts/route.ts` | GET my submitted attempts |
| Old `Navbar.tsx`, `BottomNav.tsx`, `LearningToolbar.tsx`, `Footer.tsx` | Deleted in Task 4 once nothing imports them |

---

## Part 0 — Approval

### Task 1: Approval packet (docs only — STOP after this task)

**Files:** Modify `docs/ui-approval.md` (new section "Learner app redesign"), `docs/design-system.md` (new tokens marked *proposed*), `docs/phase-log.md`. Create `docs/api/learner-activity.md` (contract for Tasks 11–14).

- [ ] **Step 1:** In `ui-approval.md`, list every review frame (01–09, 06b, S1–S4, 02D, 05D, 06D), its route and what it replaces. Copy the six open questions above, each with the planned default.
- [ ] **Step 2:** In `learner-activity.md`, write the request and response shape and the error codes for every endpoint in Tasks 11–14, exactly as their Interfaces blocks below define them, plus the Prisma diff.
- [ ] **Step 3:** Commit `docs: learner redesign approval packet`, then **STOP** and ask the owner for written approval of UI and API/DB. Don't edit `phase-state.yaml` yourself.

---

## Part A — Shell and screens on existing APIs (requires UI approval)

### Task 2: Tokens, fonts and nav model

**Files:** Modify `app/globals.css`, `app/layout.tsx` (fonts only), `app/components/nav-config.ts`. Test: `tests/unit/nav-config.test.ts`, `tests/unit/tokens.test.ts`.

**Interfaces — Produces:**
- `type TabId = "home" | "learn" | "test" | "kanji" | "profile"`
- `LEARNER_TABS: { id: TabId; labelKey: string; href: string }[]` (order and hrefs from Global Constraints)
- `getActiveTab(pathname: string): TabId | null`: `/learn*`, `/vocabulary`, `/grammar`, `/flashcards` and `/practice` map to learn; `/mock-exams*` and `/results*` map to test; `/kanji*` maps to kanji; `/profile*` maps to profile; `/dashboard` maps to home; anything else returns null
- `isFocusPath(pathname: string): boolean`: true for `/learn/n5/<slug>` and `/mock-exams/<attemptId>`
- `showsFurigana(pathname: string): boolean`: true for learn, kanji, results and the focus paths; false for `/dashboard`, `/profile`, `/login`, `/register`

- [ ] **Step 1:** Write the failing tests. Table-test `getActiveTab` for every route listed above (including `/results/abc` → `"test"` and `/admin/members` → `null`) and `isFocusPath` for `/learn/n5` (false), `/learn/n5/bai-3` (true), `/mock-exams` (false) and `/mock-exams/123` (true). Add `tokens.test.ts`, which reads `app/globals.css` and asserts it contains `--primary: #3730A3;` and `--accent: #C0331B;`.
- [ ] **Step 2:** Run `npx vitest run tests/unit/nav-config.test.ts tests/unit/tokens.test.ts`. Expect FAIL.
- [ ] **Step 3:** Implement. In `globals.css`, keep the existing variable *names* that pages use (`--primary`, `--border`, `--muted`, …) mapped to the new values, and add `--accent`, `--accent-container`, `--primary-container`, `--locked`. Hide furigana with `.furigana-hidden rt{visibility:hidden}` so the layout doesn't jump. In the layout, swap `Be_Vietnam_Pro` for `Noto_Sans` (`subsets: ["latin","vietnamese"]`) and keep `--font-vietnamese` as the variable name.
- [ ] **Step 4:** Run the tests again (PASS), then `npm test` (expect the old `HeaderNavigation.test.tsx` assertions on "Học tập"/"Luyện tập" to still pass, since the shell isn't replaced yet).
- [ ] **Step 5:** Commit `feat(learner): new tokens, Noto Sans and 5-tab nav model`.

### Task 3: Furigana and locale providers

**Files:** Modify `app/components/RubyText.tsx`. Create `app/components/i18n.tsx`. Test: `tests/components/FuriganaLocale.test.tsx`.

**Interfaces — Produces:**
- `FuriganaProvider({ initial?: boolean })` and `useFurigana(): { showFurigana: boolean; setFurigana(on: boolean): void; toggleFurigana(): void }`. Persists to `localStorage["jlpt.furigana"]` as `"1"`/`"0"`; reads after mount; every storage access is wrapped in try/catch.
- `LocaleProvider({ initial?: "vi" | "en" })`, `useLocale(): { locale; setLocale(l) }`, `useT(): (key: string) => string`. Keys: `nav.home|learn|test|kanji|profile`, `furigana.on|off`, plus the headings used in Tasks 6–10 and 15. VI is the source; a missing EN key falls back to VI. Persists to `localStorage["jlpt.locale"]`; sets `document.documentElement.lang`.

- [ ] **Step 1:** Write the failing tests:
  - `setFurigana(false)` adds `furigana-hidden` to the wrapper, and a remount reads `"0"` back.
  - With `localStorage.getItem` and `setItem` mocked to throw, rendering and toggling don't throw and the default is On. *(Review Focus 1)*
  - `useT()("nav.learn")` returns `"Học"`, and after `setLocale("en")` returns `"Learn"`. An unknown key returns the VI string, never `undefined`.
- [ ] **Step 2:** Run `npx vitest run tests/components/FuriganaLocale.test.tsx`. Expect FAIL.
- [ ] **Step 3:** Implement. Initial state comes from `initial ?? true`, so server and first client render match. Storage is read in `useEffect`.
- [ ] **Step 4:** Run it again (PASS), plus `tests/components/RubyText.test.tsx` (still PASS).
- [ ] **Step 5:** Commit `feat(learner): persistent furigana and VI/EN locale providers`.

### Task 4: App shell (top bar, bottom tabs, sidebar)

**Files:** Create `app/components/shell/{AppShell,TopBar,BottomTabs,SideNav}.tsx`. Modify `app/layout.tsx`. Delete `Navbar.tsx`, `BottomNav.tsx`, `LearningToolbar.tsx`, `Footer.tsx` and their tests (`HeaderNavigation.test.tsx`; the footer part of `FooterAndErrorPages.test.tsx`). Test: `tests/components/AppShell.test.tsx`, `e2e/learner-shell.spec.ts`.

**Interfaces:**
- Consumes `LEARNER_TABS`, `getActiveTab`, `isFocusPath`, `showsFurigana` (Task 2), `useFurigana`, `useT`, `useLocale` (Task 3), `isCmsPath` (existing).
- Produces `AppShell({ children })`. It renders nothing extra on `isCmsPath`, `/login`, `/register` and `/` (Welcome has its own top bar), and only `children` on focus paths. Elsewhere it renders `TopBar` + `<main>` + `BottomTabs` (CSS `lg:hidden`) + `SideNav` (`hidden lg:flex`).
- `TopBar({ title?: string })`: brand or title on the left. On the right: the furigana segmented control (`role="group"`, `aria-label="Furigana"`, buttons "Bật"/"Tắt" with `aria-pressed`), only when `showsFurigana(pathname)`, followed by the VI/EN control (`aria-label="Ngôn ngữ"`).
- `BottomTabs` and `SideNav`: `<nav aria-label="Điều hướng chính">`; the active link has `aria-current="page"`; the Kanji icon is the glyph 字.

- [ ] **Step 1:** Write failing component tests (mock `usePathname`):
  - On `/mock-exams` there are exactly 5 links in nav order, and "Thi thử" has `aria-current="page"`.
  - On `/dashboard` there is no furigana group; on `/kanji` there is one, and clicking "Tắt" sets `aria-pressed="true"` on it.
  - On `/mock-exams/abc` there is no navigation landmark.
  - On `/admin/members` nothing renders except children.
- [ ] **Step 2:** Write a failing Playwright test (`e2e/learner-shell.spec.ts`), logged in as the seeded student. At viewport 320×700 with EN selected on `/learn/n5` and `/mock-exams`, assert `document.documentElement.scrollWidth <= 320` *(Review Focus 5)*. At 1280×800 the bottom tab bar is hidden and the sidebar is visible.
- [ ] **Step 3:** Run `npx vitest run tests/components/AppShell.test.tsx` and `npx playwright test e2e/learner-shell.spec.ts`. Expect FAIL.
- [ ] **Step 4:** Implement, then delete the old components and their tests. Pages that imported `LearningToolbar` drop it, because the top bar now owns the toggle.
- [ ] **Step 5:** Run both tests (PASS), then `npm test`, `npm run typecheck` and `npm run lint`.
- [ ] **Step 6:** Commit `feat(learner): 5-tab shell with contextual furigana and VI/EN`.

### Task 5: Shared UI primitives and the locked level route

**Files:** Create `app/components/ui/{LevelSelector,ProgressRing,StateView,WeekBars}.tsx`, `app/learn/[level]/page.tsx`. Test: `tests/components/UiPrimitives.test.tsx`.

**Interfaces — Produces:**
- `LevelSelector({ value?: "N5" })`: five buttons from `JLPT_LEVELS`. N5 has `aria-pressed="true"`. N4–N1 have `aria-disabled="true"`, a lock icon and the caption "Sắp ra mắt", and clicking or pressing Enter on them does nothing.
- `ProgressRing({ value: number; max: number; label: string; tone?: "primary" | "ok" })`: `role="img"`, `aria-label={label}`, value clamped to 0–max.
- `StateView({ kind: "loading" | "empty" | "error" | "locked"; title; body?; action?: { label; onClick | href } })`: frames S1–S4. `error` uses `role="alert"`; `loading` uses `aria-busy="true"` with skeleton blocks.
- `WeekBars({ days: { label: string; minutes: number | null }[]; todayIndex: number })`: `null` means a future day (dashed bar). `role="img"` with an aria-label listing each day's minutes.
- `/learn/[level]`: `N5` redirects to `/learn/n5`. `N4`–`N1` (any case) render `StateView kind="locked"` with "Nội dung {L} đang được biên soạn" and an action "Về lộ trình N5". Anything else calls `notFound()`.

- [ ] **Step 1:** Write failing tests:
  - Clicking and pressing Enter on N4 calls no handler and leaves N5 pressed *(Review Focus 4)*.
  - `ProgressRing value=20 max=15` is clamped (aria-label unchanged, arc 100%).
  - `StateView kind="error"` has `role="alert"`.
  - The level page for `n4` renders the locked title and for `n5` calls `redirect("/learn/n5")` (mock `next/navigation`).
- [ ] **Step 2:** Run `npx vitest run tests/components/UiPrimitives.test.tsx`. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run (PASS).
- [ ] **Step 5:** Commit `feat(learner): level selector, ring, state views, week bars`.

### Task 6: Welcome, login and register (frame 01)

**Files:** Modify `app/page.tsx` (Welcome), `app/login/page.tsx`, `app/register/page.tsx`. Test: `tests/components/WelcomeAuth.test.tsx`; update `e2e/auth.spec.ts` selectors.

**Interfaces:** Consumes `LevelSelector`, the existing `POST /api/v1/auth/login|register`, `POST /api/v1/profile` and `postLoginTarget`. Login and register share an `AuthCard({ mode: "in" | "up" })` component with a tab switch ("Đăng nhập" / "Đăng ký" links between `/login` and `/register`). Register sends `targetLevel: "N5"`.

- [ ] **Step 1:** Write failing tests:
  - `/login` shows the email and password fields, a level selector with N5 pressed, the button "Đăng nhập" and the link "Quên mật khẩu?".
  - `/register` shows the button "Tạo tài khoản" and no "Quên mật khẩu?".
  - Submitting the login form calls the existing login endpoint with `{ email, password }`.
  - There is no social-login button (`queryByRole("button",{name:/google|facebook|apple/i})` is null).
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement. The button's accessible name stays compatible with `e2e/helpers.ts` (`/Đăng nhập vào hệ thống/` uses `aria-label`), or update the helper in the same commit.
- [ ] **Step 4:** Run the unit tests plus `npx playwright test e2e/auth.spec.ts` (PASS).
- [ ] **Step 5:** Commit `feat(learner): welcome and auth screens`.

### Task 7: Learn, Lesson and Kanji restyle (frames 03, 04, 08)

**Files:** Modify `app/learn/n5/page.tsx`, `app/learn/n5/[lessonSlug]/page.tsx`, `app/kanji/page.tsx`. Test: `tests/components/LearnLessonKanji.test.tsx`.

**Interfaces:** Consumes `GET /api/v1/courses?level=N5` and `GET/POST` lessons (existing), `GET /api/v1/kanji`, `StateView`, `RubyText`.
- Learn has tabs Từ vựng / Ngữ pháp / Đọc hiểu. Units are listed in `position` order with the title in Vietnamese and Japanese with ruby. Until Task 12 lands, the unit status chip is omitted. A "Công cụ học" row links to `/vocabulary`, `/grammar`, `/flashcards` and `/practice` (Open question 1).
- Lesson has card progress "Thẻ n / total" and step bars; the word with ruby, its reading, Hán Việt, meaning and example with an audio button (existing `AudioButton`); "Ôn lại" and "Đã thuộc" go to the next card. After the last card it calls the existing complete endpoint once.
- Kanji has the search box (`aria-label="Tìm kanji"`) and a 3-column grid; tapping a card opens a bottom sheet (`role="dialog"`, Escape closes, focus moves to the close button) with stroke count, On, Kun, Hán Việt, meaning and example words. An empty search result shows `StateView kind="empty"` "Không tìm thấy kanji".

- [ ] **Step 1:** Write failing tests:
  - Learn renders one unit per lesson returned by the mocked fetch, in position order.
  - Clicking "Đã thuộc" 12 times on a 12-card lesson calls the complete endpoint exactly once.
  - A Kanji search with no matches shows "Không tìm thấy kanji".
  - Opening a kanji detail puts focus on "Đóng", and Escape closes it.
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement. **Step 4:** Run (PASS), plus `tests/components/DashboardAndLearningTruth.test.tsx`.
- [ ] **Step 5:** Commit `feat(learner): learn, lesson card and kanji handbook redesign`.

### Task 8: Mock lobby and exam taking (frames 05, 06, 06b, 05D, 06D)

**Files:** Modify `app/mock-exams/page.tsx`, `app/mock-exams/[attemptId]/page.tsx`. Test: `tests/components/ExamTaking.test.tsx`; update `e2e/exam-flow.spec.ts`.

**Interfaces:** Consumes `GET /api/v1/exams?level=N5` (`totalMinutes`, `totalQuestions`), `POST /exams/[id]/start`, `GET /attempts/[id]` and `POST /attempts/[id]/answers|finish` (existing, autosave kept).
- Lobby: one card per exam with duration, question count, best score (or "—" until Task 13), and the CTA "Bắt đầu" (no attempts) or "Làm lại". The disclaimer note sits above the list. A single dashed locked card covers N4–N1. `?level=N4` shows the same locked card and never fetches *(Review Focus 4)*.
- Exam: a sticky header with exit, title, "Câu n/total", the timer (`aria-label="Thời gian còn lại"`) and "Nộp bài". The navigator grid uses 5 columns of 44px cells on mobile and a pinned right pane at `lg`. Cell states: answered (indigo fill), flagged (vermilion dot), current (vermilion ring). Flags live in `sessionStorage["jlpt.flags.<attemptId>"]` as a JSON array (Open question 6). The footer has Trước / Đánh dấu (`aria-pressed`) / Tiếp. The submit dialog (`role="dialog"`, `aria-modal`) shows the counts for Đã trả lời / Chưa trả lời / Đánh dấu, and focus goes to "Tiếp tục làm bài".

- [ ] **Step 1:** Write failing tests (fake timers, mocked fetch):
  - Toggling "Đánh dấu" on Q5 marks cell 5 as flagged and survives a remount (sessionStorage).
  - The dialog counts match: 3 answered of 10 gives "3", "7" and the flag count.
  - Clicking "Nộp bài" twice in the dialog makes one `finish` call.
  - The timer reaching 0 while the dialog is open makes exactly one `finish` call and closes the dialog *(Review Focus 2)*.
  - The tested (underlined) word renders without `<rt>` even with furigana On.
  - In the lobby, a 500 from `/api/v1/exams` shows `role="alert"` "Không tải được danh sách đề" (frame S3), and "Thử lại" refetches.
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement with one `finishOnce` guard (a ref) shared by the dialog and the timer. **Step 4:** Run (PASS), plus `tests/components/ExamEngineIntegration.test.tsx` and `npx playwright test e2e/exam-flow.spec.ts`.
- [ ] **Step 5:** Commit `feat(learner): mock lobby and exam taking redesign`.

### Task 9: Result screen (frame 07)

**Files:** Modify `app/results/[attemptId]/page.tsx`. Test: `tests/components/ResultScreen.test.tsx`.

**Interfaces:** Consumes `GET /api/v1/attempts/[id]/result` (existing: `internalScore`, `maxScore`, section breakdown with `correct/total/percent`, `itemReviews`, `weakSkills`).
- Shows a `ProgressRing` with internalScore/maxScore, the chip "Có khả năng đạt" (score ≥ 80 of 180, scaled by `maxScore`) or "Chưa đạt", the heading "Điểm ước tính", "Mốc tham khảo: 80/180" and the exact disclaimer sentence from Global Constraints.
- Shows the sections Kiến thức ngôn ngữ / Đọc hiểu / Nghe hiểu with `correct/total · percent%`.
- "Câu sai cần xem lại" lists the wrong `itemReviews` (the learner's choice next to the correct one), the first 3 plus "Xem tất cả N câu". Keep the existing JEES/Japan Foundation independence notice.

- [ ] **Step 1:** Write failing tests:
  - The disclaimer sentence is present verbatim.
  - 79/180 shows "Chưa đạt" and 80/180 shows "Có khả năng đạt".
  - With 5 wrong items, 3 are listed and the button reads "Xem tất cả 5 câu".
  - With 0 wrong items, the empty state reads "Bạn không sai câu nào".
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement. **Step 4:** Run (PASS).
- [ ] **Step 5:** Commit `feat(learner): result screen with estimated-score labelling`.

### Task 10: Home on existing data (frame 02 / 02D)

**Files:** Modify `app/dashboard/page.tsx`. Test: `tests/components/HomeDashboard.test.tsx`.

**Interfaces:** Consumes `GET /api/v1/progress/overview` (`nextLesson`, `completedLessonsCount`, `totalLessonsCount`, `dueReviewsCount`, `recentAttempts`), `GET /api/v1/profile`, `LevelSelector`, `StateView`.
- Shows a greeting by local hour (sáng < 11, trưa < 14, chiều < 18, otherwise tối), the `LevelSelector`, the "Tiếp tục học" card from `nextLesson`, "Ôn tập {dueReviewsCount} từ" when > 0, and the latest attempt.
- `overview.activity` is undefined until Task 11, so the goal ring, streak and week bars **don't render at all**. Remove the fake `currentStreak` display.
- Desktop uses a 2-column grid at `lg`, as in 02D. Loading uses S1, and a fetch failure shows `StateView error` with "Thử lại" (refetch).

- [ ] **Step 1:** Write failing tests:
  - With `activity` absent there is no element named /ngày liên tiếp/ and no ring.
  - At 09:00 the greeting starts "Chào buổi sáng".
  - A 500 response shows `role="alert"`, and clicking "Thử lại" fetches again.
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement. **Step 4:** Run (PASS), plus `npm test`.
- [ ] **Step 5:** Commit `feat(learner): home dashboard redesign (no placeholder stats)`.

---

## Part B — Data the design needs (requires API/DB contract approval)

### Task 11: Study activity, streak and week

**Files:** Modify `prisma/schema.prisma` and add a migration. Create `src/server/services/study-activity-service.ts`, `app/api/v1/progress/activity/route.ts`. Modify `app/api/v1/progress/overview/route.ts`. Test: `tests/integration/study-activity.test.ts`.

**Interfaces — Produces:**
- Model `StudyActivity { id Char(36) uuid, userId Char(36) FK→User cascade, day DateTime @db.Date (local calendar day), minutes Int @default(0), @@unique([userId, day]), @@map("study_activities") }`.
- `recordStudyMinutes(userId: string, minutes: number, now: Date, tz: string): Promise<void>`: upsert-increment by the local day of `now` in `tz`; minutes clamped to 1–5 per call.
- `export type ActivitySummary = { todayMinutes: number; dailyGoalMinutes: number; streakDays: number; week: { day: string /* YYYY-MM-DD */; minutes: number | null }[] }`
- `getActivitySummary(userId: string, now: Date, tz: string, dailyGoalMinutes: number): Promise<ActivitySummary>`. `week` runs Monday to Sunday of the current local week, with `null` for future days. `streakDays` counts consecutive local days with minutes > 0, ending today, or yesterday if today has 0.
- `POST /api/v1/progress/activity` with body `{ minutes: 1–5 }` returns `204` (`400 BAD_REQUEST` when invalid, the auth envelope when signed out). Overview adds `activity: ActivitySummary` and drops `currentStreak`.

- [ ] **Step 1:** Write failing integration tests (test DB):
  - Recording at 23:50 and at 00:10 local (Asia/Ho_Chi_Minh, given as UTC instants 16:50Z and 17:10Z) creates two rows and `streakDays === 2` *(Review Focus 3)*.
  - A missing day resets the streak to 1.
  - Today at 0 minutes keeps yesterday's streak.
  - `minutes: 9` is clamped to 5.
  - `week` has length 7 with future days `null`.
  - POST with `minutes: 0` returns 400.
- [ ] **Step 2:** Run `npx vitest run tests/integration/study-activity.test.ts`. Expect FAIL.
- [ ] **Step 3:** Implement. Compute the local day with `Intl.DateTimeFormat("en-CA",{timeZone:tz})`; never use the server's local time.
- [ ] **Step 4:** Run (PASS), then `npm run db:migrate:status`, `npm test` and `npm run typecheck`.
- [ ] **Step 5:** Commit `feat(progress): study activity minutes, streak and week summary`.

### Task 12: Per-lesson progress in courses

**Files:** Modify `app/api/v1/courses/route.ts`. Test: extend `tests/integration/api-v1-routes.test.ts`.

**Interfaces — Produces:** each lesson in the response gains `progressStatus: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED"`, taken from the signed-in user's `LessonProgress` row (`NOT_STARTED` when there's no row or no session).

- [ ] **Step 1:** Write a failing test: a seeded student with one completed lesson gets `COMPLETED` for it and `NOT_STARTED` for the others, and an anonymous request gets all `NOT_STARTED`.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement with one `findMany` on `LessonProgress` for the user (no N+1). **Step 4:** Run (PASS).
- [ ] **Step 5:** Commit `feat(courses): per-lesson progress status`.

### Task 13: Best score per exam and attempt history

**Files:** Modify `app/api/v1/exams/route.ts`. Create `app/api/v1/attempts/route.ts`. Test: `tests/integration/exam-history.test.ts`.

**Interfaces — Produces:**
- Each exam in `/api/v1/exams` gains `bestInternalScore: number | null` and `attemptCount: number` for the session user (`null`/0 when signed out).
- `GET /api/v1/attempts?limit=` (1–50, default 20) returns `{ data: { id; examId; examTitle; internalScore; maxScore; submittedAt; durationSeconds }[] }`, with SUBMITTED attempts of the session user only, newest first. It requires a session.

- [ ] **Step 1:** Write failing tests:
  - Best is the max over the user's SUBMITTED attempts; IN_PROGRESS attempts are ignored.
  - User B never sees user A's attempts (IDOR).
  - `limit=0` and `limit=999` are clamped.
  - No session gets 401 with the auth envelope.
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement with `groupBy` on examId for the best score. **Step 4:** Run (PASS), plus `tests/security/auth-session-and-idor.test.ts`.
- [ ] **Step 5:** Commit `feat(exams): best score per exam and my attempt history`.

### Task 14: Stored furigana and language preferences

**Files:** Modify `prisma/schema.prisma` and add a migration. Modify `app/api/v1/profile/route.ts`. Test: extend `tests/integration/profile-api.test.ts`.

**Interfaces — Produces:**
- `UserProfile.furiganaDefault Boolean @default(true) @map("furigana_default")` and `UserProfile.uiLanguage String @default("vi") @db.Char(2) @map("ui_language")`.
- GET returns both. New `PATCH /api/v1/profile` takes a strict, partial body `{ dailyGoalMinutes?: 5|10|15|20…240, furiganaDefault?: boolean, uiLanguage?: "vi"|"en" }`. An empty body returns 400. It doesn't touch `onboardingCompletedAt`. POST is unchanged.

- [ ] **Step 1:** Write failing tests:
  - PATCH `{ furiganaDefault:false }` changes only that field.
  - `{ uiLanguage:"jp" }` returns 400.
  - `{}` returns 400.
  - A `userId` in the body is ignored.
- [ ] **Step 2:** Run and expect FAIL. **Step 3:** Implement. **Step 4:** Run (PASS).
- [ ] **Step 5:** Commit `feat(profile): furigana and UI language preferences`.

---

## Part C — Wire the data and add Profile

### Task 15: Profile page and wiring (frames 09, 02, 03, 05)

**Files:** Create `app/profile/page.tsx`. Modify `app/dashboard/page.tsx`, `app/learn/n5/page.tsx`, `app/mock-exams/page.tsx`, `app/layout.tsx` (pass the profile prefs as `initial` to the providers), and the lesson and exam pages (send heartbeats). Test: `tests/components/ProfileAndWiring.test.tsx`; create `e2e/learner-journey.spec.ts`.

**Interfaces:** Consumes Tasks 11–14 and `POST /api/v1/auth/logout`.
- Profile shows the avatar initials, name, email, "Đang học N5", the stats (streak, "Thẻ đã học" = overview `totalReviewsCount` (the review uses "Từ đã thuộc"; renamed, because a review card isn't proof the word is learned), attempts = history length), the exam history list (score/max, "Có khả năng đạt"/"Chưa đạt" by the Task 9 rule, date `dd/MM/yyyy`, duration), and settings. The furigana default switch calls PATCH and `setFurigana`; the VI/EN control calls PATCH and `setLocale`; the daily goal segmented control (5/10/15/20) calls PATCH; "Đăng xuất" calls logout and goes to `/login`. With no attempts it shows S2 ("Bạn chưa làm đề thi thử nào", action "Làm đề N5 đầu tiên" → `/mock-exams`).
- Home renders the ring, streak and `WeekBars` from `activity`.
- Learn renders the unit chips from `progressStatus` (Hoàn thành / Đang học / Chưa học).
- The lobby shows `bestInternalScore`/180 and "Làm lại" when `attemptCount > 0`.
- The lesson and exam pages `POST /progress/activity {minutes:1}` every 60 s while the tab is visible (`visibilitychange`).

- [ ] **Step 1:** Write failing tests:
  - Profile with an empty history shows the S2 text and the action link.
  - Toggling the furigana switch sends PATCH `{furiganaDefault:false}` and adds `furigana-hidden`.
  - Home with `activity.streakDays=12` shows "12" and "ngày liên tiếp".
  - The lesson page with a hidden tab sends no heartbeat (fake timers).
- [ ] **Step 2:** Write a failing Playwright journey: sign in as a student → Home → continue the lesson → mark all cards → Thi thử → start N5 Đề 01 → answer, flag, submit → result shows "Điểm ước tính" → Hồ sơ lists the attempt.
- [ ] **Step 3:** Run and expect FAIL. **Step 4:** Implement. **Step 5:** Run (PASS), then `npm test`, `npm run typecheck`, `npm run lint` and `npm run test:e2e`.
- [ ] **Step 6:** Commit `feat(learner): profile page and live progress wiring`.

### Task 16: Verification and evidence

**Files:** Modify `docs/phase-log.md`, `docs/ui-approval.md` (status "Implemented — awaiting QA sign-off"), and `docs/design/screenshots/learner-*.png`.

- [ ] **Step 1:** Run `npm run build` (expect success) and `npm run test:e2e` (all PASS).
- [ ] **Step 2:** In the browser, compare each route against its review frame at 375px and 1280px, and capture screenshots of frames 01–09, S1–S4, 02D, 05D and 06D.
- [ ] **Step 3:** Record the real command output and the screenshots in `phase-log.md`. Commit `docs: learner redesign verification evidence`. **Stop.** Production deploy needs explicit owner approval.
