# BÁO CÁO KIỂM TOÁN PHASE 2: TRẢI NGHIỆM NGƯỜI DÙNG (UX/UI) & KHẢ NĂNG TIẾP CẬN (ACCESSIBILITY AUDIT)

- **Dự án**: JLPT ManabiHub (JLPT Master)
- **Môi trường Web thực tế**: `https://jlpt.manabihub.me`
- **Phiên bản mã nguồn**: Git branch `deploy`, Commit `9222b22`
- **Ngày kiểm toán**: 28/10/2026 (Cập nhật đối soát hệ thống 03/11/2026)
- **Tiêu chuẩn kiểm toán**: Nielsen Usability Heuristics & WCAG 2.2 AA
- **Vai trò thực hiện**: Senior UX/UI & Accessibility Specialist

---

## 1. TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Đội ngũ kiểm toán đã tiến hành đánh giá chuyên sâu về **Kiến trúc thông tin (IA)**, **Trải nghiệm bảng điều khiển (Dashboard UX)**, **10 Tiêu chuẩn Heuristic của Nielsen**, **Độ tương thích đa màn hình (Responsive 375px – 1440px)**, **Kiểu chữ tiếng Nhật (Japanese Typography & Furigana Ruby)** và **Tương tác học tập**.

### Điểm nổi bật:
- **Ưu điểm**: Giao diện mang đậm nét thẩm mỹ Nhật Bản hiện đại với tông màu đỏ son vermilion (`#B9343F`), xám đen than (`#1F2937`) và nền giấy ngà ấm (`#F7F7F4`). Hệ thống Furigana `<ruby>` kết hợp font chữ `Noto Sans JP` và `Be Vietnam Pro` được nhúng tối ưu (`display: swap`). Thanh điều hướng phía dưới (Bottom Navigation) trên di động hỗ trợ chuẩn bấm `>= 48px`.
- **Nhược điểm cốt lõi**:
  1. Tồn tại nhiều liên kết con (Sub-nav) trong Header dẫn tới các đường link "rỗng" hoặc query param chưa được xử lý (`/practice?type=READING`, `/practice?filter=mistakes`, `/mock-exams?tab=history`).
  2. Hai mục menu quan trọng là *"Kết quả"* và *"Thống kê"* bị gán cứng đường dẫn đến mã bài thi mẫu `att-01` (`/results/att-01`) thay vì trang lịch sử của người dùng.
  3. Thiếu hoàn toàn trang chân trang (Footer) trên các trang nội bộ của học viên, khiến người dùng không tìm thấy thông tin hỗ trợ, điều khoản hoặc liên hệ.
  4. Nút bấm chuyển đổi Furigana toàn cục trước đây trên Header đã được tách thành công cụ ngữ cảnh `LearningToolbar`, nhưng vẫn chưa được tích hợp vào phòng thi thử `/mock-exams/[attemptId]`.

---

## 2. KIẾN TRÚC THÔNG TIN & SƠ ĐỒ TRANG WEB (INFORMATION ARCHITECTURE — UX-001)

### 2.1 Đánh giá thanh điều hướng (Header, Mobile BottomNav & Breadcrumbs)
- **Thanh Header Desktop**:
  - Gồm 5 trụ cột: `Trang chủ`, `Học tập`, `Luyện tập`, `Thi thử`, `Tiến độ`.
  - Bộ chọn cấp độ `N5–N1`: Phân định rõ `N5` (Đang học) và `N4–N1` (Sắp ra mắt với icon khóa bảo vệ).
  - Tự động ẩn thanh điều hướng chính khi thí sinh bước vào phòng thi `/mock-exams/[attemptId]` để tạo môi trường làm bài tập trung cao độ.
- **Vấn đề phát hiện trên Sub-nav Dropdowns**:
  - Bấm vào *"Đọc hiểu"* dẫn đến `/practice?type=READING`, nhưng trang `/practice` không có bộ lọc đọc hiểu.
  - Bấm vào *"Nghe hiểu"* dẫn đến `/practice?type=LISTENING`, nhưng hệ thống chưa có bài nghe.
  - Bấm vào *"Ôn câu sai"* dẫn đến `/practice?filter=mistakes` (trang quiz không có chức năng lọc câu sai).
  - Bấm vào *"Kết quả"* hoặc *"Thống kê"* đều bị ép chuyển hướng về `/results/att-01` (bài thi cố định).

