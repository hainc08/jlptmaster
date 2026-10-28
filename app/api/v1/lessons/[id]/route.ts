import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        course: true,
        contentItems: {
          where: { status: "PUBLISHED" },
          include: {
            vocabulary: true,
            kanji: true,
            grammar: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy bài học" } },
        { status: 404 }
      );
    }

    let progress = null;
    if (userId) {
      progress = await prisma.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: lesson.id,
          },
        },
      });
    }

    return NextResponse.json({
      data: {
        ...lesson,
        completionStatus: progress?.status || "IN_PROGRESS",
        completedAt: progress?.completedAt || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "LESSON_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

