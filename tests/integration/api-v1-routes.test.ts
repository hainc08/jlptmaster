import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";

import { GET as getCourses } from "@/app/api/v1/courses/route";
import { GET as getLessonById } from "@/app/api/v1/lessons/[id]/route";
import { POST as completeLesson } from "@/app/api/v1/lessons/[id]/complete/route";
import { GET as getKanji } from "@/app/api/v1/kanji/route";
import { GET as getGrammar } from "@/app/api/v1/grammar/route";
import { GET as getDueReviews } from "@/app/api/v1/reviews/due/route";
import { POST as postReview } from "@/app/api/v1/reviews/route";
import { GET as getExams } from "@/app/api/v1/exams/route";
import { POST as startExam } from "@/app/api/v1/exams/[id]/start/route";
import { GET as getAttempt } from "@/app/api/v1/attempts/[id]/route";
import { PUT as saveAttemptAnswers } from "@/app/api/v1/attempts/[id]/answers/route";
import { POST as finishAttempt } from "@/app/api/v1/attempts/[id]/finish/route";
import { GET as getAttemptResult } from "@/app/api/v1/attempts/[id]/result/route";
import { GET as getProgressOverview } from "@/app/api/v1/progress/overview/route";
import { GET as getAdminContent, POST as createAdminContent } from "@/app/api/v1/admin/content/route";
import { POST as publishAdminContent } from "@/app/api/v1/admin/content/[id]/publish/route";
import { POST as previewCsvImport } from "@/app/api/v1/admin/content/import/preview/route";
import { POST as commitCsvImport } from "@/app/api/v1/admin/content/import/commit/route";

