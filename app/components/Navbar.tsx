"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFurigana } from "./RubyText";
import {
  NAV_SECTIONS,
  JLPT_LEVELS,
  SectionId,
  UserRole,
  getActiveSectionFromPathname,
} from "./nav-config";
import {
  ChevronDown,
  Bell,
  User,
  Shield,
  Check,
  Lock,
  Settings,
  LogOut,
} from "lucide-react";

export interface NavbarProps {
  initialRole?: UserRole;
}

export function Navbar({ initialRole }: NavbarProps = {}) {
  const pathname = usePathname() || "/";
  const { showFurigana, toggleFurigana } = useFurigana();

  const derivedRole: UserRole =
    initialRole ||
    (pathname.startsWith("/admin")
      ? "admin"
      : pathname === "/login" || pathname === "/register"
      ? "guest"
      : "student");

  const [role, setRole] = useState<UserRole>(derivedRole);
  const [selectedLevel, setSelectedLevel] = useState<string>("N5");
  const [openDropdown, setOpenDropdown] = useState<SectionId | null>(null);
  const [levelMenuOpen, setLevelMenuOpen] = useState<boolean>(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);

  const navContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    } else if (pathname.startsWith("/admin")) {
      setRole("admin");
    } else if (pathname === "/login" || pathname === "/register") {
      setRole("guest");
    } else if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("jlpt_auth_role") as UserRole | null;
      setRole(savedRole === "admin" ? "admin" : "student");
    } else {
      setRole("student");
    }
  }, [initialRole, pathname]);

  const closeAllMenus = () => {
    setOpenDropdown(null);
    setLevelMenuOpen(false);
    setNotifMenuOpen(false);
    setProfileMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllMenus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        closeAllMenus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Isolated prototype routes render their own standalone header preview
  if (pathname.startsWith("/prototype/")) {
    return null;
  }

  // Distraction-free exam room header on active attempt (/mock-exams/[attemptId])
  const isExamAttempt = pathname.startsWith("/mock-exams/") && pathname !== "/mock-exams";

  if (isExamAttempt) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg bg-[#B9343F] text-white font-bold flex items-center justify-center text-sm shadow-sm"
              style={{ fontFamily: "var(--font-japanese), sans-serif" }}
            >
              日
            </span>
            <span className="font-bold text-[#1F2937] tracking-tight text-lg">
              JLPT MASTER{" "}
              <span className="text-xs text-[#B9343F] font-semibold uppercase tracking-wider ml-1">
                Phòng thi {selectedLevel}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFurigana}
            className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              showFurigana
                ? "bg-[#FBEBEB] text-[#B9343F] border-[#B9343F]/30"
                : "bg-gray-100 text-[#6B7280] border-[#E5E7EB]"
            }`}
          >
            振 Furigana: {showFurigana ? "BẬT" : "TẮT"}
          </button>
        </div>
      </header>
    );
  }

  const activeSection = getActiveSectionFromPathname(pathname);

  return (
    <header
      ref={navContainerRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 h-14 md:h-16 flex items-center justify-between gap-2 lg:gap-3">
        {/* LEFT ZONE: Brand Identity + JLPT Level Selector */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 min-w-0">
          <Link
            href="/"
            onClick={closeAllMenus}
            className="flex items-center gap-2 min-h-[40px] md:min-h-[44px] pr-0.5 rounded-lg shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2 group"
          >
            <span
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#B9343F] group-hover:bg-[#A02731] text-white font-bold flex items-center justify-center text-sm sm:text-base shadow-sm shrink-0 transition-colors"
              style={{ fontFamily: "var(--font-japanese), sans-serif" }}
            >
              日
            </span>
            <div className="leading-tight shrink-0">
              <span className="font-bold text-[#1F2937] tracking-tight text-sm sm:text-base xl:text-lg block whitespace-nowrap">
                JLPT <span className="md:hidden lg:inline">MASTER</span>
              </span>
              <span className="hidden 2xl:block text-[11px] text-[#6B7280] font-medium whitespace-nowrap">
                Học & Luyện thi chuẩn Nhật
              </span>
            </div>
          </Link>

          <span className="h-5 w-px bg-[#E5E7EB] hidden lg:block shrink-0" aria-hidden="true" />

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
              className="h-9 md:h-10 px-2.5 lg:px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F7F7F4] hover:bg-gray-100 text-xs font-semibold text-[#1F2937] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#B9343F] shrink-0" />
              <span className="hidden xl:inline text-[#6B7280] font-medium whitespace-nowrap">
                Cấp độ:
              </span>
              <span className="font-bold text-[#B9343F] whitespace-nowrap">{selectedLevel}</span>
              <ChevronDown
                size={14}
                className={`text-[#6B7280] shrink-0 transition-transform ${
                  levelMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {levelMenuOpen && (
              <div
                id="jlpt-level-menu"
                role="menu"
                aria-label="Danh sách cấp độ JLPT"
                className="absolute left-0 mt-2 w-64 rounded-xl bg-white border border-[#E5E7EB] shadow-lg p-2 z-50"
              >
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
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
                          ? "bg-[#FBEBEB]/70 text-[#1F2937] hover:bg-[#FBEBEB] cursor-pointer"
                          : "opacity-60 cursor-not-allowed text-[#6B7280] bg-gray-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            lvl.active
                              ? "bg-[#B9343F] text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {lvl.code}
                        </span>
                        <span className="text-xs font-semibold">{lvl.name}</span>
                      </div>
                      {lvl.active ? (
                        <span className="text-[11px] font-semibold text-[#B9343F] flex items-center gap-1">
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
                {hasSub ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextOpen = isDropdownOpen ? null : sec.id;
                      closeAllMenus();
                      setOpenDropdown(nextOpen);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        closeAllMenus();
                        setOpenDropdown(sec.id);
                      }
                    }}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    aria-current={isActive ? "page" : undefined}
                    className={`relative h-10 px-1.5 lg:px-2.5 xl:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm flex items-center flex-nowrap whitespace-nowrap shrink-0 gap-1 xl:gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2 ${
                      isActive
                        ? "text-[#B9343F] bg-[#FBEBEB]/60 font-semibold"
                        : "text-[#1F2937] hover:bg-gray-100 font-medium"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={`hidden xl:inline-block shrink-0 ${
                        isActive ? "text-[#B9343F] stroke-[2.2]" : "text-[#6B7280]"
                      }`}
                    />
                    <span className="whitespace-nowrap">{sec.label}</span>
                    <ChevronDown
                      size={13}
                      className={`shrink-0 transition-transform duration-150 ${
                        isDropdownOpen ? "rotate-180 text-[#B9343F]" : "text-[#6B7280]"
                      }`}
                    />
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#B9343F] rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={sec.href}
                    role="button"
                    onClick={closeAllMenus}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative h-10 px-1.5 lg:px-2.5 xl:px-3.5 py-1.5 rounded-lg text-xs lg:text-sm flex items-center flex-nowrap whitespace-nowrap shrink-0 gap-1 xl:gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2 ${
                      isActive
                        ? "text-[#B9343F] bg-[#FBEBEB]/60 font-semibold"
                        : "text-[#1F2937] hover:bg-gray-100 font-medium"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={`hidden xl:inline-block shrink-0 ${
                        isActive ? "text-[#B9343F] stroke-[2.2]" : "text-[#6B7280]"
                      }`}
                    />
                    <span className="whitespace-nowrap">{sec.label}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#B9343F] rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                )}

                {/* Accessible Dropdown Menu */}
                {hasSub && isDropdownOpen && (
                  <div
                    role="menu"
                    aria-label={`Menu ${sec.label}`}
                    className="absolute left-0 mt-2 w-80 rounded-xl bg-white border border-[#E5E7EB] shadow-lg p-2 z-50"
                  >
                    <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        {sec.label} — JLPT {selectedLevel}
                      </span>
                      <span className="text-[11px] text-[#B9343F] font-medium">
                        {sec.subItems?.length} mục
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {sec.subItems?.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            role="menuitem"
                            onClick={closeAllMenus}
                            className={`min-h-[48px] px-3 py-2.5 rounded-lg flex items-start gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] ${
                              isSubActive
                                ? "bg-[#FBEBEB]/70 text-[#B9343F]"
                                : "hover:bg-[#F3F4F6] text-[#1F2937]"
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isSubActive
                                  ? "bg-[#B9343F] text-white"
                                  : "bg-[#F7F7F4] text-[#1F2937] border border-[#E5E7EB]"
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
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBEBEB] text-[#B9343F]">
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6B7280] leading-normal mt-0.5">
                                {sub.description}
                              </p>
                            </div>
                          </Link>
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
            <Link
              href="/admin"
              onClick={closeAllMenus}
              className="hidden lg:inline-flex h-10 px-2.5 xl:px-3 py-1.5 rounded-lg bg-[#E7ECF8] hover:bg-indigo-100 text-[#1D4ED8] text-xs font-semibold items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
            >
              <Shield size={14} className="shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">Quản trị CMS</span>
              <span className="xl:hidden whitespace-nowrap">CMS</span>
            </Link>
          )}

          {/* GUEST STATE: Login & Register CTAs */}
          {role === "guest" ? (
            <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
              <Link
                href="/login"
                onClick={closeAllMenus}
                className="h-9 md:h-10 px-2.5 lg:px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 text-xs lg:text-sm font-semibold text-[#1F2937] flex items-center justify-center whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={closeAllMenus}
                className="h-9 md:h-10 px-2.5 lg:px-4 py-1.5 rounded-lg bg-[#B9343F] hover:bg-[#A02731] text-xs lg:text-sm font-semibold text-white flex items-center justify-center shadow-sm whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2"
              >
                Đăng ký
              </Link>
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
                  aria-label="Thông báo học tập"
                  className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg border border-transparent hover:bg-gray-100 text-[#1F2937] flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2"
                >
                  <Bell size={18} className="shrink-0" />
                  <span
                    className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#B9343F] ring-2 ring-white"
                    aria-hidden="true"
                  />
                </button>

                {notifMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Danh sách thông báo"
                    className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E5E7EB] shadow-lg p-3 z-50 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-[#1F2937]">Thông báo học tập</span>
                      <span className="text-[11px] font-semibold text-[#B9343F] bg-[#FBEBEB] px-2 py-0.5 rounded-full">
                        2 mới
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <Link
                        href="/flashcards"
                        onClick={closeAllMenus}
                        className="block p-2.5 rounded-lg bg-[#FBEBEB]/40 border border-[#FBEBEB] hover:bg-[#FBEBEB]/70 space-y-0.5"
                      >
                        <p className="font-semibold text-[#1F2937]">
                          8 thẻ nhớ SRS N5 đã đến hạn ôn tập
                        </p>
                        <p className="text-[#6B7280]">
                          Duy trì chuỗi 7 ngày học liên tiếp ngay hôm nay.
                        </p>
                      </Link>
                      <Link
                        href="/results/att-01"
                        onClick={closeAllMenus}
                        className="block p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 space-y-0.5"
                      >
                        <p className="font-semibold text-[#1F2937]">
                          Đã lưu kết quả Đề thi thử N5 Số 01
                        </p>
                        <p className="text-[#6B7280]">
                          Điểm ước tính nội bộ: 142 / 180 điểm.
                        </p>
                      </Link>
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
                  className="h-9 md:h-10 pl-1.5 pr-2 lg:pr-2.5 py-1 rounded-lg border border-[#E5E7EB] hover:bg-gray-50 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] focus-visible:ring-offset-2"
                >
                  <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1F2937] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {role === "admin" ? "AD" : "MN"}
                  </span>
                  <div className="hidden xl:block text-left leading-tight shrink-0">
                    <span className="text-xs font-semibold text-[#1F2937] block whitespace-nowrap">
                      {role === "admin" ? "Quản trị viên" : "Minh Nguyễn"}
                    </span>
                    <span className="hidden 2xl:block text-[10px] text-[#6B7280] whitespace-nowrap">
                      {role === "admin" ? "ADMIN • N5–N1" : "Học viên • Mục tiêu N5"}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-[#6B7280] shrink-0" />
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Tùy chọn tài khoản"
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#E5E7EB] shadow-lg p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-[#1F2937]">
                        {role === "admin" ? "admin@jlptmaster.vn" : "minh@jlptmaster.vn"}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        Mục tiêu: JLPT N5 (30 phút/ngày)
                      </p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <Link
                        href="/dashboard"
                        role="menuitem"
                        onClick={closeAllMenus}
                        className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium text-[#1F2937] hover:bg-gray-100 flex items-center gap-2.5"
                      >
                        <User size={15} className="text-[#6B7280]" />
                        Hồ sơ & Lộ trình cá nhân
                      </Link>
                      <Link
                        href="/onboarding"
                        role="menuitem"
                        onClick={closeAllMenus}
                        className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium text-[#1F2937] hover:bg-gray-100 flex items-center gap-2.5"
                      >
                        <Settings size={15} className="text-[#6B7280]" />
                        Cài đặt mục tiêu học tập
                      </Link>

                      {role === "admin" && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          onClick={closeAllMenus}
                          className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold text-[#1D4ED8] bg-[#E7ECF8]/60 hover:bg-[#E7ECF8] flex items-center gap-2.5"
                        >
                          <Shield size={15} />
                          Bảng điều khiển Admin CMS
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <Link
                        href="/login"
                        role="menuitem"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("jlpt_auth_role");
                            localStorage.removeItem("jlpt_auth_email");
                          }
                          closeAllMenus();
                        }}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold text-[#B9343F] hover:bg-[#FBEBEB]/60 flex items-center gap-2.5"
                      >
                        <LogOut size={15} />
                        Đăng xuất
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
