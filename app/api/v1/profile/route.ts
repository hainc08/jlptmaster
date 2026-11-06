import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";

const ProfileSchema = z.object({
  targetLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  dailyGoalMinutes: z.number().int().min(5).max(240),
});

// Identity comes only from the signed session; a userId in the body is ignored.
export async function GET(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    return NextResponse.json({
      data: {
        targetLevel: profile?.targetLevel ?? "N5",
        dailyGoalMinutes: profile?.dailyGoalMinutes ?? 30,
        timezone: profile?.timezone ?? "Asia/Ho_Chi_Minh",
        onboarded: Boolean(profile?.onboardingCompletedAt),
      },
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: { code: "PROFILE_FETCH_FAILED", message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const parsed = ProfileSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Cấp độ hoặc thời lượng học mỗi ngày không hợp lệ" } },
        { status: 400 }
      );
    }
    const { targetLevel, dailyGoalMinutes } = parsed.data;
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { targetLevel, dailyGoalMinutes, onboardingCompletedAt: new Date() },
      create: { userId, targetLevel, dailyGoalMinutes, onboardingCompletedAt: new Date() },
    });
    return NextResponse.json({
      data: {
        targetLevel: profile.targetLevel,
        dailyGoalMinutes: profile.dailyGoalMinutes,
        onboarded: true,
      },
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: { code: "PROFILE_SAVE_FAILED", message: error.message } }, { status: 500 });
  }
}
