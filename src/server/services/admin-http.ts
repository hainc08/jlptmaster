import type { NextRequest } from "next/server";
import { requireModule, type AdminModule } from "@/src/server/services/admin-guard";
import { handleAdminError } from "@/src/server/services/admin-errors";
import type { SessionPayload } from "@/src/server/services/auth-service";

/** Wraps a route handler: authorizes the module first, then maps every failure to the error envelope. */
export function adminRoute(
  module: AdminModule,
  handler: (req: NextRequest, actor: SessionPayload) => Promise<Response>,
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      return await handler(req, await requireModule(req, module));
    } catch (error) {
      return handleAdminError(error);
    }
  };
}

/** Same as adminRoute for dynamic segments; the second argument must be required for Next's generated route types. */
export function adminRouteWith<C>(
  module: AdminModule,
  handler: (req: NextRequest, actor: SessionPayload, ctx: C) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await handler(req, await requireModule(req, module), ctx);
    } catch (error) {
      return handleAdminError(error);
    }
  };
}

export function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (fwd || req.headers.get("x-real-ip") || null)?.slice(0, 45) ?? null;
}

export type IdCtx = { params: Promise<{ id: string }> };
