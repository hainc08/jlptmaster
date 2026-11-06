import { z } from "zod";
import { adminRoute, clientIp } from "@/src/server/services/admin-http";
import { reorderLevels } from "@/src/server/services/admin-levels-service";

const Body = z.object({ order: z.array(z.string().max(2)).max(10) });

export const POST = adminRoute("levels", async (req, actor) => {
  const { order } = Body.parse(await req.json().catch(() => ({})));
  await reorderLevels(actor, order, clientIp(req));
  return new Response(null, { status: 204 });
});
