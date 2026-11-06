# BÁO CÁO KIỂM TOÁN PHASE 4: KIẾN TRÚC KỸ THUẬT & AN TOÀN BẢO MẬT (TECHNICAL & SECURITY AUDIT)

- **Dự án**: JLPT ManabiHub (JLPT Master)
- **Môi trường Web thực tế**: `https://jlpt.manabihub.me`
- **Phiên bản mã nguồn**: Git branch `deploy`, Commit `9222b22`
- **Ngày kiểm toán**: 28/10/2026 (Cập nhật đối soát hệ thống 03/11/2026)
- **Tiêu chuẩn kiểm toán**: OWASP Top 10:2021 & Kiến trúc CSDL MariaDB ACID
- **Vai trò thực hiện**: Senior Software Architect & Application Security Reviewer

---

## 1. TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Đội ngũ kiểm toán kỹ thuật và bảo mật đã tiến hành thanh tra toàn diện cấu trúc mã nguồn Next.js 16.4.3 (App Router), tầng ORM Prisma Client 6.19.3, hệ quản trị cơ sở dữ liệu MariaDB 10.11 InnoDB, 23 API Route Handlers và các bài kiểm thử bảo mật tự động.

### Đánh giá chung:
- **Điểm mạnh cốt lõi**:
  - Mô hình dữ liệu MariaDB được thiết kế rất chuẩn mực: Sử dụng triệt để khóa ngoại `onDelete: Restrict` trên bảng kết quả thi (`exam_attempts`, `attempt_answers`), ngăn chặn triệt để nguy cơ xóa nhầm lịch sử thi cử của học viên.
  - Các chỉ mục (Indexes) trên các trường lọc tần suất cao (`user_id`, `due_at`, `search_normalized`, `level_id, kind, status`) được đánh đầy đủ.
  - Bộ máy chấm thi (`exam-service.ts`) tuân thủ tính bất biến (Immutable snapshot), bảo mật đáp án (`stripAnswerKeysFromExam`) và chấm điểm nguyên tử trong một Transaction.
- **Lỗ hổng bảo mật cấp bách (Critical Vulnerabilities)**:
  1. **Leo quyền kiểm duyệt nội dung qua Request Body (Privilege Escalation)**: API `/api/v1/admin/content/:id/publish` nhận trường `role` trực tiếp từ client body (`rawBody.role`). Bất kỳ ai gửi `{ "role": "ADMIN" }` đều có thể duyệt hoặc lưu trữ bất kỳ bài viết nào.
  2. **Bỏ qua kiểm tra IDOR khi thiếu `userId`**: Trong các API lượt thi (`/attempts/:id`, `/attempts/:id/finish`, `/attempts/:id/answers`), việc kiểm tra quyền sở hữu được viết dạng `if (userId) { assertUserOwnership(...) }`. Nếu client **không truyền tham số `userId`**, máy chủ sẽ bỏ qua hoàn toàn bước kiểm tra quyền sở hữu!
  3. **Thiếu cơ chế phiên làm việc có chữ ký mật mã (No Cryptographic Session/JWT)**: Không sử dụng HttpOnly Secure Cookie hay Auth.js session token thật; frontend quản lý đăng nhập bằng `localStorage` nên các API cá nhân không thể xác minh danh tính người gọi một cách an toàn.

---

## 2. KIỂM TOÁN LỖ HỔNG BẢO MẬT (OWASP TOP 10 AUDIT)