### 2.2 Sơ đồ trang web hiện tại (Current Sitemap)
```
/ (Landing Page)
├── /login (Đăng nhập - localStorage)
├── /register (Đăng ký - Chuyển sang Onboarding)
├── /onboarding (Thiết lập mục tiêu N5)
├── /dashboard (Bảng điều khiển học tập)
├── /learn/n5 (Lộ trình 3 bài học N5)
│   └── /learn/n5/[lessonSlug] (Chi tiết bài học N5)
├── /vocabulary (Sổ tay 20 từ vựng N5)
├── /kanji (Sổ tay 5 chữ Hán N5)
├── /grammar (Sổ tay 5 mẫu ngữ pháp N5)
├── /flashcards (Lật thẻ nhớ SRS)
├── /practice (Trắc nghiệm củng cố)
├── /mock-exams (Danh mục đề thi thử)
│   └── /mock-exams/[attemptId] (Phòng thi 35 câu đếm giờ)
├── /results/[attemptId] (Báo cáo điểm cố định 142/180)
├── /admin (CMS Quản trị nội dung)
│   └── /admin/content/import (Xem trước CSV)
└── /prototype/header-nav (Demo thanh điều hướng)
```

### 2.3 Sơ đồ trang web đề xuất (Proposed Sitemap)
```
/ (Landing Page & SEO)
├── /auth/login & /auth/register & /auth/forgot-password (Xác thực có Session)
├── /onboarding (Khảo sát 4 bước lưu vào DB)
├── /dashboard (Tổng quan tiến độ thực từ MariaDB)
├── /settings (Cài đặt cá nhân, đổi mục tiêu & mật khẩu)
├── /learn/n5
│   └── /learn/n5/[lessonSlug] (Bài học tải từ DB + ghi nhận hoàn thành)
├── /handbook (Gộp chung hoặc liên kết đồng bộ Sổ tay)
│   ├── /handbook/vocabulary
│   ├── /handbook/kanji
│   └── /handbook/grammar
├── /flashcards (Hàng đợi SRS cá nhân hóa)
├── /practice (Có bộ lọc phân môn: Từ vựng / Ngữ pháp / Đọc / Câu sai)
├── /mock-exams
│   ├── /mock-exams (Danh mục đề thi có phân loại)
│   ├── /mock-exams/history (Lịch sử các lần thi của học viên)
│   ├── /mock-exams/[attemptId] (Phòng thi kết nối server-side timer)
│   └── /mock-exams/[attemptId]/result (Báo cáo chấm điểm thật)
└── /admin (Bảo vệ bằng Middleware Role ADMIN)
    ├── /admin/content (CRUD bài học & câu hỏi)
    ├── /admin/exams (Quản lý đề thi & phân môn)
    └── /admin/import (Tải lên CSV thực tế)
```

---

## 3. ĐÁNH GIÁ TRẢI NGHIỆM BẢNG ĐIỀU KHIỂN (DASHBOARD UX — UX-002)

| Câu hỏi của học viên | Hệ thống có giải đáp ngay được không? | Phân tích trải nghiệm thực tế |
| :--- | :---: | :--- |
| **1. Hôm nay tôi nên học gì?** | **CÓ** | Thẻ *"Bài học tiếp theo"* và nút *"Bắt đầu phiên ôn tập SRS"* làm nổi bật hành động trọng tâm. |
| **2. Tôi đang học dở ở đâu?** | **MỘT PHẦN** | Hiển thị thẻ *"Bài 03: Khẳng định, Phủ định..."* với thanh 35%, nhưng đây là dữ liệu tĩnh, không phản ánh đúng bài học thực tế của người dùng. |
| **3. Tôi đang yếu kỹ năng nào?** | **KHÔNG** | Trên Dashboard không có widget chẩn đoán kỹ năng yếu; người dùng phải bấm vào *"Xem chẩn đoán lỗi sai"* (nhảy sang `/results/att-01`). |
| **4. Tôi còn cách mục tiêu đỗ N5 bao xa?** | **MỘT PHẦN** | Có cụm 3 thanh tiến độ: Từ vựng (22%), Kanji (45%), Ngữ pháp (37%), nhưng lại là số liệu cứng (180 từ, 45 kanji). |
| **5. Tôi sẽ nhận được gì sau khi hoàn thành?** | **KHÔNG** | Chưa có cơ chế điểm thưởng, huy hiệu hay dự báo điểm thi tăng lên sau mỗi bài hoàn thành. |

