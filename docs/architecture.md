# JLPT Master — Technical Architecture Specification

**Document:** `docs/architecture.md`  
**Phase:** 4 — API & Database Architecture (`api-db-architect`)  
**Status:** Under Review (Gate Approval Required)  

---

## 1. High-Level Architecture Overview

JLPT Master is structured as a **Modular Monolith** built on the Next.js App Router. It separates presentation, application logic, and data persistence into cleanly bounded layers with strict unidirectionality.

```
+-------------------------------------------------------------------------+
|                           CLIENT LAYER (BROWSER)                        |
|   Responsive React Server & Client Components (Next.js 16 + Tailwind)   |
|   - Furigana Toggle Context  - Audio Player Engine  - 3D Flashcard SRS  |
|   - 15s Debounced Exam Autosave  - Offline Buffer (localStorage)       |
+-------------------------------------------------------------------------+
                                    │ HTTPS (JSON / REST API v1)
                                    ▼
+-------------------------------------------------------------------------+
|                         APPLICATION BOUNDARY LAYER                      |
|   Next.js Route Handlers & Server Actions                               |
|   - Rate Limiter Middleware      - Role-Based Access Control (RBAC)     |
|   - Zod Schema Validation In/Out - Session Ownership Verification       |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                            DOMAIN SERVICES LAYER                        |
|   Pure TypeScript Business Logic Modules:                               |
|   - AuthService (Argon2id hashing, cookie lifecycle)                    |
|   - CurriculumService (Course tree, lesson progress idempotency)        |
|   - SrsService (4-grade interval math, UTC midnight normalization)      |
|   - ExamEngine (Snapshot generation, server countdown, atomic scoring)  |
|   - CmsService (Editorial lifecycle: Draft -> Review -> Published)      |
|   - CsvImportService (Zod dry-run validation, atomic transaction batch) |
+-------------------------------------------------------------------------+
                  │                                           │
                  ▼                                           ▼
+-----------------------------------+       +-----------------------------+
|    PRISMA REPOSITORY LAYER        |       |    OBJECT STORAGE (S3 API)  |
|   - Prisma Client (MariaDB)       |       |   - Audio Listening MP3s    |
|   - Connection Limit = 5          |       |   - Kana stroke illustrations|
|   - Explicit Transactions         |       |   - Storage key metadata in |
+-----------------------------------+       |     media_assets table      |
                  │                         +-----------------------------+
                  ▼
+-------------------------------------------------------------------------+
|                       DATABASE LAYER (MARIADB 10.11 LTS)                |
|   - Storage Engine: InnoDB (Full ACID Transaction Support)             |
|   - Collation: utf8mb4_unicode_ci (Exact Japanese/Vietnamese support)   |
|   - Foreign Keys with ON DELETE RESTRICT on historical student data     |
+-------------------------------------------------------------------------+
```

---

## 2. Core Architectural Decisions & Boundaries

### 2.1 MariaDB & Prisma MySQL Provider
- **Engine Selection:** Dedicated MariaDB 10.11 LTS. PostgreSQL, SQLite, and external DBaaS (Supabase/Firebase) are prohibited by project rules.
- **Prisma Configuration:** `provider = "mysql"`. MariaDB is wire-compatible with the MySQL protocol.
- **Connection Pooling:** Next.js server processes enforce connection pool limits (`DATABASE_URL="mysql://...?connection_limit=5&pool_timeout=10"`) to prevent exhausting MariaDB thread limits.

### 2.2 Exam Secrecy & State Engine
- **Immutability via Snapshots:** When a student starts an exam (`POST /api/v1/exams/:id/start`), the server compiles all question prompts, options, and section durations into an immutable `exam_snapshot_json` saved directly onto the `exam_attempts` row. Subsequent content updates by administrators do not corrupt ongoing or past exams.
- **Answer Stripping:** Prior to final submission, API responses return only `question_id` and `option_id`. Correct option IDs and Vietnamese explanations are strictly stripped out server-side.
- **Server Timer Authority:** The server records `started_at` and `expires_at`. Client-side timers are purely presentation. Submissions arriving after `expires_at + 15s grace period` are marked as `EXPIRED` and finalized automatically.

### 2.3 Spaced Repetition (SRS) Idempotency
- Each review action requires a client-generated UUID (`idempotencyKey`).
- The database enforces a `UNIQUE(review_card_id, idempotency_key)` constraint on `review_logs`. Retries or double-taps on mobile devices cannot artificially increase a card's interval multiple times.

### 2.4 Japanese Ruby / Furigana & Search Strategy
- In MariaDB, embedding raw HTML `<ruby>` inside database text columns degrades search and indexing.
- **Storage Strategy:**
  - Base Kanji surface stored in `surface` (e.g. `先生`).
  - Pure Hiragana reading stored in `reading` (e.g. `せんせい`).
  - Searchable normalized column `search_normalized` combines surface, reading, romaji (`sensei`), and Vietnamese meaning (`giao vien`) in lower-case stripped format.

---

## 3. Transaction Management & Concurrency Control

ACID transactions (`prisma.$transaction`) are mandatory for all critical state mutations:
1. **Exam Finalization:**
   ```ts
   await prisma.$transaction(async (tx) => {
     // 1. Lock attempt row
     const attempt = await tx.examAttempt.findUniqueOrThrow({ where: { id: attemptId } });
     if (attempt.status !== "IN_PROGRESS") throw new ConflictError("Attempt already finalized");
     
     // 2. Grade each answer against snapshot
     const graded = calculateScore(attempt.examSnapshotJson, userAnswers);
     
     // 3. Update attempt status and scores atomically
     await tx.examAttempt.update({
       where: { id: attemptId },
       data: {
         status: "SUBMITTED",
         submittedAt: new Date(),
         rawCorrect: graded.rawCorrect,
         internalScore: graded.mockScore180,
       },
     });
   });
   ```
2. **CSV Batch Ingestion:** The entire batch is inserted within a single transaction. If any row fails during commit, the entire operation is rolled back, preventing corrupted partial states.

---

## 4. Security & Role-Based Access Control (RBAC)

| User Role | Permitted Actions | Prohibited Actions |
|---|---|---|
| **STUDENT** | View published courses, study lessons, review own SRS cards, take exams, view own results. | View draft content, access other students' attempts, modify questions, call `/admin/*` APIs. |
| **EDITOR** | View published/draft content, create new drafts, preview CSV imports, edit questions. | Publish content without approval, delete historical attempts, manage system users. |
| **ADMIN** | Full administrative rights: approve and publish content, execute CSV imports, view audit logs. | Modify finished student exam score records. |
