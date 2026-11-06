import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken, type SessionPayload } from "@/src/server/services/auth-service";
import { AdminError } from "@/src/server/services/admin-errors";
import { can } from "@/src/server/services/admin-guard";
import { getSettings, updateSettings, getRoleMatrix, putRoleMatrix } from "@/src/server/services/admin-settings-service";
import { GET as settingsGET, PATCH as settingsPATCH } from "@/app/api/v1/admin/settings/route";
import { GET as rolesGET, PUT as rolesPUT } from "@/app/api/v1/admin/settings/roles/route";

const TAG = `set${Date.now()}`;
const ids: Record<string, string> = {};
let saved: Awaited<ReturnType<typeof prisma.systemSetting.findMany>> = [];

const actor = (role: SessionPayload["role"] = "ADMIN"): SessionPayload => ({ userId: ids[role], email: `${TAG}-${role}@test.invalid`, role, exp: 9999999999 });
const req = (role: SessionPayload["role"], url: string, body?: unknown, method = "GET") =>
  new NextRequest(`http://localhost${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "x-jlpt-session": signSessionToken({ userId: ids[role], email: `${TAG}-${role}@test.invalid`, role }), "content-type": "application/json" },
  });
const code = (p: Promise<unknown>) => p.then(() => "OK", (e: AdminError) => `${e.status}:${e.code}`);

beforeAll(async () => {
  saved = await prisma.systemSetting.findMany();
  for (const role of ["ADMIN", "EDITOR", "SUPPORT"] as const) {
    ids[role] = (await prisma.user.create({ data: { email: `${TAG}-${role}@test.invalid`, role, displayName: role } })).id;
  }
});

afterAll(async () => {
  for (const s of saved) {
    await prisma.systemSetting.update({ where: { key: s.key }, data: { valueJson: s.valueJson as never } });
  }
  await prisma.rolePermission.update({ where: { role_module: { role: "EDITOR", module: "audit" } }, data: { allowed: false } });
  const uid = Object.values(ids);
  await prisma.auditLog.deleteMany({ where: { actorId: { in: uid } } });
  await prisma.user.deleteMany({ where: { id: { in: uid } } });
});

describe("settings (AC-CMS-07)", () => {
  it("returns general, exam rules and notifications with the seeded defaults", async () => {
    const s = await getSettings();
    expect(s.general).toEqual({ siteName: "JLPT Master", defaultLanguage: "vi" });
    expect(s.examRules).toEqual({ timeLimitMin: 105, retakeLimit: 3, passThreshold: 60 });
    expect(Object.keys(s.notifications).sort()).toEqual(["examResult", "passwordReset", "planExpiry", "suspension", "weeklyDigest", "welcome"]);
  });

  it("a valid partial patch persists, keeps the other fields, and audits settings.exam_rules with before/after", async () => {
    await updateSettings(actor(), { examRules: { retakeLimit: 4 } }, "9.9.9.9");
    expect((await getSettings()).examRules).toEqual({ timeLimitMin: 105, retakeLimit: 4, passThreshold: 60 });
    const a = await prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.ADMIN, action: "settings.exam_rules" } });
    expect(a.beforeJson).toEqual({ retakeLimit: 3 });
    expect(a.afterJson).toEqual({ retakeLimit: 4 });
    expect(a.ip).toBe("9.9.9.9");
    await updateSettings(actor(), { examRules: { retakeLimit: 3 } });
  });

  it("enforces the documented ranges, in both directions", async () => {
    const bad = [
      { examRules: { timeLimitMin: 9 } }, { examRules: { timeLimitMin: 241 } }, { examRules: { timeLimitMin: 90.5 } },
      { examRules: { retakeLimit: -1 } }, { examRules: { retakeLimit: 11 } },
      { examRules: { passThreshold: 29 } }, { examRules: { passThreshold: 101 } },
      { general: { siteName: "" } }, { general: { siteName: "   " } }, { general: { siteName: "x".repeat(61) } },
      { general: { defaultLanguage: "fr" } }, { notifications: { welcome: "yes" } }, { notifications: { bogus: true } },
      { somethingElse: {} },
    ];
    for (const patch of bad) expect(await code(updateSettings(actor(), patch as never)), JSON.stringify(patch)).toBe("400:INVALID_SETTINGS");
    expect((await getSettings()).examRules.timeLimitMin).toBe(105);
    for (const ok of [{ timeLimitMin: 10 }, { timeLimitMin: 240 }, { retakeLimit: 0 }, { passThreshold: 30 }, { passThreshold: 100 }]) {
      expect(await code(updateSettings(actor(), { examRules: ok }))).toBe("OK");
    }
    await updateSettings(actor(), { examRules: { timeLimitMin: 105, retakeLimit: 3, passThreshold: 60 } });
  });

  it("trims the site name and an empty patch writes no audit row", async () => {
    await updateSettings(actor(), { general: { siteName: "  JLPT Master  " } });
    expect((await getSettings()).general.siteName).toBe("JLPT Master");
    const n = await prisma.auditLog.count({ where: { actorId: ids.ADMIN, action: { startsWith: "settings." } } });
    await updateSettings(actor(), {});
    await updateSettings(actor(), { general: { defaultLanguage: "vi" } }); // unchanged value
    expect(await prisma.auditLog.count({ where: { actorId: ids.ADMIN, action: { startsWith: "settings." } } })).toBe(n);
  });
});

describe("role matrix (AC-CMS-07)", () => {
  it("returns 4 roles × 5 modules", async () => {
    const m = await getRoleMatrix();
    expect(Object.keys(m).sort()).toEqual(["ADMIN", "EDITOR", "OWNER", "SUPPORT"]);
    expect(Object.keys(m.OWNER).sort()).toEqual(["audit", "dashboard", "levels", "members", "settings"]);
    expect(m.OWNER).toEqual({ dashboard: true, members: true, levels: true, settings: true, audit: true });
  });

  it("refuses to lock out ADMIN (settings/dashboard) and to change OWNER, leaving the matrix untouched", async () => {
    const m = await getRoleMatrix();
    expect(await code(putRoleMatrix(actor(), { ...m, ADMIN: { ...m.ADMIN, settings: false } }))).toBe("409:LOCKOUT");
    expect(await code(putRoleMatrix(actor(), { ...m, ADMIN: { ...m.ADMIN, dashboard: false } }))).toBe("409:LOCKOUT");
    expect(await code(putRoleMatrix(actor(), { ...m, OWNER: { ...m.OWNER, audit: false } }))).toBe("409:OWNER_LOCKED");
    expect(await getRoleMatrix()).toEqual(m);
  });

  it("rejects incomplete or non-boolean matrices", async () => {
    const m = await getRoleMatrix();
    const missingRole = { OWNER: m.OWNER, ADMIN: m.ADMIN, EDITOR: m.EDITOR };
    expect(await code(putRoleMatrix(actor(), missingRole as never))).toBe("400:INVALID_MATRIX");
    expect(await code(putRoleMatrix(actor(), { ...m, EDITOR: { ...m.EDITOR, audit: "yes" } } as never))).toBe("400:INVALID_MATRIX");
    expect(await code(putRoleMatrix(actor(), { ...m, STUDENT: m.EDITOR } as never))).toBe("400:INVALID_MATRIX");
  });

  it("a saved change is what the permission guard decides next, is audited, and never leaves a gap", async () => {
    const m = await getRoleMatrix();
    expect(await can("EDITOR", "audit")).toBe(false);
    await putRoleMatrix(actor(), { ...m, EDITOR: { ...m.EDITOR, audit: true } }, "8.8.8.8");
    expect(await can("EDITOR", "audit")).toBe(true);
    expect(await prisma.rolePermission.count()).toBe(20);
    const a = await prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.ADMIN, action: "settings.roles" } });
    expect((a.beforeJson as { EDITOR: { audit: boolean } }).EDITOR.audit).toBe(false);
    expect((a.afterJson as { EDITOR: { audit: boolean } }).EDITOR.audit).toBe(true);
    await putRoleMatrix(actor(), m);
    expect(await can("EDITOR", "audit")).toBe(false);
  });
});

describe("routes: authorization (AC-CMS-01)", () => {
  it("only roles with the settings module can read or write; others get 403", async () => {
    for (const role of ["EDITOR", "SUPPORT"] as const) {
      expect((await settingsGET(req(role, "/api/v1/admin/settings"))).status, role).toBe(403);
      expect((await settingsPATCH(req(role, "/api/v1/admin/settings", { examRules: { retakeLimit: 9 } }, "PATCH"))).status, role).toBe(403);
      expect((await rolesGET(req(role, "/api/v1/admin/settings/roles"))).status, role).toBe(403);
      expect((await rolesPUT(req(role, "/api/v1/admin/settings/roles", {}, "PUT"))).status, role).toBe(403);
    }
    expect((await getSettings()).examRules.retakeLimit).toBe(3);
    const ok = await settingsGET(req("ADMIN", "/api/v1/admin/settings"));
    expect(ok.status).toBe(200);
    expect((await ok.json()).data.general.siteName).toBe("JLPT Master");
  });

  it("maps validation and rule failures to 400 / 409", async () => {
    const bad = await settingsPATCH(req("ADMIN", "/api/v1/admin/settings", { examRules: { timeLimitMin: 5 } }, "PATCH"));
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe("INVALID_SETTINGS");
    const m = await getRoleMatrix();
    const lock = await rolesPUT(req("ADMIN", "/api/v1/admin/settings/roles", { ...m, ADMIN: { ...m.ADMIN, settings: false } }, "PUT"));
    expect(lock.status).toBe(409);
    expect((await lock.json()).error.code).toBe("LOCKOUT");
  });
});
