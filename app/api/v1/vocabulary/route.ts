import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase().trim();
    const pos = searchParams.get("pos");

    const where: any = {};
    if (q) {
      where.searchNormalized = {
        contains: q,
      };
    }
    if (pos && pos !== "ALL") {
      where.pos = pos;
    }

    const items = await prisma.vocabulary.findMany({
      where,
      take: 50,
      orderBy: { surface: "asc" },
    });

    return NextResponse.json({ data: items });
  } catch (error: any) {
    return NextResponse.json({ error: { code: "QUERY_FAILED", message: error.message } }, { status: 500 });
  }
}
