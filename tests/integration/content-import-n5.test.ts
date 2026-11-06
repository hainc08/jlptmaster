import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { POST as startExam } from "@/app/api/v1/exams/[id]/start/route";
import { importContent } from "@/prisma/import-content";

/**
 * Integration tests for the content pipeline. They run on the LOCAL MariaDB only.
 * The real N5 Đề 02 exam is only ever imported as DRAFT. Tests that need a PUBLISHED exam (start API)
 * use a throw-away COPY with prefixed keys ("tst5-") and a "TEST content" title, deleted afterwards.
 */
const LEVEL = "N5";
const SRC = path.join(process.cwd(), "prisma/content/n5/exam-02.json");
const COPY_PREFIX = "tst5-";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCopy(mutate?: (json: any) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jlpt-content-"));
  fs.mkdirSync(path.join(dir, "n5"));
  const raw = fs.readFileSync(SRC, "utf8").replace(/"n5-/g, `"${COPY_PREFIX}`);
  const json = JSON.parse(raw);
  json.exam.slug = "tst5-exam";
  json.exam.title = `TEST platform content copy N5 ${Date.now()}`;
  json.exam.status = "DRAFT"; // the PUBLISHED-guard test starts from a DRAFT exam and publishes it itself
  // keep the copy tiny (1 question per section) so the shared test DB sees very few writes
  for (const sec of json.sections) {
    sec.parts = [sec.parts[0]];
    const part = sec.parts[0];
    if (part.items) part.items = part.items.slice(0, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else part.groups = part.groups.slice(0, 1).map((g: any) => ({ ...g, items: g.items.slice(0, 1) }));
  }
  mutate?.(json);
  fs.writeFileSync(path.join(dir, "n5", "exam-02.json"), JSON.stringify(json));
  return { dir, title: json.exam.title as string };
}

async function cleanupCopies() {
  // Select ids first (plain consistent reads) and delete by primary key: a deleteMany with a JSON/LIKE predicate
  // scans and locks the whole table in InnoDB, which deadlocks with the other parallel test files.
  const examIds = (await prisma.exam.findMany({ where: { OR: [{ title: { startsWith: "TEST platform content copy N5" } }, { title: { startsWith: "TEST content copy N5" } }] }, select: { id: true } })).map((e) => e.id);
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
    prisma.question.count({ where: { promptJson: { path: "$.key", string_starts_with: "n5-" } } }),
    prisma.questionOption.count({ where: { question: { promptJson: { path: "$.key", string_starts_with: "n5-" } } } }),
    prisma.exam.count({ where: { levelId: LEVEL, NOT: { title: { startsWith: "TEST" } } } }),
    prisma.examSection.count({ where: { exam: { levelId: LEVEL, NOT: { title: { startsWith: "TEST" } } } } }),
    prisma.examQuestion.count({ where: { section: { exam: { levelId: LEVEL, NOT: { title: { startsWith: "TEST" } } } } } }),
    prisma.contentItem.count({ where: { levelId: LEVEL, slug: { startsWith: "n5-" } } }),
    prisma.readingPassage.count({ where: { contentItem: { slug: { startsWith: "n5-" } } } }),
    prisma.listeningTrack.count({ where: { contentItem: { slug: { startsWith: "n5-" } } } }),
    prisma.mediaAsset.count({ where: { storageKey: { startsWith: "tts:n5-" } } }),
  ]);
  return { q, o, e, es, eq, ci, rp, lt, ma };
}

describe("N5 content import (MariaDB, local)", () => {
  beforeAll(async () => {
    assertLocalDb();
    await cleanupCopies();
    await importContent(prisma, { levels: [LEVEL] });
  });
  afterAll(async () => {
    await cleanupCopies();
  });

  it("imports the N5 exam with the status declared in the file with 3 sections and correctly linked questions", async () => {
    const exam = await prisma.exam.findFirstOrThrow({
      where: { levelId: LEVEL, title: { contains: "Số 02" }, NOT: { title: { startsWith: "TEST" } } },
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
    expect(exam.sections.map((s) => s.examQuestions.length)).toEqual([35, 32, 24]);
    for (const s of exam.sections) {
      expect(s.examQuestions.map((e) => e.position)).toEqual(s.examQuestions.map((_, i) => i + 1));
      for (const eq of s.examQuestions) {
        const q = eq.question;
        expect(q.status).toBe("DRAFT");
        expect(q.levelId).toBe(LEVEL);
        expect(q.options).toHaveLength(4);
        expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
        const key = (q.promptJson as { key?: string }).key;
        expect(key?.startsWith("n5-")).toBe(true);
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


  it("keeps the original N5 bank and exam Số 01 intact next to Đề 02 (seed must not overwrite keyed questions)", async () => {
    const { N5_QUESTION_BANK } = await import("@/prisma/n5-questions");
    const standalone = await prisma.question.findMany({ where: { levelId: LEVEL, contentItemId: null } });
    const keyed = standalone.filter((q) => typeof (q.promptJson as { key?: string } | null)?.key === "string");
    const unkeyed = standalone.filter((q) => typeof (q.promptJson as { key?: string } | null)?.key !== "string");
    // 35 vocab + 16 grammar + 5 star-order of Đề 02, and exactly the 20 original bank questions
    expect(keyed).toHaveLength(56);
    expect(unkeyed).toHaveLength(N5_QUESTION_BANK.length);
    const texts = new Set(unkeyed.map((q) => (q.promptJson as { text: string }).text));
    for (const b of N5_QUESTION_BANK) expect(texts.has(b.prompt), b.prompt).toBe(true);
    const originals = await prisma.exam.findMany({ where: { levelId: LEVEL, NOT: [{ title: { contains: "Số 02" } }, { title: { startsWith: "TEST" } }] } });
    expect(originals).toHaveLength(1);
    expect(originals[0].status).toBe("PUBLISHED");
  });

  it("is idempotent: a second run changes nothing (no duplicates, same question ids)", async () => {
    const before = await counts();
    const idsBefore = (await prisma.question.findMany({ where: { promptJson: { path: "$.key", string_starts_with: "n5-" } }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
    const summary = await importContent(prisma, { levels: [LEVEL] });
    const after = await counts();
    const idsAfter = (await prisma.question.findMany({ where: { promptJson: { path: "$.key", string_starts_with: "n5-" } }, select: { id: true }, orderBy: { id: "asc" } })).map((q) => q.id);
    expect(after).toEqual(before);
    expect(idsAfter).toEqual(idsBefore);
    expect(before.q).toBe(91);
    expect(summary[0].created).toBe(0);
    expect(summary[0].updated).toBe(0);
  });

  it("keeps existing attempts intact when the loader runs again", async () => {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    const exam = await prisma.exam.findFirstOrThrow({ where: { levelId: LEVEL, title: { contains: "Số 02" }, NOT: { title: { startsWith: "TEST" } } } });
    const q = await prisma.question.findFirstOrThrow({ where: { promptJson: { path: "$.key", string_starts_with: "n5-" } } });
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

  it("never changes the status of an existing exam and refuses to rewrite a PUBLISHED one", async () => {
    const { dir, title } = makeCopy();
    await importContent(prisma, { contentDir: dir, levels: [LEVEL] });
    const exam = await prisma.exam.findFirstOrThrow({ where: { title } });
    expect(exam.status).toBe("DRAFT");
    await prisma.exam.update({ where: { id: exam.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });

    // same content: re-run succeeds and keeps PUBLISHED
    await importContent(prisma, { contentDir: dir, levels: [LEVEL] });
    expect((await prisma.exam.findUniqueOrThrow({ where: { id: exam.id } })).status).toBe("PUBLISHED");

    // changed content: refused
    const changed = makeCopy((j) => {
      j.exam.title = title;
      const firstPart = j.sections[0].parts[0];
      firstPart.items[0].explanationVi += " (đã sửa)";
    });
    await expect(importContent(prisma, { contentDir: changed.dir, levels: [LEVEL] })).rejects.toThrow(/PUBLISHED/);
    // explicit flag allows it
    await expect(importContent(prisma, { contentDir: changed.dir, levels: [LEVEL], allowPublishedUpdate: true })).resolves.toBeTruthy();
  });
});
