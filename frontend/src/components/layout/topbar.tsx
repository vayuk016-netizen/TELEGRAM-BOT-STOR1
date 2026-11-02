"use client";

import React, { useState } from "react";
import { Bell, ChevronDown, Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/use-language-store";
import { useThemeStore } from "@/store/use-theme-store";
import { useCustomColorStore } from "@/store/use-custom-color-store";
import { useSidebarStore } from "@/store/use-sidebar-store";

export const Topbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { headerBg } = useCustomColorStore();
  const { toggleMobile } = useSidebarStore();
  const [langOpen, setLangOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    initTheme();
  }, [initTheme]);

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

        {/* Notifications */}
        <button
          className="relative rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 p-2 text-slate-400 hover:text-slate-100 transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
            3
          </span>
        </button>
      </div>
    </header>
  );
};
