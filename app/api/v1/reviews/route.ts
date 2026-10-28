import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { processSrsReview } from "@/src/server/services/srs-service";
import { assertUserOwnership, OwnershipError } from "@/src/server/services/auth-service";

const ReviewPostSchema = z.object({
  userId: z.string().optional(),
  cardId: z.string().min(1),
  grade: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
  idempotencyKey: z.string().min(1).max(36),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = ReviewPostSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Dữ liệu đánh giá SRS không hợp lệ", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { userId, cardId, grade, idempotencyKey } = parsed.data;

    const card = await prisma.reviewCard.findUnique({
      where: { id: cardId },
      include: {
        reviewLogs: {
          where: { idempotencyKey },
          select: { idempotencyKey: true },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy thẻ nhớ SRS" } },
        { status: 404 }
      );
    }

    if (userId) {
      assertUserOwnership(userId, card.userId);
    }

    const existingKeys = card.reviewLogs.map((l) => l.idempotencyKey);
    const result = processSrsReview(
      {
        id: card.id,
        dueAt: card.dueAt,
        intervalSeconds: card.intervalSeconds,
        repetitions: card.repetitions,
        easeFactor: Number(card.easeFactor),
      },
      grade,
      idempotencyKey,
      new Date(),
      existingKeys
    );

    if (result.isApplied) {
      await prisma.$transaction([
        prisma.reviewCard.update({
          where: { id: card.id },
          data: {
            dueAt: result.nextDueAt,
            intervalSeconds: result.intervalSeconds,
            repetitions: result.repetitions,
            easeFactor: result.easeFactor,
            lapses: grade === "AGAIN" ? { increment: 1 } : undefined,
          },
        }),
        prisma.reviewLog.create({
          data: {
            reviewCardId: card.id,
            idempotencyKey,
            grade,
            previousDueAt: card.dueAt,
            newDueAt: result.nextDueAt,
          },
        }),
      ]);
    }

    return NextResponse.json({
      data: {
        cardId: card.id,
        isApplied: result.isApplied,
        isDuplicate: result.isDuplicate,
        nextDueAt: result.nextDueAt,
        intervalSeconds: result.intervalSeconds,
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
      { error: { code: "REVIEW_SUBMIT_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

