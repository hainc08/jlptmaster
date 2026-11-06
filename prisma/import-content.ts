/**
 * Pipeline nạp đề thi thử từ prisma/content/n{level}/exam-*.json vào MariaDB (idempotent).
 *
 * - Câu hỏi nhận diện bằng `promptJson.key`; chỉ ghi lại khi `contentHash` đổi; KHÔNG bao giờ xóa Question.
 * - Đề mới được tạo với `exam.status` trong file JSON (mặc định DRAFT); loader không bao giờ đổi `Exam.status` của đề đã tồn tại.
 * - Đề đang PUBLISHED mà nội dung đổi => từ chối, trừ khi `allowPublishedUpdate`.
 * - Chỉ chạy trên DB local trong phát triển; tests tự kiểm tra host.
 */
import { PrismaClient, Prisma, ContentStatus, ContentKind, QuestionType, SectionType } from "@prisma/client";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { examFileSchema, flattenItems, type ExamFile, type FlatItem } from "./content/schema";

type Tx = Prisma.TransactionClient;

export interface ImportOptions {
  contentDir?: string;
  /** Chỉ nạp các cấp này, ví dụ ["N4"]. Mặc định: mọi cấp có file. */
  levels?: string[];
  allowPublishedUpdate?: boolean;
  log?: (msg: string) => void;
}

export interface ImportSummary {
  level: string;
  title: string;
  examId: string;
  status: string;
  questions: number;
  created: number;
  updated: number;
  unchanged: number;
  archived: number;
  changes: number;
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

function questionHash(f: FlatItem): string {
  return sha(
    JSON.stringify({
      p: f.item.prompt,
      o: f.item.options,
      c: f.item.correctIndex,
      e: f.item.explanationVi,
      t: f.questionType,
      s: f.skillTag,
      g: f.groupKey ?? null,
    })
  );
}

export function discoverContentFiles(contentDir: string, levels?: string[]): string[] {
  if (!fs.existsSync(contentDir)) return [];
  const wanted = levels?.map((l) => l.toLowerCase());
  const out: string[] = [];
  for (const dir of fs.readdirSync(contentDir).sort()) {
    if (!/^n[1-5]$/.test(dir)) continue;
    if (wanted && !wanted.includes(dir)) continue;
    const full = path.join(contentDir, dir);
    for (const f of fs.readdirSync(full).sort()) if (/^exam-\d+\.json$/.test(f)) out.push(path.join(full, f));
  }
  return out;
}

export function readExamFile(file: string): ExamFile {
  const parsed = examFileSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) throw new Error(`Nội dung không hợp lệ (${file}): ${parsed.error.message}`);
  const keys = flattenItems(parsed.data).map((i) => i.item.key);
  if (new Set(keys).size !== keys.length) throw new Error(`Trùng key trong ${file}`);
  return parsed.data;
}

