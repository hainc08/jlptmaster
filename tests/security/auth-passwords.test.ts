import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { hashPassword } from "@/src/server/services/password-service";
import { signSessionToken, verifySessionToken } from "@/src/server/services/auth-service";
import { resetAuthRateLimits } from "@/src/server/services/rate-limit";
import { DEMO_PASSWORDS } from "@/prisma/demo-credentials";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as register } from "@/app/api/v1/auth/register/route";

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const loginReq = (body: unknown, ip = "10.0.0.1") =>
  post("http://x/api/v1/auth/login", body, { "x-forwarded-for": ip });
const registerReq = (body: unknown, ip = "10.0.0.2") =>
  post("http://x/api/v1/auth/register", body, { "x-forwarded-for": ip });

const NEW_EMAIL = `register-test-${Date.now()}@example.com`;
const NO_HASH_EMAIL = `nohash-test-${Date.now()}@example.com`;

describe("Real password authentication", () => {
  beforeAll(async () => {
    // Make sure the seeded demo users have the known demo passwords in the test DB.
    await prisma.user.update({
      where: { email: "minh@jlptmaster.vn" },
      data: { passwordHash: await hashPassword(DEMO_PASSWORDS.student) },
    });
    await prisma.user.update({
      where: { email: "admin@jlptmaster.vn" },
      data: { passwordHash: await hashPassword(DEMO_PASSWORDS.admin) },
    });
    await prisma.user.upsert({
      where: { email: NO_HASH_EMAIL },
      update: { passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$local_demo_hash_placeholder" },
      create: { email: NO_HASH_EMAIL, role: "STUDENT", passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$local_demo_hash_placeholder" },
    });
  });

  beforeEach(() => resetAuthRateLimits());

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [NEW_EMAIL, NO_HASH_EMAIL] } } });
  });

  describe("login", () => {
    it("rejects a missing password with 400 (an email alone is never enough)", async () => {
      const res = await login(loginReq({ email: "admin@jlptmaster.vn" }));
      expect(res.status).toBe(400);
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("rejects a wrong password with 401 and sets no cookie", async () => {
      const res = await login(loginReq({ email: "admin@jlptmaster.vn", password: "not-the-password-1" }));
      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("gives the same generic error for unknown email, wrong password and placeholder-hash accounts", async () => {
      const bodies = await Promise.all(
        [
          { email: "nobody@example.com", password: "Whatever-123" },
          { email: "admin@jlptmaster.vn", password: "Whatever-123" },
          { email: NO_HASH_EMAIL, password: "Whatever-123" },
        ].map(async (b, i) => {
          const res = await login(loginReq(b, `10.1.0.${i}`));
          expect(res.status).toBe(401);
          return (await res.json()).error.message;
        })
      );
      expect(new Set(bodies).size).toBe(1);
    });

    it("accepts the right password, sets an HttpOnly signed cookie for the right role", async () => {
      const res = await login(loginReq({ email: "ADMIN@jlptmaster.vn ", password: DEMO_PASSWORDS.admin }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.user.role).toBe("ADMIN");
      expect(JSON.stringify(body)).not.toMatch(/passwordHash|scrypt\$/);
      expect(res.headers.get("set-cookie")).toMatch(/jlpt_session=.*HttpOnly/i);
      expect(verifySessionToken(body.data.token)?.role).toBe("ADMIN");
    });

    it("blocks a suspended account even with the right password", async () => {
      await prisma.user.update({ where: { email: NO_HASH_EMAIL }, data: { passwordHash: await hashPassword("Suspended-Pass1"), status: "SUSPENDED" } });
      const res = await login(loginReq({ email: NO_HASH_EMAIL, password: "Suspended-Pass1" }));
      expect(res.status).toBe(401);
      await prisma.user.update({ where: { email: NO_HASH_EMAIL }, data: { status: "ACTIVE" } });
    });

    it("rate-limits repeated failures per email (429 + Retry-After), then a good login is also blocked until reset", async () => {
      for (let i = 0; i < 5; i++) {
        const r = await login(loginReq({ email: "minh@jlptmaster.vn", password: `wrong-${i}-pass1` }, `10.2.0.${i}`));
        expect(r.status).toBe(401);
      }
      const blocked = await login(loginReq({ email: "minh@jlptmaster.vn", password: "wrong-again-1" }, "10.2.0.99"));
      expect(blocked.status).toBe(429);
      expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);

      resetAuthRateLimits();
      const ok = await login(loginReq({ email: "minh@jlptmaster.vn", password: DEMO_PASSWORDS.student }));
      expect(ok.status).toBe(200);
    });

    it("a successful login clears the failure counter", async () => {
      for (let i = 0; i < 3; i++) {
        await login(loginReq({ email: "minh@jlptmaster.vn", password: `wrong-${i}-pass1` }));
      }
      expect((await login(loginReq({ email: "minh@jlptmaster.vn", password: DEMO_PASSWORDS.student }))).status).toBe(200);
      for (let i = 0; i < 4; i++) {
        expect((await login(loginReq({ email: "minh@jlptmaster.vn", password: `wrong-${i}-pass1` }))).status).toBe(401);
      }
    });
  });

  describe("register", () => {
    it("rejects weak passwords and bad emails", async () => {
      expect((await register(registerReq({ email: NEW_EMAIL, password: "short1" }))).status).toBe(400);
      expect((await register(registerReq({ email: NEW_EMAIL, password: "alllettersnodigit" }))).status).toBe(400);
      expect((await register(registerReq({ email: "not-an-email", password: "Valid-Pass-123" }))).status).toBe(400);
    });

    it("creates a STUDENT with a hashed password, logs them in, and ignores any role in the body", async () => {
      const res = await register(registerReq({ email: NEW_EMAIL, password: "Valid-Pass-123", role: "ADMIN" }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.user.role).toBe("STUDENT");
      expect(res.headers.get("set-cookie")).toMatch(/jlpt_session=.*HttpOnly/i);

      const row = await prisma.user.findUniqueOrThrow({ where: { email: NEW_EMAIL }, include: { profile: true } });
      expect(row.role).toBe("STUDENT");
      expect(row.passwordHash).toMatch(/^scrypt\$/);
      expect(row.passwordHash).not.toContain("Valid-Pass-123");
      expect(row.profile?.onboardingCompletedAt ?? null).toBeNull();

      // and the new password really works for login
      expect((await login(loginReq({ email: NEW_EMAIL, password: "Valid-Pass-123" }))).status).toBe(200);
    });

    it("refuses a duplicate email with 409", async () => {
      const res = await register(registerReq({ email: NEW_EMAIL.toUpperCase(), password: "Another-Pass-123" }));
      expect(res.status).toBe(409);
    });

    it("rate-limits registrations per IP", async () => {
      let last = 0;
      for (let i = 0; i < 12; i++) {
        last = (await register(registerReq({ email: "bad", password: "x" }, "10.9.9.9"))).status;
      }
      expect(last).toBe(429);
    });
  });

  describe("session secret fails closed in production", () => {
    it("refuses to sign tokens in production when AUTH_SECRET/SESSION_SECRET are not set", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("AUTH_SECRET", "");
      vi.stubEnv("SESSION_SECRET", "");
      expect(() => signSessionToken({ userId: "u", email: "e@x.com", role: "STUDENT" })).toThrow(/AUTH_SECRET/);
      vi.unstubAllEnvs();
    });

    it("refuses a too-short secret in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("AUTH_SECRET", "short");
      expect(() => signSessionToken({ userId: "u", email: "e@x.com", role: "STUDENT" })).toThrow(/32/);
      vi.unstubAllEnvs();
    });

    it("rejects the well-known default secret in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("AUTH_SECRET", "jlpt_master_super_secret_session_key_32_chars_min");
      expect(() => signSessionToken({ userId: "u", email: "e@x.com", role: "STUDENT" })).toThrow(/mặc định|default/i);
      vi.unstubAllEnvs();
    });
  });
});
