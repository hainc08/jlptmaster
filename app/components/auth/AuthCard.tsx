"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, ClipboardCheck, Loader2, Lock, Mail, TrendingUp } from "lucide-react";
import { postLoginTarget } from "../nav-config";
import { LevelSelector } from "../ui/LevelSelector";
import { WelcomeTopBar } from "./WelcomeTopBar";

const input =
  "w-full min-h-12 pl-10 pr-4 rounded-xl border border-outline bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

/** Frame 01: welcome hero + sign-in / sign-up card. No social login. */
export function AuthCard({ mode }: { mode: "in" | "up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(mode === "in" ? "/api/v1/auth/login" : "/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message || (mode === "in" ? "Đăng nhập thất bại" : "Đăng ký thất bại. Vui lòng thử lại."));
      }
      const user = body.data.user;
      const isAdmin = user.role === "ADMIN" || user.role === "OWNER";
      try {
        // display-only hints; the signed HttpOnly cookie is what grants access
        localStorage.setItem("jlpt_auth_role", isAdmin ? "admin" : "student");
        localStorage.setItem("jlpt_auth_email", user.email);
        localStorage.setItem("jlpt_auth_user_id", user.id);
      } catch {}
      if (mode === "in") {
        router.push(postLoginTarget(user.role, new URLSearchParams(window.location.search).get("redirect")));
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const tab = (active: boolean) =>
    `flex-1 min-h-12 grid place-items-center rounded-lg text-sm font-semibold ${
      active ? "bg-surface text-primary shadow-sm" : "text-muted"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <WelcomeTopBar />
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 lg:py-12 grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <section className="flex flex-col gap-4">
          <h1 className="text-[28px] leading-9 lg:text-4xl font-bold text-foreground">
            Ôn thi JLPT dễ dàng, mỗi ngày một chút
          </h1>
          <p className="text-[15px] leading-[22px] text-muted">
            Học từ vựng, ngữ pháp, kanji và thi thử N5 ngay trên điện thoại.
          </p>
          <ul className="flex flex-wrap gap-2 text-sm text-on-primary-container">
            {[
              { icon: Clock, text: "5 phút/ngày" },
              { icon: ClipboardCheck, text: "Thi thử có chấm điểm" },
              { icon: TrendingUp, text: "Theo dõi tiến độ" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container">
                <Icon size={16} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col gap-4 shadow-sm">
          <nav aria-label="Tài khoản" className="flex gap-1 p-1 rounded-xl bg-surface-hover">
            <Link href="/login" aria-current={mode === "in" ? "page" : undefined} className={tab(mode === "in")}>
              Đăng nhập
            </Link>
            <Link href="/register" aria-current={mode === "up" ? "page" : undefined} className={tab(mode === "up")}>
              Đăng ký
            </Link>
          </nav>

          {errorMsg && (
            <div role="alert" className="p-3 rounded-xl bg-danger-bg text-danger-text text-sm flex items-center gap-2">
              <AlertCircle size={16} aria-hidden="true" className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-sm font-semibold text-foreground">Email</label>
              <div className="relative">
                <Mail size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="username"
                  placeholder="ban@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-sm font-semibold text-foreground">Mật khẩu</label>
              <div className="relative">
                <Lock size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "in" ? "current-password" : "new-password"}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  minLength={mode === "up" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                />
              </div>
              {mode === "up" && <p className="text-xs text-muted">Tối thiểu 8 ký tự, gồm cả chữ và số</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">Chọn cấp độ</span>
              <LevelSelector />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>

          {mode === "in" && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                aria-expanded={showForgot}
                onClick={() => setShowForgot((v) => !v)}
                className="min-h-12 px-3 text-sm font-semibold text-primary"
              >
                Quên mật khẩu?
              </button>
              {showForgot && (
                <p className="text-xs text-muted text-center">
                  Liên hệ quản trị viên để được đặt lại mật khẩu.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="max-w-5xl mx-auto px-4 pb-6 text-[11px] text-muted leading-relaxed">
        JLPT Master là nền tảng luyện thi độc lập, không trực thuộc hay được ủy quyền bởi Hiệp hội Hỗ trợ Giáo dục
        Quốc tế Nhật Bản (JEES) hoặc Quỹ Giao lưu Quốc tế Nhật Bản.
      </p>
    </div>
  );
}
