import { adminRoute } from "@/src/server/services/admin-http";
import { exportMembersCsv, parseMemberQuery } from "@/src/server/services/admin-members-service";

export const GET = adminRoute("members", async (req) => {
  const csv = await exportMembersCsv(parseMemberQuery(new URL(req.url).searchParams));
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="members-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
});
