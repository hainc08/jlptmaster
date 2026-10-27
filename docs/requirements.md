# JLPT Master — Software Requirements Specification (Detailed Breakdown)

**Document:** `docs/requirements.md`  
**Phase:** 1 — Specification Analysis (`spec-analyzer`)  
**Status:** Under Review (Gate Approval Required)  
**Standard:** IEEE 830 / ISO/IEC/IEEE 29148 compatible  

---

## 1. Executive Summary & N5 MVP Boundaries

### 1.1 Product Vision
JLPT Master is an interactive, responsive web application tailored for Vietnamese learners preparing for the Japanese Language Proficiency Test (JLPT). The MVP release focuses exclusively on a **complete end-to-end N5 workflow**, providing authentic learning, practice, spaced-repetition (SRS) review, and simulated mock exams with concise Vietnamese explanations.

### 1.2 Boundary Definitions
- **IN SCOPE for N5 MVP:**
  - Complete N5 learning path (Kana syllabary, vocabulary, kanji, grammar).
  - Multi-format practice question engine (single choice, reading kana, fill-in-the-blank, sentence ordering, reading passage, listening).
  - Leitner/SM-2-derived 4-grade SRS review queue with persistent progress and idempotency guarantees.
  - JLPT N5 simulated mock exam (3 sections: Language Knowledge, Grammar/Reading, Listening) with server-side countdown timers, periodic debounced autosave, and strict post-finalization answer reveals.
  - Responsive UI (375px mobile to 1440px desktop) with custom Vietnamese typography and accessible Japanese Furigana/Ruby toggles.
  - Admin CMS for content CRUD, validation, CSV preview/import, draft-to-publish workflow, and audit logging.
  - MariaDB persistence (via Prisma with MySQL provider and MariaDB driver adapter).
  - Seed dataset: verified coherent sample dataset for N5 (≥3 lessons, ≥20 vocab, ≥5 kanji, ≥5 grammar, ≥20 practice questions, 2 reading passages, 2 listening exercises, 1 full demo mock exam).
- **OUT OF SCOPE for MVP (Strictly deferred to P1/P2):**
  - Full catalogs for N4, N3, N2, N1 (UI presents these with "Sắp ra mắt" / "Coming Soon" badges).
  - Third-party paid AI generation/explanation APIs during runtime.
  - Native mobile apps (iOS/Android native codebases; responsive PWA only).
  - Real monetary payment processing, subscriptions, and affiliate marketing.
  - Complex FSRS neural algorithm tuning (simple 4-interval SRS used in MVP).
  - User-to-user social networking, public leaderboards, peer chat.

---

## 2. Functional Requirements (FR)

