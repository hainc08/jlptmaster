import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { validateAttemptTimeliness } from "@/src/server/services/exam-service";
import { assertUserOwnership, OwnershipError } from "@/src/server/services/auth-service";

const SaveAnswersSchema = z.object({
  userId: z.string().optional(),
  answers: z.record(z.string(), z.string()),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;
    const rawBody = await req.json();
    const parsed = SaveAnswersSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Dữ liệu lưu đáp án không hợp lệ" } },
        { status: 400 }
      );
    }

    const { userId, answers } = parsed.data;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
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

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: { code: "ATTEMPT_LOCKED", message: "Bài thi đã kết thúc, không thể chỉnh sửa đáp án" } },
        { status: 409 }
      );
    }

    const timeliness = validateAttemptTimeliness(attempt.expiresAt);
    if (timeliness.isExpired) {
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: { code: "EXAM_EXPIRED", message: "Đã hết thời gian làm bài" } },
        { status: 409 }
      );
    }

    const now = new Date();
    const entries = Object.entries(answers);

    await prisma.$transaction([
      ...entries.map(([questionId, selectedOptionId]) =>
        prisma.attemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId,
            },
          },
          update: {
            answerJson: { selectedOptionId },
            savedAt: now,
          },
          create: {
            attemptId: attempt.id,
            questionId,
            answerJson: { selectedOptionId },
            savedAt: now,
          },
        })
      ),
      prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { lastSavedAt: now },
      }),
    ]);

    return NextResponse.json({
      data: {
        savedAt: now.toISOString(),
        savedCount: entries.length,
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
      { error: { code: "AUTOSAVE_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

