/**
 * Xuất file rà soát cho giáo viên: npx tsx prisma/content/export-review.ts N4
 * Ghi docs/content-review/n4.md (mọi câu, kèm cờ [CẦN GIÁO VIÊN XÁC NHẬN]).
 */
import fs from "node:fs";
import path from "node:path";
import { discoverContentFiles, readExamFile } from "../import-content";
import { flattenItems } from "./schema";

const level = (process.argv[2] ?? "").toUpperCase();
if (!/^N[1-5]$/.test(level)) {
  console.error("Dùng: npx tsx prisma/content/export-review.ts N4");
  process.exit(1);
}
const root = process.cwd();
const files = discoverContentFiles(path.join(root, "prisma", "content"), [level]);
const out: string[] = [];
out.push(`# Rà soát nội dung ${level} (dành cho giáo viên tiếng Nhật)`);
out.push("");
out.push("Trạng thái trong file nạp: xem `exam.status`. Nội dung gốc do đội ngũ dự án biên soạn, không chép từ đề JLPT chính thức hay sách có bản quyền. Điểm hiển thị là *điểm quy đổi nội bộ*, không phải điểm JLPT chính thức.");
out.push("");
out.push("Cách rà soát: đánh dấu từng câu ✔ (đạt) / ✘ (sửa) ở cột cuối. Các mục có cờ **[CẦN GIÁO VIÊN XÁC NHẬN]** là phần tôi không chắc về phạm vi cấp độ hoặc cách dùng.");
out.push("");

let flagged = 0;
let total = 0;
for (const f of files) {
  const exam = readExamFile(f);
  const items = flattenItems(exam);
  out.push(`## ${exam.exam.title}`, "");
  out.push(`Tệp: \`${path.relative(root, f).replace(/\\/g, "/")}\` — ${items.length} câu.`, "");
  let lastPart = "";
  let lastGroup = "";
  for (const it of items) {
    total++;
    if (it.partKey !== lastPart) {
      lastPart = it.partKey;
      lastGroup = "";
      const n = items.filter((x) => x.partKey === it.partKey).length;
      out.push(`### ${it.sectionType} · ${it.partLabelVi} (\`${it.partKey}\`, ${n} câu)`, "");
    }
    if (it.group && it.groupKey !== lastGroup) {
      lastGroup = it.groupKey as string;
      const g = it.group;
      if (g.reading) {
        out.push(`**Đoạn đọc \`${g.groupKey}\`**`, "", "> " + g.reading.textJa.replace(/\n/g, "\n> "), "", `*Dịch (nội bộ):* ${g.reading.translatedVi}`, "");
      } else if (g.listening) {
        out.push(`**Lời thoại \`${g.groupKey}\`** (TTS, ${g.listening.durationSeconds}s)`, "", "> " + g.listening.transcriptJa.replace(/\n/g, "\n> "), "", `*Dịch (nội bộ):* ${g.listening.transcriptVi}`, "");
      }
    }
    const flag = it.item.confidence === "check" ? " **[CẦN GIÁO VIÊN XÁC NHẬN]**" : "";
    if (flag) flagged++;
    out.push(`#### \`${it.item.key}\`${flag}`, "");
    out.push("```", it.item.prompt, "```", "");
    it.item.options.forEach((o, i) => out.push(`${i + 1}. ${o}${i === it.item.correctIndex ? "  ← **đáp án đúng**" : ""}`));
    out.push("");
    out.push(`- Giải thích: ${it.item.explanationVi}`);
    if (it.item.target) out.push(`- Mục kiểm tra: ${it.item.target}`);
    if (it.item.evidence) out.push(`- Căn cứ trong văn bản: 「${it.item.evidence}」${it.item.inferred ? " (đáp án suy luận)" : ""}`);
    if (it.item.reviewNote) out.push(`- Ghi chú rà soát: ${it.item.reviewNote}`);
    out.push("- Kết quả rà soát: ☐ ✔  ☐ ✘ — Ghi chú: ", "");
  }
}
out.splice(5, 0, `Tổng: **${total}** câu, trong đó **${flagged}** câu có cờ [CẦN GIÁO VIÊN XÁC NHẬN].`, "");
const dir = path.join(root, "docs", "content-review");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${level.toLowerCase()}.md`), out.join("\n") + "\n");
console.log(`Đã ghi docs/content-review/${level.toLowerCase()}.md (${total} câu, ${flagged} cờ)`);
