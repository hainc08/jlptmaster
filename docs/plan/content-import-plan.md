# Kế hoạch nạp đề thi thử N4–N1 (+ N5 Đề 02) vào MariaDB

Trạng thái: **CHỜ DUYỆT** (chưa viết dữ liệu, chưa viết code). Ngày lập: 2026-11-05.

## 1. Hiện trạng đã đọc (căn cứ cho kế hoạch)

- `phase-state.yaml`: mọi phase đã duyệt; việc này là mở rộng nội dung, không đổi UI/API/schema.
- Schema: `Question.promptJson` (Json) dùng được để chứa `key`; `ExamQuestion → Question` và `AttemptAnswer → Question` là `onDelete: Restrict`, nên **không bao giờ xóa Question** đã có (chỉ ARCHIVED).
- Lượt thi cũ chấm theo `ExamAttempt.examSnapshotJson` (không theo bảng option), nên ghi lại option của câu hỏi không làm hỏng lượt thi cũ.
- `POST /exams/[id]/start`: từ chối đề không PUBLISHED (HTTP 423); context đọc/nghe lấy qua `Question.contentItem → ReadingPassage | ListeningTrack`; chỉ trả `textJa`/`transcriptJa`, không trả bản dịch hay `isCorrect`.
- Seed hiện tại (`prisma/seed.ts`) chạy mỗi lần khởi động (`scripts/setup-db.mjs` gọi `tsx prisma/seed.ts`).
- `.env`: DB local là `localhost:3306/jlpt_master` và `jlpt_master_test`. Mọi lệnh của tôi chỉ chạy trên hai DB này.

## 2. Hai xung đột với seed N5 hiện có (cần bạn quyết định, xem mục 9)

1. `seed.ts:378` lấy "20 câu N5 đầu tiên" bằng `where {levelId:"N5", contentItemId:null}`, `take 20`, `orderBy id`. Nếu Đề N5 số 02 có câu từ vựng/ngữ pháp với `contentItemId = null`, seed cũ sẽ **ghi đè nhầm** câu của đề 02 mỗi lần chạy (id là uuid ngẫu nhiên).
2. `seed.ts:527` lấy đề N5 bằng `exam.findFirst({levelId:"N5"})` không lọc theo tiêu đề. Khi có đề N5 thứ hai, seed có thể chọn nhầm đề.

→ Cả hai đều cần sửa nhỏ trong `seed.ts` ngoài phần "nối loader". Đề xuất sửa tối thiểu: (1) thêm điều kiện loại câu có `promptJson.key`; (2) lọc đề theo `title` cố định. N4/N3/N2/N1 không bị ảnh hưởng (khác `levelId`).

## 3. Định dạng dữ liệu

`prisma/content/n{4,3,2,1}/exam-01.json` (N5: `prisma/content/n5/exam-02.json`), kiểm tra bằng zod trong `prisma/content/schema.ts`. Không sửa schema Prisma, không thêm thư viện (zod đã có).

```jsonc
{
  "schemaVersion": 1,
  "level": "N4",
  "exam": { "slug": "n4-exam-01", "title": "Đề thi thử JLPT N4 — Số 01 (Mô phỏng nội bộ)", "version": "v1.0", "scoringPolicy": "JLPT_SCALE_180" },
  "sections": [
    {
      "type": "VOCAB",                       // VOCAB | GRAMMAR_READING | LISTENING
      "durationSeconds": 1800,
      "parts": [
        {
          "partKey": "kanji-yomi",           // định danh dạng bài (mondai)
          "labelVi": "Cách đọc chữ Hán",
          "questionType": "KANJI_READING",   // enum QuestionType hiện có
          "skillTag": "Chữ Hán N4",
          "items": [
            { "key": "n4-v-001", "prompt": "…", "options": ["…","…","…","…"], "correctIndex": 2,
              "explanationVi": "…", "target": "…", "confidence": "high" }   // confidence: high | check
          ]
        },
        {
          "partKey": "doc-hieu-trung-van",
          "groups": [                        // nhóm đọc/nghe dùng chung 1 văn bản
            { "groupKey": "n4-r-g01",
              "reading": { "textJa": "…", "translatedVi": "…", "difficulty": 2, "copyrightSource": "Nội dung gốc do đội ngũ dự án biên soạn" },
              "items": [ { "key": "n4-r-001", "…": "…", "evidence": "trích nguyên văn từ textJa" } ] }
            // phần nghe: "listening": { "transcriptJa", "transcriptVi", "durationSeconds" }
          ]
        }
      ]
    }
  ]
}
```

