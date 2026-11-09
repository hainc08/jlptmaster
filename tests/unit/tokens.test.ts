import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("design tokens", () => {
  it("uses the approved learner palette", () => {
    expect(css).toContain("--primary: #3730A3;");
    expect(css).toContain("--accent: #C0331B;");
    expect(css).toContain("--primary-container: #E3E1FF;");
    expect(css).toContain("--locked: #5E5E68;");
  });

  it("hides furigana without collapsing layout", () => {
    expect(css).toMatch(/\.furigana-hidden rt\s*\{[^}]*visibility:\s*hidden/);
  });
});
