import { NextRequest, NextResponse } from "next/server";
import { validateCsvRows } from "@/src/server/services/csv-import-service";
import { assertAdminRole, UnauthorizedRoleError } from "@/src/server/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role: string = body.role || "ADMIN";

    if (role !== "EDITOR") {
      assertAdminRole(role);
    }

    const rows = Array.isArray(body.rows) ? body.rows : [];
    const validation = validateCsvRows(rows);

    return NextResponse.json({
      data: {
        totalRows: rows.length,
        isValid: validation.isValid,
        validCount: validation.validCount,
        errorCount: validation.errorCount,
        previewRows: validation.rows,
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
      { error: { code: "CSV_PREVIEW_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

