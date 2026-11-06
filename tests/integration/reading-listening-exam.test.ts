import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/src/server/db";
import { signSessionToken } from "@/src/server/services/auth-service";
import { POST as startExam } from "@/app/api/v1/exams/[id]/start/route";
import { GET as practiceQuestions } from "@/app/api/v1/practice/questions/route";

describe("Reading & listening in the N5 mock exam (MariaDB)", () => {
  let examId: string;
  let cookie: Record<string, string>;

  beforeAll(async () => {
    const student = await prisma.user.findUniqueOrThrow({ where: { email: "minh@jlptmaster.vn" } });
    cookie = {
      Cookie: `jlpt_session=${signSessionToken({ userId: student.id, email: student.email, role: "STUDENT" })}`,
    };
    examId = (
      await prisma.exam.findFirstOrThrow({
        where: { levelId: "N5", status: "PUBLISHED", NOT: { title: { startsWith: "TEST platform" } } },
      })
    ).id;
  });

  it("seeds >=2 reading passages and >=2 listening tracks, published, with transcripts and a media asset", async () => {
    // Only the published N5 seed content: DRAFT exam content (prisma/content/**) is intentionally not published.
    const passages = await prisma.readingPassage.findMany({ where: { contentItem: { slug: { startsWith: "doc-hieu-n5-" } } }, include: { contentItem: true } });
    expect(passages.length).toBeGreaterThanOrEqual(2);
    for (const p of passages) {
      expect(p.contentItem.kind).toBe("READING");
      expect(p.contentItem.status).toBe("PUBLISHED");
      expect(p.copyrightSource.length).toBeGreaterThan(0);
    }
    const tracks = await prisma.listeningTrack.findMany({ where: { contentItem: { slug: { startsWith: "nghe-hieu-n5-" } } }, include: { contentItem: true, mediaAsset: true } });
    expect(tracks.length).toBeGreaterThanOrEqual(2);
    for (const t of tracks) {
      expect(t.contentItem.kind).toBe("LISTENING");
      expect(t.transcriptJa.length).toBeGreaterThan(0);
      expect(t.mediaAsset.licenseType).toBe("TTS_BROWSER");
    }
  });

  it("the exam now spans all three sections with reading and listening questions", async () => {
    const exam = await prisma.exam.findUniqueOrThrow({
      where: { id: examId },
      include: { sections: { orderBy: { position: "asc" }, include: { examQuestions: { include: { question: true } } } } },
    });
    const types = exam.sections.map((s) => s.examQuestions.map((e) => e.question.questionType));
    expect(types[1]).toContain("READING");
    expect(types[2]).toContain("LISTENING");
    expect(types[2].every((t) => t === "LISTENING")).toBe(true);
    const total = exam.sections.reduce((n, s) => n + s.examQuestions.length, 0);
    expect(total).toBeGreaterThanOrEqual(28);
  });

  it("start returns passage/audio context per question, section titles, and no answer keys or translations", async () => {
    const res = await startExam(
      new NextRequest("http://x/s", { method: "POST", headers: { "Content-Type": "application/json", ...cookie } }),
      { params: Promise.resolve({ id: examId }) }
    );
    expect(res.status).toBe(201);
    const { data } = await res.json();
    const reading = data.questions.filter((q: any) => q.context?.kind === "READING");
    const listening = data.questions.filter((q: any) => q.context?.kind === "LISTENING");
    expect(reading.length).toBeGreaterThanOrEqual(4);
    expect(listening.length).toBeGreaterThanOrEqual(4);
    for (const q of [...reading, ...listening]) {
      expect(q.context.text.length).toBeGreaterThan(10);
      expect(q.context.id).toBeTruthy();
    }
    expect(data.questions.every((q: any) => typeof q.sectionTitleVi === "string")).toBe(true);

    const raw = JSON.stringify(data);
    expect(raw).not.toMatch(/isCorrect/);
    expect(raw).not.toMatch(/translatedVi|transcriptVi|explanationVi/);
  });

  it("practice questions endpoint never serves reading/listening questions (they need their passage/audio)", async () => {
    const res = await practiceQuestions(new NextRequest("http://x/p"));
    const { data } = await res.json();
    expect(data.length).toBeGreaterThan(0);
    for (const q of data) expect(["READING", "LISTENING"]).not.toContain(q.questionType);
  });
});
