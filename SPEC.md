# JLPT MASTER — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

**Version:** 1.0  
**Date:** 2026-10-28  
**Language:** Vietnamese UI, Japanese learning content  
**Primary implementation agent:** Google Antigravity  
**Status:** Ready for implementation planning; product requirements and acceptance criteria.

---

## 0. EXECUTIVE DECISIONS

- Build a mobile-first responsive **web app** for Vietnamese learners preparing for JLPT N5–N1.
- MVP release ships **complete N5 workflow**, not fictional full N4–N1 catalogs. The data model and navigation support all five levels; unavailable courses are labeled “Sắp ra mắt”.
- Core journey: register → choose N5 → learn → practice → receive explanation → review via SRS → mock exam → review weaknesses.
- Stack: Next.js App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Prisma ORM, **MariaDB** (Prisma `provider = "mysql"`), Auth.js, Zod, Vitest, Playwright.
- Deploy to a Hostinger plan that can actually host a persistent Node.js process, or Hostinger VPS. GitHub CI/CD; S3-compatible object storage for audio/media.
- Modular monolith. No microservices, Kubernetes, payment integration, or required paid AI API in the MVP.
- **Done** means working routes, backed by database, tested with seeded content, not UI mockups.

## 1. BUSINESS OBJECTIVES AND KPI

### 1.1 Purpose
Enable Vietnamese-speaking learners to acquire and retain Japanese knowledge, practice with exam-like questions, and understand their errors. Differentiate on concise Vietnamese explanations, seamless learning-to-review-to-testing, mobile usability, and transparent progress.

### 1.2 Target personas
1. **New JLPT N5 learner:** needs kana, structured vocabulary, introductory grammar and small daily lessons.
2. **Returning N4–N3 learner:** needs consistent course pathways once levels launch.
3. **Advanced N2–N1 learner:** wants search, exam-style practice and analytics in later releases.
4. **Content admin / teacher:** edits learning material, audits answer keys, imports reviewed content, publishes versioned lessons and questions.

### 1.3 MVP success metrics (product targets, not guarantees)
- At least 80% of moderated beta users can register, finish one lesson, complete a quiz and view feedback without help.
- At least 95% of instrumented successful submissions persist with correct ownership; no critical data loss.
- Zero known critical auth/access-control/answer-leak issues before launch.
- Responsive at 375px and desktop 1440px; target WCAG 2.2 AA on core learning screens.
- Lighthouse Performance goal ≥85 on representative main pages under defined test conditions.

## 2. IN SCOPE / OUT OF SCOPE

### 2.1 MVP required (P0)
- Public landing and SEO pages; sign-up / sign-in / sign-out / password reset as supported by auth design.
- Learner onboarding: target JLPT level (N5 is live), daily goal, optional study reason.
- Dashboard: continue lesson, daily streak, due reviews, recent practice score, progress by skill.
- Courses and lessons, vocabulary, Kanji, grammar, Japanese display + kana readings + Vietnamese explanations.
- Kana beginner module for N5.
- Search/filter per level, topic and tags.
- Question engine: single-choice, kanji-reading, blank-choice, sentence-order, reading passage, listening item.
- Practice mode immediate feedback; timed exam mode delayed answer reveal.
- Review cards and persistent history with simple SRS scheduling.
- Reading/listening content; accessible audio controls, transcript where policy permits.
- JLPT-like mock exams with configurable sections/timing and transparent **internal raw score**.
- Results with per-question explanations and weak topics; persisted attempts and resumption.
- Admin CMS with CRUD, media, content review/publish, CSV import preview, basic audit log.
- Security basics, responsive UX, logging, backups, automated tests, deployment docs.

### 2.2 Future (P1/P2)
- Publish complete N4→N1 verified content; AI explanations, personalized adaptive learning, FSRS tuning, leaderboards, payment, native mobile, speaking assessment, teacher groups, offline sync, referral/affiliate programs, certificates.
- Do not pretend P1/P2 is operational during MVP.

