import { describe, it, expect } from "vitest";
import { validateCsvRows, CsvVocabRow } from "../../src/server/services/csv-import-service";

describe("CSV Batch Import — Dry-Run Validation & Deduplication", () => {
  it("successfully validates compliant vocabulary rows", () => {
    const rawRows: CsvVocabRow[] = [
      { surface: "先生", reading: "せんせい", meaningVi: "Thầy cô giáo", pos: "Danh từ", romaji: "sensei" },
      { surface: "学生", reading: "がくせい", meaningVi: "Học sinh", pos: "Danh từ", romaji: "gakusei" },
    ];

    const result = validateCsvRows(rawRows);
    expect(result.isValid).toBe(true);
    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.rows[0].status).toBe("VALID");
  });

  it("identifies row-level errors and missing fields without partial write", () => {
    const rawRows: any[] = [
      { surface: "雨", reading: "あめ", meaningVi: "Cơn mưa", pos: "Danh từ", romaji: "ame" },
      { surface: "大きい", reading: "", meaningVi: "To lớn", pos: "Tính từ", romaji: "ookii" }, // Missing reading!
      { surface: "", reading: "いく", meaningVi: "Đi", pos: "Động từ", romaji: "iku" }, // Missing surface!
    ];

    const result = validateCsvRows(rawRows);
    expect(result.isValid).toBe(false);
    expect(result.validCount).toBe(1);
    expect(result.errorCount).toBe(2);

    expect(result.rows[1].status).toBe("ERROR");
    expect(result.rows[1].error).toContain("reading");

    expect(result.rows[2].status).toBe("ERROR");
    expect(result.rows[2].error).toContain("surface");
  });
});
