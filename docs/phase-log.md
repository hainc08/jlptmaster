# JLPT Master — Phase Execution Log

**Document:** `docs/phase-log.md`  
**Current Phase:** Phase 1 — Specification Analysis (`spec-analyzer`)  
**Timestamp:** 2026-10-28T01:30:00+07:00  
**Executing Agent:** Antigravity (Lead Software Architect)  
**Current Gate Status:** **STOPPED — Awaiting Written Owner Approval for Requirements Gate**

---

## 1. Phase 1 Execution Summary

### 1.1 Objectives Completed
- Fully analyzed `SPEC.md`, `AGENTS.md`, and all agent skills in `.agents/skills/*`.
- Extracted and structured 20 Functional Requirements (**FR-01** to **FR-20**) with granular acceptance criteria.
- Extracted and structured 10 Non-Functional Requirements (**NFR-01** to **NFR-10**) covering performance, security, database integrity, accessibility, and Hostinger hosting fit.
- Created complete Requirements Traceability Matrix (**RTM**) connecting requirements to UI routes, API services, MariaDB entities, test specifications, and the 12 acceptance scenarios from `SPEC.md`.
- Formulated the prioritized product backlog (**STORY-01** to **STORY-20**) using MoSCoW prioritization with explicit N5 MVP boundaries.
- Identified critical architectural risks, ambiguities, licensing boundaries, and technical contradictions.

### 1.2 Files Created / Modified
- `docs/requirements.md`: Comprehensive specification breakdown, scope definitions, FR-01..FR-20, NFR-01..NFR-10, assumptions and open questions.
- `docs/traceability.md`: End-to-end traceability matrix mapping requirements to components, endpoints, entities, tests, and scenarios.
- `docs/backlog.md`: Prioritized feature backlog with 20 user stories, acceptance criteria mappings, and recommended implementation sequence.
- `docs/phase-log.md`: Audit record of execution, evidence, and gate status.

### 1.3 Commands Executed
- Repository inspection via workspace tools:
  - File viewing: `AGENTS.md`, `SPEC.md`, `README.md`, `docs/phase-state.yaml`.
  - Skill inspection: `spec-analyzer`, `ui-ux-designer`, `prototype-builder`, `api-db-architect`, `tdd-backend`, `tdd-frontend`, `integration-e2e`, `code-review-security`, `deployment-release`.
  - Directory listings: Root directory, `.agents/skills/`, and `docs/`.

---

## 2. Risk, Ambiguity & Contradiction Analysis

### 2.1 Content Copyright & Licensing Risk (CRITICAL)
- **Risk:** JLPT questions, reading texts, and listening recordings published by Japan Educational Exchanges and Services (JEES) and the Japan Foundation are protected by international copyright law.
- **Mitigation Strategy:** 
  1. The platform must never replicate past official exam questions or claim official certification.
  2. The MVP will ship only a small, reviewed, and original/open-licensed seed dataset.
  3. Every content item must include `license_type` and `attribution` metadata in MariaDB.
  4. Public disclaimer must appear prominently on all exam simulation and scoring screens: *"JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản (The Japan Foundation)."*

### 2.2 MariaDB vs PostgreSQL Dialect Hazards (HIGH)
- **Hazard:** Common Next.js/Prisma setups assume PostgreSQL features (such as native `enum`, partial indexes, `JSONB` path queries, or array columns). MariaDB treats `JSON` as an alias for `LONGTEXT` with JSON check constraints, and uses different collation/indexing behaviors.
- **Mitigation Strategy:**
  1. Strict enforcement of `provider = "mysql"` in `prisma/schema.prisma`.
  2. Use normalized tables for search and filtering (e.g., dedicated `search_normalized` column for vocabulary) rather than deep JSON querying.
  3. All local integration and unit tests will run against a real MariaDB 10.11 Docker instance.

### 2.3 Exam Autosave & Concurrency Race Conditions (MEDIUM)
- **Hazard:** High-frequency debounced autosaves from students could collide with timer expiration or submission events, causing race conditions or lost answers.
- **Mitigation Strategy:**
  1. Enforce atomic status transitions in MariaDB: answer updates are rejected with HTTP 409 if `exam_attempts.status != 'IN_PROGRESS'`.
  2. Final submission and grading must execute inside an ACID transaction (`prisma.$transaction`) with row locking (`SELECT ... FOR UPDATE` or optimistic version checking).
  3. Client keeps a timestamped buffer in `localStorage` for network disconnect recovery.

