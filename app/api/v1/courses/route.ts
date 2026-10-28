import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level") || "N5";

    const courses = await prisma.course.findMany({
      where: {
        levelId: level,
        status: "PUBLISHED",
      },
      include: {
        lessons: {
          where: { status: "PUBLISHED" },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ data: courses });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "COURSES_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

