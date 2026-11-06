import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, clientIp, type IdCtx } from "@/src/server/services/admin-http";
import { deleteMember, getMember, updateMember } from "@/src/server/services/admin-members-service";

export const GET = adminRoute<IdCtx>("members", async (_req, _actor, { params }) => {
  const { id } = await params;
  return NextResponse.json({ data: await getMember(id) });
});

const PatchSchema = z
  .object({ displayName: z.string().trim().min(1).max(120).optional(), email: z.email().max(191).optional() })
  .refine((v) => v.displayName !== undefined || v.email !== undefined, { message: "Nothing to update" });

export const PATCH = adminRoute<IdCtx>("members", async (req, actor, { params }) => {
  const { id } = await params;
  const patch = PatchSchema.parse(await req.json().catch(() => ({})));
  return NextResponse.json({ data: await updateMember(actor, id, patch, clientIp(req)) });
});

export const DELETE = adminRoute<IdCtx>("members", async (req, actor, { params }) => {
  const { id } = await params;
  await deleteMember(actor, id, clientIp(req));
  return new Response(null, { status: 204 });
});
