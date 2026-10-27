# JLPT Master — Production Deployment & Rollback Runbook
**Document:** `docs/deployment/runbook.md`  
**Phase:** 8 — Deployment & Release (`deployment-release` & `deploy-hostinger`)  
**Target Environment:** Hostinger Node.js Web App + MySQL/MariaDB  

---

## 1. TỔNG QUAN HẠ TẦNG VÀ RÀNG BUỘC HOSTINGER

Hệ thống JLPT Master được tối ưu hóa đặc biệt cho hạ tầng **Hostinger Node.js Web App** với cơ sở dữ liệu **MySQL / MariaDB 12**:
- **Node.js Runtime:** 22.x LTS (Tương thích `engines >= 20.0.0`).
- **Web App Server:** Next.js 16 (App Router + Turbopack).
- **Cơ sở dữ liệu:** MariaDB / MySQL 8.0+ / 12.x hỗ trợ `utf8mb4_unicode_ci` và bảng InnoDB.
- **Giới hạn tài nguyên (Governance):** Cấu hình `connection_limit = 5` trong Prisma connection pool để tránh cạn kiệt tài nguyên máy chủ chia sẻ (shared hosting).

---

## 2. BƯỚC 1: THIẾT LẬP CƠ SỞ DỮ LIỆU TRÊN HPANEL

1. Đăng nhập vào **Hostinger hPanel** $\rightarrow$ **Databases** $\rightarrow$ **MySQL Databases**.
2. Tạo mới Database:
   - **Database Name:** `u774510961_jlptdb`
   - **Username:** `u774510961_jlptusr`
   - **Password:** Mật khẩu mạnh gồm tối thiểu 16 ký tự chữ và số (tránh dùng ký tự đặc biệt như `@`, `#`, `%` để không gây lỗi parse chuỗi kết nối URL).
3. Ghi lại chuỗi kết nối nội bộ:
   ```
   mysql://u774510961_jlptusr:<PASSWORD>@localhost:3306/u774510961_jlptdb
   ```

---

## 3. BƯỚC 2: CẤU HÌNH NODE.JS WEB APP TRÊN HPANEL

Truy cập **hPanel** $\rightarrow$ **Websites** $\rightarrow$ Chọn tên miền $\rightarrow$ **Node.js**:

| Thông số | Giá trị thiết lập | Ghi chú |
| :--- | :--- | :--- |
| **Nguồn (Source)** | GitHub `hainc08/jlptmaster` | Nhánh **`deploy`** |
| **Framework preset** | **Next.js** | Tự động nhận diện cấu trúc dự án |
| **Phiên bản Node** | **22.x** | Bắt buộc phiên bản LTS mới nhất |
| **Thư mục gốc (Root)**| `./` | Thư mục gốc chứa `package.json` |
| **Lệnh Build** | `npm run build` | Biên dịch 25 routes |
| **Lệnh Start** | `npm run start:prod` | Chạy qua `scripts/start-production.mjs` |

### Cấu hình Biến môi trường (Environment Variables):
Thêm các biến sau vào mục **Environment variables**:
```env
DATABASE_URL=mysql://u774510961_jlptusr:<PASSWORD>@localhost:3306/u774510961_jlptdb
SITE_URL=https://jlptmaster.vn
SESSION_SECRET=U2D1kyzbeITq0TIqdw4E13lIgjDUxFMnPO4+FBmOrR143dLM6R2PLbWSbOq/CSd9
TRUST_PROXY=true
DATABASE_POOL_MAX=5
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0
```

> [!WARNING]
> **QUY TẮC BẮT BUỘC:**  
> **KHÔNG ĐƯỢC** thêm biến `NODE_ENV=production` vào bảng cấu hình Environment Variables trên hPanel.  
> Nếu thêm biến này, Hostinger sẽ tự động chạy `npm install --omit=dev`, bỏ qua TypeScript, Prisma CLI và Tailwind, gây lỗi sập quá trình build.

---

## 4. QUY TRÌNH MIGRATION & NẠP DỮ LIỆU BAN ĐẦU (SEEDING)