| ID | Module | Title | Priority | Description & Acceptance Criteria |
|---|---|---|---|---|
| **FR-01** | Identity & Auth | Authentication & Session Management | P0 | **Description:** User registration, secure login, logout, and session lifecycle.<br>**Acceptance Criteria:**<br>1. Users can register with email and password, validated with Zod.<br>2. Passwords hashed using Argon2id/bcrypt; never stored or logged in plain text.<br>3. Session tokens stored in HttpOnly, SameSite, Secure cookies.<br>4. Unauthenticated requests to protected endpoints return HTTP 401.<br>5. Unauthorized role requests return HTTP 403. |
| **FR-02** | Onboarding | Learner Profile & Study Goals | P0 | **Description:** First-time user onboarding capturing study objectives.<br>**Acceptance Criteria:**<br>1. New users are routed to `/onboarding` upon first login.<br>2. User selects target level (N5 active; N4–N1 disabled with "Sắp ra mắt").<br>3. User sets daily study goal (minutes: 15, 30, 45, 60).<br>4. Profile saved to `user_profiles` with `onboarding_completed_at` timestamp.<br>5. Subsequent logins bypass onboarding and land directly on `/dashboard`. |
| **FR-03** | Dashboard | Learner Control Center | P0 | **Description:** Unified learner dashboard with dynamic, real-time statistics.<br>**Acceptance Criteria:**<br>1. Displays current lesson resumption link (max 2 taps to start learning).<br>2. Displays genuine count of SRS review cards currently due (`due_at <= NOW()`).<br>3. Displays daily study streak and overall N5 completion percentage.<br>4. Displays recent mock exam scores and practice accuracy breakdown.<br>5. Zero mock/hardcoded values in production dashboard queries. |
| **FR-04** | Curriculum | Course & Lesson Management | P0 | **Description:** Hierarchical curriculum: Level → Course → Lessons.<br>**Acceptance Criteria:**<br>1. Navigation tree displays ordered lessons for N5 course.<br>2. Lesson page displays theoretical notes, examples, vocabulary list, and grammar points.<br>3. Includes dedicated beginner Kana module (Hiragana & Katakana stroke/sound tables).<br>4. Lesson completion endpoint (`POST /lessons/:id/complete`) is idempotent.<br>5. Course progress recalculates accurately upon lesson completion. |
| **FR-05** | Vocabulary | Japanese Vocabulary Bank | P0 | **Description:** Comprehensive vocabulary catalog with search and filtering.<br>**Acceptance Criteria:**<br>1. Displays Kanji/Kana surface, kana reading, Vietnamese translation, and part of speech.<br>2. Example sentence provided in Japanese with Furigana and Vietnamese meaning.<br>3. Normalized search works for Romaji, Hiragana, Katakana, and Vietnamese keywords.<br>4. Filterable by JLPT level and topic tags. |
| **FR-06** | Kanji | Kanji Catalog & Radicals | P0 | **Description:** N5 Kanji lookup and detail display.<br>**Acceptance Criteria:**<br>1. Displays character, Onyomi, Kunyomi, stroke count, and Vietnamese Sino-Vietnamese (Hán-Việt) reading.<br>2. Displays sample compound words and links to vocabulary entries.<br>3. Unique database constraint prevents duplicate canonical Kanji entries. |
| **FR-07** | Grammar | Japanese Grammar Patterns | P0 | **Description:** Grammar point guides with structure and nuances.<br>**Acceptance Criteria:**<br>1. Displays structure/formation rules (e.g., `V-te + kudasai`).<br>2. Detailed Vietnamese explanation, context nuances, and cautionary notes.<br>3. At least 2 original Japanese example sentences per grammar rule.<br>4. Links to relevant practice questions targeting this specific grammar rule. |
| **FR-08** | Practice Engine | Interactive Question Answering | P0 | **Description:** Unified question engine supporting 4 core practice question types.<br>**Acceptance Criteria:**<br>1. Supports: Single-choice, Kanji reading selection, Fill-in-the-blank, and Sentence ordering (star question).<br>2. Client API payload does **not** contain `is_correct` flags or explanations prior to submission.<br>3. Submission (`POST /practice/submit`) evaluates answers server-side.<br>4. Response returns correctness, correct option, and detailed Vietnamese explanation. |
| **FR-09** | SRS Engine | Spaced Repetition Review System | P0 | **Description:** 4-grade flashcard review system based on interval scheduling.<br>**Acceptance Criteria:**<br>1. System generates user `review_cards` upon completing lessons or saving words/grammar.<br>2. Review queue returns only cards where `due_at <= NOW()`.<br>3. 4 recall grading options: Again (+10m), Hard (+1d), Good (+3d), Easy (+7d).<br>4. Review submissions include an `idempotencyKey`; duplicate submissions are ignored without altering card interval twice.<br>5. All timestamps stored in UTC; day boundaries calculated relative to `Asia/Ho_Chi_Minh`. |
| **FR-10** | Reading | Reading Comprehension Passages | P0 | **Description:** Reading passage display and comprehension questioning.<br>**Acceptance Criteria:**<br>1. Renders Japanese passage with selectable Furigana/Ruby display toggle.<br>2. Side-by-side or stacked layout on mobile for passage and associated questions.<br>3. Questions graded individually or in section batches with Vietnamese explanations. |
| **FR-11** | Listening | Listening Exercises & Audio Engine | P0 | **Description:** Accessible audio player with exam-like listening items.<br>**Acceptance Criteria:**<br>1. Audio player supports Play, Pause, Replay, and Speed control (0.8x, 1.0x).<br>2. Audio files hosted on S3-compatible storage; database stores validated keys only.<br>3. Optional Japanese transcript and Vietnamese translation accessible post-submission.<br>4. Audio items work seamlessly on mobile browsers without layout breaking. |
| **FR-12** | Mock Exam | Timed JLPT N5 Simulation Engine | P0 | **Description:** Official-like timed simulation across N5 sections.<br>**Acceptance Criteria:**<br>1. Configurable sections: Language Knowledge (20m), Grammar/Reading (40m), Listening (30m).<br>2. Server creates immutable `exam_snapshot_json` at attempt inception.<br>3. Client automatically autosaves answers (`PUT /attempts/:id/answers`) every 15s with debounce.<br>4. Page refresh seamlessly restores active attempt state and remaining server timer.<br>5. Server enforces expiration time; submissions after `expires_at + grace_period` are rejected.<br>6. Finalization (`POST /attempts/:id/finish`) is transactional and permits only one execution. |
| **FR-13** | Results Engine | Post-Exam Diagnostics & Explanations | P0 | **Description:** In-depth scoring breakdown and weak-point analysis.<br>**Acceptance Criteria:**<br>1. Displays section scores, raw correct count, and platform mock score (0–180 scale).<br>2. Clear disclaimer: "Điểm thi thử ước tính nội bộ — Không phải chứng chỉ JLPT chính thức".<br>3. Question-by-question review reveals user answer, correct answer, and detailed Vietnamese explanation.<br>4. Categorizes errors by skill/tag (e.g., Particles, Honorifics, Kanji reading) with direct remedial links. |
| **FR-14** | Analytics | Progress & Weak Skill Analytics | P1 | **Description:** Aggregate analytics over historical practice and exams.<br>**Acceptance Criteria:**<br>1. Computes mastery percentage across N5 vocabulary, Kanji, and grammar.<br>2. Pinpoints lowest-performing tags (<60% accuracy) over past 30 days.<br>3. Visual progress charts rendered cleanly on mobile and desktop. |
| **FR-15** | CMS Core | Content Management & Editorial Workflow | P0 | **Description:** Admin back-office for curriculum, questions, and exams.<br>**Acceptance Criteria:**<br>1. Full CRUD for Lessons, Vocabulary, Kanji, Grammar, Passages, and Questions.<br>2. Strict 4-stage lifecycle: `DRAFT` → `IN_REVIEW` → `PUBLISHED` → `ARCHIVED`.<br>3. Students can only query `PUBLISHED` content.<br>4. Modifying a published question creates a new revision without corrupting historical exam attempts.<br>5. Role-based access control restricts CMS exclusively to `ADMIN` and `EDITOR` roles. |
| **FR-16** | CSV Ingestion | Content Batch Import Engine | P0 | **Description:** Bulk import of vocabulary, Kanji, and questions via CSV.<br>**Acceptance Criteria:**<br>1. Admin uploads CSV; system parses and validates against strict Zod schema.<br>2. Import Preview displays detected rows, valid count, and exact line-by-line validation errors.<br>3. Duplicate detection checks canonical keys (e.g., Kanji character, Vocab surface+reading).<br>4. Atomic commit: if errors exist, import can be rejected or valid rows committed selectively.<br>5. Execution logged in `audit_logs`. |
| **FR-17** | Media Library | Storage & Asset Licensing Management | P0 | **Description:** Upload and tracking of audio clips and illustrations.<br>**Acceptance Criteria:**<br>1. Validates MIME type (`audio/mpeg`, `audio/ogg`, `image/webp`, `image/png`) and file size (audio ≤ 10MB, images ≤ 2MB).<br>2. Calculates SHA256 checksum to prevent duplicate storage.<br>3. Mandatory copyright attribution metadata (source URL, license type, author).<br>4. Uploads to S3-compatible bucket, stores relative key in database. |
| **FR-18** | Accessibility | Inclusive UI & Japanese Typography | P0 | **Description:** Full accessibility compliance for Vietnamese/Japanese dual-script UI.<br>**Acceptance Criteria:**<br>1. Complete keyboard navigation support (Tab, Enter, Space, Arrows) across all quiz & exam screens.<br>2. Visible focus indicators on all interactive elements.<br>3. Touch targets ≥ 44x44px across mobile viewports.<br>4. High-contrast typography adhering to WCAG 2.2 AA (≥ 4.5:1 for normal text).<br>5. Furigana rendered using semantic `<ruby>`, `<rb>`, `<rt>` tags compatible with screen readers. |
| **FR-19** | Security | Authorization, Immutability & Rate Limiting | P0 | **Description:** Systemic protection of learner data and evaluation integrity.<br>**Acceptance Criteria:**<br>1. Strict user ownership validation on every attempt, review card, and progress record.<br>2. Rate limiting applied to `/api/v1/practice/submit`, `/api/v1/attempts/*`, and `/api/v1/auth/*`.<br>3. Input sanitization prevents Cross-Site Scripting (XSS) in lesson rich text.<br>4. System logs sanitize sensitive fields (tokens, passwords, pending exam answers).<br>5. Historical exam attempts and review logs are immutable. |
| **FR-20** | Runbooks | Developer Experience & Deployment Runbooks | P0 | **Description:** Standardized configuration, seeding, and migration operations.<br>**Acceptance Criteria:**<br>1. Fully reproducible local environment using `docker-compose.yml` for MariaDB.<br>2. Automated Prisma migrations (`prisma migrate deploy`) with zero data loss on valid schema additions.<br>3. Verified seed script (`prisma/seed.ts`) populating valid N5 reference data.<br>4. Documented rollback and backup runbooks in `docs/deployment.md`. |

