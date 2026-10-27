import { NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET() {
  try {
    const levels = await prisma.jlptLevel.findMany({
      orderBy: { rankOrder: "asc" },
    });
    return NextResponse.json({ data: levels });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "DB_ERROR", message: error.message } }, { status: 500 });
  }
}
