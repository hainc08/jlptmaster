"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("minh@jlptmaster.vn");
  const [password, setPassword] = useState("password123");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = email.trim().toLowerCase() === "admin@jlptmaster.vn" || email.trim().toLowerCase().startsWith("admin@");
    if (typeof window !== "undefined") {
      localStorage.setItem("jlpt_auth_role", isAdmin ? "admin" : "student");
      localStorage.setItem("jlpt_auth_email", email.trim());
    }
    router.push(isAdmin ? "/admin" : "/dashboard");
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Email:</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-gray-700">Mật khẩu:</label>
              <a href="#" className="text-[#B9343F] hover:underline">
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-2"
          >
            Đăng nhập vào hệ thống
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Account Switcher for Demo / Admin CMS Access */}
        <div className="p-3.5 rounded-2xl bg-[#F7F7F4] border border-gray-200 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Tài khoản có sẵn trên MariaDB (Chọn nhanh):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("minh@jlptmaster.vn");
                setPassword("password123");
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                email === "minh@jlptmaster.vn"
                  ? "bg-white border-[#B9343F] ring-1 ring-[#B9343F]"
                  : "bg-white/70 border-gray-200 hover:bg-white"
              }`}
            >
              <span className="text-xs font-bold text-gray-900 block">Học viên (Student)</span>
              <span className="text-[11px] text-gray-500 block truncate">minh@jlptmaster.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@jlptmaster.vn");
                setPassword("password123");
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                email === "admin@jlptmaster.vn"
                  ? "bg-indigo-50/80 border-indigo-600 ring-1 ring-indigo-600"
                  : "bg-white/70 border-gray-200 hover:bg-white"
              }`}
            >
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <Shield size={12} className="text-indigo-700" />
                Quản trị BE (Admin)
              </span>
              <span className="text-[11px] text-indigo-700 block truncate">admin@jlptmaster.vn</span>
            </button>
          </div>
        </div>

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
