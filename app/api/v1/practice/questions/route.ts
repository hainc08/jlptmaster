import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET(req: NextRequest) {
  try {
    const questions = await prisma.question.findMany({
      where: {
        status: "PUBLISHED",
        levelId: "N5",
      },
      take: 20,
      include: {
        options: {
          select: {
            id: true,
            position: true,
            textJson: true,
            // isCorrect is strictly excluded here to avoid answer leakage!
          },
          orderBy: { position: "asc" },
        },
      },
    });

    // Strip explanationVi as well before student submits
    const sanitized = questions.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      promptJson: q.promptJson,
      difficulty: q.difficulty,
      skillTag: q.skillTag,
      options: q.options,
    }));

    return NextResponse.json({ data: sanitized });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "FETCH_FAILED", message: error.message } }, { status: 500 });
  }
}
