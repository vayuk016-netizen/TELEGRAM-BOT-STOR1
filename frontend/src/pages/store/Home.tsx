"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { storeService, StoreProduct, StoreCategory } from "@/services/store.service";
import { useLanguageStore } from "@/store/use-language-store";
import { getProductDiscount } from "@/lib/promo";
import { ProductCard } from "@/components/storefront/ProductCard";
import { BrandTicker } from "@/components/storefront/BrandTicker";
import { Button } from "@/components/ui/button";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<StoreProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, prods] = await Promise.all([
          storeService.getCategories(),
          storeService.getProducts(),
        ]);
        setCategories(cats);
        setFeaturedProducts(prods);
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = selectedCategory
    ? featuredProducts.filter((p) => p.category?.id === selectedCategory)
    : featuredProducts;

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
              className="group relative inline-flex items-center justify-center h-12 px-8 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900/90 backdrop-blur-2xl shadow-[0_10px_25px_-4px_rgba(15,23,42,0.12),0_4px_10px_-2px_rgba(37,99,235,0.12)] dark:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_14px_32px_-4px_rgba(15,23,42,0.18)] dark:hover:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.9),0_0_30px_rgba(59,130,246,0.45)]"
            >
              {/* 💫 SVG Running Border Beam (Uniform speed along all 4 edges) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="heroBtnBeamLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  <linearGradient id="heroBtnBeamDark" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>

                {/* Base subtle glass border frame */}
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="15"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200/90 dark:text-white/15"
                  strokeWidth="1.5"
                />

                {/* Active laser beam running around the box */}
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="15"
                  fill="none"
                  stroke="url(#heroBtnBeamLight)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="dark:hidden animate-border-beam-svg"
                  style={{ strokeDasharray: "110 440" }}
                />
                <rect
                  x="1"
                  y="1"
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  rx="15"
                  fill="none"
                  stroke="url(#heroBtnBeamDark)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="hidden dark:block animate-border-beam-svg"
                  style={{
                    strokeDasharray: "110 440",
                    filter: "drop-shadow(0 0 5px rgba(56, 189, 248, 0.75))",
                  }}
                />
              </svg>

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

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
            <Sparkles className="h-8 w-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-100">{t("no_products_category")}</h4>
            <p className="text-xs text-slate-400">{t("no_products_category_desc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

