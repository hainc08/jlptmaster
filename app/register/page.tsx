"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || "Đăng ký thất bại. Vui lòng thử lại.");

      try {
        localStorage.setItem("jlpt_auth_role", "student");
        localStorage.setItem("jlpt_auth_email", body.data.user.email);
        localStorage.setItem("jlpt_auth_user_id", body.data.user.id);
      } catch {
        // display-only hints; the signed HttpOnly cookie is what grants access
      }
      router.push("/onboarding");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tạo tài khoản học N5</h1>
          <p className="text-xs text-gray-500">Bắt đầu hành trình chinh phục tiếng Nhật hoàn toàn miễn phí</p>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="register-email" className="text-xs font-bold text-gray-700 block">
              Email:
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="register-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="register-password" className="text-xs font-bold text-gray-700 block">
              Mật khẩu:
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900"
              />
            </div>
            <p className="text-[10px] text-gray-500">Tối thiểu 8 ký tự, gồm cả chữ và số</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              <>
                Đăng ký và bắt đầu học
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold text-[#B9343F] hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
