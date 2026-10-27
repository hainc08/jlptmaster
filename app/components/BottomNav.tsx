"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Target, Layers, Award } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav in active exam mode
  if (pathname.startsWith("/mock-exams/") && pathname !== "/mock-exams") {
    return null;
  }

  const navItems = [
    { label: "Trang chủ", href: "/dashboard", icon: Home },
    { label: "Học N5", href: "/learn/n5", icon: BookOpen },
    { label: "Luyện tập", href: "/practice", icon: Target },
    { label: "Thẻ nhớ", href: "/flashcards", icon: Layers },
    { label: "Thi thử", href: "/mock-exams", icon: Award },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-2 py-1.5 shadow-lg">
      <div className="grid grid-cols-5 items-center justify-items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg w-full touch-target transition-colors ${
                isActive ? "text-[#B9343F] font-semibold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
