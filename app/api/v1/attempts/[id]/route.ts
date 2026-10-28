import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import {
  ExamSnapshot,
  stripAnswerKeysFromExam,
  validateAttemptTimeliness,
} from "@/src/server/services/exam-service";
import { assertUserOwnership, OwnershipError } from "@/src/server/services/auth-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy lượt thi" } },
        { status: 404 }
      );
    }

    if (userId) {
      assertUserOwnership(userId, attempt.userId);
    }

    const snapshot = attempt.examSnapshotJson as unknown as ExamSnapshot;
    const sanitized = stripAnswerKeysFromExam(snapshot);
    const timeliness = validateAttemptTimeliness(attempt.expiresAt);

    const savedAnswers: Record<string, string> = {};
    for (const ans of attempt.answers) {
      const payload = ans.answerJson as { selectedOptionId?: string } | string;
      if (typeof payload === "string") {
        savedAnswers[ans.questionId] = payload;
      } else if (payload?.selectedOptionId) {
        savedAnswers[ans.questionId] = payload.selectedOptionId;
      }
    }

    return NextResponse.json({
      data: {
        id: attempt.id,
        examId: attempt.examId,
        title: attempt.exam.title,
        status: attempt.status,
        remainingSeconds: attempt.status === "IN_PROGRESS" ? timeliness.remainingSeconds : 0,
        expiresAt: attempt.expiresAt,
        lastSavedAt: attempt.lastSavedAt,
        questions: sanitized.questions,
        answers: savedAnswers,
      },
    });
  } catch (error: any) {
    if (error instanceof OwnershipError) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "ATTEMPT_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

