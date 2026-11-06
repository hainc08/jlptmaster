import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/src/server/db";
import { recordAudit, redact, listAudit } from "@/src/server/services/audit-service";

const TAG = `audit-${Date.now()}`;
let actorId = "";

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { email: `${TAG}@test.invalid`, role: "ADMIN", displayName: "Audit Tester" },
  });
  actorId = u.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { actorId } });
  await prisma.user.delete({ where: { id: actorId } });
});

describe("audit redaction (AC-CMS-04)", () => {
  it("drops secret-looking keys recursively and keeps the rest", () => {
    expect(
      redact({ passwordHash: "x", Token: "t", nested: { sessionToken: "y", ok: 1 }, list: [{ secret: 1, a: 2 }] }),
    ).toEqual({ nested: { ok: 1 }, list: [{ a: 2 }] });
  });

  it("passes primitives, null and undefined through unchanged", () => {
    expect(redact(null)).toBeNull();
    expect(redact(undefined)).toBeUndefined();
    expect(redact("plain")).toBe("plain");
  });
});

describe("recordAudit / listAudit (AC-CMS-04)", () => {
  it("persists redacted before/after and the request ip", async () => {
    await recordAudit({
      actorId,
      action: "member.suspend",
      entityType: "member",
      entityId: "M-1",
      before: { status: "ACTIVE", passwordHash: "leak" },
      after: { status: "SUSPENDED" },
      ip: "113.190.24.7",
    });
    const row = await prisma.auditLog.findFirstOrThrow({ where: { actorId, action: "member.suspend" } });
    expect(row.beforeJson).toEqual({ status: "ACTIVE" });
    expect(row.afterJson).toEqual({ status: "SUSPENDED" });
    expect(row.ip).toBe("113.190.24.7");
    expect(JSON.stringify(row)).not.toMatch(/leak/);
  });

  it("joins inside a caller's transaction and rolls back with it", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await recordAudit({ actorId, action: "level.rolled_back", entityType: "level", entityId: "N5" }, tx);
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");
    expect(await prisma.auditLog.count({ where: { actorId, action: "level.rolled_back" } })).toBe(0);
  });

  it("filters by module prefix and returns actor display info with the diff", async () => {
    await recordAudit({ actorId, action: "level.update", entityType: "level", entityId: "N4", before: { a: 1 }, after: { a: 2 } });
    const res = await listAudit({ actor: actorId, module: "member", page: 1, perPage: 10 });
    expect(res.data.length).toBe(1);
    expect(res.data[0]).toMatchObject({
      action: "member.suspend",
      actor: { id: actorId, displayName: "Audit Tester", role: "ADMIN" },
      before: { status: "ACTIVE" },
      after: { status: "SUSPENDED" },
      ip: "113.190.24.7",
    });
    expect(res.total).toBe(1);
  });

  it("range 7d excludes older rows while 30d keeps them", async () => {
    await prisma.auditLog.create({
      data: {
        actorId, action: "settings.general", entityType: "settings", entityId: "general",
        metadataJsonRedacted: {}, createdAt: new Date(Date.now() - 10 * 86_400_000),
      },
    });
    const week = await listAudit({ actor: actorId, module: "settings", range: "7d", page: 1, perPage: 10 });
    const month = await listAudit({ actor: actorId, module: "settings", range: "30d", page: 1, perPage: 10 });
    expect(week.data).toHaveLength(0);
    expect(month.data).toHaveLength(1);
  });

  it("clamps perPage to 100 and returns an empty page past the end instead of failing", async () => {
    const big = await listAudit({ actor: actorId, page: 1, perPage: 500 });
    expect(big.perPage).toBe(100);
    const past = await listAudit({ actor: actorId, page: 999, perPage: 10 });
    expect(past.data).toEqual([]);
    expect(past.total).toBeGreaterThan(0);
  });

  it("newest entries come first", async () => {
    const res = await listAudit({ actor: actorId, range: "30d", page: 1, perPage: 100 });
    const times = res.data.map((r) => Date.parse(r.createdAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});
