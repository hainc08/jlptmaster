import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { GET as getExams } from "@/app/api/v1/exams/route";
import { GET as getAttempts } from "@/app/api/v1/attempts/route";

const A = "history-a@jlptmaster.vn";
const B = "history-b@jlptmaster.vn";

describe("best score per exam and my attempt history", () => {
  let ua: { id: string; email: string };
  let ub: { id: string; email: string };
  let exam: { id: string; version: string; title: string };

  const cookie = (u: { id: string; email: string }) => ({
    Cookie: `jlpt_session=${signSessionToken({ userId: u.id, email: u.email, role: "STUDENT" })}`,
  });
  const attempt = (userId: string, status: "SUBMITTED" | "IN_PROGRESS", score: number | null, startedMin: number) => {
    const startedAt = new Date(Date.UTC(2026, 10, 1, 1, startedMin));
    return prisma.examAttempt.create({
      data: {
        examId: exam.id,
        examVersion: exam.version,
        userId,
        status,
        startedAt,
        expiresAt: new Date(startedAt.getTime() + 3 * 3600_000),
        submittedAt: status === "SUBMITTED" ? new Date(startedAt.getTime() + 45 * 60_000) : null,
        internalScore: score,
        examSnapshotJson: { examId: exam.id, version: exam.version, questions: [] },
      },
    });
  };

  beforeAll(async () => {
    ua = await prisma.user.upsert({ where: { email: A }, update: {}, create: { email: A, role: "STUDENT" } });
    ub = await prisma.user.upsert({ where: { email: B }, update: {}, create: { email: B, role: "STUDENT" } });
    exam = await prisma.exam.findFirstOrThrow({ where: { levelId: "N5", status: "PUBLISHED" }, select: { id: true, version: true, title: true } });
    await prisma.examAttempt.deleteMany({ where: { userId: { in: [ua.id, ub.id] } } });
    await attempt(ua.id, "SUBMITTED", 90, 0);
    await attempt(ua.id, "SUBMITTED", 129, 10);
    await attempt(ua.id, "IN_PROGRESS", null, 20);
    await attempt(ub.id, "SUBMITTED", 170, 30);
  });
  afterAll(async () => {
    await prisma.examAttempt.deleteMany({ where: { userId: { in: [ua.id, ub.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ua.id, ub.id] } } });
  });

  it("exams carry the user's best SUBMITTED score and attempt count", async () => {
    const res = await getExams(new NextRequest("http://x/api/v1/exams?level=N5", { headers: cookie(ua) }));
    const e = (await res.json()).data.find((x: { id: string }) => x.id === exam.id);
    expect(e.bestInternalScore).toBe(129);
    expect(e.attemptCount).toBe(2);
  });

  it("signed out gets null / 0", async () => {
    const res = await getExams(new NextRequest("http://x/api/v1/exams?level=N5"));
    const e = (await res.json()).data.find((x: { id: string }) => x.id === exam.id);
    expect(e.bestInternalScore).toBeNull();
    expect(e.attemptCount).toBe(0);
  });

  it("history lists only my submitted attempts, newest first, with duration", async () => {
    const res = await getAttempts(new NextRequest("http://x/api/v1/attempts", { headers: cookie(ua) }));
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.map((d: { internalScore: number }) => d.internalScore)).toEqual([129, 90]);
    expect(data[0]).toMatchObject({ examId: exam.id, examTitle: exam.title, maxScore: 180, durationSeconds: 2700 });
  });

  it("user B never sees user A's attempts (IDOR), even with a userId query", async () => {
    const res = await getAttempts(new NextRequest(`http://x/api/v1/attempts?userId=${ua.id}`, { headers: cookie(ub) }));
    const { data } = await res.json();
    expect(data.map((d: { internalScore: number }) => d.internalScore)).toEqual([170]);
  });

  it("clamps limit to 1–50", async () => {
    const one = await (await getAttempts(new NextRequest("http://x/api/v1/attempts?limit=0", { headers: cookie(ua) }))).json();
    expect(one.data).toHaveLength(1);
    const many = await getAttempts(new NextRequest("http://x/api/v1/attempts?limit=999", { headers: cookie(ua) }));
    expect(many.status).toBe(200);
    expect((await many.json()).data).toHaveLength(2);
  });

  it("requires a session", async () => {
    const res = await getAttempts(new NextRequest("http://x/api/v1/attempts"));
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("UNAUTHORIZED");
  });
});
