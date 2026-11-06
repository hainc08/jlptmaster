"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEARNER_TABS, getActiveTab } from "../nav-config";
import { useT } from "../i18n";
import { Logo, TabIcon } from "./NavItems";

/** Desktop navigation rail (≥1024px). */
export function SideNav() {
  const active = getActiveTab(usePathname() || "/");
  const t = useT();
  return (
    <aside className="hidden lg:flex flex-col w-64 flex-none sticky top-0 h-screen bg-surface border-r border-border px-3 py-4">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-[17px] px-2 pt-1 pb-5">
        <Logo />
        JLPT Master
      </Link>
      <nav aria-label={t("nav.main")} className="flex flex-col gap-1">
      {LEARNER_TABS.map((tab) => {
        const current = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={`flex items-center gap-3.5 h-[52px] px-4 rounded-full font-semibold text-[15px] ${
              current ? "bg-primary-container text-on-primary-container" : "text-muted hover:bg-surface-hover"
            }`}
          >
            <TabIcon id={tab.id} />
            {t(tab.labelKey)}
          </Link>
        );
      })}
      </nav>
    </aside>
  );
}
