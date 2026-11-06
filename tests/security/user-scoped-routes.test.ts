import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { GET as getLesson } from "@/app/api/v1/lessons/[id]/route";
import { POST as completeLesson } from "@/app/api/v1/lessons/[id]/complete/route";
import { GET as getDue } from "@/app/api/v1/reviews/due/route";
import { POST as postReview } from "@/app/api/v1/reviews/route";
import { GET as getOverview } from "@/app/api/v1/progress/overview/route";

describe("User-scoped routes trust only the signed session", () => {
  let student: { id: string; email: string };
  let victim: { id: string; email: string };
  let lessonId: string;
  let victimCardId: string;
  let studentCardId: string;

  const hdr = (u: { id: string; email: string }) => ({
    Cookie: `jlpt_session=${signSessionToken({ userId: u.id, email: u.email, role: "STUDENT" })}`,
  });
  const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });
  const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
    new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    victim = await prisma.user.upsert({
      where: { email: "victim@jlptmaster.vn" },
      update: {},
      create: { email: "victim@jlptmaster.vn", role: "STUDENT" },
    });
    lessonId = (await prisma.lesson.findFirstOrThrow({ orderBy: { position: "asc" } })).id;

    const items = await prisma.contentItem.findMany({ where: { levelId: "N5", status: "PUBLISHED" }, take: 2 });
    const mk = (userId: string, contentItemId: string) =>
      prisma.reviewCard.upsert({
        where: { userId_contentItemId: { userId, contentItemId } },
        update: { dueAt: new Date(Date.now() - 3600_000) },
        create: { userId, contentItemId, dueAt: new Date(Date.now() - 3600_000), intervalSeconds: 86400, easeFactor: 2.5 },
      });
    victimCardId = (await mk(victim.id, items[0].id)).id;
    studentCardId = (await mk(student.id, items[1].id)).id;
  });

  afterAll(async () => {
    await prisma.lessonProgress.deleteMany({ where: { userId: victim.id } });
  });

  describe("without a session", () => {
    it("lessons/:id/complete -> 401 even if body.userId is a real user", async () => {
      const res = await completeLesson(post("http://x/c", { userId: victim.id }), idCtx(lessonId));
      expect(res.status).toBe(401);
    });
    it("reviews/due -> 401 even with ?userId=", async () => {
      expect((await getDue(new NextRequest(`http://x/d?userId=${victim.id}`))).status).toBe(401);
    });
    it("reviews POST -> 401 even with body.userId", async () => {
      const res = await postReview(
        post("http://x/r", { userId: victim.id, cardId: victimCardId, grade: "GOOD", idempotencyKey: "k-anon-1" })
      );
      expect(res.status).toBe(401);
    });
    it("progress/overview -> 401 (no demo-user fallback)", async () => {
      expect((await getOverview(new NextRequest(`http://x/o?userId=${victim.id}`))).status).toBe(401);
    });
  });

  describe("with a session", () => {
    it("reviews/due returns only the caller's cards and ignores ?userId=", async () => {
      const res = await getDue(new NextRequest(`http://x/d?userId=${victim.id}`, { headers: hdr(student) }));
      expect(res.status).toBe(200);
      const ids = (await res.json()).data.map((c: any) => c.id);
      expect(ids).toContain(studentCardId);
      expect(ids).not.toContain(victimCardId);
    });

    it("reviews POST on someone else's card -> 403, even if body.userId claims ownership", async () => {
      const res = await postReview(
        post(
          "http://x/r",
          { userId: victim.id, cardId: victimCardId, grade: "GOOD", idempotencyKey: "k-idor-1" },
          hdr(student)
        )
      );
      expect(res.status).toBe(403);
    });

    it("reviews POST on own card works", async () => {
      const res = await postReview(
        post("http://x/r", { cardId: studentCardId, grade: "GOOD", idempotencyKey: `k-own-${Date.now()}` }, hdr(student))
      );
      expect(res.status).toBe(200);
    });

    it("lessons/:id/complete records progress for the session user, not body.userId", async () => {
      const res = await completeLesson(post("http://x/c", { userId: victim.id }, hdr(student)), idCtx(lessonId));
      expect(res.status).toBe(200);
      expect(await prisma.lessonProgress.count({ where: { userId: victim.id, lessonId } })).toBe(0);
      expect(await prisma.lessonProgress.count({ where: { userId: student.id, lessonId } })).toBe(1);
    });

    it("lessons/:id never exposes another user's progress via ?userId=", async () => {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: victim.id, lessonId } },
        update: { status: "COMPLETED", completedAt: new Date() },
        create: { userId: victim.id, lessonId, status: "COMPLETED", completedAt: new Date() },
      });
      const anon = await getLesson(new NextRequest(`http://x/l?userId=${victim.id}`), idCtx(lessonId));
      expect(anon.status).toBe(200);
      expect((await anon.json()).data.completionStatus).not.toBe("COMPLETED");
    });

    it("progress/overview reflects the caller only", async () => {
      const res = await getOverview(new NextRequest(`http://x/o?userId=${victim.id}`, { headers: hdr(student) }));
      expect(res.status).toBe(200);
    });
  });
});
