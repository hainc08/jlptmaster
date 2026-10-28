"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_SECTIONS,
  SectionId,
  getActiveSectionFromPathname,
} from "./nav-config";
import { X } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname() || "/";
  const [mobileSheetSection, setMobileSheetSection] = useState<SectionId | null>(null);

  // Hide bottom nav on isolated prototype routes and in active exam room mode
  if (pathname.startsWith("/prototype/") || (pathname.startsWith("/mock-exams/") && pathname !== "/mock-exams")) {
    return null;
  }

  const activeSection = getActiveSectionFromPathname(pathname);
  const currentSheetData = NAV_SECTIONS.find((s) => s.id === mobileSheetSection);

  return (
    <>
      {/* Mobile Secondary Navigation Sheet */}
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
            className="w-full bg-white rounded-t-2xl border-t border-[#E5E7EB] p-4 pb-24 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B9343F]">
                  JLPT N5
                </span>
                <h3 className="text-base font-bold text-[#1F2937]">{currentSheetData.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileSheetSection(null)}
                aria-label="Đóng menu"
                className="w-11 h-11 rounded-lg bg-[#F7F7F4] text-[#1F2937] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              {currentSheetData.subItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.id}
                    href={sub.href}
                    onClick={() => setMobileSheetSection(null)}
                    className={`min-h-[52px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 ${
                      isSubActive
                        ? "bg-[#FBEBEB] text-[#B9343F]"
                        : "bg-[#F7F7F4] text-[#1F2937]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSubActive ? "bg-[#B9343F] text-white" : "bg-white text-[#1F2937]"
                        }`}
                      >
                        <SubIcon size={17} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{sub.label}</p>
                        <p className="text-[11px] text-[#6B7280]">{sub.description}</p>
                      </div>
                    </div>
                    {sub.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#B9343F] border border-[#B9343F]/20 shrink-0">
                        {sub.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation with 5 Primary Items */}
      <nav
        aria-label="Điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] px-1.5 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg"
      >
        <div className="grid grid-cols-5 gap-1 items-center">
          {NAV_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            const isSheetOpen = mobileSheetSection === sec.id;

            if (!sec.subItems) {
              return (
                <Link
                  key={sec.id}
                  href={sec.href}
                  role="button"
                  onClick={() => setMobileSheetSection(null)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative min-h-[48px] py-1 px-1 rounded-lg flex flex-col items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] ${
                    isActive ? "text-[#B9343F] font-semibold" : "text-[#6B7280] font-medium"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute top-0 left-3 right-3 h-0.5 bg-[#B9343F] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={19} className={`shrink-0 ${isActive ? "stroke-[2.3]" : "stroke-[1.8]"}`} />
                  <span className="text-[11px] leading-tight mt-1 tracking-tight whitespace-nowrap">{sec.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setMobileSheetSection(isSheetOpen ? null : sec.id)}
                aria-current={isActive ? "page" : undefined}
                aria-expanded={isSheetOpen}
                className={`relative min-h-[48px] py-1 px-1 rounded-lg flex flex-col items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9343F] ${
                  isActive ? "text-[#B9343F] font-semibold" : "text-[#6B7280] font-medium"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-3 right-3 h-0.5 bg-[#B9343F] rounded-full"
                    aria-hidden="true"
                  />
                )}
                <Icon size={19} className={`shrink-0 ${isActive ? "stroke-[2.3]" : "stroke-[1.8]"}`} />
                <span className="text-[11px] leading-tight mt-1 tracking-tight whitespace-nowrap">{sec.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
