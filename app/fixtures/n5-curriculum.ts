export interface VocabItem {
  id: string;
  kanji: string;
  reading: string;
  meaningVi: string;
  romaji: string;
  pos: string; // Part of speech
  exampleJa: string;
  exampleReading: string;
  exampleVi: string;
}

export interface GrammarItem {
  id: string;
  pattern: string;
  meaningVi: string;
  formation: string;
  nuanceVi: string;
  exampleJa: string;
  exampleVi: string;
  lessonId: string;
}

export interface LessonItem {
  id: string;
  slug: string;
  titleVi: string;
  level: "N5";
  order: number;
  descriptionVi: string;
  estimatedMinutes: number;
  vocabCount: number;
  grammarCount: number;
  isCompleted?: boolean;
}

export const MOCK_LESSONS: LessonItem[] = [
  {
    id: "les-01",
    slug: "bai-01-kana-nhap-mon",
    titleVi: "Bài 01: Nhập môn Chữ cái Hiragana & Phát âm",
    level: "N5",
    order: 1,
    descriptionVi: "Làm quen với 46 chữ cái Hiragana cơ bản, quy tắc biến âm (Tentenh / Maru) và âm ghép.",
    estimatedMinutes: 25,
    vocabCount: 15,
    grammarCount: 2,
    isCompleted: true,
  },
  {
    id: "les-02",
    slug: "bai-02-chao-hoi-va-gioi-thieu",
    titleVi: "Bài 02: Chào hỏi hàng ngày & Giới thiệu bản thân",
    level: "N5",
    order: 2,
    descriptionVi: "Các câu chào cửa miệng, cách xưng hô và cấu trúc giới thiệu tên, quốc tịch.",
    estimatedMinutes: 30,
    vocabCount: 20,
    grammarCount: 3,
    isCompleted: true,
  },
  {
    id: "les-03",
    slug: "bai-03-danh-tu-va-tro-tu-wa-desu",
    titleVi: "Bài 03: Khẳng định, Phủ định với Trợ từ は và です",
    level: "N5",
    order: 3,
    descriptionVi: "Học mẫu câu cơ bản N1 wa N2 desu / dewa arimasen, câu hỏi trợ từ ka.",
    estimatedMinutes: 35,
    vocabCount: 25,
    grammarCount: 4,
    isCompleted: false,
  },
  {
    id: "les-04",
    slug: "bai-04-dia-diem-va-chi-thi-tu",
    titleVi: "Bài 04: Chỉ thị từ Kore / Sore / Are & Vị trí Koko / Soko",
    level: "N5",
    order: 4,
    descriptionVi: "Cách hỏi đồ vật, giá tiền, địa điểm và các đại từ chỉ thị vị trí.",
    estimatedMinutes: 30,
    vocabCount: 22,
    grammarCount: 3,
    isCompleted: false,
  },
  {
    id: "les-05",
    slug: "bai-05-dong-tu-chuyen-dong-va-thoi-gian",
    titleVi: "Bài 05: Động từ chuyển động & Thời gian (Trợ từ に, へ, で)",
    level: "N5",
    order: 5,
    descriptionVi: "Cách nói đi đâu, bằng phương tiện gì, vào lúc mấy giờ với động từ ikimasu, kimasu.",
    estimatedMinutes: 40,
    vocabCount: 30,
    grammarCount: 4,
    isCompleted: false,
  },
];

