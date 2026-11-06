import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { resolveSession } from "@/src/server/services/auth-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level") || "N5";

    const courses = await prisma.course.findMany({
      where: {
        levelId: level,
        status: "PUBLISHED",
      },
      include: {
        lessons: {
          where: { status: "PUBLISHED" },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    // Progress is only ever read for the signed-in caller; one query for all lessons (no N+1).
    const userId = resolveSession(req)?.userId;
    const lessonIds = courses.flatMap((c) => c.lessons.map((l) => l.id));
    const progress =
      userId && lessonIds.length
        ? await prisma.lessonProgress.findMany({
            where: { userId, lessonId: { in: lessonIds } },
            select: { lessonId: true, status: true },
          })
        : [];
    const statusOf = new Map(progress.map((p) => [p.lessonId, p.status]));

    return NextResponse.json({
      data: courses.map((c) => ({
        ...c,
        lessons: c.lessons.map((l) => ({ ...l, progressStatus: statusOf.get(l.id) ?? "NOT_STARTED" })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "COURSES_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

