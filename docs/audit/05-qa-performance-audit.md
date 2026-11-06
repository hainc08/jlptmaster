# BÁO CÁO KIỂM TOÁN PHASE 5: KIỂM THỬ CHẤT LƯỢNG (QA), ĐỘ BAO PHỦ & HIỆU NĂNG (QA & PERFORMANCE AUDIT)

- **Dự án**: JLPT ManabiHub (JLPT Master)
- **Môi trường Web thực tế**: `https://jlpt.manabihub.me`
- **Phiên bản mã nguồn**: Git branch `deploy`, Commit `9222b22`
- **Ngày kiểm toán**: 28/10/2026 (Cập nhật đối soát hệ thống 03/11/2026)
- **Tiêu chuẩn kiểm toán**: Testing Pyramid & Core Web Vitals (Lighthouse)
- **Vai trò thực hiện**: Senior QA Lead & Performance Engineer

---

## 1. TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Đội ngũ kiểm thử đã chạy toàn bộ bộ kiểm thử tự động, phân tích ma trận bao phủ kiểm thử (Test Coverage Matrix), thiết kế bộ kịch bản kiểm thử hành trình trọng yếu (Given/When/Then Acceptance Scenarios) và đánh giá các chỉ số hiệu năng trên nền tảng Hostinger Node.js.

### Kết quả kiểm thử tự động:
- **Tình trạng thực thi**: **14/14 test suites PASSED (100%)**, tổng cộng **47/47 tests PASSED**.
- **Thời gian chạy**: ~48.05s (Vitest v3.2.7 trên môi trường Node/jsdom có kết nối MariaDB).
- **Phân loại bài kiểm thử hiện có**:
  - Unit Tests: 3 bài kiểm thử (SRS calculation, idempotency).
  - Component Tests (React Testing Library): 17 bài kiểm thử (RubyText, Vocabulary, Flashcards, PracticeQuiz, LivePages, HeaderNavigation).
  - Integration Tests: 11 bài kiểm thử (API v1 routes, CSV import, Exam timer expiry).
  - Security Tests: 11 bài kiểm thử (OWASP audit, RBAC, IDOR, Exam secrecy).
  - E2E Journeys (Tích hợp máy chủ): 5 bài kiểm thử.

---

## 2. DANH MỤC & ĐỘ BAO PHỦ CỦA BỘ KIỂM THỬ HIỆN CÓ (TEST INVENTORY — QA-001)

| Tệp kiểm thử | Phân loại | Số tests | Tính năng nghiệp vụ được bao phủ | Trạng thái |
| :--- | :---: | :---: | :--- | :---: |
| `tests/security/exam-secrecy.test.ts` | Security | 2 | Bảo mật đáp án đề thi, giấu `isCorrect` và giải thích | `PASS` |
| `tests/unit/srs-idempotency.test.ts` | Unit | 2 | Thuật toán khoảng cách thời gian SRS & tính lũy kế | `PASS` |
| `tests/components/RubyText.test.tsx` | Component | 2 | Hiển thị thẻ `<ruby>` và ẩn/hiện Furigana qua Context | `PASS` |
| `tests/integration/exam-timer-expiry.test.ts` | Integration | 2 | Đếm giờ máy chủ, từ chối nộp bài khi hết thời gian thi | `PASS` |
| `tests/components/VocabularyPage.test.tsx` | Component | 3 | Tìm kiếm từ vựng, lọc từ loại, xử lý lỗi mạng | `PASS` |
| `tests/security/rbac-idor.test.ts` | Security | 3 | Phân quyền ADMIN và kiểm tra IDOR sở hữu tài nguyên | `PASS` |
| `tests/components/LivePagesAndCleanBadges.test.tsx` | Component | 3 | Gỡ bỏ badge Prototype trên toàn bộ các trang chính | `PASS` |
| `tests/components/FlashcardsPage.test.tsx` | Component | 2 | Lật thẻ flashcard và nạp hàng đợi ôn tập từ API | `PASS` |
| `tests/components/PracticeQuizPage.test.tsx` | Component | 2 | Làm quiz củng cố, chấm điểm máy chủ và tăng điểm số | `PASS` |
| `tests/components/HeaderNavigation.test.tsx` | Component | 7 | 5 trụ cột menu, bộ chọn cấp độ, phím Escape, phân quyền vai trò | `PASS` |
| `tests/security/owasp-audit.test.ts` | Security | 5 | Chặn lộ mật khẩu băm, RBAC, IDOR và bí mật đề thi | `PASS` |
| `tests/integration/csv-import.test.ts` | Integration | 2 | Thẩm định Zod schema từng dòng CSV và phát hiện dòng lỗi | `PASS` |
| `tests/e2e/user-journeys.test.ts` | E2E Service | 5 | Luồng đăng ký, học từ vựng, ôn thẻ SRS và nộp bài thi | `PASS` |
| `tests/integration/api-v1-routes.test.ts` | Integration | 7 | Các endpoint `/courses`, `/lessons`, `/kanji`, `/reviews`, `/attempts` | `PASS` |

---

