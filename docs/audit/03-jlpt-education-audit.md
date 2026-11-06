# BÁO CÁO KIỂM TOÁN PHASE 3: CHẤT LƯỢNG GIÁO DỤC TIẾNG NHẬT & ĐỀ THI JLPT (JAPANESE EDUCATION & JLPT CONTENT AUDIT)

- **Dự án**: JLPT ManabiHub (JLPT Master)
- **Môi trường Web thực tế**: `https://jlpt.manabihub.me`
- **Phiên bản mã nguồn**: Git branch `deploy`, Commit `9222b22`
- **Ngày kiểm toán**: 28/10/2026 (Cập nhật đối soát hệ thống 03/11/2026)
- **Tiêu chuẩn kiểm toán**: Khung chuẩn JLPT Japan Foundation & Sư phạm tiếng Nhật cho người Việt
- **Vai trò thực hiện**: Senior Japanese Teacher & JLPT Exam Content Reviewer

---

## 1. TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Đội ngũ kiểm toán sư phạm đã phân tích toàn diện nội dung học tập tiếng Nhật và khảo thí hiện có trong codebase, bao gồm: Bộ bài giảng N5, Sổ tay Từ vựng, Sổ tay Chữ Hán (Kanji), Sổ tay Ngữ pháp, Ngân hàng câu hỏi trắc nghiệm và Đề thi thử mô phỏng JLPT.

### Nhận định chuyên môn:
- **Ưu điểm nổi bật**:
  - Dữ liệu chữ Nhật, phiên âm Furigana, âm Hán Việt và nghĩa tiếng Việt của các mục đã xuất bản (`seed.ts`) đạt độ chính xác học thuật cao, tự nhiên, không có lỗi sai ngữ pháp hay dịch máy thô thiển.
  - Các ví dụ câu được đặt trong ngữ cảnh văn hóa giao tiếp chuẩn Nhật Bản (xưng hô lịch sự, thể `~desu`, `~masu`).
  - Cụm 5 chữ Hán đầu tiên (`先`, `生`, `学`, `日`, `本`) được chọn lọc thông minh, có thể ghép nối trực tiếp thành các từ vựng học cùng bài (`先生` - Sensei, `学生` - Gakusei, `日本` - Nihon).
- **Hạn chế sư phạm nghiêm trọng**:
  1. **Đề thi thử JLPT là vòng lặp nhân bản 5 câu hỏi**: Đề thi thử 35 câu trên Frontend thực chất chỉ gồm 5 câu hỏi gốc lặp lại 7 lần (`q-01` $\rightarrow$ `q-05`).
  2. **Vi phạm quy cách khảo thí JLPT**: Câu hỏi số 3 trong đề thi chèn sẵn nghĩa tiếng Việt vào các phương án lựa chọn (`みず (Nước)`, `ごはん (Cơm)`), làm mất đi tính chất đo lường năng lực thực tế của kỳ thi JLPT.
  3. **Thiếu hoàn toàn phân môn Đọc hiểu (Dokkai) và Nghe hiểu (Choukai)** trong giao diện làm bài thi thử thực tế.
  4. **Bước nhảy kiến thức ngữ pháp bị đứt gãy**: Từ mẫu câu danh từ căn bản (Bài 3) nhảy cóc sang mẫu `V-te kudasai` (thể Te) mà chưa có bài học về cách chia nhóm động từ (Nhóm 1, 2, 3) và quy tắc chuyển sang thể て.

---

## 2. MA TRẬN ĐỘ BAO PHỦ CHƯƠNG TRÌNH HỌC (CURRICULUM COVERAGE — EDU-001)

| Cấp độ | Mục tiêu năng lực | Số bài hiện có trong DB | Số bài đã biên soạn | Nội dung còn thiếu để hoàn thiện MVP | Mức độ sẵn sàng |
| :---: | :--- | :---: | :---: | :--- | :---: |
| **N5** | Đọc Hiragana/Katakana, ~800 từ vựng, ~100 Kanji, ngữ pháp sơ cấp, giao tiếp cơ bản | 3 bài | 5 bài (trong fixtures) | • Thiếu bảng chữ cái Katakana (Chữ cứng).<br>• Thiếu bài chia thể động từ (Masu, Te, Nai, Ta).<br>• Cần bổ sung tối thiểu 22 bài học nữa để đạt chuẩn Minna no Nihongo (Bài 1–25). | **20% (Khởi động MVP)** |
| **N4** | Giao tiếp hội thoại hàng ngày, ~1500 từ vựng, ~300 Kanji | 0 bài | 0 bài | Toàn bộ giáo trình N4 (Đang gắn nhãn Sắp ra mắt). | **0% (Chưa triển khai)** |
| **N3** | Hiểu tiếng Nhật trong các tình huống cụ thể, ~3500 từ vựng, ~650 Kanji | 0 bài | 0 bài | Toàn bộ giáo trình N3. | **0% (Chưa triển khai)** |
| **N2** | Hiểu tiếng Nhật đa chủ đề, đọc báo chí, ~6000 từ vựng, ~1000 Kanji | 0 bài | 0 bài | Toàn bộ giáo trình N2. | **0% (Chưa triển khai)** |
| **N1** | Tiếng Nhật chuyên sâu, văn bản trừu tượng, ~10000 từ vựng, ~2000 Kanji | 0 bài | 0 bài | Toàn bộ giáo trình N1. | **0% (Chưa triển khai)** |

