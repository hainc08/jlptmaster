import type { Metadata } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { FuriganaProvider } from "./components/RubyText";
import { Navbar } from "./components/Navbar";
import { BottomNav } from "./components/BottomNav";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-vietnamese",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-japanese",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JLPT Master — Nền tảng học & luyện thi JLPT N5–N1 thông minh",
  description: "Học tiếng Nhật chuẩn JLPT N5, luyện tập câu hỏi trắc nghiệm, ôn tập ngắt quãng SRS và thi thử bấm giờ với lời giải chi tiết tiếng Việt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F7F4] text-[#1F2937]">
        <FuriganaProvider>
          <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </FuriganaProvider>
      </body>
    </html>
  );
}
