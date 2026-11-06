import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import {
  recordStudyMinutes,
  getActivitySummary,
  localDay,
} from "@/src/server/services/study-activity-service";
import { POST as postActivity } from "@/app/api/v1/progress/activity/route";
import { GET as getOverview } from "@/app/api/v1/progress/overview/route";

const TZ = "Asia/Ho_Chi_Minh";
const EMAIL = "activity-test@jlptmaster.vn";

describe("study activity (minutes, streak, week)", () => {
  let user: { id: string; email: string };
  const cookie = () => ({
    Cookie: `jlpt_session=${signSessionToken({ userId: user.id, email: user.email, role: "STUDENT" })}`,
  });

  beforeAll(async () => {
    user = await prisma.user.upsert({ where: { email: EMAIL }, update: {}, create: { email: EMAIL, role: "STUDENT" } });
  });
  beforeEach(async () => {
    await prisma.studyActivity.deleteMany({ where: { userId: user.id } });
  });
  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
  });

  it("computes the local calendar day in the given time zone", () => {
    expect(localDay(new Date("2026-11-05T16:50:00Z"), TZ)).toBe("2026-11-05"); // 23:50 local
    expect(localDay(new Date("2026-11-05T17:10:00Z"), TZ)).toBe("2026-11-06"); // 00:10 local
  });

  it("23:50 and 00:10 local are two consecutive days (Review Focus 3)", async () => {
    await recordStudyMinutes(user.id, 2, new Date("2026-11-05T16:50:00Z"), TZ);
    await recordStudyMinutes(user.id, 1, new Date("2026-11-05T17:10:00Z"), TZ);
    expect(await prisma.studyActivity.count({ where: { userId: user.id } })).toBe(2);
    const s = await getActivitySummary(user.id, new Date("2026-11-05T17:20:00Z"), TZ, 15);
    expect(s.streakDays).toBe(2);
    expect(s.todayMinutes).toBe(1);
  });

  it("adds minutes on the same day and clamps each call to 1–5", async () => {
    const at = new Date("2026-11-06T03:00:00Z");
    await recordStudyMinutes(user.id, 9, at, TZ);
    await recordStudyMinutes(user.id, 0, at, TZ);
    const s = await getActivitySummary(user.id, at, TZ, 15);
    expect(s.todayMinutes).toBe(6);
  });

  it("a missing day resets the streak to 1", async () => {
    await recordStudyMinutes(user.id, 3, new Date("2026-11-03T03:00:00Z"), TZ);
    await recordStudyMinutes(user.id, 3, new Date("2026-11-04T03:00:00Z"), TZ);
    await recordStudyMinutes(user.id, 3, new Date("2026-11-06T03:00:00Z"), TZ);
    const s = await getActivitySummary(user.id, new Date("2026-11-06T05:00:00Z"), TZ, 15);
    expect(s.streakDays).toBe(1);
  });

  it("today at 0 minutes keeps yesterday's streak", async () => {
    await recordStudyMinutes(user.id, 3, new Date("2026-11-04T03:00:00Z"), TZ);
    await recordStudyMinutes(user.id, 3, new Date("2026-11-05T03:00:00Z"), TZ);
    const s = await getActivitySummary(user.id, new Date("2026-11-06T05:00:00Z"), TZ, 15);
    expect(s.streakDays).toBe(2);
    expect(s.todayMinutes).toBe(0);
  });

  it("no activity at all gives streak 0", async () => {
    const s = await getActivitySummary(user.id, new Date("2026-11-06T05:00:00Z"), TZ, 15);
    expect(s.streakDays).toBe(0);
  });

  it("week runs Monday→Sunday with future days null", async () => {
    // 2026-11-06 is a Friday
    await recordStudyMinutes(user.id, 4, new Date("2026-11-02T03:00:00Z"), TZ);
    const s = await getActivitySummary(user.id, new Date("2026-11-06T05:00:00Z"), TZ, 15);
    expect(s.week).toHaveLength(7);
    expect(s.week[0]).toEqual({ day: "2026-11-02", minutes: 4 });
    expect(s.week[4]).toEqual({ day: "2026-11-06", minutes: 0 });
    expect(s.week[5]).toEqual({ day: "2026-11-07", minutes: null });
    expect(s.week[6]).toEqual({ day: "2026-11-08", minutes: null });
    expect(s.dailyGoalMinutes).toBe(15);
  });

  it("POST /progress/activity validates and records for the session user only", async () => {
    const post = (body: unknown, headers: Record<string, string> = cookie()) =>
      postActivity(
        new NextRequest("http://x/api/v1/progress/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
        })
      );
    expect((await post({ minutes: 1 }, {})).status).toBe(401);
    expect((await post({ minutes: 0 })).status).toBe(400);
    expect((await post({ minutes: 6 })).status).toBe(400);
    expect((await post({ minutes: 1.5 })).status).toBe(400);
    expect((await post({ minutes: 2, userId: "someone-else" })).status).toBe(204);
    const rows = await prisma.studyActivity.findMany({ where: { userId: user.id } });
    expect(rows.reduce((n, r) => n + r.minutes, 0)).toBe(2);
  });

  it("overview carries activity and no longer has currentStreak", async () => {
    const res = await getOverview(new NextRequest("http://x/api/v1/progress/overview", { headers: cookie() }));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data).not.toHaveProperty("currentStreak");
    expect(data.activity).toMatchObject({ streakDays: expect.any(Number), week: expect.any(Array) });
    expect(data.activity.week).toHaveLength(7);
  });
});
