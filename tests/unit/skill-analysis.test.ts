import { describe, it, expect } from "vitest";
import {
  computeSkillBreakdown,
  buildWeakSkills,
  type ExamSnapshot,
} from "@/src/server/services/exam-service";

const q = (id: string, skillTag?: string) => ({
  id,
  prompt: id,
  explanationVi: "",
  skillTag,
  options: [
    { id: `${id}-a`, text: "a", isCorrect: true },
    { id: `${id}-b`, text: "b", isCorrect: false },
  ],
});

const snapshot: ExamSnapshot = {
  examId: "e1",
  version: "v1",
  questions: [q("q1", "Từ vựng N5"), q("q2", "Từ vựng N5"), q("q3", "Ngữ pháp N5"), q("q4", "Ngữ pháp N5"), q("q5")],
};

describe("computeSkillBreakdown", () => {
  it("groups by skillTag and counts correct answers; untagged goes to 'Tổng hợp'", () => {
    const rows = computeSkillBreakdown(snapshot, {
      q1: "q1-a",
      q2: "q2-a",
      q3: "q3-b",
      q5: "q5-a",
    });
    const by = Object.fromEntries(rows.map((r) => [r.skill, r]));
    expect(by["Từ vựng N5"]).toMatchObject({ correct: 2, total: 2, percent: 100 });
    expect(by["Ngữ pháp N5"]).toMatchObject({ correct: 0, total: 2, percent: 0 });
    expect(by["Tổng hợp"]).toMatchObject({ correct: 1, total: 1, percent: 100 });
  });
});

describe("buildWeakSkills", () => {
  it("returns only skills under 70%, weakest first, with a remedial link", () => {
    const weak = buildWeakSkills([
      { skill: "Từ vựng N5", correct: 2, total: 2, percent: 100 },
      { skill: "Ngữ pháp N5", correct: 1, total: 4, percent: 25 },
      { skill: "Chữ Hán N5", correct: 1, total: 2, percent: 50 },
    ]);
    expect(weak.map((w) => w.skill)).toEqual(["Ngữ pháp N5", "Chữ Hán N5"]);
    expect(weak[0].remedialHref).toBe("/grammar");
    expect(weak[1].remedialHref).toBe("/kanji");
    expect(weak[0].recommendationVi.length).toBeGreaterThan(5);
  });
  it("returns [] when nothing is weak", () => {
    expect(buildWeakSkills([{ skill: "Từ vựng N5", correct: 2, total: 2, percent: 100 }])).toEqual([]);
  });
});
