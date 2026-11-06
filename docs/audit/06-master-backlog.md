# BÁO CÁO KIỂM TOÁN PHASE 6: DANH MỤC CÔNG VIỆC TỔNG HỢP (MASTER PRODUCT BACKLOG)

- **Dự án**: JLPT ManabiHub (JLPT Master)
- **Môi trường Web thực tế**: `https://jlpt.manabihub.me`
- **Phiên bản mã nguồn**: Git branch `deploy`, Commit `9222b22`
- **Ngày kiểm toán**: 28/10/2026 (Cập nhật đối soát hệ thống 03/11/2026)
- **Vai trò thực hiện**: Senior Product Owner & Delivery Manager
- **Cơ sở dữ liệu**: Hợp nhất toàn bộ phát hiện từ các báo cáo Phase 0 đến Phase 5

---

## 1. TỔNG QUAN TỔ CHỨC BACKLOG (CONSOLIDATION OVERVIEW)

Đội ngũ quản lý sản phẩm đã hợp nhất, khử trùng lặp và chuyển hóa toàn bộ các phát hiện kỹ thuật, sư phạm, UX và an toàn bảo mật thành **20 Tickets hành động chuẩn hóa**.

### Phân bố mức độ ưu tiên:
- **P0 — Critical (Khẩn cấp, chặn phát hành)**: **5 Tickets** (Lỗ hổng bảo mật leo quyền, IDOR, thiếu Session bảo mật, Phòng thi nhân bản 5 câu, Điểm thi cố định).
- **P1 — High (Ưu tiên cao, ảnh hưởng cốt lõi học tập)**: **7 Tickets** (Số liệu Dashboard giả định, Chi tiết bài học là Mock, Vi phạm chuẩn đề thi JLPT, Thiếu Đọc/Nghe, CMS Admin chưa nối API, Thiếu Playwright E2E, Onboarding chưa lưu DB).
- **P2 — Medium (Ưu tiên trung bình, hoàn thiện trải nghiệm)**: **6 Tickets** (Menu con link rỗng, Fallback SRS rác, Thiếu bài Katakana & Nhóm động từ, Thiếu `not-found.tsx`/Footer, Migration CSDL, Cạnh tranh CTA/Xác nhận nộp bài).
- **P3 — Low (Ưu tiên thấp, cải tiến nhỏ)**: **2 Tickets** (Tương phản chữ phụ, Chú thích Tự/Tha động từ).

---

## 2. DANH MỤC CHI TIẾT CÁC TICKETS TRỌNG YẾU (TICKET SPECIFICATIONS)

---

### EPIC 1: AN TOÀN BẢO MẬT & KIỂM SOÁT PHIÊN LÀM VIỆC (SECURITY & AUTHENTICATION)