Quy ước:
- `key` duy nhất toàn cấp (`n4-v-001`, `n4-g-001`, `n4-r-001`, `n4-l-001`); lưu vào `Question.promptJson = { text, key, contentHash }`.
- Đáp án chỉ tiếng Nhật; `correctIndex` do tôi xáo trộn có kiểm soát (mỗi vị trí 15–40% trong 1 đề).
- `evidence` bắt buộc cho câu đọc/nghe: đoạn trích nguyên văn có trong văn bản nguồn. Nếu đáp án đúng phải suy luận (không xuất hiện nguyên văn) thì thêm `"inferred": true` và nêu căn cứ trong `explanationVi`.
- `confidence: "check"` → file review ghi `[CẦN GIÁO VIÊN XÁC NHẬN]`. Tôi **không có danh sách từ vựng/ngữ pháp chính thức theo cấp** để kiểm tự động, nên việc "đúng phạm vi cấp" dựa vào sự thận trọng khi soạn + cờ này + giáo viên rà soát (không tuyên bố đã kiểm chứng).

## 4. Cấu trúc đề từng cấp (số câu mục tiêu)

Số câu/thời gian dưới đây theo dạng đề JLPT công bố công khai, **là số liệu tôi nhớ chứ chưa đối chiếu nguồn trong phiên này**; bạn hoặc giáo viên nên xác nhận trước khi duyệt. Ánh xạ vào 3 `SectionType` hiện có. Với N2/N1, JLPT thật gộp "Kiến thức ngôn ngữ + Đọc hiểu" thành một khối (105/110 phút); ta tách vào 2 phần nên **thời lượng chia nội bộ** (ghi rõ trong báo cáo).

| Cấp | Phần 1: VOCAB (Chữ Hán/Từ vựng) | Phần 2: GRAMMAR_READING | Phần 3: LISTENING | Tổng |
|---|---|---|---|---|
| N4 | 30 câu: đọc Hán 9, viết Hán 6, ngữ cảnh 10, đồng nghĩa 5 — 30′ | 35 câu: ngữ pháp 15, sắp xếp ★ 5, ngữ pháp đoạn văn 5, đọc ngắn 4, đọc trung 4, tìm thông tin 2 — 60′ | 28 câu: nắm vấn đề 8, nắm ý chính 7, biểu đạt 5, đáp nhanh 8 — 35′ | ~93 |
| N3 | 35 câu: đọc Hán 8, viết Hán 6, ngữ cảnh 11, đồng nghĩa 5, cách dùng 5 — 30′ | 38 câu: ngữ pháp 13, ★ 5, đoạn văn 5, đọc ngắn 4, trung 6, dài 4, tìm thông tin 1 — 70′ | 28 câu: 6/6/3/4/9 — 40′ | ~101 |
| N2 | 32 câu: đọc Hán 5, viết Hán 5, cấu tạo từ 5, ngữ cảnh 7, đồng nghĩa 5, cách dùng 5 — chia ~35′ | 43 câu: ngữ pháp 12, ★ 5, đoạn văn 5, đọc ngắn 5, trung 9, tổng hợp 2, dài 3, tìm thông tin 2 — chia ~70′ | 32 câu: 5/6/5/12/4 — 50′ | ~107 |
| N1 | 25 câu: đọc Hán 6, ngữ cảnh 7, đồng nghĩa 6, cách dùng 6 — chia ~35′ | 44 câu: ngữ pháp 10, ★ 5, đoạn văn 5, đọc ngắn 4, trung 9, tổng hợp 2, dài 4, quan điểm 3, tìm thông tin 2 — chia ~75′ | 37 câu: 6/7/6/14/4 — 60′ | ~106 |
| N5 Đề 02 | 35 câu (25′) | 32 câu (50′) | 24 câu (30′) | ~91 |

