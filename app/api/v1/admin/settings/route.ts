import { NextResponse } from "next/server";
import { adminRoute, clientIp } from "@/src/server/services/admin-http";
import { getSettings, updateSettings } from "@/src/server/services/admin-settings-service";

export const GET = adminRoute("settings", async () => NextResponse.json({ data: await getSettings() }));

export const PATCH = adminRoute("settings", async (req, actor) => {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ data: await updateSettings(actor, body, clientIp(req)) });
});
