import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Passwords are hashed with scrypt (built into Node, no extra dependency).
// Stored format: scrypt$N$r$p$<salt base64url>$<hash base64url>
const N = 16384; // CPU/memory cost (2^14)
const R = 8;
const P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;
const MAX_PASSWORD_LENGTH = 128;

function scrypt(password: string, salt: Buffer, keyLen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keyLen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

/** Never throws: any malformed/placeholder hash simply does not verify. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  try {
    if (typeof password !== "string" || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) return false;
    if (typeof stored !== "string") return false;
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (![n, r, p].every((v) => Number.isInteger(v) && v > 0) || n > 1 << 20) return false;
    const salt = Buffer.from(parts[4], "base64url");
    const expected = Buffer.from(parts[5], "base64url");
    if (salt.length < 8 || expected.length < 16) return false;
    const actual = await scrypt(password, salt, expected.length, { N: n, r, p, maxmem: 256 * 1024 * 1024 });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Used to spend the same time on unknown accounts as on real ones (reduces user enumeration by timing). */
let dummyHashPromise: Promise<string> | null = null;
export function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHashPromise;
}

export function validatePasswordPolicy(password: string, email: string): { ok: boolean; message?: string } {
  if (typeof password !== "string" || password.length < 8) {
    return { ok: false, message: "Mật khẩu phải có ít nhất 8 ký tự." };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `Mật khẩu tối đa ${MAX_PASSWORD_LENGTH} ký tự.` };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, message: "Mật khẩu phải gồm cả chữ và số." };
  }
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && password.toLowerCase().includes(local)) {
    return { ok: false, message: "Mật khẩu không được chứa phần tên của email." };
  }
  return { ok: true };
}
