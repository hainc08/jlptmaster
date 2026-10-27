# JLPT Master — Requirements Traceability Matrix (RTM)

**Document:** `docs/traceability.md`  
**Phase:** 1 — Specification Analysis (`spec-analyzer`)  
**Status:** Under Review (Gate Approval Required)  

---

## 1. Traceability Matrix: Functional Requirements (FR)

| Req ID | Requirement Title | User Journey / Feature | UI Route & Components | API Endpoint / Service | Database Entity | Verification / Test Type | Acceptance Scenario Link |
|---|---|---|---|---|---|---|---|
| **FR-01** | Account & Sessions | Sign Up, Sign In, Sign Out, Auth Session | `/login`, `/register`, `AuthForm`, `UserNav` | `POST /api/v1/auth/*`, `AuthService` | `users`, `auth_sessions`, `auth_accounts` | Vitest Unit (Password hash), Playwright E2E (Login/Logout flow) | SPEC Scenario 1, 4 |
| **FR-02** | Enrollment & Onboarding | First-time Target & Goal Selection | `/onboarding`, `OnboardingWizard`, `GoalPicker` | `POST /api/v1/user/profile`, `ProfileService` | `user_profiles`, `jlpt_levels` | Vitest (Profile validation), Playwright (Onboarding redirect) | SPEC Scenario 1 |
| **FR-03** | Dashboard | Learner Home & Daily Progress | `/dashboard`, `StreakWidget`, `ResumeCard`, `DueSRSWidget` | `GET /api/v1/progress/overview`, `DashboardService` | `users`, `user_profiles`, `review_cards`, `lesson_progress` | Vitest (Aggregator logic), Playwright (Dashboard real stats) | SPEC Scenario 1 |
| **FR-04** | Course & Lessons | Curriculum Browsing & Completion | `/learn/n5`, `/learn/n5/[lessonSlug]`, `LessonViewer`, `KanaTable` | `GET /api/v1/courses`, `GET /api/v1/lessons/:id`, `POST /api/v1/lessons/:id/complete` | `courses`, `lessons`, `lesson_progress` | Vitest (Idempotent progress), Playwright (Lesson navigation) | SPEC Scenario 1 |
| **FR-05** | Vocabulary Bank | Search, Filter & Study Vocab | `/vocabulary`, `/vocabulary/[slug]`, `VocabList`, `FuriganaWord` | `GET /api/v1/vocabulary`, `VocabService` | `content_items`, `vocabulary` | Vitest (Japanese search normalization), Playwright (Filter/Search) | SPEC Scenario 10 |
| **FR-06** | Kanji Catalog | Kanji Lookups & Radicals | `/kanji`, `/kanji/[slug]`, `KanjiCard`, `StrokeOrder` | `GET /api/v1/kanji`, `KanjiService` | `content_items`, `kanji` | Vitest (Unique character constraint), Playwright (Kanji detail) | SPEC Scenario 10 |
| **FR-07** | Grammar Rules | Grammar Patterns & Explanations | `/grammar`, `/grammar/[slug]`, `GrammarGuide`, `ExampleSentence` | `GET /api/v1/grammar`, `GrammarService` | `content_items`, `grammar` | Vitest (Formation parser), Playwright (Grammar reader) | SPEC Scenario 10 |
| **FR-08** | Practice Engine | Interactive Question Answering | `/practice`, `QuestionContainer`, `OptionSelector`, `ExplanationModal` | `GET /api/v1/practice/questions`, `POST /api/v1/practice/submit` | `questions`, `question_options`, `question_tags` | Vitest (Server grading & key hiding), Playwright (Quiz answering) | SPEC Scenario 2, 5 |
| **FR-09** | SRS Engine | Spaced Repetition Flashcards | `/flashcards`, `FlashcardDeck`, `FlipCard`, `RecallGradeBar` | `GET /api/v1/reviews/due`, `POST /api/v1/reviews`, `SrsService` | `review_cards`, `review_logs` | Vitest (Interval math & idempotency key), Playwright (Deck review) | SPEC Scenario 3 |
| **FR-10** | Reading Module | Passage Comprehension | `/reading`, `PassageViewer`, `PassageQuestions` | `GET /api/v1/reading/:id`, `ContentService` | `content_items`, `reading_passages`, `questions` | Vitest (Passage linking), Playwright (Reading flow) | SPEC Scenario 10, 12 |
| **FR-11** | Listening Module | Audio Exercise & Transcripts | `/listening`, `AudioPlayer`, `ListeningQuestion` | `GET /api/v1/listening/:id`, `MediaService` | `content_items`, `listening_tracks`, `media_assets` | Vitest (MIME check), Playwright (Audio controls & submission) | SPEC Scenario 11, 12 |
| **FR-12** | Mock Exam Engine | Timed Simulation & Autosave | `/mock-exams`, `/mock-exams/[attemptId]`, `ExamTimer`, `ExamQuestionSheet` | `POST /api/v1/exams/:id/start`, `PUT /api/v1/attempts/:id/answers`, `POST /api/v1/attempts/:id/finish` | `exams`, `exam_sections`, `exam_attempts`, `attempt_answers` | Vitest (Autosave, timer expiry, snapshot), Playwright (Exam flow) | SPEC Scenario 5, 6, 7 |
| **FR-13** | Results Engine | Post-Exam Diagnostic Review | `/results/[attemptId]`, `ScoreSummary`, `WeakTagChart`, `ItemReview` | `GET /api/v1/attempts/:id/result`, `ScoringService` | `exam_attempts`, `attempt_answers` | Vitest (Internal score calculation), Playwright (Result display) | SPEC Scenario 5 |
| **FR-14** | Analytics | Progress & Weak Spot Discovery | `/progress`, `SkillRadar`, `AccuracyByTagTable` | `GET /api/v1/analytics/skills`, `AnalyticsService` | `attempt_answers`, `review_logs`, `lesson_progress` | Vitest (Aggregation calculations), Playwright (Chart rendering) | SPEC Scenario 1, 11 |
| **FR-15** | CMS Core | Editorial & Publishing Workflow | `/admin`, `/admin/content`, `ContentEditor`, `WorkflowBadge` | `GET/POST/PATCH /api/v1/admin/content/*`, `POST .../publish` | `content_items`, `content_revisions`, `audit_logs` | Vitest (State transitions: Draft->Publish), Playwright (Admin publish) | SPEC Scenario 4, 8 |
| **FR-16** | CSV Ingestion | Batch Content Ingestion | `/admin/content/import`, `CsvUploader`, `ImportPreviewTable` | `POST /api/v1/admin/content/import/preview`, `.../commit` | `content_items`, `vocabulary`, `kanji`, `audit_logs` | Vitest (Zod parser & duplicate check), Playwright (Upload & Preview) | SPEC Scenario 9 |
| **FR-17** | Media Library | Audio/Image Upload & Attribution | `/admin/media`, `MediaDropzone`, `AssetAttributionForm` | `POST /api/v1/admin/media/upload`, `MediaService` | `media_assets`, `audit_logs` | Vitest (SHA256 & size validator), Playwright (Media upload) | SPEC Scenario 11 |
| **FR-18** | Accessibility | Inclusive UI & Japanese Text | Global Layout, `RubyText`, `SkipToContent`, `FocusRing` | Global CSS, Semantic HTML components | N/A | Axe-core accessibility scan, Playwright Keyboard Tab test | SPEC Scenario 10, 12 |
| **FR-19** | Security & Integrity | Authorization, Rate Limiting & Immutability | Global Middleware, Protected Layouts | `AuthGuard`, `RateLimiter`, `OwnershipInterceptor` | `audit_logs`, `exam_attempts` | Vitest (IDOR protection, rate limit tests), Playwright (Auth breach) | SPEC Scenario 4, 5, 7 |
| **FR-20** | Runbooks & DevOps | Environment Reproducibility & Migrations | N/A | `docker-compose.yml`, `prisma migrate`, `seed.ts` | Complete MariaDB Schema | MariaDB container migration run, seed verification script | SPEC Scenario 11 |