### 2.3 Content commitments and copyright
- Seed a **small verified example dataset** sufficient for every workflow. Do not automatically fabricate 800 words/100 grammar rules as fact.
- N5 planning targets (subject to review): 500–800 vocabulary entries, 80–120 Kanji, 70–100 grammar items, 300–500 original questions, 20–30 reading passages, 30–50 listening items. These are **editorial targets**, not official JLPT lists.
- Original/appropriately licensed examples, audios and questions only. Preserve source, author, licensing, reviewer and review date.
- Do not claim questions, scoring, levels or proficiency certification are official JLPT materials unless licensed.

## 3. INFORMATION ARCHITECTURE / ROUTES

| Route | Access | Required UI |
|---|---|---|
| `/` | Public | Hero, how it works, curricula preview, SEO content, CTA |
| `/login`, `/register`, `/forgot-password` | Guest | Validated secure auth forms |
| `/onboarding` | Student | Choose target level/daily goal; N4–N1 coming soon |
| `/dashboard` | Student | Resume, due cards, progress, recent activity |
| `/learn/[level]` | Student | Course map; N5 available |
| `/learn/[level]/[lessonSlug]` | Student | Lesson theory/examples/practice CTA |
| `/vocabulary`, `/vocabulary/[slug]` | Student | Filter/search, readings, meaning, examples |
| `/kanji`, `/kanji/[slug]` | Student | On/Kun readings, words, examples |
| `/grammar`, `/grammar/[slug]` | Student | Pattern, formation, nuance, examples |
| `/flashcards` | Student | Due queue, flip card, 4 recall grades |
| `/practice` | Student | Practice filters, review answer explanations |
| `/reading`, `/listening` | Student | Reading passage / audio question |
| `/mock-exams` | Student | Exam catalog and start |
| `/mock-exams/[attemptId]` | Owner | Sections, timer, autosave, submit/resume |
| `/results/[attemptId]` | Owner | Internal score, item analysis, weak skills |
| `/progress`, `/settings` | Student | Analytics and profile |
| `/admin` | Admin | KPIs, drafts, published, review queue |
| `/admin/content` | Admin | Content CRUD/filter/import/export |
| `/admin/questions`, `/admin/exams` | Admin | Bank, section/order management |
| `/admin/media` | Admin | Upload/rights metadata |
| `/admin/audit` | Admin | Change audit trail |

Provide friendly empty/loading/error states, breadcrumbs, keyboard navigation, 404/403, and confirmation for destructive actions.

## 4. DESIGN SYSTEM / UX

### 4.1 Visual tokens
- Primary Japanese vermilion `#B9343F`, dark text `#1F2937`, canvas `#F7F7F4`, success surface `#E8F3EC`, info surface `#E7ECF8`.
- Typefaces: Be Vietnam Pro or Inter for Vietnamese, Noto Sans JP for Japanese (use `font-display: swap`, subset where feasible).
- 8px spacing system; radii ~10–14px; subtle shadows; minimum 44x44px touch targets; accessible contrast; no decorative overload.
- Mobile: bottom nav (Home, Học, Luyện, Tiến độ); desktop: left sidebar. Progress always accessible.
- Do not use fake testimonials, fabricated exam pass rates or copyright-unsafe imagery.

### 4.2 User experience flows
**New student:** Landing → Register → Onboarding → N5 lesson 01 → 5-question practice → feedback → Dashboard. Max two navigation taps from Dashboard to study.

**Returning student:** Login → due review count → flashcards → graded recall → updated next due time → optional quiz.

**Mock exam:** Choose mock exam → instructions → start server-side attempt → per-section timer → autosave → submit/timeout → graded result → explanation and links to weak topics. No answer keys leaked until finish.

**Admin:** Create content draft → validate and preview → reviewer approval → publish → student visibility; edits to published questions must not rewrite old attempt history.

### 4.3 Japanese content representation
- Store base Japanese characters, reading segments (ruby/furigana markup as structured segments), Vietnamese meaning, English optionally, audio and example sentences separately.
- Support ruby toggle and normal text selection; ensure screen reader compatibility.
- Do not embed furigana directly in a way that loses original kanji or blocks search.

