# BÁO CÁO KIỂM TOÁN PHASE 1: ĐÁNH GIÁ CHỨC NĂNG & HÀNH TRÌNH NGƯỜI DÙNG (FUNCTIONAL & USER JOURNEY AUDIT)

- **Dự án**: JLPT ManabiHub (JLPT Master)
- **Môi trường Web thực tế**: `https://jlpt.manabihub.me`
- **Phiên bản mã nguồn**: Git branch `deploy`, Commit `9222b22`
- **Ngày kiểm toán**: 28/10/2026 (Cập nhật đối soát hệ thống 03/11/2026)
- **Tiêu chuẩn kiểm toán**: ManabiHub Master Audit Rules (Evidence-First Policy)
- **Vai trò thực hiện**: Senior Product Owner & Senior QA Lead

---

## 1. TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Đội ngũ kiểm toán đã tiến hành khảo sát và kiểm thử chức năng trên toàn bộ **10 hành trình người dùng trọng yếu** (`FUNC-001` đến `FUNC-010`) từ góc độ học viên và quản trị viên.

### Tóm tắt kết quả kiểm toán:
- **Tổng số hành trình kiểm toán**: 10 hành trình (`FUNC-001` $\rightarrow$ `FUNC-010`).
- **Hành trình ĐẠT (PASS)**: **2/10** (`FUNC-005` Sổ tay học tập Từ vựng/Kanji/Ngữ pháp, `FUNC-007` Luyện tập trắc nghiệm củng cố).
- **Hành trình KHÔNG ĐẠT (FAIL)**: **8/10** (Khách vãng lai, Onboarding, Dashboard, Lộ trình bài học, Thẻ nhớ SRS, Phòng thi thử, Báo cáo kết quả, Tiến độ tổng thể).
- **Tổng số lỗi & khiếm khuyết ghi nhận**: **12 Defect IDs** (`DEF-FUNC-01` $\rightarrow$ `DEF-FUNC-12`), trong đó có **4 lỗi nghiêm trọng (Critical)** liên quan đến bỏ qua xác thực bảo mật và hiển thị kết quả thi giả định.

---

## 2. CHI TIẾT KIỂM TOÁN TỪNG HÀNH TRÌNH NGƯỜI DÙNG (JOURNEY AUDITS)

---

### FUNC-001 — Guest Journey (Hành trình Khách vãng lai)
- **Mục tiêu**: Kiểm tra luồng tiếp cận của người dùng chưa đăng nhập từ Trang chủ $\rightarrow$ Xem cấp độ $\rightarrow$ Đăng ký/Đăng nhập $\rightarrow$ Onboarding $\rightarrow$ Dashboard.
- **Tiền điều kiện**: Trình duyệt ở chế độ ẩn danh (Incognito), không có dữ liệu `localStorage`.
- **Các bước thực hiện**:
  1. Truy cập trang chủ `/`.
  2. Bấm CTA *"Bắt đầu học miễn phí"*.
  3. Quan sát trang tiếp theo.
  4. Bấm *"Đăng nhập"* từ thanh Header, nhập email/mật khẩu bất kỳ và bấm *"Đăng nhập"*.
  5. Thử gõ trực tiếp URL `/dashboard`, `/admin` trên thanh địa chỉ.
- **Kết quả kỳ vọng**:
  - Người dùng phải được chuyển đến màn hình Đăng ký/Đăng nhập và tạo phiên làm việc bảo mật (Session Token) trên máy chủ trước khi truy cập dữ liệu học tập cá nhân.
  - Các trang nội bộ `/dashboard`, `/admin` phải có Route Middleware chặn và chuyển hướng về `/login` với mã 401/403.
- **Kết quả thực tế**:
  - Nút *"Bắt đầu học miễn phí"* nhảy thẳng vào `/onboarding` rồi vào `/dashboard` mà **không hề yêu cầu đăng ký tài khoản**.
  - Form Đăng nhập tại `/login` không gọi bất kỳ API nào, chỉ ghi chuỗi `jlpt_auth_role: "student"` vào `localStorage` rồi chuyển trang.
  - Không có file `middleware.ts`; khách vãng lai gõ trực tiếp `/dashboard` hay `/admin` đều truy cập được ngay lập tức.
