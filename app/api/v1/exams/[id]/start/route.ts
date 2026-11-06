import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";
import { ExamQuestionContext, ExamSnapshot, stripAnswerKeysFromExam } from "@/src/server/services/exam-service";

const SECTION_TITLE_VI: Record<string, string> = {
  VOCAB: "Phần 1: Từ vựng & Chữ Hán",
  GRAMMAR_READING: "Phần 2: Ngữ pháp & Đọc hiểu",
  LISTENING: "Phần 3: Nghe hiểu",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;
    const { userId } = requireSession(req);

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
                    contentItem: { include: { readingPassage: true, listeningTrack: true } },
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

    if (exam.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: { code: "EXAM_LOCKED", message: "Bộ đề đang bị khóa hoặc chưa mở. Vui lòng quay lại sau." } },
        { status: 423 }
      );
    }

    // Gather questions from exam sections, or fallback to published level questions if section links are empty
    let snapshotQuestions: ExamSnapshot["questions"] = exam.sections.flatMap((sec) =>
      sec.examQuestions.map((eq) => {
        const reading = eq.question.contentItem?.readingPassage;
        const listening = eq.question.contentItem?.listeningTrack;
        const context: ExamQuestionContext | undefined = reading
          ? { id: reading.id, kind: "READING", text: reading.textJa }
          : listening
          ? { id: listening.id, kind: "LISTENING", text: listening.transcriptJa }
          : undefined;
        const promptObj = eq.question.promptJson as { text?: string } | null;
        return {
          id: eq.question.id,
          prompt: promptObj?.text || String(eq.question.promptJson),
          explanationVi: eq.question.explanationVi,
          skillTag: eq.question.skillTag,
          sectionTitleVi: SECTION_TITLE_VI[sec.sectionType],
          context,
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
        where: { levelId: exam.levelId, status: "PUBLISHED", contentItemId: null },
        take: 10,
        include: { options: { orderBy: { position: "asc" } } },
      });

      snapshotQuestions = fallbackQuestions.map((q) => {
        const promptObj = q.promptJson as { text?: string } | null;
        return {
          id: q.id,
          prompt: promptObj?.text || String(q.promptJson),
          explanationVi: q.explanationVi,
          skillTag: q.skillTag,
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
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "EXAM_START_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