## 5. FUNCTIONAL REQUIREMENTS & ACCEPTANCE

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FR-01 | Account and sessions | Register/login works; session expires safely; protected APIs reject anonymous requests |
| FR-02 | Enrollment | User chooses goal; only published course accessible; selection persisted |
| FR-03 | Dashboard | Queries current user; displays genuine progress/due cards; not hardcoded stats |
| FR-04 | Course lessons | Published lesson ordered by course; completion persisted idempotently |
| FR-05 | Vocabulary | Japanese, reading, VI meaning, original example, search and level filters |
| FR-06 | Kanji | Character, On/Kun, sample words, related vocab; no duplicates per canonical key |
| FR-07 | Grammar | Pattern, meaning, usage, nuances, examples, related question link |
| FR-08 | Practice | Correct answer graded server-side; explanation and topic displayed post-answer |
| FR-09 | SRS | Per-user cards, due queue, quality grade, interval and review history persisted |
| FR-10 | Reading | Passage linked to ordered questions; answers scored correctly |
| FR-11 | Listening | Audio source plays; accessible controls; progress/answer persistence |
| FR-12 | Mock exam | Configurable section durations, autosave, resume, server timer, single finalization |
| FR-13 | Results | Per-question feedback after finish; score explicitly called internal/mock |
| FR-14 | Analytics | Correct computed totals, weak skills based on tagged attempt histories |
| FR-15 | CMS | Admin CRUD and draft/review/publish; audit logging; student sees published only |
| FR-16 | Import | Preview CSV, validate schema, duplicate detection, fail/report bad rows |
| FR-17 | Media | MIME/size validation, storage key metadata, license/source captured |
| FR-18 | Accessibility | Keyboard-only core flow, visible focus, ARIA labels, clear state messages |
| FR-19 | Data integrity | Attempts immutable after finalization; no cross-account access |
| FR-20 | Documentation | Reproducible setup, migrations, seeds, build/test/deploy/rollback steps |

### 5.1 SRS algorithm (MVP policy)
- New card due immediately; after each recall user grades Again / Hard / Good / Easy.
- Initial delays: Again 10min, Hard 1 day, Good 3 days, Easy 7 days; subsequent intervals increase/decrease based on history. Store scheduling version in card metadata.
- Timestamps stored in UTC; display due cards in Asia/Ho_Chi_Minh default, user timezone optional. Tests must cover midnight boundary.
- On duplicate submit/retry, apply only one review mutation using idempotency token.
- FSRS is future improvement; do not misrepresent simple scheduling as FSRS.

### 5.2 Scoring and official JLPT fidelity
- N5 sections: Language Knowledge (Vocabulary) 20min; Grammar + Reading 40min; Listening 30min.
- N4: 25/55/35min; N3: 30/70/40min; N2 combined Language Knowledge + Reading 105min and Listening 50min; N1 combined 110min and Listening 55min (verify official JLPT schedule at release).
- Internal mock score can be percent/raw correct or transparently normalized 0–180 *as a platform estimate*, but **must not be presented as official JLPT scaled scores or definitive pass predictions**.
- A user cannot obtain correct options/answer rationale in the exam response before finalization.
- Store exam configuration/version/snapshot at attempt start; scoring idempotent and transactional.

## 6. APPLICATION ARCHITECTURE

### 6.1 Stack
- Node.js current maintained LTS compatible with the selected stable Next.js release.
- Next.js App Router + React + TypeScript strict.
- Tailwind CSS + shadcn/ui; React Hook Form + Zod.
- Server route handlers/actions with server-only service and repository modules; do not query DB from client components.
- Prisma ORM compatible with current installed version, MariaDB InnoDB + `utf8mb4`; Prisma datasource provider `mysql`. For Prisma 7 use official `@prisma/adapter-mariadb` initialization pattern where required.
- Auth.js or supported secure auth adapter; session + authorization enforcement server-side.
- S3-compatible object storage for MP3/OGG and images; keep only object keys/metadata in MariaDB.
- Vitest, Playwright, ESLint, TypeScript checks, CI. Monitoring with structured redacted logs + optional Sentry.

