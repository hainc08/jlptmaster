import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/src/server/db";
import { hashPassword } from "@/src/server/services/password-service";
import { DEMO_PASSWORDS } from "@/prisma/demo-credentials";
import { NextRequest } from "next/server";
import { POST as loginRoute } from "@/app/api/v1/auth/login/route";
import { GET as meRoute } from "@/app/api/v1/auth/me/route";
import { POST as logoutRoute } from "@/app/api/v1/auth/logout/route";

describe("Authentication API (/api/v1/auth)", () => {
  beforeAll(async () => {
    await prisma.user.update({
      where: { email: "minh@jlptmaster.vn" },
      data: { passwordHash: await hashPassword(DEMO_PASSWORDS.student) },
    });
    await prisma.user.update({
      where: { email: "admin@jlptmaster.vn" },
      data: { passwordHash: await hashPassword(DEMO_PASSWORDS.admin) },
    });
  });

  it("POST /api/v1/auth/login validates credentials and sets HttpOnly cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "minh@jlptmaster.vn", password: DEMO_PASSWORDS.student }),
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.user.email).toBe("minh@jlptmaster.vn");
    expect(body.data.token).toBeDefined();

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("jlpt_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("POST /api/v1/auth/login rejects invalid user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@user.com", password: "password123" }),
    });

    const res = await loginRoute(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/auth/me returns current session user", async () => {
    // First login as admin
    const loginReq = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@jlptmaster.vn", password: DEMO_PASSWORDS.admin }),
    });
    const loginRes = await loginRoute(loginReq);
    const { data } = await loginRes.json();

    const meReq = new NextRequest("http://localhost:3000/api/v1/auth/me", {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    });
    const meRes = await meRoute(meReq);
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.data.user.role).toBe("ADMIN");
  });

  it("POST /api/v1/auth/logout clears the session cookie", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/auth/logout", { method: "POST" });
    const res = await logoutRoute(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("Max-Age=0");
  });
});

