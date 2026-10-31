"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Key,
  ShoppingCart,
  Users,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Settings,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { useLanguageStore } from "@/store/use-language-store";
import { useCustomColorStore } from "@/store/use-custom-color-store";
import { useThemeStore } from "@/store/use-theme-store";
import { UserNav } from "./user-nav";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Package,
  Key,
  ShoppingCart,
  CreditCard,
  Users,
  Megaphone,
  Settings,
};

const navItems = [
  { titleKey: "dashboard", href: "/admin", icon: "LayoutDashboard" },
  { titleKey: "products", href: "/admin/products", icon: "Package" },
  { titleKey: "stock_keys", href: "/admin/stock", icon: "Key" },
  { titleKey: "orders", href: "/admin/orders", icon: "ShoppingCart" },
  { titleKey: "payments", href: "/admin/payments", icon: "CreditCard" },
  { titleKey: "users", href: "/admin/users", icon: "Users" },
  { titleKey: "broadcast", href: "/admin/broadcast", icon: "Megaphone" },
  { titleKey: "settings", href: "/admin/settings", icon: "Settings" },
];

function isColorDark(colorHex: string) {
  if (!colorHex) return true;
  const hex = colorHex.replace("#", "");
  if (hex.length !== 6) return true;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 140;
}

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { isOpen, toggle } = useSidebarStore();
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();
  const { sidebarBg } = useCustomColorStore();

  const isDark = sidebarBg ? isColorDark(sidebarBg) : (theme === "dark");

  return (
    <aside
      className={cn(
        "relative flex flex-col transition-all duration-300 z-30 border-r",
        isOpen ? "w-64" : "w-20",
        isDark 
          ? "border-slate-800 bg-slate-950 text-slate-100" 
          : "border-slate-200 bg-white text-slate-100"
      )}
      style={sidebarBg ? { backgroundColor: sidebarBg } : undefined}
    >
      {/* Brand Header */}
      <div className={cn(
        "flex h-20 items-center justify-between px-4 border-b",
        isDark ? "border-slate-800" : "border-slate-200"
      )}>
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white shadow-md shadow-blue-500/20 border border-blue-400/20 transform transition-transform duration-300 hover:rotate-6 flex-shrink-0 p-0.5">
            <img src="/logo.png" alt="SP Store" className="h-full w-full object-contain rounded-lg" />
          </div>
          {isOpen && (
            <span className={cn(
              "font-extrabold text-[13px] uppercase tracking-wider font-sans truncate leading-none mt-0.5",
              isDark ? "text-white" : "text-slate-100"
            )}>
              SP STORE
            </span>
          )}
        </div>
        <button
          onClick={toggle}
          className={cn(
            "rounded-xl p-1.5 border transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0",
            isDark 
              ? "text-slate-400 hover:bg-white/10 hover:text-white border-transparent hover:border-white/10" 
              : "text-slate-400 hover:bg-black/5 hover:text-slate-100 border-transparent hover:border-slate-200"
          )}
        >
          {isOpen ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-2 p-3.5">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || Package;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ease-out transform active:scale-[0.98] border",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-blue-500 scale-[1.01]"
                  : isDark
                    ? "bg-white/5 text-white/60 hover:bg-white/10 border-white/5 hover:border-blue-500/40 hover:scale-[1.01]"
                    : "bg-black/[0.03] text-slate-300 hover:bg-black/[0.07] border-black/5 hover:border-blue-500/40 hover:scale-[1.01]"
              )}
            >
              {/* Active Ambient Glow Effect */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-sm pointer-events-none" />
              )}

              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                  isActive
                    ? "text-white"
                    : isDark
                      ? "text-white/60 group-hover:text-white"
                      : "text-slate-400 group-hover:text-slate-100"
                )}
              />
              {isOpen && (
                <span
                  className={cn(
                    "transition-colors duration-300 tracking-wide font-semibold",
                    isActive 
                      ? "text-white font-bold" 
                      : isDark
                        ? "text-white/60 group-hover:text-white"
                        : "text-slate-300 group-hover:text-slate-100"
                  )}
                >
                  {t(item.titleKey)}
                </span>
              )}
            </Link>
          );
        })}

        {/* View Storefront Link */}
        <Link
          to="/"
          className={cn(
            "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 mt-4 border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10",
            !isOpen && "justify-center px-0"
          )}
        >
          <span className="text-sm">🛍️</span>
          {isOpen && <span>View Live Store</span>}
        </Link>
      </nav>

      {/* User profile / UserNav at the bottom */}
      <div className={cn(
        "p-3.5 border-t",
        isDark ? "border-slate-800/80" : "border-slate-200"
      )}>
        <UserNav isDark={isDark} />
      </div>
    </aside>
  );
};
