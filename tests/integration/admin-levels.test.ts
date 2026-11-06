import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken, type SessionPayload } from "@/src/server/services/auth-service";
import { AdminError } from "@/src/server/services/admin-errors";
import { listLevels, updateLevel, reorderLevels } from "@/src/server/services/admin-levels-service";
import { GET as listGET } from "@/app/api/v1/admin/levels/route";
import { PATCH as patchPATCH } from "@/app/api/v1/admin/levels/[code]/route";
import { POST as reorderPOST } from "@/app/api/v1/admin/levels/reorder/route";

const TAG = `lvl${Date.now()}`;
const ids: Record<string, string> = {};
let snapshot: Awaited<ReturnType<typeof prisma.jlptLevel.findMany>> = [];

const actor = (role: SessionPayload["role"] = "ADMIN"): SessionPayload => ({ userId: ids[role], email: `${TAG}-${role}@test.invalid`, role, exp: 9999999999 });
const req = (role: SessionPayload["role"], url: string, body?: unknown, method = "GET") =>
  new NextRequest(`http://localhost${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "x-jlpt-session": signSessionToken({ userId: ids[role], email: `${TAG}-${role}@test.invalid`, role }), "content-type": "application/json" },
  });
const code = (p: Promise<unknown>) => p.then(() => "OK", (e: AdminError) => `${e.status}:${e.code}`);

beforeAll(async () => {
  snapshot = await prisma.jlptLevel.findMany();
  for (const role of ["ADMIN", "EDITOR", "SUPPORT"] as const) {
    ids[role] = (await prisma.user.create({ data: { email: `${TAG}-${role}@test.invalid`, role, displayName: role } })).id;
  }
});

afterAll(async () => {
  for (const l of snapshot) {
    await prisma.jlptLevel.update({
      where: { id: l.id },
      data: { nameVi: l.nameVi, description: l.description, passScore: l.passScore, isActive: l.isActive, displayOrder: l.displayOrder },
    });
  }
  const uid = Object.values(ids);
  await prisma.auditLog.deleteMany({ where: { actorId: { in: uid } } });
  await prisma.user.deleteMany({ where: { id: { in: uid } } });
});

describe("levels list (AC-CMS-06)", () => {
  it("returns the five levels in display order with N5 published and counts that match the database", async () => {
    const levels = await listLevels();
    expect(levels.map((l) => l.code)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(levels[0]).toMatchObject({ code: "N5", status: "PUBLISHED", enabled: true, passScore: 60 });
    expect(levels.slice(1).every((l) => l.status !== "PUBLISHED")).toBe(true);
    const n5 = levels[0];
    expect(n5.lessons).toBe(await prisma.lesson.count({ where: { status: "PUBLISHED", course: { levelId: "N5" } } }));
    expect(n5.exams).toBe(await prisma.exam.count({ where: { status: "PUBLISHED", levelId: "N5" } }));
    expect(n5.enrolled).toBe(await prisma.user.count({ where: { role: "STUDENT", deletedAt: null, profile: { is: { targetLevel: "N5" } } } }));
  });
});

describe("level updates and rules (AC-CMS-06)", () => {
  it("rejects a pass score outside 30–100 and accepts the bounds", async () => {
    expect(await code(updateLevel(actor(), "N5", { passScore: 20 }))).toBe("400:INVALID_PASS_SCORE");
    expect(await code(updateLevel(actor(), "N5", { passScore: 101 }))).toBe("400:INVALID_PASS_SCORE");
    expect(await code(updateLevel(actor(), "N5", { passScore: 59.5 }))).toBe("400:INVALID_PASS_SCORE");
    expect(await code(updateLevel(actor(), "N5", { passScore: 30 }))).toBe("OK");
    expect(await code(updateLevel(actor(), "N5", { passScore: 100 }))).toBe("OK");
    await updateLevel(actor(), "N5", { passScore: 60 });
  });

  it("cannot enable a level that is not PUBLISHED, but can disable and re-enable N5", async () => {
    expect(await code(updateLevel(actor(), "N4", { enabled: true }))).toBe("409:LEVEL_NOT_PUBLISHED");
    expect((await prisma.jlptLevel.findUniqueOrThrow({ where: { id: "N4" } })).isActive).toBe(false);
    await updateLevel(actor(), "N5", { enabled: false });
    expect((await listLevels())[0].enabled).toBe(false);
    await updateLevel(actor(), "N5", { enabled: true });
    expect((await listLevels())[0].enabled).toBe(true);
  });

  it("validates text lengths and unknown codes", async () => {
    expect(await code(updateLevel(actor(), "N5", { name: "" }))).toBe("400:INVALID_NAME");
    expect(await code(updateLevel(actor(), "N5", { name: "x".repeat(51) }))).toBe("400:INVALID_NAME");
    expect(await code(updateLevel(actor(), "N5", { description: "x".repeat(501) }))).toBe("400:INVALID_DESCRIPTION");
    expect(await code(updateLevel(actor(), "N9", { name: "x" }))).toBe("404:NOT_FOUND");
  });

  it("writes an audit row containing only the changed fields", async () => {
    await updateLevel(actor(), "N4", { description: `desc ${TAG}`, passScore: 65 }, "1.2.3.4");
    const a = await prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.ADMIN, action: "level.update", entityId: "N4" } });
    expect(a.afterJson).toEqual({ description: `desc ${TAG}`, passScore: 65 });
    expect(Object.keys(a.beforeJson as object).sort()).toEqual(["description", "passScore"]);
    expect(a.ip).toBe("1.2.3.4");
  });

  it("an empty patch changes nothing and writes no audit row", async () => {
    const before = await prisma.auditLog.count({ where: { actorId: ids.ADMIN, action: "level.update", entityId: "N3" } });
    await updateLevel(actor(), "N3", {});
    expect(await prisma.auditLog.count({ where: { actorId: ids.ADMIN, action: "level.update", entityId: "N3" } })).toBe(before);
  });
});

describe("reorder", () => {
  it("persists a valid permutation, audits it, and N5 stays the published level", async () => {
    await reorderLevels(actor(), ["N5", "N3", "N4", "N2", "N1"]);
    expect((await listLevels()).map((l) => l.code)).toEqual(["N5", "N3", "N4", "N2", "N1"]);
    const a = await prisma.auditLog.findFirstOrThrow({ where: { actorId: ids.ADMIN, action: "level.reorder" } });
    expect(a.afterJson).toEqual({ order: ["N5", "N3", "N4", "N2", "N1"] });
    await reorderLevels(actor(), ["N5", "N4", "N3", "N2", "N1"]);
  });

  it("rejects duplicates, missing, unknown and wrong-length orders without changing anything", async () => {
    for (const bad of [["N5", "N5", "N3", "N2", "N1"], ["N5", "N4", "N3", "N2"], ["N5", "N4", "N3", "N2", "N9"], []]) {
      expect(await code(reorderLevels(actor(), bad))).toBe("400:INVALID_ORDER");
    }
    expect((await listLevels()).map((l) => l.code)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
  });
});

describe("routes: authorization and validation (AC-CMS-01)", () => {
  it("EDITOR may read and edit levels; SUPPORT is 403 on every levels endpoint", async () => {
    expect((await listGET(req("EDITOR", "/api/v1/admin/levels"))).status).toBe(200);
    expect((await listGET(req("SUPPORT", "/api/v1/admin/levels"))).status).toBe(403);
    const ctx = { params: Promise.resolve({ code: "N4" }) };
    expect((await patchPATCH(req("SUPPORT", "/api/v1/admin/levels/N4", { passScore: 70 }, "PATCH"), ctx)).status).toBe(403);
    expect((await reorderPOST(req("SUPPORT", "/api/v1/admin/levels/reorder", { order: [] }, "POST"))).status).toBe(403);
    const ok = await patchPATCH(req("EDITOR", "/api/v1/admin/levels/N4", { passScore: 60 }, "PATCH"), ctx);
    expect(ok.status).toBe(200);
    expect((await ok.json()).data).toMatchObject({ code: "N4", passScore: 60 });
  });

  it("maps rule failures to 409/400 and rejects unknown body fields", async () => {
    const ctx = { params: Promise.resolve({ code: "N4" }) };
    const conflict = await patchPATCH(req("ADMIN", "/api/v1/admin/levels/N4", { enabled: true }, "PATCH"), ctx);
    expect(conflict.status).toBe(409);
    expect((await conflict.json()).error.code).toBe("LEVEL_NOT_PUBLISHED");
    expect((await patchPATCH(req("ADMIN", "/api/v1/admin/levels/N4", { passScore: "abc" }, "PATCH"), ctx)).status).toBe(400);
    expect((await patchPATCH(req("ADMIN", "/api/v1/admin/levels/N4", { status: "PUBLISHED" }, "PATCH"), ctx)).status).toBe(400);
    expect((await reorderPOST(req("ADMIN", "/api/v1/admin/levels/reorder", { order: ["N1"] }, "POST"))).status).toBe(400);
  });
});
