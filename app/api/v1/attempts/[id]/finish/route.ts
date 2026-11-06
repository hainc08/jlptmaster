import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ExamSnapshot, gradeExamAttempt } from "@/src/server/services/exam-service";
import { assertUserOwnership, requireSession, authErrorResponse } from "@/src/server/services/auth-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const body = await req.json().catch(() => ({}));

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy lượt thi" } },
        { status: 404 }
      );
    }

    const { userId: callerId } = requireSession(req);
    assertUserOwnership(callerId, attempt.userId);

    // Idempotent return if already finalized
    if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") {
      return NextResponse.json({
        data: {
          attemptId: attempt.id,
          status: attempt.status,
          rawCorrect: attempt.rawCorrect ?? 0,
          rawTotal: attempt.rawTotal ?? 0,
          internalScore: attempt.internalScore ?? 0,
        },
      });
    }

    const snapshot = attempt.examSnapshotJson as unknown as ExamSnapshot;
    const userAnswers: Record<string, string> = {};

    for (const ans of attempt.answers) {
      const payload = ans.answerJson as { selectedOptionId?: string } | string;
      if (typeof payload === "string") {
        userAnswers[ans.questionId] = payload;
      } else if (payload?.selectedOptionId) {
        userAnswers[ans.questionId] = payload.selectedOptionId;
      }
    }

    // Merge optional final answers passed in finish body
    if (body.answers && typeof body.answers === "object") {
      for (const [qId, optId] of Object.entries(body.answers)) {
        if (typeof optId === "string") {
          userAnswers[qId] = optId;
        }
      }
    }

    const graded = gradeExamAttempt(snapshot, userAnswers);
    const now = new Date();

    await prisma.$transaction([
      ...Object.entries(graded.itemResults).map(([questionId, item]) =>
        prisma.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId,
            },
          },
          update: {
            answerJson: { selectedOptionId: item.selectedOptionId },
            isCorrect: item.isCorrect,
            savedAt: now,
          },
          create: {
            attemptId: attempt.id,
            questionId,
            answerJson: { selectedOptionId: item.selectedOptionId },
            isCorrect: item.isCorrect,
            savedAt: now,
          },
        })
      ),
      prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          submittedAt: now,
          rawCorrect: graded.rawCorrect,
          rawTotal: graded.rawTotal,
          internalScore: graded.mockScore180,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        attemptId: attempt.id,
        status: "SUBMITTED",
        rawCorrect: graded.rawCorrect,
        rawTotal: graded.rawTotal,
        internalScore: graded.mockScore180,
      },
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "FINISH_EXAM_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