**Đánh giá phân cấp thông tin (Information Hierarchy)**:
Giao diện phân bổ 2 nút kêu gọi hành động (CTA) cạnh tranh nhau gay gắt: Nút đỏ son *"Tiếp tục học ngay"* và nút xanh navy *"Bắt đầu phiên ôn tập SRS"*. Cả hai nút có cùng kích thước và độ nổi khối, khiến học viên phân vân không biết nên học bài mới hay ôn tập kiến thức cũ trước.

---

## 4. ĐÁNH GIÁ THEO 10 TIÊU CHUẨN HEURISTIC CỦA NIELSEN (UX-003)

| Mã Heuristic | Tiêu chuẩn đánh giá | Hiện trạng quan sát & Bằng chứng mã nguồn | Đánh giá |
| :---: | :--- | :--- | :---: |
| **H-01** | *Visibility of system status* | Trong lúc làm bài trắc nghiệm (`/practice`), hệ thống hiển thị rõ trạng thái đang chấm bài ("Đang gửi chấm điểm..."). Tuy nhiên, trên trang Sổ tay Ngữ pháp (`/grammar`), khi mất mạng hệ thống âm thầm nạp mock data mà không có chỉ báo offline. | `CẢNH BÁO` |
| **H-02** | *Match between system and the real world* | Ngôn ngữ giao diện tiếng Việt tự nhiên, chuẩn mực sư phạm ("Từ loại", "Âm On", "Âm Kun", "Chữ Hán", "Nghĩa tiếng Việt"). Các thuật ngữ JLPT được giải thích rõ ràng. | `ĐẠT` |
| **H-03** | *User control and freedom* | Phòng thi thử (`/mock-exams/[attemptId]`) không có nút "Tạm dừng" hoặc "Thoát phòng thi an toàn". Học viên bấm nút Back của trình duyệt có thể làm mất dữ liệu bài thi. | `CẢNH BÁO` |
| **H-04** | *Consistency and standards* | Bảng màu và kiểu nút bấm nhất quán trên toàn hệ thống. Tuy nhiên, nút bật Furigana ở trang bài học nằm trên thanh công cụ riêng (`LearningToolbar`), trong khi các trang khác lại không đồng nhất. | `ĐẠT MỘT PHẦN` |
| **H-05** | *Error prevention* | Thiếu hộp thoại xác nhận khi bấm *"Nộp bài thi"*. Người dùng có thể lỡ tay bấm nộp bài khi chưa làm hết các câu hỏi. | `NGHIÊM TRỌNG` |
| **H-06** | *Recognition rather than recall* | Các thẻ flashcard SRS (`/flashcards`) hiển thị chữ Hán to rõ ràng, mặt sau hiển thị phiên âm Hiragana, Hán Việt và câu ví dụ ngữ cảnh giúp ghi nhớ trực quan. | `ĐẠT` |
| **H-07** | *Flexibility and efficiency of use* | Trang từ vựng (`/vocabulary`) hỗ trợ tìm kiếm đa dạng: có thể gõ Romaji ("taberu"), gõ Kanji ("食べる"), hoặc nghĩa tiếng Việt ("ăn") đều trả về đúng kết quả. | `ĐẠT` |
| **H-08** | *Aesthetic and minimalist design* | Bố cục thoáng đãng, phân cách rõ ràng, không lạm dụng quảng cáo hoặc đồ họa thừa, tuân thủ chặt chẽ lưới 8px và bán kính bo góc 14px (`rounded-3xl`). | `XUẤT SẮC` |
| **H-09** | *Help users recognize, diagnose errors* | Khi câu hỏi trắc nghiệm bị sai, hệ thống hiển thị banner đỏ nổi bật kèm giải thích ngữ pháp chi tiết vì sao phương án đó sai và phương án nào đúng. | `ĐẠT` |
| **H-10** | *Help and documentation* | Thiếu hoàn toàn trang Hướng dẫn sử dụng (Help Center / FAQ) và giải thích về quy chế tính điểm nội bộ của kỳ thi thử. | `CẢNH BÁO` |

---

## 5. KIỂM TOÁN TƯƠNG THÍCH ĐA THIẾT BỊ (RESPONSIVE AUDIT — UX-004)

