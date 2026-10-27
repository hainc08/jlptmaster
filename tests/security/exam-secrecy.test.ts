import { describe, it, expect } from "vitest";
import { stripAnswerKeysFromExam, gradeExamAttempt } from "../../src/server/services/exam-service";

describe("Exam Engine — Secrecy & Server Evaluation", () => {
  const fullExamSnapshot = {
    examId: "exam-n5-01",
    version: "v1.0",
    questions: [
      {
        id: "q-01",
        prompt: "毎朝、新聞を読みます。",
        explanationVi: "Chữ Hán 新 (TÂN) đọc là 'shin', 聞 (VĂN) đọc là 'bun'.",
        options: [
          { id: "opt-1", text: "しんぶん", isCorrect: true },
          { id: "opt-2", text: "じんぶん", isCorrect: false },
        ],
      },
      {
        id: "q-02",
        prompt: "あの人は先生です。",
        explanationVi: "先生 đọc là せんせい.",
        options: [
          { id: "opt-1", text: "せんせい", isCorrect: true },
          { id: "opt-2", text: "せいせん", isCorrect: false },
        ],
      },
    ],
  };

  it("strips answer keys (isCorrect) and explanations before exam submission", () => {
    const studentView = stripAnswerKeysFromExam(fullExamSnapshot);

    // Verify questions have prompt but NO explanation
    studentView.questions.forEach((q: any) => {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("prompt");
      expect(q).not.toHaveProperty("explanationVi");

      // Verify options have id and text but NO isCorrect
      q.options.forEach((opt: any) => {
        expect(opt).toHaveProperty("id");
        expect(opt).toHaveProperty("text");
        expect(opt).not.toHaveProperty("isCorrect");
      });
    });
  });

  it("accurately evaluates user answers on the server against the immutable snapshot", () => {
    const userAnswers = {
      "q-01": "opt-1", // Correct
      "q-02": "opt-2", // Incorrect
    };

    const graded = gradeExamAttempt(fullExamSnapshot, userAnswers);

    expect(graded.rawCorrect).toBe(1);
    expect(graded.rawTotal).toBe(2);
    expect(graded.mockScore180).toBe(90); // 1/2 of 180
    expect(graded.itemResults["q-01"].isCorrect).toBe(true);
    expect(graded.itemResults["q-02"].isCorrect).toBe(false);
    expect(graded.itemResults["q-01"].explanationVi).toBeDefined();
  });
});
