import { z } from "zod";
import { adminRouteWith, clientIp, type IdCtx } from "@/src/server/services/admin-http";
import { changeLevel } from "@/src/server/services/admin-members-service";

const Body = z.object({ level: z.string().min(1).max(2) });

export const POST = adminRouteWith<IdCtx>("members", async (req, actor, { params }) => {
  const { id } = await params;
  const { level } = Body.parse(await req.json().catch(() => ({})));
  await changeLevel(actor, id, level, clientIp(req));
  return new Response(null, { status: 204 });
});
