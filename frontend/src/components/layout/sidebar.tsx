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
  X,
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

export const Sidebar: React.FC = () => {
  const { pathname } = useLocation();
  const { isOpen, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();
  const { sidebarBg } = useCustomColorStore();

  // Custom colors only apply in Dark mode to avoid corrupting Day Mode
  const customBg = theme === "dark" && sidebarBg ? sidebarBg : undefined;

  const renderNavLinks = (isDrawer: boolean) => (
    <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = iconMap[item.icon] || Package;
        const isActive = pathname === item.href;
        const showLabel = isDrawer || isOpen;

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => isDrawer && closeMobile()}
            className={cn(
              "group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 ease-out transform active:scale-[0.98] border",
              isActive
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-rose-500/25 border-white/20 filter brightness-105 scale-[1.01]"
                : "bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-100 border-slate-800/80 hover:border-blue-500/40 hover:scale-[1.01]"
            )}
          >
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-blue-500/10 blur-sm pointer-events-none" />
            )}

            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110",
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-blue-500"
              )}
            />
            {showLabel && (
              <span
                className={cn(
                  "transition-colors duration-300 tracking-wide truncate",
                  isActive
                    ? "text-white font-bold"
                    : "text-slate-300 group-hover:text-slate-100 font-semibold"
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
        onClick={() => isDrawer && closeMobile()}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 mt-4 border border-blue-500/20 bg-blue-500/5 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10",
          !isDrawer && !isOpen && "justify-center px-0"
        )}
      >
        <span className="text-sm">🛍️</span>
        {(isDrawer || isOpen) && <span>View Live Store</span>}
      </Link>
    </nav>
  );

  return (
    <>
      {/* 1. Mobile & Tablet Slide-Over Drawer (< lg) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={closeMobile}
          />

          {/* Drawer Pane */}
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] border-r border-slate-800 bg-slate-950 text-slate-100 shadow-2xl animate-in slide-in-from-left duration-300"
            style={customBg ? { backgroundColor: customBg } : undefined}
          >
            {/* Drawer Header */}
            <div className="flex h-20 items-center justify-between px-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white shadow-md shadow-blue-500/20 border border-blue-400/20 p-0.5">
                  <img src="/logo.png" alt="SP Store" className="h-full w-full object-contain rounded-lg" />
                </div>
                <div>
                  <span className="font-extrabold text-sm uppercase tracking-wider block text-slate-100">
                    SP STORE
                  </span>
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold">Admin Portal</span>
                </div>
              </div>
              <button
                onClick={closeMobile}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Links */}
            {renderNavLinks(true)}

            {/* User Profile */}
            <div className="p-3.5 border-t border-slate-800">
              <UserNav showDetails={true} />
            </div>
          </aside>
        </div>
      )}

      {/* 2. Desktop Sidebar (>= lg) */}
      <aside
        className={cn(
          "relative hidden lg:flex flex-col transition-all duration-300 z-30 border-r border-slate-800 bg-slate-950 text-slate-100",
          isOpen ? "w-64" : "w-20"
        )}
        style={customBg ? { backgroundColor: customBg } : undefined}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-white shadow-md shadow-blue-500/20 border border-blue-400/20 transform transition-transform duration-300 hover:rotate-6 flex-shrink-0 p-0.5">
              <img src="/logo.png" alt="SP Store" className="h-full w-full object-contain rounded-lg" />
            </div>
            {isOpen && (
              <span className="font-extrabold text-[13px] uppercase tracking-wider font-sans truncate leading-none mt-0.5 text-slate-100">
                SP STORE
              </span>
            )}
          </div>
          <button
            onClick={toggle}
            className="rounded-xl p-1.5 border border-slate-800/80 bg-slate-900/60 text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-all duration-200 cursor-pointer active:scale-95 flex-shrink-0"
          >
            {isOpen ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Navigation List */}
        {renderNavLinks(false)}

        {/* User profile / UserNav at the bottom */}
        <div className="p-3.5 border-t border-slate-800">
          <UserNav showDetails={isOpen} />
        </div>
      </aside>
    </>
  );
};
