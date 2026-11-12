"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { storeService, StoreCategory } from "@/services/store.service";
import { useInfiniteProducts } from "@/hooks/use-infinite-products";
import { useLanguageStore } from "@/store/use-language-store";
import { LazyProductGrid } from "@/components/storefront/LazyProductGrid";
import { Input } from "@/components/ui/input";

export const StoreProductsPage: React.FC = () => {
  const { t } = useLanguageStore();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const queryParam = searchParams.get("search") || "";
    setSearch(queryParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await storeService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  const {
    products,
    total,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sentinelRef,
  } = useInfiniteProducts({
    categoryId: selectedCategory,
    search,
    sort,
    pageSize: 8,
    debounceMs: 250,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title & Subtitle */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
          {t("nav_products")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {t("products_subtitle")}
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_products")}
              className="pl-10 h-11 bg-slate-950/80 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 rounded-xl"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{t("sort_by")}:</span>
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">{t("sort_newest")}</option>
              <option value="price_asc">{t("sort_price_low")}</option>
              <option value="price_desc">{t("sort_price_high")}</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/60 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border filter ${
              selectedCategory === null
                ? "bg-gradient-to-r from-blue-600 to-rose-600 text-white border-transparent shadow-sm shadow-blue-500/25 brightness-105"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-gradient-to-r hover:from-blue-600/15 hover:to-rose-600/15 hover:brightness-110"
            }`}
          >
            {t("all_categories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 filter ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-blue-600 to-rose-600 text-white border-transparent shadow-sm shadow-blue-500/25 brightness-105"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-gradient-to-r hover:from-blue-600/15 hover:to-rose-600/15 hover:brightness-110"
              }`}
            >
              <span>{cat.icon || "📦"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid / Scroll Lazy Loading */}
      <LazyProductGrid
        products={products}
        total={total}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        sentinelRef={sentinelRef}
        initialSkeletonCount={8}
        emptyState={
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
            <ShoppingBag className="h-10 w-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-base text-slate-100">{t("no_products_found")}</h4>
            <p className="text-xs text-slate-400">{t("no_products_desc")}</p>
          </div>
        }
      />
    </div>
  );
};