---

## 3. Non-Functional Requirements (NFR)

### 3.1 NFR-01: Performance & Web Vitals
- **Target:** Google Lighthouse Performance score $\ge 85$ on mobile and desktop for core routes (`/`, `/dashboard`, `/learn/n5`, `/practice`).
- **Core Web Vitals:** Largest Contentful Paint (LCP) $\le 2.5\text{s}$, Interaction to Next Paint (INP) $\le 200\text{ms}$, Cumulative Layout Shift (CLS) $\le 0.1$.
- **Database Optimization:** Zero $N+1$ query loops; all relational list fetches must use Prisma `include` with indexed foreign keys.
- **Autosave Efficiency:** Exam answers debounced to at most 1 network call per 15 seconds, payload size $\le 10\text{KB}$.

### 3.2 NFR-02: Security & Privacy
- **Hashing:** Argon2id or bcrypt (cost factor $\ge 12$) for credential authentication.
- **Cookie Policy:** Cookies issued with `HttpOnly`, `SameSite=Lax` (or `Strict` where appropriate), and `Secure=true` in production.
- **No Data Leakage:** API endpoints must never transmit `is_correct` boolean or `explanation_vi` before an attempt is submitted.
- **Role Enforcement:** Server-side RBAC enforced in route handlers and middleware; client-side route guards are treated strictly as UX convenience.
- **Auditability:** Destructive admin operations (delete, unpublish, batch import) permanently recorded in `audit_logs`.

