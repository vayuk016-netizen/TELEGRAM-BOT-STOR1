"use client";

import React from "react";
import { MessageCircle, Clock, ShieldCheck, Mail, Send, Sparkles, ExternalLink } from "lucide-react";
import { useLanguageStore } from "@/store/use-language-store";
import { Button } from "@/components/ui/button";

export const StoreContactPage: React.FC = () => {
  const { t } = useLanguageStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          24/7 CUSTOMER CARE
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          {t("nav_contact")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Need help with your subscription or have questions about automated Bakong KHQR delivery?
          Our customer support team is available 24/7 on Telegram.
        </p>
      </div>

      {/* Main Support Card */}
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-950/40 dark:via-slate-900/40 dark:to-slate-900/20 p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30">
          <MessageCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Official Telegram Support
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Click below to start a direct chat with our support manager on Telegram:
          </p>
        </div>

        <div className="pt-2">
          <a
            href="https://t.me/sopha9926"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-all active:scale-95"
          >
            <Send className="h-4 w-4" />
            <span>Chat With Support: @sopha9926</span>
            <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
          </a>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-center">
          <Clock className="h-6 w-6 text-blue-500 mx-auto" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">24/7 Availability</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Our Telegram Bot and automated fulfillment run non-stop 365 days a year.</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-center">
          <ShieldCheck className="h-6 w-6 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Guaranteed Warranty</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">All CapCut, Canva and digital subscription accounts come with full period replacement warranty.</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-center">
          <Sparkles className="h-6 w-6 text-purple-500 mx-auto" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Fast Response</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Average response time under 5 minutes for payment slips or custom team licenses.</p>
        </div>
      </div>
    </div>
  );
};

