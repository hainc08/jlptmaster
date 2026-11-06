/** Admin CMS screens render their own shell, so the learner header and bottom nav are hidden there. */
export function isCmsPath(pathname: string): boolean {
  return /^\/admin\/(dashboard|members|levels|settings|audit)(\/|$)/.test(pathname);
}

/**
 * Where to send a user after signing in. ADMIN/OWNER keep the existing admin home; SUPPORT/EDITOR
 * use the new console only. Redirects must be same-site paths and never grant access to /admin.
 */
export function postLoginTarget(role: string, redirect: string | null): string {
  const safe = redirect && /^\/(?!\/)/.test(redirect) ? redirect : null;
  const fullAdmin = role === "ADMIN" || role === "OWNER";
  const consoleOnly = role === "SUPPORT" || role === "EDITOR";
  const home = fullAdmin ? "/admin" : consoleOnly ? "/admin/dashboard" : "/dashboard";
  if (!safe) return home;
  if (!safe.startsWith("/admin")) return safe;
  if (fullAdmin) return safe;
  if (consoleOnly && isCmsPath(safe)) return safe;
  return home;
}

export type TabId = "home" | "learn" | "test" | "kanji" | "profile";

/** Learner navigation: bottom bar below 1024px, sidebar at ≥1024px. */
export const LEARNER_TABS: { id: TabId; labelKey: string; href: string }[] = [
  { id: "home", labelKey: "nav.home", href: "/dashboard" },
  { id: "learn", labelKey: "nav.learn", href: "/learn/n5" },
  { id: "test", labelKey: "nav.test", href: "/mock-exams" },
  { id: "kanji", labelKey: "nav.kanji", href: "/kanji" },
  { id: "profile", labelKey: "nav.profile", href: "/profile" },
];

const under = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + "/");

export function getActiveTab(pathname: string): TabId | null {
  if (under(pathname, "/dashboard")) return "home";
  if (["/learn", "/vocabulary", "/grammar", "/flashcards", "/practice"].some((b) => under(pathname, b))) {
    return "learn";
  }
  if (under(pathname, "/mock-exams") || under(pathname, "/results")) return "test";
  if (under(pathname, "/kanji")) return "kanji";
  if (under(pathname, "/profile")) return "profile";
  return null;
}

/** Lesson and exam screens hide the tab bar and sidebar. */
export function isFocusPath(pathname: string): boolean {
  return /^\/learn\/n5\/[^/]+\/?$/.test(pathname) || /^\/mock-exams\/[^/]+\/?$/.test(pathname);
}

/** The furigana switch only appears on screens that show Japanese text. */
export function showsFurigana(pathname: string): boolean {
  const tab = getActiveTab(pathname);
  return tab === "learn" || tab === "kanji" || tab === "test";
}

export const JLPT_LEVELS = [
  { code: "N5", name: "Sơ cấp 1 (Nhập môn)", active: true, statusText: "Đang học" },
  { code: "N4", name: "Sơ cấp 2", active: false, statusText: "Sắp ra mắt" },
  { code: "N3", name: "Trung cấp", active: false, statusText: "Sắp ra mắt" },
  { code: "N2", name: "Trung - Cao cấp", active: false, statusText: "Sắp ra mắt" },
  { code: "N1", name: "Cao cấp", active: false, statusText: "Sắp ra mắt" },
];