export const MOCK_VOCAB: VocabItem[] = [
  {
    id: "v-01",
    kanji: "先生",
    reading: "せんせい",
    meaningVi: "Thầy cô giáo, giáo viên, bác sĩ",
    romaji: "sensei",
    pos: "Danh từ",
    exampleJa: "田中先生は優しいです。",
    exampleReading: "たなかせんせいはやさしいです。",
    exampleVi: "Thầy Tanaka rất hiền từ.",
  },
  {
    id: "v-02",
    kanji: "学生",
    reading: "がくせい",
    meaningVi: "Học sinh, sinh viên",
    romaji: "gakusei",
    pos: "Danh từ",
    exampleJa: "わたしは日本語学校の学生です。",
    exampleReading: "わたしはにほんごがっこうのがくせいです。",
    exampleVi: "Tôi là học sinh của trường tiếng Nhật.",
  },
  {
    id: "v-03",
    kanji: "日本",
    reading: "にほん",
    meaningVi: "Nhật Bản",
    romaji: "nihon",
    pos: "Danh từ",
    exampleJa: "来月、日本へ行きます。",
    exampleReading: "らいげつ、にほんへいきます。",
    exampleVi: "Tháng sau tôi sẽ đi Nhật Bản.",
  },
  {
    id: "v-04",
    kanji: "友達",
    reading: "ともだち",
    meaningVi: "Bạn bè, người bạn",
    romaji: "tomodachi",
    pos: "Danh từ",
    exampleJa: "友達と映画を見ました。",
    exampleReading: "ともだちとえいがをみました。",
    exampleVi: "Tôi đã xem phim cùng với bạn.",
  },
  {
    id: "v-05",
    kanji: "本",
    reading: "ほん",
    meaningVi: "Quyển sách",
    romaji: "hon",
    pos: "Danh từ",
    exampleJa: "この本はとても面白いです。",
    exampleReading: "このほんはとてもおもしろいです。",
    exampleVi: "Quyển sách này rất thú vị.",
  },
  {
    id: "v-06",
    kanji: "新聞",
    reading: "しんぶん",
    meaningVi: "Báo chí, tờ báo",
    romaji: "shimbun",
    pos: "Danh từ",
    exampleJa: "毎朝、新聞を読みます。",
    exampleReading: "まいあさ、しんぶんをよみます。",
    exampleVi: "Mỗi sáng tôi đều đọc báo.",
  },
  {
    id: "v-07",
    kanji: "食べる",
    reading: "たべる",
    meaningVi: "Ăn (động từ nhóm 2)",
    romaji: "taberu",
    pos: "Động từ",
    exampleJa: "朝ごはんを食べましたか。",
    exampleReading: "あさごはんをたべましたか。",
    exampleVi: "Bạn đã ăn bữa sáng chưa?",
  },
  {
    id: "v-08",
    kanji: "水",
    reading: "みず",
    meaningVi: "Nước uống, nước lạnh",
    romaji: "mizu",
    pos: "Danh từ",
    exampleJa: "冷たい水を一杯ください。",
    exampleReading: "つめたいみずをいっぱいください。",
    exampleVi: "Xin cho tôi một cốc nước lạnh.",
  },
];

export const MOCK_GRAMMAR: GrammarItem[] = [
  {
    id: "g-01",
    pattern: "N1 は N2 です",
    meaningVi: "N1 là N2 (Khẳng định danh từ)",
    formation: "[Danh từ 1] + は + [Danh từ 2] + です",
    nuanceVi: "Trợ từ は (đọc là 'wa') đánh dấu chủ đề của câu. です biểu thị sự lịch sự.",
    exampleJa: "わたしはベトナム人です。",
    exampleVi: "Tôi là người Việt Nam.",
    lessonId: "les-03",
  },
  {
    id: "g-02",
    pattern: "N1 は N2 ではありません",
    meaningVi: "N1 không phải là N2 (Phủ định danh từ)",
    formation: "[Danh từ 1] + は + [Danh từ 2] + ではありません / じゃありません",
    nuanceVi: "ではありません trang trọng hơn; じゃありません dùng phổ biến trong giao tiếp hàng ngày.",
    exampleJa: "山田さんは医者ではありません。",
    exampleVi: "Anh Yamada không phải là bác sĩ.",
    lessonId: "les-03",
  },
  {
    id: "g-03",
    pattern: "V-てください (V-te kudasai)",
    meaningVi: "Xin hãy làm V... (Yêu cầu lịch sự)",
    formation: "Động từ chia thể て (Te) + ください",
    nuanceVi: "Dùng để nhờ vả, chỉ dẫn hoặc khuyên bảo người nghe thực hiện một hành động.",
    exampleJa: "ここに名前を書いてください。",
    exampleVi: "Xin hãy viết tên của bạn vào đây.",
    lessonId: "les-05",
  },
  {
    id: "g-04",
    pattern: "V-てもいいです (V-te mo ii desu)",
    meaningVi: "Làm V có được không? / Được phép làm V",
    formation: "Động từ thể て + もいいです",
    nuanceVi: "Dùng khi xin phép hoặc cho phép người khác làm điều gì đó.",
    exampleJa: "写真を撮ってもいいですか。",
    exampleVi: "Tôi chụp ảnh ở đây có được không?",
    lessonId: "les-05",
  },
];
