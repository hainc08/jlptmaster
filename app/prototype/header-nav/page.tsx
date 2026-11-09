"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RubyText, useFurigana } from "../../components/RubyText";
import {
  Home,
  BookOpen,
  Target,
  FileCheck2,
  TrendingUp,
  ChevronDown,
  Bell,
  User,
  Shield,
  Check,
  Clock,
  Award,
  FileText,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  LogOut,
  Settings,
  Layers,
  Languages,
  Compass,
  Headphones,
  BookMarked,
  RotateCcw,
  History,
  BarChart3,
  Trophy,
  Lock,
  X,
} from "lucide-react";

type UserRole = "student" | "guest" | "admin";
type SectionId = "trang-chu" | "hoc-tap" | "luyen-tap" | "thi-thu" | "tien-do";

interface SubNavItem {
  id: string;
  label: string;
  description: string;
  href: string;
  badge?: string;
  icon: React.ElementType;
}

interface NavSection {
  id: SectionId;
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: SubNavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "trang-chu",
    label: "Trang chủ",
    href: "#trang-chu",
    icon: Home,
  },
  {
    id: "hoc-tap",
    label: "Học tập",
    href: "#hoc-tap",
    icon: BookOpen,
    subItems: [
      {
        id: "lo-trinh",
        label: "Lộ trình học",
        description: "Giáo trình N5 theo từng bài học có cấu trúc",
        href: "/learn/n5",
        badge: "3 bài N5",
        icon: Compass,
      },
      {
        id: "tu-vung",
        label: "Từ vựng",
        description: "Sổ tay từ vựng kèm âm thanh và ví dụ thực tế",
        href: "/vocabulary",
        icon: BookMarked,
      },
      {
        id: "kanji",
        label: "Kanji",
        description: "Chữ Hán N5, âm On/Kun, Hán-Việt và số nét",
        href: "/kanji",
        icon: Languages,
      },
      {
        id: "ngu-phap",
        label: "Ngữ pháp",
        description: "Mẫu câu, quy tắc chia thể và ngữ cảnh sử dụng",
        href: "/grammar",
        icon: FileText,
      },
      {
        id: "flashcard-srs",
        label: "Flashcard SRS",
        description: "Ôn tập ngắt quãng 4 mức độ ghi nhớ dài hạn",
        href: "/flashcards",
        badge: "8 đến hạn",
        icon: Layers,
      },
    ],
  },
  {
    id: "luyen-tap",
    label: "Luyện tập",
    href: "#luyen-tap",
    icon: Target,
    subItems: [
      {
        id: "trac-nghiem",
        label: "Trắc nghiệm",
        description: "Luyện câu hỏi theo kỹ năng, giải thích tức thì",
        href: "/practice",
        icon: Target,
      },
      {
        id: "doc-hieu",
        label: "Đọc hiểu",
        description: "Đoạn văn ngắn và trung bình chuẩn cấu trúc JLPT",
        href: "/reading",
        icon: BookOpen,
      },
      {
        id: "nghe-hieu",
        label: "Nghe hiểu",
        description: "Luyện phản xạ nghe hội thoại kèm lời thoại",
        href: "/listening",
        icon: Headphones,
      },
      {
        id: "on-cau-sai",
        label: "Ôn câu sai",
        description: "Tổng hợp các câu trả lời sai cần khắc phục",
        href: "/practice?filter=mistakes",
        badge: "5 câu",
        icon: RotateCcw,
      },
    ],
  },
  {
    id: "thi-thu",
    label: "Thi thử",
    href: "#thi-thu",
    icon: FileCheck2,
    subItems: [
      {
        id: "danh-sach-de",
        label: "Danh sách đề",
        description: "Phòng thi mô phỏng bấm giờ 3 phần chuẩn JLPT",
        href: "/mock-exams",
        badge: "N5",
        icon: FileCheck2,
      },
      {
        id: "lich-su-thi",
        label: "Lịch sử thi",
        description: "Danh sách các lượt thi đã hoàn thành và đang lưu",
        href: "/mock-exams?tab=history",
        icon: History,
      },
      {
        id: "ket-qua",
        label: "Kết quả",
        description: "Phân tích điểm số 0–180 và chẩn đoán kỹ năng yếu",
        href: "/results/att-01",
        icon: Award,
      },
    ],
  },
  {
    id: "tien-do",
    label: "Tiến độ",
    href: "#tien-do",
    icon: TrendingUp,
    subItems: [
      {
        id: "tong-quan",
        label: "Tổng quan",
        description: "Chuỗi ngày học liên tiếp (Streak) và mục tiêu ngày",
        href: "/progress",
        icon: TrendingUp,
      },
      {
        id: "thong-ke",
        label: "Thống kê",
        description: "Biểu đồ tỷ lệ chính xác theo Từ vựng, Ngữ pháp, Đọc, Nghe",
        href: "/progress?tab=analytics",
        icon: BarChart3,
      },
      {
        id: "thanh-tich",
        label: "Thành tích",
        description: "Các cột mốc chinh phục lộ trình JLPT N5–N1",
        href: "/progress?tab=achievements",
        icon: Trophy,
      },
    ],
  },
];

