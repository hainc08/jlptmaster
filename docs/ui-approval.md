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
