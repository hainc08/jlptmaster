import { adminRoute, clientIp, type IdCtx } from "@/src/server/services/admin-http";
import { reactivateMember } from "@/src/server/services/admin-members-service";

export const POST = adminRoute<IdCtx>("members", async (req, actor, { params }) => {
  const { id } = await params;
  await reactivateMember(actor, id, clientIp(req));
  return new Response(null, { status: 204 });
});