const JLPT_LEVELS = [
  { code: "N5", name: "Sơ cấp 1 (Nhập môn)", active: true, statusText: "Đang học" },
  { code: "N4", name: "Sơ cấp 2", active: false, statusText: "Sắp ra mắt" },
  { code: "N3", name: "Trung cấp", active: false, statusText: "Sắp ra mắt" },
  { code: "N2", name: "Trung - Cao cấp", active: false, statusText: "Sắp ra mắt" },
  { code: "N1", name: "Cao cấp", active: false, statusText: "Sắp ra mắt" },
];

function HeaderNavPrototypeInner() {
  const searchParams = useSearchParams();
  const { showFurigana, toggleFurigana } = useFurigana();

  const initialRole = (searchParams.get("role") as UserRole) || "student";
  const initialSection = (searchParams.get("section") as SectionId) || "thi-thu";
  const initialOpenMenu = searchParams.get("openMenu") as SectionId | "level" | "notif" | "profile" | null;
  const initialMobileSheet = searchParams.get("mobileSheet") as SectionId | null;

  const [role, setRole] = useState<UserRole>(initialRole);
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const [activeSubItem, setActiveSubItem] = useState<string>("danh-sach-de");
  const [selectedLevel, setSelectedLevel] = useState<string>("N5");

  // Desktop Popovers / Dropdown states
  const [openDropdown, setOpenDropdown] = useState<SectionId | null>(
    initialOpenMenu && ["hoc-tap", "luyen-tap", "thi-thu", "tien-do"].includes(initialOpenMenu)
      ? (initialOpenMenu as SectionId)
      : null
  );
  const [levelMenuOpen, setLevelMenuOpen] = useState<boolean>(initialOpenMenu === "level");
  const [notifMenuOpen, setNotifMenuOpen] = useState<boolean>(initialOpenMenu === "notif");
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(initialOpenMenu === "profile");

  // Mobile Bottom Sheet state
  const [mobileSheetSection, setMobileSheetSection] = useState<SectionId | null>(initialMobileSheet);

  const navContainerRef = useRef<HTMLDivElement>(null);

  const closeAllMenus = () => {
    setOpenDropdown(null);
    setLevelMenuOpen(false);
    setNotifMenuOpen(false);
    setProfileMenuOpen(false);
    setMobileSheetSection(null);
  };

  // Keyboard Escape handler for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllMenus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setLevelMenuOpen(false);
        setNotifMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSheetData = NAV_SECTIONS.find((s) => s.id === mobileSheetSection);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-12">
      {/* Isolate prototype from production Navbar and BottomNav without modifying production files */}
      <style>{`
        body > header:first-of-type,
        body > nav.fixed.bottom-0 {
          display: none !important;
        }
      `}</style>

      {/* =====================================================================
          REDESIGNED GLOBAL HEADER (Desktop & Mobile Top Bar)
      ===================================================================== */}
      <header
        ref={navContainerRef}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 h-14 md:h-16 flex items-center justify-between gap-2 lg:gap-3">
          {/* LEFT ZONE: Brand Identity + JLPT Level Selector */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0 min-w-0">
            <a
              href="#trang-chu"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("trang-chu");
                closeAllMenus();
              }}
              className="flex items-center gap-2 min-h-[40px] md:min-h-[44px] pr-0.5 rounded-lg shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-white font-bold flex items-center justify-center text-sm sm:text-base shadow-sm shrink-0"
                style={{ fontFamily: "var(--font-japanese), sans-serif" }}
              >
                日
              </span>
              <div className="leading-tight shrink-0">
                <span className="font-bold text-foreground tracking-tight text-sm sm:text-base xl:text-lg block whitespace-nowrap">
                  JLPT <span className="md:hidden lg:inline">MASTER</span>
                </span>
                <span className="hidden 2xl:block text-[11px] text-muted font-medium whitespace-nowrap">
                  Học & Luyện thi chuẩn Nhật
                </span>
              </div>
            </a>

            <span className="h-5 w-px bg-border hidden lg:block shrink-0" aria-hidden="true" />

            {/* JLPT Level Selector (N5–N1) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = !levelMenuOpen;
                  closeAllMenus();
                  setLevelMenuOpen(next);
                }}
                aria-expanded={levelMenuOpen}
                aria-haspopup="true"
                aria-controls="jlpt-level-menu"
                aria-label="Chọn cấp độ JLPT"
                className="h-9 md:h-10 px-2.5 lg:px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-gray-100 text-xs font-semibold text-foreground flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="hidden xl:inline text-muted font-medium whitespace-nowrap">
                  Cấp độ:
                </span>
                <span className="font-bold text-primary whitespace-nowrap">{selectedLevel}</span>
                <ChevronDown
                  size={14}
                  className={`text-muted shrink-0 transition-transform ${levelMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {levelMenuOpen && (
                <div
                  id="jlpt-level-menu"
                  role="menu"
                  aria-label="Danh sách cấp độ JLPT"
                  className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-border shadow-lg p-2 z-50"
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Mục tiêu JLPT của bạn
                  </div>
                  <div className="space-y-1 mt-1">
                    {JLPT_LEVELS.map((lvl) => (
                      <button
                        key={lvl.code}
                        type="button"
                        role="menuitem"
                        disabled={!lvl.active}
                        onClick={() => {
                          if (lvl.active) {
                            setSelectedLevel(lvl.code);
                            setLevelMenuOpen(false);
                          }
                        }}
                        className={`w-full min-h-[44px] px-3 py-2 rounded-lg text-left flex items-center justify-between transition-colors ${
                          lvl.active
                            ? "bg-primary-subtle/70 text-foreground hover:bg-primary-subtle cursor-pointer"
                            : "opacity-60 cursor-not-allowed text-muted bg-gray-50/60"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                lvl.active
                                  ? "bg-primary text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {lvl.code}
                            </span>
                            <span className="text-xs font-semibold">{lvl.name}</span>
                          </div>
                        </div>
                        {lvl.active ? (
                          <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                            <Check size={13} />
                            {lvl.statusText}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                            <Lock size={11} />
                            {lvl.statusText}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER ZONE: 5 Primary Navigation Sections (Desktop >= 768px) */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center flex-nowrap shrink-0 gap-0.5 lg:gap-1 xl:gap-1.5"
          >
            {NAV_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              const isDropdownOpen = openDropdown === sec.id;
              const hasSub = Boolean(sec.subItems && sec.subItems.length > 0);

              return (
                <div key={sec.id} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasSub) {
                        setActiveSection(sec.id);
                        closeAllMenus();
                      } else {
                        const nextOpen = isDropdownOpen ? null : sec.id;
                        closeAllMenus();
                        setOpenDropdown(nextOpen);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (hasSub && e.key === "ArrowDown") {
                        e.preventDefault();
                        closeAllMenus();
                        setOpenDropdown(sec.id);
                      }
                    }}
                    aria-expanded={hasSub ? isDropdownOpen : undefined}
                    aria-haspopup={hasSub ? "true" : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative h-10 px-1.5 lg:px-2.5 xl:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm flex items-center flex-nowrap whitespace-nowrap shrink-0 gap-1 xl:gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isActive
                        ? "text-primary bg-primary-subtle/60 font-semibold"
                        : "text-foreground hover:bg-gray-100 font-medium"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={`hidden xl:inline-block shrink-0 ${
                        isActive ? "text-primary stroke-[2.2]" : "text-muted"
                      }`}
                    />
                    <span className="whitespace-nowrap">{sec.label}</span>
                    {hasSub && (
                      <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform duration-150 ${
                          isDropdownOpen ? "rotate-180 text-primary" : "text-muted"
                        }`}
                      />
                    )}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </button>

                  {/* Accessible Dropdown Menu */}
                  {hasSub && isDropdownOpen && (
                    <div
                      role="menu"
                      aria-label={`Menu ${sec.label}`}
                      className="absolute left-0 mt-2 w-80 rounded-xl bg-white border border-border shadow-lg p-2 z-50"
                    >
                      <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                          {sec.label} — JLPT {selectedLevel}
                        </span>
                        <span className="text-[11px] text-primary font-medium">
                          {sec.subItems?.length} mục
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {sec.subItems?.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeSection === sec.id && activeSubItem === sub.id;
                          return (
                            <a
                              key={sub.id}
                              href={sub.href}
                              role="menuitem"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveSection(sec.id);
                                setActiveSubItem(sub.id);
                                setOpenDropdown(null);
                              }}
                              className={`min-h-[48px] px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                isSubActive
                                  ? "bg-primary-subtle/70 text-primary"
                                  : "hover:bg-surface-hover text-foreground"
                              }`}
                            >
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSubActive
                                    ? "bg-primary text-white"
                                    : "bg-background text-foreground border border-border"
                                }`}
                              >
                                <SubIcon size={16} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold leading-snug">
                                    {sub.label}
                                  </span>
                                  {sub.badge && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-subtle text-primary">
                                      {sub.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted leading-normal mt-0.5">
                                  {sub.description}
                                </p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT ZONE: Role-Based Utility Controls */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
            {/* ADMIN ONLY: CMS Quick Access (Strictly hidden for Guest & Student) */}
            {role === "admin" && (
              <a
                href="/admin"
                onClick={(e) => e.preventDefault()}
                className="hidden lg:inline-flex h-10 px-2.5 xl:px-3 py-1.5 rounded-lg bg-info-bg hover:bg-indigo-100 text-info-text text-xs font-semibold items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-text focus-visible:ring-offset-2"
              >
                <Shield size={14} className="shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Quản trị CMS</span>
                <span className="xl:hidden whitespace-nowrap">CMS</span>
              </a>
            )}

            {/* GUEST STATE: Login & Register CTAs */}
            {role === "guest" ? (
              <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
                <a
                  href="/login"
                  onClick={(e) => e.preventDefault()}
                  className="h-9 md:h-10 px-2.5 lg:px-3.5 py-1.5 rounded-lg border border-border bg-white hover:bg-gray-50 text-xs lg:text-sm font-semibold text-foreground flex items-center justify-center whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Đăng nhập
                </a>
                <a
                  href="/register"
                  onClick={(e) => e.preventDefault()}
                  className="h-9 md:h-10 px-2.5 lg:px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs lg:text-sm font-semibold text-white flex items-center justify-center shadow-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Đăng ký
                </a>
              </div>
            ) : (
              /* AUTHENTICATED STATE (Student or Admin): Notifications + User Avatar Menu */
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Notification Bell */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifMenuOpen;
                      closeAllMenus();
                      setNotifMenuOpen(next);
                    }}
                    aria-expanded={notifMenuOpen}
                    aria-haspopup="true"
                    aria-label="Thông báo học tập (2 thông báo mới)"
                    className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg border border-transparent hover:bg-gray-100 text-foreground flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Bell size={18} className="shrink-0" />
                    <span
                      className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-white"
                      aria-hidden="true"
                    />
                  </button>

                  {notifMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Danh sách thông báo"
                      className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-border shadow-lg p-3 z-50 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs font-bold text-foreground">Thông báo học tập</span>
                        <span className="text-[11px] font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">
                          2 mới
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-primary-subtle/40 border border-primary-subtle space-y-0.5">
                          <p className="font-semibold text-foreground">
                            8 thẻ nhớ SRS N5 đã đến hạn ôn tập
                          </p>
                          <p className="text-muted">
                            Duy trì chuỗi 7 ngày học liên tiếp ngay hôm nay.
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 space-y-0.5">
                          <p className="font-semibold text-foreground">
                            Đã lưu kết quả Đề thi thử N5 Số 01
                          </p>
                          <p className="text-muted">
                            Điểm ước tính nội bộ: 142 / 180 điểm.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar / Account Menu */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !profileMenuOpen;
                      closeAllMenus();
                      setProfileMenuOpen(next);
                    }}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                    aria-label="Menu tài khoản cá nhân"
                    className="h-9 md:h-10 pl-1.5 pr-2 lg:pr-2.5 py-1 rounded-lg border border-border hover:bg-gray-50 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-foreground text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {role === "admin" ? "AD" : "MN"}
                    </span>
                    <div className="hidden xl:block text-left leading-tight shrink-0">
                      <span className="text-xs font-semibold text-foreground block whitespace-nowrap">
                        {role === "admin" ? "Quản trị viên" : "Minh Nguyễn"}
                      </span>
                      <span className="hidden 2xl:block text-[10px] text-muted whitespace-nowrap">
                        {role === "admin" ? "ADMIN • N5–N1" : "Học viên • Mục tiêu N5"}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-muted shrink-0" />
                  </button>

                  {profileMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Tùy chọn tài khoản"
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-border shadow-lg p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-foreground">
                          {role === "admin" ? "admin@jlptmaster.vn" : "minh@jlptmaster.vn"}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">
                          Mục tiêu: JLPT N5 (30 phút/ngày)
                        </p>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <a
                          href="/progress"
                          role="menuitem"
                          onClick={(e) => e.preventDefault()}
                          className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-gray-100 flex items-center gap-2.5"
                        >
                          <User size={15} className="text-muted" />
                          Hồ sơ & Lộ trình cá nhân
                        </a>
                        <a
                          href="/settings"
                          role="menuitem"
                          onClick={(e) => e.preventDefault()}
                          className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-gray-100 flex items-center gap-2.5"
                        >
                          <Settings size={15} className="text-muted" />
                          Cài đặt tài khoản
                        </a>

                        {role === "admin" && (
                          <a
                            href="/admin"
                            role="menuitem"
                            onClick={(e) => e.preventDefault()}
                            className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold text-info-text bg-info-bg/60 hover:bg-info-bg flex items-center gap-2.5"
                          >
                            <Shield size={15} />
                            Bảng điều khiển Admin CMS
                          </a>
                        )}
                      </div>

                      <div className="pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setRole("guest");
                            setProfileMenuOpen(false);
                          }}
                          className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary-subtle/60 flex items-center gap-2.5"
                        >
                          <LogOut size={15} />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          PROTOTYPE INTERACTIVE STATE SWITCHER (For UX Review & Verification)
      ===================================================================== */}
      <div className="bg-foreground text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-white font-bold uppercase tracking-wider text-[10px]">
              UI/UX Prototype
            </span>
            <span className="text-gray-300 font-medium">
              Bản mẫu Thiết kế Header & Điều hướng 5 Phân mục (Chưa áp dụng vào Production)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400">Chế độ xem vai trò:</span>
            {(["student", "guest", "admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  closeAllMenus();
                }}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  role === r
                    ? "bg-white text-foreground"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {r === "student" ? "Học viên (Student)" : r === "guest" ? "Khách (Guest)" : "Quản trị (Admin)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN PAGE CONTENT:
          1. Secondary Sub-Navigation Pill Bar for the Active Pillar
          2. Contextual Learning Bar Demo (Showing new home of Furigana Toggle)
          3. Mock Exams Page Content (/mock-exams)
      ===================================================================== */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Contextual Sub-Navigation Bar for Current Section */}
        {NAV_SECTIONS.find((s) => s.id === activeSection)?.subItems && (
          <div className="bg-white px-4 py-2.5 rounded-xl border border-border shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <span>Phân mục:</span>
              <span className="text-foreground font-bold">
                {NAV_SECTIONS.find((s) => s.id === activeSection)?.label}
              </span>
              <ChevronRight size={14} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {NAV_SECTIONS.find((s) => s.id === activeSection)?.subItems?.map((sub) => {
                const isSubSelected = activeSubItem === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setActiveSubItem(sub.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSubSelected
                        ? "bg-primary text-white shadow-sm"
                        : "bg-background text-foreground hover:bg-gray-200"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Contextual Learning Toolbar Demo (Relocated Furigana Control!) */}
        <section
          aria-label="Thanh công cụ hiển thị ngữ cảnh học tập"
          className="bg-white p-4 sm:p-5 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-success-bg text-success-text">
                Cải tiến UX #5
              </span>
              <h2 className="text-sm font-bold text-foreground">
                Thanh công cụ Ngữ cảnh Học tập (Contextual Furigana Control)
              </h2>
            </div>
            <p className="text-xs text-muted">
              Nút bật/tắt Furigana đã được tách khỏi Header chung và đặt trực tiếp cạnh nội dung tiếng Nhật:
            </p>
            <div className="pt-1 text-base font-medium text-foreground" style={{ fontFamily: "var(--font-japanese), sans-serif" }}>
              Ví dụ câu hỏi: 「<RubyText kanji="日本語" reading="にほんご" />の<RubyText kanji="試験" reading="しけん" />を<RubyText kanji="受" reading="う" />けます。」
            </div>
          </div>

          <button
            type="button"
            onClick={toggleFurigana}
            aria-pressed={showFurigana}
            className={`min-h-[44px] px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              showFurigana
                ? "bg-primary-subtle text-primary border-primary/30"
                : "bg-background text-muted border-border"
            }`}
          >
            <span className="font-bold text-sm" style={{ fontFamily: "var(--font-japanese), sans-serif" }}>
              振
            </span>
            <span>Furigana trong bài học: {showFurigana ? "ĐANG BẬT" : "ĐANG TẮT"}</span>
          </button>
        </section>

        {/* Mock Exams Page Content (/mock-exams context) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-primary-subtle text-primary font-extrabold flex items-center justify-center text-lg">
                <Award size={22} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Phòng Thi Thử JLPT {selectedLevel} Bấm Giờ
                </h1>
                <p className="text-xs text-muted">
                  Mô phỏng chân thực quy chế thi, thời lượng 3 phần và tự động lưu bài làm mỗi 15 giây.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-background border border-border text-foreground">
              4. Thi thử → Danh sách đề
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Quy chế thi mô phỏng:</strong> Đồng hồ đếm ngược được đồng bộ trực tiếp với máy chủ. Toàn bộ đáp án đúng và giải thích tiếng Việt được bảo mật tuyệt đối cho đến khi hoàn tất nộp bài.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {[
              {
                id: "att-01",
                title: "Đề thi thử JLPT N5 — Số 01 (Tiêu chuẩn)",
                status: "COMPLETED",
                score: "142 / 180",
              },
              {
                id: "att-02",
                title: "Đề thi thử JLPT N5 — Số 02 (Nâng cao)",
                status: "NEW",
                score: null,
              },
            ].map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-xl border border-border bg-background/50 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                      JLPT N5
                    </span>
                    {exam.score ? (
                      <span className="text-xs font-semibold text-success-text bg-success-bg px-2.5 py-0.5 rounded-full">
                        Đã chấm: {exam.score}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-info-text bg-info-bg px-2.5 py-0.5 rounded-full">
                        Chưa làm bài
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> 90 phút (20p / 40p / 30p)
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={13} /> 35 câu hỏi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={`/mock-exams/${exam.id}`}
                    onClick={(e) => e.preventDefault()}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{exam.score ? "Thi lại đề này" : "Bắt đầu làm bài"}</span>
                    <ChevronRight size={15} />
                  </a>
                  {exam.score && (
                    <a
                      href={`/results/${exam.id}`}
                      onClick={(e) => e.preventDefault()}
                      className="min-h-[44px] px-3.5 py-2.5 rounded-lg border border-border bg-white hover:bg-gray-50 text-foreground font-semibold text-xs flex items-center justify-center transition-colors"
                    >
                      Xem kết quả
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MOBILE SECONDARY NAVIGATION SHEET (< 768px)
      ===================================================================== */}
      {currentSheetData && currentSheetData.subItems && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 flex items-end"
          onClick={() => setMobileSheetSection(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Menu ${currentSheetData.label}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-t-2xl border-t border-border p-4 pb-24 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  JLPT {selectedLevel}
                </span>
                <h3 className="text-base font-bold text-foreground">{currentSheetData.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileSheetSection(null)}
                aria-label="Đóng menu"
                className="w-11 h-11 rounded-lg bg-background text-foreground flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              {currentSheetData.subItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive =
                  activeSection === currentSheetData.id && activeSubItem === sub.id;
                return (
                  <a
                    key={sub.id}
                    href={sub.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(currentSheetData.id);
                      setActiveSubItem(sub.id);
                      setMobileSheetSection(null);
                    }}
                    className={`min-h-[52px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 ${
                      isSubActive
                        ? "bg-primary-subtle text-primary"
                        : "bg-background text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSubActive ? "bg-primary text-white" : "bg-white text-foreground"
                        }`}
                      >
                        <SubIcon size={17} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{sub.label}</p>
                        <p className="text-[11px] text-muted">{sub.description}</p>
                      </div>
                    </div>
                    {sub.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-primary border border-primary/20 shrink-0">
                        {sub.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MOBILE FIXED BOTTOM NAVIGATION (< 768px) — 5 PRIMARY ITEMS
      ===================================================================== */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-1.5 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg"
      >
        <div className="grid grid-cols-5 gap-1 items-center">
          {NAV_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            const isSheetOpen = mobileSheetSection === sec.id;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  if (!sec.subItems) {
                    setActiveSection(sec.id);
                    setMobileSheetSection(null);
                  } else {
                    setActiveSection(sec.id);
                    setMobileSheetSection(isSheetOpen ? null : sec.id);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                aria-expanded={sec.subItems ? isSheetOpen : undefined}
                className={`relative min-h-[48px] py-1 px-1 rounded-lg flex flex-col items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? "text-primary font-semibold" : "text-muted font-medium"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-3 right-3 h-0.5 bg-primary rounded-full"
                    aria-hidden="true"
                  />
                )}
                <Icon size={19} className={isActive ? "stroke-[2.3]" : "stroke-[1.8]"} />
                <span className="text-[11px] leading-tight mt-1 tracking-tight">{sec.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function HeaderNavPrototypePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HeaderNavPrototypeInner />
    </Suspense>
  );
}
