"use client";

// Last-resort boundary: replaces the root layout, so it renders its own <html>/<body>
// with inline styles only (no dependency on app CSS or fonts).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F7F7F4", color: "#1F2937", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Hệ thống đang gặp sự cố</h1>
          <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 24 }}>
            Vui lòng thử tải lại trang. Nếu lỗi tiếp diễn, hãy quay lại sau ít phút.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#B9343F",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "12px 24px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      </body>
    </html>
  );
}
