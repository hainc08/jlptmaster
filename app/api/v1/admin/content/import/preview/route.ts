import { NextRequest, NextResponse } from "next/server";
import { validateCsvRows } from "@/src/server/services/csv-import-service";
import { requireAdminSession, authErrorResponse } from "@/src/server/services/auth-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    requireAdminSession(req);

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
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json(
      { error: { code: "CSV_PREVIEW_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}

