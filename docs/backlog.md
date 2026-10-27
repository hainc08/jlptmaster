# JLPT Master — Prioritized Product Backlog & Implementation Order

**Document:** `docs/backlog.md`  
**Phase:** 1 — Specification Analysis (`spec-analyzer`)  
**Status:** Under Review (Gate Approval Required)  

---

## 1. Prioritization Methodology

Features are categorized using the MoSCoW method and mapped to the Hard Approval Gates defined in `AGENTS.md`:
- **P0 (Must Have for N5 MVP):** Foundational architecture, user onboarding, N5 curriculum (Kana, Vocab, Kanji, Grammar), Practice Engine, SRS Flashcards, Mock Exam Engine with timed autosave, Results with explanations, Admin CMS with CSV ingestion, MariaDB data persistence, Accessibility.
- **P1 (Should Have for Post-MVP Release 1.1):** Weak-point aggregated analytics charts, custom review session filtering, bulk audio download/caching.
- **P2 (Could Have / Future Roadmap):** N4–N1 content catalogs, AI explanation assistant, FSRS algorithm tuning, native mobile app wrappers, peer leaderboards, paid subscription tiers.

---

## 2. Recommended Order of Implementation

To adhere strictly to `AGENTS.md` Hard Approval Gates:
1. **Gate 1: Requirements Approval (Phase 1 — Current Step)** $\rightarrow$ Specification analysis, RTM, backlog.
2. **Gate 2: UI/UX Design System Approval (Phase 2)** $\rightarrow$ Sitemap, wireframes, design tokens, typography, furigana rules (`/ui-ux-designer`).
3. **Gate 3: Interactive Prototype Approval (Phase 3)** $\rightarrow$ Clickable mock prototype (Next.js + Tailwind + Mock JSON) covering all screens; visual review (`/prototype-builder`).
4. **Gate 4: API & Database Contract Approval (Phase 4)** $\rightarrow$ MariaDB Prisma schema, OpenAPI 3.0 spec, ERD, migration plan, ADRs (`/api-db-architect`).
5. **Phase 5: Backend Implementation (TDD)** $\rightarrow$ MariaDB Docker, Prisma, Auth, Services, Server Actions with RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR (`/tdd-backend`).
6. **Phase 6: Frontend Integration (TDD)** $\rightarrow$ Replace mock fixtures with real API client, React Hook Form, state management (`/tdd-frontend`).
7. **Phase 7: End-to-End Validation & Security Audit** $\rightarrow$ Playwright scenarios, accessibility audits, IDOR/auth testing (`/integration-e2e` & `/code-review-security`).
8. **Gate 5: Production Deployment Approval** $\rightarrow$ Staging release, migration rehearsal, Hostinger setup, rollback runbook (`/deployment-release`).

---

## 3. Detailed Backlog: User Stories & Feature Slices (N5 MVP)

### Epic 1: Identity, Onboarding & User State (Sprint 1)
- **STORY-01: User Registration & Credential Login**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-01, NFR-02
  - **As a** Vietnamese learner,
  - **I want to** register and securely sign in with my email and password,
  - **So that** my learning progress and exam attempts are saved across devices.
  - **Tasks:**
    - [ ] Design Auth schema (`users`, `auth_sessions`, `auth_accounts`).
    - [ ] Implement password hashing using Argon2id/bcrypt.
    - [ ] Implement secure cookie issuance (HttpOnly, SameSite).
    - [ ] Create login/registration UI forms with Vietnamese validation messages.
- **STORY-02: Learner Onboarding & Daily Goal Configuration**
  - **Priority:** P0 | **Effort:** 2 SP | **Criteria IDs:** FR-02, NFR-05
  - **As a** new student,
  - **I want to** select N5 as my target level and establish a daily study goal (15–60 mins),
  - **So that** the dashboard adapts to my schedule.
  - **Tasks:**
    - [ ] Onboarding wizard UI with active N5 badge and disabled N4–N1 "Sắp ra mắt" cards.
    - [ ] Persistence of user goal in `user_profiles`.
    - [ ] Middleware redirect for users with `onboarding_completed_at == null`.
- **STORY-03: Dynamic Student Dashboard**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-03, NFR-01
  - **As an** active learner,
  - **I want to** view my daily streak, resume my last lesson, and see due review cards,
  - **So that** I know exactly what to study in under two clicks.
  - **Tasks:**
    - [ ] Real-time query aggregating due SRS cards, current lesson, and streak count.
    - [ ] Responsive dashboard UI with Quick Action CTA buttons.