### 6.2 Architecture boundaries
```
Browser / PWA (responsive)
  ↓ HTTPS
Next.js: pages / route handlers / auth
  ↓ Zod validation / RBAC / ownership
Feature services: curriculum, quiz, SRS, exam, analytics, CMS
  ↓ Prisma repositories              ↘ Object storage
MariaDB (InnoDB, utf8mb4)
```
- Modular monolith, separable domains, no distributed messaging for MVP.
- Keep unique constraints, indexes, transactions, API input/output schemas, and domain services isolated.
- Background tasks (if essential) should be explicit bounded jobs, not dependencies on always-running unconfigured cron.

### 6.3 Proposed repo structure
```
jlpt-master/
  src/app/(public)/, (auth)/, (student)/, admin/, api/v1/
  src/components/ui/, layout/, learning/, quiz/, exam/
  src/features/{auth,curriculum,vocabulary,kanji,grammar,practice,reviews,exams,analytics,admin}/
  src/server/{services,repositories,authorization}/
  src/lib/, src/types/, src/generated/prisma/
  prisma/schema.prisma, prisma/migrations/, prisma/seed.ts
  content/templates/, content/examples/
  tests/{unit,integration,e2e}/
  docs/{architecture,db,api,design,content-guidelines,deployment}/
  .github/workflows/, docker-compose.yml, .env.example, README.md, TODO.md
```

## 7. DATABASE SPECIFICATION (MARIADB)

**Engine:** MariaDB with InnoDB and utf8mb4. Collation choose based on deployed MariaDB version and test Vietnamese/Japanese search and uniqueness. If Japanese search quality is insufficient, add explicit normalized searchable columns rather than assuming locale-aware LIKE correctness.

### 7.1 Main entities
- `users`: id (UUID/ULID stored as CHAR(36)/CHAR(26) consistently), email unique, password_hash nullable where provider auth, role STUDENT/EDITOR/ADMIN, status, created_at, updated_at.
- `auth_accounts`, `auth_sessions`, `verification_tokens`: according to selected Auth.js adapter version.
- `user_profiles`: user_id FK unique, target_level, daily_goal_minutes, timezone, onboarding_completed_at.
- `jlpt_levels`: id, code N5..N1 unique, rank.
- `courses`: id, level_id FK, slug, title_vi, description_vi, status, version, published_at.
- `lessons`: id, course_id FK, slug, title_vi, position, minutes_estimate, status, published_at.
- `content_items`: id, lesson_id nullable, level_id, kind VOCAB/KANJI/GRAMMAR/KANA/READING/LISTENING, slug, status, reviewer_id, published_at, version.
- `vocabulary`: content_item_id PK/FK, surface, reading, meaning_vi, pos, example_ja, example_reading, example_vi, search_normalized.
- `kanji`: content_item_id PK/FK, character, onyomi_json, kunyomi_json, meaning_vi, strokes, examples_json.
- `grammar`: content_item_id PK/FK, pattern, formation_vi, meaning_vi, explanation_vi, examples_json, notes_vi.
- `reading_passages`: id, content_item_id, text_ja, translated_vi, difficulty, copyright_source.
- `listening_tracks`: id, content_item_id, media_asset_id, transcript_ja, transcript_vi, duration_seconds.
- `questions`: id, level_id, lesson_id nullable, content_item_id nullable, question_type, prompt_json, explanation_vi, difficulty, skill, status, version.
- `question_options`: id, question_id FK, position, text_json, is_correct; keep hidden from pre-submission learner APIs.
- `question_tags`: question_id, tag_id; `tags`: id, slug, label_vi.
- `exams`: id, level_id, title, status, version, scoring_policy, published_at.
- `exam_sections`: id, exam_id, section_type, position, duration_seconds, max_internal_points.
- `exam_questions`: id, section_id, question_id, position, points.
- `exam_attempts`: id, exam_id, exam_version, user_id, status, started_at, last_saved_at, submitted_at, expires_at, raw_correct, raw_total, internal_score, exam_snapshot_json.
- `attempt_answers`: id, attempt_id, question_id, answer_json, question_snapshot_json, saved_at, is_correct nullable, unique(attempt_id, question_id).
- `review_cards`: id, user_id, content_item_id, due_at, interval_seconds, ease_factor, repetitions, lapses, scheduler_version, unique(user_id,content_item_id).
- `review_logs`: id, review_card_id, idempotency_key, grade, previous_due_at, new_due_at, reviewed_at, unique(review_card_id,idempotency_key).
- `lesson_progress`: id, user_id, lesson_id, status, completed_at, unique(user_id,lesson_id).
- `media_assets`: id, storage_key unique, mime_type, byte_size, sha256, license_type, attribution, owner_id, created_at.
- `content_revisions`: id, entity_type, entity_id, version, snapshot_json, editor_id, reviewed_by, change_reason.
- `audit_logs`: id, actor_id, action, entity_type, entity_id, metadata_json_redacted, created_at.

