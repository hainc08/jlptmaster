import { NextResponse } from "next/server";
import { adminRoute } from "@/src/server/services/admin-http";
import { listLevels } from "@/src/server/services/admin-levels-service";

export const GET = adminRoute("levels", async () => NextResponse.json({ data: await listLevels() }));
