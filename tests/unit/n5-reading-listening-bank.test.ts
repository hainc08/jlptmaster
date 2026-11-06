import { describe, it, expect } from "vitest";
import { N5_READING_PASSAGES, N5_LISTENING_TRACKS } from "@/prisma/n5-reading-listening";

const VIETNAMESE_CHARS = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

const allUnits = [
  ...N5_READING_PASSAGES.map((p) => ({ label: `reading:${p.slug}`, text: p.textJa, questions: p.questions })),
  ...N5_LISTENING_TRACKS.map((t) => ({ label: `listening:${t.slug}`, text: t.transcriptJa, questions: t.questions })),
];

describe("N5 reading & listening content bank", () => {
  it("has at least 2 reading passages and 2 listening tracks with unique slugs", () => {
    expect(N5_READING_PASSAGES.length).toBeGreaterThanOrEqual(2);
    expect(N5_LISTENING_TRACKS.length).toBeGreaterThanOrEqual(2);
    const slugs = allUnits.map((u) => u.label);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every passage/track has Japanese text, a Vietnamese translation, and 2+ questions", () => {
    for (const p of N5_READING_PASSAGES) {
      expect(p.textJa.length, p.slug).toBeGreaterThan(20);
      expect(VIETNAMESE_CHARS.test(p.translatedVi), p.slug).toBe(true);
      expect(p.copyrightSource.length, p.slug).toBeGreaterThan(5);
      expect(p.questions.length, p.slug).toBeGreaterThanOrEqual(2);
    }
    for (const t of N5_LISTENING_TRACKS) {
      expect(t.transcriptJa.length, t.slug).toBeGreaterThan(20);
      expect(VIETNAMESE_CHARS.test(t.transcriptVi), t.slug).toBe(true);
      expect(t.durationSeconds, t.slug).toBeGreaterThan(0);
      expect(t.questions.length, t.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("every question has 4 distinct Japanese-only options, one correct, and a Vietnamese explanation naming it", () => {
    for (const u of allUnits) {
      for (const q of u.questions) {
        const id = `${u.label} / ${q.prompt}`;
        expect(q.options, id).toHaveLength(4);
        expect(new Set(q.options).size, id).toBe(4);
        expect(q.correctIndex >= 0 && q.correctIndex < 4, id).toBe(true);
        for (const opt of q.options) {
          expect(VIETNAMESE_CHARS.test(opt), `${id}: "${opt}" has Vietnamese`).toBe(false);
          expect(/chính xác|đúng|lựa chọn/i.test(opt), `${id}: "${opt}" reveals answer`).toBe(false);
        }
        expect(VIETNAMESE_CHARS.test(q.explanationVi), id).toBe(true);
        expect(q.explanationVi.includes(q.options[q.correctIndex]), id).toBe(true);
      }
    }
  });

  it("the correct answer text actually appears in the source text (answerable from the passage/dialogue)", () => {
    // Weak but useful guard against a key that contradicts the material.
    for (const u of allUnits) {
      for (const q of u.questions) {
        const correct = q.options[q.correctIndex].replace(/\s/g, "");
        const haystack = u.text.replace(/\s/g, "");
        expect(haystack.includes(correct), `${u.label}: "${correct}" not found in text`).toBe(true);
      }
    }
  });

  it("correct answers are not always in the same position", () => {
    const positions = new Set(allUnits.flatMap((u) => u.questions.map((q) => q.correctIndex)));
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });
});
