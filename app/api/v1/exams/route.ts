import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { resolveSession } from "@/src/server/services/auth-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level") || "N5";

    const exams = await prisma.exam.findMany({
      where: {
        levelId: level,
        status: "PUBLISHED",
      },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            _count: {
              select: { examQuestions: true },
            },
          },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    // Best submitted score and attempt count for the signed-in caller only (one grouped query).
    const userId = resolveSession(req)?.userId;
    const mine =
      userId && exams.length
        ? await prisma.examAttempt.groupBy({
            by: ["examId"],
            where: { userId, status: "SUBMITTED", examId: { in: exams.map((e) => e.id) } },
            _max: { internalScore: true },
            _count: { _all: true },
          })
        : [];
    const stats = new Map(mine.map((m) => [m.examId, { best: m._max.internalScore, count: m._count._all }]));

    const formatted = exams.map((ex) => {
      const totalDurationSeconds = ex.sections.reduce((acc, s) => acc + s.durationSeconds, 0);
      const totalQuestions = ex.sections.reduce((acc, s) => acc + s._count.examQuestions, 0);

      return {
        id: ex.id,
        levelId: ex.levelId,
        title: ex.title,
        version: ex.version,
        scoringPolicy: ex.scoringPolicy,
        totalMinutes: Math.round(totalDurationSeconds / 60),
        totalQuestions,
        bestInternalScore: stats.get(ex.id)?.best ?? null,
        attemptCount: stats.get(ex.id)?.count ?? 0,
        sections: ex.sections.map((s) => ({
          id: s.id,
          sectionType: s.sectionType,
          position: s.position,
          durationSeconds: s.durationSeconds,
          maxInternalPoints: s.maxInternalPoints,
          questionCount: s._count.examQuestions,
        })),
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "EXAMS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

