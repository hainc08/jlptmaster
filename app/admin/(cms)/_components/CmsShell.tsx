"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { CmsProvider } from "./CmsContext";
import { ToastProvider } from "./Toast";
import { initials } from "../_lib/format";
import { LANGS, ROLE_LABEL, setLangCookie, t, type AdminKey, type Lang } from "../_lib/i18n";

type Mod = "dashboard" | "members" | "levels" | "settings" | "audit";

const NAV: { module: Mod; icon: IconName; label: AdminKey }[] = [
  { module: "dashboard", icon: "dashboard", label: "dashboard" },
  { module: "members", icon: "group", label: "members" },
  { module: "levels", icon: "school", label: "levels" },
  { module: "settings", icon: "settings", label: "settings" },
  { module: "audit", icon: "history", label: "audit" },
];

interface Props {
  user: { name: string; email: string; role: string };
  allowed: readonly Mod[];
  lang: Lang;
  children: React.ReactNode;
}

export function CmsShell({ user, allowed, lang, children }: Props) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [rail, setRail] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const current = NAV.find((n) => pathname === `/admin/${n.module}` || pathname.startsWith(`/admin/${n.module}/`))?.module;
  const permitted = current ? allowed.includes(current) : true;

  useEffect(() => {
    if (current && !permitted && allowed.length) router.replace(`/admin/${allowed[0]}`);
  }, [current, permitted, allowed, router]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const setLang = (next: Lang) => {
    setLangCookie(next);
    router.refresh();
  };

  const signOut = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      try { localStorage.removeItem("jlpt_auth_role"); } catch { /* storage unavailable */ }
      router.push("/login");
    }
  };

  const roleLabel = ROLE_LABEL[user.role] ?? user.role;
  const body = !allowed.length ? (
    <div className="state"><div className="ic"><Icon name="error" /></div><h1 className="t-sub">You have no access to any admin module</h1><p className="muted">Ask an owner to grant your role a module.</p></div>
  ) : permitted ? children : null;

  return (
    <CmsProvider value={{ lang, role: user.role, allowed }}>
    <ToastProvider>
      <div className={`cms ${rail ? "rail" : ""}`}>
        <header className="topbar">
          <button type="button" className="icon-btn collapse-btn" aria-label="Toggle sidebar" onClick={() => setRail((r) => !r)}><Icon name="menu" /></button>
          <div className="brand"><div className="logo jp" aria-hidden="true">J</div><span className="name">JLPT Master <span className="muted" style={{ fontWeight: 500 }}>Admin</span></span></div>
          {allowed.includes("members") && (
            <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); router.push(`/admin/members?q=${encodeURIComponent(q)}`); }}>
              <label className="sr" htmlFor="cms-global-search">{t(lang, "search")}</label>
              <Icon name="search" />
              <input id="cms-global-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "search")} />
            </form>
          )}
          <span className="spacer" />
          <div className="seg lang-seg" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <div className="menu-wrap" ref={menuRef}>
            <button type="button" className="avatar-btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <span className="avatar" style={{ background: "var(--accent)", color: "#fff" }} aria-hidden="true">{initials(user.name)}</span>
              <span className="who"><b>{user.name}</b><span>{roleLabel}</span></span>
              <Icon name="down" />
            </button>
            <div className={`pop ${menuOpen ? "open" : ""}`} role="menu" hidden={!menuOpen}>
              <div style={{ padding: "8px 12px" }}><b>{user.name}</b><div className="muted" style={{ fontSize: 12 }}>{user.email}</div></div>
              <hr />
              <button type="button" className="item" role="menuitem" onClick={signOut}>{t(lang, "signOut")}</button>
            </div>
          </div>
        </header>
        <nav className="side nav" aria-label="Main">
          {NAV.filter((n) => allowed.includes(n.module)).map((n) => (
            <Link key={n.module} href={`/admin/${n.module}`} aria-current={current === n.module ? "page" : undefined} title={t(lang, n.label)}>
              <Icon name={n.icon} /><span className="lbl">{t(lang, n.label)}</span>
            </Link>
          ))}
        </nav>
        <section className="main" aria-label="Admin content" tabIndex={-1}>{body}</section>
      </div>
    </ToastProvider>
    </CmsProvider>
  );
}