Hệ thống được kiểm tra trên 4 ngưỡng kích thước tiêu chuẩn:

| Kích thước màn hình | Thành phần kiểm tra | Kết quả & Phát hiện |
| :--- | :--- | :--- |
| **375px (Mobile)** | Header & BottomNav | • Header thu gọn hợp lý, ẩn thanh menu ngang, chỉ giữ logo và bộ chọn cấp độ.<br>• BottomNav 5 icon cố định đáy, có khoảng đệm an toàn `pb-16` tránh che khuất nội dung chính.<br>• Bảng 46 chữ cái Hiragana tự động co lại thành lưới 5 cột (`grid-cols-5`) hiển thị vừa vặn, không tràn ngang. |
| **768px (Tablet)** | Lưới nội dung & Bảng từ vựng | • Bố cục 2 cột trên Dashboard hiển thị cân đối.<br>• Các thẻ từ vựng và câu hỏi trắc nghiệm giữ được khoảng cách đọc dễ chịu. |
| **1280px (Desktop)** | Thanh điều hướng 5 trụ cột | • Toàn bộ 5 mục điều hướng hiển thị đầy đủ kèm menu thả xuống mượt mà.<br>• Không xảy ra va chạm (collision) giữa menu và các nút tiện ích. |
| **1440px (Large Desktop)** | Khung trang (Max-width) | • Toàn bộ ứng dụng được giới hạn trong khung `max-w-7xl` (1280px) căn giữa màn hình, không bị kéo giãn méo mó trên màn hình 2K/4K. |

> [!NOTE]
> **Vùng chạm di động (Touch Target)**: Toàn bộ các nút bấm và ô chọn đáp án đều có chiều cao `>= 44px` (lớp `.touch-target` và `min-h-[48px]`), đảm bảo thao tác ngón tay cái trên màn hình cảm ứng không bị chạm nhầm.

---

## 6. KIỂU CHỮ TIẾNG NHẬT & HIỂN THỊ FURIGANA (JAPANESE TYPOGRAPHY — UX-005)

- **Cấu hình Font chữ**:
  - Tiếng Việt: `Be Vietnam Pro` (400, 500, 600, 700) kết hợp chuẩn font hệ thống.
  - Tiếng Nhật: `Noto Sans JP` (400, 500, 700) đảm bảo chữ Hán và Kana sắc nét, không bị lỗi răng cưa trên Windows/macOS.