### 3.3 NFR-03: Database Engine & Relational Integrity
- **Engine:** Dedicated **MariaDB** (v10.11 LTS or v11.x) with InnoDB storage engine.
- **Encoding:** Default character set `utf8mb4` with collation `utf8mb4_unicode_ci` or `utf8mb4_bin` for exact Japanese kanji distinction.
- **ORM Configuration:** Prisma datasource `provider = "mysql"`. PostgreSQL, SQLite, Supabase, and Firebase are strictly prohibited.
- **Referential Integrity:** Foreign keys must prevent cascading deletions on historical student records (`ON DELETE RESTRICT` on questions referenced by `attempt_answers`).

### 3.4 NFR-04: Reliability & Fault Tolerance
- **Autosave Recovery:** If network drops during an exam, answers are buffered locally in `localStorage` and synchronized upon reconnection.
- **Transactional Consistency:** Exam finalization and batch CSV imports must execute inside ACID database transactions (`prisma.$transaction`).
- **Idempotency:** Spaced repetition reviews and lesson completion events use client-supplied idempotency UUIDs.

### 3.5 NFR-05: Localization & Internationalization
- **Interface Language:** Vietnamese (Tiếng Việt) as primary UI language.
- **Learning Content:** Japanese (Kanji, Hiragana, Katakana) with Furigana Ruby notation.
- **Timezone:** Timestamps stored in UTC; business day rollover and due-date presentation localized to `Asia/Ho_Chi_Minh` (UTC+7).

