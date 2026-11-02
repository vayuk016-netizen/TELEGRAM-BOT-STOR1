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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/user.service";

export default function BroadcastPage() {
  // Form states
  const [title, setTitle] = useState<string>("");
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
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
      setFileError("Failed to upload media file. Please try again.");
      showToast("Media upload failed.", "error");
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
    if (!messageText.trim()) return;

    if (!confirm("Are you sure you want to broadcast this message to ALL Telegram bot users immediately?")) {
      return;
    }

    setLoading(true);
    try {
      await userService.sendImmediateBroadcast({
        title: title.trim() || undefined,
        message_text: messageText,
        interval_delay: intervalDelay,
        image_path: imagePath || undefined,
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Send className="h-5 w-5 text-blue-500 transform -rotate-12" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Broadcast Message</h1>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Send or schedule messages with pictures to all active bot users.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Message Area */}
          <div>
            <textarea
              placeholder="Write message..."
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all tracking-normal"
              style={{ fontFamily: 'var(--font-kantumruy-pro), sans-serif' }}
            />
            <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 block pl-1">
              
            </span>
          </div>

          {/* Time / Date scheduling selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Hour */}
            <div>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-sm text-gray-900 dark:text-slate-100 focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((hr) => (
                  <option key={hr} value={hr} className="bg-slate-950 text-gray-900 dark:text-slate-100">
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
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-sm text-gray-900 dark:text-slate-100 focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
              >
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((min) => (
                  <option key={min} value={min} className="bg-slate-950 text-gray-900 dark:text-slate-100">
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
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-sm text-gray-900 dark:text-slate-100 focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer"
              >
                <option value="AM" className="bg-slate-950 text-gray-900 dark:text-slate-100">AM</option>
                <option value="PM" className="bg-slate-950 text-gray-900 dark:text-slate-100">PM</option>
              </select>
            </div>

            {/* Datepicker */}
            <div className="relative">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 pr-8 text-sm text-gray-900 dark:text-slate-100 focus:border-blue-500/50 focus:outline-none transition-all cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Delay Settings */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400">
              Interval Delay between sends (seconds)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={intervalDelay}
              onChange={(e) => setIntervalDelay(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none transition-all"
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
                className={`w-full rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 py-4 px-6 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                  uploadingImage ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                )}
                <span className="text-xs text-gray-550 dark:text-slate-400 font-medium">
                  {uploadingImage ? "Uploading media..." : "Upload image or video (optional)"}
                </span>
              </div>
            ) : (
              (() => {
                const isAttachedVideo = imagePath && [".mp4", ".mov", ".avi", ".webm", ".mkv", ".3gp"].some(ext => imagePath.toLowerCase().endsWith(ext));
                const fullMediaUrl = localPreviewUrl || (imagePath.startsWith("http") ? imagePath : `https://telegram-bot-stor1.onrender.com${imagePath}`);

                return (
                  <div className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 shadow-xl">
                    {/* Header info & remove button */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        {isAttachedVideo ? (
                          <FileVideo className="h-5 w-5 text-rose-500 animate-pulse" />
                        ) : (
                          <FileImage className="h-5 w-5 text-blue-500" />
                        )}
                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                          {isAttachedVideo ? "📹 Video Preview" : "🖼️ Photo Preview"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setImagePath("");
                          setLocalPreviewUrl("");
                        }}
                        type="button"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* Media element: Full View Image or Video */}
                    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black/40 max-h-80 flex items-center justify-center">
                      {isAttachedVideo ? (
                        <video
                          src={fullMediaUrl}
                          controls
                          autoPlay={false}
                          className="max-h-80 w-full object-contain rounded-xl"
                        />
                      ) : (
                        <img
                          src={fullMediaUrl}
                          alt="Broadcast Media Preview"
                          className="max-h-80 w-full object-contain rounded-xl"
                        />
                      )}
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-800 text-gray-900 dark:text-slate-100 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Schedule
            </Button>
            
            <Button
              onClick={handleSendNow}
              disabled={loading || uploadingImage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-xs font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white disabled:opacity-50 transition-all"
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
