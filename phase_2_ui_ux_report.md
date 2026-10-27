# BÁO CÁO THIẾT KẾ UI/UX & HỆ THỐNG GIAO DIỆN — GIAI ĐOẠN 2
**Dự án:** JLPT Master (Nền tảng học & luyện thi JLPT cho người Việt)  
**Vai trò:** Lead UI/UX Designer & Software Architect  
**Kỹ năng kích hoạt:** `/ui-ux-designer`  
**Trạng thái kiểm duyệt:** ⏳ **DỪNG ĐỂ CHỜ PHÊ DUYỆT CỔNG GIAO DIỆN (UI Approval Gate)**

---

## 1. TỔNG QUAN THIẾT KẾ: "TINH GỌN & CHUẨN NHẬT" (ZEN PRECISION)

Thiết kế giao diện cho JLPT Master kết hợp hài hòa giữa nét thẩm mỹ tối giản, mực thước của Nhật Bản (*Zen & Wabi-Sabi*) với sự thuận tiện, rõ ràng trong hiển thị chữ Quốc ngữ tiếng Việt có dấu.
- **Màu sắc chủ đạo:** Đỏ chu sa Nhật Bản (Shuu-iro `#B9343F`) làm điểm nhấn hành động, kết hợp sắc chàm Indigo (`#2B4C7E`) cho phần ngữ pháp lý thuyết và nền giấy ấm (`#F7F7F4`) giúp giảm mỏi mắt khi học lâu.
- **Xử lý song ngữ (Dual-Script):** Font `Be Vietnam Pro` tối ưu tiếng Việt không bị cắt dấu, kết hợp `Noto Sans JP` cho chữ Hán (Kanji) và chữ mềm/chữ cứng (Hiragana/Katakana).
- **Trợ năng Furigana:** Hỗ trợ thẻ `<ruby>` chuẩn ngữ nghĩa, có nút công tắc bật/tắt phiên âm Furigana trên toàn bộ bài học và bài đọc hiểu.
- **Chuẩn công thái học di động:** Vùng chạm tối thiểu $44 \times 44\text{px}$, cách nhau $\ge 8\text{px}$, thanh điều hướng cố định phía dưới màn hình (Bottom Navigation) trên điện thoại (375px) và thanh bên mở rộng (Sidebar) trên máy tính (1440px).

---

## 2. KIẾN TRÚC THÔNG TIN & SITEMAP

