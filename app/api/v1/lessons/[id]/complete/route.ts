import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = requireSession(req);

    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy bài học" } },
        { status: 404 }
      );
    }

    // Idempotent upsert on (userId, lessonId)
    const now = new Date();
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId: lesson.id,
        },
      },
      update: {
        status: "COMPLETED",
      },
      create: {
        userId,
        lessonId: lesson.id,
        status: "COMPLETED",
        completedAt: now,
      },
    });

    return NextResponse.json({
      data: {
        lessonId: lesson.id,
        status: progress.status,
        completedAt: progress.completedAt || now,
      },
    });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "COMPLETE_LESSON_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