### 3.6 NFR-06: Usability & Mobile Ergonomics
- **Responsive Breakpoints:** 375px (Mobile Portrait), 768px (Tablet), 1024px (Laptop), 1440px (Desktop Monitor).
- **Navigation Layout:** Mobile employs a bottom sticky tab bar (Trang chủ, Học, Luyện tập, Tiến độ); Desktop employs an expandable left sidebar.
- **Touch Ergonomics:** Minimum interactive hit area of $44 \times 44\text{px}$ with $\ge 8\text{px}$ touch separation.

### 3.7 NFR-07: Content Authenticity & Copyright Governance
- **Originality:** All sample vocabulary examples, reading passages, and exam questions must be original or under open educational licenses (CC-BY / Public Domain).
- **No Official JLPT Claims:** Clear disclaimer on all mock tests that questions are simulated mock items, not official JEES/Japan Foundation exam papers.
- **Provenance:** Every content entity maintains `license_type`, `attribution`, and `reviewer_id` in database records.

### 3.8 NFR-08: Observability & Health Checks
- **Health Checks:** `/api/health` providing uptime and process status; `/api/health/db` (restricted) validating MariaDB connection pool latency.
- **Structured Logging:** JSON log format with log level (`INFO`, `WARN`, `ERROR`), request ID, duration, and user ID.
- **Sanitization:** Log interceptor automatically masks passwords, tokens, authorization headers, and raw question answers.

### 3.9 NFR-09: Code Quality & Test-Driven Discipline
- **Strict Typing:** TypeScript strict mode enabled (`noImplicitAny: true`, `strictNullChecks: true`).
- **Test-Driven Development (TDD):** Red $\rightarrow$ Green $\rightarrow$ Refactor cycle mandatory for all business logic (SRS calculation, exam timers, grading engine).
- **Automated Gates:** Pull requests must pass `npm run lint`, `npm run typecheck`, Vitest unit tests, and Playwright E2E suites.

### 3.10 NFR-10: Deployment & Hostinger Environment Fit
- **Hostinger Target:** Hostinger Node.js Web App environment or Hostinger VPS with persistent Node.js process and Docker MariaDB.
- **Process Management:** Persistent runtime (PM2 or Docker daemon); no serverless cold-start connection pool exhaustion.
- **CI/CD Pipeline:** GitHub Actions automated pipeline performing build, test, and automated deployment via SSH/webhook.

---

## 4. Key Assumptions & Open Clarifications

### 4.1 Confirmed Assumptions
1. **N5 First:** All educational content development for Phase 1–6 focuses exclusively on JLPT Level N5. Levels N4–N1 exist only as database enum entries and disabled UI routes.
2. **Mock Scoring Model:** Raw section points will be mapped to a representative 0–180 score for user motivation, explicitly marked as an internal benchmark.
3. **Storage Strategy:** Media assets (audio MP3s and image illustrations) reside in S3-compatible cloud object storage; MariaDB stores only storage keys, hashes, and metadata.

### 4.2 Open Architectural Inquiries for Project Owner
1. **Authentication Mode Preference:** Does the owner prefer native Email/Password credentials via Auth.js / Lucia, or should Google OAuth be integrated in MVP? *(Default proposed: Email/Password credentials with Argon2id for maximum independence on Hostinger).*
2. **Hostinger Hosting Flavor:** Will production use Hostinger Cloud / Web App (Node.js runtime) or a Hostinger Ubuntu VPS with Docker? *(Recommendation: Hostinger VPS ensures full control over persistent MariaDB and background workers).*
3. **Audio Production:** Will N5 listening audio be sourced from voice actors or generated using high-fidelity neural Text-to-Speech (e.g., ElevenLabs / Google Cloud TTS) for seed data?
