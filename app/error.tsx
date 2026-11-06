"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for diagnostics only; the message is never shown to the user.
    console.error("[app-error]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <div role="alert" className="space-y-3">
        <h1 className="text-2xl font-extrabold text-gray-900">Đã có lỗi xảy ra</h1>
        <p className="text-sm text-gray-600">
          Rất tiếc, hệ thống gặp sự cố khi tải trang này. Bài làm đã được lưu tự động sẽ không bị mất. Bạn hãy thử lại
          hoặc quay về trang chủ.
        </p>
        {error.digest && <p className="text-[11px] text-gray-400">Mã tham chiếu: {error.digest}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-sm cursor-pointer"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-sm"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
