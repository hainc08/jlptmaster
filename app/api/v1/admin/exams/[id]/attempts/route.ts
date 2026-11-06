import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireAdminSession, authErrorResponse } from "@/src/server/services/auth-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminSession(req);
    const { id } = await params;
    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id },
      include: { user: { select: { email: true } } },
      orderBy: { startedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      data: attempts.map((a) => ({
        id: a.id,
        userEmail: a.user.email,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        rawCorrect: a.rawCorrect,
        rawTotal: a.rawTotal,
        internalScore: a.internalScore,
      })),
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: { code: "ADMIN_ATTEMPTS_FAILED", message: error.message } }, { status: 500 });
  }
}
