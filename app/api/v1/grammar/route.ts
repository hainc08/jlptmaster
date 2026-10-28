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
        { pattern: { contains: q } },
        { meaningVi: { contains: q } },
        { explanationVi: { contains: q } },
      ];
    }

    const items = await prisma.grammar.findMany({
      where,
      take: 100,
      orderBy: { pattern: "asc" },
    });

    return NextResponse.json({ data: items });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "GRAMMAR_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

