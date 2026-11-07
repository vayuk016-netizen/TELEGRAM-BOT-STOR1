"use client";

import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, Sun, Moon, Menu, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/use-language-store";
import { useThemeStore } from "@/store/use-theme-store";
import { useCustomColorStore } from "@/store/use-custom-color-store";
import { useSidebarStore } from "@/store/use-sidebar-store";

interface NotificationItem {
  id: string;
  title: string;
  titleKm: string;
  desc: string;
  descKm: string;
  time: string;
  read: boolean;
  type: "payment" | "order" | "stock";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Bakong KHQR Payment",
    titleKm: "ការទូទាត់ Bakong KHQR",
    desc: "Received $10.00 (Order #SP-1042)",
    descKm: "ទទួលបាន $10.00 (ការបញ្ជាទិញ #SP-1042)",
    time: "5m ago",
    read: false,
    type: "payment",
  },
  {
    id: "2",
    title: "New Order Placed",
    titleKm: "ការបញ្ជាទិញថ្មី",
    desc: "Gemini Pro 6 Months delivered automatically",
    descKm: "Gemini Pro 6 Months បានប្រគល់ជូនដោយស្វ័យប្រវត្តិ",
    time: "20m ago",
    read: false,
    type: "order",
  },
  {
    id: "3",
    title: "Stock Alert",
    titleKm: "ការជូនដំណឹងអំពីស្តុក",
    desc: "CapCut Pro 1 Month has 2 items left",
    descKm: "CapCut Pro 1 Month នៅសល់ 2 ក្នុងស្តុក",
    time: "1h ago",
    read: false,
    type: "stock",
  },
];