### 7.2 DB constraints and performance
- FK constraints for ownership and content associations; cascade/restrict intentionally, **never accidentally cascade-delete attempt history**.
- Index: `(user_id, due_at)` review cards; `(user_id, status, started_at)` exam attempts; `(level_id, kind, status)` content; `(exam_id, position)` sections; `(question_id, position)` options.
- `created_at`, `updated_at` in UTC; server defines timestamps.
- MariaDB JSON is not PostgreSQL JSONB: avoid PostgreSQL operators, arrays and partial indexes. Favor normalized relational columns for filtering; use JSON for structured display payloads/snapshots with Zod validation.
- Password and secrets must never appear in sample data, logs, prompts, or git.

### 7.3 Local services & migrations
- Docker Compose: MariaDB service, persistent volume, health check, least-privilege app user, separate migration credentials as practical.
- `.env.example` has placeholders, never secrets. `DATABASE_URL=mysql://...` for Prisma migrations; official MariaDB adapter settings from env for runtime.
- Run schema validation, generated client, migrations, seed and integration tests against MariaDB, not SQLite/Postgres.
- For production use migration deploy, backups, and rollback procedure; do not auto run destructive dev migration commands on production.

## 8. API CONTRACT (VERSIONED)

Base `/api/v1`; Zod validation; JSON with consistent `{data, meta?}` and errors `{error:{code,message,details?}}`; cursor pagination for large datasets; no private debug detail exposed.

| Method | Endpoint | Access | Contract |
|---|---|---|---|
| GET | `/levels` | Public | Published/coming-soon states |
| GET | `/courses?level=N5` | Student | Published courses, pagination |
| GET | `/lessons/:id` | Student | Lesson body, completion state |
| POST | `/lessons/:id/complete` | Student | Idempotent completion |
| GET | `/vocabulary?level=N5&q=` | Student | Safe search/filter/pagination |
| GET | `/kanji?level=N5` | Student | Published Kanji |
| GET | `/grammar?level=N5` | Student | Published grammar |
| GET | `/reviews/due` | Student | Due cards user-owned |
| POST | `/reviews` | Student | `{cardId,grade,idempotencyKey}` |
| GET | `/practice/questions?level=N5&type=` | Student | No answer keys |
| POST | `/practice/submit` | Student | Server grading; return explanation after attempt |
| GET | `/exams?level=N5` | Student | Published exam summaries |
| POST | `/exams/:id/start` | Student | Creates snapshot + timed attempt |
| GET | `/attempts/:id` | Owner | Safe resumable attempt, remaining server time |
| PUT | `/attempts/:id/answers` | Owner | Validated batch autosave (no score leak) |
| POST | `/attempts/:id/finish` | Owner | Transactional one-time submit and grade |
| GET | `/attempts/:id/result` | Owner | Available only after finalization |
| GET | `/progress/overview` | Student | Derived skill progress |
| POST/PATCH | `/admin/content...` | Editor/Admin | Draft and content changes |
| POST | `/admin/content/import/preview` | Editor/Admin | Validated preview, no commit |
| POST | `/admin/content/import/commit` | Admin | Transactional import with results |
| POST | `/admin/content/:id/publish` | Admin/reviewer | Review state and version checks |

Add explicit API documentation (OpenAPI or machine-readable Zod-backed contract), errors and example payloads. Choose UUIDs generated server-side; enforce per-user ownership on every attempt/card. Validate allowed state transitions (`IN_PROGRESS → SUBMITTED/EXPIRED`; not backwards).

## 9. AUTHORIZATION / SECURITY / PRIVACY

