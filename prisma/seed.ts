import {
  PrismaClient,
  Role,
  UserStatus,
  ContentStatus,
  ContentKind,
  QuestionType,
  SectionType,
} from "@prisma/client";

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log("--- BẮT ĐẦU SEED DỮ LIỆU CHUẨN JLPT N5 VÀO MARIADB (IDEMPOTENT) ---");

  // 1. JLPT Levels
  const levels = [
    { id: "N5", nameVi: "Nhập môn căn bản", rankOrder: 1, isActive: true },
    { id: "N4", nameVi: "Sơ cấp mở rộng", rankOrder: 2, isActive: false },
    { id: "N3", nameVi: "Trung cấp", rankOrder: 3, isActive: false },
    { id: "N2", nameVi: "Trung - Cao cấp", rankOrder: 4, isActive: false },
    { id: "N1", nameVi: "Cao cấp chuyên sâu", rankOrder: 5, isActive: false },
  ];

  for (const lvl of levels) {
    await prisma.jlptLevel.upsert({
      where: { id: lvl.id },
      update: lvl,
      create: lvl,
    });
  }
  console.log("✔ Đã seed 5 cấp độ JLPT (N5 kích hoạt)");

  // 2. Demo Users (Admin and Student)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@jlptmaster.vn";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$local_demo_hash_admin",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          targetLevel: "N5",
          dailyGoalMinutes: 45,
          onboardingCompletedAt: new Date(),
        },
      },
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "minh@jlptmaster.vn" },
    update: {},
    create: {
      email: "minh@jlptmaster.vn",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$local_demo_hash_student",
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          targetLevel: "N5",
          dailyGoalMinutes: 30,
          onboardingCompletedAt: new Date(),
        },
      },
    },
  });
  console.log(`✔ Đã seed tài khoản mẫu: ${adminEmail} & minh@jlptmaster.vn`);

  // 3. Course N5
  const course = await prisma.course.upsert({
    where: { slug: "khoa-hoc-jlpt-n5-toan-dien" },
    update: {
      titleVi: "Khóa học JLPT N5 Toàn diện",
      descriptionVi:
        "Lộ trình học tiếng Nhật từ con số 0: bảng chữ cái Kana, từ vựng, kanji, ngữ pháp và đề thi thử mô phỏng.",
      status: ContentStatus.PUBLISHED,
    },
    create: {
      levelId: "N5",
      slug: "khoa-hoc-jlpt-n5-toan-dien",
      titleVi: "Khóa học JLPT N5 Toàn diện",
      descriptionVi:
        "Lộ trình học tiếng Nhật từ con số 0: bảng chữ cái Kana, từ vựng, kanji, ngữ pháp và đề thi thử mô phỏng.",
      status: ContentStatus.PUBLISHED,
      version: "v1.0",
      publishedAt: new Date(),
    },
  });

  // 4. Lessons
  const lessonData = [
    {
      slug: "bai-01-kana-nhap-mon",
      titleVi: "Bài 01: Nhập môn Chữ cái Hiragana & Phát âm",
      position: 1,
      minutesEstimate: 25,
      status: ContentStatus.PUBLISHED,
    },
    {
      slug: "bai-02-chao-hoi-va-gioi-thieu",
      titleVi: "Bài 02: Chào hỏi hàng ngày & Giới thiệu bản thân",
      position: 2,
      minutesEstimate: 30,
      status: ContentStatus.PUBLISHED,
    },
    {
      slug: "bai-03-danh-tu-va-tro-tu-wa-desu",
      titleVi: "Bài 03: Khẳng định, Phủ định với Trợ từ は và です",
      position: 3,
      minutesEstimate: 35,
      status: ContentStatus.PUBLISHED,
    },
  ];

  const createdLessons: Record<string, string> = {};
  for (const l of lessonData) {
    const les = await prisma.lesson.upsert({
      where: {
        courseId_slug: { courseId: course.id, slug: l.slug },
      },
      update: { ...l, courseId: course.id },
      create: { ...l, courseId: course.id, publishedAt: new Date() },
    });
    createdLessons[l.slug] = les.id;
  }
  console.log("✔ Đã seed 3 bài học N5 cốt lõi");

  // 5. Vocabulary items (20 entries, idempotent via slug check)
  const vocabList = [
    { surface: "先生", reading: "せんせい", meaningVi: "Thầy cô giáo, giáo viên, bác sĩ", pos: "Danh từ", romaji: "sensei" },
    { surface: "学生", reading: "がくせい", meaningVi: "Học sinh, sinh viên", pos: "Danh từ", romaji: "gakusei" },
    { surface: "日本", reading: "にほん", meaningVi: "Nhật Bản", pos: "Danh từ", romaji: "nihon" },
    { surface: "友達", reading: "ともだち", meaningVi: "Bạn bè, người bạn", pos: "Danh từ", romaji: "tomodachi" },
    { surface: "本", reading: "ほん", meaningVi: "Quyển sách", pos: "Danh từ", romaji: "hon" },
    { surface: "新聞", reading: "しんぶん", meaningVi: "Báo chí, tờ báo", pos: "Danh từ", romaji: "shimbun" },
    { surface: "食べる", reading: "たべる", meaningVi: "Ăn (động từ nhóm 2)", pos: "Động từ", romaji: "taberu" },
    { surface: "飲む", reading: "のむ", meaningVi: "Uống (động từ nhóm 1)", pos: "Động từ", romaji: "nomu" },
    { surface: "水", reading: "みず", meaningVi: "Nước uống, nước lạnh", pos: "Danh từ", romaji: "mizu" },
    { surface: "お茶", reading: "おちゃ", meaningVi: "Trà, chè xanh", pos: "Danh từ", romaji: "ocha" },
    { surface: "学校", reading: "がっこう", meaningVi: "Trường học", pos: "Danh từ", romaji: "gakkou" },
    { surface: "教室", reading: "きょうしつ", meaningVi: "Phòng học, lớp học", pos: "Danh từ", romaji: "kyoushitsu" },
    { surface: "医者", reading: "いしゃ", meaningVi: "Bác sĩ", pos: "Danh từ", romaji: "isha" },
    { surface: "会社員", reading: "かいしゃいん", meaningVi: "Nhân viên công ty", pos: "Danh từ", romaji: "kaishain" },
    { surface: "行く", reading: "いく", meaningVi: "Đi (động từ chuyển động)", pos: "Động từ", romaji: "iku" },
    { surface: "来る", reading: "くる", meaningVi: "Đến (động từ bất quy tắc)", pos: "Động từ", romaji: "kuru" },
    { surface: "帰る", reading: "かえる", meaningVi: "Về nhà, trở về", pos: "Động từ", romaji: "kaeru" },
    { surface: "大きい", reading: "おおきい", meaningVi: "To lớn (tính từ đuôi i)", pos: "Tính từ", romaji: "ookii" },
    { surface: "小さい", reading: "ちいさい", meaningVi: "Nhỏ bé (tính từ đuôi i)", pos: "Tính từ", romaji: "chiisai" },
    { surface: "見る", reading: "みる", meaningVi: "Xem, nhìn, ngắm", pos: "Động từ", romaji: "miru" },
  ];

  const seededVocabContentIds: string[] = [];
  for (const v of vocabList) {
    const slug = `vocab-${v.romaji}`;
    const searchNormalized = `${v.romaji} ${v.surface} ${v.reading} ${v.meaningVi}`.toLowerCase();

    const existing = await prisma.contentItem.findFirst({
      where: { levelId: "N5", kind: ContentKind.VOCAB, slug },
    });

    if (existing) {
      seededVocabContentIds.push(existing.id);
      await prisma.vocabulary.upsert({
        where: { contentItemId: existing.id },
        update: {
          surface: v.surface,
          reading: v.reading,
          meaningVi: v.meaningVi,
          pos: v.pos,
          searchNormalized,
        },
        create: {
          contentItemId: existing.id,
          surface: v.surface,
          reading: v.reading,
          meaningVi: v.meaningVi,
          pos: v.pos,
          exampleJa: `${v.surface} はとても大切です。`,
          exampleReading: `${v.reading} はとてもたいせつです。`,
          exampleVi: `Ví dụ: ${v.meaningVi} rất quan trọng.`,
          searchNormalized,
        },
      });
    } else {
      const created = await prisma.contentItem.create({
        data: {
          levelId: "N5",
          lessonId: createdLessons["bai-03-danh-tu-va-tro-tu-wa-desu"],
          kind: ContentKind.VOCAB,
          slug,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          vocabulary: {
            create: {
              surface: v.surface,
              reading: v.reading,
              meaningVi: v.meaningVi,
              pos: v.pos,
              exampleJa: `${v.surface} はとても大切です。`,
              exampleReading: `${v.reading} はとてもたいせつです。`,
              exampleVi: `Ví dụ: ${v.meaningVi} rất quan trọng.`,
              searchNormalized,
            },
          },
        },
      });
      seededVocabContentIds.push(created.id);
    }
  }
  console.log(`✔ Đã seed ${vocabList.length} từ vựng N5 chuẩn hóa tìm kiếm`);

  // 5b. Seed initial SRS ReviewCards for demo student (first 8 vocab items)
  for (const contentItemId of seededVocabContentIds.slice(0, 8)) {
    await prisma.reviewCard.upsert({
      where: {
        userId_contentItemId: {
          userId: studentUser.id,
          contentItemId,
        },
      },
      update: {},
      create: {
        userId: studentUser.id,
        contentItemId,
        dueAt: new Date(Date.now() - 60_000), // Due immediately
        intervalSeconds: 0,
        easeFactor: 2.5,
        repetitions: 0,
      },
    });
  }
  console.log("✔ Đã seed 8 thẻ nhớ SRS đến hạn cho học viên mẫu");

  // 6. Kanji items (5 entries, idempotent via unique character)
  const kanjiList = [
    { char: "先", hanViet: "TIÊN", on: ["セン"], kun: ["さき", "まず"], mean: "Trước, đi đầu", strokes: 6 },
    { char: "生", hanViet: "SINH", on: ["セイ", "ショウ"], kun: ["い.きる", "う.まれる"], mean: "Sinh ra, sống", strokes: 5 },
    { char: "学", hanViet: "HỌC", on: ["ガク"], kun: ["まな.ぶ"], mean: "Học tập, trường", strokes: 8 },
    { char: "日", hanViet: "NHẬT", on: ["ニチ", "ジツ"], kun: ["ひ", "-び"], mean: "Mặt trời, ngày", strokes: 4 },
    { char: "本", hanViet: "BẢN", on: ["ホン"], kun: ["もと"], mean: "Gốc, sách", strokes: 5 },
  ];

  for (const k of kanjiList) {
    const existingKanji = await prisma.kanji.findUnique({
      where: { character: k.char },
    });

    if (existingKanji) {
      await prisma.kanji.update({
        where: { character: k.char },
        data: {
          hanViet: k.hanViet,
          onyomiJson: k.on,
          kunyomiJson: k.kun,
          meaningVi: k.mean,
          strokes: k.strokes,
        },
      });
    } else {
      await prisma.contentItem.create({
        data: {
          levelId: "N5",
          kind: ContentKind.KANJI,
          slug: `kanji-${k.char}`,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          kanji: {
            create: {
              character: k.char,
              hanViet: k.hanViet,
              onyomiJson: k.on,
              kunyomiJson: k.kun,
              meaningVi: k.mean,
              strokes: k.strokes,
              examplesJson: [{ word: `${k.char}生`, reading: "せんせい", meaning: "Thầy cô" }],
            },
          },
        },
      });
    }
  }
  console.log("✔ Đã seed 5 chữ Hán (Kanji) N5");

  // 7. Grammar items (5 entries, idempotent via slug)
  const grammarList = [
    { pattern: "N1 は N2 です", formation: "[N1] + は + [N2] + です", mean: "N1 là N2", nuance: "Trợ từ wa đánh dấu chủ ngữ, desu mang tính lịch sự." },
    { pattern: "N1 は N2 ではありません", formation: "[N1] + は + [N2] + ではありません", mean: "N1 không phải là N2", nuance: "Phủ định lịch sự trang trọng." },
    { pattern: "V-てください", formation: "Động từ thể て + ください", mean: "Xin hãy làm V...", nuance: "Nhờ vả, yêu cầu lịch sự." },
    { pattern: "V-てもいいです", formation: "Động từ thể て + もいいです", mean: "Được phép làm V...", nuance: "Xin phép hoặc cho phép." },
    { pattern: "N (Địa điểm) へ 行きます", formation: "[Địa điểm] + へ + 行きます", mean: "Đi đến đâu đó", nuance: "Trợ từ e (へ) chỉ phương hướng di chuyển." },
  ];

  for (let i = 0; i < grammarList.length; i++) {
    const g = grammarList[i];
    const slug = `grammar-g0${i + 1}`;
    const existingGrammarItem = await prisma.contentItem.findFirst({
      where: { levelId: "N5", kind: ContentKind.GRAMMAR, slug },
    });

    if (existingGrammarItem) {
      await prisma.grammar.upsert({
        where: { contentItemId: existingGrammarItem.id },
        update: {
          pattern: g.pattern,
          formationVi: g.formation,
          meaningVi: g.mean,
          nuanceVi: g.nuance,
        },
        create: {
          contentItemId: existingGrammarItem.id,
          pattern: g.pattern,
          formationVi: g.formation,
          meaningVi: g.mean,
          explanationVi: `Cấu trúc ngữ pháp cơ bản trong tiếng Nhật N5: ${g.mean}.`,
          examplesJson: [{ ja: "わたしはベトナム人です。", vi: "Tôi là người Việt Nam." }],
          nuanceVi: g.nuance,
        },
      });
    } else {
      await prisma.contentItem.create({
        data: {
          levelId: "N5",
          kind: ContentKind.GRAMMAR,
          slug,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          grammar: {
            create: {
              pattern: g.pattern,
              formationVi: g.formation,
              meaningVi: g.mean,
              explanationVi: `Cấu trúc ngữ pháp cơ bản trong tiếng Nhật N5: ${g.mean}.`,
              examplesJson: [{ ja: "わたしはベトナム人です。", vi: "Tôi là người Việt Nam." }],
              nuanceVi: g.nuance,
            },
          },
        },
      });
    }
  }
  console.log("✔ Đã seed 5 mẫu ngữ pháp N5");

  // 8. Practice Questions (20 questions, idempotent check)
  let existingQuestions = await prisma.question.findMany({
    where: { levelId: "N5" },
    orderBy: { id: "asc" },
    take: 20,
  });

  if (existingQuestions.length < 20) {
    for (let qIdx = existingQuestions.length + 1; qIdx <= 20; qIdx++) {
      const createdQ = await prisma.question.create({
        data: {
          levelId: "N5",
          questionType: qIdx % 2 === 0 ? QuestionType.KANJI_READING : QuestionType.BLANK_CHOICE,
          promptJson: { text: `Câu hỏi luyện tập N5 số 0${qIdx}: Chọn đáp án đúng cho câu sau.` },
          explanationVi: `Giải thích chi tiết tiếng Việt cho câu hỏi số 0${qIdx}. Đáp án đúng là lựa chọn số 1.`,
          difficulty: 1,
          skillTag: qIdx <= 10 ? "Từ vựng N5" : "Ngữ pháp N5",
          status: ContentStatus.PUBLISHED,
          options: {
            create: [
              { position: 1, textJson: { text: "Lựa chọn A (Chính xác)" }, isCorrect: true },
              { position: 2, textJson: { text: "Lựa chọn B" }, isCorrect: false },
              { position: 3, textJson: { text: "Lựa chọn C" }, isCorrect: false },
              { position: 4, textJson: { text: "Lựa chọn D" }, isCorrect: false },
            ],
          },
        },
      });
      existingQuestions.push(createdQ);
    }
  }
  console.log(`✔ Đã đảm bảo ${existingQuestions.length} câu hỏi luyện tập N5`);

  // 9. Full Demo Mock Exam (3 sections + linked questions, idempotent)
  let mockExam = await prisma.exam.findFirst({
    where: { levelId: "N5" },
    include: { sections: { orderBy: { position: "asc" } } },
  });

  if (!mockExam) {
    mockExam = await prisma.exam.create({
      data: {
        levelId: "N5",
        title: "Đề thi thử JLPT N5 — Số 01 (Mô phỏng tiêu chuẩn)",
        status: ContentStatus.PUBLISHED,
        version: "v1.0",
        scoringPolicy: "JLPT_SCALE_180",
        publishedAt: new Date(),
        sections: {
          create: [
            { sectionType: SectionType.VOCAB, position: 1, durationSeconds: 1200, maxInternalPoints: 60 },
            { sectionType: SectionType.GRAMMAR_READING, position: 2, durationSeconds: 2400, maxInternalPoints: 60 },
            { sectionType: SectionType.LISTENING, position: 3, durationSeconds: 1800, maxInternalPoints: 60 },
          ],
        },
      },
      include: { sections: { orderBy: { position: "asc" } } },
    });
  }

  // Ensure ExamSection 1 has linked questions so mock exam attempts always contain questions
  if (mockExam.sections.length > 0 && existingQuestions.length > 0) {
    const firstSection = mockExam.sections[0];
    const sampleQuestions = existingQuestions.slice(0, 5);
    for (let i = 0; i < sampleQuestions.length; i++) {
      await prisma.examQuestion.upsert({
        where: {
          sectionId_position: {
            sectionId: firstSection.id,
            position: i + 1,
          },
        },
        update: {
          questionId: sampleQuestions[i].id,
        },
        create: {
          sectionId: firstSection.id,
          questionId: sampleQuestions[i].id,
          position: i + 1,
          points: 2,
        },
      });
    }
  }
  console.log(`✔ Đã seed đề thi thử JLPT N5: ${mockExam.title}`);

  console.log("--- HOÀN TẤT SEED DỮ LIỆU MARIADB THÀNH CÔNG ---");
}

// Run when executed directly via CLI
if (process.argv[1]?.includes("seed")) {
  seedDatabase()
    .catch((e) => {
      console.error("Lỗi seed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