async function importOne(tx: Tx, file: ExamFile, opts: ImportOptions, adminId: string | null): Promise<ImportSummary> {
  const level = file.level;
  const flat = flattenItems(file);
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let changes = 0;

  // ---- Exam + sections ----
  let exam = await tx.exam.findFirst({ where: { levelId: level, title: file.exam.title }, include: { sections: { orderBy: { position: "asc" } } } });
  const examExisted = Boolean(exam);
  if (!exam) {
    exam = await tx.exam.create({
      data: {
        levelId: level,
        title: file.exam.title,
        status: file.exam.status as ContentStatus,
        publishedAt: file.exam.status === "PUBLISHED" ? new Date() : null,
        version: file.exam.version,
        scoringPolicy: file.exam.scoringPolicy,
        sections: {
          create: file.sections.map((s, i) => ({
            sectionType: s.type as SectionType,
            position: i + 1,
            durationSeconds: s.durationSeconds,
            maxInternalPoints: s.maxInternalPoints,
          })),
        },
      },
      include: { sections: { orderBy: { position: "asc" } } },
    });
  } else {
    for (let i = 0; i < file.sections.length; i++) {
      const want = file.sections[i];
      const have = exam.sections[i];
      if (!have) {
        changes++;
        await tx.examSection.create({ data: { examId: exam.id, sectionType: want.type as SectionType, position: i + 1, durationSeconds: want.durationSeconds, maxInternalPoints: want.maxInternalPoints } });
      } else if (have.sectionType !== want.type || have.durationSeconds !== want.durationSeconds || have.maxInternalPoints !== want.maxInternalPoints) {
        changes++;
        await tx.examSection.update({ where: { id: have.id }, data: { sectionType: want.type as SectionType, durationSeconds: want.durationSeconds, maxInternalPoints: want.maxInternalPoints } });
      }
    }
    if (exam.version !== file.exam.version || exam.scoringPolicy !== file.exam.scoringPolicy) {
      changes++;
      await tx.exam.update({ where: { id: exam.id }, data: { version: file.exam.version, scoringPolicy: file.exam.scoringPolicy } });
    }
    exam = await tx.exam.findUniqueOrThrow({ where: { id: exam.id }, include: { sections: { orderBy: { position: "asc" } } } });
  }

  // ---- Context items (reading passages / listening tracks) ----
  const contentItemByGroup = new Map<string, string>();
  const seenGroups = new Set<string>();
  for (const f of flat) {
    if (!f.group || seenGroups.has(f.group.groupKey)) continue;
    seenGroups.add(f.group.groupKey);
    const g = f.group;
    const kind = g.reading ? ContentKind.READING : ContentKind.LISTENING;
    let ci = await tx.contentItem.findFirst({ where: { levelId: level, kind, slug: g.groupKey } });
    if (!ci) ci = await tx.contentItem.create({ data: { levelId: level, kind, slug: g.groupKey, status: ContentStatus.DRAFT } });
    contentItemByGroup.set(g.groupKey, ci.id);

    if (g.reading) {
      const cur = await tx.readingPassage.findUnique({ where: { contentItemId: ci.id } });
      const data = { textJa: g.reading.textJa, translatedVi: g.reading.translatedVi, difficulty: g.reading.difficulty, copyrightSource: g.reading.copyrightSource };
      if (!cur) {
        changes++;
        await tx.readingPassage.create({ data: { contentItemId: ci.id, ...data } });
      } else if (cur.textJa !== data.textJa || cur.translatedVi !== data.translatedVi || cur.difficulty !== data.difficulty || cur.copyrightSource !== data.copyrightSource) {
        changes++;
        await tx.readingPassage.update({ where: { id: cur.id }, data });
      }
    } else if (g.listening) {
      if (!adminId) throw new Error("Cần ít nhất một tài khoản ADMIN (chạy seed người dùng trước) để gán MediaAsset TTS.");
      const t = g.listening;
      const storageKey = `tts:${g.groupKey}`;
      const hash = sha(t.transcriptJa);
      let asset = await tx.mediaAsset.findUnique({ where: { storageKey } });
      if (!asset) {
        asset = await tx.mediaAsset.create({
          data: {
            storageKey,
            mimeType: "text/plain",
            byteSize: Buffer.byteLength(t.transcriptJa, "utf8"),
            sha256: hash,
            licenseType: "TTS_BROWSER",
            attribution: "Giọng đọc tổng hợp của trình duyệt (Web Speech API) đọc lời thoại gốc của dự án; chưa có file ghi âm thật.",
            ownerId: adminId,
          },
        });
      } else if (asset.sha256 !== hash) {
        asset = await tx.mediaAsset.update({ where: { id: asset.id }, data: { sha256: hash, byteSize: Buffer.byteLength(t.transcriptJa, "utf8") } });
      }
      const cur = await tx.listeningTrack.findUnique({ where: { contentItemId: ci.id } });
      const data = { transcriptJa: t.transcriptJa, transcriptVi: t.transcriptVi, durationSeconds: t.durationSeconds, mediaAssetId: asset.id };
      if (!cur) {
        changes++;
        await tx.listeningTrack.create({ data: { contentItemId: ci.id, ...data } });
      } else if (cur.transcriptJa !== data.transcriptJa || cur.transcriptVi !== data.transcriptVi || cur.durationSeconds !== data.durationSeconds || cur.mediaAssetId !== data.mediaAssetId) {
        changes++;
        await tx.listeningTrack.update({ where: { id: cur.id }, data });
      }
    }
  }

  // ---- Questions ----
  const questionIds = new Map<string, string>(); // key -> id
  for (const f of flat) {
    const hash = questionHash(f);
    const contentItemId = f.groupKey ? contentItemByGroup.get(f.groupKey) ?? null : null;
    const promptJson = { text: f.item.prompt, key: f.item.key, contentHash: hash };
    const optionRows = f.item.options.map((text, idx) => ({ position: idx + 1, textJson: { text }, isCorrect: idx === f.item.correctIndex }));
    const existing = await tx.question.findFirst({ where: { promptJson: { path: "$.key", equals: f.item.key } } });
    if (!existing) {
      const q = await tx.question.create({
        data: {
          levelId: level,
          contentItemId,
          questionType: f.questionType as QuestionType,
          promptJson,
          explanationVi: f.item.explanationVi,
          difficulty: 1,
          skillTag: f.skillTag,
          status: ContentStatus.DRAFT,
          options: { create: optionRows },
        },
      });
      questionIds.set(f.item.key, q.id);
      created++;
      changes++;
      continue;
    }
    questionIds.set(f.item.key, existing.id);
    const oldHash = (existing.promptJson as { contentHash?: string } | null)?.contentHash;
    const needsUnarchive = existing.status === ContentStatus.ARCHIVED;
    if (oldHash === hash && existing.contentItemId === contentItemId && existing.levelId === level && !needsUnarchive) {
      unchanged++;
      continue;
    }
    await tx.question.update({
      where: { id: existing.id },
      data: {
        levelId: level,
        contentItemId,
        questionType: f.questionType as QuestionType,
        promptJson,
        explanationVi: f.item.explanationVi,
        skillTag: f.skillTag,
        ...(needsUnarchive ? { status: ContentStatus.DRAFT } : {}),
      },
    });
    if (oldHash !== hash) {
      await tx.questionOption.deleteMany({ where: { questionId: existing.id } });
      await tx.questionOption.createMany({ data: optionRows.map((o) => ({ ...o, questionId: existing.id })) });
    }
    updated++;
    changes++;
  }

  // ---- Link questions to sections (ExamQuestion rows are not referenced by attempts) ----
  const previousLinks = await tx.examQuestion.findMany({ where: { section: { examId: exam.id } }, include: { question: true } });
  const wantedIds = new Set(questionIds.values());
  let archived = 0;
  for (const link of previousLinks) {
    const key = (link.question.promptJson as { key?: string } | null)?.key;
    if (key && !wantedIds.has(link.questionId) && link.question.status !== ContentStatus.ARCHIVED) {
      await tx.question.update({ where: { id: link.questionId }, data: { status: ContentStatus.ARCHIVED } });
      archived++;
      changes++;
    }
  }
  for (let si = 0; si < file.sections.length; si++) {
    const section = exam.sections[si];
    const want = flat.filter((f) => f.sectionIndex === si).map((f) => questionIds.get(f.item.key) as string);
    const current = await tx.examQuestion.findMany({ where: { sectionId: section.id }, orderBy: { position: "asc" } });
    const same = current.length === want.length && current.every((c, i) => c.questionId === want[i]);
    if (same) continue;
    changes++;
    await tx.examQuestion.deleteMany({ where: { sectionId: section.id } });
    await tx.examQuestion.createMany({ data: want.map((questionId, i) => ({ sectionId: section.id, questionId, position: i + 1, points: 1 })) });
  }

  if (examExisted && exam.status === ContentStatus.PUBLISHED && changes > 0 && !opts.allowPublishedUpdate) {
    throw new Error(`Đề "${exam.title}" đang PUBLISHED và nội dung đã thay đổi (${changes} thay đổi). Tăng version và dùng allowPublishedUpdate nếu thật sự cần.`);
  }

  return { level, title: exam.title, examId: exam.id, status: exam.status, questions: flat.length, created, updated, unchanged, archived, changes };
}

