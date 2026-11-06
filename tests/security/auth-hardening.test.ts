import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { GET as getAttempt } from "@/app/api/v1/attempts/[id]/route";
import { PUT as putAnswers } from "@/app/api/v1/attempts/[id]/answers/route";
import { POST as finishAttempt } from "@/app/api/v1/attempts/[id]/finish/route";
import { GET as getResult } from "@/app/api/v1/attempts/[id]/result/route";
import { POST as publishContent } from "@/app/api/v1/admin/content/[id]/publish/route";
import { GET as listAdmin, POST as createAdmin } from "@/app/api/v1/admin/content/route";
import { POST as previewCsv } from "@/app/api/v1/admin/content/import/preview/route";
import { POST as commitCsv } from "@/app/api/v1/admin/content/import/commit/route";
import { proxy } from "@/proxy";

const json = (body: unknown, cookie?: string) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: `jlpt_session=${cookie}` } : {}) },
  body: JSON.stringify(body),
});

describe("Milestone 1 hardening: no client-asserted identity", () => {
  let admin: { id: string; email: string };
  let student: { id: string; email: string };
  let victim: { id: string };
  let attemptId: string;
  let contentId: string;

  beforeAll(async () => {
    admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@jlptmaster.vn" } });
    student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    victim = await prisma.user.upsert({
      where: { email: "victim@jlptmaster.vn" },
      update: {},
      create: { email: "victim@jlptmaster.vn", role: "STUDENT" },
    });
    const exam = await prisma.exam.findFirstOrThrow({ where: { levelId: "N5", status: "PUBLISHED", NOT: { title: { startsWith: "TEST platform" } } } });
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        examVersion: "v1.0",
        userId: victim.id,
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() + 1200 * 1000),
        examSnapshotJson: { examId: exam.id, version: "v1.0", questions: [] },
      },
    });
    attemptId = attempt.id;
    contentId = (await prisma.contentItem.findFirstOrThrow({ where: { levelId: "N5" } })).id;
  });

  const ctx = () => ({ params: Promise.resolve({ id: attemptId }) });
  const base = () => `http://localhost:3000/api/v1/attempts/${attemptId}`;

  describe("attempt routes reject a client-supplied userId without a session", () => {
    it("GET attempt", async () => {
      const res = await getAttempt(new NextRequest(`${base()}?userId=${victim.id}`), ctx());
      expect(res.status).toBe(401);
    });
    it("GET result", async () => {
      const res = await getResult(new NextRequest(`${base()}/result?userId=${victim.id}`), ctx());
      expect(res.status).toBe(401);
    });
    it("PUT answers", async () => {
      const res = await putAnswers(
        new NextRequest(`${base()}/answers`, { ...json({ userId: victim.id, answers: {} }), method: "PUT" }),
        ctx()
      );
      expect(res.status).toBe(401);
    });
    it("POST finish", async () => {
      const res = await finishAttempt(new NextRequest(`${base()}/finish`, json({ userId: victim.id })), ctx());
      expect(res.status).toBe(401);
    });
    it("another user's valid session gets 403", async () => {
      const token = signSessionToken({ userId: student.id, email: student.email, role: "STUDENT" });
      const res = await getAttempt(
        new NextRequest(base(), { headers: { Cookie: `jlpt_session=${token}` } }),
        ctx()
      );
      expect(res.status).toBe(403);
    });
  });

  describe("admin routes ignore role/actorId from the body", () => {
    const adminToken = () => signSessionToken({ userId: admin.id, email: admin.email, role: "ADMIN" });
    const studentToken = () => signSessionToken({ userId: student.id, email: student.email, role: "STUDENT" });
    const pctx = () => ({ params: Promise.resolve({ id: contentId }) });

    it("publish: actorId of a real admin without session -> 401", async () => {
      const res = await publishContent(
        new NextRequest("http://localhost:3000/x", json({ actorId: admin.id, status: "PUBLISHED" })),
        pctx()
      );
      expect(res.status).toBe(401);
    });
    it("publish: student session + role ADMIN in body -> 403", async () => {
      const res = await publishContent(
        new NextRequest("http://localhost:3000/x", json({ role: "ADMIN", status: "PUBLISHED" }, studentToken())),
        pctx()
      );
      expect(res.status).toBe(403);
    });
    it("list: no session -> 401, student -> 403, admin -> 200", async () => {
      expect((await listAdmin(new NextRequest("http://localhost:3000/x"))).status).toBe(401);
      expect(
        (await listAdmin(new NextRequest("http://localhost:3000/x", { headers: { Cookie: `jlpt_session=${studentToken()}` } })))
          .status
      ).toBe(403);
      expect(
        (await listAdmin(new NextRequest("http://localhost:3000/x", { headers: { Cookie: `jlpt_session=${adminToken()}` } })))
          .status
      ).toBe(200);
    });
    it("create: role ADMIN in body without session -> 401", async () => {
      const res = await createAdmin(
        new NextRequest("http://localhost:3000/x", json({ role: "ADMIN", kind: "VOCAB", slug: "hack", meaningVi: "x" }))
      );
      expect(res.status).toBe(401);
    });
    it("preview: role ADMIN in body without session -> 401", async () => {
      const res = await previewCsv(new NextRequest("http://localhost:3000/x", json({ role: "ADMIN", rows: [] })));
      expect(res.status).toBe(401);
    });
    it("commit: actorId of a real admin without session -> 401", async () => {
      const res = await commitCsv(
        new NextRequest("http://localhost:3000/x", json({ actorId: admin.id, rows: [{}] }))
      );
      expect(res.status).toBe(401);
    });
  });

  describe("proxy verifies the signature and guards learner routes", () => {
    const req = (path: string, cookie?: string) =>
      new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { Cookie: `jlpt_session=${cookie}` } } : {});
    const location = (res: Response) => res.headers.get("location") ?? "";

    it("forged unsigned ADMIN cookie is redirected to /login", async () => {
      const forged = Buffer.from(JSON.stringify({ role: "ADMIN", exp: 9999999999 })).toString("base64url") + ".bogus";
      const res = await proxy(req("/admin", forged));
      expect(location(res)).toContain("/login");
    });
    it("student on /admin is sent to /dashboard", async () => {
      const t = signSessionToken({ userId: student.id, email: student.email, role: "STUDENT" });
      expect(location(await proxy(req("/admin", t)))).toContain("/dashboard");
    });
    it("admin on /admin passes through", async () => {
      const t = signSessionToken({ userId: admin.id, email: admin.email, role: "ADMIN" });
      expect(location(await proxy(req("/admin", t)))).toBe("");
    });
    it.each(["/dashboard", "/flashcards", "/mock-exams/abc"])("anonymous %s -> /login?redirect", async (p) => {
      const loc = location(await proxy(req(p)));
      expect(loc).toContain("/login");
      expect(loc).toContain("redirect=");
    });
  });
});
