import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/src/server/db";
import { signSessionToken, type SessionPayload } from "@/src/server/services/auth-service";
import { getDashboard } from "@/src/server/services/admin-dashboard-service";
import { GET as dashboardGET } from "@/app/api/v1/admin/dashboard/route";
import { GET as auditGET } from "@/app/api/v1/admin/audit/route";

// Fixed clock far from the seeded data (2026) so every windowed number is exactly what we insert.
// 2030-06-15T05:00:00Z is 12:00 on 2030-06-15 in Asia/Ho_Chi_Minh (UTC+7).
const NOW = new Date("2030-06-15T05:00:00Z");
const TAG = `dash${Date.now()}`;
const ids: Record<string, string> = {};

const req = (role: SessionPayload["role"], url: string) =>
  new NextRequest(`http://localhost${url}`, {
    headers: { "x-jlpt-session": signSessionToken({ userId: ids[role], email: `${TAG}-${role}@test.invalid`, role }) },
  });

beforeAll(async () => {
  for (const role of ["ADMIN", "EDITOR", "SUPPORT", "STUDENT"] as const) {
    ids[role] = (await prisma.user.create({ data: { email: `${TAG}-${role}@test.invalid`, role, displayName: `${role} ${TAG}` } })).id;
  }
  const mkLearner = async (key: string, createdAt: string, lastActiveAt: string, level: string) =>
    (ids[key] = (
      await prisma.user.create({
        data: { email: `${TAG}-${key}@test.invalid`, role: "STUDENT", displayName: key, createdAt: new Date(createdAt), lastActiveAt: new Date(lastActiveAt), profile: { create: { targetLevel: level } } },
      })
    ).id);
  await mkLearner("A", "2030-06-02T01:00:00Z", "2030-06-14T01:00:00Z", "N5");
  await mkLearner("B", "2030-06-10T01:00:00Z", "2030-06-09T01:00:00Z", "N5");
  await mkLearner("C", "2030-05-20T01:00:00Z", "2030-05-20T01:00:00Z", "N4"); // created last month, inactive

  const exam = await prisma.exam.findFirstOrThrow();
  const attempt = (userId: string, startedAt: string, status: "SUBMITTED" | "IN_PROGRESS" = "SUBMITTED") =>
    prisma.examAttempt.create({
      data: {
        examId: exam.id, examVersion: exam.version, userId, status, startedAt: new Date(startedAt), expiresAt: new Date(startedAt),
        submittedAt: status === "SUBMITTED" ? new Date(startedAt) : null, rawCorrect: 10, rawTotal: 20, examSnapshotJson: {},
      },
    });
  await attempt(ids.A, "2030-06-14T03:00:00Z");
  await attempt(ids.B, "2030-06-14T10:00:00Z");
  await attempt(ids.A, "2030-06-10T20:00:00Z"); // 03:00 on 11 June in Vietnam
  await attempt(ids.B, "2030-06-13T03:00:00Z", "IN_PROGRESS"); // started but not submitted: counts as activity, not as a taken exam
  await attempt(ids.A, "2030-04-01T03:00:00Z"); // outside the 30-day window

  const lesson = await prisma.lesson.findFirstOrThrow();
  await prisma.lessonProgress.create({ data: { userId: ids.A, lessonId: lesson.id, status: "COMPLETED", completedAt: new Date("2030-06-14T04:00:00Z") } });
  const item = await prisma.contentItem.findFirstOrThrow();
  const card = await prisma.reviewCard.create({ data: { userId: ids.C, contentItemId: item.id } });
  await prisma.reviewLog.create({
    data: { reviewCardId: card.id, idempotencyKey: randomUUID(), grade: "GOOD", previousDueAt: NOW, newDueAt: NOW, reviewedAt: new Date("2030-06-14T08:00:00Z") },
  });
  await prisma.auditLog.create({
    data: { actorId: ids.ADMIN, action: "member.suspend", entityType: "member", entityId: ids.A, metadataJsonRedacted: {}, beforeJson: { status: "ACTIVE" }, afterJson: { status: "SUSPENDED" }, createdAt: new Date("2030-06-15T04:59:00Z") },
  });
});

afterAll(async () => {
  const uid = Object.values(ids);
  await prisma.reviewLog.deleteMany({ where: { reviewCard: { userId: { in: uid } } } });
  await prisma.reviewCard.deleteMany({ where: { userId: { in: uid } } });
  await prisma.lessonProgress.deleteMany({ where: { userId: { in: uid } } });
  await prisma.examAttempt.deleteMany({ where: { userId: { in: uid } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: uid } } });
  await prisma.user.deleteMany({ where: { id: { in: uid } } });
});

