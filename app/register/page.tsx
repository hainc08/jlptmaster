"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MockBadge } from "../components/MockBadge";
import { ArrowRight, Lock, Mail, User, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("Minh");
  const [email, setEmail] = useState("minh@jlptmaster.vn");
  const [password, setPassword] = useState("password123");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/onboarding");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <MockBadge label="ĐĂNG KÝ MÔ PHỎNG" />
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Tạo tài khoản học N5
          </h1>
          <p className="text-xs text-gray-500">
            Bắt đầu hành trình chinh phục tiếng Nhật hoàn toàn miễn phí
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Họ và tên:</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F7F7F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B9343F] text-sm text-gray-900"
              />
            </div>
          </div>

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
            <label className="text-xs font-bold text-gray-700 block">Mật khẩu:</label>
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
            <p className="text-[10px] text-gray-400">Tối thiểu 8 ký tự bao gồm chữ và số</p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#B9343F] hover:bg-[#A02731] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-2"
          >
            Đăng ký và bắt đầu học
            <ArrowRight size={16} />
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
