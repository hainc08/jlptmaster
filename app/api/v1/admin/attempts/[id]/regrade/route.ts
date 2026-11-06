import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { ExamSnapshot, gradeExamAttempt } from "@/src/server/services/exam-service";
import { requireAdminSession, authErrorResponse } from "@/src/server/services/auth-service";

const RegradeSchema = z.object({
  // Optional manual override of the internal 0-180 score. Omit to recompute automatically.
  internalScore: z.number().int().min(0).max(180).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actorId = requireAdminSession(req).userId;
    const { id } = await params;
    const parsed = RegradeSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Điểm phải là số nguyên từ 0 đến 180" } },
        { status: 400 }
      );
    }

    const attempt = await prisma.examAttempt.findUnique({ where: { id }, include: { answers: true } });
    if (!attempt) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Không tìm thấy lượt thi" } }, { status: 404 });
    }
    if (attempt.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: { code: "ATTEMPT_IN_PROGRESS", message: "Lượt thi chưa nộp, không thể chấm lại" } },
        { status: 409 }
      );
    }

    const answers: Record<string, string> = {};
    for (const a of attempt.answers) {
      const payload = a.answerJson as { selectedOptionId?: string } | string;
      const sel = typeof payload === "string" ? payload : payload?.selectedOptionId;
      if (sel) answers[a.questionId] = sel;
    }
    const graded = gradeExamAttempt(attempt.examSnapshotJson as unknown as ExamSnapshot, answers);
    const internalScore = parsed.data.internalScore ?? graded.mockScore180;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.examAttempt.update({
        where: { id },
        data: { rawCorrect: graded.rawCorrect, rawTotal: graded.rawTotal, internalScore },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "ATTEMPT_REGRADED",
          entityType: "ExamAttempt",
          entityId: id,
          metadataJsonRedacted: {
            previousScore: attempt.internalScore,
            newScore: internalScore,
            manualOverride: parsed.data.internalScore !== undefined,
            reason: parsed.data.reason ?? null,
          },
        },
      });
      return res;
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        rawCorrect: updated.rawCorrect,
        rawTotal: updated.rawTotal,
        internalScore: updated.internalScore,
      },
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: { code: "REGRADE_FAILED", message: error.message } }, { status: 500 });
  }
}
