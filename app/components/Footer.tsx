import Link from "next/link";

const LEARN_LINKS = [
  { href: "/learn/n5", label: "Lộ trình N5" },
  { href: "/vocabulary", label: "Từ vựng" },
  { href: "/kanji", label: "Chữ Hán" },
  { href: "/grammar", label: "Ngữ pháp" },
];

const PRACTICE_LINKS = [
  { href: "/practice", label: "Luyện tập" },
  { href: "/flashcards", label: "Thẻ nhớ SRS" },
  { href: "/mock-exams", label: "Thi thử" },
  { href: "/dashboard", label: "Tiến độ" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer role="contentinfo" className="bg-white border-t border-gray-200 mt-8 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div className="space-y-2">
          <p className="text-base font-extrabold text-primary">JLPT Master · ManabiHub</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Học tiếng Nhật chuẩn JLPT, ôn tập ngắt quãng và thi thử bấm giờ với lời giải chi tiết bằng tiếng Việt.
          </p>
        </div>

        <nav aria-label="Học tập" className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Học tập</p>
          <ul className="space-y-1.5">
            {LEARN_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-700 hover:text-primary hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Luyện thi" className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Luyện thi</p>
          <ul className="space-y-1.5">
            {PRACTICE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-700 hover:text-primary hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-gray-100">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-[11px] text-gray-500 leading-relaxed">
          JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục
          Quốc tế Nhật Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản. Điểm số trên hệ thống là điểm quy đổi mô phỏng
          nội bộ (0–180). © {year} ManabiHub.
        </p>
      </div>
    </footer>
  );
}
