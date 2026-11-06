import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { examFileSchema, flattenItems, type ExamFile } from "@/prisma/content/schema";
import { N5_QUESTION_BANK } from "@/prisma/n5-questions";
import { N5_READING_PASSAGES, N5_LISTENING_TRACKS } from "@/prisma/n5-reading-listening";

const VIETNAMESE_CHARS = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const REVEAL = /chính xác|đúng|correct|lựa chọn/i;
const ORIGINAL_SOURCE = "Nội dung gốc do đội ngũ dự án biên soạn";

type Expected = {
  file: string;
  prefix: string;
  /** section -> total questions */
  sections: Record<string, number>;
  /** partKey -> question count */
  parts: Record<string, number>;
};

// Số câu theo dạng đề (xem docs/plan/content-import-plan.md mục 4). Thêm cấp mới = thêm một dòng ở đây (RED trước).
export const EXPECTED: Record<string, Expected> = {
  N5: {
    file: "prisma/content/n5/exam-02.json",
    prefix: "n5-",
    sections: { VOCAB: 35, GRAMMAR_READING: 32, LISTENING: 24 },
    parts: {
      "kanji-yomi": 12,
      "hyouki": 8,
      "bunmyaku": 10,
      "iikae": 5,
      "bunpo": 16,
      "narabekae": 5,
      "bunsho-bunpo": 5,
      "dokkai-tan": 3,
      "dokkai-chu": 2,
      "joho": 1,
      "choukai-kadai": 7,
      "choukai-point": 6,
      "choukai-hatsuwa": 5,
      "choukai-sokuji": 6,
    },
  },
  N1: {
    file: "prisma/content/n1/exam-01.json",
    prefix: "n1-",
    sections: { VOCAB: 25, GRAMMAR_READING: 44, LISTENING: 37 },
    parts: {
      "kanji-yomi": 6,
      "bunmyaku": 7,
      "iikae": 6,
      "youhou": 6,
      "bunpo": 10,
      "narabekae": 5,
      "bunsho-bunpo": 5,
      "dokkai-tan": 4,
      "dokkai-chu": 9,
      "dokkai-tougou": 2,
      "dokkai-cho": 4,
      "dokkai-shucho": 3,
      "joho": 2,
      "choukai-kadai": 6,
      "choukai-point": 7,
      "choukai-gaiyou": 6,
      "choukai-sokuji": 14,
      "choukai-tougou": 4,
    },
  },
  N2: {
    file: "prisma/content/n2/exam-01.json",
    prefix: "n2-",
    sections: { VOCAB: 32, GRAMMAR_READING: 43, LISTENING: 32 },
    parts: {
      "kanji-yomi": 5,
      "hyouki": 5,
      "goukei": 5,
      "bunmyaku": 7,
      "iikae": 5,
      "youhou": 5,
      "bunpo": 12,
      "narabekae": 5,
      "bunsho-bunpo": 5,
      "dokkai-tan": 5,
      "dokkai-chu": 9,
      "dokkai-tougou": 2,
      "dokkai-cho": 3,
      "joho": 2,
      "choukai-kadai": 5,
      "choukai-point": 6,
      "choukai-gaiyou": 5,
      "choukai-sokuji": 12,
      "choukai-tougou": 4,
    },
  },
  N3: {
    file: "prisma/content/n3/exam-01.json",
    prefix: "n3-",
    sections: { VOCAB: 35, GRAMMAR_READING: 38, LISTENING: 28 },
    parts: {
      "kanji-yomi": 8,
      "hyouki": 6,
      "bunmyaku": 11,
      "iikae": 5,
      "youhou": 5,
      "bunpo": 13,
      "narabekae": 5,
      "bunsho-bunpo": 5,
      "dokkai-tan": 4,
      "dokkai-chu": 6,
      "dokkai-cho": 4,
      "joho": 1,
      "choukai-kadai": 6,
      "choukai-point": 6,
      "choukai-gaiyou": 3,
      "choukai-hatsuwa": 4,
      "choukai-sokuji": 9,
    },
  },
  N4: {
    file: "prisma/content/n4/exam-01.json",
    prefix: "n4-",
    sections: { VOCAB: 30, GRAMMAR_READING: 35, LISTENING: 28 },
    parts: {
      "kanji-yomi": 9,
      "hyouki": 6,
      "bunmyaku": 10,
      "iikae": 5,
      "bunpo": 15,
      "narabekae": 5,
      "bunsho-bunpo": 5,
      "dokkai-tan": 4,
      "dokkai-chu": 4,
      "joho": 2,
      "choukai-kadai": 8,
      "choukai-point": 7,
      "choukai-hatsuwa": 5,
      "choukai-sokuji": 8,
    },
  },
};

function load(file: string): ExamFile {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
  return examFileSchema.parse(raw);
}

