import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <p className="text-6xl font-extrabold text-[#B9343F]" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl font-extrabold text-gray-900">Không tìm thấy trang bạn cần</h1>
      <p className="text-sm text-gray-600">
        Đường dẫn có thể đã thay đổi hoặc không tồn tại. Hãy quay lại trang chủ hoặc tiếp tục lộ trình học của bạn.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-sm"
        >
          Về trang chủ
        </Link>
        <Link
          href="/learn/n5"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm"
        >
          Lộ trình học N5
        </Link>
      </div>
    </div>
  );
}
