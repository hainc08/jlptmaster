import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { assertAdminRole, UnauthorizedRoleError } from "@/src/server/services/auth-service";

const PublishSchema = z.object({
  actorId: z.string().optional(),
  role: z.string().default("STUDENT"),
  status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const rawBody = await req.json().catch(() => ({}));
    const parsed = PublishSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Yêu cầu duyệt nội dung không hợp lệ" } },
        { status: 400 }
      );
    }

    const { actorId, role, status } = parsed.data;
    assertAdminRole(role);

    let resolvedActorId = actorId;
    if (!resolvedActorId) {
      const admin = await prisma.user.findUnique({
        where: { email: "admin@jlptmaster.vn" },
      });
      resolvedActorId = admin?.id;
    }

    const item = await prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!item) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Không tìm thấy mục nội dung" } },
        { status: 404 }
      );
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.contentItem.update({
        where: { id: contentId },
        data: {
          status,
          reviewerId: resolvedActorId || null,
          publishedAt: status === "PUBLISHED" ? now : item.publishedAt,
        },
      });

      if (resolvedActorId) {
        await tx.auditLog.create({
          data: {
            actorId: resolvedActorId,
            action: `CONTENT_STATUS_${status}`,
            entityType: "ContentItem",
            entityId: contentId,
            metadataJsonRedacted: {
              previousStatus: item.status,
              newStatus: status,
              slug: item.slug,
            },
          },
        });
      }

      return res;
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error instanceof UnauthorizedRoleError) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "PUBLISH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

