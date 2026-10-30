"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { storeService, StoreProduct, StoreCategory } from "@/services/store.service";
import { useLanguageStore } from "@/store/use-language-store";
import { ProductCard } from "@/components/storefront/ProductCard";
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
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-transparent border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.2),rgba(0,0,0,0))] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold shadow-sm animate-pulse">
            <Zap className="h-3.5 w-3.5" />
            <span>{t("hero_badge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            {t("hero_title")}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t("hero_subtitle")}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/products")}
              className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 gap-2 active:scale-95 transition-all"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t("browse_catalog")}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 📂 Category Pills & Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("featured_products")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your category or choose from our best-selling subscriptions below:
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>{t("browse_catalog")}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === null
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
            }`}
          >
            {t("all_categories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
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
              <div key={n} className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-900 animate-pulse border border-slate-300 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
            <Sparkles className="h-8 w-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300">No products available in this category</h4>
            <p className="text-xs text-slate-500">Please check back soon or browse other categories.</p>
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

