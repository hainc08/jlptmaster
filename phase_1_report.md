# BÁO CÁO KIẾN TRÚC PHẦN MỀM — GIAI ĐOẠN 1: SPECIFICATION ANALYSIS
**Dự án:** JLPT Master (Nền tảng học & luyện thi JLPT cho người Việt)  
**Vai trò:** Lead Software Architect  
**Kỹ năng kích hoạt:** `/spec-analyzer`  
**Trạng thái kiểm duyệt:** ⏳ **DỪNG ĐỂ CHỜ PHÊ DUYỆT (Awaiting Written Approval)**

---

## 1. TỔNG QUAN PHÂN TÍCH YÊU CẦU & PHẠM VI N5 MVP

Dựa trên tài liệu `SPEC.md`, quy chuẩn `AGENTS.md` và các quy tắc kỹ thuật của dự án:
- **Trọng tâm MVP:** Xây dựng luồng hoàn chỉnh cho **JLPT N5** (không tạo nội dung giả lập cho N4–N1; N4–N1 chỉ hỗ trợ cấu trúc dữ liệu và hiển thị nhãn *"Sắp ra mắt"*).
- **Hành trình người học cốt lõi:** Đăng ký $\rightarrow$ Khảo sát mục tiêu (N5) $\rightarrow$ Học bài (Bảng chữ cái Kana, Từ vựng, Kanji, Ngữ pháp) $\rightarrow$ Luyện tập câu hỏi $\rightarrow$ Xem giải thích chi tiết tiếng Việt $\rightarrow$ Ôn tập thẻ nhớ ngắt quãng (SRS) $\rightarrow$ Thi thử đề N5 có bấm giờ & lưu tự động $\rightarrow$ Chẩn đoán điểm yếu.
- **Tiêu chuẩn công nghệ bắt buộc:**
  - **Frontend:** Next.js (App Router), TypeScript Strict, Tailwind CSS, shadcn/ui.
  - **Backend & ORM:** Next.js Route Handlers / Server Actions, Zod, Prisma ORM với `provider = "mysql"`.
  - **Cơ sở dữ liệu:** **MariaDB** (InnoDB, `utf8mb4`). *Tuyệt đối không sử dụng PostgreSQL, SQLite hay Supabase.*
  - **Hạ tầng triển khai:** Hostinger persistent Node.js / Hostinger VPS Docker, S3-compatible object storage cho media.
  - **Quy trình kiểm thử:** Test-Driven Development (TDD: RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR) với Vitest và Playwright.

---

## 2. TÓM TẮT HỆ THỐNG YÊU CẦU (FR & NFR)

