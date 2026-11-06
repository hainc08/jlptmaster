import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { POST as startExam } from "@/app/api/v1/exams/[id]/start/route";
import { importContent } from "@/prisma/import-content";

/**
 * Integration tests for the content pipeline. They run on the LOCAL MariaDB only.
 * The real N4 exam is only ever imported as DRAFT. Tests that need a PUBLISHED exam (start API)
 * use a throw-away COPY with prefixed keys ("tst4-") and a "TEST content" title, deleted afterwards.
 */
const LEVEL = "N4";
const COPY_PREFIX = "tst4-";

/** The suite shares one MariaDB with other parallel test files; InnoDB may pick our statement as the deadlock victim, so retry. */
async function withDeadlockRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fn();
      const resp = r as unknown as { status?: number; clone?: () => { text: () => Promise<string> } };
      if (resp && resp.status === 500 && typeof resp.clone === "function" && attempt < 5 && /deadlock|write conflict/i.test(await resp.clone().text())) {
        await new Promise((res) => setTimeout(res, 100 * attempt));
        continue;
      }
      return r;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2034" || attempt >= 5) throw e;
      await new Promise((res) => setTimeout(res, 100 * attempt));
    }
  }
}

function assertLocalDb() {
  const url = new URL(process.env.DATABASE_URL ?? "mysql://x@nowhere/x");
  expect(["localhost", "127.0.0.1"], `DATABASE_URL host must be local, got ${url.hostname}`).toContain(url.hostname);
}

async function cleanupCopies() {
  // Select ids first (plain consistent reads) and delete by primary key: a deleteMany with a JSON/LIKE predicate
  // scans and locks the whole table in InnoDB, which deadlocks with the other parallel test files.
  const examIds = (await prisma.exam.findMany({ where: { OR: [{ title: { startsWith: "TEST platform content copy N4" } }, { title: { startsWith: "TEST content copy N4" } }] }, select: { id: true } })).map((e) => e.id);
  if (examIds.length) {
    const attemptIds = (await prisma.examAttempt.findMany({ where: { examId: { in: examIds } }, select: { id: true } })).map((a) => a.id);
    if (attemptIds.length) await withDeadlockRetry(() => prisma.examAttempt.deleteMany({ where: { id: { in: attemptIds } } }));
    await withDeadlockRetry(() => prisma.exam.deleteMany({ where: { id: { in: examIds } } }));
  }
  const questionIds = (await prisma.question.findMany({ where: { promptJson: { path: "$.key", string_starts_with: COPY_PREFIX } }, select: { id: true } })).map((q) => q.id);
  if (questionIds.length) await withDeadlockRetry(() => prisma.question.deleteMany({ where: { id: { in: questionIds } } }));
  const itemIds = (await prisma.contentItem.findMany({ where: { slug: { startsWith: COPY_PREFIX } }, select: { id: true } })).map((c) => c.id);
  if (itemIds.length) await withDeadlockRetry(() => prisma.contentItem.deleteMany({ where: { id: { in: itemIds } } }));
  const assetIds = (await prisma.mediaAsset.findMany({ where: { storageKey: { startsWith: `tts:${COPY_PREFIX}` } }, select: { id: true } })).map((m) => m.id);
  if (assetIds.length) await withDeadlockRetry(() => prisma.mediaAsset.deleteMany({ where: { id: { in: assetIds } } }));
}

