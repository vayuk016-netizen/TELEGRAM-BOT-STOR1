"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, MessageCircle, ShieldCheck, Zap, Heart } from "lucide-react";
import { useLanguageStore } from "@/store/use-language-store";

export const StoreFooter: React.FC = () => {
  const { t } = useLanguageStore();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 font-kantumruy-pro pt-14 pb-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                DIGITAL STORE KH
              </span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              {t("hero_subtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Zap className="h-3 w-3" /> 24/7 Automated Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> 100% Genuine Licenses
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("nav_products")}
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/products" className="hover:text-blue-500 transition-colors">
                  {t("nav_products")}
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-blue-500 transition-colors">
                  {t("nav_orders")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-500 transition-colors">
                  {t("nav_contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Support & Telegram */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t("nav_contact")}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Need assistance or custom account setup? Contact our 24/7 support team directly on Telegram:
            </p>
            <a
              href="https://t.me/sopha9926"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>@sopha9926</span>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} {t("copyright")}</p>
          <div className="flex items-center gap-2">
            <span>Powered by Telegram Bot & Bakong KHQR</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

