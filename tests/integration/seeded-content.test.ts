import { describe, it, expect } from "vitest";
import { prisma } from "@/src/server/db";

describe("Seeded N5 content in MariaDB", () => {
  it("no published N5 question has placeholder text or an answer-revealing option", async () => {
    const questions = await prisma.question.findMany({
      where: { levelId: "N5", status: "PUBLISHED" },
      include: { options: true },
    });
    expect(questions.length).toBeGreaterThanOrEqual(20);
    for (const q of questions) {
      const prompt = (q.promptJson as { text?: string }).text ?? "";
      expect(prompt, "placeholder prompt").not.toMatch(/Câu hỏi luyện tập N5 số/);
      expect(q.options.filter((o) => o.isCorrect), prompt).toHaveLength(1);
      for (const o of q.options) {
        const text = (o.textJson as { text?: string }).text ?? "";
        expect(text, `option of "${prompt}"`).not.toMatch(/chính xác|lựa chọn/i);
      }
    }
  });

  it("the N5 mock exam links 28 distinct questions across all three sections", async () => {
    const exam = await prisma.exam.findFirstOrThrow({
      where: { levelId: "N5", status: "PUBLISHED", NOT: { title: { startsWith: "TEST platform" } } },
      include: { sections: { orderBy: { position: "asc" }, include: { examQuestions: true } } },
    });
    const ids = exam.sections.flatMap((s) => s.examQuestions.map((e) => e.questionId));
    expect(ids).toHaveLength(28);
    expect(new Set(ids).size).toBe(28);
  });
});
