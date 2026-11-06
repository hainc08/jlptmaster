import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { GET as listPublicExams } from "@/app/api/v1/exams/route";
import { POST as startExam } from "@/app/api/v1/exams/[id]/start/route";
import { PUT as saveAnswers } from "@/app/api/v1/attempts/[id]/answers/route";
import { POST as finishAttempt } from "@/app/api/v1/attempts/[id]/finish/route";
import { GET as getResult } from "@/app/api/v1/attempts/[id]/result/route";
import { GET as adminListExams } from "@/app/api/v1/admin/exams/route";
import { POST as adminLock } from "@/app/api/v1/admin/exams/[id]/lock/route";
import { GET as adminAttempts } from "@/app/api/v1/admin/exams/[id]/attempts/route";
import { POST as adminRegrade } from "@/app/api/v1/admin/attempts/[id]/regrade/route";
import { GET as getSkills } from "@/app/api/v1/progress/skills/route";

describe("Exam platform: lock/unlock, admin grading, skill analysis", () => {
  let admin: { id: string; email: string };
  let student: { id: string; email: string };
  let examId: string;

  const cookie = (u: { id: string; email: string }, role: "ADMIN" | "STUDENT") => ({
    Cookie: `jlpt_session=${signSessionToken({ userId: u.id, email: u.email, role })}`,
  });
  const A = () => cookie(admin, "ADMIN");
  const S = () => cookie(student, "STUDENT");
  const post = (url: string, headers: Record<string, string>, body: unknown = {}) =>
    new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

  beforeAll(async () => {
    admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@jlptmaster.vn" } });
    student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    const exam = await prisma.exam.create({
      data: { levelId: "N5", title: `TEST platform ${Date.now()}`, status: "PUBLISHED", publishedAt: new Date() },
    });
    examId = exam.id;
  });

  afterAll(async () => {
    const attempts = await prisma.examAttempt.findMany({ where: { examId }, select: { id: true } });
    await prisma.attemptAnswer.deleteMany({ where: { attemptId: { in: attempts.map((a) => a.id) } } });
    await prisma.examAttempt.deleteMany({ where: { examId } });
    await prisma.exam.delete({ where: { id: examId } });
  });

  it("start requires a session (no demo-user fallback)", async () => {
    const res = await startExam(post(`http://x/api/v1/exams/${examId}/start`, {}, { userId: student.id }), idCtx(examId));
    expect(res.status).toBe(401);
  });

  it("only ADMIN can lock; locked exam is hidden and cannot be started", async () => {
    const lockUrl = `http://x/api/v1/admin/exams/${examId}/lock`;
    expect((await adminLock(post(lockUrl, S(), { locked: true }), idCtx(examId))).status).toBe(403);
    expect((await adminLock(post(lockUrl, {}, { locked: true }), idCtx(examId))).status).toBe(401);

    const locked = await adminLock(post(lockUrl, A(), { locked: true }), idCtx(examId));
    expect(locked.status).toBe(200);
    expect((await prisma.exam.findUniqueOrThrow({ where: { id: examId } })).status).toBe("ARCHIVED");
    expect(await prisma.auditLog.count({ where: { entityId: examId, action: "EXAM_LOCKED" } })).toBeGreaterThan(0);

    const pub = await (await listPublicExams(new NextRequest("http://x/api/v1/exams?level=N5"))).json();
    expect(pub.data.find((e: any) => e.id === examId)).toBeUndefined();

    const start = await startExam(post(`http://x/api/v1/exams/${examId}/start`, S()), idCtx(examId));
    expect(start.status).toBe(423);
    expect((await start.json()).error.code).toBe("EXAM_LOCKED");
  });

  it("admin list shows every status; students are refused", async () => {
    expect((await adminListExams(new NextRequest("http://x/a", { headers: S() }))).status).toBe(403);
    const res = await adminListExams(new NextRequest("http://x/a", { headers: A() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const mine = body.data.find((e: any) => e.id === examId);
    expect(mine.status).toBe("ARCHIVED");
    expect(typeof mine.attemptCount).toBe("number");
  });

  it("unlock reopens; full flow yields real skill breakdown; admin can regrade", async () => {
    await adminLock(post("http://x/l", A(), { locked: false }), idCtx(examId));
    expect((await prisma.exam.findUniqueOrThrow({ where: { id: examId } })).status).toBe("PUBLISHED");

    const start = await startExam(post("http://x/s", S()), idCtx(examId));
    expect(start.status).toBe(201);
    const started = (await start.json()).data;
    const attemptId: string = started.id;

    const answers: Record<string, string> = {};
    for (const q of started.questions) answers[q.id] = q.options[0].id;
    const save = await saveAnswers(
      new NextRequest("http://x/a", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...S() },
        body: JSON.stringify({ answers }),
      }),
      idCtx(attemptId)
    );
    expect(save.status).toBe(200);
    expect((await finishAttempt(post("http://x/f", S()), idCtx(attemptId))).status).toBe(200);

    const result = (await (await getResult(new NextRequest("http://x/r", { headers: S() }), idCtx(attemptId))).json()).data;
    expect(Array.isArray(result.skillBreakdown)).toBe(true);
    expect(result.skillBreakdown.length).toBeGreaterThan(0);
    const totalFromSkills = result.skillBreakdown.reduce((n: number, r: any) => n + r.total, 0);
    expect(totalFromSkills).toBe(result.rawTotal);
    for (const w of result.weakSkills) expect(w.percent).toBeLessThan(70);

    const list = await adminAttempts(new NextRequest("http://x/l", { headers: A() }), idCtx(examId));
    expect(list.status).toBe(200);
    expect((await list.json()).data.some((a: any) => a.id === attemptId)).toBe(true);

    expect((await adminRegrade(post("http://x/rg", S(), {}), idCtx(attemptId))).status).toBe(403);
    expect((await adminRegrade(post("http://x/rg", A(), { internalScore: 999 }), idCtx(attemptId))).status).toBe(400);
    const rg = await adminRegrade(
      post("http://x/rg", A(), { internalScore: 150, reason: "chấm lại thủ công" }),
      idCtx(attemptId)
    );
    expect(rg.status).toBe(200);
    expect((await prisma.examAttempt.findUniqueOrThrow({ where: { id: attemptId } })).internalScore).toBe(150);
    expect(await prisma.auditLog.count({ where: { entityId: attemptId, action: "ATTEMPT_REGRADED" } })).toBeGreaterThan(0);

    expect((await getSkills(new NextRequest("http://x/sk"))).status).toBe(401);
    const sk = await getSkills(new NextRequest("http://x/sk", { headers: S() }));
    expect(sk.status).toBe(200);
    const skBody = (await sk.json()).data;
    expect(Array.isArray(skBody.skills)).toBe(true);
    expect(Array.isArray(skBody.roadmap)).toBe(true);
    expect(skBody.attemptsAnalyzed).toBeGreaterThan(0);
  });
});
