# ADR-002: Exam Immutability via Snapshots & Answer Key Secrecy

## Status
Accepted

## Context
Online examinations face two critical risks:
1. **Answer Leakage:** If the frontend API receives question option metadata containing `isCorrect: true` or explanations before the candidate submits, technical users can inspect network payloads and compromise the test integrity.
2. **Catalog Mutation Distortion:** If administrators edit, fix typos, or replace questions in the question bank while a student has an ongoing or historical attempt, the student's score or historical answer review becomes distorted.

## Decision
1. **Exam Snapshots:** When an attempt begins (`POST /api/v1/exams/:id/start`), the server compiles all question prompts, options, and section durations into an immutable `exam_snapshot_json` saved on the `exam_attempts` row.
2. **Server-Side Answer Stripping:** Route handlers serving active attempts strictly serialize questions without the `is_correct` field or `explanation_vi`.
3. **Atomic Evaluation:** Answers are graded strictly on the server against the snapshot during finalization (`POST /api/v1/attempts/:id/finish`).

## Consequences
- **Positive:** Guaranteed zero answer leakage prior to finalization; complete historical fidelity of student exam records even if the master question bank is updated.
- **Negative:** Attempt records consume slightly more storage space due to JSON snapshots (~15KB per attempt), which is negligible given InnoDB compression and storage capacity.
