import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/src/server/services/auth-service";

// Next.js 16: "middleware" is now "proxy" and runs on the Node.js runtime,
// so we can verify the HMAC signature here (an optimistic check only —
// API routes still re-verify the session and enforce authorization).
function redirectToLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("jlpt_session")?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) return redirectToLogin(request);

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/flashcards/:path*", "/mock-exams/:path*"],
};
