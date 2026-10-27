export interface SrsCard {
  id: string;
  frontText: string;
  frontReading: string;
  backMeaningVi: string;
  hanViet: string;
  exampleJa: string;
  exampleVi: string;
  kind: "VOCAB" | "KANJI" | "GRAMMAR";
  intervalDays: number;
  dueText: string;
}

export const MOCK_SRS_CARDS: SrsCard[] = [
  {
    id: "srs-01",
    frontText: "先生",
    frontReading: "せんせい",
    backMeaningVi: "Thầy cô giáo, giáo viên, bác sĩ",
    hanViet: "TIÊN SINH",
    exampleJa: "田中先生はとても優しいです。",
    exampleVi: "Thầy Tanaka rất hiền từ.",
    kind: "VOCAB",
    intervalDays: 1,
    dueText: "Đến hạn hôm nay",
  },
  {
    id: "srs-02",
    frontText: "学生",
    frontReading: "がくせい",
    backMeaningVi: "Học sinh, sinh viên",
    hanViet: "HỌC SINH",
    exampleJa: "わたしは日本語学校の学生です。",
    exampleVi: "Tôi là học sinh trường tiếng Nhật.",
    kind: "VOCAB",
    intervalDays: 3,
    dueText: "Đến hạn hôm nay",
  },
  {
    id: "srs-03",
    frontText: "新聞",
    frontReading: "しんぶん",
    backMeaningVi: "Báo chí, tờ báo",
    hanViet: "TÂN VĂN",
    exampleJa: "毎朝、新聞を読みます。",
    exampleVi: "Mỗi sáng tôi đều đọc báo.",
    kind: "VOCAB",
    intervalDays: 1,
    dueText: "Đến hạn hôm nay",
  },
  {
    id: "srs-04",
    frontText: "V-てください",
    frontReading: "V-て ください",
    backMeaningVi: "Xin hãy làm V... (Yêu cầu nhờ vả lịch sự)",
    hanViet: "NGỮ PHÁP",
    exampleJa: "ここに座ってください。",
    exampleVi: "Xin hãy ngồi vào đây.",
    kind: "GRAMMAR",
    intervalDays: 2,
    dueText: "Đến hạn hôm nay",
  },
  {
    id: "srs-05",
    frontText: "友達",
    frontReading: "ともだち",
    backMeaningVi: "Bạn bè, bạn hữu",
    hanViet: "HỮU ĐẠT",
    exampleJa: "友達と映画を見ました。",
    exampleVi: "Tôi đã đi xem phim với bạn.",
    kind: "VOCAB",
    intervalDays: 4,
    dueText: "Đến hạn hôm nay",
  },
];
