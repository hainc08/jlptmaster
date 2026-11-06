import { NextResponse } from "next/server";
import { adminRouteWith, clientIp, type IdCtx } from "@/src/server/services/admin-http";
import { resetPassword } from "@/src/server/services/admin-members-service";

export const POST = adminRouteWith<IdCtx>("members", async (req, actor, { params }) => {
  const { id } = await params;
  return NextResponse.json({ data: await resetPassword(actor, id, clientIp(req)) });
});