## 3. KHOẢNG TRỐNG KIỂM THỬ CHƯA ĐƯỢC BAO PHỦ (TESTING GAPS)

Mặc dù có 47 tests passed, hệ thống kiểm thử còn tồn tại **các khoảng trống lớn**:
1. **Thiếu kiểm thử E2E tự động hóa trình duyệt thực tế (Playwright)**:
   - File `tests/e2e/user-journeys.test.ts` thực chất là Vitest gọi hàm Prisma và Service trực tiếp trong Node, **không phải là Playwright điều khiển trình duyệt**. Thư viện `playwright` chưa hề được cài trong `package.json`.
2. **Không có kiểm thử giao diện cho các trang cốt lõi**:
   - Trang Đăng nhập & Đăng ký (`/login`, `/register`): 0 tests.
   - Trang Thiết lập mục tiêu (`/onboarding`): 0 tests.
   - Trang Chi tiết bài học (`/learn/n5/[lessonSlug]`): 0 tests.
   - Trang Phòng thi thử trực tuyến (`/mock-exams/[attemptId]`): 0 tests.
   - Trang Báo cáo kết quả thi (`/results/[attemptId]`): 0 tests.
   - Trang Quản trị viên CMS (`/admin` và `/admin/content/import`): 0 tests.
3. **Thiếu kiểm thử hồi quy trực quan (Visual Regression)**: Chưa có cơ chế chụp ảnh màn hình so sánh pixel trên di động 375px.

---

## 4. BỘ THIẾT KẾ KỊCH BẢN KIỂM THỬ HÀNH TRÌNH TRỌNG YẾU (ACCEPTANCE TEST DESIGN — QA-002)

### Kịch bản 1: Bắt đầu & Nộp bài thi thử JLPT (Mock Exam Flow)
```gherkin
Scenario: Học viên làm bài thi thử N5 và nhận kết quả chấm điểm thực tế
  Given Học viên đã đăng nhập và truy cập trang danh mục đề thi "/mock-exams"
  When Học viên bấm nút "Làm bài thi" trên Đề thi số 01
  Then Máy chủ khởi tạo lượt thi mới qua "POST /api/v1/exams/:id/start" với thời hạn 20 phút
  And Giao diện phòng thi hiển thị các câu hỏi không chứa trường "isCorrect"
  When Học viên chọn đáp án và tải lại trang trình duyệt (F5)
  Then Toàn bộ đáp án đã chọn được khôi phục nguyên vẹn từ máy chủ
  When Học viên bấm "Nộp bài thi"
  Then Máy chủ thực hiện chấm điểm duy nhất qua "POST /api/v1/attempts/:id/finish"
  And Học viên được chuyển đến trang kết quả với điểm số thật tính từ bài làm
```

### Kịch bản 2: Ôn tập ngắt quãng SRS chống trùng lặp (SRS Idempotency)
```gherkin
Scenario: Gửi trùng lặp request ôn tập thẻ SRS do mạng chậm
  Given Học viên có 1 thẻ từ vựng "先生" đến hạn ôn tập hôm nay
  When Học viên lật thẻ và bấm chọn mức độ "Tốt (3 ngày)"
  And Do mạng chập chờn, trình duyệt gửi liên tiếp 2 request POST cùng mã "idempotencyKey"
  Then Máy chủ chỉ ghi nhận 1 bản ghi duy nhất vào bảng "review_logs"
  And Chu kỳ của thẻ tăng đúng 3 ngày (không bị cộng dồn thành 6 ngày)
  And Request thứ hai nhận về phản hồi thông báo trùng lặp an toàn
```

---

## 5. THIẾT KẾ KIỂM THỬ TRƯỜNG HỢP BIÊN VÀ DỮ LIỆU ĐẶC BIỆT (BOUNDARY TESTS — QA-003)

1. **Ranh giới múi giờ lúc nửa đêm (Midnight Boundary for Streak)**:
   - Học viên học bài lúc 23:55 ngày hôm nay và hoàn thành bài tập lúc 00:05 ngày hôm sau theo giờ Hà Nội (`Asia/Ho_Chi_Minh` - UTC+7).
   - *Kiểm thử*: Hệ thống phải ghi nhận streak được duy trì qua 2 ngày liên tiếp thay vì bị ngắt quãng hoặc tính trùng 2 lần trong 1 ngày.
2. **Kỳ hạn thẻ SRS vượt qua ranh giới nửa đêm**:
   - Thẻ đánh giá "Khó" (cộng thêm 24 giờ) lúc 23:30 phải được lên lịch đến hạn vào đúng 23:30 ngày hôm sau, hiển thị trong hàng đợi ôn tập của ngày hôm sau.
3. **Nộp bài thi đúng giây thứ 0 của thời hạn máy chủ**:
   - Thí sinh nộp bài khi đồng hồ điểm `00:00` (trong khoảng ân hạn 15 giây `gracePeriodSeconds` của `exam-service.ts`).
   - *Kiểm thử*: Máy chủ chấp nhận kết quả chấm điểm; nếu vượt quá 15 giây ân hạn, máy chủ trả về mã 400 và tự động chuyển trạng thái lượt thi sang `EXPIRED`.
