# JLPT Master — Interactive Prototype Verification & UI Approval Document

**Document:** `docs/ui-approval.md`  
**Phase:** 3 — Interactive Prototype Builder (`prototype-builder`)  
**Status:** Under Review (Gate Approval Required)  
**Prototype Build:** Next.js 16.4.3 (App Router + Turbopack + Tailwind CSS v4)  
**Verification Host:** `http://localhost:3000` (Production Build Verified)  

---

## 1. Prototype Scope & Verification Checklist

| Screen / Feature | Route Path | Mock Data Fixture | Interactive Capabilities Verified | Status |
|---|---|---|---|---|
| **Landing Page** | `/` | `kanaSample` | Interactive Kana click-to-listen, N5-N1 roadmap, Furigana toggle, CTA routing | ✅ Verified |
| **Onboarding Wizard** | `/onboarding` | `localStorage` | Target level selection (N5 enabled, N4-N1 disabled), Daily study duration picker | ✅ Verified |
| **Student Dashboard** | `/dashboard` | Dynamic mock | 5-day streak counter, current lesson resume CTA (`Bài 03`), 14 due SRS cards widget | ✅ Verified |
| **Course Roadmap** | `/learn/n5` | `MOCK_LESSONS` | 5 lesson items, completion status tags, Kana beginner module card | ✅ Verified |
| **Lesson Study View** | `/learn/n5/[slug]` | `MOCK_VOCAB`, `MOCK_GRAMMAR` | Ruby Furigana display, audio speech synthesis, theory tab, vocab list, Hiragana chart | ✅ Verified |
| **Vocabulary Handbook** | `/vocabulary` | `MOCK_VOCAB` | Normalized multi-script search (Romaji, Hiragana, Vietnamese), audio button | ✅ Verified |
| **Grammar Handbook** | `/grammar` | `MOCK_GRAMMAR` | Searchable pattern cards, formation formulas, nuance notes, examples | ✅ Verified |
| **SRS Flashcards Deck** | `/flashcards` | `MOCK_SRS_CARDS` | 3D card flip (Space/tap), Han-Viet readings, 4 recall grading buttons (1-4 hotkeys) | ✅ Verified |
| **Practice Quiz Engine** | `/practice` | `MOCK_EXAM_N5_01` | 4 question types, client answer selection, server grading simulation, explanation drawer | ✅ Verified |
| **Timed Mock Exam** | `/mock-exams/[attemptId]` | 35-question set | 20-minute live countdown timer, 35-question palette, debounced autosave, submit modal | ✅ Verified |
| **Exam Diagnostic Results**| `/results/[attemptId]` | `scoreData` | Mock score circle (142/180), legal disclaimer, section bars, weak skill remedial links | ✅ Verified |
| **Admin CMS Dashboard** | `/admin` | `contentItems` | Metric summary cards, draft-to-publish workflow transitions, live approval button | ✅ Verified |
| **CSV Batch Ingestion** | `/admin/content/import`| `previewRows` | Pre-validation dry-run table showing valid rows vs row with Zod schema errors | ✅ Verified |
| **Authentication Forms** | `/login`, `/register` | Mock handlers | Form validation, role switcher, clean responsive card layouts | ✅ Verified |

---

## 2. Accessibility & Visual Quality Compliance
- **Dual-Script Typography:** `Be Vietnam Pro` renders all 134 Vietnamese accented characters without line-height clipping; `Noto Sans JP` renders crisp Kanji and Kana characters.
- **Semantic `<ruby>` Accessibility:** `<ruby>` and `<rt>` tags provide clean phonetic readings with a global toggle switch that can hide/show furigana dynamically.
- **Ergonomics & Touch Targets:** All interactive buttons and answer selectors enforce a minimum hit area of $44 \times 44\text{px}$.
- **Zero Real DB/API Implementation:** All interactions execute purely in-memory and via `localStorage` buffers, completely respecting the boundary that no production database tables or APIs are created before technical design approval.

---

## 3. Evidence Artifacts
- **Browser Session Recording:** `prototype_verification_1793127153626.webp`
- **Screenshots Captured:**
  - Landing page: `landing_page_1793127222414.png`
  - Dashboard: `dashboard_page_1793127264857.png`
  - Lesson Study: `lesson_page_1793127270953.png`
  - Flashcard Front: `flashcards_page_1793127277822.png`
  - Flashcard Flipped: `flashcard_flipped_1793127285994.png`
  - Mock Exam Catalog: `mock_exams_page_1793127312487.png`
  - Admin CMS: `admin_dashboard_page_1793127321252.png`

---

## 4. Hard Gate Check
- **Approved State:** Awaiting written Owner Approval for the Interactive Prototype before proceeding to Phase 4 (`/api-db-architect`: MariaDB Schema, Prisma Modeling & OpenAPI Contracts).

---

