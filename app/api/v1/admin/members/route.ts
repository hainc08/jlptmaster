import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, clientIp } from "@/src/server/services/admin-http";
import { createMember, listMembers, parseMemberQuery } from "@/src/server/services/admin-members-service";

export const GET = adminRoute("members", async (req) => {
  const result = await listMembers(parseMemberQuery(new URL(req.url).searchParams));
  return NextResponse.json(result);
});

const CreateSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.email().max(191),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  plan: z.enum(["FREE", "STANDARD", "PREMIUM"]),
});

export const POST = adminRoute("members", async (req, actor) => {
  const body = CreateSchema.parse(await req.json().catch(() => ({})));
  const member = await createMember(actor, body, clientIp(req));
  return NextResponse.json({ data: member }, { status: 201 });
});