---

### Epic 2: N5 Curriculum & Content Delivery (Sprint 2)
- **STORY-04: Hiragana & Katakana Beginner Module**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-04, FR-18
  - **As a** beginner starting from zero,
  - **I want to** learn Hiragana and Katakana stroke order and sounds,
  - **So that** I can read basic Japanese words.
  - **Tasks:**
    - [ ] Interactive 50-sound chart component with audio pronunciation playback.
    - [ ] Romaji-to-Kana association practice widget.
- **STORY-05: N5 Course & Lesson Roadmap**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-04, NFR-03
  - **As a** student,
  - **I want to** browse organized N5 lessons and mark them completed,
  - **So that** I systematically progress through Japanese grammar and vocabulary.
  - **Tasks:**
    - [ ] Curriculum tree UI displaying lessons with progress badges.
    - [ ] Lesson view rendering structured theory, vocabulary list, and grammar notes.
    - [ ] Idempotent `POST /api/v1/lessons/:id/complete` endpoint.
- **STORY-06: Vocabulary Bank & Furigana Search**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-05, FR-18, NFR-05
  - **As a** learner,
  - **I want to** search and study N5 vocabulary with readings and Vietnamese meanings,
  - **So that** I expand my lexicon.
  - **Tasks:**
    - [ ] Normalized Japanese/Vietnamese search query handler.
    - [ ] Semantic `<ruby>` component with user toggle (Show/Hide Furigana).
- **STORY-07: Kanji Catalog & Radicals**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-06, NFR-03
  - **As a** student,
  - **I want to** look up N5 Kanji characters, Onyomi/Kunyomi readings, and stroke counts,
  - **So that** I master character recognition.
  - **Tasks:**
    - [ ] Kanji card component with Sino-Vietnamese (Hán-Việt) reading.
    - [ ] Canonical character deduplication validation.
- **STORY-08: Grammar Guides & Formation Rules**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-07
  - **As a** student,
  - **I want to** study N5 grammar patterns with clear structure and nuances,
  - **So that** I understand how sentences are constructed.
  - **Tasks:**
    - [ ] Grammar card UI displaying pattern formulas and Vietnamese usage notes.
    - [ ] Sentence breakdown component highlighting key particles.

---

### Epic 3: Practice & Spaced Repetition System (Sprint 3)
- **STORY-09: Multi-Format Practice Question Engine**
  - **Priority:** P0 | **Effort:** 5 SP | **Criteria IDs:** FR-08, FR-19, NFR-02
  - **As a** learner,
  - **I want to** practice with single-choice, kanji reading, and sentence-ordering questions,
  - **So that** I test my recall under exam conditions.
  - **Tasks:**
    - [ ] Build question UI renderers for 4 question types.
    - [ ] Server-side grading handler ensuring answers remain secret until submission.
    - [ ] Post-submission modal rendering correct answer and detailed explanation.
- **STORY-10: Spaced Repetition (SRS) Flashcard Engine**
  - **Priority:** P0 | **Effort:** 5 SP | **Criteria IDs:** FR-09, NFR-04, NFR-05
  - **As a** learner,
  - **I want to** review vocabulary and grammar cards using Again/Hard/Good/Easy buttons,
  - **So that** I transfer short-term knowledge into long-term memory.
  - **Tasks:**
    - [ ] 3D flip-card review component with keyboard hotkeys (1, 2, 3, 4).
    - [ ] Next review interval calculation algorithm (10m, 1d, 3d, 7d).
    - [ ] Idempotent review submission handler using client-generated UUIDs.
    - [ ] Daily midnight rollover logic configured for `Asia/Ho_Chi_Minh`.

---

### Epic 4: Comprehension Modules & Timed Mock Exam Engine (Sprint 4)
- **STORY-11: Reading Comprehension Module**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-10, FR-18
  - **As a** student,
  - **I want to** read short Japanese passages and answer comprehension questions,
  - **So that** I build contextual reading endurance.
  - **Tasks:**
    - [ ] Split-screen reading UI with adjustable font sizing.
    - [ ] Sub-question navigation and answer tracking.
- **STORY-12: Listening Module & Accessible Audio Player**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-11, FR-17
  - **As a** student,
  - **I want to** listen to Japanese conversations and choose the right visual/text option,
  - **So that** I train my ear for the JLPT listening section.
  - **Tasks:**
    - [ ] Accessible HTML5 audio controller with speed adjustment (0.8x / 1.0x).
    - [ ] S3 media streaming resolver.
