"use client";

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Sun,
  Moon,
  Globe,
  Menu,
  X,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import { useLanguageStore } from "@/store/use-language-store";
import { useThemeStore } from "@/store/use-theme-store";
import { useCustomerStore } from "@/store/use-customer-store";

export const StoreNavbar: React.FC = () => {
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const { customer, logout } = useCustomerStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLang = () => {
    setLanguage(language === "km" ? "en" : "km");
  };

  const navLinks = [
    { label: t("nav_home"), href: "/" },
    { label: t("nav_products"), href: "/products" },
    { label: t("nav_contact"), href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-slate-800 bg-slate-950/80 transition-colors font-kantumruy-pro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl overflow-hidden bg-white border border-blue-500/30 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform flex-shrink-0 p-0.5 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="SP Store"
              className="h-full w-full object-contain rounded-xl"
            />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-100">
            SP STORE
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/20 to-rose-600/20 text-blue-400 font-bold border border-blue-500/40 shadow-sm shadow-blue-500/10 filter brightness-105"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher (Desktop) */}
          <button
            onClick={toggleLang}
            title="Switch Language"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-100 text-xs font-bold transition-all shadow-sm"
          >
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>{language === "km" ? "🇰🇭 KM" : "🇬🇧 EN"}</span>
          </button>

          {/* Night / Day Mode Toggle (Desktop) */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-xs font-bold text-slate-100 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            {theme === "dark" ? (
              <>
                <Moon className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline text-[11px] text-slate-100 font-semibold">Night</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline text-[11px] text-slate-100 font-semibold">Day</span>
              </>
            )}
          </button>

          {/* Customer Auth / User Info (Desktop / Tablet) */}
          {customer && (
            <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-800">
              <Link
                to="/my-orders"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all text-xs"
              >
                {customer.photo_url ? (
                  <img src={customer.photo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-blue-400" />
                )}
                <span className="font-bold text-slate-100 max-w-[100px] truncate">
                  {customer.first_name}
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold ml-1">
                  ${customer.balance?.toFixed(2)}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 active:scale-95 transition-transform"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Customer Profile & Balance (Mobile) */}
          {customer && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm">
              <Link
                to="/my-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                {customer.photo_url ? (
                  <img src={customer.photo_url} alt="" className="h-9 w-9 rounded-full object-cover border border-slate-700" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block font-bold text-sm text-slate-100 truncate">
                    {customer.first_name}
                  </span>
                  <span className="block text-xs font-mono text-emerald-400 font-bold">
                    Balance: ${customer.balance?.toFixed(2)}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-all filter ${
                  pathname === link.href
                    ? "bg-gradient-to-r from-blue-600 to-rose-600 text-white font-bold shadow-md shadow-blue-500/20 brightness-105"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Quick Controls: Language & Theme Toggle (Mobile Menu Drawer) */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-100 text-xs font-bold transition-all shadow-sm active:scale-95 min-h-[42px]"
            >
              <Globe className="h-4 w-4 text-blue-400" />
              <span>{language === "km" ? "🇰🇭 KM (ភាសាខ្មែរ)" : "🇬🇧 EN (English)"}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-xs font-bold text-slate-100 transition-all cursor-pointer active:scale-95 shadow-sm min-h-[42px]"
            >
              {theme === "dark" ? (
                <>
                  <Moon className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-100 font-semibold">Night Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-slate-100 font-semibold">Day Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center px-1">
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-blue-400 flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Telegram Support</span>
            </Link>
            <span className="text-[10px] text-slate-500 font-mono">
              v1.0.0
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

