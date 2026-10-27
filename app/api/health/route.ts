import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET() {
  try {
    // Check MariaDB connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "HEALTHY",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "MARIADB_CONNECTED",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "UNHEALTHY",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
