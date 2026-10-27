export interface ExamSnapshot {
  examId: string;
  version: string;
  questions: Array<{
    id: string;
    prompt: string;
    explanationVi: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

export function stripAnswerKeysFromExam(snapshot: ExamSnapshot) {
  return {
    examId: snapshot.examId,
    version: snapshot.version,
    questions: snapshot.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
      })),
    })),
  };
}

export interface GradedExamResult {
  rawCorrect: number;
  rawTotal: number;
  mockScore180: number;
  itemResults: Record<
    string,
    {
      selectedOptionId: string | null;
      correctOptionId: string;
      isCorrect: boolean;
      explanationVi: string;
    }
  >;
}

export function gradeExamAttempt(
  snapshot: ExamSnapshot,
  userAnswers: Record<string, string>
): GradedExamResult {
  let rawCorrect = 0;
  const rawTotal = snapshot.questions.length;
  const itemResults: GradedExamResult["itemResults"] = {};

  for (const q of snapshot.questions) {
    const selectedOptId = userAnswers[q.id] || null;
    const correctOpt = q.options.find((opt) => opt.isCorrect);
    const correctOptionId = correctOpt ? correctOpt.id : "";
    const isCorrect = selectedOptId !== null && selectedOptId === correctOptionId;

    if (isCorrect) {
      rawCorrect++;
    }

    itemResults[q.id] = {
      selectedOptionId: selectedOptId,
      correctOptionId,
      isCorrect,
      explanationVi: q.explanationVi,
    };
  }

  const mockScore180 = rawTotal > 0 ? Math.round((rawCorrect / rawTotal) * 180) : 0;

  return {
    rawCorrect,
    rawTotal,
    mockScore180,
    itemResults,
  };
}

export function validateAttemptTimeliness(
  expiresAt: Date,
  now: Date = new Date(),
  gracePeriodSeconds: number = 15
): { isExpired: boolean; remainingSeconds: number } {
  const diffMs = expiresAt.getTime() + gracePeriodSeconds * 1000 - now.getTime();
  if (diffMs <= 0) {
    return { isExpired: true, remainingSeconds: 0 };
  }
  return { isExpired: false, remainingSeconds: Math.floor(diffMs / 1000) };
}
