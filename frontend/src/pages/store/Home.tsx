"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { storeService, StoreCategory } from "@/services/store.service";
import { useInfiniteProducts } from "@/hooks/use-infinite-products";
import { useLanguageStore } from "@/store/use-language-store";
import { getProductDiscount } from "@/lib/promo";
import { LazyProductGrid } from "@/components/storefront/LazyProductGrid";
import { BrandTicker } from "@/components/storefront/BrandTicker";
import { Button } from "@/components/ui/button";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await storeService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCats();
  }, []);

  const {
    products: featuredProducts,
    total,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sentinelRef,
  } = useInfiniteProducts({
    categoryId: selectedCategory,
    pageSize: 16,
  });

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* 🚀 Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 border-b border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          {featuredProducts.some((p) => getProductDiscount(p).hasPromo) && (
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white shadow-xl shadow-rose-500/20 border border-white/20">
              <span className="text-xs sm:text-sm font-black tracking-wide uppercase">
                {t("promo_banner_title")}
              </span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-100 leading-[1.15]">
            {t("hero_title")}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {t("hero_subtitle")}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/products")}
              className="group relative inline-flex items-center justify-center h-12 px-8 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 bg-white/90 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_25px_-4px_rgba(15,23,42,0.12),0_4px_10px_-2px_rgba(37,99,235,0.12)] dark:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_14px_32px_-4px_rgba(15,23,42,0.18)] dark:hover:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.9),0_0_30px_rgba(59,130,246,0.45)]"
            >
              {/* ✨ Surface Shimmer Swipe Light (Glides across the button face) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-transparent via-blue-500/15 dark:via-cyan-300/20 via-white/25 to-transparent animate-swipe-light-surface pointer-events-none" />
              </div>

              {/* 💫 Bottom Edge Swipe Light (Dynamic illuminated flare along bottom border) */}
              <div className="absolute bottom-0 left-0 right-0 h-[2.5px] overflow-hidden rounded-b-2xl pointer-events-none">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-sky-400 via-indigo-400 to-rose-400 to-transparent animate-swipe-light-bottom blur-[0.5px] shadow-[0_0_12px_2px_rgba(56,189,248,0.75)]" />
              </div>

              {/* 🌟 Ambient Bottom Glow */}
              <div className="absolute -bottom-1.5 left-1/4 right-1/4 h-2 bg-gradient-to-r from-cyan-500/30 via-indigo-500/40 to-rose-500/30 blur-sm pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity" />

              {/* 🧊 Clear Button Text & Icon */}
              <div className="relative z-10 flex items-center justify-center gap-2.5 font-extrabold text-sm sm:text-base text-[#0f172a] dark:text-white">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-cyan-400 filter drop-shadow(0_0_6px_rgba(56,189,248,0.4)) transition-transform group-hover:scale-110 flex-shrink-0" />
                <span className="tracking-wide">{t("browse_catalog")}</span>
              </div>
            </button>
          </div>
        </div>

        {/* 🎡 Brand Icons Rolling Animation (Only logos, no text) */}
        <div className="w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-5 sm:mt-8 relative z-10 overflow-hidden">
          <BrandTicker />
        </div>
      </section>

      {/* 📂 Category Pills & Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {t("featured_products")}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t("home_category_subtitle")}
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
          >
            <span>{t("browse_catalog")}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border filter ${
              selectedCategory === null
                ? "bg-gradient-to-r from-blue-600 to-rose-600 text-white border-transparent shadow-md shadow-blue-500/25 brightness-105"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-gradient-to-r hover:from-blue-600/15 hover:to-rose-600/15 hover:brightness-110"
            }`}
          >
            {t("all_categories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 filter ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-blue-600 to-rose-600 text-white border-transparent shadow-md shadow-blue-500/25 brightness-105"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-gradient-to-r hover:from-blue-600/15 hover:to-rose-600/15 hover:brightness-110"
              }`}
            >
              <span>{cat.icon || "📦"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Products Grid (Scroll Lazy Loading) */}
        <LazyProductGrid
          products={featuredProducts}
          total={total}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          sentinelRef={sentinelRef}
          initialSkeletonCount={4}
          emptyState={
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
              <Sparkles className="h-8 w-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-100">{t("no_products_category")}</h4>
              <p className="text-xs text-slate-400">{t("no_products_category_desc")}</p>
            </div>
          }
        />
      </section>
    </div>
  );
};