#### [TICKET-SEC-01] Khắc phục lỗ hổng leo quyền ADMIN trên API duyệt nội dung
- **Epic**: Security & Access Control
- **Loại**: Defect (Lỗ hổng bảo mật)
- **Mức độ ưu tiên**: **`P0 — CRITICAL`** | **Mức nghiêm trọng**: `Critical`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/api/v1/admin/content/[id]/publish/route.ts:8-29](file:///d:/100.JLPT/_other/00.web_app/app/api/v1/admin/content/%5Bid%5D/publish/route.ts#L8-L29)
- **Mô tả vấn đề**: API nhận `role` trực tiếp từ client body (`rawBody.role`) và chạy `assertAdminRole(role)`, cho phép bất kỳ ai gửi `{ "role": "ADMIN" }` đều có thể xuất bản hoặc ẩn bất kỳ bài viết nào.
- **Tiêu chuẩn nghiệm thu (Acceptance Criteria)**:
  1. Tuyệt đối không nhận `role` hoặc `actorId` từ Request Body của client.
  2. Quyền hạn của người dùng phải được trích xuất an toàn từ Server Session Cookie / JWT có chữ ký mật mã.
  3. Trả về mã lỗi `403 Forbidden` nếu người dùng không có quyền `ADMIN`.
- **Ước tính nỗ lực**: 4 giờ làm việc.

#### [TICKET-SEC-02] Khắc phục lỗ hổng IDOR trên toàn bộ các API quản lý bài thi
- **Epic**: Security & Authorization
- **Loại**: Defect (Lỗ hổng IDOR)
- **Mức độ ưu tiên**: **`P0 — CRITICAL`** | **Mức nghiêm trọng**: `Critical`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/api/v1/attempts/[id]/route.ts](file:///d:/100.JLPT/_other/00.web_app/app/api/v1/attempts/%5Bid%5D/route.ts), `/finish/route.ts`, `/answers/route.ts`
- **Mô tả vấn đề**: Đoạn mã kiểm tra `if (userId) { assertUserOwnership(userId, attempt.userId) }` cho phép bất kỳ ai không truyền param `userId` đều vượt qua được bước kiểm tra và xem toàn bộ bài làm/đáp án của thí sinh khác.
- **Tiêu chuẩn nghiệm thu**:
  1. Bắt buộc định danh `currentUserId` từ Session máy chủ trước khi xử lý request.
  2. Luôn luôn kiểm tra `currentUserId === attempt.userId`; nếu không khớp lập tức chặn với mã `403 Forbidden`.
  3. Xóa bỏ hoàn toàn việc nhận `userId` qua query param hoặc body từ phía client.
- **Ước tính nỗ lực**: 3 giờ làm việc.

#### [TICKET-SEC-03] Triển khai Server-Side Session & Next.js Route Middleware
- **Epic**: Security & Session Management
- **Loại**: Feature & Architecture Fix
- **Mức độ ưu tiên**: **`P0 — CRITICAL`** | **Mức nghiêm trọng**: `Critical`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: Root folder (thiếu `middleware.ts`), [app/login/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/login/page.tsx)
- **Mô tả vấn đề**: Frontend đang quản trị đăng nhập bằng chuỗi thô trong `localStorage`; không có middleware bảo vệ các route `/dashboard` và `/admin`.
- **Tiêu chuẩn nghiệm thu**:
  1. Tạo `middleware.ts` kiểm tra HttpOnly Session Cookie.
  2. Chuyển hướng người dùng chưa đăng nhập về `/login?redirect=...` khi vào trang học viên.
  3. Chặn người dùng không có vai trò `ADMIN` khi truy cập đường dẫn `/admin/*`.
- **Ước tính nỗ lực**: 8 giờ làm việc.

---

### EPIC 2: KHẢO THÍ CHUẨN JLPT & ĐỀ THI THỬ (EXAM ENGINE & ASSESSMENT)

#### [TICKET-EXAM-01] Tái kết nối Phòng thi trực tuyến với Backend API v1 & Thay thế câu hỏi lặp lại
- **Epic**: Exam Engine
- **Loại**: Defect & Feature Integration
- **Mức độ ưu tiên**: **`P0 — CRITICAL`** | **Mức nghiêm trọng**: `Critical`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/mock-exams/[attemptId]/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/mock-exams/%5BattemptId%5D/page.tsx)
- **Mô tả vấn đề**: Phòng thi đang chạy bằng `localStorage` với 35 câu hỏi lặp đi lặp lại từ 5 câu mẫu.
- **Tiêu chuẩn nghiệm thu**:
  1. Màn hình phòng thi tải câu hỏi từ `GET /api/v1/attempts/:id` (hoặc khởi tạo qua `/api/v1/exams/:id/start`).
  2. Bắt buộc mỗi câu hỏi trong đề phải là một câu hỏi độc lập, không nhân bản lặp lại vòng lặp.
  3. Cơ chế lưu tạm kết nối trực tiếp `PUT /api/v1/attempts/:id/answers`.
  4. Đồng hồ đếm ngược đồng bộ với hạn giờ máy chủ (`remainingSeconds`).
- **Ước tính nỗ lực**: 8 giờ làm việc.

