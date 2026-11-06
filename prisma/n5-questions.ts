// Ngân hàng câu hỏi N5 dùng để seed (đáp án chỉ chứa tiếng Nhật; nghĩa tiếng Việt nằm ở phần giải thích).
// Đây là bộ câu hỏi luyện tập mẫu do dự án biên soạn, KHÔNG phải đề thi JLPT chính thức.
// Nội dung nên được giáo viên tiếng Nhật rà soát trước khi phát hành cho người học thật.

export type N5QuestionKind = "KANJI_READING" | "BLANK_CHOICE";
export type N5SkillTag = "Từ vựng N5" | "Chữ Hán N5" | "Ngữ pháp N5";

export interface N5Question {
  kind: N5QuestionKind;
  skillTag: N5SkillTag;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationVi: string;
}

export const N5_QUESTION_BANK: N5Question[] = [
  // ---- Chữ Hán (cách đọc) ----
  {
    kind: "KANJI_READING",
    skillTag: "Chữ Hán N5",
    prompt: "「水」の読み方はどれですか。",
    options: ["ひ", "みず", "き", "つち"],
    correctIndex: 1,
    explanationVi: "水 đọc là みず (nước). 火 = ひ (lửa), 木 = き (cây), 土 = つち (đất).",
  },
  {
    kind: "KANJI_READING",
    skillTag: "Chữ Hán N5",
    prompt: "「学校」の読み方はどれですか。",
    options: ["がくこう", "かっこう", "がっこう", "がっこ"],
    correctIndex: 2,
    explanationVi: "学校 đọc là がっこう (trường học). Chú ý âm ngắt っ ở giữa: がっ・こう.",
  },
  {
    kind: "KANJI_READING",
    skillTag: "Chữ Hán N5",
    prompt: "「先生」の読み方はどれですか。",
    options: ["せんせい", "さんせい", "ぜんせい", "せんせ"],
    correctIndex: 0,
    explanationVi: "先生 đọc là せんせい (giáo viên). Âm kéo dài せい phải có い ở cuối.",
  },
  {
    kind: "KANJI_READING",
    skillTag: "Chữ Hán N5",
    prompt: "「月曜日」の読み方はどれですか。",
    options: ["がつようび", "つきようび", "げつようひ", "げつようび"],
    correctIndex: 3,
    explanationVi: "月曜日 đọc là げつようび (thứ Hai). 月 trong tên thứ đọc theo âm On là げつ.",
  },
  {
    kind: "KANJI_READING",
    skillTag: "Chữ Hán N5",
    prompt: "「大きい」の読み方はどれですか。",
    options: ["だいきい", "おおきい", "おきい", "たいきい"],
    correctIndex: 1,
    explanationVi: "大きい đọc là おおきい (to, lớn). 大 trong tính từ này đọc theo âm Kun là おお.",
  },

  // ---- Từ vựng ----
  {
    kind: "BLANK_CHOICE",
    skillTag: "Từ vựng N5",
    prompt: "まいあさ 7じに（　）を たべます。",
    options: ["ばんごはん", "くるま", "でんわ", "あさごはん"],
    correctIndex: 3,
    explanationVi: "あさごはん nghĩa là bữa sáng, hợp với まいあさ (mỗi sáng). ばんごはん là bữa tối.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Từ vựng N5",
    prompt: "（　）で でんしゃに のります。",
    options: ["えき", "がっこう", "ぎんこう", "びょういん"],
    correctIndex: 0,
    explanationVi: "えき nghĩa là nhà ga, nơi lên tàu điện. がっこう là trường học, ぎんこう là ngân hàng, びょういん là bệnh viện.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Từ vựng N5",
    prompt: "あついですから、つめたい（　）を のみます。",
    options: ["ほん", "くつ", "かばん", "みず"],
    correctIndex: 3,
    explanationVi: "みず là nước, thứ có thể uống (のみます). ほん là sách, くつ là giày, かばん là cặp.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Từ vựng N5",
    prompt: "としょかんで（　）を かります。",
    options: ["くつ", "ほん", "さかな", "りんご"],
    correctIndex: 1,
    explanationVi: "ほん là sách, có thể mượn ở thư viện (かります). くつ là giày, さかな là cá, りんご là táo.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Từ vựng N5",
    prompt: "けさ 5じに おきましたから、（　）です。",
    options: ["おいしい", "たかい", "ひろい", "ねむい"],
    correctIndex: 3,
    explanationVi: "ねむい nghĩa là buồn ngủ, hợp với việc dậy sớm. おいしい là ngon, たかい là cao/đắt, ひろい là rộng.",
  },

  // ---- Ngữ pháp ----
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "わたしは ベトナムじん（　）。",
    options: ["です", "ます", "が", "ない"],
    correctIndex: 0,
    explanationVi: "Danh từ + です dùng để khẳng định: ベトナムじんです (là người Việt Nam). ます đi với động từ, không đi với danh từ.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "これは わたし（　）ほんです。",
    options: ["を", "に", "で", "の"],
    correctIndex: 3,
    explanationVi: "の nối hai danh từ để chỉ sở hữu: わたしの ほん (sách của tôi).",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "にほんご（　）べんきょうします。",
    options: ["の", "を", "に", "へ"],
    correctIndex: 1,
    explanationVi: "を đánh dấu tân ngữ của động từ: にほんごを べんきょうします (học tiếng Nhật).",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "あした ともだち（　）あいます。",
    options: ["を", "で", "が", "に"],
    correctIndex: 3,
    explanationVi: "Với động từ あいます (gặp), người được gặp đi với trợ từ に: ともだちに あいます.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "まいにち バス（　）がっこうへ いきます。",
    options: ["で", "を", "に", "が"],
    correctIndex: 0,
    explanationVi: "で chỉ phương tiện: バスで いきます (đi bằng xe buýt).",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "わたしは コーヒー（　）すきです。",
    options: ["を", "が", "に", "の"],
    correctIndex: 1,
    explanationVi: "Với すき (thích), đối tượng được thích đi với が: コーヒーが すきです.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "きのう えいがを（　）。",
    options: ["みます", "みません", "みて", "みました"],
    correctIndex: 3,
    explanationVi: "きのう (hôm qua) cần thì quá khứ: みました (đã xem).",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "ここで しゃしんを（　）ください。",
    options: ["とる", "とって", "とります", "とった"],
    correctIndex: 1,
    explanationVi: "Mẫu câu nhờ vả: động từ thể て + ください. とって ください nghĩa là hãy chụp giúp.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "あの ひとは（　）ですか。",
    options: ["なに", "いつ", "だれ", "どこ"],
    correctIndex: 2,
    explanationVi: "だれ là từ để hỏi người: あの ひとは だれですか (người kia là ai?). なに hỏi vật, いつ hỏi thời gian, どこ hỏi nơi chốn.",
  },
  {
    kind: "BLANK_CHOICE",
    skillTag: "Ngữ pháp N5",
    prompt: "としょかんは えきの（　）に あります。",
    options: ["となり", "はは", "あさ", "くるま"],
    correctIndex: 0,
    explanationVi: "となり nghĩa là bên cạnh; mẫu 〜の となり chỉ vị trí: えきの となり (bên cạnh nhà ga).",
  },
];