Giới hạn do hệ thống hiện tại (sẽ ghi trong báo cáo từng cấp):
- **Không có audio thật**: nghe = lời thoại + TTS trình duyệt (`MediaAsset.licenseType = "TTS_BROWSER"`). N2–N1 chỉ soạn hội thoại/độc thoại ngắn đọc được bằng TTS.
- **Không có đề nghe dạng tranh/hình** (课題理解 có hình) và **dạng đáp nhanh** có lựa chọn được nghe ở đề thật nhưng ở app lựa chọn hiển thị dạng chữ — nghĩa là thí sinh *đọc* lựa chọn, khác trải nghiệm thật.
- Dạng sắp xếp ★ dùng `QuestionType.STAR_ORDER`: cần xác nhận UI làm bài hiển thị đúng (đề cương chỉ thấy fixture mock dùng loại này). Nếu UI không hỗ trợ, tôi đề xuất đổi sang `BLANK_CHOICE` với lựa chọn là cụm đã ghép sẵn (không sửa `app/**`).
- Điểm: `gradeExamAttempt` quy đổi `đúng/tổng × 180` → giữ nhãn "điểm quy đổi nội bộ", không tuyên bố điểm JLPT.

## 5. Loader `prisma/import-content.ts` (idempotent)

`importContent({ prisma, level?, dir? })`, đọc JSON → zod → upsert trong từng transaction cho mỗi đề.

| Đối tượng | Khóa nhận diện | Hành vi khi chạy lại |
|---|---|---|
| Question | `promptJson.key` (JSON path `$.key`) | Có rồi: so `contentHash` (SHA-256 của prompt+options+explanation+tag); khác mới cập nhật. Giữ nguyên `id`. Không bao giờ DELETE. Key bị xóa khỏi JSON → `ARCHIVED`. |
| QuestionOption | (questionId, position) | Chỉ ghi lại khi hash đổi (giữ id option khi không đổi). |
| ContentItem (READING/LISTENING) | (levelId, kind, slug = `groupKey`) | upsert + ReadingPassage/ListeningTrack upsert theo `contentItemId`. |
| MediaAsset (TTS) | `storageKey = tts:{groupKey}` | upsert; `ownerId` = tài khoản admin seed (loader chạy sau bước user của seed). |
| Exam | (levelId, `title`) | Tìm theo tiêu đề cố định; tạo mới ở **DRAFT**. |
| ExamSection / ExamQuestion | (examId, position) | So sánh danh sách, chỉ ghi lại khi khác; `ExamQuestion` không bị lượt thi tham chiếu nên xóa/tạo lại an toàn. |

Quy tắc an toàn:
- Loader **không bao giờ đổi `Exam.status`** của đề đã tồn tại (đề đã được bạn PUBLISHED sẽ không bị seed hạ về DRAFT).
- Nếu đề đang PUBLISHED mà nội dung JSON đổi → loader **từ chối** (báo lỗi, cần cờ `--allow-published-update` + tăng `version`) để học viên không bị đổi đề giữa chừng.
- Câu hỏi/Passage luôn `DRAFT` khi tạo; chỉ khi bạn duyệt đề mới đổi sang PUBLISHED (việc đó nằm ngoài loader, do bạn thực hiện/cho phép).
- Mục tiêu DB: tests tự kiểm `DATABASE_URL` host là `localhost`/`127.0.0.1` trước khi ghi, nếu không thì dừng.
- Nối vào `seed.ts` bằng một dòng gọi `importContent()` ở cuối `seedDatabase()`.

Rủi ro triển khai (chỉ báo, không đụng `scripts/**`): bản build standalone production có thể **không kèm thư mục `prisma/content/*.json`**; cần kiểm tra `next.config`/lệnh deploy trước khi phát hành. Ngoài phạm vi sửa của tôi.

## 6. Kế hoạch test (TDD, mỗi cấp)

**Test dữ liệu** `tests/unit/content-bank.test.ts` (chạy lặp qua danh sách cấp; thêm cấp vào danh sách → RED vì thiếu file):
1. JSON qua zod; đủ số câu từng phần/dạng đúng bảng mục 4.
2. `key` duy nhất và đúng tiền tố cấp; prompt không trùng.
3. 4 đáp án khác nhau, đúng 1 đáp án đúng, `correctIndex` hợp lệ.
4. Đáp án không có ký tự tiếng Việt, không chứa "chính xác/đúng/correct/lựa chọn".
5. Phân bố vị trí đáp án đúng: mỗi vị trí 15–40%.
6. `explanationVi` có tiếng Việt và chứa văn bản đáp án đúng.
7. Câu đọc/nghe: `evidence` là chuỗi con của văn bản nguồn; đáp án đúng xuất hiện trong văn bản hoặc `inferred: true`.
8. Prompt/đáp án câu đọc-nghe không chứa bản dịch; `copyrightSource` = "Nội dung gốc do đội ngũ dự án biên soạn".
9. Không câu nào trùng nguyên văn với `N5_QUESTION_BANK`/các đề cấp khác.