async function counts() {
  const [q, o, e, es, eq, ci, rp, lt, ma] = await Promise.all([
    prisma.question.count({ where: { promptJson: { path: "$.key", string_starts_with: "n4-" } } }),
    prisma.questionOption.count({ where: { question: { promptJson: { path: "$.key", string_starts_with: "n4-" } } } }),
    prisma.exam.count({ where: { levelId: LEVEL, NOT: { title: { startsWith: "TEST" } } } }),
    prisma.examSection.count({ where: { exam: { levelId: LEVEL, NOT: { title: { startsWith: "TEST" } } } } }),
    prisma.examQuestion.count({ where: { section: { exam: { levelId: LEVEL, NOT: { title: { startsWith: "TEST" } } } } } }),
    prisma.contentItem.count({ where: { levelId: LEVEL, slug: { startsWith: "n4-" } } }),
    prisma.readingPassage.count({ where: { contentItem: { slug: { startsWith: "n4-" } } } }),
    prisma.listeningTrack.count({ where: { contentItem: { slug: { startsWith: "n4-" } } } }),
    prisma.mediaAsset.count({ where: { storageKey: { startsWith: "tts:n4-" } } }),
  ]);
  return { q, o, e, es, eq, ci, rp, lt, ma };
}

describe("N4 content import (MariaDB, local)", () => {
  beforeAll(async () => {
    assertLocalDb();
    await cleanupCopies();
    await importContent(prisma, { levels: [LEVEL] });
  });
  afterAll(async () => {
    await cleanupCopies();
  });

  it("imports the N4 exam with the status declared in the file with 3 sections and correctly linked questions", async () => {
    const exam = await prisma.exam.findFirstOrThrow({
      where: { levelId: LEVEL, title: { contains: "JLPT N4" }, NOT: { title: { startsWith: "TEST" } } },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: { examQuestions: { orderBy: { position: "asc" }, include: { question: { include: { options: true, contentItem: { include: { readingPassage: true, listeningTrack: true, } } } } } } },
        },
      },
    });
    expect(exam.status).toBe("PUBLISHED"); // declared by `exam.status` in the content file
    expect(exam.publishedAt).not.toBeNull();
    expect(exam.sections.map((s) => s.sectionType)).toEqual(["VOCAB", "GRAMMAR_READING", "LISTENING"]);
    expect(exam.sections.map((s) => s.examQuestions.length)).toEqual([30, 35, 28]);
    for (const s of exam.sections) {
      expect(s.examQuestions.map((e) => e.position)).toEqual(s.examQuestions.map((_, i) => i + 1));
      for (const eq of s.examQuestions) {
        const q = eq.question;
        expect(q.status).toBe("DRAFT");
        expect(q.levelId).toBe(LEVEL);
        expect(q.options).toHaveLength(4);
        expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
        const key = (q.promptJson as { key?: string }).key;
        expect(key?.startsWith("n4-")).toBe(true);
        if (s.sectionType === "LISTENING") {
          expect(q.contentItem?.kind).toBe("LISTENING");
          expect(q.contentItem?.listeningTrack?.transcriptJa.length, key).toBeGreaterThan(0);
          expect(q.contentItem?.listeningTrack?.transcriptVi.length, key).toBeGreaterThan(0);
        }
      }
    }
    const reading = exam.sections[1].examQuestions.filter((e) => e.question.questionType === "READING");
    expect(reading.length).toBeGreaterThan(0);
    for (const e of reading) {
      expect(e.question.contentItem?.kind).toBe("READING");
      expect(e.question.contentItem?.readingPassage?.textJa.length).toBeGreaterThan(0);
    }
  });

  it("is idempotent: a second run changes nothing (no duplicates, same question ids)", async () => {
    const before = await counts();
    const idsBefore = (await prisma.question.findMany({ where: { promptJson: { path: "$.key", string_starts_with: "n4-" } }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
    const summary = await importContent(prisma, { levels: [LEVEL] });
    const after = await counts();
    const idsAfter = (await prisma.question.findMany({ where: { promptJson: { path: "$.key", string_starts_with: "n4-" } }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
    expect(after).toEqual(before);
    expect(idsAfter).toEqual(idsBefore);
    expect(before.q).toBe(93);
    expect(summary[0].created).toBe(0);
    expect(summary[0].updated).toBe(0);
  });

  it("keeps existing attempts intact when the loader runs again", async () => {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    const exam = await prisma.exam.findFirstOrThrow({ where: { levelId: LEVEL, title: { contains: "JLPT N4" }, NOT: { title: { startsWith: "TEST" } } } });
    const q = await prisma.question.findFirstOrThrow({ where: { promptJson: { path: "$.key", string_starts_with: "n4-" } } });
    const attempt = await withDeadlockRetry(() => prisma.examAttempt.create({
      data: { examId: exam.id, examVersion: exam.version, userId: student.id, status: "IN_PROGRESS", expiresAt: new Date(Date.now() + 3600_000), examSnapshotJson: { examId: exam.id, version: exam.version, questions: [] } },
    }));
    await withDeadlockRetry(() => prisma.attemptAnswer.create({ data: { attemptId: attempt.id, questionId: q.id, answerJson: { optionId: "x" } } }));
    try {
      await importContent(prisma, { levels: [LEVEL] });
      expect(await prisma.attemptAnswer.count({ where: { attemptId: attempt.id, questionId: q.id } })).toBe(1);
      expect(await prisma.question.findUnique({ where: { id: q.id } })).not.toBeNull();
    } finally {
      await withDeadlockRetry(() => prisma.examAttempt.delete({ where: { id: attempt.id } }));
    }
  });

  it("start API returns passage/transcript context and section titles but no answers or translations", async () => {
    // Link a throw-away PUBLISHED test exam to the REAL (DRAFT) questions instead of importing a second copy of the
    // content: the real exam is never published and the shared DB sees far fewer writes.
    const real = await prisma.exam.findFirstOrThrow({
      where: { levelId: LEVEL, title: { contains: "Số 01" }, NOT: { title: { startsWith: "TEST" } } },
      include: { sections: { orderBy: { position: "asc" }, include: { examQuestions: { orderBy: { position: "asc" } } } } },
    });
    expect(real.status).toBe("PUBLISHED");
    const title = `TEST platform content copy N4 ${Date.now()}`;
    const testExam = await withDeadlockRetry(() =>
      prisma.exam.create({
        data: {
          levelId: LEVEL,
          title,
          status: "PUBLISHED",
          publishedAt: new Date(),
          version: real.version,
          sections: {
            create: real.sections.map((s) => ({
              sectionType: s.sectionType,
              position: s.position,
              durationSeconds: s.durationSeconds,
              maxInternalPoints: s.maxInternalPoints,
              examQuestions: { create: s.examQuestions.map((e) => ({ questionId: e.questionId, position: e.position, points: e.points })) },
            })),
          },
        },
      })
    );

    const student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    const token = signSessionToken({ userId: student.id, email: student.email, role: "STUDENT" });
    const res = await withDeadlockRetry(() =>
      startExam(
        new NextRequest("http://x/s", { method: "POST", headers: { "Content-Type": "application/json", Cookie: `jlpt_session=${token}` } }),
        { params: Promise.resolve({ id: testExam.id }) }
      )
    );
    expect(res.status, await res.clone().text()).toBe(201);
    const body = await res.json();
    const raw = JSON.stringify(body);
    expect(body.data.questions).toHaveLength(93);
    expect(raw).not.toContain("isCorrect");
    expect(raw).not.toContain("explanationVi");
    expect(raw).not.toContain("translatedVi");
    expect(raw).not.toContain("transcriptVi");
    const qs = body.data.questions as Array<{ context?: { kind: string; text: string }; sectionTitleVi?: string }>;
    expect(qs.filter((q) => q.context?.kind === "READING").length).toBeGreaterThan(0);
    expect(qs.filter((q) => q.context?.kind === "LISTENING").length).toBe(28);
    expect(new Set(qs.map((q) => q.sectionTitleVi)).size).toBe(3);
    for (const q of qs.filter((x) => x.context)) expect((q.context as { text: string }).text.length).toBeGreaterThan(0);

    await withDeadlockRetry(() => prisma.examAttempt.delete({ where: { id: body.data.id } }));
    await withDeadlockRetry(() => prisma.exam.delete({ where: { id: testExam.id } }));
  });
});
