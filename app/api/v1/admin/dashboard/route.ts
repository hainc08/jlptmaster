import { NextResponse } from "next/server";
import { adminRoute } from "@/src/server/services/admin-http";
import { getDashboard } from "@/src/server/services/admin-dashboard-service";

export const GET = adminRoute("dashboard", async () => NextResponse.json({ data: await getDashboard() }));
