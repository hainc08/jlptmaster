import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import {
  signSessionToken,
  AuthRequiredError,
  UnauthorizedRoleError,
  assertAdminRole,
} from "@/src/server/services/auth-service";
import { can, requireModule, ADMIN_MODULES } from "@/src/server/services/admin-guard";
import { proxy } from "@/proxy";

type R = "STUDENT" | "EDITOR" | "ADMIN" | "OWNER" | "SUPPORT";
const TAG = `rbac-${Date.now()}`;
const users: Record<string, { id: string; email: string }> = {};

function reqFor(userId: string, email: string, role: R, path = "/api/v1/admin/members") {
  const token = signSessionToken({ userId, email, role } as never);
  return new NextRequest(`http://localhost${path}`, { headers: { "x-jlpt-session": token } });
}
const as = (key: string, role: R) => reqFor(users[key].id, users[key].email, role);

beforeAll(async () => {
  for (const role of ["STUDENT", "EDITOR", "ADMIN", "OWNER", "SUPPORT"] as const) {
    const email = `${TAG}-${role.toLowerCase()}@test.invalid`;
    const u = await prisma.user.create({ data: { email, role, status: "ACTIVE", displayName: role } });
    users[role] = { id: u.id, email };
  }
  const s = await prisma.user.create({ data: { email: `${TAG}-susp@test.invalid`, role: "ADMIN", status: "SUSPENDED" } });
  users.SUSPENDED = { id: s.id, email: s.email };
  const d = await prisma.user.create({ data: { email: `${TAG}-del@test.invalid`, role: "ADMIN", status: "ACTIVE", deletedAt: new Date() } });
  users.DELETED = { id: d.id, email: d.email };
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TAG } } });
});

describe("admin module permissions (AC-CMS-01)", () => {
  it("STUDENT is forbidden from every module", async () => {
    for (const m of ADMIN_MODULES) {
      await expect(requireModule(as("STUDENT", "STUDENT"), m)).rejects.toBeInstanceOf(UnauthorizedRoleError);
    }
  });

  it("SUPPORT may use members but not settings", async () => {
    const s = await requireModule(as("SUPPORT", "SUPPORT"), "members");
    expect(s.userId).toBe(users.SUPPORT.id);
    await expect(requireModule(as("SUPPORT", "SUPPORT"), "settings")).rejects.toBeInstanceOf(UnauthorizedRoleError);
  });

  it("EDITOR may use levels but not members", async () => {
    await expect(requireModule(as("EDITOR", "EDITOR"), "levels")).resolves.toBeTruthy();
    await expect(requireModule(as("EDITOR", "EDITOR"), "members")).rejects.toBeInstanceOf(UnauthorizedRoleError);
  });

  it("a request without a session is 401", async () => {
    const anon = new NextRequest("http://localhost/api/v1/admin/members");
    await expect(requireModule(anon, "members")).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("OWNER is always allowed, even if its permission rows are removed", async () => {
    const rows = await prisma.rolePermission.findMany({ where: { role: "OWNER" } });
    await prisma.rolePermission.deleteMany({ where: { role: "OWNER" } });
    try {
      await expect(can("OWNER", "settings")).resolves.toBe(true);
    } finally {
      await prisma.rolePermission.createMany({ data: rows });
    }
  });

  it("changing a RolePermission row changes the next decision", async () => {
    const where = { role_module: { role: "SUPPORT" as const, module: "levels" } };
    await expect(can("SUPPORT", "levels")).resolves.toBe(false);
    await prisma.rolePermission.update({ where, data: { allowed: true } });
    try {
      await expect(can("SUPPORT", "levels")).resolves.toBe(true);
    } finally {
      await prisma.rolePermission.update({ where, data: { allowed: false } });
    }
  });

  it("uses the live database role, not the role baked into the token", async () => {
    // token claims ADMIN but the database says STUDENT
    const stale = reqFor(users.STUDENT.id, users.STUDENT.email, "ADMIN");
    await expect(requireModule(stale, "members")).rejects.toBeInstanceOf(UnauthorizedRoleError);
  });

  it("a suspended or anonymized account with a still-valid token is rejected with 401", async () => {
    await expect(requireModule(reqFor(users.SUSPENDED.id, users.SUSPENDED.email, "ADMIN"), "members")).rejects.toBeInstanceOf(AuthRequiredError);
    await expect(requireModule(reqFor(users.DELETED.id, users.DELETED.email, "ADMIN"), "members")).rejects.toBeInstanceOf(AuthRequiredError);
  });
});

describe("legacy admin guard and proxy", () => {
  it("assertAdminRole now accepts OWNER as well as ADMIN, still rejects SUPPORT/EDITOR/STUDENT", () => {
    expect(() => assertAdminRole("OWNER")).not.toThrow();
    expect(() => assertAdminRole("ADMIN")).not.toThrow();
    for (const r of ["SUPPORT", "EDITOR", "STUDENT"]) expect(() => assertAdminRole(r)).toThrow();
  });

  const cookieReq = (role: R, path: string) =>
    new NextRequest(`http://localhost${path}`, {
      headers: { cookie: `jlpt_session=${signSessionToken({ userId: "x", email: "x@test.invalid", role } as never)}` },
    });

  it("proxy lets SUPPORT/EDITOR/OWNER into /admin/** and bounces STUDENT to /dashboard", () => {
    for (const r of ["SUPPORT", "EDITOR", "OWNER", "ADMIN"] as const) {
      const res = proxy(cookieReq(r, "/admin/members"));
      expect(res.headers.get("location"), r).toBeNull();
    }
    const res = proxy(cookieReq("STUDENT", "/admin/members"));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("proxy keeps the legacy admin pages (/admin, /admin/content, /admin/exams) ADMIN/OWNER only", () => {
    for (const path of ["/admin", "/admin/content", "/admin/exams"]) {
      for (const r of ["SUPPORT", "EDITOR", "STUDENT"] as const) {
        const res = proxy(cookieReq(r, path));
        expect(new URL(res.headers.get("location")!).pathname, `${r} ${path}`).toBe("/dashboard");
      }
      for (const r of ["ADMIN", "OWNER"] as const) {
        expect(proxy(cookieReq(r, path)).headers.get("location"), `${r} ${path}`).toBeNull();
      }
    }
  });
});
