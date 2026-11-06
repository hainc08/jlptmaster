// Đọc hiểu & Nghe hiểu N5 dùng để seed.
// Toàn bộ đoạn văn và hội thoại là NỘI DUNG GỐC do dự án tự biên soạn (không trích từ đề JLPT hay sách có bản quyền).
// Phần nghe: chưa có file âm thanh thật. Hệ thống dùng giọng đọc tổng hợp của trình duyệt (Web Speech API)
// đọc lời thoại; khi có file audio thật thì tải lên MediaAsset và thay thế.
// Nội dung nên được giáo viên tiếng Nhật rà soát trước khi phát hành cho người học thật.

export interface BankQuestion {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationVi: string;
}

export interface ReadingPassageSeed {
  slug: string;
  textJa: string;
  translatedVi: string;
  difficulty: number;
  copyrightSource: string;
  questions: BankQuestion[];
}

export interface ListeningTrackSeed {
  slug: string;
  transcriptJa: string;
  transcriptVi: string;
  durationSeconds: number;
  questions: BankQuestion[];
}

export const ORIGINAL_SOURCE = "Nội dung gốc do đội ngũ dự án JLPT Master biên soạn";

export const N5_READING_PASSAGES: ReadingPassageSeed[] = [
  {
    slug: "doc-hieu-n5-01-heya",
    textJa:
      "わたしの へやは にかいに あります。へやに つくえと ベッドが あります。つくえの うえに ほんが さんさつ あります。まいばん、ここで にほんごを べんきょうします。",
    translatedVi:
      "Phòng của tôi ở tầng hai. Trong phòng có bàn học và giường. Trên bàn có ba quyển sách. Mỗi tối, tôi học tiếng Nhật ở đây.",
    difficulty: 1,
    copyrightSource: ORIGINAL_SOURCE,
    questions: [
      {
        prompt: "わたしの へやは どこに ありますか。",
        options: ["いっかい", "にかい", "さんがい", "よんかい"],
        correctIndex: 1,
        explanationVi: "Câu đầu: 「へやは にかいに あります」 — phòng ở tầng hai nên đáp án là にかい.",
      },
      {
        prompt: "つくえの うえに なにが ありますか。",
        options: ["ベッド", "テレビ", "ほん", "いす"],
        correctIndex: 2,
        explanationVi: "Bài viết nói 「つくえの うえに ほんが さんさつ あります」 — trên bàn có sách nên đáp án là ほん. ベッド (giường) ở trong phòng, không ở trên bàn.",
      },
    ],
  },
  {
    slug: "doc-hieu-n5-02-nichiyoubi",
    textJa:
      "きのうは にちようびでした。あさ ともだちと こうえんへ いきました。こうえんで サッカーを しました。ひるごはんは ともだちの うちで カレーを たべました。よる うちへ かえりました。",
    translatedVi:
      "Hôm qua là Chủ nhật. Buổi sáng tôi đi công viên cùng bạn. Ở công viên chúng tôi chơi bóng đá. Bữa trưa tôi ăn cà ri ở nhà bạn. Buổi tối tôi về nhà.",
    difficulty: 1,
    copyrightSource: ORIGINAL_SOURCE,
    questions: [
      {
        prompt: "ひるごはんは どこで たべましたか。",
        options: ["こうえん", "ともだちの うち", "レストラン", "がっこう"],
        correctIndex: 1,
        explanationVi: "Bài viết nói 「ひるごはんは ともだちの うちで カレーを たべました」 — ăn trưa ở nhà bạn nên đáp án là ともだちの うち.",
      },
      {
        prompt: "こうえんで なにを しましたか。",
        options: ["サッカー", "かいもの", "べんきょう", "りょうり"],
        correctIndex: 0,
        explanationVi: "Bài viết nói 「こうえんで サッカーを しました」 — ở công viên chơi bóng đá nên đáp án là サッカー.",
      },
    ],
  },
];

export const N5_LISTENING_TRACKS: ListeningTrackSeed[] = [
  {
    slug: "nghe-hieu-n5-01-eki",
    transcriptJa:
      "おんなの ひと：すみません、えきは どこですか。 おとこの ひと：あの ぎんこうの となりです。 おんなの ひと：ありがとうございます。",
    transcriptVi:
      "Nữ: Xin lỗi, nhà ga ở đâu ạ? Nam: Ở bên cạnh ngân hàng kia. Nữ: Cảm ơn anh.",
    durationSeconds: 20,
    questions: [
      {
        prompt: "おんなの ひとは どこへ いきたいですか。",
        options: ["ぎんこう", "がっこう", "びょういん", "えき"],
        correctIndex: 3,
        explanationVi: "Người phụ nữ hỏi 「えきは どこですか」 — cô ấy muốn đến nhà ga nên đáp án là えき.",
      },
      {
        prompt: "えきは どこに ありますか。",
        options: ["ぎんこうの となり", "がっこうの まえ", "びょういんの うしろ", "ぎんこうの まえ"],
        correctIndex: 0,
        explanationVi: "Người đàn ông trả lời 「あの ぎんこうの となりです」 — nhà ga ở bên cạnh ngân hàng nên đáp án là ぎんこうの となり.",
      },
    ],
  },
  {
    slug: "nghe-hieu-n5-02-nomimono",
    transcriptJa:
      "おとこの ひと：なにを のみますか。 おんなの ひと：わたしは コーヒーを おねがいします。 おとこの ひと：わたしは おちゃに します。",
    transcriptVi:
      "Nam: Bạn uống gì? Nữ: Cho tôi cà phê. Nam: Tôi chọn trà.",
    durationSeconds: 18,
    questions: [
      {
        prompt: "おんなの ひとは なにを のみますか。",
        options: ["おちゃ", "みず", "コーヒー", "ぎゅうにゅう"],
        correctIndex: 2,
        explanationVi: "Người phụ nữ nói 「コーヒーを おねがいします」 — cô ấy uống cà phê nên đáp án là コーヒー.",
      },
      {
        prompt: "おとこの ひとは なにを のみますか。",
        options: ["コーヒー", "みず", "ジュース", "おちゃ"],
        correctIndex: 3,
        explanationVi: "Người đàn ông nói 「おちゃに します」 — anh ấy chọn trà nên đáp án là おちゃ.",
      },
    ],
  },
];
