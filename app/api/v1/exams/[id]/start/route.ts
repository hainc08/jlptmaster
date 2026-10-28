import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ExamSnapshot, stripAnswerKeysFromExam } from "@/src/server/services/exam-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const body = await req.json().catch(() => ({}));
    let userId: string | undefined = body.userId;

    if (!userId) {
      const demoStudent = await prisma.user.findUnique({
        where: { email: "minh@jlptmaster.vn" },
      });
      userId = demoStudent?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Không xác định được thí sinh" } },
        { status: 401 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            examQuestions: {
              orderBy: { position: "asc" },
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { position: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy đề thi thử" } },
        { status: 404 }
      );
    }

    // Gather questions from exam sections, or fallback to published level questions if section links are empty
    let snapshotQuestions = exam.sections.flatMap((sec) =>
      sec.examQuestions.map((eq) => {
        const promptObj = eq.question.promptJson as { text?: string } | null;
        return {
          id: eq.question.id,
          prompt: promptObj?.text || String(eq.question.promptJson),
          explanationVi: eq.question.explanationVi,
          options: eq.question.options.map((opt) => {
            const optObj = opt.textJson as { text?: string } | null;
            return {
              id: opt.id,
              text: optObj?.text || String(opt.textJson),
              isCorrect: opt.isCorrect,
            };
          }),
        };
      })
    );

    if (snapshotQuestions.length === 0) {
      const fallbackQuestions = await prisma.question.findMany({
        where: { levelId: exam.levelId, status: "PUBLISHED" },
        take: 10,
        include: { options: { orderBy: { position: "asc" } } },
      });

      snapshotQuestions = fallbackQuestions.map((q) => {
        const promptObj = q.promptJson as { text?: string } | null;
        return {
          id: q.id,
          prompt: promptObj?.text || String(q.promptJson),
          explanationVi: q.explanationVi,
          options: q.options.map((opt) => {
            const optObj = opt.textJson as { text?: string } | null;
            return {
              id: opt.id,
              text: optObj?.text || String(opt.textJson),
              isCorrect: opt.isCorrect,
            };
          }),
        };
      });
    }

    const totalDurationSeconds =
      exam.sections.reduce((acc, s) => acc + s.durationSeconds, 0) || 1200;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + totalDurationSeconds * 1000);

    const snapshot: ExamSnapshot = {
      examId: exam.id,
      version: exam.version,
      questions: snapshotQuestions,
    };

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        examVersion: exam.version,
        userId,
        status: "IN_PROGRESS",
        startedAt: now,
        lastSavedAt: now,
        expiresAt,
        examSnapshotJson: snapshot as any,
      },
    });

    const sanitized = stripAnswerKeysFromExam(snapshot);

    return NextResponse.json(
      {
        data: {
          id: attempt.id,
          examId: exam.id,
          title: exam.title,
          status: attempt.status,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          remainingSeconds: totalDurationSeconds,
          questions: sanitized.questions,
          answers: {},
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "EXAM_START_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

