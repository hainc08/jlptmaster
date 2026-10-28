import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/server/db";
import { assertAdminRole, UnauthorizedRoleError } from "@/src/server/services/auth-service";

const CreateContentSchema = z.object({
  actorId: z.string().optional(),
  role: z.string().default("ADMIN"),
  levelId: z.string().default("N5"),
  kind: z.enum(["VOCAB", "KANJI", "GRAMMAR"]),
  slug: z.string().min(1),
  surface: z.string().optional(),
  reading: z.string().optional(),
  meaningVi: z.string().min(1),
  pos: z.string().optional(),
  pattern: z.string().optional(),
  formationVi: z.string().optional(),
  nuanceVi: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const kind = searchParams.get("kind");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (kind && kind !== "ALL") where.kind = kind;

    const items = await prisma.contentItem.findMany({
      where,
      include: {
        vocabulary: true,
        kanji: true,
        grammar: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ data: items });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "ADMIN_CONTENT_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = CreateContentSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Dữ liệu nội dung không hợp lệ", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { role, levelId, kind, slug, surface, reading, meaningVi, pos, pattern, formationVi, nuanceVi } =
      parsed.data;

    if (role !== "ADMIN" && role !== "EDITOR") {
      assertAdminRole(role);
    }

    const created = await prisma.contentItem.create({
      data: {
        levelId,
        kind,
        slug,
        status: "DRAFT",
        vocabulary:
          kind === "VOCAB"
            ? {
                create: {
                  surface: surface || slug,
                  reading: reading || "",
                  meaningVi,
                  pos: pos || "Danh từ",
                  exampleJa: `${surface || slug} の例文です。`,
                  exampleReading: `${reading || ""} のれいぶんです。`,
                  exampleVi: `Câu ví dụ cho ${meaningVi}.`,
                  searchNormalized: `${slug} ${surface || ""} ${reading || ""} ${meaningVi}`.toLowerCase(),
                },
              }
            : undefined,
        grammar:
          kind === "GRAMMAR"
            ? {
                create: {
                  pattern: pattern || slug,
                  formationVi: formationVi || "",
                  meaningVi,
                  explanationVi: meaningVi,
                  examplesJson: [],
                  nuanceVi: nuanceVi || "",
                },
              }
            : undefined,
      },
      include: {
        vocabulary: true,
        grammar: true,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    if (error instanceof UnauthorizedRoleError) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: error.message } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "ADMIN_CREATE_CONTENT_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