**Test tích hợp DB** `tests/integration/content-import-n{x}.test.ts` (dùng DB local):
1. Chạy loader → đề tồn tại ở **DRAFT**, đủ 3 phần, số `ExamQuestion` đúng, mọi câu có đúng 1 option đúng, liên kết passage/track đúng.
2. Chạy loader lần 2 → số dòng mọi bảng không đổi, `id` Question không đổi (không nhân đôi).
3. Đã có `ExamAttempt` cũ trỏ vào câu hỏi → chạy lại loader không lỗi FK, snapshot cũ vẫn chấm được.
4. Đề PUBLISHED + nội dung đổi → loader từ chối.
5. API `start`: vì start chỉ nhận PUBLISHED, test sẽ phải tạm bản sao (xem mục 9, câu 3) → xác nhận trả đủ `context` đọc/nghe, đúng tiêu đề phần, **không** có `isCorrect`, `explanationVi`, `translatedVi`, `transcriptVi`.
6. Hồi quy: chạy lại toàn bộ test hiện có (trước hết ghi nhận baseline pass/fail để phân biệt lỗi sẵn có).

Lệnh: `npx vitest run tests/unit/content-bank.test.ts tests/integration/content-import-n4.test.ts` rồi `npx vitest run`. Mọi kết quả sẽ được dán vào báo cáo.

## 7. Quy trình mỗi cấp

RED (test + xác nhận FAIL) → GREEN (soạn JSON, loader/nối seed ở cấp đầu tiên) → chạy toàn bộ test → xuất `docs/content-review/n{x}.md` (bảng từng câu: key, dạng, đề bài, đáp án đúng, giải thích, `target`, cờ `[CẦN GIÁO VIÊN XÁC NHẬN]`) → báo cáo → **dừng chờ "tiếp cấp tiếp theo"**. Thứ tự: N4 → N3 → N2 → N1 → N5 Đề 02 (đề xuất đặt N5 cuối, vì phải sửa seed.ts; xem câu 1–2).

Nếu một test không pass sau 2 lần sửa liên tiếp: dừng và báo cáo.

## 8. Phạm vi file

Tạo/sửa: `prisma/content/**`, `prisma/import-content.ts`, `prisma/seed.ts` (nối loader, và nếu bạn đồng ý: 2 sửa nhỏ ở mục 2), `tests/**`, `docs/plan/**`, `docs/content-review/**`.
Không đụng: `prisma/schema.prisma`, `prisma/migrations/**`, `scripts/**`, `.github/**`, `app/**`, `package.json`. Không commit/push, không đặt PUBLISHED, không chạm DB ngoài localhost.

## 9. Cần bạn quyết định trước khi bắt đầu

1. **Sửa `seed.ts` ngoài phần nối loader** (hai điểm ở mục 2: loại câu có `key` khỏi truy vấn 20 câu N5; lọc đề theo `title`). Đồng ý, hay muốn bỏ N5 Đề 02 khỏi đợt này?
2. **Số câu/thời gian ở mục 4**: dùng bảng này, hay bạn có tài liệu chuẩn để tôi đối chiếu?
3. **Test API `start` trên đề DRAFT** (start trả 423 với đề DRAFT): chọn một —
   (a) test tạo *bản sao tạm* đề với tiêu đề `TEST content …` ở PUBLISHED trong DB test rồi xóa ngay (không đụng đề thật; cần bạn cho phép PUBLISHED bản sao test), hoặc
   (b) chỉ test logic dựng snapshot/context ở tầng service, không gọi route.
   Đề xuất (a), chạy trên `jlpt_master_test`.
4. **STAR_ORDER**: chấp nhận dùng `STAR_ORDER` (UI chưa kiểm chứng), hay chuyển sang `BLANK_CHOICE`?
5. Mỗi cấp ~90–110 câu nội dung gốc, tức khoảng 500 câu cho cả đợt. Xác nhận làm đủ số câu từng dạng như bảng (không rút gọn).
