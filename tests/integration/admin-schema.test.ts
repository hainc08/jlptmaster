import { describe, it, expect } from "vitest";
import { prisma } from "@/src/server/db";

describe("Admin CMS schema + seed (AC-CMS-06/07/08 foundations)", () => {
  it("seeds the five levels in display order with N5 published and N4–N1 not", async () => {
    const levels = await prisma.jlptLevel.findMany({ orderBy: { displayOrder: "asc" } });
    expect(levels.map((l) => l.id)).toEqual(["N5", "N4", "N3", "N2", "N1"]);
    expect(levels.map((l) => l.status)).toEqual(["PUBLISHED", "DRAFT", "DRAFT", "COMING_SOON", "COMING_SOON"]);
    expect(levels.find((l) => l.id === "N5")!.isActive).toBe(true);
    for (const l of levels) {
      expect(l.passScore).toBe(60);
      expect(l.description.length).toBeGreaterThan(0);
    }
  });

  it("seeds a 4 roles × 5 modules permission matrix with the approved defaults", async () => {
    const rows = await prisma.rolePermission.findMany();
    expect(rows).toHaveLength(20);
    const allowed = (role: string) =>
      rows.filter((r) => r.role === role && r.allowed).map((r) => r.module).sort();
    const all = ["audit", "dashboard", "levels", "members", "settings"];
    expect(allowed("OWNER")).toEqual(all);
    expect(allowed("ADMIN")).toEqual(all);
    expect(allowed("EDITOR")).toEqual(["dashboard", "levels"]);
    expect(allowed("SUPPORT")).toEqual(["audit", "dashboard", "members"]);
  });

  it("seeds default system settings", async () => {
    const byKey = Object.fromEntries((await prisma.systemSetting.findMany()).map((s) => [s.key, s.valueJson]));
    expect(byKey.exam_rules).toEqual({ timeLimitMin: 105, retakeLimit: 3, passThreshold: 60 });
    expect(byKey.general).toEqual({ siteName: "JLPT Master", defaultLanguage: "vi" });
    expect(Object.keys(byKey.notifications as object).sort()).toEqual(
      ["examResult", "passwordReset", "planExpiry", "suspension", "weeklyDigest", "welcome"],
    );
  });

  it("seeds mock learners with names, plans and mixed statuses, and none can log in", async () => {
    const learners = await prisma.user.findMany({
      where: { role: "STUDENT", email: { endsWith: "@example.com" } },
    });
    expect(learners.length).toBeGreaterThanOrEqual(24);
    expect(learners.every((u) => u.displayName && u.passwordHash === null)).toBe(true);
    expect(new Set(learners.map((u) => u.plan)).size).toBe(3);
    expect(new Set(learners.map((u) => u.status)).size).toBeGreaterThanOrEqual(3);
  });
});
