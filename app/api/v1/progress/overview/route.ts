import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";
import { DEFAULT_TZ, getActivitySummary } from "@/src/server/services/study-activity-service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireSession(req);

    const [
      totalLessonsCount,
      completedLessonsCount,
      dueReviewsCount,
      totalReviewsCount,
      recentAttempts,
      vocabCount,
      kanjiCount,
      grammarCount,
      nextLesson,
      profile,
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
      prisma.vocabulary.count(),
      prisma.kanji.count(),
      prisma.grammar.count(),
      prisma.lesson.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { position: "asc" },
        select: { id: true, slug: true, titleVi: true },
      }),
      prisma.userProfile.findUnique({ where: { userId }, select: { timezone: true, dailyGoalMinutes: true } }),
    ]);
    const activity = await getActivitySummary(
      userId,
      new Date(),
      profile?.timezone || DEFAULT_TZ,
      profile?.dailyGoalMinutes ?? 30
    );

    return NextResponse.json({
      data: {
        totalLessonsCount,
        completedLessonsCount,
        dueReviewsCount,
        totalReviewsCount,
        vocabCount,
        kanjiCount,
        grammarCount,
        activity,
        nextLesson,
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
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "PROGRESS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