#### [TICKET-EXAM-02] Kết nối Báo cáo Kết quả Thi thật & Tính toán điểm yếu từ bài làm
- **Epic**: Exam Results & Diagnostics
- **Loại**: Defect & Data Wiring
- **Mức độ ưu tiên**: **`P0 — CRITICAL`** | **Mức nghiêm trọng**: `Critical`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/results/[attemptId]/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/results/%5BattemptId%5D/page.tsx)
- **Mô tả vấn đề**: Điểm số luôn hiển thị cố định 142/180 và các kỹ năng yếu bị gán cứng.
- **Tiêu chuẩn nghiệm thu**:
  1. Gọi `GET /api/v1/attempts/:id/result` lấy kết quả máy chủ đã chấm từ bảng `exam_attempts`.
  2. Hiển thị đúng số câu đúng/sai thực tế của thí sinh.
  3. Danh sách kỹ năng yếu và link bài học ôn tập tương ứng được trích xuất từ các câu trả lời sai thật.
- **Ước tính nỗ lực**: 4 giờ làm việc.

#### [TICKET-EDU-01] Loại bỏ hoàn toàn nghĩa tiếng Việt trong phương án chọn trắc nghiệm đề thi
- **Epic**: Educational Fidelity
- **Loại**: Educational Defect
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/fixtures/mock-exam-data.ts:62-65](file:///d:/100.JLPT/_other/00.web_app/app/fixtures/mock-exam-data.ts#L62-L65)
- **Mô tả vấn đề**: Câu hỏi 3 chèn sẵn nghĩa tiếng Việt vào đáp án (`みず (Nước)`), vi phạm quy chuẩn JLPT.
- **Tiêu chuẩn nghiệm thu**:
  1. Tất cả 4 phương án trắc nghiệm chỉ chứa tiếng Nhật (`みず`, `ごはん`, `パン`, `にく`).
  2. Giữ nguyên nghĩa tiếng Việt và phân tích ngữ cảnh trong phần giải thích sau khi đã nộp bài.
- **Ước tính nỗ lực**: 1 giờ làm việc.

#### [TICKET-EDU-02] Bổ sung phân môn Đọc hiểu (Dokkai) và Nghe hiểu (Choukai) vào Đề thi N5
- **Epic**: Educational Curriculum
- **Loại**: Missing Feature
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: CSDL và Ngân hàng câu hỏi
- **Mô tả vấn đề**: Đề thi hiện tại chỉ có các câu hỏi ngữ pháp/từ vựng ngắn, thiếu hoàn toàn bài đọc và bài nghe.
- **Tiêu chuẩn nghiệm thu**:
  1. Biên soạn tối thiểu 2 đoạn văn đọc hiểu ngắn kèm câu hỏi tương ứng trong bảng `reading_passages`.
  2. Biên soạn tối thiểu 2 bài nghe hiểu hội thoại ngắn kèm audio player trong bảng `listening_tracks`.
- **Ước tính nỗ lực**: 12 giờ làm việc.

---

### EPIC 3: BẢNG ĐIỀU KHIỂN & HÀNH TRÌNH HỌC TẬP (LEARNING JOURNEY & DASHBOARD)

#### [TICKET-DASH-01] Xóa bỏ toàn bộ số liệu Hardcoded trên Dashboard & Kết nối MariaDB thật
- **Epic**: Dashboard Experience
- **Loại**: Defect & API Integration
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/dashboard/page.tsx:55-252](file:///d:/100.JLPT/_other/00.web_app/app/dashboard/page.tsx#L55-L252)
- **Mô tả vấn đề**: Chuỗi streak 5 ngày, tiến độ bài học 3, tiến độ từ vựng/kanji và đề thi 142 điểm đều là số liệu tĩnh.
- **Tiêu chuẩn nghiệm thu**:
  1. Mở rộng API `GET /api/v1/progress/overview` trả về: Số từ vựng đã học, số kanji đã học, streak thực tính theo múi giờ `Asia/Ho_Chi_Minh`, bài học dở gần nhất từ `lesson_progress`, và điểm bài thi gần nhất.
  2. Hiển thị Empty state chuẩn khi học viên mới tạo tài khoản (Streak 0 ngày, chưa có bài thi).
- **Ước tính nỗ lực**: 6 giờ làm việc.

#### [TICKET-LEARN-01] Kết nối Chi tiết bài học với API `/api/v1/lessons/:id` & Ghi nhận hoàn thành
- **Epic**: Curriculum & Lessons
- **Loại**: Defect & Feature Integration
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/learn/n5/[lessonSlug]/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/learn/n5/%5BlessonSlug%5D/page.tsx)
- **Mô tả vấn đề**: Trang bài học đang đọc từ mock fixture và không có nút ghi nhận hoàn thành bài học.
- **Tiêu chuẩn nghiệm thu**:
  1. Tải dữ liệu lý thuyết và từ vựng của bài học từ máy chủ qua API.
  2. Bổ sung nút *"Hoàn thành bài học"*, khi bấm sẽ gọi `POST /api/v1/lessons/:id/complete` để ghi vào bảng `lesson_progress`.
  3. Đồng bộ trạng thái tích xanh trên trang danh mục bài học `/learn/n5`.