export async function importContent(prisma: PrismaClient, opts: ImportOptions = {}): Promise<ImportSummary[]> {
  const contentDir = opts.contentDir ?? path.join(process.cwd(), "prisma", "content");
  const files = discoverContentFiles(contentDir, opts.levels).map(readExamFile); // validate everything first
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  const out: ImportSummary[] = [];
  for (const file of files) {
    // Concurrent loaders (e.g. parallel test workers, two app instances booting) can deadlock on exam_questions
    // gap locks; the whole transaction is idempotent, so retry on write-conflict / deadlock (Prisma P2034).
    let summary: ImportSummary | undefined;
    for (let attempt = 1; !summary; attempt++) {
      try {
        summary = await prisma.$transaction((tx) => importOne(tx, file, opts, admin?.id ?? null), { timeout: 120_000, maxWait: 20_000 });
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== "P2034" || attempt >= 5) throw e;
        await new Promise((r) => setTimeout(r, 150 * attempt + Math.floor(Math.random() * 150)));
      }
    }
    opts.log?.(`✔ ${summary.level} "${summary.title}" [${summary.status}]: ${summary.questions} câu (mới ${summary.created}, cập nhật ${summary.updated}, giữ nguyên ${summary.unchanged}, lưu trữ ${summary.archived})`);
    out.push(summary);
  }
  return out;
}

// CLI: npx tsx prisma/import-content.ts [N4 N3 ...]
if (process.argv[1]?.includes("import-content")) {
  const prisma = new PrismaClient();
  const levels = process.argv.slice(2).filter((a) => /^N[1-5]$/.test(a));
  importContent(prisma, { levels: levels.length ? levels : undefined, log: console.log })
    .catch((e) => {
      console.error("Lỗi nạp nội dung:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
