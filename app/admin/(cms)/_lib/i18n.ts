export type Lang = "vi" | "en" | "ja";
export const LANGS: readonly Lang[] = ["vi", "en", "ja"];

const DICT = {
  vi: { dashboard: "Tổng quan", members: "Thành viên", levels: "Cấp độ", settings: "Cài đặt hệ thống", audit: "Nhật ký hoạt động", search: "Tìm thành viên…", addMember: "Thêm thành viên", saveChanges: "Lưu thay đổi", signOut: "Đăng xuất" },
  en: { dashboard: "Dashboard", members: "Members", levels: "Levels", settings: "Settings", audit: "Audit Log", search: "Search members…", addMember: "Add member", saveChanges: "Save changes", signOut: "Sign out" },
  ja: { dashboard: "ダッシュボード", members: "会員", levels: "レベル", settings: "システム設定", audit: "監査ログ", search: "会員を検索…", addMember: "会員を追加", saveChanges: "変更を保存", signOut: "ログアウト" },
} as const;

export type AdminKey = keyof (typeof DICT)["en"];

/** Chrome strings only: navigation, search, primary actions. Screen bodies are English (as in the approved prototype). */
export function t(lang: Lang, key: AdminKey): string {
  return DICT[lang]?.[key] ?? DICT.en[key];
}

export const ROLE_LABEL: Record<string, string> = {
  OWNER: "Platform owner",
  ADMIN: "Admin",
  EDITOR: "Content Editor",
  SUPPORT: "Support",
};

export function parseLang(value: string | undefined | null): Lang {
  return value === "en" || value === "ja" || value === "vi" ? value : "vi";
}

/** Persists the operator's language for a year (read back by the CMS layout on the server). */
export function setLangCookie(lang: Lang): void {
  document.cookie = `admin_lang=${lang}; path=/; max-age=31536000; samesite=lax`;
}
