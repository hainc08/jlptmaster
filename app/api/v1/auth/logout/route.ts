import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({
    data: { success: true, message: "Đăng xuất thành công" },
  });

  response.cookies.set("jlpt_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
