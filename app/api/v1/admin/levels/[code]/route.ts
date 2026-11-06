import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, clientIp } from "@/src/server/services/admin-http";
import { updateLevel } from "@/src/server/services/admin-levels-service";

type CodeCtx = { params: Promise<{ code: string }> };

// .strict(): fields such as `status` are not editable here and must not be silently ignored.
const Patch = z
  .object({
    name: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    passScore: z.number().optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const PATCH = adminRoute<CodeCtx>("levels", async (req, actor, { params }) => {
  const { code } = await params;
  const patch = Patch.parse(await req.json().catch(() => ({})));
  return NextResponse.json({ data: await updateLevel(actor, code, patch, clientIp(req)) });
});
