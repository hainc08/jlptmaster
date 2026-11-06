import crypto from "node:crypto";
import { NextRequest } from "next/server";

export class OwnershipError extends Error {
  constructor(message: string = "Truy cập bị từ chối: Bạn không có quyền truy cập dữ liệu của học viên khác") {
    super(message);
    this.name = "OwnershipError";
  }
}

export class UnauthorizedRoleError extends Error {
  constructor(message: string = "Truy cập bị từ chối: Yêu cầu quyền ADMIN") {
    super(message);
    this.name = "UnauthorizedRoleError";
  }
}

export function assertUserOwnership(currentUserId: string, resourceOwnerId: string): void {
  if (!currentUserId || currentUserId !== resourceOwnerId) {
    throw new OwnershipError();
  }
}

export function assertAdminRole(role: string): void {
  if (role !== "ADMIN" && role !== "OWNER") {
    throw new UnauthorizedRoleError();
  }
}

export type SessionRole = "STUDENT" | "EDITOR" | "ADMIN" | "OWNER" | "SUPPORT";

export interface SessionPayload {
  userId: string;
  email: string;
  role: SessionRole;
  exp: number; // Unix timestamp in seconds
}

// Public development default (also in .env.example). Accepted outside production only.
const DEV_DEFAULT_SECRET = "jlpt_master_super_secret_session_key_32_chars_min";

/**
 * Session signing secret. Read on every call (not at import time) so a missing/invalid secret
 * fails closed in production at the first sign/verify instead of silently using a public default.
 */
function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET || "";
  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      throw new Error("AUTH_SECRET chưa được cấu hình. Hãy đặt AUTH_SECRET (tối thiểu 32 ký tự ngẫu nhiên) trong biến môi trường.");
    }
    if (secret.length < 32) {
      throw new Error("AUTH_SECRET quá ngắn: cần tối thiểu 32 ký tự.");
    }
    if (secret === DEV_DEFAULT_SECRET) {
      throw new Error("AUTH_SECRET đang dùng giá trị mặc định công khai; hãy đặt một chuỗi bí mật riêng.");
    }
    return secret;
  }
  return secret || DEV_DEFAULT_SECRET;
}

/**
 * Tạo token phiên đăng nhập có chữ ký bảo mật HMAC-SHA256
 */
export function signSessionToken(
  payload: { userId: string; email: string; role: SessionRole },
  expiresInSeconds: number = 86400 * 7
): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Thẩm định chữ ký mật mã của token phiên làm việc
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;

  let expectedSig: string;
  try {
    expectedSig = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
  } catch {
    return null; // misconfigured secret in production: no token is ever valid (login fails loudly instead)
  }

  // Timing safe comparison to protect against side-channel timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired token
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Trích xuất và giải mã thông tin phiên từ request (Cookie, Authorization Bearer, hoặc Header)
 */
export function resolveSession(req: NextRequest): SessionPayload | null {
  // 1. Kiểm tra HttpOnly Cookie "jlpt_session" qua req.cookies hoặc raw header
  let cookieToken = req.cookies?.get?.("jlpt_session")?.value;
  if (!cookieToken) {
    const rawCookie = req.headers?.get?.("cookie");
    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)jlpt_session=([^;]+)/);
      if (match?.[1]) {
        cookieToken = match[1];
      }
    }
  }

  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified) return verified;
  }

  // 2. Kiểm tra Header "Authorization: Bearer <token>"
  const authHeader = req.headers?.get?.("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    const verified = verifySessionToken(bearerToken);
    if (verified) return verified;
  }

  // 3. Fallback header kiểm thử "x-jlpt-session"
  const customHeaderToken = req.headers?.get?.("x-jlpt-session");
  if (customHeaderToken) {
    const verified = verifySessionToken(customHeaderToken);
    if (verified) return verified;
  }

  return null;
}

export class AuthRequiredError extends Error {
  constructor(message: string = "Yêu cầu đăng nhập") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

/** Identity comes ONLY from the signed session; never from body/query. */
export function requireSession(req: NextRequest): SessionPayload {
  const session = resolveSession(req);
  if (!session) throw new AuthRequiredError();
  return session;
}

export function requireAdminSession(req: NextRequest): SessionPayload {
  const session = requireSession(req);
  assertAdminRole(session.role);
  return session;
}

/** Maps auth errors to 401/403 responses; returns null for other errors. */
export function authErrorResponse(error: unknown): Response | null {
  if (error instanceof AuthRequiredError) {
    return Response.json({ error: { code: "UNAUTHORIZED", message: error.message } }, { status: 401 });
  }
  if (error instanceof UnauthorizedRoleError || error instanceof OwnershipError) {
    return Response.json({ error: { code: "FORBIDDEN", message: error.message } }, { status: 403 });
  }
  return null;
}
