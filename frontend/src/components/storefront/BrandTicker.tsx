"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

interface BrandItem {
  id: string;
  name: string;
  query: string;
  image: string;
  glowColor: string;
}

export const BrandTicker: React.FC = () => {
  const navigate = useNavigate();

  // 👑 All 10 Ultra-Premium 3D Crown Icons (with transparent PNGs)
  const baseBrands: BrandItem[] = [
    {
      id: "canva",
      name: "Canva Pro",
      query: "Canva",
      image: "/brands/canva.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(168,85,247,0.45)]",
    },
    {
      id: "capcut",
      name: "CapCut Pro",
      query: "CapCut",
      image: "/brands/capcut.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(6,182,212,0.45)]",
    },
    {
      id: "gemini",
      name: "Google Gemini Pro",
      query: "Gemini",
      image: "/brands/gemini.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(245,158,11,0.45)]",
    },
    {
      id: "chatgpt",
      name: "ChatGPT Plus",
      query: "ChatGPT",
      image: "/brands/chatgpt.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(16,185,129,0.45)]",
    },
    {
      id: "claude",
      name: "Claude AI",
      query: "Claude",
      image: "/brands/claude.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(249,115,22,0.45)]",
    },
    {
      id: "youtube",
      name: "YouTube Premium",
      query: "YouTube",
      image: "/brands/youtube.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(239,68,68,0.45)]",
    },
    {
      id: "netflix",
      name: "Netflix",
      query: "Netflix",
      image: "/brands/netflix.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(225,29,72,0.45)]",
    },
    {
      id: "telegram",
      name: "Telegram Premium",
      query: "Telegram",
      image: "/brands/telegram.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(56,189,248,0.45)]",
    },
    {
      id: "creative_cloud",
      name: "Adobe Creative Cloud",
      query: "Adobe",
      image: "/brands/creative_cloud.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(236,72,153,0.45)]",
    },
    {
      id: "grok",
      name: "Super Grok",
      query: "Grok",
      image: "/brands/grok.png",
      glowColor: "group-hover:drop-shadow-[0_10px_20px_rgba(147,51,234,0.45)]",
    },
  ];

  // Duplicate once for seamless 50% infinite keyframe loop (20 badges total)
  const infiniteBrands = [...baseBrands, ...baseBrands];

  const handleBrandClick = (query: string) => {
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full py-2 sm:py-4 relative z-10 overflow-hidden">
      {/* 🎡 Infinite Rolling Carousel Container with Hardware-Accelerated 3D Crown Icons */}
      <div className="w-full overflow-hidden ticker-fade-mask py-3 relative">
        <div className="animate-rolling-ticker gap-3.5 sm:gap-5 md:gap-6 px-2">
          {infiniteBrands.map((brand, idx) => (
            <button
              key={`${brand.id}-${idx}`}
              type="button"
              onClick={() => handleBrandClick(brand.query)}
              title={brand.name}
              aria-label={brand.name}
              className="group relative h-16 w-16 sm:h-20 sm:w-20 md:h-22 md:w-22 flex items-center justify-center p-0 bg-transparent transition-transform duration-300 cursor-pointer flex-shrink-0 active:scale-95 hover:scale-110 hover:-translate-y-1.5 focus:outline-none"
              style={{ contain: "layout paint" }}
            >
              <img
                src={brand.image}
                alt={brand.name}
                loading="eager"
                decoding="async"
                width={88}
                height={80}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 pointer-events-none"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
