import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";

const ProfileSchema = z.object({
  targetLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  dailyGoalMinutes: z.number().int().min(5).max(240),
});

const PatchSchema = z
  .object({
    dailyGoalMinutes: z.number().int().min(5).max(240),
    furiganaDefault: z.boolean(),
    uiLanguage: z.enum(["vi", "en"]),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "empty" });

type ProfileRow = {
  targetLevel: string;
  dailyGoalMinutes: number;
  timezone: string;
  onboardingCompletedAt: Date | null;
  furiganaDefault: boolean;
  uiLanguage: string;
} | null;

function toData(profile: ProfileRow) {
  return {
    targetLevel: profile?.targetLevel ?? "N5",
    dailyGoalMinutes: profile?.dailyGoalMinutes ?? 30,
    timezone: profile?.timezone ?? "Asia/Ho_Chi_Minh",
    onboarded: Boolean(profile?.onboardingCompletedAt),
    furiganaDefault: profile?.furiganaDefault ?? true,
    uiLanguage: profile?.uiLanguage === "en" ? "en" : "vi",
  };
}

// Identity comes only from the signed session; a userId in the body is ignored.
export async function GET(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    return NextResponse.json({ data: toData(profile) });
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

/** Partial preference update (goal, furigana default, UI language). Never touches onboarding or level. */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const body = await req.json().catch(() => null);
    if (body && typeof body === "object" && !Array.isArray(body)) delete (body as Record<string, unknown>).userId;
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Cài đặt không hợp lệ" } }, { status: 400 });
    }
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: parsed.data,
      create: { userId, ...parsed.data },
    });
    return NextResponse.json({ data: toData(profile) });
  } catch (error: unknown) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "PROFILE_SAVE_FAILED", message: error instanceof Error ? error.message : "error" } },
      { status: 500 }
    );
  }
}