---

## 2. Traceability Matrix: Non-Functional Requirements (NFR)

| NFR ID | Quality Attribute | Technical Specification Target | Implementation Mechanism | Test & Validation Protocol |
|---|---|---|---|---|
| **NFR-01** | Performance | Lighthouse $\ge 85$, LCP $\le 2.5\text{s}$, INP $\le 200\text{ms}$ | Next.js Server Components, Turbopack bundle optimization, image optimization, debounced autosave | Lighthouse CI audit, Web Vitals telemetry |
| **NFR-02** | Security & Privacy | OWASP Top 10 compliance, zero answer leakage, strict RBAC | Zod schema validation, Argon2id, HttpOnly SameSite cookies, server-side authorization guards | OWASP dependency check, automated IDOR security tests |
| **NFR-03** | Database Integrity | MariaDB InnoDB, utf8mb4, zero unindexed foreign keys | Prisma with `provider = "mysql"`, InnoDB engine, foreign keys with restrict on student attempts | Prisma schema validation, MariaDB index performance audit |
| **NFR-04** | Fault Tolerance | Lossless exam autosave, idempotent review updates | LocalStorage client buffer, database transactions (`$transaction`), idempotency UUIDs | Network disruption simulation test in Playwright |
| **NFR-05** | Localization | Vietnamese UI, Japanese Ruby notation, UTC+7 timezone | Semantic `<ruby>` tags, custom typography (Be Vietnam Pro / Noto Sans JP), date-fns with `Asia/Ho_Chi_Minh` | Unicode rendering tests, daylight boundary unit tests |
| **NFR-06** | Usability | Responsive 375px–1440px, $\ge 44\text{px}$ touch targets | Tailwind CSS fluid typography, sticky mobile bottom nav, desktop left sidebar | Viewport visual regression tests (Playwright 375px/1440px) |
| **NFR-07** | Copyright & Compliance | 100% original/licensed content, transparent mock disclaimer | Mandatory license/attribution metadata fields, clear legal disclaimers in UI footers | Content audit script checking missing licensing headers |
| **NFR-08** | Observability | Real-time health monitoring, structured redacted logging | `/api/health`, custom Pino/Winston logger masking sensitive tokens and answers | Health endpoint integration test, log sanitization test |
| **NFR-09** | Code Quality | TypeScript strict, TDD RED-GREEN-REFACTOR cycle | ESLint strict rules, Vitest unit test runner, mandatory failing test evidence before green code | CI quality gates (`npm run typecheck`, `npm run lint`, `npm test`) |
| **NFR-10** | Hostinger Deployment | Persistent Node.js process, persistent MariaDB container | Docker Compose for local/VPS deployment, systemd/PM2 process supervisor, SSH release action | Deploy dry-run verification, database backup/restore test |

