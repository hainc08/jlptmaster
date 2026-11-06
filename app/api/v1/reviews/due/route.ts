import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireSession(req);

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
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "DUE_REVIEWS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

