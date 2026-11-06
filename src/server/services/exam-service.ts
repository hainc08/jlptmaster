export interface ExamQuestionContext {
  id: string;
  kind: "READING" | "LISTENING";
  text: string;
}

export interface ExamSnapshot {
  examId: string;
  version: string;
  questions: Array<{
    id: string;
    prompt: string;
    explanationVi: string;
    skillTag?: string;
    sectionTitleVi?: string;
    /** Shared material for reading passages / listening tracks (never contains translations or answers). */
    context?: ExamQuestionContext;
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
      sectionTitleVi: q.sectionTitleVi,
      context: q.context,
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

// ---------- Skill analysis & roadmap ----------

export interface SkillStat {
  skill: string;
  correct: number;
  total: number;
  percent: number;
}

export const WEAK_THRESHOLD_PERCENT = 70;
export const UNTAGGED_SKILL = "Tổng hợp";

export function computeSkillBreakdown(
  snapshot: ExamSnapshot,
  userAnswers: Record<string, string | null | undefined>
): SkillStat[] {
  const acc = new Map<string, { correct: number; total: number }>();
  for (const q of snapshot.questions) {
    const skill = q.skillTag?.trim() || UNTAGGED_SKILL;
    const row = acc.get(skill) ?? { correct: 0, total: 0 };
    row.total++;
    const selected = userAnswers[q.id];
    const correct = q.options.find((o) => o.isCorrect);
    if (selected && correct && selected === correct.id) row.correct++;
    acc.set(skill, row);
  }
  return Array.from(acc, ([skill, r]) => ({
    skill,
    correct: r.correct,
    total: r.total,
    percent: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
  }));
}

const REMEDIAL: Array<{ match: RegExp; href: string; text: string }> = [
  { match: /ngữ pháp|grammar|bunpo/i, href: "/grammar", text: "Ôn lại các mẫu câu trong Sổ tay Ngữ pháp rồi làm bài luyện tập ngắn." },
  { match: /chữ hán|kanji/i, href: "/kanji", text: "Ôn chữ Hán trong Sổ tay Chữ Hán, chú ý cách đọc On/Kun." },
  { match: /từ vựng|vocab/i, href: "/vocabulary", text: "Ôn từ vựng bằng Sổ tay Từ vựng và thẻ nhớ SRS mỗi ngày." },
  { match: /đọc|reading|dokkai/i, href: "/practice", text: "Luyện đọc đoạn văn ngắn, gạch từ khóa trước khi chọn đáp án." },
  { match: /nghe|listening|choukai/i, href: "/practice", text: "Luyện nghe hội thoại ngắn, nghe lại những câu sai." },
];

export interface WeakSkill extends SkillStat {
  recommendationVi: string;
  remedialHref: string;
}

export function buildWeakSkills(
  stats: SkillStat[],
  threshold: number = WEAK_THRESHOLD_PERCENT
): WeakSkill[] {
  return stats
    .filter((s) => s.total > 0 && s.percent < threshold)
    .sort((a, b) => a.percent - b.percent)
    .map((s) => {
      const hit = REMEDIAL.find((r) => r.match.test(s.skill));
      return {
        ...s,
        recommendationVi: hit?.text ?? "Làm thêm bài luyện tập để củng cố kỹ năng này.",
        remedialHref: hit?.href ?? "/practice",
      };
    });
}
