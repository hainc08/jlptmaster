import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { requireAdminSession, authErrorResponse } from "@/src/server/services/auth-service";

const LockSchema = z.object({ locked: z.boolean() });

// Lock = status ARCHIVED (hidden, cannot start new attempts).
// Unlock = status PUBLISHED. Attempts already in progress are not affected.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actorId = requireAdminSession(req).userId;
    const { id } = await params;
    const parsed = LockSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Thiếu trường locked (true/false)" } },
        { status: 400 }
      );
    }
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Không tìm thấy bộ đề" } }, { status: 404 });
    }

    const { locked } = parsed.data;
    const nextStatus = locked ? "ARCHIVED" : "PUBLISHED";
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.exam.update({
        where: { id },
        data: {
          status: nextStatus,
          publishedAt: !locked && !exam.publishedAt ? new Date() : exam.publishedAt,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: locked ? "EXAM_LOCKED" : "EXAM_UNLOCKED",
          entityType: "Exam",
          entityId: id,
          metadataJsonRedacted: { previousStatus: exam.status, newStatus: nextStatus },
        },
      });
      return res;
    });

    return NextResponse.json({ data: { id: updated.id, status: updated.status, isLocked: locked } });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: { code: "EXAM_LOCK_FAILED", message: error.message } }, { status: 500 });
  }
}