---

## 3. TRÌNH TỰ TIỀN ĐỀ VÀ TÍNH LOGIC SƯ PHẠM (PREREQUISITES — EDU-002)

### Đánh giá lộ trình 5 bài học ban đầu:
1. **Bài 01: Nhập môn Chữ cái Hiragana & Phát âm**:
   - Dạy 46 chữ cái Hiragana, quy tắc biến âm (Tenten/Maru) và âm ghép.
   - *Khiếm khuyết*: Hoàn toàn bỏ quên bảng chữ cái Katakana (dùng cho từ mượn tiếng nước ngoài như `バス` - basu, `デパート` - depaato). Ngay trong câu hỏi thi thử số 5 đã xuất hiện từ `バス`, nhưng học viên chưa từng được học Katakana!
2. **Bài 02: Chào hỏi hàng ngày & Giới thiệu bản thân**:
   - Dạy các câu cửa miệng: `おはようございます`, `こんにちは`, `ありがとうございます`, `はじめまして`.
   - *Đánh giá*: Trình tự hợp lý, tạo phản xạ giao tiếp tức thì.
3. **Bài 03: Khẳng định, Phủ định với Trợ từ は và です**:
   - Dạy `N1 wa N2 desu`, `N1 wa N2 dewa arimasen`, câu hỏi `ka`.
   - *Đánh giá*: Chuẩn cấu trúc bài 1 Minna no Nihongo.
4. **Khoảng trống đứt gãy giữa Bài 3 và Ngữ pháp Thể て (Te)**:
   - Trong bảng `grammar` của MariaDB và fixtures đã nạp sẵn mẫu câu:
     - `V-てください` (Xin hãy làm V)
     - `V-てもいいです` (Được phép làm V)
   - *Vấn đề sư phạm*: Người học mới học đến Bài 3 (chỉ biết danh từ) không thể nào hiểu được tại sao động từ `書く` (kaku) lại biến thành `書いて` (kaite), hay `飲む` (nomu) lại thành `飲んで` (nonde). Cần bắt buộc phải có bài học về **Phân loại 3 nhóm động từ** và **Quy tắc chia thể Te** trước khi dạy hai mẫu câu này.

---

## 4. ĐÁNH GIÁ CHẤT LƯỢNG NGỮ PHÁP (GRAMMAR ACCURACY — EDU-003)

Toàn bộ 5 cấu trúc ngữ pháp hiện có trong MariaDB đều được thẩm định:

| Mã | Mẫu ngữ pháp | Cấu trúc & Nghĩa | Đánh giá độ chính xác sư phạm | Ghi chú & Đề xuất |
| :---: | :--- | :--- | :---: | :--- |
| `G-01` | `N1 は N2 です` | `[N1] + は + [N2] + です`<br>*N1 là N2* | **CHÍNH XÁC** | Giải thích rõ trợ từ `は` đọc là `wa`, phân biệt với chữ `ha`. Ví dụ: `わたしはベトナム人です` chuẩn mực. |
| `G-02` | `N1 は N2 ではありません` | `[N1] + は + [N2] + ではありません`<br>*N1 không phải là N2* | **CHÍNH XÁC** | Phân biệt tốt giữa văn viết trang trọng (`ではありません`) và văn nói thân mật (`じゃありません`). |
| `G-03` | `V-てください` | `Động từ thể て + ください`<br>*Xin hãy làm V...* | **CHÍNH XÁC VỀ CÂU, THIẾU TIỀN ĐỀ** | Câu ví dụ `ここに名前を書いてください` tự nhiên, nhưng thiếu phần hướng dẫn cách chia thể て. |
| `G-04` | `V-てもいいです` | `Động từ thể て + もいいです`<br>*Được phép làm V...* | **CHÍNH XÁC** | Cung cấp đúng ngữ cảnh xin phép: `写真を撮ってもいいですか`. |
| `G-05` | `N (Địa điểm) へ 行きます` | `[Địa điểm] + へ + 行きます`<br>*Đi đến đâu đó* | **CHÍNH XÁC** | Nhắc nhở rõ trợ từ `へ` đọc là `e` chỉ hướng di chuyển, khác với trợ từ `に` chỉ đích đến cụ thể. |

