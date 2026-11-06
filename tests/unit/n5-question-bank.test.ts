import { describe, it, expect } from "vitest";
import { N5_QUESTION_BANK } from "@/prisma/n5-questions";

const VIETNAMESE_CHARS = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

describe("N5 question bank (seed content)", () => {
  it("has 20 questions with unique prompts", () => {
    expect(N5_QUESTION_BANK).toHaveLength(20);
    const prompts = N5_QUESTION_BANK.map((q) => q.prompt);
    expect(new Set(prompts).size).toBe(20);
  });

  it("every question has 4 distinct Japanese-only options and exactly one correct answer", () => {
    for (const q of N5_QUESTION_BANK) {
      expect(q.options, q.prompt).toHaveLength(4);
      expect(new Set(q.options).size, q.prompt).toBe(4);
      expect(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4, q.prompt).toBe(true);
      for (const opt of q.options) {
        expect(opt.trim().length, q.prompt).toBeGreaterThan(0);
        expect(VIETNAMESE_CHARS.test(opt), `option "${opt}" must not contain Vietnamese`).toBe(false);
        expect(/chính xác|đúng|correct|lựa chọn/i.test(opt), `option "${opt}" must not reveal the answer`).toBe(false);
      }
    }
  });

  it("does not always put the correct answer in the same position", () => {
    const positions = new Set(N5_QUESTION_BANK.map((q) => q.correctIndex));
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });

  it("explanations are Vietnamese and name the correct answer", () => {
    for (const q of N5_QUESTION_BANK) {
      expect(VIETNAMESE_CHARS.test(q.explanationVi), q.prompt).toBe(true);
      expect(q.explanationVi.includes(q.options[q.correctIndex]), q.prompt).toBe(true);
    }
  });

  it("covers several skills so the weak-skill roadmap is meaningful", () => {
    const tags = new Set(N5_QUESTION_BANK.map((q) => q.skillTag));
    expect(tags).toEqual(new Set(["Từ vựng N5", "Chữ Hán N5", "Ngữ pháp N5"]));
  });
});
