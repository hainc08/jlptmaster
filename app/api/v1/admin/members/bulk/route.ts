import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, clientIp } from "@/src/server/services/admin-http";
import { bulkAction } from "@/src/server/services/admin-members-service";

const Body = z.object({
  ids: z.array(z.string().min(1).max(36)).min(1).max(200),
  action: z.enum(["suspend", "change-level"]),
  level: z.string().max(2).optional(),
});

export const POST = adminRoute("members", async (req, actor) => {
  const body = Body.parse(await req.json().catch(() => ({})));
  return NextResponse.json(await bulkAction(actor, body, clientIp(req)));
});