---

## 5. ĐÁNH GIÁ TỪ VỰNG & CHỮ HÁN (VOCABULARY & KANJI QUALITY — EDU-004 & EDU-005)

### 5.1 Chất lượng từ vựng (20 từ N5 trong MariaDB)
- **Độ chính xác mặt chữ & phiên âm**: 100% chính xác.
  - `先生` (せんせい / sensei): Thầy cô giáo, bác sĩ.
  - `学生` (がくせい / gakusei): Học sinh, sinh viên.
  - `食べる` (たべる / taberu): Ăn (Động từ nhóm 2).
  - `飲む` (のむ / nomu): Uống (Động từ nhóm 1).
  - `行く` (いく / iku): Đi (Động từ nhóm 1).
  - `来る` (くる / kuru): Đến (Động từ bất quy tắc nhóm 3).
  - `帰る` (かえる / kaeru): Về (Động từ nhóm 1 đặc biệt - đuôi eru nhưng là nhóm 1).
- **Điểm sáng sư phạm**: Từ `帰る` (kaeru) được phân loại đúng là động từ nhóm 1, đây là một "bẫy" ngữ pháp rất phổ biến của người mới học tiếng Nhật.
- **Điểm cần cải thiện**: Bảng từ vựng hiện tại chưa ghi chú tính chất **Tha động từ (他動詞 - đi với trợ từ を)** hay **Tự động từ (自動詞 - đi với trợ từ が)**.

### 5.2 Chất lượng chữ Hán (5 Kanji trong MariaDB)
- Cả 5 Hán tự đều thuộc nhóm chữ cơ bản nhất của JLPT N5:
  1. **先 (TIÊN)**: 6 nét, On: セン, Kun: さき, まず. Nghĩa: Trước, đi đầu.
  2. **生 (SINH)**: 5 nét, On: セイ, ショウ, Kun: い.きる, う.まれる. Nghĩa: Sống, sinh ra.
  3. **学 (HỌC)**: 8 nét, On: ガク, Kun: まな.ぶ. Nghĩa: Học tập, trường học.
  4. **日 (NHẬT)**: 4 nét, On: ニチ, ジツ, Kun: ひ, -び. Nghĩa: Mặt trời, ngày.
  5. **本 (BẢN)**: 5 nét, On: ホン, Kun: もと. Nghĩa: Gốc, sách.
- **Tính liên kết**: Việc dạy học từ ghép (`先` + `生` = `先生`, `学` + `生` = `学生`, `日` + `本` = `日本`) giúp học viên hiểu bản chất tượng hình và cấu tạo từ của tiếng Nhật cực kỳ hiệu quả.

---

## 6. KIỂM TOÁN CHUẨN KHẢO THÍ ĐỀ THI JLPT (EXAM FIDELITY — EDU-006)

Đội ngũ kiểm toán đã đối soát chi tiết giữa quy chế thi chính thức của Japan Foundation/JEES và hệ thống bài thi trên JLPT ManabiHub:

