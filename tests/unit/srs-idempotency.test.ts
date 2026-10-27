import { describe, it, expect } from "vitest";
import { calculateNextDue, processSrsReview } from "../../src/server/services/srs-service";

describe("SRS Engine — Interval Calculations & Idempotency", () => {
  const baseTime = new Date("2026-10-28T00:00:00.000Z");

  it("calculates correct intervals for 4 recall grades", () => {
    // 1. Again: +10 minutes
    const again = calculateNextDue(baseTime, "AGAIN", 0, 2.5);
    expect(again.intervalSeconds).toBe(600);
    expect(again.nextDueAt.getTime() - baseTime.getTime()).toBe(600 * 1000);

    // 2. Hard: +1 day (86400s)
    const hard = calculateNextDue(baseTime, "HARD", 0, 2.5);
    expect(hard.intervalSeconds).toBe(86400);

    // 3. Good: +3 days (259200s)
    const good = calculateNextDue(baseTime, "GOOD", 0, 2.5);
    expect(good.intervalSeconds).toBe(86400 * 3);

    // 4. Easy: +7 days (604800s)
    const easy = calculateNextDue(baseTime, "EASY", 0, 2.5);
    expect(easy.intervalSeconds).toBe(86400 * 7);
  });

  it("enforces idempotency on duplicate submission keys", () => {
    const card = {
      id: "card-123",
      dueAt: baseTime,
      intervalSeconds: 0,
      repetitions: 0,
      easeFactor: 2.5,
    };

    const idempotencyKey = "uuid-test-key-001";

    // First review submission
    const res1 = processSrsReview(card, "GOOD", idempotencyKey, baseTime);
    expect(res1.isApplied).toBe(true);
    expect(res1.intervalSeconds).toBe(86400 * 3);

    // Duplicate submission with same key
    const res2 = processSrsReview(
      { ...card, intervalSeconds: res1.intervalSeconds, dueAt: res1.nextDueAt },
      "GOOD",
      idempotencyKey,
      baseTime,
      [idempotencyKey] // Existing logged keys
    );
    expect(res2.isApplied).toBe(false);
    expect(res2.isDuplicate).toBe(true);
  });
});
