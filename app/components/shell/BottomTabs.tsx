"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEARNER_TABS, getActiveTab } from "../nav-config";
import { useT } from "../i18n";
import { TabIcon } from "./NavItems";

/** Mobile/tablet tab bar (hidden at ≥1024px, where SideNav takes over). */
export function BottomTabs() {
  const active = getActiveTab(usePathname() || "/");
  const t = useT();
  return (
    <nav
      aria-label={t("nav.main")}
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 bg-surface border-t border-border px-1 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))]"
    >
      {LEARNER_TABS.map((tab) => {
        const current = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 min-h-14 min-w-0 text-xs font-semibold ${
              current ? "text-foreground" : "text-muted"
            }`}
          >
            <span
              className={`grid place-items-center w-14 h-[30px] rounded-full ${
                current ? "bg-primary-container text-on-primary-container" : ""
              }`}
            >
              <TabIcon id={tab.id} />
            </span>
            <span className="truncate max-w-full">{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