- **Ước tính nỗ lực**: 5 giờ làm việc.

#### [TICKET-ONBOARD-01] Kết nối Onboarding với bảng `user_profiles` trong MariaDB
- **Epic**: Learner Onboarding
- **Loại**: Defect & Database Wiring
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/onboarding/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/onboarding/page.tsx)
- **Mô tả vấn đề**: Tùy chọn học tập của học viên mới chỉ lưu tạm trong `localStorage`.
- **Tiêu chuẩn nghiệm thu**:
  1. Xây dựng API `POST /api/v1/profile` cập nhật `target_level` và `daily_goal_minutes` vào MariaDB.
  2. Sau khi hoàn tất, học viên vào Dashboard sẽ thấy đúng thời lượng mục tiêu vừa chọn.
- **Ước tính nỗ lực**: 3 giờ làm việc.

---

### EPIC 4: QUẢN TRỊ NỘI DUNG (CMS) & HẠ TẦNG KIỂM THỬ (ADMIN & TESTING INFRA)

#### [TICKET-ADMIN-01] Kết nối Màn hình CMS Quản trị & Nhập CSV với Backend API v1
- **Epic**: Content Management System
- **Loại**: Feature Integration
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: [app/admin/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/admin/page.tsx), [app/admin/content/import/page.tsx](file:///d:/100.JLPT/_other/00.web_app/app/admin/content/import/page.tsx)
- **Mô tả vấn đề**: Giao diện Admin quản trị và Import CSV hiện tại chỉ thao tác trên bộ nhớ tạm của React, ngắt kết nối với các Route Handlers `/api/v1/admin/content/*`.
- **Tiêu chuẩn nghiệm thu**:
  1. Trang `/admin` tải danh sách bài viết từ `GET /api/v1/admin/content`.
  2. Nút xuất bản gọi `POST /api/v1/admin/content/:id/publish` và ghi nhận `AuditLog`.
  3. Trang `/admin/content/import` cho phép chọn tệp CSV thực tế từ máy tính, gọi API preview kiểm tra lỗi và gọi API commit để chèn hàng loạt vào MariaDB.
- **Ước tính nỗ lực**: 8 giờ làm việc.

#### [TICKET-QA-01] Thiết lập Playwright E2E & Bổ sung Test Coverage cho 6 trang cốt lõi
- **Epic**: Quality Assurance & Testing
- **Loại**: Testing Infrastructure
- **Mức độ ưu tiên**: **`P1 — HIGH`** | **Mức nghiêm trọng**: `High`
- **Trạng thái**: `VERIFIED`
- **Vị trí**: Thư mục `tests/` và `package.json`
- **Mô tả vấn đề**: Thiếu kiểm thử tự động hóa trên trình duyệt thực tế; 0% test cho Login, Onboarding, Lesson Detail, Exam Room, Admin.
- **Tiêu chuẩn nghiệm thu**:
  1. Cài đặt và cấu hình `@playwright/test` trong `package.json`.
  2. Viết tối thiểu 3 kịch bản E2E kiểm thử luồng người dùng hoàn chỉnh trên trình duyệt Chromium headless.
  3. Bổ sung Component test cho các màn hình bị thiếu.
- **Ước tính nỗ lực**: 10 giờ làm việc.

---

### EPIC 5: HOÀN THIỆN TRẢI NGHIỆM NGƯỜI DÙNG & SƯ PHẠM (UX & PEDAGOGY REFINEMENT)

- **[TICKET-UX-01] Dọn dẹp liên kết rác trên Header Sub-nav**: Loại bỏ hoặc vô hiệu hóa các link dẫn tới query params chưa hỗ trợ (`?type=READING`, `?filter=mistakes`, `?tab=history`). *(P2 — 2h)*
- **[TICKET-UX-02] Sửa lỗi Fallback Mock Cards trên trang Flashcards**: Thay thế 3 thẻ tĩnh `MOCK_SRS_CARDS` bằng màn hình Empty state chúc mừng khi không còn thẻ đến hạn. *(P2 — 2h)*
- **[TICKET-EDU-03] Bổ sung Bài học Katakana & Ngữ pháp phân loại nhóm động từ**: Thêm bài Katakana vào lộ trình N5 và chèn bài học chia 3 nhóm động từ trước mẫu câu thể て. *(P2 — 8h)*
- **[TICKET-UX-03] Bổ sung các trang ngoại lệ Next.js (`not-found.tsx`, `error.tsx`) & Footer**: Thiết kế trang 404/500 và chân trang thương hiệu ManabiHub. *(P2 — 4h)*
- **[TICKET-DB-01] Thiết lập quy trình Prisma Migration chuyên nghiệp**: Thay thế `prisma db push` bằng `prisma migrate dev` và `prisma migrate deploy` có lưu vết thư mục `prisma/migrations`. *(P2 — 4h)*
- **[TICKET-UX-04] Bổ sung Hộp thoại xác nhận nộp bài thi**: Hiển thị modal cảnh báo số câu chưa làm trước khi thí sinh nộp bài thi chính thức. *(P2 — 2h)*
- **[TICKET-A11Y-01] Tối ưu hóa màu tương phản & Nhãn ARIA**: Điều chỉnh màu chữ phụ lên `#4B5563` và thêm `aria-label` cho `AudioButton`. *(P3 — 2h)*
- **[TICKET-EDU-04] Chú thích Tự động từ / Tha động từ trong Sổ tay Từ vựng**: Bổ sung trường dữ liệu phân biệt Jidoushi/Tadoushi cho các động từ N5. *(P3 — 3h)*

---

## 3. TỔNG KẾT & ĐỀ XUẤT CỔNG DUYỆT

- **Tổng số Tickets**: 20 Tickets (5 P0, 7 P1, 6 P2, 2 P3).
- **Tổng nỗ lực ước tính**: Khoảng **90 giờ làm việc (tương đương 11–12 ngày làm việc cho 1 Senior Full-stack Engineer)**.
- **Đề xuất bước tiếp theo**: Chuyển tiếp sang **PHASE 7 — IMPLEMENTATION PLANNING ONLY** (`prompt8.md`) để chọn lọc phạm vi triển khai ưu tiên (Scope selection), thiết lập đặc tả chi tiết từng task và lập kế hoạch TDD (`RED → GREEN → REFACTOR`) trước khi viết bất kỳ dòng mã thực thi nào.

> [!IMPORTANT]
> **GATE STATUS**: Phase 6 đã hoàn tất lập báo cáo Master Backlog. Tạm dừng để Product Owner xem xét và phê duyệt phạm vi vé công việc trước khi chuyển sang Phase 7.