- Role STUDENT: own history and published content only. EDITOR: edit draft content, no publishing unless explicit policy. ADMIN: publishing/admin functions. No privilege from UI flags.
- Secure password hashing (Argon2id or framework-recommended), verified email/password reset if credential auth is used; secure SameSite HttpOnly cookies and CSRF defenses.
- Rate limits for login/register/practice/exam and file upload; login abuse controls.
- Validation with Zod, parameterized Prisma queries, XSS-safe rendering (sanitize rich lesson HTML), MIME and size checks, sanitized CSV import.
- Exam server is source of truth for elapsed time. Reject editing after expiry/submission. Idempotent retries and concurrency control to avoid duplicated grading.
- Accessible privacy notice, minimal personal data and retention policy; export/deletion requests in operational process.
- Request logs redacted; never include answers before submit, passwords, session tokens, signed URLs or DB credentials in logs.
- Daily DB backups, restoration rehearsal, media retention, monitoring alerts.

## 10. ADMIN / CONTENT OPERATIONS

Workflow: Draft → In Review → Published → Archived; only published visible to student. Content editor includes Japanese character and furigana preview, audio preview, examples, related items, tags, skill, difficulty, licensing, reviewer note. Quiz editor detects no correct answer/multiple correct where invalid, duplicate options, missing explanations and unlicensed media. CSV/XLSX ingestion: template, pre-validation, per-row report, dry run, transactional commit, duplicate policy and immutable import log. Require human review prior to public release.

## 11. NON-FUNCTIONAL REQUIREMENTS

- Performance: document and measure p75 Core Web Vitals and Lighthouse; target ≥85 performance on defined test pages; no unbounded DB queries or N+1 loops.
- Accessibility: core flow keyboard usable; contrast, visible focus, audio alternatives, clear validation, avoid color-only grading.
- SEO: SSR static public course descriptions, canonical and metadata; student pages noindex as appropriate.
- Reliability: database transaction for exam finalization/import; autosave with debounce + explicit save status + backoff.
- Localization: UI Vietnamese, Japanese ruby; timezone Asia/Ho_Chi_Minh configurable. N1–N5 correctly sorted.
- Observability: `/api/health` validates process; separate DB health protected/internal; structured logs, error tracking, backups.
- Scalability: paginated listing, DB indexes, object storage, proper connection pooling, no caching private answer keys.
- Deployment: HTTPS, secure environment, DB firewall/private network when possible, migrations and backups before deployment.

## 12. REFERENCE TEST DATA / ACCEPTANCE SCENARIOS

Seed an original N5 course of at least three coherent short lessons, including kana example, at least 20 vocabulary items, 5 Kanji, 5 grammar examples, 20 valid practice questions, 2 reading passages, 2 listening exercises with licensed/original audio, and 1 small demo mock exam. Seed one test student and admin via documented local-only credentials; never production defaults.

Automated acceptance flows:
1. Register → choose N5 → complete lesson → progress rises, persists across login.
2. Quiz correct/incorrect → correct explanation appears, answer validated on server.
3. Review one card twice with duplicate idempotency key → only one log and due date update.
4. Student cannot call admin API or view another user's attempt by changing ID.
5. Exam response never contains `isCorrect` / answer key before finish; after finalization shows explanations.
6. Autosave attempt → reload page → answers restored; submit twice → one score.
7. Timer expires → server rejects late updates, finalizes consistently.
8. Admin edits draft → reviewer publishes → learner sees it; archived disappears from public catalog.
9. CSV invalid row → preview reports error; no partial silent writes.
10. Vietnamese/Japanese Unicode, furigana display, kana search work.
11. `lint`, `typecheck`, `unit`, `integration`, `e2e`, `build` pass in documented environment.
12. Mobile 375px / desktop 1440px visual check, keyboard-only navigation on key screens.

## 13. IMPLEMENTATION ROADMAP / GATES

**Phase 0 — Audit & plan (before coding):** inspect repository, environment, Hostinger plan. Produce architecture, data model, ERD, API contracts, dependency compatibility, risk and ADRs. Do not overwrite existing source or data.

