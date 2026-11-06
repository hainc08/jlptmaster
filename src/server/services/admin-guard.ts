import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/src/server/db";
import {
  AuthRequiredError,
  UnauthorizedRoleError,
  requireSession,
  type SessionPayload,
} from "@/src/server/services/auth-service";

export const ADMIN_MODULES = ["dashboard", "members", "levels", "settings", "audit"] as const;
export type AdminModule = (typeof ADMIN_MODULES)[number];

/** OWNER is always allowed; every other role is decided by its `role_permissions` row. */
export async function can(role: Role, module: AdminModule): Promise<boolean> {
  if (role === "OWNER") return true;
  const row = await prisma.rolePermission.findUnique({ where: { role_module: { role, module } } });
  return row?.allowed === true;
}

/**
 * Authorizes an admin API call for one module. Identity comes from the signed session, but the
 * role and account state are re-read from the database so a demoted, suspended or anonymized
 * user cannot keep working with a still-valid token.
 */
export async function requireModule(req: NextRequest, module: AdminModule): Promise<SessionPayload> {
  const session = requireSession(req);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, status: true, deletedAt: true },
  });
  if (!user || user.status !== "ACTIVE" || user.deletedAt) throw new AuthRequiredError();
  if (!(await can(user.role, module))) {
    throw new UnauthorizedRoleError(`Truy cập bị từ chối: vai trò ${user.role} không có quyền module "${module}"`);
  }
  return { ...session, role: user.role };
}
