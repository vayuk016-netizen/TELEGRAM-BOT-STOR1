"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { settingsService } from "@/services/settings.service";
import { useLanguageStore } from "@/store/use-language-store";
import { useThemeStore } from "@/store/use-theme-store";
import { useCustomColorStore } from "@/store/use-custom-color-store";
import { Bot, Save, Eye, EyeOff, AlertCircle, CheckCircle2, Sun, Moon, Palette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { theme, setTheme } = useThemeStore();
  const { sidebarBg, headerBg, setSidebarBg, setHeaderBg, resetColors } = useCustomColorStore();

  const { t, language } = useLanguageStore();
  const isKh = language === "km";

  const getErrorMessage = (err: any, fallback: string) => {
    if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
      return isKh
        ? "កំហុសបណ្តាញ៖ មិនអាចភ្ជាប់ទៅកាន់ Backend API (http://localhost:8000) បានទេ។ សូមប្រាកដថាអ្នកបានដំណើរការ backend Server (npm run dev:backend)។"
        : "Network Error: Cannot connect to backend server at http://localhost:8000. Please make sure the backend is running (`npm run dev:backend`).";
    }
    return err.response?.data?.detail || err.message || fallback;
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setBotToken(data.bot_token);
      } catch (err: any) {
        const errMsg = getErrorMessage(err, t("fail_load"));
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [t, isKh]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await settingsService.updateSettings({
        bot_token: botToken,
      });
      setSuccess(t("success_save"));
    } catch (err: any) {
      const errMsg = getErrorMessage(err, t("fail_save"));
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl space-y-6 pb-12 font-kantumruy-pro">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">System Settings</h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Configure bot credentials and server environment.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-lg animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-slate-800" />
          <div className="h-10 w-full rounded bg-slate-800" />
          <div className="h-10 w-28 rounded bg-slate-800" />
        </div>
      </div>
    );
  }

  const customColorPresets = [
    { name: "Default", sidebar: "", header: "" },
    { name: "Navy Blue", sidebar: "#0b132b", header: "#0b132b" },
    { name: "Cyber Purple", sidebar: "#1a0f30", header: "#1a0f30" },
    { name: "Forest Green", sidebar: "#0b251a", header: "#0b251a" },
    { name: "Deep Maroon", sidebar: "#250b11", header: "#250b11" },
  ];

  return (
    <div className="max-w-6xl space-y-8 pb-12 font-kantumruy-pro">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
          {isKh ? "ការកំណត់ប្រព័ន្ធ" : "System Settings"}
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {isKh ? "គ្រប់គ្រងព័ត៌មាន Bot Telegram និងការកំណត់គណនីទូទាត់ប្រាក់" : "Configure bot credentials and payment settings."}
        </p>
      </div>

      {/* Bot & Payment Configuration Form */}
      <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
            <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Bot Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {isKh ? "កំណត់ Bot Telegram" : "Telegram Bot Configuration"}
              </h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
                {isKh ? "លេខកូដសម្ងាត់ Bot (Bot Token)" : "Telegram Bot Token"}
              </label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="pr-10 h-11 bg-slate-950/80 border-slate-800 focus:border-blue-500 text-sm font-mono text-gray-900 dark:text-slate-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 pl-1">
                {isKh ? "ទទួលបានពី Telegram @BotFather។ សូមរក្សាទុកវាជាសម្ងាត់។" : "Obtained from @BotFather. Keep this token secret."}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 px-8 text-xs font-semibold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/10 rounded-lg transition-all"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isKh ? "កំពុងរក្សាទុក..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isKh ? "រក្សាទុកការកំណត់" : "Save Configuration"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* 🎨 Section 2: Sidebar & Header Color Settings */}
      <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Palette className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                {isKh ? "ការរចនាពណ៌ផ្ទៃខាងក្រោយ (Sidebar & Header)" : "Sidebar & Header Customization"}
              </h2>
              <p className="text-[10px] text-gray-500 dark:text-slate-500">
                {isKh ? "ប្ដូរពណ៌របារចំហៀង និងរបារខាងលើទៅតាមចំណូលចិត្តរបស់អ្នក" : "Personalize the background colors of your navigation layout."}
              </p>
            </div>
          </div>
          <button
            onClick={resetColors}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 rounded-lg transition-colors cursor-pointer active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{isKh ? "កំណត់ឡើងវិញ" : "Reset to Defaults"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Sidebar Background Color Pick */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              {isKh ? "ពណ៌ផ្ទៃរបារចំហៀង (Sidebar Background)" : "Sidebar Background"}
            </label>
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center h-11 w-11 rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <input
                  type="color"
                  value={sidebarBg || (theme === "dark" ? "#090d16" : "#ffffff")}
                  onChange={(e) => setSidebarBg(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
                />
                <div 
                  className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                  style={{ backgroundColor: sidebarBg || (theme === "dark" ? "#090d16" : "#ffffff") }}
                />
              </div>
              <Input
                type="text"
                value={sidebarBg || (theme === "dark" ? "#090d16" : "#ffffff")}
                onChange={(e) => setSidebarBg(e.target.value)}
                placeholder="#020617"
                className="h-11 max-w-[140px] bg-slate-950/80 border-slate-800 focus:border-blue-500 text-sm font-mono text-gray-900 dark:text-slate-100 uppercase"
              />
            </div>
          </div>

          {/* Header Background Color Pick */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              {isKh ? "ពណ៌ផ្ទៃរបារខាងលើ (Header Background)" : "Header Background"}
            </label>
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center h-11 w-11 rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <input
                  type="color"
                  value={headerBg || (theme === "dark" ? "#090d16" : "#ffffff")}
                  onChange={(e) => setHeaderBg(e.target.value)}
                  className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer opacity-0"
                />
                <div 
                  className="w-7 h-7 rounded-lg border border-white/20 shadow-sm"
                  style={{ backgroundColor: headerBg || (theme === "dark" ? "#090d16" : "#ffffff") }}
                />
              </div>
              <Input
                type="text"
                value={headerBg || (theme === "dark" ? "#090d16" : "#ffffff")}
                onChange={(e) => setHeaderBg(e.target.value)}
                placeholder="#020617"
                className="h-11 max-w-[140px] bg-slate-950/80 border-slate-800 focus:border-blue-500 text-sm font-mono text-gray-900 dark:text-slate-100 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isKh ? "ពណ៌រចនាគំរូរហ័ស" : "Quick Color Presets"}
          </span>
          <div className="flex flex-wrap gap-2">
            {customColorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  if (preset.sidebar === "") {
                    resetColors();
                  } else {
                    setSidebarBg(preset.sidebar);
                    setHeaderBg(preset.header);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950 transition-all cursor-pointer active:scale-95",
                  (sidebarBg === preset.sidebar && headerBg === preset.header) && "border-blue-500 text-blue-400 bg-blue-600/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                )}
              >
                {preset.sidebar ? (
                  <div className="flex gap-1">
                    <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: preset.sidebar }} />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-slate-600 to-slate-400 border border-white/10" />
                )}
                <span>{isKh && preset.name === "Default" ? "លំនាំដើម" : preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