- **STORY-13: Timed JLPT N5 Mock Exam Engine**
  - **Priority:** P0 | **Effort:** 8 SP | **Criteria IDs:** FR-12, FR-19, NFR-01, NFR-04
  - **As an** exam candidate,
  - **I want to** take a full-length N5 mock exam with sections and countdown timers,
  - **So that** I experience genuine exam pacing.
  - **Tasks:**
    - [ ] Exam attempt initiator creating an immutable `exam_snapshot_json`.
    - [ ] Server-synchronized countdown timer with auto-submit upon expiration.
    - [ ] Debounced autosave mechanism (`PUT /attempts/:id/answers`) every 15 seconds.
    - [ ] Client local-storage offline buffer for temporary connection drop recovery.
    - [ ] Transactional finalization (`POST /attempts/:id/finish`) allowing exactly one score run.
- **STORY-14: Comprehensive Results & Weak Point Diagnosis**
  - **Priority:** P0 | **Effort:** 5 SP | **Criteria IDs:** FR-13, FR-14, NFR-07
  - **As a** candidate who finished a mock exam,
  - **I want to** review my estimated score, incorrect questions, and weak grammar topics,
  - **So that** I know where to focus my revision.
  - **Tasks:**
    - [ ] Score calculation module producing raw and normalized mock scores (0–180).
    - [ ] Prominent legal disclaimer badge regarding internal mock scoring.
    - [ ] Detailed item-by-item review interface linking directly to remedial lessons.

---

### Epic 5: Content Operations & Admin CMS (Sprint 5)
- **STORY-15: Content Management System (CMS) & Editorial Workflow**
  - **Priority:** P0 | **Effort:** 5 SP | **Criteria IDs:** FR-15, FR-19, NFR-02
  - **As a** content editor or admin,
  - **I want to** create, preview, review, and publish learning content and questions,
  - **So that** students only access thoroughly audited study material.
  - **Tasks:**
    - [ ] Back-office admin dashboard with draft review queue.
    - [ ] Content editor with live Japanese Furigana and audio preview.
    - [ ] Strict status transitions (`DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`).
    - [ ] Audit log capture for all state changes.
- **STORY-16: CSV Batch Content Ingestion Engine**
  - **Priority:** P0 | **Effort:** 5 SP | **Criteria IDs:** FR-16, NFR-04
  - **As an** admin,
  - **I want to** bulk-upload vocabulary, Kanji, and questions via CSV with validation preview,
  - **So that** I can rapidly populate the N5 question bank without errors.
  - **Tasks:**
    - [ ] CSV parser with Zod schema validation.
    - [ ] Interactive Dry-Run Preview table highlighting exact syntax/schema errors.
    - [ ] Transactional atomic batch insert into MariaDB.
- **STORY-17: Media Asset Library & Attribution**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-17, NFR-07
  - **As an** admin,
  - **I want to** upload audio files with mandatory licensing attribution,
  - **So that** the platform strictly adheres to copyright compliance.
  - **Tasks:**
    - [ ] File upload endpoint with MIME type and size enforcement.
    - [ ] SHA-256 deduplication check.
    - [ ] Attribution and licensing metadata form.

---

### Epic 6: System Hardening, Accessibility & Staging Release (Sprint 6)
- **STORY-18: WCAG 2.2 AA Accessibility & Dual-Script Usability**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-18, NFR-06
  - **Tasks:**
    - [ ] Comprehensive keyboard navigation audit across all question interfaces.
    - [ ] ARIA attribute verification for audio player and flashcard flip states.
    - [ ] Screen reader compatibility verification for `<ruby>` tags.
- **STORY-19: Dockerized MariaDB Environment & Automated Migrations**
  - **Priority:** P0 | **Effort:** 3 SP | **Criteria IDs:** FR-20, NFR-03
  - **Tasks:**
    - [ ] `docker-compose.yml` with MariaDB 10.11 LTS, health checks, and UTF8MB4 configuration.
    - [ ] Seed script (`prisma/seed.ts`) loading verified N5 sample curriculum.
    - [ ] Database backup and restoration verification scripts.
- **STORY-20: Automated CI/CD & Hostinger Staging Deployment**
  - **Priority:** P0 | **Effort:** 5 SP | **Criteria IDs:** NFR-08, NFR-10
  - **Tasks:**
    - [ ] GitHub Actions workflow executing lint, typecheck, Vitest, and Playwright.
    - [ ] Health check endpoints (`/api/health`).
    - [ ] Deployment runbook for Hostinger persistent Node.js / Docker setup.