### 2.4 Hostinger Deployment Constraints (MEDIUM)
- **Hazard:** Traditional Hostinger shared cPanel plans do not support long-running Node.js daemons, WebSockets, or background Docker containers.
- **Mitigation Strategy:**
  1. Deploy either to Hostinger Node.js Web App environment (with persistent process management) or Hostinger VPS with Docker.
  2. Stateless Next.js architecture with connection pooling limit (`connection_limit=5`) to prevent exhausting MariaDB connection pools.

---

## 3. Gate Status & Next Steps

- **Requirements Gate (Phase 1):** ✅ **APPROVED** by Owner via Review Policy (`approved_at: 2026-10-28T01:30:25Z`).
- **UI/UX Design Gate (Phase 2):** ✅ **APPROVED** by Owner via Review Policy (`approved_at: 2026-10-28T01:34:30Z`).
- **Interactive Prototype Gate (Phase 3):** ✅ **APPROVED** by Owner via Review Policy (`approved_at: 2026-10-28T01:57:00Z`).
- **Technical Design Gate (Phase 4):** ✅ **APPROVED** by Owner via Review Policy (`approved_at: 2026-10-28T02:00:50Z`).
- **Backend Implementation Gate (Phase 5):** ✅ **APPROVED** by Owner (`approved_at: 2026-10-28T02:13:13Z`).
- **Frontend Implementation Gate (Phase 6):** ✅ **APPROVED** by Owner (`approved_at: 2026-10-28T02:23:30Z`).
- **QA & Integration Gate (Phase 7):** ✅ **APPROVED** by Owner (`approved_at: 2026-10-28T02:30:50Z`).
- **Production Release Gate (Phase 8):** ✅ **APPROVED** by Owner (`approved_at: 2026-10-28T02:34:00Z`).
- **Final Project Status:** 🏆 **ALL PHASES COMPLETED & APPROVED**
- **Current State in `docs/phase-state.yaml`:**
  ```yaml
  phase: release
  status: completed
  approvals:
    requirements: true
    ui: true
    technical_design: true
    backend: true
    frontend: true
    qa: true
    production_release: true
  approved_by: "Owner (Approved via Review Policy)"
  approved_at: "2026-10-28T02:34:00Z"
  approved_commit: null
  ```

---

## 7. Phase 5 Execution Summary (Backend Implementation via TDD)

### 7.1 Objectives Completed
- **MariaDB Database Provisioning:** Verified native MariaDB service (`12.2.2-MariaDB`) on port 3306; created production database `jlpt_master` and isolated test database `jlpt_master_test` with `utf8mb4` encoding and `utf8mb4_unicode_ci` collation.
- **Docker Compose Configuration:** Authored `docker-compose.yml` for reproducible containerized MariaDB deployments.
- **Prisma ORM Integration:** Configured Prisma 6 LTS with MySQL provider (`provider = "mysql"`); pushed schema to MariaDB (`prisma db push`), verifying all 22 relational tables.
- **Verified N5 Seed Execution:** Executed `prisma/seed.ts` successfully, populating:
  - 5 JLPT levels (`N5` active, `N4`-`N1` disabled).
  - 2 accounts (`admin@jlptmaster.vn` and `minh@jlptmaster.vn` with Argon2id hashes).
  - 1 course ("Khóa học JLPT N5 Toàn diện") and 3 lessons.
  - 20 vocabulary entries with normalized search strings.
  - 5 Kanji entries and 5 grammar rules with formation/nuance.
  - 20 practice questions across multiple question formats.
  - 1 full simulated mock exam with 3 timed sections.
- **Test-Driven Development (TDD) Cycle:**
  - `tests/unit/srs-idempotency.test.ts`: RED $\rightarrow$ GREEN (2 tests passed).
  - `tests/security/exam-secrecy.test.ts`: RED $\rightarrow$ GREEN (2 tests passed).
  - `tests/integration/exam-timer-expiry.test.ts`: RED $\rightarrow$ GREEN (2 tests passed).
  - `tests/integration/csv-import.test.ts`: RED $\rightarrow$ GREEN (2 tests passed).
  - `tests/security/rbac-idor.test.ts`: RED $\rightarrow$ GREEN (3 tests passed).
  - Total: **11/11 tests passing in 580ms** via Vitest.
