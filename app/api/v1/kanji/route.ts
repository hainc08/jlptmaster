import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level") || "N5";
    const q = searchParams.get("q")?.trim();

    const where: any = {
      contentItem: {
        levelId: level,
        status: "PUBLISHED",
      },
    };

    if (q) {
      where.OR = [
        { character: { contains: q } },
        { hanViet: { contains: q } },
        { meaningVi: { contains: q } },
      ];
    }

    const items = await prisma.kanji.findMany({
      where,
      take: 100,
      orderBy: { strokes: "asc" },
    });

    return NextResponse.json({ data: items });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "KANJI_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