| Mã OWASP | Phân loại rủi ro | Hiện trạng trong codebase | Mức độ rủi ro | Trạng thái xác minh |
| :---: | :--- | :--- | :---: | :---: |
| **A01:2021** | *Broken Access Control (Kiểm soát truy cập bị phá vỡ)* | • Lỗ hổng IDOR trên API lượt thi: Bỏ qua kiểm tra khi thiếu `userId`.<br>• Lỗ hổng leo quyền trên API xuất bản: Tin cậy trường `role` do client gửi.<br>• Thiếu `middleware.ts` bảo vệ route `/admin` và `/dashboard`. | **CRITICAL** | `VERIFIED` |
| **A02:2021** | *Cryptographic Failures (Lỗi mã hóa & bảo mật dữ liệu)* | Mật khẩu mẫu trong DB sử dụng hàm băm Argon2id (`$argon2id$v=19$...`). Tuy nhiên, secret `AUTH_SECRET` và `SESSION_SECRET` trong file cấu hình mẫu dùng chung giá trị mặc định. | **HIGH** | `VERIFIED` |
| **A03:2021** | *Injection (Lỗ hổng tiêm mã SQLi / XSS)* | • SQL Injection: **AN TOÀN**. 100% truy vấn dữ liệu được thực thi thông qua Prisma ORM với tham số hóa (Parameterized queries).<br>• XSS: Cần lưu ý khi hiển thị HTML bài học phong phú. | **LOW** | `VERIFIED` |
| **A04:2021** | *Insecure Design (Thiết kế không an toàn)* | Toàn bộ cơ chế xác thực người dùng đang đặt niềm tin vào client `localStorage` thay vì thiết kế kiến trúc Server-side Session chuẩn mực. | **HIGH** | `VERIFIED` |
| **A05:2021** | *Security Misconfiguration (Cấu hình bảo mật sai)* | File `.env.example` và `docker-compose.yml` mở cổng `3306:3306` ra ngoài host mà không giới hạn IP nội bộ. | **MEDIUM** | `VERIFIED` |
| **A06:2021** | *Vulnerable and Outdated Components* | Các thư viện Next.js 16.4.3, React 19.3.0, Prisma 6.19.3, Vitest 3.2.7 đều là các bản cập nhật mới nhất, không ghi nhận CVE đã công bố. | **LOW** | `VERIFIED` |
| **A07:2021** | *Identification and Authentication Failures* | Không có rate limit trên các route `/login`, `/register`; không có xác thực hai lớp (2FA) cho tài khoản ADMIN. | **HIGH** | `VERIFIED` |
| **A08:2021** | *Software and Data Integrity Failures* | Quá trình seed dữ liệu và cập nhật schema diễn ra trực tiếp qua `prisma db push` trên script khởi động mà không qua quản lý migration file có phiên bản (`prisma/migrations`). | **MEDIUM** | `VERIFIED` |
| **A09:2021** | *Security Logging and Monitoring Failures* | Đã có bảng `audit_logs` trong DB để ghi nhận thao tác của Admin. Tuy nhiên, các sự kiện đăng nhập thất bại hoặc truy cập bất hợp pháp chưa được ghi log tập trung. | **LOW** | `VERIFIED` |
| **A10:2021** | *Server-Side Request Forgery (SSRF)* | Ứng dụng hiện tại không thực hiện gọi HTTP ra ngoài (outgoing fetch) dựa trên URL do người dùng cung cấp. | **NONE** | `VERIFIED` |

---

## 3. BẰNG CHỨNG MÃ NGUỒN CÁC LỖ HỔNG NGHIÊM TRỌNG (VULNERABILITY EVIDENCE)