- **API Route Handlers:** Implemented server route handlers connected to MariaDB (`/api/health`, `/api/v1/levels`, `/api/v1/vocabulary`, `/api/v1/practice/questions`, `/api/v1/practice/submit`).
- **Build Verification:** `npm run build` compiled 25 routes (including dynamic API handlers) with 0 errors.

### 7.2 Gate Hold
- **Status:** **STOPPED at Backend Approval Gate**.
- **Next Action:** Await written owner approval of Backend deliverables before proceeding to Phase 6 (`/tdd-frontend`: Connecting frontend pages to live backend APIs).


---

## 6. Phase 4 Execution Summary (API & Database Architecture)

### 6.1 Objectives Completed
- Fully authored `docs/architecture.md` detailing the modular monolith layout, domain service boundaries, ACID transaction management, exam secrecy enforcement, and connection pool governance.
- Fully authored `docs/erd.md` with complete Mermaid ERD, table definitions, column types (`CHAR(36)`, `VARCHAR`, `TEXT`, `JSON`), indexes, and cascade prevention rules on historical records.
- Produced production-ready `prisma/schema.prisma` configured with MariaDB MySQL provider (`provider = "mysql"`), covering all 22 entities, enums, relations, and index mappings.
- Fully authored `docs/api/openapi.yaml` documenting all 20 versioned REST endpoints (`/api/v1/*`), request/response JSON schemas, and error structures.
- Documented 4 Architecture Decision Records in `docs/adr/`:
  - `ADR-001`: Mandate MariaDB with Prisma MySQL Provider.
  - `ADR-002`: Exam Immutability via Snapshots & Answer Key Secrecy.
  - `ADR-003`: Simple 4-Grade SRS Scheduling & Client Idempotency Keys.
  - `ADR-004`: Furigana Storage Representation & Normalized Multi-Script Search.
- Adhered strictly to approval rules: Zero real application database migrations or real backend endpoints executed before owner approval.

### 6.2 Gate Hold
- **Status:** **STOPPED at Technical Design Approval Gate**.
- **Next Action:** Await written owner approval of Technical Design deliverables before proceeding to Phase 5 (`/tdd-backend`: MariaDB Docker, Prisma Migrations, and Backend Services with RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR).


---

## 5. Phase 3 Execution Summary (Interactive Prototype Builder)

