import { z } from "zod";

export const CsvVocabSchema = z.object({
  surface: z.string().min(1, "Trường 'surface' (chữ Hán/chữ gốc) không được để trống"),
  reading: z.string().min(1, "Trường 'reading' (phiên âm Hiragana) không được để trống"),
  meaningVi: z.string().min(1, "Trường 'meaningVi' (nghĩa tiếng Việt) không được để trống"),
  pos: z.string().min(1, "Trường 'pos' (từ loại) không được để trống"),
  romaji: z.string().min(1, "Trường 'romaji' không được để trống"),
});

export type CsvVocabRow = z.infer<typeof CsvVocabSchema>;

export interface ValidatedRowResult {
  line: number;
  data: CsvVocabRow | null;
  status: "VALID" | "ERROR";
  error?: string;
}

export function validateCsvRows(rows: any[]) {
  const validatedRows: ValidatedRowResult[] = [];
  let validCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const raw = rows[idx];
    const parse = CsvVocabSchema.safeParse(raw);

    if (parse.success) {
      validCount++;
      validatedRows.push({
        line: idx + 1,
        data: parse.data,
        status: "VALID",
      });
    } else {
      errorCount++;
      const errorMsg = parse.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      validatedRows.push({
        line: idx + 1,
        data: null,
        status: "ERROR",
        error: errorMsg,
      });
    }
  }

  return {
    isValid: errorCount === 0,
    validCount,
    errorCount,
    rows: validatedRows,
  };
}