Tài liệu chi tiết: [`docs/sitemap.md`](file:///d:/100.JLPT/00.web_app/docs/sitemap.md)

Hệ thống được chia thành 4 phân vùng bảo mật:
1. **Phân vùng Công khai (Public):**
   - `/` — Trang chủ giới thiệu, lộ trình N5–N1, SEO, nút chuyển đổi đăng ký.
2. **Phân vùng Khách (Guest Auth):**
   - `/login`, `/register`, `/forgot-password` — Biểu mẫu xác thực tối giản, kiểm định Zod.
3. **Phân vùng Học viên (Student - Đã đăng nhập):**
   - `/onboarding` — Thiết lập mục tiêu học (N5 kích hoạt, N4–N1 nhãn "Sắp ra mắt").
   - `/dashboard` — Bảng điều khiển, chuỗi học liên tục (streak), thẻ SRS đến hạn, tiếp tục bài học gần nhất.
   - `/learn/n5` & `/learn/n5/[lessonSlug]` — Lộ trình học, bài học lý thuyết, từ vựng, ngữ pháp, Kana.
   - `/vocabulary` & `/vocabulary/[slug]` — Tra cứu từ vựng N5, âm thanh, câu ví dụ song ngữ.
   - `/kanji` & `/kanji/[slug]` — Chữ Hán, âm On/Kun, âm Hán-Việt, nét viết.
   - `/grammar` & `/grammar/[slug]` — Sổ tay ngữ pháp, cách chia, sắc thái, ví dụ.
   - `/flashcards` — Phòng ôn tập thẻ nhớ SRS 3D, 4 nút đánh giá (Again, Hard, Good, Easy).
   - `/practice` — Luyện tập 4 dạng câu hỏi, chấm điểm server-side, giải thích chi tiết.
   - `/reading`, `/reading/[id]` — Luyện đọc hiểu, xem trước bài đọc song ngữ.
   - `/listening`, `/listening/[id]` — Luyện nghe hiểu, trình phát âm thanh chỉnh tốc độ (0.8x/1.0x).
   - `/mock-exams`, `/mock-exams/[attemptId]` — Thi thử bấm giờ, tự động lưu 15s (autosave), khóa đề.
   - `/results/[attemptId]` — Kết quả chấm điểm 0–180, phân tích câu sai, chẩn đoán điểm yếu.
   - `/progress`, `/settings` — Biểu đồ tiến độ và cài đặt tài khoản.
4. **Phân vùng Quản trị (Admin/Editor):**
   - `/admin`, `/admin/content`, `/admin/questions`, `/admin/exams`, `/admin/media`, `/admin/audit`.

---

## 3. LUỒNG NGƯỜI DÙNG CỐT LÕI (USER FLOWS)

Tài liệu chi tiết: [`docs/user-flows.md`](file:///d:/100.JLPT/00.web_app/docs/user-flows.md)

### 5 Luồng tương tác chính đã được sơ đồ hóa:
1. **Học viên mới (Onboarding):** Đăng ký $\rightarrow$ Khảo sát N5 $\rightarrow$ Học bài 01 $\rightarrow$ Luyện 5 câu $\rightarrow$ Nhận phản hồi giải thích $\rightarrow$ Hoàn thành bài học $\rightarrow$ Dashboard.
2. **Học viên quay lại (SRS Review):** Đăng nhập $\rightarrow$ Thấy số thẻ đến hạn $\rightarrow$ Lật thẻ 3D $\rightarrow$ Đánh giá 1 trong 4 mức $\rightarrow$ Cập nhật chu kỳ ngắt quãng với `idempotencyKey` $\rightarrow$ Chúc mừng hoàn thành phiên.
3. **Thi thử JLPT N5 có bấm giờ (Timed Mock Exam):** Chọn đề $\rightarrow$ Tạo snapshot $\rightarrow$ Làm bài 3 phần (Từ vựng, Ngữ pháp/Đọc hiểu, Nghe) $\rightarrow$ Tự động lưu mỗi 15s $\rightarrow$ Server tự khóa khi hết giờ $\rightarrow$ Chấm điểm giao dịch $\rightarrow$ Xem bảng phân tích điểm yếu.
4. **Biên tập nội dung CMS (Editorial Lifecycle):** Tạo bản nháp (`DRAFT`) $\rightarrow$ Xem trước thực tế $\rightarrow$ Gửi duyệt (`IN_REVIEW`) $\rightarrow$ Phê duyệt xuất bản (`PUBLISHED`) $\rightarrow$ Ghi nhật ký `audit_logs`.
5. **Nhập dữ liệu hàng loạt bằng CSV (Batch CSV Ingestion):** Tải file CSV $\rightarrow$ Dry-run Zod validate $\rightarrow$ Báo cáo lỗi chi tiết từng dòng $\rightarrow$ Xác nhận nhập nguyên khối (atomic commit).

---

## 4. HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM) & BẢN VẼ WIREFRAME

Tài liệu chi tiết:
- Design System: [`docs/design-system.md`](file:///d:/100.JLPT/00.web_app/docs/design-system.md)
- Wireframes 9 màn hình: [`docs/wireframes.md`](file:///d:/100.JLPT/00.web_app/docs/wireframes.md)

### Tóm tắt các màn hình wireframe đã thiết kế chuẩn cho Di động (375px) & Máy tính (1440px):
1. **Khảo sát ban đầu (`/onboarding`):** Lựa chọn thẻ N5 trực quan, thanh kéo thời gian học mỗi ngày.
2. **Bảng điều khiển (`/dashboard`):** Thẻ tiếp tục học nổi bật, widget thẻ SRS đến hạn, chuỗi ngày học.
3. **Màn hình học bài (`/learn/n5/[slug]`):** Bố cục lý thuyết rõ ràng, ví dụ kèm loa phát âm, nút bật/tắt Furigana.
4. **Ôn tập thẻ nhớ (`/flashcards`):** Thẻ lật 3D, phím tắt (1, 2, 3, 4, Space), 4 màu sắc tương ứng mức độ nhớ.
5. **Sổ tay ngữ pháp (`/grammar`):** Thanh tìm kiếm thông minh, thẻ công thức và lưu ý sắc thái.
6. **Luyện tập câu hỏi (`/practice`):** 4 dạng câu hỏi chuẩn JLPT, ngăn kéo giải thích chi tiết tiếng Việt hiện lên sau khi nộp.
7. **Phòng thi thử N5 (`/mock-exams/[id]`):** Bảng câu hỏi (palette), đồng hồ đếm ngược đồng bộ server, chỉ báo tự động lưu.
8. **Báo cáo kết quả (`/results/[id]`):** Vòng tròn điểm 0–180, nhãn cảnh báo điểm nội bộ, danh sách kỹ năng yếu cần ôn tập lại.
9. **Quản trị CMS (`/admin/content`):** Bảng dữ liệu lọc theo trạng thái duyệt, nút xem trước và xuất bản.

---

## 5. YÊU CẦU PHÊ DUYỆT CỔNG GIAI ĐOẠN 2 (UI APPROVAL GATE)

Theo quy định nghiêm ngặt trong `AGENTS.md` và kỹ năng `ui-ux-designer`:
> *"Present at least one cohesive UI direction with rationale. No production API/database. Stop at UI approval."*

Hệ thống đã dừng lại và không tự ý chuyển sang Giai đoạn 3 (Xây dựng Prototype tương tác bằng mock data).  
Kính mời Quý Quản trị viên xem xét các tài liệu thiết kế:
1. [`docs/sitemap.md`](file:///d:/100.JLPT/00.web_app/docs/sitemap.md)
2. [`docs/user-flows.md`](file:///d:/100.JLPT/00.web_app/docs/user-flows.md)
3. [`docs/design-system.md`](file:///d:/100.JLPT/00.web_app/docs/design-system.md)
4. [`docs/wireframes.md`](file:///d:/100.JLPT/00.web_app/docs/wireframes.md)
5. [`docs/phase-log.md`](file:///d:/100.JLPT/00.web_app/docs/phase-log.md)

**Xin vui lòng gửi phản hồi bằng văn bản để phê duyệt Giai đoạn 2 (UI Gate) nhằm cho phép chuyển sang Giai đoạn 3 (`/prototype-builder`).**
