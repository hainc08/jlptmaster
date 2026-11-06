import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordPolicy } from "@/src/server/services/password-service";

describe("password-service (scrypt)", () => {
  it("hashes to a self-describing, salted string that is not the password", async () => {
    const h1 = await hashPassword("Correct-Horse-9");
    const h2 = await hashPassword("Correct-Horse-9");
    expect(h1).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=_-]+\$[A-Za-z0-9+/=_-]+$/);
    expect(h1).not.toContain("Correct-Horse-9");
    expect(h1).not.toBe(h2); // random salt
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const h = await hashPassword("Correct-Horse-9");
    expect(await verifyPassword("Correct-Horse-9", h)).toBe(true);
    expect(await verifyPassword("correct-horse-9", h)).toBe(false);
    expect(await verifyPassword("", h)).toBe(false);
  });

  it("returns false (never throws) for malformed or placeholder hashes", async () => {
    for (const bad of [
      "",
      "plaintext",
      "$argon2id$v=19$m=65536,t=3,p=4$local_demo_hash_admin",
      "scrypt$x$y$z$a$b",
      "scrypt$16384$8$1$AAAA",
    ]) {
      expect(await verifyPassword("anything", bad)).toBe(false);
    }
  });

  it("enforces the password policy", () => {
    expect(validatePasswordPolicy("Abcdef12", "a@b.com").ok).toBe(true);
    expect(validatePasswordPolicy("short1", "a@b.com").ok).toBe(false); // < 8
    expect(validatePasswordPolicy("onlyletters", "a@b.com").ok).toBe(false); // no digit
    expect(validatePasswordPolicy("12345678", "a@b.com").ok).toBe(false); // no letter
    expect(validatePasswordPolicy("x".repeat(200) + "1", "a@b.com").ok).toBe(false); // too long
    expect(validatePasswordPolicy("minh12345", "minh@jlptmaster.vn").ok).toBe(false); // contains email name
    expect(validatePasswordPolicy("Abcdef12", "a@b.com").message ?? "").toBe("");
  });
});
