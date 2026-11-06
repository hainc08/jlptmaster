import {
  PrismaClient,
  Role,
  UserStatus,
  Plan,
  LevelStatus,
  ContentStatus,
  ContentKind,
  QuestionType,
  SectionType,
} from "@prisma/client";
import { createHash } from "node:crypto";
import { hashPassword } from "../src/server/services/password-service";
import { DEMO_PASSWORDS } from "./demo-credentials";
import { N5_QUESTION_BANK } from "./n5-questions";
import { importContent } from "./import-content";
import { N5_READING_PASSAGES, N5_LISTENING_TRACKS, type BankQuestion } from "./n5-reading-listening";

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

  // Admin CMS fields are written on create only, so re-seeding never overwrites edits made in the CMS.
  const levelCms: Record<string, { status: LevelStatus; description: string }> = {
    N5: { status: LevelStatus.PUBLISHED, description: "Ngữ pháp cơ bản, khoảng 800 từ vựng và 100 chữ Hán. Cấp độ phát hành đầu tiên." },
    N4: { status: LevelStatus.DRAFT, description: "Ngữ pháp sơ cấp và khoảng 300 chữ Hán. Nội dung đang được biên tập." },
    N3: { status: LevelStatus.DRAFT, description: "Cấp độ cầu nối giữa tiếng Nhật đời sống và học thuật." },
    N2: { status: LevelStatus.COMING_SOON, description: "Đọc và nghe ở mức công việc. Sắp ra mắt." },
    N1: { status: LevelStatus.COMING_SOON, description: "Tiếng Nhật học thuật và chuyên môn nâng cao. Sắp ra mắt." },
  };
  for (const lvl of levels) {
    await prisma.jlptLevel.upsert({
      where: { id: lvl.id },
      update: lvl,
      create: { ...lvl, ...levelCms[lvl.id], displayOrder: lvl.rankOrder, passScore: 60 },
    });
    // Levels that predate the CMS columns get their description once; later edits are never overwritten.
    await prisma.jlptLevel.updateMany({ where: { id: lvl.id, description: "" }, data: { description: levelCms[lvl.id].description } });
  }
  console.log("✔ Đã seed 5 cấp độ JLPT (N5 kích hoạt)");

  // 1b. Admin CMS defaults: role × module permissions and system settings (create-only).
  const modules = ["dashboard", "members", "levels", "settings", "audit"] as const;
  const defaults: Record<string, readonly string[]> = {
    OWNER: modules,
    ADMIN: modules,
    EDITOR: ["dashboard", "levels"],
    SUPPORT: ["dashboard", "members", "audit"],
  };
  for (const [role, allowedModules] of Object.entries(defaults)) {
    for (const mod of modules) {
      await prisma.rolePermission.upsert({
        where: { role_module: { role: role as Role, module: mod } },
        update: {},
        create: { role: role as Role, module: mod, allowed: allowedModules.includes(mod) },
      });
    }
  }
  const settingDefaults: Record<string, object> = {
    general: { siteName: "JLPT Master", defaultLanguage: "vi" },
    exam_rules: { timeLimitMin: 105, retakeLimit: 3, passThreshold: 60 },
    notifications: { welcome: true, passwordReset: true, examResult: true, weeklyDigest: false, suspension: true, planExpiry: true },
  };
  for (const [key, valueJson] of Object.entries(settingDefaults)) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, valueJson } });
  }
  console.log("✔ Đã seed ma trận quyền CMS và cài đặt hệ thống mặc định");

  // 1c. Mock learners for the admin member list (no password => they cannot log in).
  const mock: Array<[string, string, string, Plan, UserStatus, number]> = [
    ["Nguyễn Minh Anh", "minh.anh", "N5", Plan.FREE, UserStatus.ACTIVE, 2], ["Trần Quốc Bảo", "quoc.bao", "N5", Plan.STANDARD, UserStatus.ACTIVE, 5],
    ["Lê Thu Hà", "thu.ha", "N5", Plan.PREMIUM, UserStatus.ACTIVE, 9], ["Phạm Gia Huy", "gia.huy", "N4", Plan.FREE, UserStatus.PENDING_VERIFICATION, 12],
    ["Hoàng Ngọc Lan", "ngoc.lan", "N5", Plan.STANDARD, UserStatus.ACTIVE, 16], ["Vũ Đức Anh", "duc.anh", "N3", Plan.FREE, UserStatus.SUSPENDED, 20],
    ["Đặng Thùy Linh", "thuy.linh", "N5", Plan.PREMIUM, UserStatus.ACTIVE, 25], ["Bùi Tuấn Kiệt", "tuan.kiet", "N4", Plan.STANDARD, UserStatus.ACTIVE, 31],
    ["Ngô Thanh Mai", "thanh.mai", "N5", Plan.FREE, UserStatus.ACTIVE, 38], ["Dương Hải Đăng", "hai.dang", "N2", Plan.PREMIUM, UserStatus.ACTIVE, 44],
    ["Phan Khánh Vy", "khanh.vy", "N5", Plan.STANDARD, UserStatus.ACTIVE, 51], ["Võ Hoàng Long", "hoang.long", "N4", Plan.FREE, UserStatus.ACTIVE, 58],
    ["Đỗ Phương Thảo", "phuong.thao", "N5", Plan.PREMIUM, UserStatus.ACTIVE, 66], ["Lý Anh Tuấn", "anh.tuan", "N1", Plan.STANDARD, UserStatus.ACTIVE, 75],
    ["田中 美咲", "tanaka.misaki", "N5", Plan.FREE, UserStatus.ACTIVE, 3], ["佐藤 健太", "sato.kenta", "N4", Plan.STANDARD, UserStatus.ACTIVE, 6],
    ["鈴木 あかり", "suzuki.akari", "N3", Plan.PREMIUM, UserStatus.ACTIVE, 10], ["高橋 蓮", "takahashi.ren", "N5", Plan.FREE, UserStatus.PENDING_VERIFICATION, 14],
    ["伊藤 結衣", "ito.yui", "N4", Plan.STANDARD, UserStatus.ACTIVE, 18], ["渡辺 大輔", "watanabe.daisuke", "N5", Plan.FREE, UserStatus.SUSPENDED, 27],
    ["山本 さくら", "yamamoto.sakura", "N2", Plan.PREMIUM, UserStatus.ACTIVE, 33], ["中村 翔太", "nakamura.shota", "N3", Plan.STANDARD, UserStatus.ACTIVE, 40],
    ["小林 美月", "kobayashi.mizuki", "N5", Plan.FREE, UserStatus.ACTIVE, 47], ["加藤 陽介", "kato.yosuke", "N4", Plan.PREMIUM, UserStatus.ACTIVE, 55],
    ["吉田 凛", "yoshida.rin", "N5", Plan.STANDARD, UserStatus.ACTIVE, 62], ["山田 拓海", "yamada.takumi", "N5", Plan.FREE, UserStatus.ACTIVE, 70],
  ];
  const DAY = 86_400_000;
  for (const [i, [displayName, local, level, plan, status, ageDays]] of mock.entries()) {
    const email = `${local}@example.com`;
    const paidExpired = plan !== Plan.FREE && i % 5 === 3; // a few lapsed paid plans => derived EXPIRED
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        displayName,
        role: Role.STUDENT,
        status,
        plan,
        planExpiresAt: plan === Plan.FREE ? null : new Date(Date.now() + (paidExpired ? -10 : 40) * DAY),
        lastActiveAt: new Date(Date.now() - (i % 7) * DAY),
        createdAt: new Date(Date.now() - ageDays * DAY),
        profile: { create: { targetLevel: level, dailyGoalMinutes: 30 } },
      },
    });
  }
  console.log(`✔ Đã seed ${mock.length} học viên mẫu cho CMS (không có mật khẩu)`);

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

  // 2b. Real password hashes (scrypt). Never overwrite an existing real password unless
  // SEED_RESET_PASSWORDS=1. Where the password comes from:
  //   1) SEED_ADMIN_PASSWORD / SEED_STUDENT_PASSWORD (use these in production), else
  //   2) public demo passwords ONLY when SEED_DEMO_PASSWORDS=1 (local dev / CI), else
  //   3) none: the account cannot log in until a password is set.
  const useDemo = process.env.SEED_DEMO_PASSWORDS === "1";
  const resetAll = process.env.SEED_RESET_PASSWORDS === "1";
  for (const acct of [
    { email: adminEmail, envPassword: process.env.SEED_ADMIN_PASSWORD, demo: DEMO_PASSWORDS.admin, label: "quản trị" },
    { email: "minh@jlptmaster.vn", envPassword: process.env.SEED_STUDENT_PASSWORD, demo: DEMO_PASSWORDS.student, label: "học viên mẫu" },
  ]) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: acct.email } });
    const hasRealHash = (user.passwordHash ?? "").startsWith("scrypt$");
    if (hasRealHash && !(resetAll && acct.envPassword)) continue;
    const password = acct.envPassword || (useDemo ? acct.demo : "");
    if (!password) {
      console.warn(`⚠ Tài khoản ${acct.label} (${acct.email}) chưa có mật khẩu. Đặt SEED_${acct.label === "quản trị" ? "ADMIN" : "STUDENT"}_PASSWORD rồi chạy lại seed.`);
      continue;
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    console.log(`✔ Đã đặt mật khẩu cho tài khoản ${acct.label} (${acct.email})`);
  }

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

  // 8. Practice Questions: real N5 bank (idempotent, updates in place by stable order so
  //    existing exam_questions / attempt_answers foreign keys are preserved)
  // Questions imported from prisma/content/** carry a stable `promptJson.key` and are owned by import-content.ts;
  // they must never be picked up (and overwritten) here. (A NOT-on-JSON filter would drop rows without a key
  // because JSON_EXTRACT yields NULL, so exclude by id instead.)
  const importedN5Ids = (
    await prisma.question.findMany({
      where: { levelId: "N5", contentItemId: null, promptJson: { path: "$.key", string_starts_with: "n5-" } },
      select: { id: true },
    })
  ).map((q) => q.id);
  const existingQuestions = await prisma.question.findMany({
    where: { levelId: "N5", contentItemId: null, id: { notIn: importedN5Ids } },
    orderBy: { id: "asc" },
    take: N5_QUESTION_BANK.length,
  });

  for (let i = 0; i < N5_QUESTION_BANK.length; i++) {
    const bank = N5_QUESTION_BANK[i];
    const data = {
      levelId: "N5",
      questionType: bank.kind === "KANJI_READING" ? QuestionType.KANJI_READING : QuestionType.BLANK_CHOICE,
      promptJson: { text: bank.prompt },
      explanationVi: bank.explanationVi,
      difficulty: 1,
      skillTag: bank.skillTag,
      status: ContentStatus.PUBLISHED,
    };
    const optionRows = bank.options.map((text, idx) => ({
      position: idx + 1,
      textJson: { text },
      isCorrect: idx === bank.correctIndex,
    }));

    if (existingQuestions[i]) {
      const q = existingQuestions[i];
      await prisma.question.update({ where: { id: q.id }, data });
      await prisma.questionOption.deleteMany({ where: { questionId: q.id } });
      await prisma.questionOption.createMany({
        data: optionRows.map((o) => ({ ...o, questionId: q.id })),
      });
    } else {
      const created = await prisma.question.create({ data: { ...data, options: { create: optionRows } } });
      existingQuestions.push(created);
    }
  }
  console.log(`✔ Đã đảm bảo ${existingQuestions.length} câu hỏi luyện tập N5 (ngân hàng thật)`);

  // 8b. Reading passages & listening tracks (original content; questions linked via content item)
  const seedAdmin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });

  async function syncContextQuestions(
    contentItemId: string,
    kind: "READING" | "LISTENING",
    skillTag: string,
    questions: BankQuestion[]
  ) {
    const existing = await prisma.question.findMany({ where: { contentItemId }, orderBy: { id: "asc" } });
    const out: { id: string }[] = [];
    for (let i = 0; i < questions.length; i++) {
      const bank = questions[i];
      const data = {
        levelId: "N5",
        contentItemId,
        questionType: kind === "READING" ? QuestionType.READING : QuestionType.LISTENING,
        promptJson: { text: bank.prompt },
        explanationVi: bank.explanationVi,
        difficulty: 1,
        skillTag,
        status: ContentStatus.PUBLISHED,
      };
      const optionRows = bank.options.map((text, idx) => ({
        position: idx + 1,
        textJson: { text },
        isCorrect: idx === bank.correctIndex,
      }));
      if (existing[i]) {
        await prisma.question.update({ where: { id: existing[i].id }, data });
        await prisma.questionOption.deleteMany({ where: { questionId: existing[i].id } });
        await prisma.questionOption.createMany({
          data: optionRows.map((o) => ({ ...o, questionId: existing[i].id })),
        });
        out.push(existing[i]);
      } else {
        out.push(await prisma.question.create({ data: { ...data, options: { create: optionRows } } }));
      }
    }
    return out;
  }

  const readingQuestions: { id: string }[] = [];
  for (const p of N5_READING_PASSAGES) {
    let item = await prisma.contentItem.findFirst({ where: { levelId: "N5", kind: ContentKind.READING, slug: p.slug } });
    if (!item) {
      item = await prisma.contentItem.create({
        data: { levelId: "N5", kind: ContentKind.READING, slug: p.slug, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      });
    } else if (item.status !== ContentStatus.PUBLISHED) {
      item = await prisma.contentItem.update({
        where: { id: item.id },
        data: { status: ContentStatus.PUBLISHED, publishedAt: item.publishedAt ?? new Date() },
      });
    }
    await prisma.readingPassage.upsert({
      where: { contentItemId: item.id },
      update: { textJa: p.textJa, translatedVi: p.translatedVi, difficulty: p.difficulty, copyrightSource: p.copyrightSource },
      create: {
        contentItemId: item.id,
        textJa: p.textJa,
        translatedVi: p.translatedVi,
        difficulty: p.difficulty,
        copyrightSource: p.copyrightSource,
      },
    });
    readingQuestions.push(...(await syncContextQuestions(item.id, "READING", "Đọc hiểu N5", p.questions)));
  }

  const listeningQuestions: { id: string }[] = [];
  for (const t of N5_LISTENING_TRACKS) {
    // No real audio file exists yet: the "asset" records that playback uses browser text-to-speech.
    const storageKey = `tts:${t.slug}`;
    const asset = await prisma.mediaAsset.upsert({
      where: { storageKey },
      update: {},
      create: {
        storageKey,
        mimeType: "text/plain",
        byteSize: Buffer.byteLength(t.transcriptJa, "utf8"),
        sha256: createHash("sha256").update(t.transcriptJa).digest("hex"),
        licenseType: "TTS_BROWSER",
        attribution: "Giọng đọc tổng hợp của trình duyệt (Web Speech API) đọc lời thoại gốc của dự án; chưa có file ghi âm thật.",
        ownerId: seedAdmin.id,
      },
    });
    let item = await prisma.contentItem.findFirst({ where: { levelId: "N5", kind: ContentKind.LISTENING, slug: t.slug } });
    if (!item) {
      item = await prisma.contentItem.create({
        data: { levelId: "N5", kind: ContentKind.LISTENING, slug: t.slug, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      });
    } else if (item.status !== ContentStatus.PUBLISHED) {
      item = await prisma.contentItem.update({
        where: { id: item.id },
        data: { status: ContentStatus.PUBLISHED, publishedAt: item.publishedAt ?? new Date() },
      });
    }
    await prisma.listeningTrack.upsert({
      where: { contentItemId: item.id },
      update: { transcriptJa: t.transcriptJa, transcriptVi: t.transcriptVi, durationSeconds: t.durationSeconds, mediaAssetId: asset.id },
      create: {
        contentItemId: item.id,
        mediaAssetId: asset.id,
        transcriptJa: t.transcriptJa,
        transcriptVi: t.transcriptVi,
        durationSeconds: t.durationSeconds,
      },
    });
    listeningQuestions.push(...(await syncContextQuestions(item.id, "LISTENING", "Nghe hiểu N5", t.questions)));
  }
  console.log(`✔ Đã seed ${N5_READING_PASSAGES.length} bài đọc hiểu và ${N5_LISTENING_TRACKS.length} bài nghe hiểu N5`);

  // 9. Full Demo Mock Exam (3 sections + linked questions, idempotent)
  // Exam "Số 01" is the first/original N5 exam; additional N5 exams (e.g. "Số 02") come from prisma/content/**.
  let mockExam = await prisma.exam.findFirst({
    where: { levelId: "N5", NOT: [{ title: { contains: "Số 02" } }, { title: { startsWith: "TEST" } }] },
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

  // Link questions to sections: 1 = vocabulary & kanji, 2 = grammar + reading, 3 = listening.
  const plan: Array<{ sectionIndex: number; questions: { id: string }[] }> = [
    { sectionIndex: 0, questions: existingQuestions.slice(0, 10) },
    { sectionIndex: 1, questions: [...existingQuestions.slice(10, 20), ...readingQuestions] },
    { sectionIndex: 2, questions: listeningQuestions },
  ];
  for (const { sectionIndex, questions } of plan) {
    const section = mockExam.sections[sectionIndex];
    if (!section) continue;
    const current = await prisma.examQuestion.findMany({
      where: { sectionId: section.id },
      orderBy: { position: "asc" },
    });
    const same =
      current.length === questions.length && current.every((c, i) => c.questionId === questions[i].id);
    if (same) continue;
    await prisma.examQuestion.deleteMany({ where: { sectionId: section.id } });
    for (let i = 0; i < questions.length; i++) {
      await prisma.examQuestion.create({
        data: { sectionId: section.id, questionId: questions[i].id, position: i + 1, points: 3 },
      });
    }
  }
  console.log(`✔ Đã seed đề thi thử JLPT N5: ${mockExam.title}`);

  // 10. Đề thi thử N4–N1 (+ N5 đề bổ sung) từ prisma/content/** — idempotent, luôn ở DRAFT cho tới khi chủ dự án duyệt.
  await importContent(prisma, { log: console.log });

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
