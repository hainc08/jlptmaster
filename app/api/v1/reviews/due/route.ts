import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");

    if (!userId) {
      const demoStudent = await prisma.user.findUnique({
        where: { email: "minh@jlptmaster.vn" },
      });
      userId = demoStudent?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ data: [] });
    }

    const dueCards = await prisma.reviewCard.findMany({
      where: {
        userId,
        dueAt: { lte: new Date() },
      },
      include: {
        contentItem: {
          include: {
            vocabulary: true,
            kanji: true,
            grammar: true,
          },
        },
      },
      orderBy: { dueAt: "asc" },
      take: 50,
    });

    const formatted = dueCards.map((card) => {
      const vocab = card.contentItem.vocabulary;
      const kanji = card.contentItem.kanji;
      const grammar = card.contentItem.grammar;

      return {
        id: card.id,
        contentItemId: card.contentItemId,
        kind: card.contentItem.kind,
        frontText: vocab?.surface || kanji?.character || grammar?.pattern || "",
        frontReading: vocab?.reading || grammar?.formationVi || "",
        backMeaningVi: vocab?.meaningVi || kanji?.meaningVi || grammar?.meaningVi || "",
        hanViet: kanji?.hanViet || null,
        exampleJa: vocab?.exampleJa || null,
        exampleVi: vocab?.exampleVi || null,
        dueAt: card.dueAt,
        intervalSeconds: card.intervalSeconds,
        repetitions: card.repetitions,
        easeFactor: Number(card.easeFactor),
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "DUE_REVIEWS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