### Bằng chứng 1: Leo quyền quản trị viên (Privilege Escalation)
- **Tệp**: [app/api/v1/admin/content/[id]/publish/route.ts:6-29](file:///d:/100.JLPT/_other/00.web_app/app/api/v1/admin/content/%5Bid%5D/publish/route.ts#L6-L29)
- **Đoạn mã gây lỗi**:
  ```typescript
  const PublishSchema = z.object({
    actorId: z.string().optional(),
    role: z.string().default("STUDENT"),
    status: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
  });
  ...
  const { actorId, role, status } = parsed.data;
  assertAdminRole(role); // <-- Kiểm tra role lấy trực tiếp từ JSON body của Client!
  ```
- **Kịch bản khai thác**: Kẻ tấn công dùng curl hoặc Postman gửi `POST /api/v1/admin/content/cnt-01/publish` kèm body `{"role": "ADMIN"}`. Máy chủ kiểm tra `assertAdminRole("ADMIN")` $\rightarrow$ Pass $\rightarrow$ Cho phép thay đổi trạng thái bài viết sang `PUBLISHED` hoặc `ARCHIVED`.

### Bằng chứng 2: Lỗ hổng IDOR trên API bài thi
- **Tệp**: [app/api/v1/attempts/[id]/route.ts:16-36](file:///d:/100.JLPT/_other/00.web_app/app/api/v1/attempts/%5Bid%5D/route.ts#L16-L36)
- **Đoạn mã gây lỗi**:
  ```typescript
  const { id: attemptId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    ...
  });

  if (userId) { // <-- Nếu không truyền ?userId= trên URL thì hoàn toàn KHÔNG KIỂM TRA QUYỀN!
    assertUserOwnership(userId, attempt.userId);
  }
  ```
- **Kịch bản khai thác**: Học viên A gửi request `GET /api/v1/attempts/att-của-học-viên-B` (không kèm param `userId`). Máy chủ bỏ qua lệnh `assertUserOwnership` và trả về toàn bộ bài thi cùng đáp án đã lưu của học viên B.

---

## 4. KIỂM TOÁN CƠ SỞ DỮ LIỆU MARIADB & TÍNH TOÀN VẸN ACID

### 4.1 Bộ ký tự & Bảng mã (Character Set & Collation)
- Docker Compose và Hostinger sử dụng `utf8mb4` cùng collation `utf8mb4_unicode_ci`.
- **Thử nghiệm thực tế**:
  - Hán tự phức tạp và tên riêng tiếng Nhật (vd: `髙`, `﨑`, `醬`) được lưu trữ nguyên vẹn, không bị lỗi byte.
  - Tiếng Việt đầy đủ dấu thanh (`ề`, `ễ`, `ở`, `ứ`) được tìm kiếm chính xác qua cột `search_normalized`.

### 4.2 Tính toàn vẹn dữ liệu & Ràng buộc khóa ngoại
- **Bảo vệ kết quả thi**:
  - Khi xóa bảng `exams`, bảng `exam_attempts` có khóa ngoại `onDelete: Restrict` $\rightarrow$ Hệ thống từ chối xóa đề thi nếu đã có học viên từng làm bài thi đó.
  - Khi xóa câu hỏi trong `questions`, `attempt_answers` có khóa ngoại `onDelete: Restrict` $\rightarrow$ Đảm bảo không bao giờ bị mất bài làm lịch sử của thí sinh.
- **Tính lũy kế (Idempotency)**:
  - Bảng `review_logs` có ràng buộc duy nhất trên `(review_card_id, idempotency_key)` $\rightarrow$ Chống bấm đúp (double-click) hoặc mạng lag gửi trùng request gây tăng sai chu kỳ nhớ của thẻ SRS.
  - Bảng `lesson_progress` có ràng buộc duy nhất trên `(user_id, lesson_id)` $\rightarrow$ Lệnh upsert đảm bảo hoàn thành bài học nhiều lần không tạo bản ghi rác.

### 4.3 Quản lý Schema & Migration
- Hiện tại dự án **không sử dụng thư mục `prisma/migrations`**, mà đang chạy lệnh `prisma db push` trong `scripts/setup-db.mjs` và `scripts/start-production.mjs`.
- *Rủi ro*: Trên môi trường Production thực tế, lệnh `prisma db push` tiềm ẩn nguy cơ làm mất dữ liệu nếu schema thay đổi kiểu dữ liệu cột hoặc xóa bảng mà không có script chuyển đổi dữ liệu (data migration).

---

## 5. TỔNG HỢP KHIẾM KHUYẾT KỸ THUẬT & BẢO MẬT (SECURITY DEFECT LOG)

| Mã lỗi | Mức độ | Phân loại | Mô tả chi tiết khiếm khuyết |
| :--- | :---: | :--- | :--- |
| `DEF-SEC-01` | **CRITICAL** | Access Control | Lỗ hổng leo quyền quản trị viên: API `/admin/content/:id/publish` nhận `role` từ client body. |
| `DEF-SEC-02` | **CRITICAL** | Authorization | Lỗ hổng IDOR: Các API bài thi (`/attempts/:id/*`) bỏ qua kiểm tra quyền sở hữu khi thiếu param `userId`. |
| `DEF-SEC-03` | **CRITICAL** | Authentication | Thiếu cơ chế Server Session / JWT có ký số; frontend xác thực bằng `localStorage`. |
| `DEF-SEC-04` | **HIGH** | Routing Security | Thiếu file `middleware.ts` chặn truy cập trái phép vào các trang nội bộ `/admin`, `/dashboard`. |
| `DEF-SEC-05` | **MEDIUM** | DevOps / DB | Vận hành sản xuất bằng `prisma db push` thay vì cơ chế migration phiên bản `prisma migrate deploy`. |
| `DEF-SEC-06` | **LOW** | Security Logging | Chưa có ghi nhận Audit Log cho các nỗ lực truy cập trái phép hoặc đăng nhập thất bại. |

---

## 6. KẾT LUẬN & ĐỀ XUẤT CỔNG DUYỆT

- **Kết luận Phase 4**: Mô hình cơ sở dữ liệu MariaDB của dự án được xây dựng rất chuẩn chỉ và an toàn. Tuy nhiên, tầng xác thực và phân quyền API tồn tại các kẽ hở nghiêm trọng do kiến trúc chuyển đổi giữa giai đoạn Prototype và Production chưa hoàn tất (vẫn dựa vào `userId` và `role` truyền tự do từ client).
- **Đề xuất bước tiếp theo**: Chuyển tiếp sang **PHASE 5 — QA, TEST COVERAGE & PERFORMANCE AUDIT** (`prompt6.md`) để rà soát toàn bộ 14 test suites, phân tích độ bao phủ kiểm thử và đánh giá hiệu năng hệ thống.

> [!IMPORTANT]
> **GATE STATUS**: Phase 4 đã hoàn tất lập báo cáo. Tạm dừng để Product Owner xem xét trước khi chuyển sang Phase 5.

