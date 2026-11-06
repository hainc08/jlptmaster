import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { ExamSnapshot, gradeExamAttempt, computeSkillBreakdown, buildWeakSkills } from "@/src/server/services/exam-service";
import { assertUserOwnership, requireSession, authErrorResponse } from "@/src/server/services/auth-service";

const LEGAL_DISCLAIMER_VI =
  "JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản (The Japan Foundation). Điểm số trên là điểm quy đổi mô phỏng nội bộ (0–180).";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy kết quả bài thi" } },
        { status: 404 }
      );
    }

    const { userId: callerId } = requireSession(req);
    assertUserOwnership(callerId, attempt.userId);

    // Strictly block answer key/result access before attempt is finalized (ADR-002)
    if (attempt.status === "IN_PROGRESS") {
      return NextResponse.json(
        {
          error: {
            code: "ATTEMPT_IN_PROGRESS",
            message: "Bài thi chưa nộp. Không thể xem đáp án và giải thích khi đang làm bài.",
          },
        },
        { status: 409 }
      );
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

    const graded = gradeExamAttempt(snapshot, userAnswers);
    const internalScore = attempt.internalScore ?? graded.mockScore180;
    const skillBreakdown = computeSkillBreakdown(snapshot, userAnswers);

    const itemReviews = snapshot.questions.map((q, idx) => {
      const itemRes = graded.itemResults[q.id];
      return {
        questionId: q.id,
        questionNumber: idx + 1,
        prompt: q.prompt,
        selectedOptionId: itemRes?.selectedOptionId || null,
        correctOptionId: itemRes?.correctOptionId || "",
        isCorrect: itemRes?.isCorrect || false,
        explanationVi: q.explanationVi,
        options: q.options,
      };
    });

    return NextResponse.json({
      data: {
        attemptId: attempt.id,
        examTitle: attempt.exam.title,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        rawCorrect: attempt.rawCorrect ?? graded.rawCorrect,
        rawTotal: attempt.rawTotal ?? graded.rawTotal,
        internalScore,
        maxScore: 180,
        statusText: internalScore >= 80 ? "ĐẠT ƯỚC TÍNH (PASS)" : "CẦN CỐ GẮNG THÊM",
        disclaimerVi: LEGAL_DISCLAIMER_VI,
        skillBreakdown,
        weakSkills: buildWeakSkills(skillBreakdown),
        itemReviews,
      },
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "RESULT_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