- **Đánh giá**: **`FAIL`**
- **Mã lỗi**: `DEF-FUNC-01` (Thiếu Middleware bảo vệ route và cơ chế Session bảo mật).
- **Bằng chứng**: [app/page.tsx:55](file:///d:/100.JLPT/_other/00.web_app/app/page.tsx#L55), [app/login/page.tsx:15-20](file:///d:/100.JLPT/_other/00.web_app/app/login/page.tsx#L15-L20).
- **Hành động đề xuất**: Cấu hình `middleware.ts` sử dụng token phiên bảo mật từ máy chủ; bắt buộc đăng ký/đăng nhập trước khi lưu tiến độ.

---

### FUNC-002 — Onboarding Journey (Thiết lập Mục tiêu Ban đầu)
- **Mục tiêu**: Đánh giá khả năng thu thập và lưu trữ thông tin cá nhân hóa của học viên mới.
- **Tiền điều kiện**: Học viên bắt đầu từ `/onboarding`.
- **Các bước thực hiện**:
  1. Chọn cấp độ mục tiêu: Chọn `N5` (các nút N4–N1 bị khóa).
  2. Chọn thời lượng học mỗi ngày: Chọn `30 phút/ngày`.
  3. Bấm *"Hoàn tất thiết lập & Bắt đầu học"*.
  4. Kiểm tra dữ liệu được lưu trong MariaDB (`user_profiles`).
- **Kết quả kỳ vọng**:
  - Hệ thống thu thập: Trình độ hiện tại, kinh nghiệm tiếng Nhật trước đây, mục tiêu kỳ thi (tháng 7 hay tháng 12), thời lượng học mỗi ngày.
  - Dữ liệu được lưu bền vững vào bảng `user_profiles` trong MariaDB.
  - Có trang `/settings` để học viên thay đổi lại mục tiêu khi cần.
- **Kết quả thực tế**:
  - Chỉ có 2 câu hỏi: Chọn cấp độ và thời gian học. Hoàn toàn thiếu khảo sát về kinh nghiệm đã học, mục đích học, thời hạn thi.
  - Dữ liệu chỉ được lưu vào `localStorage.setItem("jlpt_user_profile", ...)`, hoàn toàn không có API gọi về MariaDB.
  - Không tồn tại trang cài đặt cá nhân `/settings` để học viên xem lại hoặc điều chỉnh mục tiêu.
- **Đánh giá**: **`FAIL`**
- **Mã lỗi**: `DEF-FUNC-02` (Onboarding chưa kết nối Database và thiếu tùy chọn cá nhân hóa sư phạm).
- **Bằng chứng**: [app/onboarding/page.tsx:13-24](file:///d:/100.JLPT/_other/00.web_app/app/onboarding/page.tsx#L13-L24).
- **Hành động đề xuất**: Tạo API `POST /api/v1/profile` lưu vào bảng `user_profiles`; bổ sung màn hình `/settings`.

---

### FUNC-003 — Dashboard Journey (Tổng quan Tiến độ Học tập)
- **Mục tiêu**: Kiểm tra tính trung thực và khả năng điều hướng hành động học tập trên `/dashboard`.
- **Tiền điều kiện**: Học viên truy cập `/dashboard`.
- **Các bước thực hiện**:
  1. Mở trang `/dashboard`.
  2. Quan sát: Lời chào, Chuỗi học tập (Streak), Thẻ bài học tiếp theo, Số lượng thẻ SRS, Tiến độ tích lũy N5, Đề thi gần nhất.
  3. Bấm nút *"Tiếp tục học ngay"*.
  4. Bấm nút *"Bắt đầu phiên ôn tập SRS"*.
  5. Bấm nút *"Xem chẩn đoán lỗi sai & điểm yếu"*.
- **Kết quả kỳ vọng**:
  - Số liệu hiển thị phải phản ánh đúng lịch sử học tập thực tế của tài khoản từ MariaDB.
  - Người dùng mới chưa học bài nào phải thấy trạng thái rỗng (Empty state: Streak 0 ngày, chưa có bài thi).
- **Kết quả thực tế**:
  - Ngoại trừ con số tổng `dueReviewsCount` (lấy từ `/api/v1/progress/overview`), toàn bộ các thông số còn lại đều bị **ghi cứng (hardcoded)**:
    - Chuỗi học tập luôn là *"5 ngày liên tục"*.
    - Mục tiêu luôn là *"30 phút học và ôn 14 thẻ nhớ SRS"*.
    - Bài học dở luôn là *"Bài 03... Tiến độ bài học 35%"*.
    - Tiến độ tích lũy luôn là *"180/800 từ"*, *"45/100 kanji"*, *"30/80 mẫu ngữ pháp"*.
    - Đề thi gần nhất luôn là *"Đề N5 số 01: 142/180 điểm"*, link cứng về `/results/att-01`.
- **Đánh giá**: **`FAIL`**
- **Mã lỗi**: `DEF-FUNC-03` (Dashboard hiển thị số liệu giả định hardcoded thay vì dữ liệu tổng hợp từ MariaDB).
- **Bằng chứng**: [app/dashboard/page.tsx:55-252](file:///d:/100.JLPT/_other/00.web_app/app/dashboard/page.tsx#L55-L252).
- **Hành động đề xuất**: Tái cấu trúc API `/api/v1/progress/overview` để trả về streak thực, tiến độ từ vựng/kanji/ngữ pháp thực, và bài học dở gần nhất từ DB.

---

### FUNC-004 — Curriculum & Lesson Journey (Khóa học & Bài học)
- **Mục tiêu**: Khảo sát quy trình học lý thuyết, từ vựng, tra cứu kana, và hoàn thành bài học.
- **Tiền điều kiện**: Học viên truy cập `/learn/n5`.
- **Các bước thực hiện**:
  1. Mở danh sách bài học `/learn/n5`.
  2. Bấm vào bài học số 3: `/learn/n5/bai-03-danh-tu-va-tro-tu-wa-desu`.
  3. Chuyển đổi giữa các tab: *"Lý thuyết trọng tâm"*, *"Từ vựng trong bài"*.
  4. Bật/tắt Furigana trên thanh `LearningToolbar`.
  5. Bấm nghe phát âm từ vựng qua `AudioButton`.
  6. Bấm nút CTA cuối bài: *"Luyện tập 5 câu hỏi bài này"*.
- **Kết quả kỳ vọng**:
  - Trang danh sách hiển thị đúng trạng thái hoàn thành từng bài dựa trên bảng `lesson_progress`.
  - Màn hình chi tiết bài học tải dữ liệu từ `GET /api/v1/lessons/:id`.
  - Nút cuối bài gọi `POST /api/v1/lessons/:id/complete` để ghi nhận hoàn thành bài học trước khi chuyển sang làm quiz.
- **Kết quả thực tế**:
  - Trang danh sách gán cứng bài 1 và 2 luôn hoàn thành (`idx < 2`), bài 3 chưa hoàn thành.
  - Chi tiết bài học đọc từ tệp tĩnh `app/fixtures/n5-curriculum.ts`, hoàn toàn không gọi API `/api/v1/lessons/:id`.
  - Không có thao tác ghi nhận hoàn thành bài học; nút cuối bài chỉ là thẻ Link chuyển thẳng đến trang trắc nghiệm chung `/practice` (không lọc câu hỏi theo bài vừa học).
- **Đánh giá**: **`FAIL`**
- **Mã lỗi**: `DEF-FUNC-04` (Chi tiết bài học dùng dữ liệu Mock tĩnh và không ghi nhận hoàn thành vào máy chủ).
- **Bằng chứng**: [app/learn/n5/page.tsx:30](file:///d:/100.JLPT/_other/00.web_app/app/learn/n5/page.tsx#L30), [app/learn/n5/[lessonSlug]/page.tsx:28](file:///d:/100.JLPT/_other/00.web_app/app/learn/n5/%5BlessonSlug%5D/page.tsx#L28).
- **Hành động đề xuất**: Kết nối `/api/v1/lessons/:id` vào trang chi tiết; bổ sung mutation gọi `/api/v1/lessons/:id/complete`.

---

### FUNC-005 — Vocabulary, Kanji & Grammar Journey (Sổ tay Kiến thức)
- **Mục tiêu**: Kiểm tra tra cứu từ vựng, chữ Hán, ngữ pháp, lọc từ loại và tìm kiếm đa ngữ.
- **Tiền điều kiện**: Học viên truy cập `/vocabulary`, `/kanji`, `/grammar`.
- **Các bước thực hiện**:
  1. Truy cập `/vocabulary`, gõ từ khóa "taberu", "ăn", hoặc "食べる".
  2. Đổi bộ lọc từ loại: Danh từ, Động từ, Tính từ.
  3. Truy cập `/kanji`, tìm kiếm Hán tự "Tiên" (先) hoặc "Học" (学).
  4. Truy cập `/grammar`, tra cứu mẫu câu "wa desu" hoặc "te kudasai".
- **Kết quả kỳ vọng**:
  - Tìm kiếm trả về kết quả chính xác từ MariaDB.
  - Hỗ trợ đầy đủ Furigana, âm Hán Việt, âm On/Kun, số nét và câu ví dụ song ngữ.
- **Kết quả thực tế**:
  - Cả 3 trang đều kết nối trực tiếp vào API v1 (`/api/v1/vocabulary`, `/api/v1/kanji`, `/api/v1/grammar`).
  - Hỗ trợ chuẩn hóa tìm kiếm đa ngữ (Romaji, Hiragana, Kanji, nghĩa tiếng Việt).
  - Có đầy đủ trạng thái Loading Spinner và Error Alert khi gặp sự cố mạng.
- **Đánh giá**: **`PASS`** (Đạt chuẩn chức năng; lưu ý: số lượng từ vựng hiện có trong DB là 20 từ, chưa đạt 800 từ như mô tả trên Dashboard).
- **Bằng chứng**: [app/vocabulary/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/vocabulary/page.tsx), [app/kanji/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/kanji/page.tsx), [app/grammar/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/grammar/page.tsx).

---

### FUNC-006 — SRS Flashcards Journey (Ôn tập Thẻ nhớ Ngắt quãng)
- **Mục tiêu**: Kiểm tra luồng lật thẻ, chấm điểm 4 mức độ nhớ (Lại, Khó, Tốt, Dễ) và cập nhật chu kỳ ôn tập.
- **Tiền điều kiện**: Đã có thẻ nhớ đến hạn trong MariaDB (8 thẻ từ vựng đã seed).
- **Các bước thực hiện**:
  1. Truy cập `/flashcards`.
  2. Bấm vào thẻ để lật xem mặt sau (nghĩa tiếng Việt, Hán Việt, câu ví dụ).
  3. Chọn mức độ ghi nhớ: Bấm *"Tốt (3 ngày)"*.
  4. Lặp lại cho đến hết các thẻ trong hàng đợi.
- **Kết quả kỳ vọng**:
  - Gọi `GET /api/v1/reviews/due` lấy thẻ đến hạn thật từ DB.
  - Khi bấm đánh giá, gọi `POST /api/v1/reviews` ghi nhận nhật ký `review_logs` và tính `new_due_at` trên máy chủ.
  - Nếu gửi trùng lặp `idempotencyKey`, máy chủ chặn không tăng lặp chu kỳ.
- **Kết quả thực tế**:
  - Chức năng có gọi API `/api/v1/reviews/due` và `POST /api/v1/reviews` thành công.
  - **Khiếm khuyết**: Nếu API trả về mảng rỗng (không có thẻ nào đến hạn), giao diện tự động lấy `MOCK_SRS_CARDS` (3 thẻ mẫu tĩnh) đè vào thay vì hiển thị màn hình chúc mừng *"Bạn đã hoàn thành hết thẻ ôn tập hôm nay"*.
- **Đánh giá**: **`FAIL`** (Do cơ chế fallback che giấu trạng thái thực của hàng đợi ôn tập).
- **Mã lỗi**: `DEF-FUNC-05` (Fallback mock cards khi hàng đợi SRS trống rỗng).
- **Bằng chứng**: [app/flashcards/page.tsx:28-48](file:///d:/100.JLPT/_other/00.web_app/app/flashcards/page.tsx#L28-L48).
- **Hành động đề xuất**: Xóa bỏ `MOCK_SRS_CARDS`; hiển thị Empty State chuẩn mực khi không có thẻ đến hạn.

---

### FUNC-007 — Practice Quiz Journey (Luyện tập Trắc nghiệm Củng cố)
- **Mục tiêu**: Kiểm tra quy trình làm câu hỏi củng cố, chấm điểm server-side và giải thích đáp án.
- **Tiền điều kiện**: Học viên truy cập `/practice`.
- **Các bước thực hiện**:
  1. Tải trang `/practice`.
  2. Đọc câu hỏi trắc nghiệm N5.
  3. Chọn phương án trả lời và bấm *"Kiểm tra đáp án"*.
  4. Quan sát phản hồi đúng/sai và phần giải thích chi tiết.
  5. Bấm *"Câu tiếp theo"*.
- **Kết quả kỳ vọng**:
  - Câu hỏi tải từ `GET /api/v1/practice/questions` (không lộ trường `isCorrect` trong API response).
  - Gửi đáp án lên `POST /api/v1/practice/submit` để chấm điểm server-side.
  - Nhận về kết quả và phần giải thích ngữ pháp tiếng Việt.
- **Kết quả thực tế**:
  - Luồng hoạt động hoàn hảo 100% với dữ liệu MariaDB thật.
  - Đáp án được bảo mật tuyệt đối trước khi nộp.
  - Giao diện có đủ trạng thái đang chấm, thông báo đúng/sai trực quan và tính tổng điểm chính xác.
- **Đánh giá**: **`PASS`**
- **Bằng chứng**: [app/practice/page.tsx:50-109](file:///d:/100.JLPT/_other/00.web_app/app/practice/page.tsx#L50-L109), [tests/components/PracticeQuizPage.test.tsx](file:///d:/100.JLPT/_other/00.web_app/tests/components/PracticeQuizPage.test.tsx).

---

### FUNC-008 — Mock Exam Journey (Phòng thi Thử Trực tuyến)
- **Mục tiêu**: Đánh giá toàn bộ quy trình thi thử: Danh mục $\rightarrow$ Khởi tạo lượt thi $\rightarrow$ Đếm ngược giờ $\rightarrow$ Lưu tạm $\rightarrow$ Nộp bài.
- **Tiền điều kiện**: Học viên vào `/mock-exams`.
- **Các bước thực hiện**:
  1. Mở danh mục `/mock-exams`, bấm *"Làm bài thi"* Đề số 01.
  2. Vào phòng thi `/mock-exams/att-01`.
  3. Quan sát đồng hồ đếm ngược (20 phút).
  4. Chọn đáp án cho các câu hỏi.
  5. Tải lại trang (F5) để kiểm tra khôi phục câu trả lời.
  6. Bấm *"Nộp bài thi"*.
- **Kết quả kỳ vọng**:
  - Gọi `POST /api/v1/exams/:id/start` tạo bản ghi `exam_attempts` và đồng hồ máy chủ.
  - Trong lúc làm bài, gọi `PUT /api/v1/attempts/:id/answers` để lưu tạm định kỳ lên MariaDB.
  - Khi nộp bài hoặc hết giờ, gọi `POST /api/v1/attempts/:id/finish` để máy chủ chấm điểm duy nhất (transactional).
- **Kết quả thực tế**:
  - Giao diện phòng thi **hoàn toàn ngắt kết nối với Backend API v1**:
    - Không gọi `/start`, không tạo attempt trong DB.
    - Bộ câu hỏi thi là 35 câu sinh vòng lặp từ file mock `mock-exam-data.ts`.
    - Đồng hồ đếm ngược chỉ là `setInterval` phía client.
    - Lưu tạm đáp án chỉ ghi vào `localStorage.setItem("jlpt_exam_answers_...", ...)`.
    - Nộp bài chỉ lưu cờ vào `localStorage` rồi chuyển hướng về `/results/att-01`.
- **Đánh giá**: **`FAIL`** (Lỗi rất nặng - Frontend phòng thi là giao diện mô phỏng tách biệt khỏi Backend API có sẵn).
- **Mã lỗi**: `DEF-FUNC-06` (Giao diện phòng thi Mock Exam chạy trên localStorage, chưa nối Backend API v1).
- **Bằng chứng**: [app/mock-exams/[attemptId]/page.tsx:24-79](file:///d:/100.JLPT/_other/00.web_app/app/mock-exams/%5BattemptId%5D/page.tsx#L24-L79).
- **Hành động đề xuất**: Kết nối toàn diện `/api/v1/exams/:id/start`, `PUT /attempts/:id/answers`, và `POST /attempts/:id/finish`.

---

### FUNC-009 — Exam Results & Weakness Diagnostics Journey (Báo cáo Kết quả Thi)
- **Mục tiêu**: Kiểm tra tính chính xác của điểm số, phân tích lỗi sai và liên kết bài học ôn tập.
- **Tiền điều kiện**: Học viên sau khi nộp bài được chuyển đến `/results/att-01`.
- **Các bước thực hiện**:
  1. Mở `/results/att-01`.
  2. Quan sát tổng điểm, điểm từng phân môn, và danh sách kỹ năng yếu.
  3. Bấm vào liên kết ôn tập bài học gợi ý.
- **Kết quả kỳ vọng**:
  - Gọi `GET /api/v1/attempts/:id/result` lấy kết quả máy chủ đã chấm từ bảng `exam_attempts`.
  - Hiển thị đúng số câu đúng/sai thực tế của thí sinh.
  - Nếu bài thi chưa nộp, API phải trả mã 409 Conflict chặn xem trước kết quả.
- **Kết quả thực tế**:
  - Trang kết quả **không hề gọi API `/attempts/:id/result`**.
  - Điểm số luôn hiển thị cố định **142 / 180** từ biến tĩnh `scoreData`. Bất kể học viên chọn đáp án nào trong phòng thi, điểm số vẫn luôn là 142.
  - Các kỹ năng yếu ("Trợ từ De vs Ni", "Kính ngữ căn bản") bị ghi cứng cố định.
- **Đánh giá**: **`FAIL`**
- **Mã lỗi**: `DEF-FUNC-07` (Báo cáo kết quả thi hiển thị điểm số và chẩn đoán giả lập cố định).
- **Bằng chứng**: [app/results/[attemptId]/page.tsx:24-37](file:///d:/100.JLPT/_other/00.web_app/app/results/%5BattemptId%5D/page.tsx#L24-L37).
- **Hành động đề xuất**: Thay thế biến `scoreData` bằng dữ liệu thực trả về từ `GET /api/v1/attempts/:id/result`.

---

### FUNC-010 — Edge Cases & Error Handling (Kiểm thử Trường hợp Biên & Ngoại lệ)
- **Mục tiêu**: Đánh giá ứng xử của hệ thống khi gặp lỗi mạng, tài khoản mới tinh, hoặc truy cập trang không tồn tại.
- **Các kịch bản kiểm thử**:
  1. *Truy cập đường dẫn sai* (ví dụ: `/duong-dan-khong-ton-tai`):
     - Kỳ vọng: Hiển thị trang 404 thân thiện theo chuẩn thương hiệu ManabiHub.
     - Thực tế: **LỖI**. Hiển thị trang 404 mặc định đen trắng của Next.js do thiếu `app/not-found.tsx`.
  2. *Mất kết nối cơ sở dữ liệu MariaDB*:
     - Kỳ vọng: Hiển thị thông báo thân thiện kèm nút thử lại.
     - Thực tế: **ĐẠT MỘT PHẦN**. `/vocabulary` và `/practice` hiển thị banner lỗi đẹp; nhưng `/grammar` và `/flashcards` âm thầm nạp mock data mà không báo cho học viên biết.
  3. *Học viên mới tinh chưa có lịch sử học*:
     - Kỳ vọng: Dashboard hiển thị trạng thái chào mừng rỗng (Empty state).
     - Thực tế: **LỖI**. Dashboard tự động hiển thị học viên đã có chuỗi 5 ngày, đang học bài 3 được 35%, và đã thi được 142 điểm.
- **Đánh giá**: **`FAIL`**
- **Mã lỗi**: `DEF-FUNC-08` (Thiếu `not-found.tsx`, `error.tsx` và Empty state cho tài khoản mới).

---

## 3. MA TRẬN ĐỘ PHỦ CHỨC NĂNG (FUNCTIONAL COVERAGE MATRIX)

| Phân hệ chức năng | Mức độ bao phủ yêu cầu | Trạng thái nghiệp vụ | Mức độ sẵn sàng Release |
| :--- | :---: | :---: | :---: |
| **Xác thực & Quản lý phiên** | 30% | `INCOMPLETE` | Chưa sẵn sàng (Cần Session thật) |
| **Khởi tạo Onboarding** | 40% | `INCOMPLETE` | Chưa sẵn sàng (Chưa ghi DB) |
| **Trang chủ & Điều hướng chung** | 90% | `READY` | Sẵn sàng |
| **Dashboard Tổng quan** | 35% | `INCOMPLETE` | Chưa sẵn sàng (Cần gỡ số liệu cứng) |
| **Lộ trình & Bài học N5** | 50% | `INCOMPLETE` | Chưa sẵn sàng (Chi tiết bài học là Mock) |
| **Sổ tay Từ vựng & Tra cứu** | 95% | `READY` | Sẵn sàng (Cần tăng số lượng từ vựng) |
| **Sổ tay Chữ Hán (Kanji)** | 95% | `READY` | Sẵn sàng (Cần nạp thêm Hán tự N5) |
| **Sổ tay Ngữ pháp** | 90% | `READY` | Sẵn sàng |
| **Thẻ nhớ Ôn tập SRS** | 75% | `PARTIAL` | Cần sửa lỗi fallback mock cards |
| **Luyện tập Trắc nghiệm** | 95% | `READY` | Sẵn sàng |
| **Khảo thí & Đề thi thử** | 25% | `BLOCKED` | Bị chặn (Frontend tách rời Backend) |
| **Báo cáo Kết quả & Điểm yếu** | 20% | `BLOCKED` | Bị chặn (Frontend hiển thị điểm tĩnh) |
| **CMS Quản trị & Nhập CSV** | 30% | `INCOMPLETE` | Chưa sẵn sàng (Chưa nối API Backend) |

---

## 4. DANH SÁCH TÍNH NĂNG CÒN THIẾU (MISSING FEATURES)

1. **Trang Cài đặt Hồ sơ học viên (`/settings`)**: Cho phép đổi mục tiêu học, thời gian học hàng ngày và đổi mật khẩu.
2. **Cơ chế Bookmark / Yêu thích**: Chưa có tính năng lưu lại các từ vựng, ngữ pháp hoặc câu hỏi khó vào danh sách riêng.
3. **Phân loại bài thi theo Chuyên đề**: Chưa có bộ lọc đề thi theo phân môn (chỉ thi từ vựng 20 phút, chỉ thi đọc hiểu).
4. **Bộ câu hỏi nghe hiểu kèm Audio thật**: Hiện tại chưa có bài tập nghe hiểu (Choukai) với file audio bản ngữ trong ngân hàng câu hỏi.
5. **Giao diện Quản trị viên kết nối máy chủ thật**: Trang `/admin` và `/admin/content/import` cần được kết nối vào API v1 để admin có thể thêm bài học, duyệt đề và tải CSV thật lên MariaDB.

---

## 5. BẢNG TỔNG HỢP KHIẾM KHUYẾT CHỨC NĂNG (DEFECT LOG)

| Mã lỗi | Mức độ nghiêm trọng | Vị trí phát hiện | Mô tả khiếm khuyết |
| :--- | :---: | :--- | :--- |
| `DEF-FUNC-01` | **CRITICAL** | `app/login`, `app/` | Khách vãng lai truy cập tự do mọi trang nội bộ; thiếu `middleware.ts` và Session cookie máy chủ. |
| `DEF-FUNC-02` | **HIGH** | `app/onboarding` | Tùy chọn Onboarding không được lưu vào bảng `user_profiles` trong MariaDB. |
| `DEF-FUNC-03` | **CRITICAL** | `app/dashboard` | Dashboard hiển thị các con số giả định cố định (Streak 5 ngày, bài 3 35%, điểm thi 142/180). |
| `DEF-FUNC-04` | **HIGH** | `app/learn/n5/[lessonSlug]` | Chi tiết bài học dùng file tĩnh `MOCK_LESSONS`, không gọi API và không lưu tiến độ học. |
| `DEF-FUNC-05` | **MEDIUM** | `app/flashcards` | Fallback về 3 thẻ mẫu `MOCK_SRS_CARDS` khi hàng đợi SRS trống thay vì hiển thị Empty state. |
| `DEF-FUNC-06` | **CRITICAL** | `app/mock-exams/[attemptId]` | Phòng thi chạy bằng `localStorage` và 35 câu lặp lại, ngắt kết nối hoàn toàn với Backend API v1. |
| `DEF-FUNC-07` | **CRITICAL** | `app/results/[attemptId]` | Điểm số và chẩn đoán kết quả thi bị gán cứng cố định (luôn là 142/180 điểm). |
| `DEF-FUNC-08` | **MEDIUM** | `app/` | Thiếu các trang xử lý ngoại lệ toàn cục: `not-found.tsx` và `error.tsx`. |
| `DEF-FUNC-09` | **MEDIUM** | `app/mock-exams` | Trạng thái đề số 1 luôn bị gán là `COMPLETED` và đề số 2 luôn là `NEW` trong giao diện. |
| `DEF-FUNC-10` | **LOW** | `app/practice` | Thiếu bộ lọc theo chuyên môn (Chỉ làm Từ vựng hoặc Chỉ làm Ngữ pháp). |
| `DEF-FUNC-11` | **HIGH** | `app/admin` | Trang CMS quản trị không gọi `GET /api/v1/admin/content`, thao tác duyệt bài chỉ thay đổi state RAM. |
| `DEF-FUNC-12` | **HIGH** | `app/admin/content/import` | Trang nhập CSV chỉ hiển thị dữ liệu tĩnh xem trước, không cho phép người dùng chọn tệp CSV thực tế. |

---

## 6. KẾT LUẬN & KIẾN NGHỊ GIAI ĐOẠN TIẾP THEO

- **Kết luận**: Giao diện ứng dụng có tính thẩm mỹ và tương tác người dùng mượt mà, tuy nhiên nhiều màn hình cốt lõi (Phòng thi thử, Kết quả thi, Chi tiết bài học, CMS Admin) đang là **mô hình độc lập (UI Facade)** chạy trên Mock Data chứ chưa tận dụng sức mạnh của các API Backend MariaDB đã được kiểm thử kỹ lưỡng.
- **Kế hoạch tiếp theo**: Đề xuất chuyển tiếp sang **PHASE 2 — UX/UI & ACCESSIBILITY AUDIT** (`prompt3.md`) để đánh giá sâu về cấu trúc điều hướng, khả năng hiển thị tiếng Nhật (Furigana Ruby), khả năng tương thích di động (375px) và chuẩn tiếp cận WCAG 2.2 AA.

> [!IMPORTANT]
> **GATE STATUS**: Phase 1 đã hoàn tất lập tài liệu kiểm toán. Theo quy định của quy trình kiểm toán, hệ thống tạm thời dừng lại và chờ ý kiến chỉ đạo từ Product Owner.

