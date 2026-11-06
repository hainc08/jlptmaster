import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { FuriganaProvider } from "./components/RubyText";
import { LocaleProvider } from "./components/i18n";
import { AppShell } from "./components/shell/AppShell";

const notoSans = Noto_Sans({
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
      className={`${notoSans.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <LocaleProvider>
          <FuriganaProvider>
            <AppShell>{children}</AppShell>
          </FuriganaProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
