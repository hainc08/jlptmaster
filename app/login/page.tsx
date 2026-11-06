"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { postLoginTarget } from "../components/nav-config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message || "Đăng nhập thất bại");
      }

      const user = body.data.user;
      // ADMIN/OWNER get the admin quick-links; SUPPORT/EDITOR use the new console and are sent straight there.
      const isAdmin = user.role === "ADMIN" || user.role === "OWNER";

      if (typeof window !== "undefined") {
        localStorage.setItem("jlpt_auth_role", isAdmin ? "admin" : "student");
        localStorage.setItem("jlpt_auth_email", user.email);
        localStorage.setItem("jlpt_auth_user_id", user.id);
      }

      router.push(postLoginTarget(user.role, new URLSearchParams(window.location.search).get("redirect")));
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Chào mừng trở lại!
          </h1>
          <p className="text-xs text-gray-500">
            Đăng nhập để tiếp tục lộ trình học và chuỗi streak của bạn
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="login-email" className="text-xs font-bold text-gray-700 block">Email:</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="login-email"
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
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="login-password" className="font-bold text-gray-700">Mật khẩu:</label>
              <span className="text-gray-400">Quên mật khẩu? Liên hệ quản trị viên.</span>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                Đăng nhập vào hệ thống
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-[#B9343F] hover:underline">
            Đăng ký học miễn phí
          </Link>
        </div>
      </div>
    </div>
  );
}
