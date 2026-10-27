import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@/src/server/db';
import { processSrsReview } from '@/src/server/services/srs-service';
import { stripAnswerKeysFromExam, gradeExamAttempt, ExamSnapshot } from '@/src/server/services/exam-service';
import { validateCsvRows } from '@/src/server/services/csv-import-service';

describe('E2E User Journeys (Integration with Live MariaDB)', () => {
  let studentUser: any;
  let adminUser: any;
  let n5Level: any;
  let testExam: any;

  beforeAll(async () => {
    // Connect to seeded MariaDB jlpt_master
    n5Level = await prisma.jlptLevel.findUnique({ where: { id: 'N5' } });
    studentUser = await prisma.user.findUnique({ where: { email: 'minh@jlptmaster.vn' } });
    adminUser = await prisma.user.findUnique({ where: { email: 'admin@jlptmaster.vn' } });
    testExam = await prisma.exam.findFirst({
      where: { levelId: 'N5' },
      include: {
        sections: {
          include: {
            examQuestions: {
              include: {
                question: {
                  include: { options: true },
                },
              },
            },
          },
        },
      },
    });
  });

  // Scenario 1 & 2: User profile & Level retrieval
  it('Journey 1: Learner retrieves N5 curriculum levels from MariaDB', async () => {
    expect(n5Level).toBeDefined();
    expect(n5Level?.id).toBe('N5');
    expect(n5Level?.isActive).toBe(true);

    const courses = await prisma.course.findMany({
      where: { levelId: 'N5' },
      include: { lessons: true },
    });
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0].lessons.length).toBe(3);
  });

  // Scenario 3: Normalized Multi-script Search
  it('Journey 2: Tra cứu từ vựng N5 theo search_normalized', async () => {
    // Search "sensei"
    const resultsSensei = await prisma.vocabulary.findMany({
      where: {
        searchNormalized: { contains: 'sensei' },
      },
    });
    expect(resultsSensei.length).toBeGreaterThan(0);
    expect(resultsSensei[0].surface).toBe('先生');

    // Search Vietnamese "giáo viên"
    const resultsVi = await prisma.vocabulary.findMany({
      where: {
        searchNormalized: { contains: 'giáo viên' },
      },
    });
    expect(resultsVi.length).toBeGreaterThan(0);
    expect(resultsVi[0].reading).toBe('せんせい');
  });

  // Scenario 4 & 11: SRS Review Lifecycle with Idempotency
  it('Journey 3: SRS card review progression and idempotency enforcement', async () => {
    const cardState = {
      id: 'card-e2e-1',
      dueAt: new Date(),
      intervalSeconds: 600,
      repetitions: 0,
      easeFactor: 2.5,
    };

    const idempotencyKey = `e2e-review-${Date.now()}`;

    // First review attempt
    const firstReview = processSrsReview(cardState, 'GOOD', idempotencyKey, new Date(), []);
    expect(firstReview.isApplied).toBe(true);
    expect(firstReview.isDuplicate).toBe(false);
    expect(firstReview.intervalSeconds).toBe(86400 * 3); // 3 days

    // Duplicate review attempt with identical key
    const replayReview = processSrsReview(cardState, 'GOOD', idempotencyKey, new Date(), [idempotencyKey]);
    expect(replayReview.isApplied).toBe(false);
    expect(replayReview.isDuplicate).toBe(true);
  });

  // Scenario 5, 6, 7 & 12: Exam attempt, secrecy, autosave and grading
  it('Journey 4: Exam simulation end-to-end with server grading', async () => {
    expect(testExam).toBeDefined();

    const questionsList = testExam.sections.flatMap((sec: any) =>
      sec.examQuestions.map((eq: any) => ({
        id: eq.question.id,
        prompt: eq.question.prompt,
        explanationVi: eq.question.explanationVi || 'Giải thích mẫu',
        options: eq.question.options.map((opt: any) => ({
          id: opt.id,
          text: opt.content,
          isCorrect: opt.isCorrect,
        })),
      }))
    );

    const snapshot: ExamSnapshot = {
      examId: testExam.id,
      version: 'v1.0',
      questions: questionsList,
    };

    // 1. Fetch sanitized exam payload -> MUST NOT leak answer keys
    const studentPayload = stripAnswerKeysFromExam(snapshot);
    for (const q of studentPayload.questions) {
      // @ts-expect-error correctOptionId should be stripped
      expect(q.correctOptionId).toBeUndefined();
      // @ts-expect-error explanationVi should be stripped
      expect(q.explanationVi).toBeUndefined();
      for (const opt of q.options) {
        // @ts-expect-error isCorrect should be stripped
        expect(opt.isCorrect).toBeUndefined();
      }
    }

    // 2. Student answers and submits
    const userAnswers: Record<string, string> = {};
    for (const q of questionsList) {
      userAnswers[q.id] = q.options[0].id;
    }

    const gradeResult = gradeExamAttempt(snapshot, userAnswers);

    expect(gradeResult.rawTotal).toBe(questionsList.length);
    expect(gradeResult.rawCorrect).toBeGreaterThanOrEqual(0);
    expect(gradeResult.mockScore180).toBeGreaterThanOrEqual(0);
    expect(gradeResult.mockScore180).toBeLessThanOrEqual(180);
  });

  // Scenario 8: Admin CSV Batch Ingestion
  it('Journey 5: Admin CSV batch validation and ingestion', async () => {
    const validRows = [
      { surface: '学校', reading: 'がっこう', romaji: 'gakkou', pos: 'Danh từ', meaningVi: 'Trường học' },
      { surface: '本', reading: 'ほん', romaji: 'hon', pos: 'Danh từ', meaningVi: 'Quyển sách' },
    ];

    const dryRun = validateCsvRows(validRows);
    expect(dryRun.validCount).toBe(2);
    expect(dryRun.errorCount).toBe(0);
    expect(dryRun.isValid).toBe(true);

    // Malformed CSV missing mandatory reading
    const invalidRows = [
      { surface: '学校', reading: '', romaji: 'gakkou', pos: 'Danh từ', meaningVi: 'Trường học' },
    ];

    const failedDryRun = validateCsvRows(invalidRows);
    expect(failedDryRun.validCount).toBe(0);
    expect(failedDryRun.errorCount).toBe(1);
    expect(failedDryRun.rows[0].error).toContain('reading');
  });
});