Chi tiết đã được đặc tả toàn diện tại [`docs/requirements.md`](file:///d:/100.JLPT/00.web_app/docs/requirements.md):

### 2.1 Yêu cầu chức năng (Functional Requirements — FR)
- **FR-01 (Tài khoản & Phiên làm việc):** Đăng ký/đăng nhập mật khẩu bảo mật (Argon2id/bcrypt), cookie HttpOnly SameSite, phân quyền RBAC (`STUDENT`, `EDITOR`, `ADMIN`).
- **FR-02 (Khảo sát ban đầu - Onboarding):** Chọn cấp độ mục tiêu (mặc định N5), thiết lập mục tiêu hàng ngày (15-60 phút), lưu vào `user_profiles`.
- **FR-03 (Bảng điều khiển - Dashboard):** Hiển thị thẻ ôn tập SRS đến hạn thực tế, chuỗi học liên tục (streak), nút tiếp tục bài học gần nhất (tối đa 2 chạm).
- **FR-04 (Chương trình học & Kana):** Cấu trúc Khóa học $\rightarrow$ Bài học; tích hợp bảng chữ cái Hiragana/Katakana có phát âm; ghi nhận hoàn thành bài học bảo đảm tính lũy thừa (idempotency).
- **FR-05, FR-06, FR-07 (Ngân hàng Từ vựng, Kanji, Ngữ pháp):** Lưu trữ ký tự gốc, phiên âm Kana, giải thích nghĩa tiếng Việt, âm Hán Việt, cấu trúc ngữ pháp và câu ví dụ song ngữ.
- **FR-08 (Công cụ Luyện tập):** 4 dạng câu hỏi (trắc nghiệm đơn, đọc Kanji, điền chỗ trống, sắp xếp sao); chấm điểm server-side; tuyệt đối không để lộ đáp án trước khi nộp.
- **FR-09 (Hệ thống Thẻ nhớ SRS):** Thuật toán 4 mức nhớ (Again +10m, Hard +1d, Good +3d, Easy +7d), xử lý mốc thời gian UTC và hiển thị múi giờ `Asia/Ho_Chi_Minh`, khóa chống gửi trùng lặp (`idempotencyKey`).
- **FR-10, FR-11 (Đọc hiểu & Nghe hiểu):** Bài đọc kèm chuyển đổi Furigana; trình phát âm thanh tùy chỉnh tốc độ (0.8x, 1.0x); kiểm tra MIME và kích thước tệp âm thanh.
- **FR-12, FR-13 (Đề thi thử N5 & Kết quả):** Mô phỏng cấu trúc thi JLPT N5 (3 phần: Kiến thức ngôn ngữ 20p, Ngữ pháp/Đọc hiểu 40p, Nghe hiểu 30p); lưu tự động định kỳ (debounced autosave 15s); đồng hồ đếm ngược server-side; chấm điểm 0–180 kèm cảnh báo pháp lý về điểm nội bộ.
- **FR-14 (Phân tích tiến độ):** Báo cáo độ chuẩn xác theo từng thẻ kỹ năng yếu (<60%).
- **FR-15, FR-16, FR-17 (Hệ thống CMS & Nhập dữ liệu CSV):** Quy trình biên tập 4 bước (`DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`); xem trước lỗi CSV theo dòng; quản lý bản quyền tệp đính kèm.
- **FR-18, FR-19, FR-20 (Trợ năng, Bảo mật & Vận hành):** Hỗ trợ bàn phím 100%, thẻ `<ruby>` chuẩn ngữ nghĩa, bảo vệ IDOR, kiểm soát giới hạn tốc độ (rate-limit), Docker Compose MariaDB và seed dữ liệu mẫu.

### 2.2 Yêu cầu phi chức năng (Non-Functional Requirements — NFR)
- **NFR-01 (Hiệu năng):** Lighthouse $\ge 85$, LCP $\le 2.5\text{s}$, không phát sinh truy vấn $N+1$.
- **NFR-02 (Bảo mật):** Tuân thủ OWASP Top 10, băm mật khẩu chuẩn xác, che giấu dữ liệu nhạy cảm trong nhật ký hệ thống.
- **NFR-03 (Toàn vẹn CSDL):** MariaDB InnoDB, mã hóa `utf8mb4`, khóa ngoại bảo vệ lịch sử làm bài không bị xóa lan truyền.
- **NFR-04 (Độ tin cậy):** Đệm cục bộ `localStorage` khi mất mạng trong lúc thi thử, giao dịch ACID (`$transaction`).
- **NFR-05 (Bản địa hóa):** Giao diện tiếng Việt, ký tự Furigana tiếng Nhật, chuyển đổi ngày giờ theo múi giờ Việt Nam.
- **NFR-06 (Công thái học di động):** Tối ưu 375px (thanh điều hướng đáy) và 1440px (thanh bên trái), vùng chạm $\ge 44\times 44\text{px}$.
- **NFR-07 (Bản quyền & Pháp lý):** Sử dụng 100% nội dung gốc hoặc giấy phép mở, tuyên bố miễn trừ trách nhiệm thi chính thức.
- **NFR-08..NFR-10 (Giám sát, Chất lượng TDD, Vận hành Hostinger):** Endpoint `/api/health`, TypeScript strict, quy trình CI/CD GitHub Actions.

---

## 3. MA TRẬN TRUY XUẤT NGUỒN GỐC (TRACEABILITY MATRIX)

Tài liệu chi tiết đã được tạo tại [`docs/traceability.md`](file:///d:/100.JLPT/00.web_app/docs/traceability.md).  
Toàn bộ 12 kịch bản chấp nhận (Acceptance Scenarios) từ Mục 12 trong `SPEC.md` đã được ánh xạ tới các bộ kiểm thử tương ứng:
1. **Scenario 1 (Hành trình onboarding & học bài):** FR-01, FR-02, FR-03, FR-04 $\rightarrow$ `tests/e2e/onboarding-journey.spec.ts`
2. **Scenario 2 (Chấm điểm câu hỏi & phản hồi giải thích):** FR-08 $\rightarrow$ `tests/integration/practice-grading.test.ts`
3. **Scenario 3 (Lũy thừa thẻ ôn tập SRS với idempotency key):** FR-09 $\rightarrow$ `tests/unit/srs-idempotency.test.ts`
4. **Scenario 4 (Chống truy cập chéo tài khoản IDOR & bảo vệ Admin API):** FR-01, FR-15, FR-19 $\rightarrow$ `tests/security/rbac-idor.test.ts`
5. **Scenario 5 (Tuyệt đối không rò rỉ đáp án trước khi nộp bài thi):** FR-08, FR-12, FR-13, FR-19 $\rightarrow$ `tests/security/exam-secrecy.test.ts`
6. **Scenario 6 (Tự động lưu bài thi, tải lại trang phục hồi trạng thái):** FR-12 $\rightarrow$ `tests/e2e/exam-autosave.spec.ts`
7. **Scenario 7 (Hết giờ thi server tự khóa và từ chối cập nhật trễ):** FR-12 $\rightarrow$ `tests/integration/exam-timer-expiry.test.ts`
8. **Scenario 8 (Vòng đời nội dung CMS: Bản nháp $\rightarrow$ Xuất bản):** FR-15 $\rightarrow$ `tests/integration/content-publishing-lifecycle.test.ts`
9. **Scenario 9 (Tải CSV sai dòng báo cáo lỗi cụ thể, không ghi dữ liệu rác):** FR-16 $\rightarrow$ `tests/integration/csv-import.test.ts`
10. **Scenario 10 (Unicode tiếng Nhật, thẻ Ruby Furigana, tìm kiếm Kana):** FR-05, FR-06, FR-07, FR-18 $\rightarrow$ `tests/unit/japanese-unicode-ruby.test.ts`
11. **Scenario 11 (Bộ kiểm chuẩn tự động qua lint, typecheck, unit, e2e, build):** FR-11, FR-17, FR-20, NFR-09 $\rightarrow$ GitHub Actions Pipeline
12. **Scenario 12 (Trợ năng bàn phím và giao diện chuẩn 375px & 1440px):** FR-18, NFR-06 $\rightarrow$ `tests/e2e/accessibility-keyboard-mobile.spec.ts`

---

## 4. PHÂN TÍCH RỦI RO KIẾN TRÚC, PHỤ THUỘC & CẢNH BÁO KỸ THUẬT

1. **Rủi ro bản quyền đề thi JLPT (Nghiêm trọng):**
   - Đề thi chính thức của Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản (JEES) và Quỹ Giao lưu Quốc tế Nhật Bản (The Japan Foundation) được bảo hộ bản quyền nghiêm ngặt.
   - *Biện pháp:* Nền tảng chỉ sử dụng câu hỏi tự soạn hoặc nguồn mở có giấy phép rõ ràng; bắt buộc có tuyên bố từ chối trách nhiệm pháp lý tại chân trang và màn hình thi thử.
2. **Cạm bẫy phương ngữ MariaDB vs PostgreSQL (Cao):**
   - Không sử dụng các tính năng riêng của Postgres như `enum` nguyên bản, mảng, toán tử JSONB `->>`.
   - *Biện pháp:* Sử dụng cột chuẩn hóa (normalized columns) như `search_normalized` để tìm kiếm từ vựng tiếng Nhật, thiết lập Prisma `provider = "mysql"`.
3. **Cạnh tranh luồng (Race conditions) khi lưu tự động bài thi (Trung bình):**
   - Xung đột giữa việc autosave định kỳ và hành động nộp bài cuối cùng hoặc hết giờ.
   - *Biện pháp:* Dùng giao dịch cơ sở dữ liệu (`prisma.$transaction`) và kiểm tra điều kiện trạng thái `status == 'IN_PROGRESS'`.
4. **Hạ tầng Hostinger (Trung bình):**
   - Cần đảm bảo gói Hostinger hỗ trợ Node.js process chạy nền liên tục (Node.js Web App hoặc VPS), thiết lập giới hạn connection pool `connection_limit=5` để tránh làm tràn kết nối MariaDB.

---

## 5. DANH MỤC CÔNG VIỆC ƯU TIÊN (PRODUCT BACKLOG) & LỘ TRÌNH THỰC HIỆN

Chi tiết 20 User Stories đã được biên soạn tại [`docs/backlog.md`](file:///d:/100.JLPT/00.web_app/docs/backlog.md).

### Khuyến nghị thứ tự thực hiện theo quy tắc cổng phê duyệt (Hard Approval Gates):
```
[Giai đoạn 1: Spec Analysis] (HIỆN TẠI - Chờ phê duyệt)
       ↓
[Giai đoạn 2: UI/UX Design System] (/ui-ux-designer: Sitemap, Wireframes, Token)
       ↓ (Chờ duyệt UI)
[Giai đoạn 3: UI Prototype] (/prototype-builder: Next.js + Tailwind + Mock Data, không DB)
       ↓ (Chờ duyệt Prototype)
[Giai đoạn 4: API & DB Technical Architecture] (/api-db-architect: MariaDB Prisma Schema, OpenAPI)
       ↓ (Chờ duyệt Hợp đồng API/DB)
[Giai đoạn 5: Backend TDD] (/tdd-backend: RED -> GREEN -> REFACTOR)
       ↓ (Chờ duyệt Module BE)
[Giai đoạn 6: Frontend TDD] (/tdd-frontend: Tích hợp API thực vào UI prototype)
       ↓
[Giai đoạn 7: E2E Integration & Code Review] (/integration-e2e & /code-review-security)
       ↓
[Giai đoạn 8: Hostinger Deployment & Release] (/deployment-release: Staging -> Prod)
```

---

## 6. YÊU CẦU PHÊ DUYỆT CỔNG GIAI ĐOẠN 1 (APPROVAL GATE 1)

Theo quy định nghiêm ngặt trong `AGENTS.md`:
> *"The owner approves each phase in writing. Never self-approve. Current approved state is only stored in docs/phase-state.yaml. Until approval, produce review artifacts and stop."*

Hệ thống đã dừng lại và không tự động triển khai mã nguồn, cơ sở dữ liệu hay giao diện.  
Kính mời Quý Quản trị viên (Product Owner) xem xét các tài liệu tạo mới:
1. [`docs/requirements.md`](file:///d:/100.JLPT/00.web_app/docs/requirements.md)
2. [`docs/traceability.md`](file:///d:/100.JLPT/00.web_app/docs/traceability.md)
3. [`docs/backlog.md`](file:///d:/100.JLPT/00.web_app/docs/backlog.md)
4. [`docs/phase-log.md`](file:///d:/100.JLPT/00.web_app/docs/phase-log.md)

**Xin vui lòng gửi phản hồi bằng văn bản để phê duyệt Giai đoạn 1 nhằm cho phép chuyển sang Giai đoạn 2 (`/ui-ux-designer`).**
