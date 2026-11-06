import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/src/server/services/admin-http";
import { listAudit } from "@/src/server/services/audit-service";

const blank = (v: unknown) => (v === "" || v === null ? undefined : v);
const Query = z.object({
  actor: z.preprocess(blank, z.string().max(36).optional()),
  module: z.preprocess(blank, z.string().max(30).optional()),
  range: z.preprocess(blank, z.enum(["7d", "30d"]).optional()),
  page: z.preprocess(blank, z.coerce.number().catch(1).optional()),
  perPage: z.preprocess(blank, z.coerce.number().catch(10).optional()),
});

export const GET = adminRoute("audit", async (req) => {
  const q = Query.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));
  const result = await listAudit({ ...q, page: q.page ?? 1, perPage: q.perPage ?? 10 });
  return NextResponse.json(result);
});
