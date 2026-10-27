# ADR-003: Simple 4-Grade SRS Scheduling & Client Idempotency Keys

## Status
Accepted

## Context
Learners review vocabulary and grammar cards across mobile devices. Unstable cellular networks frequently cause duplicate POST requests when a user taps recall buttons repeatedly. Furthermore, complex FSRS or Anki SM-2 neural models introduce unnecessary dependency risks and tuning complexity for an N5 MVP.

## Decision
1. **Simplified Interval Engine:**
   - Grade 1 (Again / Chưa nhớ): +10 minutes (re-tested in current session).
   - Grade 2 (Hard / Khó nhớ): +1 day.
   - Grade 3 (Good / Nhớ tốt): +3 days.
   - Grade 4 (Easy / Rất dễ): +7 days.
   - Subsequent intervals scale based on `repetitions` and `ease_factor`.
2. **Idempotency Guarantee:**
   - Every client review submission generates a UUID `idempotencyKey`.
   - The database table `review_logs` enforces `UNIQUE(review_card_id, idempotency_key)`.
   - Re-submitting the same key returns the existing log without advancing intervals a second time.

## Consequences
- **Positive:** Immune to mobile network duplicate submissions; predictable review scheduling; clean audit trail.
- **Negative:** Advanced learners cannot customize exponential multipliers in MVP; FSRS is deferred to post-MVP.