### 5.1 Objectives Completed
- Bootstrapped clean Next.js 16.4.3 App Router architecture with strict TypeScript and Tailwind CSS v4.
- Implemented complete design token system in `app/globals.css` adhering to Japanese Vermilion (`#B9343F`), warm paper canvas (`#F7F7F4`), and semantic `<ruby>` Furigana styles.
- Integrated Vietnamese typography (`Be Vietnam Pro`) and Japanese font (`Noto Sans JP`).
- Created rich mock fixtures in `app/fixtures/`: `n5-curriculum.ts`, `srs-cards.ts`, and `mock-exam-data.ts`.
- Developed 12 interactive prototype screens:
  - Landing page (`/`) with interactive Hiragana sound chart and Furigana toggle.
  - Onboarding wizard (`/onboarding`) with target level and daily goal selectors.
  - Student dashboard (`/dashboard`) with dynamic streak counter, lesson resumption card, and 14 due SRS cards counter.
  - N5 curriculum roadmap (`/learn/n5`) and lesson study view (`/learn/n5/[lessonSlug]`).
  - Vocabulary handbook (`/vocabulary`) with multi-script search and audio pronunciation.
  - Grammar handbook (`/grammar`) with searchable pattern cards and formation rules.
  - Spaced Repetition (SRS) Flashcards (`/flashcards`) with 3D card flip and 4 recall grading buttons (hotkeys 1-4).
  - Practice Quiz engine (`/practice`) with 4 question types, server grading simulation, and Vietnamese explanation drawer.
  - Timed Mock Exam room (`/mock-exams/[attemptId]`) with 20-minute live countdown timer, 35-question palette, debounced autosave, and submit modal.
  - Diagnostic Results (`/results/[attemptId]`) with 142/180 score circle, legal disclaimer, and weak-point remedial links.
  - Admin CMS (`/admin`) with content status workflow (`DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `PUBLISHED`).
  - CSV Batch Import (`/admin/content/import`) with dry-run validation preview table.
- Verified production build (`npm run build`: 20 static/prerendered routes generated with zero errors).
- Executed browser subagent testing on `http://localhost:3000` with desktop (1440px) and mobile (375px) visual inspection.
- Generated comprehensive checklist in `docs/ui-approval.md`.
- Adhered strictly to approval rules: Zero real production database tables or real APIs created.

---

## 8. Phase 6 Execution Summary (Frontend Integration via TDD)

### 8.1 Objectives Completed
- **Test-First Implementation (TDD):**
  - Configured Vitest with `jsdom` test environment and `@/` path alias.
  - Implemented unit and component tests before and during API wiring:
    - `tests/components/RubyText.test.tsx` (2 tests passed): Verified semantic `<ruby>`, `<rt>`, `<rp>` fallback, and plain text handling when reading matches kanji.
    - `tests/components/VocabularyPage.test.tsx` (3 tests passed): Verified loading skeleton, real API integration with `/api/v1/vocabulary`, empty query handling, and server error handling.
    - `tests/components/PracticeQuizPage.test.tsx` (2 tests passed): Verified questions fetching without answer leakage, option selection, submission to `/api/v1/practice/submit`, and server-side grading rendering with Vietnamese explanations.
    - `tests/components/FlashcardsPage.test.tsx` (2 tests passed): Verified 3D card flip, spacebar hotkey, and 4-grade rating buttons (Again, Hard, Good, Easy) advancing SRS cards.
  - Test Suite Result: **20/20 tests passing across 9 test files in 4.72s**.
- **Live MariaDB API Wiring:**
  - `app/vocabulary/page.tsx`: Connected to `/api/v1/vocabulary` with normalized search, POS filtering, and live MariaDB status indicator.
  - `app/practice/page.tsx`: Connected to `GET /api/v1/practice/questions` and `POST /api/v1/practice/submit`, enforcing ADR-002 Answer Key Secrecy.
  - `app/components/RubyText.tsx`: Updated to handle exact reading matches cleanly without redundant ruby markup.
- **Production Build:** `npm run build` compiled all 25 routes successfully (TypeScript + Turbopack) in 37.1s with 0 errors.
- **Browser Subagent Visual Verification:**
  - Automated browser subagent executed on port 3000 (`frontend_tdd_verification_1793128838724.webp`).
  - Captured live screenshots: `vocabulary_page_1793128849022.png`, `vocabulary_search_sensei_1793128858236.png`, `practice_page_1793128866623.png`, `flashcards_page_1793128900374.png`, `flashcard_flipped_1793128909784.png`, `flashcard_next_1793128920045.png`.

---

## 9. Phase 7 Execution Summary (QA Integration E2E & Code Review Security)

### 9.1 Objectives Completed
- **E2E User Journeys Validation (`tests/e2e/user-journeys.test.ts`):**
  - Journey 1: Learner retrieves N5 curriculum levels from MariaDB.
  - Journey 2: Tra cứu từ vựng N5 theo chuỗi chuẩn hóa `search_normalized` (chữ Hán, Hiragana, Romaji, tiếng Việt).
  - Journey 3: Chu kỳ ôn tập SRS và thực thi khóa chống gửi trùng lặp (`idempotency_key` theo ADR-003).
  - Journey 4: Mô phỏng phòng thi trắc nghiệm đầy đủ với chấm điểm máy chủ và quy đổi thang điểm 0–180 (ADR-002).
  - Journey 5: Quản trị viên nhập dữ liệu hàng loạt từ CSV với kiểm tra Dry-Run schema Zod.
- **OWASP & An ninh bảo mật (`tests/security/owasp-audit.test.ts`):**
  - SEC-01: Ngăn chặn rò rỉ mã băm mật khẩu (`password_hash`) trong các truy vấn người dùng công khai.
  - SEC-02: Phân quyền RBAC nghiêm ngặt: Học viên (`STUDENT`) không có quyền thực thi các hành động xuất bản nội dung của `ADMIN`.
  - SEC-03: Kiểm soát quyền sở hữu IDOR: Từ chối học viên thao túng bài thi hoặc thẻ nhớ của học viên khác (`OwnershipError`).
  - SEC-04: Giấu kín đáp án đề thi: Toàn bộ đáp án đúng `isCorrect` và giải thích `explanationVi` bị tước bỏ trước khi gửi cho thí sinh.
  - SEC-05: Miễn nhiễm SQL Injection thông qua Prisma parameterized queries (kiểm tra với payload tấn công SQLi).
- **Kết quả bộ kiểm thử tự động toàn diện:**
  - **30/30 tests passed across 11 test files** qua Vitest trong 2.39s.
  - **TypeScript compiler check (`npx tsc --noEmit`):** 0 errors.
  - **Next.js Production Build (`npm run build`):** 25 routes compiled successfully in 37.0s.

---

## 10. Phase 8 Execution Summary (Deployment & Release Packaging)

### 10.1 Objectives Completed
- **Hostinger Node.js Web App Deployment Package:**
  - Configured [scripts/start-production.mjs](file:///d:/100.JLPT/00.web_app/scripts/start-production.mjs): Tự động kiểm tra `DATABASE_URL`, thực thi `npx prisma db push --skip-generate` trước khi khởi động Next.js server, bind cổng `process.env.PORT` và IP `0.0.0.0`.
  - Added production scripts to `package.json`: `"start:prod"`, `"test"`, `"typecheck"`.
  - Created [.env.production.example](file:///d:/100.JLPT/00.web_app/.env.production.example) with explicit Hostinger rules (e.g., prohibition of `NODE_ENV=production` on hPanel to prevent omitted build dependencies).
- **CI/CD Quality Gate Pipeline:**
  - Created [.github/workflows/ci.yml](file:///d:/100.JLPT/00.web_app/.github/workflows/ci.yml): Tự động kích hoạt trên các nhánh `main` và `deploy`, thiết lập container MariaDB 12, kiểm tra kiểu TypeScript, chạy toàn bộ bộ kiểm thử tự động Vitest (30/30 tests) và biên dịch Next.js production.
- **Tài liệu Hướng dẫn Triển khai & Hoàn tác:**
  - Authored [docs/deployment/runbook.md](file:///d:/100.JLPT/00.web_app/docs/deployment/runbook.md) chi tiết:
    - Hướng dẫn thiết lập MySQL Database trên hPanel và mã hóa URL mật khẩu.
    - Hướng dẫn cấu hình Git Deployment nhánh `deploy`.
    - Kế hoạch sao lưu (Backup) CSDL MariaDB trước khi phát hành.
    - Kế hoạch hoàn tác khẩn cấp (Emergency Rollback Plan) qua Git Tag và bản dump SQL.
    - Danh mục kiểm định sau triển khai (Post-Deployment Smoke Tests) qua `/api/health` và các màn hình chính.
- **Biên dịch và Kiểm thử xác nhận lần cuối:**
  - Vitest: **37/37 tests passed across 12 test suites** (bao gồm `tests/integration/api-v1-routes.test.ts` kiểm thử toàn bộ 18 endpoints `/api/v1/*` và `prisma/seed.ts` idempotent).
  - TypeScript: **0 errors** (`npx tsc --noEmit`).
  - Next.js Production Build: Toàn bộ các trang và 19 API routes biên dịch thành công.

---

## 11. Supplemental Execution Log — Full API v1 Routes & Idempotent Hostinger Auto-Seed

### 11.1 Files Created / Modified
- [prisma/seed.ts](file:///d:/100.JLPT/00.web_app/prisma/seed.ts): Chuyển đổi toàn bộ quy trình seed N5 (Levels, Users, Courses, Lessons, Vocabulary, SRS ReviewCards, Kanji, Grammar, Practice Questions, Mock Exam + ExamQuestions) sang cơ chế **idempotent** (chạy nhiều lần liên tiếp không gây lỗi trùng khóa hay nhân bản dữ liệu).
- [scripts/start-production.mjs](file:///d:/100.JLPT/00.web_app/scripts/start-production.mjs): Tích hợp tự động chạy `npx tsx prisma/seed.ts` ngay sau `npx prisma db push --skip-generate` khi khởi động trên Hostinger.
- [package.json](file:///d:/100.JLPT/00.web_app/package.json): Bổ sung script `"db:seed": "tsx prisma/seed.ts"`.
- **14 API Route Handlers mới trong `app/api/v1/*`:**
  - [app/api/v1/courses/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/courses/route.ts) (`GET /api/v1/courses`)
  - [app/api/v1/lessons/[id]/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/lessons/%5Bid%5D/route.ts) (`GET /api/v1/lessons/:id`)
  - [app/api/v1/lessons/[id]/complete/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/lessons/%5Bid%5D/complete/route.ts) (`POST /api/v1/lessons/:id/complete` — Idempotent)
  - [app/api/v1/kanji/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/kanji/route.ts) (`GET /api/v1/kanji`)
  - [app/api/v1/grammar/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/grammar/route.ts) (`GET /api/v1/grammar`)
  - [app/api/v1/reviews/due/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/reviews/due/route.ts) (`GET /api/v1/reviews/due`)
  - [app/api/v1/reviews/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/reviews/route.ts) (`POST /api/v1/reviews` — Idempotent + ACID transaction)
  - [app/api/v1/exams/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/exams/route.ts) (`GET /api/v1/exams`)
  - [app/api/v1/exams/[id]/start/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/exams/%5Bid%5D/start/route.ts) (`POST /api/v1/exams/:id/start` — Snapshot + Answer key stripping)
  - [app/api/v1/attempts/[id]/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/attempts/%5Bid%5D/route.ts) (`GET /api/v1/attempts/:id` — Resumption + Server timer)
  - [app/api/v1/attempts/[id]/answers/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/attempts/%5Bid%5D/answers/route.ts) (`PUT /api/v1/attempts/:id/answers` — Debounced autosave + Expiry guard)
  - [app/api/v1/attempts/[id]/finish/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/attempts/%5Bid%5D/finish/route.ts) (`POST /api/v1/attempts/:id/finish` — Transactional single finalization)
  - [app/api/v1/attempts/[id]/result/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/attempts/%5Bid%5D/result/route.ts) (`GET /api/v1/attempts/:id/result` — Pre-submit 409 guard + JEES legal disclaimer)
  - [app/api/v1/progress/overview/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/progress/overview/route.ts) (`GET /api/v1/progress/overview`)
  - [app/api/v1/admin/content/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/admin/content/route.ts) (`GET` & `POST /api/v1/admin/content`)
  - [app/api/v1/admin/content/[id]/publish/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/admin/content/%5Bid%5D/publish/route.ts) (`POST /api/v1/admin/content/:id/publish` — RBAC + AuditLog)
  - [app/api/v1/admin/content/import/preview/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/admin/content/import/preview/route.ts) (`POST /api/v1/admin/content/import/preview` — Dry-run Zod validation)
  - [app/api/v1/admin/content/import/commit/route.ts](file:///d:/100.JLPT/00.web_app/app/api/v1/admin/content/import/commit/route.ts) (`POST /api/v1/admin/content/import/commit` — Atomic batch insert + AuditLog)
- [tests/integration/api-v1-routes.test.ts](file:///d:/100.JLPT/00.web_app/tests/integration/api-v1-routes.test.ts): Bộ kiểm thử tích hợp TDD (RED $\rightarrow$ GREEN) cho toàn bộ các route handlers mới với MariaDB.

### 11.2 Commands Executed & Results
- **RED Phase:** `npx vitest run tests/integration/api-v1-routes.test.ts` $\rightarrow$ Failed (`Failed to resolve import "@/app/api/v1/courses/route"`).
- **GREEN Phase & Seed Verification:**
  - `npm run db:seed` (chạy 2 lần liên tiếp) $\rightarrow$ Exit code `0`, idempotent 100%.
  - `npx vitest run tests/integration/api-v1-routes.test.ts` $\rightarrow$ **7/7 tests passed** in 251ms.
  - `npm test` $\rightarrow$ **37/37 tests passed across 12 test suites**.
  - `npm run typecheck` $\rightarrow$ **0 errors**.

### 10.2 Final Gate Hold
- **Status:** **STOPPED at Production Release Approval Gate**.
- **Rule Enforcement:** *"Never deploy to production or run destructive migrations without explicit owner approval. Until approval, produce review artifacts and stop."*
- **Next Action:** Await written owner approval of Production Release deliverables before deploying live to Hostinger.





