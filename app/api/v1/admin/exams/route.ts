import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireAdminSession, authErrorResponse } from "@/src/server/services/auth-service";

export async function GET(req: NextRequest) {
  try {
    requireAdminSession(req);
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");

    const exams = await prisma.exam.findMany({
      where: level ? { levelId: level } : undefined,
      include: {
        sections: { select: { durationSeconds: true, _count: { select: { examQuestions: true } } } },
        _count: { select: { attempts: true } },
      },
      orderBy: [{ levelId: "asc" }, { title: "asc" }],
    });

    return NextResponse.json({
      data: exams.map((e) => ({
        id: e.id,
        levelId: e.levelId,
        title: e.title,
        status: e.status,
        isLocked: e.status !== "PUBLISHED",
        version: e.version,
        publishedAt: e.publishedAt,
        totalMinutes: Math.round(e.sections.reduce((n, s) => n + s.durationSeconds, 0) / 60),
        totalQuestions: e.sections.reduce((n, s) => n + s._count.examQuestions, 0),
        attemptCount: e._count.attempts,
      })),
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "ADMIN_EXAMS_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