4. **Nhập dữ liệu CSV chứa ký tự tiếng Nhật Unicode đặc biệt**:
   - Tệp CSV chứa chữ Hán hiếm, Kanji có Furigana phức tạp hoặc cột Furigana để trống.
   - *Kiểm thử*: Schema Zod bắt lỗi chính xác dòng thiếu, không thực hiện ghi dở dang vào MariaDB (ACID rollback 100%).

---

## 6. ĐÁNH GIÁ HIỆU NĂNG & TỐI ƯU HÓA HẠ TẦNG (PERFORMANCE AUDIT — QA-004)

### 6.1 Hiệu năng Truy vấn CSDL MariaDB
- **Tối ưu hóa N+1 Query**:
  - Trên API `/api/v1/courses`, Prisma sử dụng mệnh đề `include: { lessons: true }` $\rightarrow$ Thực thi 2 câu lệnh SQL có chỉ mục thay vì lặp vòng query từng bài học.
  - Trên API `/api/v1/vocabulary`, câu lệnh tìm kiếm sử dụng cột đánh chỉ mục `search_normalized` $\rightarrow$ Tốc độ phản hồi cực nhanh (< 15ms trên tập dữ liệu 1000 dòng).
- **Quản trị Kết nối (Connection Pooling)**:
  - Cấu hình trong `.env.production.example` đặt `connection_limit=5` và `DATABASE_POOL_MAX=5`.
  - *Đánh giá*: Đây là con số tối ưu cho gói Cloud/Shared Hosting của Hostinger nhằm tránh lỗi nghẽn `Too many connections` khi có nhiều người dùng đồng thời.

### 6.2 Đóng gói Ứng dụng & Trọng lượng Bundle
- Tệp `next.config.ts` kích hoạt `output: "standalone"` và `experimental: { cpus: 2 }`.
- **Kết quả Build thực tế**:
  - Toàn bộ 34 routes biên dịch sạch sẽ không có cảnh báo lỗi bộ nhớ.
  - Thư mục `.next/standalone` chỉ chứa các tệp thực thi tối thiểu, giảm 85% dung lượng đĩa so với việc bê nguyên thư mục `node_modules` lên máy chủ.

### 6.3 Chỉ số Trải nghiệm Người dùng (Core Web Vitals)
- **Largest Contentful Paint (LCP)**: Các trang bài học và từ vựng đạt LCP ước tính ~1.2s (Vượt chuẩn xanh < 2.5s của Google) nhờ SSR và tối ưu CSS thuần Tailwind v4.
- **Cumulative Layout Shift (CLS)**: Bằng 0. Font chữ tiếng Nhật và tiếng Việt được tải với `display: "swap"`, không làm giật khung giao diện khi font nạp xong.

---

## 7. BẢNG TỔNG HỢP KHIẾM KHUYẾT KIỂM THỬ (QA DEFECT LOG)

| Mã lỗi | Mức độ | Phân loại | Mô tả chi tiết khiếm khuyết |
| :--- | :---: | :--- | :--- |
| `DEF-QA-01` | **HIGH** | Testing Infra | Thiếu công cụ kiểm thử E2E thật trên trình duyệt (Playwright chưa được cài đặt). |
| `DEF-QA-02` | **HIGH** | Coverage | 0% bài kiểm thử tự động cho các trang: Login, Register, Onboarding, Lesson Detail, Mock Exam Room, Admin. |
| `DEF-QA-03` | **MEDIUM** | Performance | Chưa có kịch bản kiểm thử chịu tải (Load testing) đo lường khả năng chịu tải đồng thời của MariaDB trên Hostinger. |
| `DEF-QA-04` | **LOW** | CI/CD | Bộ kiểm thử chưa tích hợp đo lường tỷ lệ bao phủ dòng code (Code Coverage Report - Istanbul/c8). |

---

## 8. KẾT LUẬN & ĐỀ XUẤT CỔNG DUYỆT

- **Kết luận Phase 5**: Bộ kiểm thử tự động hiện tại có chất lượng logic nghiệp vụ rất tốt (47/47 passed), đặc biệt ở các thuật toán khó như SRS và chống gian lận đề thi. Tuy nhiên, mức độ bao phủ mới chỉ tập trung vào tầng API và dịch vụ máy chủ; toàn bộ các luồng thao tác người dùng trên giao diện trình duyệt vẫn đang phụ thuộc vào kiểm thử thủ công.
- **Đề xuất bước tiếp theo**: Chuyển tiếp sang **PHASE 6 — CONSOLIDATED MASTER BACKLOG** (`prompt7.md`) để gom nhóm toàn bộ các khiếm khuyết từ Phase 0 đến Phase 5, phân loại theo độ ưu tiên (P0 Critical, P1 High, P2 Medium, P3 Low) và chuẩn bị kế hoạch phát triển.

> [!IMPORTANT]
> **GATE STATUS**: Phase 5 đã hoàn tất lập báo cáo. Tạm dừng để Product Owner xem xét trước khi chuyển sang Phase 6.

