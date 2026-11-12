"use client";

import React from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { StoreProduct } from "@/services/store.service";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useLanguageStore } from "@/store/use-language-store";

interface LazyProductGridProps {
  products: StoreProduct[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  initialSkeletonCount?: number;
  emptyState: React.ReactNode;
}

export const LazyProductGrid: React.FC<LazyProductGridProps> = ({
  products,
  total,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  sentinelRef,
  initialSkeletonCount = 8,
  emptyState,
}) => {
  const { t } = useLanguageStore();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: initialSkeletonCount }).map((_, idx) => (
          <div
            key={idx}
            className="h-72 rounded-2xl bg-slate-200/70 dark:bg-slate-900/60 animate-pulse border border-slate-200 dark:border-slate-800"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            style={{ contentVisibility: "auto", containIntrinsicSize: "380px" }}
          >
            <ProductCard product={prod} />
          </div>
        ))}

        {loadingMore &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`more-skel-${idx}`}
              className="h-72 rounded-2xl bg-slate-200/70 dark:bg-slate-900/60 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
      </div>

      {/* Scroll Lazy-Load Sentinel & Status Footer */}
      {(hasMore || total > 0) && (
        <div
          ref={sentinelRef}
          className="flex flex-col items-center justify-center gap-3 pt-2"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("showing_count")} {products.length} {t("of_total")} {total}
          </span>

          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 transition-all shadow-sm"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  <span>{t("loading_more")}</span>
                </>
              ) : (
                <>
                  <span>{t("load_more")}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

