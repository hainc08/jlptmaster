"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "../shell/NavItems";
import { LanguageSwitch } from "../shell/TopBar";

/** Top bar for the signed-out screens (welcome, sign in, sign up). */
export function WelcomeTopBar({ signInLink = false }: { signInLink?: boolean }) {
  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-2 pl-4 pr-2 bg-surface border-b border-border">
      <Link href="/" className="flex items-center gap-2.5 font-bold whitespace-nowrap">
        <Logo />
        JLPT Master
      </Link>
      <span className="flex-1" />
      {signInLink && (
        <Link href="/login" className="min-h-12 px-3 inline-flex items-center text-sm font-semibold text-primary">
          Đăng nhập
        </Link>
      )}
      <LanguageSwitch />
    </header>
  );
}
