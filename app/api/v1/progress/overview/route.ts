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

    const [
      totalLessonsCount,
      completedLessonsCount,
      dueReviewsCount,
      totalReviewsCount,
      recentAttempts,
    ] = await Promise.all([
      prisma.lesson.count({ where: { status: "PUBLISHED" } }),
      userId
        ? prisma.lessonProgress.count({
            where: { userId, status: "COMPLETED" },
          })
        : Promise.resolve(0),
      userId
        ? prisma.reviewCard.count({
            where: { userId, dueAt: { lte: new Date() } },
          })
        : Promise.resolve(0),
      userId
        ? prisma.reviewCard.count({
            where: { userId },
          })
        : Promise.resolve(0),
      userId
        ? prisma.examAttempt.findMany({
            where: { userId, status: "SUBMITTED" },
            orderBy: { submittedAt: "desc" },
            take: 5,
            include: { exam: { select: { title: true } } },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      data: {
        totalLessonsCount,
        completedLessonsCount,
        dueReviewsCount,
        totalReviewsCount,
        latestScore: recentAttempts[0]?.internalScore ?? null,
        recentAttempts: recentAttempts.map((a) => ({
          id: a.id,
          examTitle: a.exam.title,
          internalScore: a.internalScore,
          submittedAt: a.submittedAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "PROGRESS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