Script [scripts/start-production.mjs](file:///d:/100.JLPT/00.web_app/scripts/start-production.mjs) được thiết lập làm entrypoint chạy mỗi khi ứng dụng khởi động:
1. Tự động kiểm tra và đồng bộ cấu trúc 22 bảng MariaDB thông qua `npx prisma db push --skip-generate`.
2. Nếu là lần đầu khởi tạo, chạy lệnh nạp dữ liệu chuẩn qua SSH hoặc terminal:
   ```bash
   npx tsx prisma/seed.ts
   ```
   Lệnh này sẽ tạo tài khoản Quản trị viên (`admin@jlptmaster.vn`), cấu trúc 5 cấp độ N5–N1, bài học N5 và ngân hàng câu hỏi ban đầu.

---

## 5. KẾ HOẠCH SAO LƯU & HOÀN TÁC (BACKUP & ROLLBACK PLAN)

### 5.1 Kế hoạch sao lưu trước khi phát hành (Pre-release Backup)
Trước khi merge mã nguồn lên nhánh `deploy` hoặc chạy cập nhật:
1. **Sao lưu CSDL MariaDB:**
   ```bash
   mysqldump -u u774510961_jlptusr -p u774510961_jlptdb > backup_pre_release_$(date +%Y%m%d_%H%M%S).sql
   ```
2. **Ghi nhận Git Tag / Commit Hash ổn định:**
   ```bash
   git tag -a v1.0.0-release -m "Release v1.0.0 N5 MVP Verified"
   git push origin v1.0.0-release
   ```

### 5.2 Kế hoạch hoàn tác khẩn cấp (Emergency Rollback)
Nếu bản phát hành mới gặp sự cố nghiêm trọng (crash loop hoặc lỗi dữ liệu):
1. **Hoàn tác mã nguồn:**
   ```bash
   git switch deploy
   git reset --hard v1.0.0-release
   git push origin deploy --force
   ```
2. **Khôi phục CSDL (nếu có phá vỡ cấu trúc):**
   ```bash
   mysql -u u774510961_jlptusr -p u774510961_jlptdb < backup_pre_release_XXXX.sql
   ```
3. Khởi động lại ứng dụng trên hPanel qua nút **Restart Application**.

---

## 6. KIỂM ĐỊNH SAU TRIỂN KHAI (POST-DEPLOYMENT SMOKE TESTS)

| Thứ tự | Endpoint / Màn hình | Kết quả mong đợi |
| :---: | :--- | :--- |
| 1 | `GET /api/health` | `HTTP 200: {"status":"healthy","database":"connected"}` |
| 2 | `GET /` | Trang chủ hiển thị chuẩn Vermilion, bảng Hiragana tương tác |
| 3 | `GET /vocabulary` | Nạp danh sách từ vựng trực tiếp từ MariaDB |
| 4 | `GET /practice` | Tải câu hỏi từ máy chủ không lộ đáp án đúng |
| 5 | `POST /api/v1/practice/submit` | Nhận kết quả chấm điểm server và giải thích tiếng Việt |
| 6 | `GET /flashcards` | Lật thẻ 3D và chấm điểm SRS hoạt động mượt mà |
| 7 | `GET /admin` | Màn hình quản trị nội dung với 3 trạng thái workflow |

---

## 7. BẢNG XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

| Hiện tượng | Nguyên nhân | Biện pháp xử lý |
| :--- | :--- | :--- |
| **Build thất bại: `Cannot find module 'typescript'`** | Có biến `NODE_ENV=production` | Xóa `NODE_ENV` khỏi hPanel Environment Variables và build lại |
| **Lỗi `P1001: Can't reach database server`** | Sai thông tin `DATABASE_URL` hoặc port | Đảm bảo host là `localhost:3306`, kiểm tra quyền của DB user |
| **Mật khẩu chứa ký tự đặc biệt bị lỗi** | Ký tự `@`, `#` gây lỗi URI parser | Mã hóa URL ký tự (ví dụ: `@` thành `%40`) hoặc đổi mật khẩu chỉ gồm chữ và số |
| **Lỗi 503 Service Unavailable** | Ứng dụng không lắng nghe cổng do Hostinger chỉ định | Kiểm tra `scripts/start-production.mjs` đã bind `0.0.0.0` và `process.env.PORT` |