describe("dashboard aggregates (AC-CMS-08)", () => {
  it("windowed KPIs equal the inserted data (week = last 7 days, month = calendar month in Vietnam, exams = submitted in last 30 days)", async () => {
    const { kpis } = await getDashboard(NOW);
    expect(kpis.activeThisWeek).toBe(2); // A (14 Jun) and B (9 Jun); C is last month
    expect(kpis.newThisMonth).toBe(2); // A (2 Jun) and B (10 Jun)
    expect(kpis.examsTaken).toBe(3); // the in-progress and the April attempt do not count
    expect(kpis.totalMembers).toBeGreaterThanOrEqual(3);
  });

  it("only counts learners — staff and anonymized accounts are excluded", async () => {
    const before = (await getDashboard(NOW)).kpis.totalMembers;
    const staff = await prisma.user.create({ data: { email: `${TAG}-x@test.invalid`, role: "SUPPORT", createdAt: new Date("2030-06-05T00:00:00Z"), lastActiveAt: new Date("2030-06-14T00:00:00Z") } });
    const gone = await prisma.user.create({ data: { email: `${TAG}-y@test.invalid`, role: "STUDENT", deletedAt: new Date(), createdAt: new Date("2030-06-05T00:00:00Z"), lastActiveAt: new Date("2030-06-14T00:00:00Z") } });
    try {
      const { kpis } = await getDashboard(NOW);
      expect(kpis.newThisMonth).toBe(2);
      expect(kpis.activeThisWeek).toBe(2);
      expect(kpis.totalMembers).toBeGreaterThanOrEqual(before);
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [staff.id, gone.id] } } });
    }
  });

  it("activity30d has exactly 30 zero-filled days ending on the Vietnam date of `now`, counting distinct users per Vietnam day", async () => {
    const { activity30d } = await getDashboard(NOW);
    expect(activity30d).toHaveLength(30);
    expect(activity30d[0].date).toBe("2030-05-17");
    expect(activity30d[29].date).toBe("2030-06-15");
    const by = Object.fromEntries(activity30d.map((d) => [d.date, d.activeMembers]));
    expect(by["2030-06-14"]).toBe(3); // A (exam + lesson, one user), B (exam), C (review log)
    expect(by["2030-06-13"]).toBe(1); // B's in-progress attempt is still activity
    expect(by["2030-06-11"]).toBe(1); // 2030-06-10T20:00Z is 11 June in Vietnam
    expect(by["2030-06-10"]).toBe(0);
    expect(by["2030-06-15"]).toBe(0);
    expect(activity30d.filter((d) => d.activeMembers === 0).length).toBe(27);
  });

  it("membersByLevel lists N5..N1 and sums to totalMembers", async () => {
    const { membersByLevel, kpis } = await getDashboard(NOW);
    expect(membersByLevel.map((l) => l.level)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(membersByLevel.reduce((n, l) => n + l.count, 0)).toBe(kpis.totalMembers);
    expect(membersByLevel[0].count).toBeGreaterThanOrEqual(2);
    expect(membersByLevel[1].count).toBeGreaterThanOrEqual(1);
  });

  it("recent activity is newest-first, capped at 10, and describes the audit row without secrets", async () => {
    const { recent } = await getDashboard(NOW);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThanOrEqual(10);
    expect(recent[0]).toMatchObject({ kind: "audit", text: expect.stringContaining("member.suspend") });
    const times = recent.map((r) => Date.parse(r.at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("dashboard and audit routes (AC-CMS-01)", () => {
  it("dashboard: SUPPORT and EDITOR 200, STUDENT 403", async () => {
    expect((await dashboardGET(req("SUPPORT", "/api/v1/admin/dashboard"))).status).toBe(200);
    expect((await dashboardGET(req("EDITOR", "/api/v1/admin/dashboard"))).status).toBe(200);
    expect((await dashboardGET(req("STUDENT", "/api/v1/admin/dashboard"))).status).toBe(403);
  });

  it("audit: SUPPORT can read with before/after; EDITOR is 403", async () => {
    // (the range filter itself is covered in admin-audit-service.test.ts)
    const all = await (await auditGET(req("SUPPORT", `/api/v1/admin/audit?actor=${ids.ADMIN}&module=member`))).json();
    expect(all.data[0]).toMatchObject({ action: "member.suspend", before: { status: "ACTIVE" }, after: { status: "SUSPENDED" } });
    expect((await auditGET(req("EDITOR", "/api/v1/admin/audit"))).status).toBe(403);
  });

  it("audit: clamps perPage, tolerates page past the end, rejects an unknown range", async () => {
    expect((await (await auditGET(req("SUPPORT", "/api/v1/admin/audit?perPage=500"))).json()).perPage).toBe(100);
    const past = await auditGET(req("SUPPORT", "/api/v1/admin/audit?page=999999"));
    expect(past.status).toBe(200);
    expect((await past.json()).data).toEqual([]);
    expect((await auditGET(req("SUPPORT", "/api/v1/admin/audit?range=1y"))).status).toBe(400);
  });
});
