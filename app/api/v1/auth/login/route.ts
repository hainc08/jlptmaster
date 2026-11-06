import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { getDummyHash, verifyPassword } from "@/src/server/services/password-service";
import {
  LOGIN_EMAIL_RULE,
  LOGIN_IP_RULE,
  checkLimit,
  clearLimit,
  clientIp,
  recordFailure,
} from "@/src/server/services/rate-limit";

const GENERIC_ERROR = "Email hoặc mật khẩu không chính xác";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Vui lòng nhập email và mật khẩu" } },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    const emailKey = `login:email:${email}`;
    const ipKey = `login:ip:${ip}`;
    const wait = Math.max(checkLimit(emailKey, LOGIN_EMAIL_RULE), checkLimit(ipKey, LOGIN_IP_RULE));
    if (wait > 0) {
      return NextResponse.json(
        { error: { code: "TOO_MANY_ATTEMPTS", message: "Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút." } },
        { status: 429, headers: { "Retry-After": String(wait) } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });

    // Always run one scrypt verification so unknown accounts cost the same time as real ones.
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

    if (!user || !passwordOk || user.status !== "ACTIVE") {
      recordFailure(emailKey, LOGIN_EMAIL_RULE);
      recordFailure(ipKey, LOGIN_IP_RULE);
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: GENERIC_ERROR } }, { status: 401 });
    }

    clearLimit(emailKey);

    const role = (user.role as "STUDENT" | "EDITOR" | "ADMIN") || "STUDENT";
    const token = signSessionToken({ userId: user.id, email: user.email, role });

    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.email.split("@")[0],
          role: user.role,
          targetLevel: user.profile?.targetLevel || "N5",
        },
        token,
      },
    });

    response.cookies.set("jlpt_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Không thể đăng nhập lúc này. Vui lòng thử lại sau." } },
      { status: 500 }
    );
  }
}