export const Topbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { headerBg } = useCustomColorStore();
  const { toggleMobile } = useSidebarStore();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    setMounted(true);
    initTheme();
    try {
      const saved = localStorage.getItem("sp_admin_notifications");
      if (saved !== null) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [initTheme]);

  const saveNotifications = (newList: NotificationItem[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem("sp_admin_notifications", JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const markOneAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const customHeaderBg = theme === "dark" && headerBg ? headerBg : undefined;

  return (
    <header
      className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/85 text-slate-100 px-4 sm:px-6 backdrop-blur-md transition-all duration-300"
      style={customHeaderBg ? { backgroundColor: customHeaderBg } : undefined}
    >
      {/* Mobile / Tablet Hamburger Toggle & Brand (< lg) */}
      <div className="flex items-center gap-2.5 sm:gap-3 lg:hidden">
        <button
          onClick={toggleMobile}
          aria-label="Open navigation menu"
          className="rounded-xl p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-100 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg overflow-hidden bg-white p-0.5 border border-blue-400/20 flex-shrink-0">
            <img src="/logo.png" alt="SP Store" className="h-full w-full object-contain" />
          </div>
          <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-slate-100 hidden sm:inline-block">
            SP STORE
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Theme Toggle Icon Switcher (Day / Night) */}
        <button
          onClick={toggleTheme}
          title={!mounted ? "Loading theme..." : theme === "dark" ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
          className="relative flex h-10 w-16 items-center rounded-full border border-slate-800 bg-slate-900/80 hover:border-blue-500/50 p-1 transition-all duration-300 cursor-pointer active:scale-95 shadow-sm"
        >
          {/* Sliding Knob Indicator */}
          <div
            className={cn(
              "absolute h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/50 shadow-md transition-transform duration-300 ease-out flex items-center justify-center z-10",
              theme === "dark" ? "translate-x-7" : "translate-x-0"
            )}
          >
            {theme === "dark" ? (
              <Moon className="h-3.5 w-3.5 text-white drop-shadow" />
            ) : (
              <Sun className="h-3.5 w-3.5 text-amber-200 drop-shadow" />
            )}
          </div>

          {/* Icon Background Indicators */}
          <div className="flex w-full items-center justify-between px-1.5 pointer-events-none">
            <Sun className={cn("h-4 w-4 transition-colors duration-300", theme === "dark" ? "text-slate-500" : "opacity-0")} />
            <Moon className={cn("h-4 w-4 transition-colors duration-300", theme === "dark" ? "opacity-0" : "text-slate-500")} />
          </div>
        </button>

        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 px-3 py-1.5 transition-all duration-300 cursor-pointer active:scale-95 shadow-sm"
          >
            <div className="relative h-6 w-6 rounded-full overflow-hidden border border-white/20 shadow-sm flex items-center justify-center flex-shrink-0">
              <img
                src={language === "km" ? "/flags/km.png" : "/flags/en.png"}
                alt={language === "km" ? "Khmer Flag" : "UK Flag"}
                className="h-full w-full object-cover scale-110"
              />
            </div>
            <span className="text-xs font-extrabold uppercase text-slate-100">{language}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {langOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setLangOpen(false)} 
              />
              <div className="absolute right-0 mt-2.5 w-40 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-slate-100">
                <button
                  onClick={() => {
                    setLanguage("km");
                    setLangOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer",
                    language === "km"
                      ? "bg-gradient-to-r from-blue-600/20 to-rose-600/20 text-blue-400 border border-blue-500/40 shadow-sm"
                      : "hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                  )}
                >
                  <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                    <img
                      src="/flags/km.png"
                      alt="Khmer Flag"
                      className="h-full w-full object-cover scale-110"
                    />
                  </div>
                  <span>ភាសាខ្មែរ (KM)</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage("en");
                    setLangOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 mt-1 cursor-pointer",
                    language === "en"
                      ? "bg-gradient-to-r from-blue-600/20 to-rose-600/20 text-blue-400 border border-blue-500/40 shadow-sm"
                      : "hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                  )}
                >
                  <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                    <img
                      src="/flags/en.png"
                      alt="UK Flag"
                      className="h-full w-full object-cover scale-110"
                    />
                  </div>
                  <span>English (EN)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notifications Button (Frosted Glass with Clear Contrast & Hover Glow) */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
            title={language === "km" ? "ការជូនដំណឹង" : "Notifications"}
            className="relative group flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800/90 hover:border-blue-500/50 dark:hover:border-blue-400/50 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_4px_16px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_4px_20px_rgba(56,189,248,0.25)]"
          >
            <Bell className="h-4.5 w-4.5 text-[#0f172a] dark:text-white transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-cyan-400" />

            {/* 🔔 Glowing Unread Count Badge (Hidden when 0) */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center pointer-events-none z-20">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-40"></span>
                <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-extrabold text-white shadow-md border-2 border-white dark:border-slate-900">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* Interactive Notifications Popover Dropdown */}
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 text-[#0f172a] dark:text-white">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-extrabold text-sm text-[#0f172a] dark:text-white">
                      {language === "km" ? "ការជូនដំណឹង" : "Notifications"}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-400">
                        {unreadCount} {language === "km" ? "ថ្មី" : "new"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                      >
                        {language === "km" ? "បានអានទាំងអស់" : "Mark read"}
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        {language === "km" ? "សម្អាតទាំងអស់" : "Clear all"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="mt-2.5 space-y-1.5 max-h-80 overflow-y-auto pr-0.5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <div className="h-10 w-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {language === "km" ? "គ្មានការជូនដំណឹងថ្មីទេ" : "All caught up! No notifications"}
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markOneAsRead(item.id)}
                        className={cn(
                          "group relative flex items-start gap-3 rounded-xl p-2.5 transition-all duration-200 cursor-pointer pt-3",
                          !item.read
                            ? "bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            : "hover:bg-slate-100/60 dark:hover:bg-slate-800/50 opacity-75 hover:opacity-100"
                        )}
                      >
                        {/* Type Icon */}
                        <div
                          className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm",
                            item.type === "payment"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : item.type === "order"
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          )}
                        >
                          {item.type === "payment" ? "💰" : item.type === "order" ? "📦" : "⚡"}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-[#0f172a] dark:text-white truncate">
                              {language === "km" ? item.titleKm : item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                            {language === "km" ? item.descKm : item.desc}
                          </p>
                        </div>

                        {/* Dismiss X button */}
                        <button
                          onClick={(e) => removeNotification(item.id, e)}
                          title={language === "km" ? "លុប" : "Dismiss"}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
