import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { hashPassword, validatePasswordPolicy } from "@/src/server/services/password-service";
import { REGISTER_IP_RULE, checkLimit, clientIp, recordFailure } from "@/src/server/services/rate-limit";

const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(1).max(128),
});

// Public sign-up. Role is ALWAYS STUDENT: nothing about role/status is read from the body.
export async function POST(req: NextRequest) {
  try {
    const ipKey = `register:ip:${clientIp(req)}`;
    const wait = checkLimit(ipKey, REGISTER_IP_RULE);
    if (wait > 0) {
      return NextResponse.json(
        { error: { code: "TOO_MANY_ATTEMPTS", message: "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút." } },
        { status: 429, headers: { "Retry-After": String(wait) } }
      );
    }
    // Count every attempt (not just failures) so the endpoint cannot be used for mass sign-ups.
    recordFailure(ipKey, REGISTER_IP_RULE);

    const parsed = RegisterSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Email hoặc mật khẩu không hợp lệ" } },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    const policy = validatePasswordPolicy(password, email);
    if (!policy.ok) {
      return NextResponse.json({ error: { code: "WEAK_PASSWORD", message: policy.message } }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { code: "EMAIL_TAKEN", message: "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác." } },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role: "STUDENT",
        status: "ACTIVE",
        profile: { create: { targetLevel: "N5", dailyGoalMinutes: 30 } },
      },
    });

    const token = signSessionToken({ userId: user.id, email: user.email, role: "STUDENT" });
    const response = NextResponse.json(
      { data: { user: { id: user.id, email: user.email, name: email.split("@")[0], role: user.role, targetLevel: "N5" }, token } },
      { status: 201 }
    );
    response.cookies.set("jlpt_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (err: any) {
    // Unique-constraint race: someone registered the same email at the same moment
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: { code: "EMAIL_TAKEN", message: "Email này đã được đăng ký." } },
        { status: 409 }
      );
    }
    console.error("[auth/register]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau." } },
      { status: 500 }
    );
  }
}