**Phase 1 — Foundation:** Next.js skeleton, config, design system, routes, layouts, auth UI, landing; validation: build + responsive screenshots.

**Phase 2 — Database/Auth:** Docker MariaDB, Prisma MySQL provider, official MariaDB adapter, migrations, seeds, Auth.js, RBAC, onboarding; validation: DB integration/auth tests.

**Phase 3 — Core learning:** published course/lesson, kana, vocab/Kanji/grammar, search, completion, N5 seed; validation: student E2E flow.

**Phase 4 — Practice/SRS:** shared question engine, answer submission, explanations, review queue/log; validation: grading/SRS unit tests and idempotency.

**Phase 5 — Listening, reading, exams:** media, passage, exam section engine, timer, autosave, result analytics; validation: no answer leakage, timer and resume E2E.

**Phase 6 — CMS/QA:** content CRUD, import preview/commit, approval, versioning, audit, editorial N5 content review; validation: permissions/content lifecycle.

**Phase 7 — Stabilization:** accessibility, mobile screens, query performance, backups, security review, error handling; validation: release checklist.

**Phase 8 — Deploy/Beta:** choose verified Hostinger runtime, CI build/test, migrations, DNS/HTTPS, secrets, monitoring, restore drill and documented rollback. Do not deploy without approval/secrets/hosting access.

### Phase deliverables
Every phase must update `TODO.md`, `docs/implementation-log.md`, tests and demo evidence (screenshots/browser captures where possible). Agent reports: changed files, executed commands, actual test results, remaining issues, explicit next work. No “finished” claims when tests are missing/failing.

## 14. PROJECT FILES AGENT MUST MAINTAIN

- `README.md` quickstart + architecture overview.
- `SPEC.md` canonical living spec (this file).
- `AGENTS.md` repo coding rules, safety, definition of done.
- `TODO.md` tracked implementation checklist with P0/P1.
- `docs/architecture.md`, `docs/database.md`, `docs/api.md`, `docs/design-system.md`, `docs/content-guidelines.md`, `docs/deployment.md`, `docs/implementation-log.md`.
- `.env.example`, `docker-compose.yml`, Prisma migrations, seed, CI workflow.

## 15. MASTER INSTRUCTION FOR ANTIGRAVITY

You are the Lead Full-Stack Engineer, Software Architect, UI/UX Designer, and QA Engineer for JLPT Master. Implement the requirements in this `SPEC.md` as **real production-oriented code**. Start by inspecting the repository; if blank, initialize it. Use modern compatible stable versions and verify official docs. Mandatory stack: Next.js App Router + TypeScript strict + Tailwind + shadcn/ui + MariaDB + Prisma provider `mysql` + supported MariaDB driver adapter + Auth.js + Zod + Vitest + Playwright. Do not switch to PostgreSQL, SQLite, Supabase DB or Firebase DB without explicit approval. Local DB must run on MariaDB with Docker Compose and all integration tests must use it.

First produce implementation plan, architecture, ERD and task checklist; then build in the numbered phases. Do not ask for routine design decisions already specified; use sensible defaults and document ADRs. If essential external credentials, database access, secrets or production deployment approval is needed, create clear configuration instructions and proceed with local equivalents. Never fabricate full JLPT official content or licensing rights. Generate only a small, coherent, reviewed sample dataset and import templates. Implement real business logic, not merely mocked cards/screenshots.

After each phase run lint, typecheck, build, and relevant automated tests. Use browser-based UI verification when available. Fix errors before claiming completion. Record genuine outputs and blockers. Finish the MVP with a complete working flow: account → N5 lesson → practice → SRS review → demo exam → results → admin publishes content.

## 16. VERIFIED EXTERNAL REFERENCES

- Google Antigravity IDE / agent official: https://www.antigravity.google/docs/ide/overview/
- Prisma ORM v7 MySQL/MariaDB connector: https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/mysql
- Official JLPT section times/composition: https://www.jlpt.jp/e/guideline/testsections.html
- Next.js docs: https://nextjs.org/docs/app

**Document note:** Version numbers, Hostinger plan capabilities and official JLPT timing should be confirmed during implementation/deployment. This is a build specification, not a representation that the software has already been created.