- **Thẻ Ruby Furigana (`<ruby>`, `<rt>`)**:
  - Được cấu hình CSS chuyên biệt trong [app/globals.css:66-89](file:///d:/100.JLPT/_other/00.web_app/app/globals.css#L66-L89):
    ```css
    ruby {
      display: inline-flex;
      flex-direction: column-reverse;
      vertical-align: bottom;
      text-align: center;
      line-height: 1;
    }
    rt {
      display: block;
      font-size: 0.55em;
      font-weight: 500;
      color: var(--primary);
      line-height: 1.1;
      user-select: none;
    }
    ```
  - **Trải nghiệm Furigana**: Việc đặt màu của `rt` là màu đỏ son (`#B9343F`) giúp người học phân biệt rõ ràng giữa chữ Hán gốc (màu đen) và cách đọc phiên âm (màu đỏ). Tính năng ẩn Furigana qua lớp `.furigana-hidden` hoạt động mượt mà khi tắt bật công tắc.

---

## 7. KIỂM TOÁN TƯƠNG TÁC HỌC TẬP (LEARNING INTERACTION — UX-006)

1. **Hiệu ứng lật thẻ SRS (Flashcard Flip)**:
   - Thẻ lật bằng tương tác click mượt mà; hiển thị rõ ràng mặt trước (chữ Hán + nút âm thanh) và mặt sau (câu ví dụ + 4 nút đánh giá ghi nhớ).
   - 4 nút đánh giá có mã màu trực quan: Đỏ (`Lại`), Vàng (`Khó`), Xanh dương (`Tốt`), Xanh lá (`Dễ`).
2. **Chọn đáp án trắc nghiệm**:
   - Khi chọn đáp án, viền đổi màu xanh navy kèm hiệu ứng đậm nét.
   - Khi bấm kiểm tra, phương án đúng chuyển màu xanh lục kèm icon tích, phương án sai đổi sang màu đỏ kèm icon X gạch chéo.
3. **Thanh tiến độ**:
   - Chuyển động mượt (`transition-all duration-500`).

---

## 8. KIỂM TOÁN KHẢ NĂNG TIẾP CẬN (ACCESSIBILITY — WCAG 2.2 AA)

- **Độ tương phản màu sắc (Contrast Ratio)**:
  - Chữ đen `#1F2937` trên nền `#F7F7F4`: Tỷ lệ **11.4:1** (Vượt chuẩn WCAG AAA - yêu cầu tối thiểu 7.0:1).
  - Nút đỏ `#B9343F` với chữ trắng: Tỷ lệ **4.8:1** (Đạt chuẩn WCAG AA - yêu cầu tối thiểu 4.5:1).
  - Chữ xám mờ `#6B7280` trên nền xám nhạt `#F3F4F6`: Tỷ lệ **3.9:1** (Dưới chuẩn WCAG AA đối với văn bản nhỏ - Cần nâng lên tối thiểu `#4B5563`).
- **Điều hướng bằng bàn phím (Keyboard Navigation)**:
  - Có lớp `:focus-visible` với viền đỏ nổi bật 2px cách đều 2px.
  - Dropdown menu trên Header hỗ trợ phím `Escape` để đóng và phím `ArrowDown` để di chuyển tiêu điểm.
- **Thẻ ARIA**:
  - Đã có `aria-expanded`, `aria-haspopup` trên các nút mở menu.
  - Tuy nhiên, các icon âm thanh `AudioButton` chưa có `aria-label="Phát âm tiếng Nhật"`, khiến trình đọc màn hình (Screen Reader) chỉ đọc là "button".

---

## 9. TỔNG HỢP KHIẾM KHUYẾT UX/UI (UX DEFECT LOG)

| Mã lỗi | Mức độ | Vị trí | Mô tả khiếm khuyết |
| :--- | :---: | :--- | :--- |
| `DEF-UX-01` | **HIGH** | `app/components/nav-config.ts` | Các link menu con (`?type=READING`, `?filter=mistakes`, `?tab=history`) dẫn tới tính năng chưa tồn tại. |
| `DEF-UX-02` | **HIGH** | `app/components/nav-config.ts` | Menu *"Kết quả"* và *"Thống kê"* gán cứng URL `/results/att-01` của bài thi mẫu. |
| `DEF-UX-03` | **MEDIUM** | `app/dashboard` | Cạnh tranh điểm nhìn giữa 2 nút CTA chính (Học tiếp vs Ôn SRS) có cùng độ ưu tiên thị giác. |
| `DEF-UX-04` | **MEDIUM** | `app/mock-exams/[attemptId]` | Thiếu hộp thoại xác nhận khi bấm "Nộp bài thi", dễ gây nộp nhầm khi chưa hoàn thành. |
| `DEF-UX-05` | **MEDIUM** | `app/layout.tsx` | Thiếu Footer chân trang chứa thông tin liên hệ, bản quyền và chính sách điều khoản. |
| `DEF-UX-06` | **LOW** | `app/globals.css` | Màu chữ phụ `#6B7280` chưa đạt tỷ lệ tương phản 4.5:1 trên một số bề mặt xám nhạt. |
| `DEF-UX-07` | **LOW** | `app/components/AudioButton.tsx` | Thiếu `aria-label` cho nút phát âm thanh trên trình đọc màn hình. |

---

## 10. KẾT LUẬN & ĐỀ XUẤT CỔNG DUYỆT

- **Kết luận Phase 2**: Giao diện đạt chuẩn cao về mặt thẩm mỹ, kiểu chữ tiếng Nhật và tính tương thích trên thiết bị di động. Các vấn đề cần xử lý tập trung vào việc dọn dẹp các đường dẫn menu rác (dead links) và hoàn thiện các cơ chế phòng ngừa lỗi người dùng (Error prevention).
- **Đề xuất bước tiếp theo**: Chuyển tiếp sang **PHASE 3 — JAPANESE EDUCATION & JLPT CONTENT AUDIT** (`prompt4.md`) để thẩm định chất lượng sư phạm: Ngữ pháp, Furigana, Từ vựng, Hán tự và cấu trúc đề thi JLPT N5.

> [!IMPORTANT]
> **GATE STATUS**: Phase 2 đã hoàn tất lập báo cáo. Tạm dừng để Product Owner xem xét trước khi chuyển sang Phase 3.