describe.each(Object.entries(EXPECTED))("content bank %s", (level, exp) => {
  const exam = load(exp.file);
  const items = flattenItems(exam);

  it("passes zod schema and declares the right level, DRAFT-friendly metadata", () => {
    expect(exam.level).toBe(level);
    expect(exam.exam.title).toMatch(new RegExp(`JLPT ${level}`));
    expect(exam.exam.title).toMatch(/Mô phỏng nội bộ/);
  });

  it("has the expected number of questions per section and per part", () => {
    for (const [type, n] of Object.entries(exp.sections)) {
      const count = items.filter((i) => i.sectionType === type).length;
      expect(count, `section ${type}`).toBe(n);
    }
    for (const [partKey, n] of Object.entries(exp.parts)) {
      expect(items.filter((i) => i.partKey === partKey).length, `part ${partKey}`).toBe(n);
    }
    const knownParts = new Set(Object.keys(exp.parts));
    for (const i of items) expect(knownParts.has(i.partKey), `unknown part ${i.partKey}`).toBe(true);
  });

  it("keys are unique and use the level prefix; prompts are unique", () => {
    const keys = items.map((i) => i.item.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k.startsWith(exp.prefix), k).toBe(true);
    const prompts = items.map((i) => `${i.groupKey ?? ""}|${i.item.prompt}`);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it("every question has 4 distinct Japanese-only options, one correct, no answer-revealing words", () => {
    for (const { item } of items) {
      expect(item.options, item.key).toHaveLength(4);
      expect(new Set(item.options).size, item.key).toBe(4);
      expect(Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < 4, item.key).toBe(true);
      expect(VIETNAMESE_CHARS.test(item.prompt), `prompt ${item.key} must not contain Vietnamese`).toBe(false);
      for (const opt of item.options) {
        expect(opt.trim().length, item.key).toBeGreaterThan(0);
        expect(VIETNAMESE_CHARS.test(opt), `option "${opt}" (${item.key}) must not contain Vietnamese`).toBe(false);
        expect(REVEAL.test(opt), `option "${opt}" (${item.key}) must not reveal the answer`).toBe(false);
      }
    }
  });

  it("correct answer positions are shuffled (each position 15-40%)", () => {
    const total = items.length;
    for (let p = 0; p < 4; p++) {
      const share = items.filter((i) => i.item.correctIndex === p).length / total;
      expect(share, `position ${p + 1}`).toBeGreaterThanOrEqual(0.15);
      expect(share, `position ${p + 1}`).toBeLessThanOrEqual(0.4);
    }
  });

  it("explanationVi is Vietnamese and names the correct answer", () => {
    for (const { item } of items) {
      expect(VIETNAMESE_CHARS.test(item.explanationVi), item.key).toBe(true);
      expect(item.explanationVi.includes(item.options[item.correctIndex]), `${item.key} explanation must contain the correct answer`).toBe(true);
    }
  });

  it("star-order questions mark the ★ slot in the prompt", () => {
    for (const { item, questionType } of items) {
      if (questionType === "STAR_ORDER") expect(item.prompt.includes("★"), item.key).toBe(true);
    }
  });

  it("reading/listening answers are derivable from the source text (evidence is quoted verbatim)", () => {
    const withContext = items.filter((i) => i.sectionType === "LISTENING" || i.source);
    expect(withContext.length).toBeGreaterThan(0);
    for (const { item, source, sectionType } of withContext) {
      expect(source, `${item.key} must have a source text`).toBeTruthy();
      const text = source as string;
      if (sectionType === "LISTENING" || item.evidence !== undefined) {
        expect(item.evidence, `${item.key} needs evidence`).toBeTruthy();
        expect(text.includes(item.evidence as string), `${item.key} evidence must be a verbatim substring of the source`).toBe(true);
      }
      const correct = item.options[item.correctIndex];
      if (!item.inferred) {
        expect(text.includes(correct), `${item.key}: correct answer "${correct}" must appear in the source or be flagged inferred`).toBe(true);
      }
    }
  });

  it("context texts are original, labelled with the project source and carry no Vietnamese leakage into prompts", () => {
    for (const s of exam.sections)
      for (const p of s.parts)
        for (const g of p.groups ?? []) {
          if (g.reading) {
            expect(g.reading.copyrightSource).toBe(ORIGINAL_SOURCE);
            expect(VIETNAMESE_CHARS.test(g.reading.textJa), g.groupKey).toBe(false);
            expect(VIETNAMESE_CHARS.test(g.reading.translatedVi), `${g.groupKey} translation should be Vietnamese`).toBe(true);
          }
          if (g.listening) {
            expect(VIETNAMESE_CHARS.test(g.listening.transcriptJa), g.groupKey).toBe(false);
            expect(g.listening.durationSeconds).toBeGreaterThan(0);
          }
        }
  });

  it("does not copy questions from the N5 bank or from other levels", () => {
    // Generic instructions ("（１）に入れる…") repeat legitimately, so compare prompt together with its source text.
    const sig = (i: { item: { prompt: string }; source?: string }) => `${i.source ?? ""}|${i.item.prompt}`;
    const own = new Set(items.map(sig));
    const ownPrompts = new Set(items.map((i) => i.item.prompt));
    for (const q of N5_QUESTION_BANK) expect(ownPrompts.has(q.prompt), q.prompt).toBe(false);
    for (const p of N5_READING_PASSAGES) for (const q of p.questions) expect(own.has(`${p.textJa}|${q.prompt}`), q.prompt).toBe(false);
    for (const t of N5_LISTENING_TRACKS) for (const q of t.questions) expect(own.has(`${t.transcriptJa}|${q.prompt}`), q.prompt).toBe(false);
    for (const [other, e] of Object.entries(EXPECTED)) {
      if (other === level) continue;
      for (const o of flattenItems(load(e.file))) expect(own.has(sig(o)), o.item.key).toBe(false);
    }
  });

  it("flags uncertain items for teacher review with a valid confidence value", () => {
    for (const { item } of items) expect(["high", "check"]).toContain(item.confidence);
  });
});
