import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db";
import {
  ExamSnapshot,
  SkillStat,
  buildWeakSkills,
  computeSkillBreakdown,
} from "@/src/server/services/exam-service";
import { requireSession, authErrorResponse } from "@/src/server/services/auth-service";

// Aggregates the learner's skill accuracy over their most recent submitted attempts
// and turns the weakest skills into a prioritised study roadmap.
export async function GET(req: NextRequest) {
  try {
    const { userId } = requireSession(req);
    const attempts = await prisma.examAttempt.findMany({
      where: { userId, status: { in: ["SUBMITTED", "EXPIRED"] } },
      include: { answers: true },
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    const totals = new Map<string, { correct: number; total: number }>();
    for (const attempt of attempts) {
      const userAnswers: Record<string, string> = {};
      for (const a of attempt.answers) {
        const payload = a.answerJson as { selectedOptionId?: string } | string;
        const sel = typeof payload === "string" ? payload : payload?.selectedOptionId;
        if (sel) userAnswers[a.questionId] = sel;
      }
      for (const row of computeSkillBreakdown(attempt.examSnapshotJson as unknown as ExamSnapshot, userAnswers)) {
        const t = totals.get(row.skill) ?? { correct: 0, total: 0 };
        t.correct += row.correct;
        t.total += row.total;
        totals.set(row.skill, t);
      }
    }

    const skills: SkillStat[] = Array.from(totals, ([skill, t]) => ({
      skill,
      correct: t.correct,
      total: t.total,
      percent: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    })).sort((a, b) => a.percent - b.percent);

    const roadmap = buildWeakSkills(skills).map((w, i) => ({
      step: i + 1,
      skill: w.skill,
      percent: w.percent,
      actionVi: w.recommendationVi,
      href: w.remedialHref,
    }));

    return NextResponse.json({ data: { attemptsAnalyzed: attempts.length, skills, roadmap } });
  } catch (error: any) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: { code: "SKILLS_FETCH_FAILED", message: error.message } }, { status: 500 });
  }
}