## 5. Learner app redesign — approval request (2026-11-06)

**Status:** Awaiting written owner approval. Nothing in this section is implemented. `docs/phase-state.yaml` is not edited by the agent.
**Review prototype:** `docs/design/learner-app/index.html` (static, mock data, no API/DB).
**Plan:** `docs/superpowers/plans/2026-11-06-learner-app-redesign.md`.
**API/DB contract (separate approval):** `docs/api/learner-activity.md`.

This redesign **replaces screens approved in §1** (vermilion palette, Be Vietnam Pro, old navigation). Per AGENTS.md they are not replaced without sign-off.

### 5.1 Frames, routes and what each replaces

| Frame | Screen | Route | Replaces |
|---|---|---|---|
| 01 | Welcome + đăng nhập / đăng ký | `/login`, `/register` | §1 Authentication Forms |
| 02 / 02D | Trang chủ (mobile / desktop 1280) | `/dashboard` | §1 Student Dashboard |
| 03 | Học — lộ trình N5, chọn cấp độ | `/learn/n5` | §1 Course Roadmap |
| 04 | Bài học (thẻ từ, furigana, âm thanh) | `/learn/n5/[lessonSlug]` | §1 Lesson Study View |
| 05 / 05D | Thi thử — sảnh chọn đề | `/mock-exams` | §1 mock exam catalog |
| 06 / 06D | Làm bài thi (đồng hồ, bảng câu hỏi, cắm cờ) | `/mock-exams/[attemptId]` | §1 Timed Mock Exam |
| 06b | Hộp thoại nộp bài | (dialog in 06) | §1 submit modal |
| 07 | Kết quả | `/results/[attemptId]` | §1 Exam Diagnostic Results |
| 08 | Sổ tay Kanji (tìm kiếm, chi tiết) | `/kanji` | — (restyle of existing route) |
| 09 | Hồ sơ | `/profile` (**new**) | — |
| S1 | Trạng thái đang tải (skeleton) | all data screens | — |
| S2 | Trạng thái trống | Home, Kanji search, Profile history | — |
| S3 | Trạng thái lỗi + "Thử lại" | all data screens, exam save | — |
| S4 | Cấp độ khóa "Sắp ra mắt" | `/learn/n4`…`/learn/n1`, level chips | — |

Shell: 5 tabs **Trang chủ · Học · Thi thử · Kanji · Hồ sơ** — bottom bar below 1024px, left sidebar at ≥1024px. Top bar carries a contextual furigana On/Off switch (only on screens with Japanese text) and VI/EN. Focus routes (lesson, exam) hide the tabs. Light mode only; no social, chat or payments.

Routes kept but removed from the tab bar: `/vocabulary`, `/grammar`, `/flashcards`, `/practice` (linked from the Learn screen, see Q1).

### 5.2 Data honesty
Until the API/DB contract (Part B) is approved and built, widgets whose data does not exist yet — study minutes ring, real streak, week bars, best score, per-lesson status, Profile history — **render nothing**, never a placeholder number. The current overview streak (`completed > 0 ? 1 : 0`) is not shown as a streak.

### 5.3 Open questions (planned default in bold)

1. **Navigation:** the 5 tabs drop "Luyện tập" and "Tiến độ". **Default: Vocabulary, Grammar, Flashcards and Practice stay as routes behind a "Công cụ học" row on Learn; progress moves to Home and Profile.**
2. **Palette and font:** replace vermilion primary + Be Vietnam Pro (`docs/design-system.md` §2–3) with the Admin palette (indigo `#3730A3`, vermilion accent `#C0331B`) and Noto Sans. **Default: replace** (proposed tokens in `docs/design-system.md` §7).
3. **"Có khả năng đạt / Chưa đạt" chips:** SPEC §153 forbids definitive pass predictions. **Default: keep the chips, always labelled "ước tính" next to "Điểm ước tính, không phải cách chấm điểm chính thức của JLPT."; the 80/180 line is labelled "Mốc tham khảo".** Alternative: percentage only.
4. **Sequential unlocking** ("Hoàn thành Bài 4 để mở khóa") is a new business rule. **Default: no unlocking rule; every published N5 lesson is open; "locked" applies only to N4–N1.**
5. **EN scope:** **Default: EN translates navigation and headings only (small dictionary); full EN content is out of scope.**
6. **Exam flags:** **Default: client-side in `sessionStorage` per attempt; no schema change.**

### 5.4 What the owner is asked to approve
- [ ] **UI:** frames 01–09, 06b, S1–S4, 02D, 05D, 06D as the learner UI, with answers to Q1–Q6 → unlocks plan Part A (Tasks 2–10).
- [ ] **API/DB:** `docs/api/learner-activity.md` → unlocks plan Part B (Tasks 11–14) and Part C.

Approval is recorded by the owner in `docs/phase-state.yaml`.
