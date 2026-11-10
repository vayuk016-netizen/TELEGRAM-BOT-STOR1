"use client";

import React, { useState, useRef } from "react";
import {
  Send,
  Image as ImageIcon,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileImage,
  FileVideo,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/user.service";

export default function BroadcastPage() {
  // Form states
  const [title, setTitle] = useState<string>("");
  const [targetType, setTargetType] = useState<"users" | "group" | "both">("users");
  const [groupChatId, setGroupChatId] = useState<string>("");
  const [messageText, setMessageText] = useState<string>(
    "🎉 <b>ឳកាសពិសេស! (PROMO ANNOUNCEMENT)</b>\n\n" +
      "បញ្ចុះតម្លៃ 20% លើគ្រប់អាខោន <b>CapCut Pro</b> និង <b>Canva Pro</b> ថ្ងៃនេះ!\n" +
      "សូមចូលទៅកាន់ម៉ឺនុយ 🛍️ <b>ផលិតផល</b> ដើម្បីបញ្ជាទិញឥឡូវនេះ!"
  );
  
  // Date & Time states
  const [hour, setHour] = useState<string>("12");
  const [minute, setMinute] = useState<string>("00");
  const [ampm, setAmpm] = useState<string>("AM");
  const [dateStr, setDateStr] = useState<string>("");
  
  const [intervalDelay, setIntervalDelay] = useState<number>(3);
  const [imagePath, setImagePath] = useState<string>("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>("");

  // UI operation states
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single-Bubble Caption Calculation
  const hasMedia = Boolean(imagePath || localPreviewUrl);
  const titleFormattedLen = title.trim() ? title.trim().length + 11 : 0; // <b>Title</b>\n\n
  const effectiveLength = titleFormattedLen + messageText.length;
  const fitsSingleBubble = !hasMedia || effectiveLength <= 1024;
  const overflowChars = effectiveLength - 1024;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Auto-Fit to 1 Telegram Bubble
  const handleAutoFitToSingleBubble = () => {
    let text = messageText;
    let curTitle = title.trim();

    // 1. Check if title is duplicated in first line of text
    if (curTitle) {
      const firstLine = text.split("\n")[0].trim().toLowerCase();
      const cleanTitle = curTitle.toLowerCase().replace(/[^a-zA-Z0-9\u1780-\u17ff]/g, "");
      const cleanFirst = firstLine.replace(/[^a-zA-Z0-9\u1780-\u17ff]/g, "");
      if (cleanTitle && cleanFirst.includes(cleanTitle)) {
        setTitle("");
        curTitle = "";
      }
    }

    // 2. Compress 3+ newlines to 2
    text = text.replace(/\n{3,}/g, "\n\n");

    // 3. Compress double newlines before list items / bullet points / emojis
    text = text.replace(/\n\n(?=[✅\-\*•▶️🔥✨⏳💸💬📩🤖🪩📲🌟\d+\.])/g, "\n");

    // 4. If still over 1024, compress all \n\n to \n
    let effLen = (curTitle ? curTitle.length + 11 : 0) + text.length;
    if (effLen > 1024) {
      text = text.replace(/\n{2,}/g, "\n");
    }

    // 5. Remove redundant duplicate feature blocks if present
    effLen = (curTitle ? curTitle.length + 11 : 0) + text.length;
    if (effLen > 1024) {
      const whyIdx = text.search(/🔥\s*WHY CHOOSE/i);
      if (whyIdx !== -1) {
        const valIdx = text.search(/⏳\s*VALIDITY/i);
        if (valIdx !== -1 && valIdx > whyIdx) {
          text = text.substring(0, whyIdx).trim() + "\n\n" + text.substring(valIdx).trim();
        }
      }
    }

    // 6. Trim trailing whitespace
    text = text.trim();
    effLen = (curTitle ? curTitle.length + 11 : 0) + text.length;
    if (effLen > 1024) {
      text = text.substring(0, 1024 - (curTitle ? curTitle.length + 11 : 0)).trim();
    }

    setMessageText(text);
    showToast("✨ Auto-Fit complete! Content condensed to fit in 1 single Telegram bubble.", "success");
  };

  // Image Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setFileError("Only image or video files are allowed.");
      return;
    }

    setFileError("");
    setUploadingImage(true);
    setLocalPreviewUrl(URL.createObjectURL(file));

    try {
      const res = await userService.uploadBroadcastImage(file);
      setImagePath(res.image_path);
      showToast(`${isVideo ? "Video" : "Image"} uploaded successfully!`);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to upload media file. Please try again.";
      setFileError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // Parse hour/minute/ampm/date into ISO UTC Datetime string
  const getScheduledDateTimeISO = (): string | null => {
    if (!dateStr) return null;

    const [year, month, day] = dateStr.split("-").map(Number);
    let hr = Number(hour);
    const min = Number(minute);

    if (ampm === "PM" && hr < 12) hr += 12;
    if (ampm === "AM" && hr === 12) hr = 0;

    const localDate = new Date(year, month - 1, day, hr, min, 0);
    return localDate.toISOString();
  };

  // Handle Send Now (Immediate)
  const handleSendNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      showToast("Please write a message content.", "error");
      return;
    }

    if ((targetType === "group" || targetType === "both") && !groupChatId.trim()) {
      showToast("Please enter a Telegram Group / Channel Chat ID (e.g. -100xxxxxxxxxx or @channel)", "error");
      return;
    }

    const targetDesc = targetType === "group"
      ? `Telegram Group (${groupChatId.trim()})`
      : targetType === "both"
      ? `ALL Bot Users AND Telegram Group (${groupChatId.trim()})`
      : "ALL Telegram bot users (Direct Messages)";

    if (!confirm(`Are you sure you want to broadcast this message to ${targetDesc} immediately?`)) {
      return;
    }

    setLoading(true);
    try {
      await userService.sendImmediateBroadcast({
        title: title.trim() || undefined,
        message_text: messageText,
        interval_delay: intervalDelay,
        image_path: imagePath || undefined,
        target_type: targetType,
        group_chat_id: (targetType === "group" || targetType === "both") ? groupChatId.trim() : undefined,
      });

      showToast("Immediate broadcast started in the background!");
      // Reset form (except delay / template text)
      setTitle("");
      setImagePath("");
      setLocalPreviewUrl("");
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to initiate immediate broadcast.";
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      showToast("Please write a message.", "error");
      return;
    }
    if ((targetType === "group" || targetType === "both") && !groupChatId.trim()) {
      showToast("Please enter a Telegram Group / Channel Chat ID (e.g. -100xxxxxxxxxx or @channel)", "error");
      return;
    }
    if (!dateStr) {
      showToast("Please select a date for scheduling.", "error");
      return;
    }

    const isoDateTime = getScheduledDateTimeISO();
    if (!isoDateTime) {
      showToast("Invalid date/time configured.", "error");
      return;
    }

    // Ensure scheduled date is in the future
    if (new Date(isoDateTime) <= new Date()) {
      showToast("Scheduled time must be in the future.", "error");
      return;
    }

    setLoading(true);
    try {
      await userService.scheduleBroadcast({
        title: title.trim() || undefined,
        message_text: messageText,
        scheduled_at: isoDateTime,
        interval_delay: intervalDelay,
        image_path: imagePath || undefined,
        target_type: targetType,
        group_chat_id: (targetType === "group" || targetType === "both") ? groupChatId.trim() : undefined,
      });

      showToast("Broadcast scheduled successfully!");
      // Reset form
      setTitle("");
      setImagePath("");
      setLocalPreviewUrl("");
      setDateStr("");
      setHour("12");
      setMinute("00");
      setAmpm("AM");
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to schedule broadcast.";
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 pb-12">
      {/* Top Banner Message */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-2xl transition-all duration-300 max-w-sm ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Console card */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 p-6 md:p-8 shadow-sm dark:shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Send className="h-5 w-5 text-blue-500 transform -rotate-12" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a] dark:text-slate-100">Broadcast Message</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Send or schedule messages with pictures to all active bot users or Telegram Groups.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-4 py-3 text-sm text-[#0f172a] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* 🎯 Target Audience / Destination Selector */}
          <div className="space-y-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/60 p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0f172a] dark:text-slate-200 flex items-center gap-1.5">
                <span>🎯 Target Destination (គោលដៅផ្ញើសារ)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {targetType === "users" ? "Direct Messages (1-on-1)" : targetType === "group" ? "Telegram Group / Channel" : "Users + Group"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: All Bot Users */}
              <button
                type="button"
                onClick={() => setTargetType("users")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  targetType === "users"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-blue-400 shadow-2xs"
                }`}
              >
                <span>👥</span>
                <span>All Bot Users (DM)</span>
              </button>

              {/* Option 2: Telegram Group / Channel */}
              <button
                type="button"
                onClick={() => setTargetType("group")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  targetType === "group"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-blue-400 shadow-2xs"
                }`}
              >
                <span>📢</span>
                <span>Telegram Group</span>
              </button>

              {/* Option 3: Both */}
              <button
                type="button"
                onClick={() => setTargetType("both")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  targetType === "both"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-blue-400 shadow-2xs"
                }`}
              >
                <span>🌐</span>
                <span>Both (Users & Group)</span>
              </button>
            </div>

            {/* Group Chat ID input if Group or Both is selected */}
            {(targetType === "group" || targetType === "both") && (
              <div className="space-y-1.5 pt-2 border-t border-gray-200 dark:border-slate-800/80 animate-in fade-in duration-200">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Telegram Group / Channel Chat ID</span>
                  <span className="text-[10px] text-slate-400">Example: -100xxxxxxxxxx or @channel_username</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. -1002485960142 or @channel_username"
                  value={groupChatId}
                  onChange={(e) => setGroupChatId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-[#0f172a] dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-md border border-amber-500/20 leading-relaxed">
                  ⚠️ <b>សំខាន់:</b> សូម Add Bot ចូលទៅក្នុង Telegram Group / Channel របស់អ្នក និង Promote ជា <b>Admin</b> ឬបើកសិទ្ធិ <b>Send Messages</b> ដល់ Bot ជាមុនសិន ទើប Bot អាចផ្ញើសារចូលបាន។
                </p>
              </div>
            )}
          </div>

          {/* Message Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0f172a] dark:text-slate-200 flex items-center gap-1.5">
                <span>Message Content (អត្ថបទសារ)</span>
              </label>
              {hasMedia && (
                <div className="flex items-center gap-2">
                  {fitsSingleBubble ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Fits 1 Bubble ({effectiveLength}/1024)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAutoFitToSingleBubble}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm transition animate-pulse cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Auto-Fit 1 Bubble (+{overflowChars} over)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <textarea
              placeholder="Write message..."
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 p-4 text-sm text-[#0f172a] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all tracking-normal"
              style={{ fontFamily: 'var(--font-kantumruy-pro), sans-serif' }}
            />

            {/* Bubble Status Banner */}
            {hasMedia ? (
              <div
                className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  fitsSingleBubble
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                }`}
              >
                <div className="flex items-start sm:items-center gap-2">
                  {fitsSingleBubble ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5 sm:mt-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5 sm:mt-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {fitsSingleBubble
                        ? "✅ Fits in 1 Single Bubble (រូបភាព និង អក្សរនៅក្នុងសារតែមួយ)"
                        : `⚠️ Telegram 1024-Char Caption Limit Exceeded (+${overflowChars} chars over)`}
                    </span>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      {fitsSingleBubble
                        ? `Caption length is ${effectiveLength} / 1024 chars. Telegram will deliver photo + text combined in ONE single bubble.`
                        : `Telegram strictly limits photo captions to 1,024 characters. Without Auto-Fit, Telegram splits this into 2 separate messages! Click "Auto-Fit 1 Bubble" to combine them into 1 bubble.`}
                    </p>
                  </div>
                </div>

                {!fitsSingleBubble && (
                  <Button
                    type="button"
                    onClick={handleAutoFitToSingleBubble}
                    size="sm"
                    className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-Fit 1 Bubble</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                <span>Supports HTML tags: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;a href="..."&gt;link&lt;/a&gt;</span>
                <span className={`font-mono font-medium ${messageText.length > 4096 ? "text-rose-500 font-bold" : ""}`}>
                  {messageText.length} / 4096 chars
                </span>
              </div>
            )}
          </div>

          {/* Time / Date scheduling selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Hour */}
            <div>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-3 text-sm text-[#0f172a] dark:text-slate-100 shadow-2xs focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hr) => (
                  <option key={hr} value={hr} className="bg-white dark:bg-slate-950 text-[#0f172a] dark:text-slate-100">
                    {hr}
                  </option>
                ))}
              </select>
            </div>

            {/* Minute */}
            <div>
              <select
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-3 text-sm text-[#0f172a] dark:text-slate-100 shadow-2xs focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((min) => (
                  <option key={min} value={min} className="bg-white dark:bg-slate-950 text-[#0f172a] dark:text-slate-100">
                    {min}
                  </option>
                ))}
              </select>
            </div>

            {/* AM/PM */}
            <div>
              <select
                value={ampm}
                onChange={(e) => setAmpm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-3 text-sm text-[#0f172a] dark:text-slate-100 shadow-2xs focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
              >
                <option value="AM" className="bg-white dark:bg-slate-950 text-[#0f172a] dark:text-slate-100">AM</option>
                <option value="PM" className="bg-white dark:bg-slate-950 text-[#0f172a] dark:text-slate-100">PM</option>
              </select>
            </div>

            {/* Datepicker */}
            <div className="relative">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-3 pr-8 text-sm text-[#0f172a] dark:text-slate-100 shadow-2xs focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Delay Settings */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Interval Delay between sends (seconds)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={intervalDelay}
              onChange={(e) => setIntervalDelay(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-4 py-3 text-sm text-[#0f172a] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:border-blue-500/50 focus:outline-none transition-all"
            />
          </div>

          {/* Upload Area */}
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*,video/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadingImage}
            />
            
            {!imagePath ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 dark:border-slate-800 dark:hover:border-slate-700 bg-gray-50/70 hover:bg-gray-100/70 dark:bg-slate-950/40 dark:hover:bg-slate-950/70 py-4 px-6 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                  uploadingImage ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                )}
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {uploadingImage ? "Uploading media..." : "Upload image or video (optional)"}
                </span>
              </div>
            ) : (
              (() => {
                const isAttachedVideo = imagePath && [".mp4", ".mov", ".avi", ".webm", ".mkv", ".3gp"].some(ext => imagePath.toLowerCase().endsWith(ext));
                const fullMediaUrl = localPreviewUrl || (imagePath.startsWith("http") ? imagePath : (typeof window !== "undefined" ? `${window.location.origin}${imagePath}` : imagePath));

                return (
                  <div className="relative rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 p-4 space-y-4 shadow-sm dark:shadow-xl">
                    {/* Header info & remove button */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        {isAttachedVideo ? (
                          <FileVideo className="h-5 w-5 text-rose-500 animate-pulse" />
                        ) : (
                          <FileImage className="h-5 w-5 text-blue-500" />
                        )}
                        <span className="text-xs font-bold text-[#0f172a] dark:text-slate-100">
                          {isAttachedVideo ? "📹 Video Attachment" : "🖼️ Image Attachment"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setImagePath("");
                          setLocalPreviewUrl("");
                        }}
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* 📱 Telegram Live Bubble Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <span>📱 Telegram Message Preview (សារដែលនឹងបង្ហាញក្នុង Telegram)</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          fitsSingleBubble
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}>
                          {fitsSingleBubble ? "🟢 1 Single Message Bubble" : "⚠️ Splits into 2 Bubbles"}
                        </span>
                      </div>

                      {/* Mockup Container */}
                      <div className="p-4 rounded-xl bg-gray-100 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 flex flex-col items-center">
                        <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white dark:bg-[#182533] border border-gray-200 dark:border-[#243447] shadow-lg transition-all">
                          {/* Media Header */}
                          <div className="relative bg-black/10 dark:bg-black/50 overflow-hidden flex items-center justify-center max-h-72">
                            {isAttachedVideo ? (
                              <video
                                src={fullMediaUrl}
                                controls
                                autoPlay={false}
                                className="max-h-72 w-full object-contain"
                              />
                            ) : (
                              <img
                                src={fullMediaUrl}
                                alt="Telegram Message Preview"
                                className="max-h-72 w-full object-cover"
                              />
                            )}
                          </div>

                          {/* Caption Body */}
                          <div className="p-3.5 space-y-1.5 text-xs text-[#0f172a] dark:text-slate-100 font-normal leading-relaxed">
                            {title.trim() && (
                              <p className="font-bold text-sm text-[#0f172a] dark:text-white">
                                {title.trim()}
                              </p>
                            )}
                            <div
                              className="whitespace-pre-wrap break-words opacity-95 text-[11px] max-h-56 overflow-y-auto pr-1"
                              style={{ fontFamily: 'var(--font-kantumruy-pro), sans-serif' }}
                            >
                              {messageText}
                            </div>
                            
                            {/* Timestamp & check ticks */}
                            <div className="flex items-center justify-end gap-1 pt-1.5 text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                              <span>10:25 PM</span>
                              <span className="text-blue-500 font-bold">✓✓</span>
                            </div>
                          </div>
                        </div>

                        {/* Status guidance note */}
                        <div className="mt-2.5 w-full max-w-sm text-center">
                          {fitsSingleBubble ? (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✨ <b>Perfect:</b> Photo and text will arrive in <b>1 single message bubble</b> ({effectiveLength}/1024 chars).
                            </p>
                          ) : (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-300 text-left">
                              <span>⚠️ Over 1024 chars! Click button to combine into 1 bubble:</span>
                              <button
                                type="button"
                                onClick={handleAutoFitToSingleBubble}
                                className="shrink-0 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow transition cursor-pointer"
                              >
                                Auto-Fit Now
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                      File Path: {imagePath}
                    </p>
                  </div>
                );
              })()
            )}
            {fileError && <p className="text-[10px] text-rose-500 pl-1">{fileError}</p>}
          </div>

          {/* Form actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleSaveSchedule}
              disabled={loading || uploadingImage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 border border-gray-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Schedule
            </Button>
            
            <Button
              onClick={handleSendNow}
              disabled={loading || uploadingImage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:via-indigo-500 hover:to-rose-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-rose-500/30 filter hover:brightness-110 border border-white/10 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
