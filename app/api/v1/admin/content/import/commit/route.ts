import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import { validateCsvRows } from "@/src/server/services/csv-import-service";
import { assertAdminRole, UnauthorizedRoleError } from "@/src/server/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role: string = body.role || "STUDENT";
    const actorId: string | undefined = body.actorId;
    const rows = Array.isArray(body.rows) ? body.rows : [];

    assertAdminRole(role);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: { code: "EMPTY_PAYLOAD", message: "Danh sách dòng CSV trống" } },
        { status: 400 }
      );
    }

    const validation = validateCsvRows(rows);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: {
            code: "CSV_VALIDATION_FAILED",
            message: "Tệp CSV có dòng lỗi, hủy giao dịch nhập dữ liệu (không ghi một phần)",
            details: validation.rows.filter((r) => r.status === "ERROR"),
          },
        },
        { status: 400 }
      );
    }

    const insertedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const item of validation.rows) {
        if (!item.data) continue;
        const v = item.data;
        const slug = `vocab-${v.romaji.toLowerCase().replace(/\s+/g, "-")}`;
        const searchNormalized = `${v.romaji} ${v.surface} ${v.reading} ${v.meaningVi}`.toLowerCase();

        await tx.contentItem.create({
          data: {
            levelId: "N5",
            kind: "VOCAB",
            slug,
            status: "PUBLISHED",
            publishedAt: new Date(),
            vocabulary: {
              create: {
                surface: v.surface,
                reading: v.reading,
                meaningVi: v.meaningVi,
                pos: v.pos,
                exampleJa: `${v.surface} はとても大切です。`,
                exampleReading: `${v.reading} はとてもたいせつです。`,
                exampleVi: `Ví dụ: ${v.meaningVi} rất quan trọng.`,
                searchNormalized,
              },
            },
          },
        });
        count++;
      }

      if (actorId) {
        await tx.auditLog.create({
          data: {
            actorId,
            action: "CSV_IMPORT_COMMIT",
            entityType: "VocabularyBatch",
            entityId: actorId,
            metadataJsonRedacted: { insertedCount: count },
          },
        });
      }

      return count;
    });

    return NextResponse.json({
      data: {
        insertedCount,
      },
    });
  } catch (error: any) {
    if (error instanceof UnauthorizedRoleError) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "CSV_COMMIT_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

