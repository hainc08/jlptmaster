import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { resolveSession } from "@/src/server/services/auth-service";

export async function GET(req: NextRequest) {
  try {
    const session = resolveSession(req);
    if (!session) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Chưa đăng nhập" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            targetLevel: true,
            dailyGoalMinutes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "Người dùng không tồn tại" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.email.split("@")[0],
          targetLevel: user.profile?.targetLevel || "N5",
          dailyGoalMinutes: user.profile?.dailyGoalMinutes || 30,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: err.message } },
      { status: 500 }
    );
  }
}