| Tiêu chí JLPT | Quy chuẩn chính thức JLPT N5 | Hiện trạng trên JLPT ManabiHub | Đánh giá sư phạm |
| :--- | :--- | :--- | :---: |
| **Cấu trúc phân môn** | 1. Kiến thức ngôn ngữ (Từ vựng) - 20 phút<br>2. Ngữ pháp & Đọc hiểu - 40 phút<br>3. Nghe hiểu - 30 phút | Hệ thống ghi đúng 3 phần trên giao diện, nhưng khi làm bài thì 35 câu trộn lẫn trong 1 phòng thi 20 phút. | `SAI LỆCH` |
| **Số lượng câu hỏi** | Khoảng 33–35 câu trắc nghiệm thực tế | Giao diện sinh ra 35 câu hỏi, nhưng thực chất chỉ là **5 câu hỏi lặp lại 7 lần liên tiếp**. | `VI PHẠM NGHIÊM TRỌNG` |
| **Ngôn ngữ phương án** | 100% bằng tiếng Nhật (Hiragana, Katakana, Kanji) | Câu hỏi 3 hiển thị nghĩa tiếng Việt: `みず (Nước)`, `ごはん (Cơm)`. | `VI PHẠM QUY CÁCH THI` |
| **Dạng bài Dấu sao (★)** | Sắp xếp trật tự từ và tìm từ ở vị trí ngôi sao (Mondai 2 Ngữ pháp) | Câu hỏi 5 có format dấu sao chuẩn: `わたしは [ _1_ ] [ _2_ ] [ ★ ] [ _4_ ] 行きます`. | `ĐẠT CHUẨN MÔ PHỎNG` |
| **Bài đọc hiểu (Dokkai)** | Đoạn văn ngắn 150–200 chữ kèm câu hỏi nội dung | Hoàn toàn vắng bóng trong bài thi thử. | `THIẾU SÓT LỚN` |
| **Bài nghe hiểu (Choukai)** | Nghe tranh và nghe hội thoại đối đáp | Hoàn toàn vắng bóng trong bài thi thử. | `THIẾU SÓT LỚN` |
| **Thang điểm & Cách tính** | Thang điểm chuẩn 0–180 điểm; điểm đậu chuẩn 80/180 (kèm điểm liệt từng phần) | Hệ thống gán điểm cứng 142/180 điểm (Pass ước tính) mà không tính toán từ bài làm thực tế. | `MÔ PHỎNG GIẢ ĐỊNH` |

---

## 7. BẢNG TỔNG HỢP KHIẾM KHUYẾT SƯ PHẠM (EDUCATIONAL DEFECT LOG)

| Mã lỗi | Mức độ | Phân loại | Mô tả chi tiết khiếm khuyết |
| :--- | :---: | :--- | :--- |
| `DEF-EDU-01` | **CRITICAL** | Khảo thí | Đề thi thử N5 lặp lại 5 câu hỏi 7 lần để tạo danh sách 35 câu, làm mất giá trị thi thử của học viên. |
| `DEF-EDU-02` | **CRITICAL** | Khảo thí | Phương án trả lời câu trắc nghiệm từ vựng chèn sẵn nghĩa tiếng Việt (`みず (Nước)`), vi phạm quy chuẩn JLPT. |
| `DEF-EDU-03` | **HIGH** | Khảo thí | Đề thi thử thiếu hoàn toàn hai phân môn quan trọng là Đọc hiểu đoạn văn và Nghe hiểu audio. |
| `DEF-EDU-04` | **HIGH** | Giáo trình | Thiếu bài học về bảng chữ cái Katakana (Chữ cứng) trong học phần nhập môn N5. |
| `DEF-EDU-05` | **MEDIUM** | Giáo trình | Bước nhảy kiến thức đứt gãy: Dạy mẫu câu thể て (`V-te kudasai`) trước khi dạy phân loại nhóm động từ. |
| `DEF-EDU-06` | **LOW** | Từ điển | Danh mục từ vựng chưa chú thích Tự động từ / Tha động từ (Jidoushi / Tadoushi). |

---

## 8. KIẾN NGHỊ & ĐỀ XUẤT CỦA CHUYÊN GIA SƯ PHẠM

1. **Biên soạn gấp bộ đề thi thử N5 nguyên bản (Original Mock Exam)**:
   - Cần tối thiểu 1 đề thi N5 hoàn chỉnh gồm đủ 3 phần riêng biệt:
     - Phần 1 (Từ vựng): 15–20 câu (Cách đọc Kanji, Điền từ, Đồng nghĩa).
     - Phần 2 (Ngữ pháp & Đọc hiểu): 15 câu ngữ pháp (Dấu sao, điền trợ từ) + 2 đoạn văn đọc hiểu ngắn có câu hỏi.
     - Phần 3 (Nghe hiểu): 5 câu nghe hiểu ngắn có audio kèm tranh minh họa.
2. **Loại bỏ triệt để tiếng Việt trong các phương án chọn trắc nghiệm**: Tất cả các đáp án ABCD trong phòng thi thử phải 100% bằng tiếng Nhật theo đúng chuẩn bài thi của Japan Foundation.
3. **Bổ sung Bài học Katakana**: Đưa bài học Katakana vào ngay sau Bài 01 Hiragana để đảm bảo học viên có đủ vốn từ đọc các từ vay mượn.

> [!IMPORTANT]
> **GATE STATUS**: Phase 3 đã hoàn tất lập báo cáo. Đề xuất chuyển tiếp sang **PHASE 4 — TECHNICAL & SECURITY AUDIT** (`prompt5.md`) để kiểm toán kiến trúc cơ sở dữ liệu MariaDB, API bảo mật, lỗ hổng OWASP và hiệu năng tải.

