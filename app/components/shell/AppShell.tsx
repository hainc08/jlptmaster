"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCmsPath, isFocusPath } from "../nav-config";
import { TopBar } from "./TopBar";
import { BottomTabs } from "./BottomTabs";
import { SideNav } from "./SideNav";
import { Logo } from "./NavItems";

const BARE = new Set(["/", "/login", "/register"]);

/**
 * Learner chrome. CMS routes, the welcome/auth screens and isolated prototypes render their own
 * chrome; lesson and exam screens are distraction-free.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  if (isCmsPath(pathname) || BARE.has(pathname) || pathname.startsWith("/prototype/")) {
    return <>{children}</>;
  }
  if (isFocusPath(pathname)) {
    return <main className="min-h-screen">{children}</main>;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return (
      <>
        <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-4 bg-surface border-b border-border">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold">
            <Logo />
            JLPT Master · Quản trị
          </Link>
          <span className="flex-1" />
          <Link href="/admin/dashboard" className="text-sm font-semibold text-primary hover:underline">
            Bảng điều khiển CMS
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SideNav />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar brandOnDesktop={false} />
        <main className="flex-1 pb-24 lg:pb-8">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
