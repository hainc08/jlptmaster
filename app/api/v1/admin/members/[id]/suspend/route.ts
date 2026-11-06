import { adminRouteWith, clientIp, type IdCtx } from "@/src/server/services/admin-http";
import { suspendMember } from "@/src/server/services/admin-members-service";

export const POST = adminRouteWith<IdCtx>("members", async (req, actor, { params }) => {
  const { id } = await params;
  await suspendMember(actor, id, clientIp(req));
  return new Response(null, { status: 204 });
});