describe("API v1 Route Handlers Integration Suite (MariaDB)", () => {
  let studentUser: { id: string; email: string };
  let adminUser: { id: string; email: string };
  let lessonId: string;
  let examId: string;

  beforeAll(async () => {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@jlptmaster.vn" } });
    studentUser = { id: student.id, email: student.email };
    adminUser = { id: admin.id, email: admin.email };

    const firstLesson = await prisma.lesson.findFirstOrThrow({ orderBy: { position: "asc" } });
    lessonId = firstLesson.id;

    const firstExam = await prisma.exam.findFirstOrThrow({ where: { levelId: "N5" } });
    examId = firstExam.id;
  });

  it("GET /api/v1/courses returns published N5 courses with ordered lessons", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/courses?level=N5");
    const res = await getCourses(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].lessons.length).toBeGreaterThanOrEqual(3);
  });

  it("GET /api/v1/lessons/:id & POST /api/v1/lessons/:id/complete work idempotently", async () => {
    const getReq = new NextRequest(`http://localhost:3000/api/v1/lessons/${lessonId}?userId=${studentUser.id}`);
    const getRes = await getLessonById(getReq, { params: Promise.resolve({ id: lessonId }) });
    expect(getRes.status).toBe(200);
    const lessonBody = await getRes.json();
    expect(lessonBody.data.id).toBe(lessonId);

    const postReq1 = new NextRequest(`http://localhost:3000/api/v1/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ userId: studentUser.id }),
    });
    const postRes1 = await completeLesson(postReq1, { params: Promise.resolve({ id: lessonId }) });
    expect(postRes1.status).toBe(200);

    // Second call must be idempotent
    const postReq2 = new NextRequest(`http://localhost:3000/api/v1/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ userId: studentUser.id }),
    });
    const postRes2 = await completeLesson(postReq2, { params: Promise.resolve({ id: lessonId }) });
    expect(postRes2.status).toBe(200);
    const completeBody = await postRes2.json();
    expect(completeBody.data.status).toBe("COMPLETED");
  });

  it("GET /api/v1/kanji & GET /api/v1/grammar return published N5 items", async () => {
    const kanjiReq = new NextRequest("http://localhost:3000/api/v1/kanji?level=N5");
    const kanjiRes = await getKanji(kanjiReq);
    expect(kanjiRes.status).toBe(200);
    const kanjiBody = await kanjiRes.json();
    expect(kanjiBody.data.length).toBeGreaterThanOrEqual(5);

    const grammarReq = new NextRequest("http://localhost:3000/api/v1/grammar?level=N5&q=です");
    const grammarRes = await getGrammar(grammarReq);
    expect(grammarRes.status).toBe(200);
    const grammarBody = await grammarRes.json();
    expect(grammarBody.data.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/reviews/due & POST /api/v1/reviews enforce idempotency in MariaDB", async () => {
    const dueReq = new NextRequest(`http://localhost:3000/api/v1/reviews/due?userId=${studentUser.id}`);
    const dueRes = await getDueReviews(dueReq);
    expect(dueRes.status).toBe(200);
    const dueBody = await dueRes.json();
    expect(Array.isArray(dueBody.data)).toBe(true);
    expect(dueBody.data.length).toBeGreaterThan(0);

    const cardId = dueBody.data[0].id;
    const idemKey = `test-idem-${Date.now()}`;

    const revReq1 = new NextRequest("http://localhost:3000/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify({
        userId: studentUser.id,
        cardId,
        grade: "GOOD",
        idempotencyKey: idemKey,
      }),
    });
    const revRes1 = await postReview(revReq1);
    expect(revRes1.status).toBe(200);
    const revBody1 = await revRes1.json();
    expect(revBody1.data.isDuplicate).toBe(false);

    // Duplicate submission with same idempotencyKey
    const revReq2 = new NextRequest("http://localhost:3000/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify({
        userId: studentUser.id,
        cardId,
        grade: "GOOD",
        idempotencyKey: idemKey,
      }),
    });
    const revRes2 = await postReview(revReq2);
    expect(revRes2.status).toBe(200);
    const revBody2 = await revRes2.json();
    expect(revBody2.data.isDuplicate).toBe(true);
  });

  it("Mock Exam lifecycle: list -> start -> autosave -> block premature result -> finish -> result", async () => {
    // 1. List exams
    const listReq = new NextRequest("http://localhost:3000/api/v1/exams?level=N5");
    const listRes = await getExams(listReq);
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data.length).toBeGreaterThan(0);

    // 2. Start exam attempt
    const startReq = new NextRequest(`http://localhost:3000/api/v1/exams/${examId}/start`, {
      method: "POST",
      body: JSON.stringify({ userId: studentUser.id }),
    });
    const startRes = await startExam(startReq, { params: Promise.resolve({ id: examId }) });
    expect(startRes.status).toBe(201);
    const startBody = await startRes.json();
    const attemptId = startBody.data.id;
    expect(attemptId).toBeDefined();
    expect(startBody.data.questions.length).toBeGreaterThan(0);

    // Verify no answer keys leaked in start response
    const firstQ = startBody.data.questions[0];
    expect(firstQ.explanationVi).toBeUndefined();
    expect(firstQ.options[0].isCorrect).toBeUndefined();

    // 3. Premature result access must be blocked while IN_PROGRESS
    const earlyResReq = new NextRequest(
      `http://localhost:3000/api/v1/attempts/${attemptId}/result?userId=${studentUser.id}`
    );
    const earlyRes = await getAttemptResult(earlyResReq, { params: Promise.resolve({ id: attemptId }) });
    expect(earlyRes.status).toBe(409);

    // 4. Autosave answers
    const answersPayload: Record<string, string> = {
      [firstQ.id]: firstQ.options[0].id,
    };
    const saveReq = new NextRequest(`http://localhost:3000/api/v1/attempts/${attemptId}/answers`, {
      method: "PUT",
      body: JSON.stringify({ userId: studentUser.id, answers: answersPayload }),
    });
    const saveRes = await saveAttemptAnswers(saveReq, { params: Promise.resolve({ id: attemptId }) });
    expect(saveRes.status).toBe(200);

    // 5. Resume attempt & check saved answers
    const resumeReq = new NextRequest(
      `http://localhost:3000/api/v1/attempts/${attemptId}?userId=${studentUser.id}`
    );
    const resumeRes = await getAttempt(resumeReq, { params: Promise.resolve({ id: attemptId }) });
    expect(resumeRes.status).toBe(200);
    const resumeBody = await resumeRes.json();
    expect(resumeBody.data.answers[firstQ.id]).toBe(firstQ.options[0].id);

    // 6. Finish attempt (idempotent transactional grading)
    const finReq = new NextRequest(`http://localhost:3000/api/v1/attempts/${attemptId}/finish`, {
      method: "POST",
      body: JSON.stringify({ userId: studentUser.id }),
    });
    const finRes = await finishAttempt(finReq, { params: Promise.resolve({ id: attemptId }) });
    expect(finRes.status).toBe(200);
    const finBody = await finRes.json();
    expect(finBody.data.status).toBe("SUBMITTED");
    expect(typeof finBody.data.internalScore).toBe("number");

    // 7. Fetch result after finalization
    const resultReq = new NextRequest(
      `http://localhost:3000/api/v1/attempts/${attemptId}/result?userId=${studentUser.id}`
    );
    const resultRes = await getAttemptResult(resultReq, { params: Promise.resolve({ id: attemptId }) });
    expect(resultRes.status).toBe(200);
    const resultBody = await resultRes.json();
    expect(resultBody.data.disclaimerVi).toContain("JEES");
    expect(resultBody.data.itemReviews.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/progress/overview returns genuine database counts", async () => {
    const req = new NextRequest(`http://localhost:3000/api/v1/progress/overview?userId=${studentUser.id}`);
    const res = await getProgressOverview(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.completedLessonsCount).toBeGreaterThanOrEqual(1);
    expect(typeof body.data.dueReviewsCount).toBe("number");
  });

  it("Admin CMS & CSV import preview/commit enforce RBAC and atomic persistence", async () => {
    // 1. Student blocked from publishing content
    const listReq = new NextRequest("http://localhost:3000/api/v1/admin/content");
    const listRes = await getAdminContent(listReq);
    expect(listRes.status).toBe(200);

    // 2. Create draft content as ADMIN
    const createReq = new NextRequest("http://localhost:3000/api/v1/admin/content", {
      method: "POST",
      body: JSON.stringify({
        actorId: adminUser.id,
        role: "ADMIN",
        levelId: "N5",
        kind: "VOCAB",
        slug: `vocab-admin-test-${Date.now()}`,
        surface: "図書館",
        reading: "としょかん",
        meaningVi: "Thư viện",
        pos: "Danh từ",
      }),
    });
    const createRes = await createAdminContent(createReq);
    expect(createRes.status).toBe(201);
    const createdBody = await createRes.json();
    const contentId = createdBody.data.id;

    // 3. Student attempt to publish -> 403
    const forbiddenPubReq = new NextRequest(
      `http://localhost:3000/api/v1/admin/content/${contentId}/publish`,
      {
        method: "POST",
        body: JSON.stringify({ actorId: studentUser.id, role: "STUDENT", status: "PUBLISHED" }),
      }
    );
    const forbiddenPubRes = await publishAdminContent(forbiddenPubReq, {
      params: Promise.resolve({ id: contentId }),
    });
    expect(forbiddenPubRes.status).toBe(403);

    // 4. Admin publishes -> 200
    const adminPubReq = new NextRequest(
      `http://localhost:3000/api/v1/admin/content/${contentId}/publish`,
      {
        method: "POST",
        body: JSON.stringify({ actorId: adminUser.id, role: "ADMIN", status: "PUBLISHED" }),
      }
    );
    const adminPubRes = await publishAdminContent(adminPubReq, {
      params: Promise.resolve({ id: contentId }),
    });
    expect(adminPubRes.status).toBe(200);

    // 5. CSV Import Preview & Commit
    const csvRows = [
      {
        surface: "電車",
        reading: "でんしゃ",
        romaji: `densha-${Date.now()}`,
        pos: "Danh từ",
        meaningVi: "Tàu điện",
      },
    ];
    const previewReq = new NextRequest("http://localhost:3000/api/v1/admin/content/import/preview", {
      method: "POST",
      body: JSON.stringify({ role: "ADMIN", rows: csvRows }),
    });
    const previewRes = await previewCsvImport(previewReq);
    expect(previewRes.status).toBe(200);
    const previewBody = await previewRes.json();
    expect(previewBody.data.validCount).toBe(1);

    const commitReq = new NextRequest("http://localhost:3000/api/v1/admin/content/import/commit", {
      method: "POST",
      body: JSON.stringify({ actorId: adminUser.id, role: "ADMIN", rows: csvRows }),
    });
    const commitRes = await commitCsvImport(commitReq);
    expect(commitRes.status).toBe(200);
    const commitBody = await commitRes.json();
    expect(commitBody.data.insertedCount).toBe(1);
  });
});

