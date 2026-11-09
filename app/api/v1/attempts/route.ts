import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";

const MAX_SCORE = 180;

/** My submitted mock-exam attempts, newest first. Identity comes only from the session. */
export async function GET(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const raw = Number.parseInt(new URL(req.url).searchParams.get("limit") ?? "", 10);
    const take = Number.isFinite(raw) ? Math.min(50, Math.max(1, raw)) : 20;

    const attempts = await prisma.examAttempt.findMany({
      where: { userId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take,
      select: {
        id: true,
        examId: true,
        internalScore: true,
        startedAt: true,
        submittedAt: true,
        exam: { select: { title: true } },
      },
    });

    return NextResponse.json({
      data: attempts.map((a) => ({
        id: a.id,
        examId: a.examId,
        examTitle: a.exam.title,
        internalScore: a.internalScore,
        maxScore: MAX_SCORE,
        submittedAt: a.submittedAt,
        durationSeconds: a.submittedAt ? Math.max(0, Math.round((a.submittedAt.getTime() - a.startedAt.getTime()) / 1000)) : null,
      })),
    });
  } catch (error: unknown) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "ATTEMPTS_FETCH_FAILED", message: error instanceof Error ? error.message : "error" } },
      { status: 500 }
    );
  }
}
