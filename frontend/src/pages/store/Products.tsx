"use client";

import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Sparkles, ShoppingBag } from "lucide-react";
import { storeService, StoreProduct, StoreCategory } from "@/services/store.service";
import { useLanguageStore } from "@/store/use-language-store";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Input } from "@/components/ui/input";

export const StoreProductsPage: React.FC = () => {
  const { t } = useLanguageStore();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await storeService.getProducts({
          category_id: selectedCategory || undefined,
          search: search || undefined,
          sort,
        });
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(delay);
  }, [selectedCategory, search, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Title & Subtitle */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
          {t("nav_products")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Browse all available instant-delivery digital tools, subscriptions, and activation keys.
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === null
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            {t("all_categories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <span>{cat.icon || "📦"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid / Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
          <ShoppingBag className="h-10 w-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-base text-slate-100">No products found</h4>
          <p className="text-xs text-slate-400">Try adjusting your search query or switching categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};

