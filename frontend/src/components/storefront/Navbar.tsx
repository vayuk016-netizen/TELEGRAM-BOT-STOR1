"use client";

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  Clock,
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
import { Button } from "@/components/ui/button";

export const StoreNavbar: React.FC = () => {
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();
  const { customer, logout } = useCustomerStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLang = () => {
    setLanguage(language === "km" ? "en" : "km");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { label: t("nav_home"), href: "/" },
    { label: t("nav_products"), href: "/products" },
    { label: t("nav_orders"), href: "/my-orders" },
    { label: t("nav_contact"), href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 transition-colors font-kantumruy-pro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>DIGITAL STORE</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {t("hero_badge")}
            </p>
          </div>
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
                    ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            title="Switch Language"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold transition-all"
          >
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span>{language === "km" ? "🇰🇭 KM" : "🇬🇧 EN"}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </button>

          {/* Customer Auth / User Info */}
          {customer ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/my-orders"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all text-xs"
              >
                {customer.photo_url ? (
                  <img src={customer.photo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-blue-500" />
                )}
                <span className="font-bold text-slate-900 dark:text-white max-w-[100px] truncate">
                  {customer.first_name}
                </span>
                <span className="text-[11px] font-mono text-emerald-500 font-bold ml-1">
                  ${customer.balance?.toFixed(2)}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/my-orders">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex text-xs font-semibold gap-1.5 rounded-xl border-slate-300 dark:border-slate-800"
              >
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>{t("nav_orders")}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                pathname === link.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end items-center">
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-blue-500 flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Telegram Support</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

