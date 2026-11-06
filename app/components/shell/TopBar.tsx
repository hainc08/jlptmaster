"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showsFurigana } from "../nav-config";
import { useFurigana } from "../RubyText";
import { useLocale, useT, type Locale } from "../i18n";
import { Logo } from "./NavItems";

const segBtn =
  "relative h-8 min-w-9 px-2.5 text-xs font-semibold text-muted aria-pressed:bg-primary-container aria-pressed:text-on-primary-container " +
  "before:absolute before:content-[''] before:inset-x-0 before:-inset-y-2 cursor-pointer";

export function FuriganaSwitch() {
  const { showFurigana, setFurigana } = useFurigana();
  const t = useT();
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden="true" className="font-japanese text-xs font-bold text-muted whitespace-nowrap max-[399px]:hidden">
        ふりがな
      </span>
      <div role="group" aria-label="Furigana" className="inline-flex flex-none border border-outline rounded-full overflow-hidden">
        <button type="button" className={segBtn} aria-pressed={showFurigana} onClick={() => setFurigana(true)}>
          {t("furigana.on")}
        </button>
        <button
          type="button"
          className={`${segBtn} border-l border-border`}
          aria-pressed={!showFurigana}
          onClick={() => setFurigana(false)}
        >
          {t("furigana.off")}
        </button>
      </div>
    </div>
  );
}

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const opts: Locale[] = ["vi", "en"];
  return (
    <div role="group" aria-label={t("lang.label")} className="inline-flex flex-none border border-outline rounded-full overflow-hidden">
      {opts.map((l, i) => (
        <button
          key={l}
          type="button"
          className={`${segBtn} ${i ? "border-l border-border" : ""}`}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Top app bar: brand (or a page title) on the left; furigana and VI/EN on the right. */
export function TopBar({ title, brandOnDesktop = true }: { title?: string; brandOnDesktop?: boolean }) {
  const pathname = usePathname() || "/";
  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-2 pl-4 pr-2 bg-surface border-b border-border">
      {title ? (
        <h1 className="font-bold text-base truncate min-w-0">{title}</h1>
      ) : (
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 font-bold whitespace-nowrap min-w-0 ${brandOnDesktop ? "" : "lg:hidden"}`}
        >
          <Logo />
          <span className="max-[359px]:hidden">JLPT Master</span>
        </Link>
      )}
      <span className="flex-1" />
      {showsFurigana(pathname) && <FuriganaSwitch />}
      <LanguageSwitch />
    </header>
  );
}