---

## 3. Verification & Scenario Traceability Summary

All 12 acceptance scenarios documented in `SPEC.md` Section 12 are mapped directly into verifiable test fixtures:
- **Scenario 1:** FR-01, FR-02, FR-03, FR-04, FR-14 $\rightarrow$ `tests/e2e/onboarding-journey.spec.ts`
- **Scenario 2:** FR-08 $\rightarrow$ `tests/integration/practice-grading.test.ts`
- **Scenario 3:** FR-09 $\rightarrow$ `tests/unit/srs-idempotency.test.ts`
- **Scenario 4:** FR-01, FR-15, FR-19 $\rightarrow$ `tests/security/rbac-idor.test.ts`
- **Scenario 5:** FR-08, FR-12, FR-13, FR-19 $\rightarrow$ `tests/security/exam-secrecy.test.ts`
- **Scenario 6:** FR-12 $\rightarrow$ `tests/e2e/exam-autosave.spec.ts`
- **Scenario 7:** FR-12 $\rightarrow$ `tests/integration/exam-timer-expiry.test.ts`
- **Scenario 8:** FR-15 $\rightarrow$ `tests/integration/content-publishing-lifecycle.test.ts`
- **Scenario 9:** FR-16 $\rightarrow$ `tests/integration/csv-import.test.ts`
- **Scenario 10:** FR-05, FR-06, FR-07, FR-10, FR-18 $\rightarrow$ `tests/unit/japanese-unicode-ruby.test.ts`
- **Scenario 11:** FR-11, FR-17, FR-20, NFR-09, NFR-10 $\rightarrow$ GitHub Actions Pipeline (`CI.yaml`)
- **Scenario 12:** FR-18, NFR-06 $\rightarrow$ `tests/e2e/accessibility-keyboard-mobile.spec.ts`
