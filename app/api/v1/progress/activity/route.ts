import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";
import { DEFAULT_TZ, recordStudyMinutes } from "@/src/server/services/study-activity-service";

const Body = z.object({ minutes: z.number().int().min(1).max(5) });

/** Study heartbeat from the lesson and exam screens (every 60 s while visible). */
export async function POST(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Số phút phải là số nguyên từ 1 đến 5" } }, { status: 400 });
    }
    const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { timezone: true } });
    await recordStudyMinutes(userId, parsed.data.minutes, new Date(), profile?.timezone || DEFAULT_TZ);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "ACTIVITY_SAVE_FAILED", message: error instanceof Error ? error.message : "error" } },
      { status: 500 }
    );
  }
}
