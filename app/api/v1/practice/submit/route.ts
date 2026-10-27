import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, selectedOptionId } = body;

    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "questionId và selectedOptionId là bắt buộc" } },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy câu hỏi" } },
        { status: 404 }
      );
    }

    const correctOption = question.options.find((opt) => opt.isCorrect);
    const isCorrect = selectedOptionId === correctOption?.id;

    return NextResponse.json({
      data: {
        isCorrect,
        correctOptionId: correctOption?.id || "",
        explanationVi: question.explanationVi,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "EVALUATION_FAILED", message: error.message } }, { status: 500 });
  }
}
