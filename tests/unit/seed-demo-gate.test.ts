import { describe, it, expect } from "vitest";
import { shouldSeedDemoData } from "../../prisma/demo-credentials";

// The production start script runs prisma/seed.ts on every boot, so mock learners must never be seeded there.
describe("shouldSeedDemoData", () => {
  it("is off by default (production start has no demo flag)", () => {
    expect(shouldSeedDemoData({})).toBe(false);
    expect(shouldSeedDemoData({ SEED_DEMO_PASSWORDS: "0" })).toBe(false);
    expect(shouldSeedDemoData({ SEED_DEMO_PASSWORDS: "" })).toBe(false);
  });

  it("is on for local dev and CI, which opt in with SEED_DEMO_PASSWORDS=1", () => {
    expect(shouldSeedDemoData({ SEED_DEMO_PASSWORDS: "1" })).toBe(true);
    expect(shouldSeedDemoData({ SEED_DEMO_PASSWORDS: "1", NODE_ENV: "development" })).toBe(true);
    expect(shouldSeedDemoData({ SEED_DEMO_PASSWORDS: "1", NODE_ENV: "test" })).toBe(true);
  });

  it("stays off in production even if the demo flag leaks into the environment", () => {
    expect(shouldSeedDemoData({ SEED_DEMO_PASSWORDS: "1", NODE_ENV: "production" })).toBe(false);
  });
});
