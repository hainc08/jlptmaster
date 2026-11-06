import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { needsBaseline, listMigrationNames } from "@/scripts/db-migrate.mjs";

const root = path.resolve(__dirname, "../..");
const migrationsDir = path.join(root, "prisma/migrations");

function allMigrationSql(): string {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => fs.readFileSync(path.join(migrationsDir, d.name, "migration.sql"), "utf8"))
    .join("\n");
}

describe("Prisma migrations (replaces `prisma db push`)", () => {
  it("has a MySQL migration lock and at least one migration", () => {
    const lock = fs.readFileSync(path.join(migrationsDir, "migration_lock.toml"), "utf8");
    expect(lock).toMatch(/provider\s*=\s*"mysql"/);
    expect(listMigrationNames(migrationsDir).length).toBeGreaterThan(0);
  });

  it("migrations create every table declared with @@map in schema.prisma (no schema drift)", () => {
    const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
    const tables = [...schema.matchAll(/@@map\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(tables.length).toBeGreaterThanOrEqual(26);
    const sql = allMigrationSql();
    for (const t of tables) {
      expect(sql, `table ${t}`).toMatch(new RegExp("CREATE TABLE `" + t + "`"));
    }
  });

  it("never uses prisma db push in deploy/startup scripts", () => {
    for (const f of ["scripts/setup-db.mjs", "scripts/start-production.mjs"]) {
      const src = fs.readFileSync(path.join(root, f), "utf8");
      expect(src, f).not.toMatch(/"db",\s*"push"/);
      expect(src, f).toMatch(/migrate/);
    }
  });
});

describe("needsBaseline (existing DB created by db push)", () => {
  it("detects Prisma P3005 'database schema is not empty'", () => {
    expect(needsBaseline("Error: P3005\nThe database schema is not empty.")).toBe(true);
    expect(needsBaseline("Error: P3005")).toBe(true);
  });
  it("does not trigger on other failures", () => {
    expect(needsBaseline("Error: P1001 Can't reach database server")).toBe(false);
    expect(needsBaseline("")).toBe(false);
  });
});
