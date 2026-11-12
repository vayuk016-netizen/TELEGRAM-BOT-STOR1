"use client";

import React from "react";
import { Flame, Tag } from "lucide-react";
import { useLanguageStore } from "@/store/use-language-store";

interface PromoStickerProps {
  discountPercent: number;
  variant?: "overlay" | "inline" | "compact";
  className?: string;
}

/**
 * Reusable Promotion discount sticker badge for cards, detail views, checkout, and admin.
 */
export const PromoSticker: React.FC<PromoStickerProps> = ({
  discountPercent,
  variant = "inline",
  className = "",
}) => {
  const { language } = useLanguageStore();

  if (discountPercent <= 0) return null;

  const isKm = language === "km";
  const label = isKm
    ? `បញ្ចុះតម្លៃ ${discountPercent}%`
    : `PROMOTION ${discountPercent}%`;

  if (variant === "overlay") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white text-[11px] font-black tracking-wide uppercase shadow-md shadow-rose-600/25 border border-white/20 ${className}`}
      >
        <Flame className="h-3.5 w-3.5 text-amber-200 fill-amber-300 flex-shrink-0" />
        <span>{label}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 text-[10px] font-extrabold uppercase tracking-wider ${className}`}
      >
        <Tag className="h-2.5 w-2.5 flex-shrink-0" />
        <span>-{discountPercent}%</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 text-white text-[11px] font-black uppercase tracking-wide shadow-md shadow-rose-600/20 border border-rose-300/30 ${className}`}
    >
      <Flame className="h-3.5 w-3.5 text-amber-200 fill-amber-300 flex-shrink-0" />
      <span>
        {isKm
          ? `ប្រូម៉ូសិនពិសេស • បញ្ចុះតម្លៃ ${discountPercent}% OFF`
          : `PROMOTION ${discountPercent}% OFF`}
      </span>
    </span>
  );
};

