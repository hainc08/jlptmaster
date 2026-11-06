import { NextResponse } from "next/server";
import { adminRoute, clientIp } from "@/src/server/services/admin-http";
import { getRoleMatrix, putRoleMatrix } from "@/src/server/services/admin-settings-service";

export const GET = adminRoute("settings", async () => NextResponse.json({ data: await getRoleMatrix() }));

export const PUT = adminRoute("settings", async (req, actor) => {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ data: await putRoleMatrix(actor, body, clientIp(req)) });
});
