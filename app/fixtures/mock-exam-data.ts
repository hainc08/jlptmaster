export interface ExamQuestion {
  id: string;
  sectionId: "sec-1" | "sec-2" | "sec-3";
  sectionTitleVi: string;
  questionNumber: number;
  questionType: "KANJI_READING" | "VOCAB_SELECTION" | "GRAMMAR_BLANK" | "STAR_ORDER" | "READING_PASSAGE" | "LISTENING";
  prompt: string;
  promptRuby?: { text: string; reading: string };
  passageText?: string;
  audioKey?: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanationVi: string;
  skillTag: string;
}

export const MOCK_EXAM_N5_01: ExamQuestion[] = [
  {
    id: "q-01",
    sectionId: "sec-1",
    sectionTitleVi: "Phần 1: Kiến thức ngôn ngữ (Từ vựng - 20 phút)",
    questionNumber: 1,
    questionType: "KANJI_READING",
    prompt: "毎朝、新聞を読みます。",
    promptRuby: { text: "新聞", reading: "???" },
    options: [
      { id: "opt-1", text: "しんぶん" },
      { id: "opt-2", text: "じんぶん" },
      { id: "opt-3", text: "きんぶん" },
      { id: "opt-4", text: "みんぶん" },
    ],
    correctOptionId: "opt-1",
    explanationVi: "Chữ Hán 新 (TÂN) đọc là 'shin', 聞 (VĂN) đọc là 'bun'. Ghép lại thành しんぶん (shimbun) nghĩa là tờ báo.",
    skillTag: "Đọc chữ Hán N5",
  },
  {
    id: "q-02",
    sectionId: "sec-1",
    sectionTitleVi: "Phần 1: Kiến thức ngôn ngữ (Từ vựng - 20 phút)",
    questionNumber: 2,
    questionType: "KANJI_READING",
    prompt: "あの人は先生です。",
    promptRuby: { text: "先生", reading: "???" },
    options: [
      { id: "opt-1", text: "せんせい" },
      { id: "opt-2", text: "せいせん" },
      { id: "opt-3", text: "ぜんせい" },
      { id: "opt-4", text: "せんじ" },
    ],
    correctOptionId: "opt-1",
    explanationVi: "Chữ Hán 先生 (TIÊN SINH) đọc là せんせい (sensei), có nghĩa là thầy giáo, cô giáo.",
    skillTag: "Đọc chữ Hán N5",
  },
  {
    id: "q-03",
    sectionId: "sec-1",
    sectionTitleVi: "Phần 1: Kiến thức ngôn ngữ (Từ vựng - 20 phút)",
    questionNumber: 3,
    questionType: "VOCAB_SELECTION",
    prompt: "のどがかわきましたから、冷たい [ ___ ] を飲みたいです。",
    options: [
      { id: "opt-1", text: "みず (Nước)" },
      { id: "opt-2", text: "ごはん (Cơm)" },
      { id: "opt-3", text: "パン (Bánh mì)" },
      { id: "opt-4", text: "にく (Thịt)" },
    ],
    correctOptionId: "opt-1",
    explanationVi: "Vì khát nước (のどがかわきました) nên muốn uống (飲みたい) 'nước lạnh' (冷たい水 - mizu).",
    skillTag: "Ý nghĩa từ vựng",
  },
  {
    id: "q-04",
    sectionId: "sec-2",
    sectionTitleVi: "Phần 2: Ngữ pháp & Đọc hiểu (40 phút)",
    questionNumber: 4,
    questionType: "GRAMMAR_BLANK",
    prompt: "きのう、デパート [ ___ ] 友達に会いました。",
    options: [
      { id: "opt-1", text: "で" },
      { id: "opt-2", text: "に" },
      { id: "opt-3", text: "を" },
      { id: "opt-4", text: "へ" },
    ],
    correctOptionId: "opt-1",
    explanationVi: "Trợ từ で chỉ địa điểm diễn ra hành động gặp gỡ bạn bè (会いました) tại trung tâm thương mại (デパート).",
    skillTag: "Trợ từ De vs Ni",
  },
  {
    id: "q-05",
    sectionId: "sec-2",
    sectionTitleVi: "Phần 2: Ngữ pháp & Đọc hiểu (40 phút)",
    questionNumber: 5,
    questionType: "STAR_ORDER",
    prompt: "わたしは [ _1_ ] [ _2_ ] [ ★ ] [ _4_ ] 行きます。",
    options: [
      { id: "opt-1", text: "バス" },
      { id: "opt-2", text: "で" },
      { id: "opt-3", text: "学校" },
      { id: "opt-4", text: "へ" },
    ],
    correctOptionId: "opt-3",
    explanationVi: "Thứ tự sắp xếp đúng: わたしは [バス] [で] [学校★] [へ] 行きます。(Tôi đi đến trường bằng xe buýt). Vị trí ngôi sao là '学校' (opt-3).",
    skillTag: "Sắp xếp câu sao (★)",
  },
  {
    id: "q-06",
    sectionId: "sec-3",
    sectionTitleVi: "Phần 3: Nghe hiểu (30 phút)",
    questionNumber: 6,
    questionType: "LISTENING",
    prompt: "Người phụ nữ sẽ mang thứ gì đến phòng họp?",
    audioKey: "audio/n5-sample-listen-01.mp3",
    options: [
      { id: "opt-1", text: "Tài liệu cuộc họp và bút viết" },
      { id: "opt-2", text: "Cốc uống trà và cà phê" },
      { id: "opt-3", text: "Máy tính xách tay" },
      { id: "opt-4", text: "Tờ báo sáng nay" },
    ],
    correctOptionId: "opt-1",
    explanationVi: "Trong đoạn hội thoại, giám đốc nói 'Tài liệu và bút hãy mang đến phòng số 2 nhé', cô gái đáp 'Vâng, tôi sẽ chuẩn bị ngay'.",
    skillTag: "Nghe hiểu tìm thông tin",
  },
];
