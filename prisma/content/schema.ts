import { z } from "zod";

export const ORIGINAL_SOURCE = "Nội dung gốc do đội ngũ dự án biên soạn";

const optionsSchema = z.tuple([z.string(), z.string(), z.string(), z.string()]);

export const itemSchema = z.object({
  key: z.string().regex(/^(n|tst)[1-5]-[a-z]+-\d{3}$/, "key dạng n4-v-001"),
  prompt: z.string().min(1),
  options: optionsSchema,
  correctIndex: z.number().int().min(0).max(3),
  explanationVi: z.string().min(1),
  /** Từ / chữ Hán / mẫu ngữ pháp được kiểm tra (phục vụ rà soát). */
  target: z.string().optional(),
  /** "check" => file review ghi [CẦN GIÁO VIÊN XÁC NHẬN]. */
  confidence: z.enum(["high", "check"]).default("high"),
  /** Câu đọc/nghe: đoạn trích nguyên văn trong văn bản nguồn. */
  evidence: z.string().optional(),
  /** Đáp án đúng cần suy luận (không xuất hiện nguyên văn trong văn bản). */
  inferred: z.boolean().optional(),
  reviewNote: z.string().optional(),
});

export const groupSchema = z
  .object({
    groupKey: z.string().regex(/^(n|tst)[1-5]-[a-z]+-g\d{2,3}$/),
    reading: z
      .object({
        textJa: z.string().min(1),
        translatedVi: z.string().min(1),
        difficulty: z.number().int().min(1).max(5).default(2),
        copyrightSource: z.string(),
      })
      .optional(),
    listening: z
      .object({
        transcriptJa: z.string().min(1),
        transcriptVi: z.string().min(1),
        durationSeconds: z.number().int().positive(),
      })
      .optional(),
    items: z.array(itemSchema).min(1),
  })
  .refine((g) => Boolean(g.reading) !== Boolean(g.listening), "mỗi nhóm có đúng một trong reading | listening");

export const partSchema = z
  .object({
    partKey: z.string(),
    labelVi: z.string(),
    questionType: z.enum(["SINGLE_CHOICE", "KANJI_READING", "BLANK_CHOICE", "STAR_ORDER", "READING", "LISTENING"]),
    skillTag: z.string().max(50),
    items: z.array(itemSchema).optional(),
    groups: z.array(groupSchema).optional(),
  })
  .refine((p) => Boolean(p.items) !== Boolean(p.groups), "mỗi dạng bài có đúng một trong items | groups");

export const sectionSchema = z.object({
  type: z.enum(["VOCAB", "GRAMMAR_READING", "LISTENING"]),
  durationSeconds: z.number().int().positive(),
  maxInternalPoints: z.number().int().positive().default(60),
  parts: z.array(partSchema).min(1),
});

export const examFileSchema = z.object({
  schemaVersion: z.literal(1),
  level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  exam: z.object({
    slug: z.string(),
    title: z.string().max(191),
    version: z.string().default("v1.0"),
    scoringPolicy: z.string().default("JLPT_SCALE_180"),
    /** Trạng thái khi TẠO đề lần đầu. Loader không bao giờ đổi trạng thái của đề đã tồn tại. */
    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  }),
  sections: z.array(sectionSchema).length(3),
});

export type ExamFile = z.infer<typeof examFileSchema>;
export type ContentItemInput = z.infer<typeof itemSchema>;

export interface FlatItem {
  item: ContentItemInput;
  sectionType: "VOCAB" | "GRAMMAR_READING" | "LISTENING";
  sectionIndex: number;
  partKey: string;
  partLabelVi: string;
  questionType: z.infer<typeof partSchema>["questionType"];
  skillTag: string;
  groupKey?: string;
  /** Văn bản nguồn (đoạn đọc hoặc lời thoại) nếu câu thuộc một nhóm. */
  source?: string;
  group?: z.infer<typeof groupSchema>;
}

/** Duyệt toàn bộ câu hỏi theo đúng thứ tự xuất hiện trong đề. */
export function flattenItems(file: ExamFile): FlatItem[] {
  const out: FlatItem[] = [];
  file.sections.forEach((s, sectionIndex) => {
    for (const p of s.parts) {
      const base = { sectionType: s.type, sectionIndex, partKey: p.partKey, partLabelVi: p.labelVi, questionType: p.questionType, skillTag: p.skillTag };
      for (const item of p.items ?? []) out.push({ ...base, item });
      for (const g of p.groups ?? []) {
        const source = g.reading?.textJa ?? g.listening?.transcriptJa;
        for (const item of g.items) out.push({ ...base, item, groupKey: g.groupKey, source, group: g });
      }
    }
  });
  return out;
}
