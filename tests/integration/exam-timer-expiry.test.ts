import { describe, it, expect } from "vitest";
import { validateAttemptTimeliness } from "../../src/server/services/exam-service";

describe("Exam Timer Expiry — Server Authority", () => {
  it("rejects answer updates when the timer has expired past grace period", () => {
    const expiredAt = new Date("2026-10-28T02:00:00.000Z");
    const pastGraceTime = new Date("2026-10-28T02:00:20.000Z"); // 20s past expiry (grace is 15s)

    const check = validateAttemptTimeliness(expiredAt, pastGraceTime, 15);
    expect(check.isExpired).toBe(true);
    expect(check.remainingSeconds).toBe(0);
  });

  it("permits autosave within active duration or grace period", () => {
    const expiresAt = new Date("2026-10-28T02:20:00.000Z");
    const currentTime = new Date("2026-10-28T02:10:00.000Z"); // 10 minutes remaining

    const check = validateAttemptTimeliness(expiresAt, currentTime, 15);
    expect(check.isExpired).toBe(false);
    expect(check.remainingSeconds).toBeGreaterThan(600);
  });
});
