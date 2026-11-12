"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { StoreProduct } from "@/services/store.service";
import { useLanguageStore } from "@/store/use-language-store";
import { PromoSticker } from "@/components/storefront/PromoSticker";
import { getProductDiscount } from "@/lib/promo";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: StoreProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const discount = getProductDiscount(product);

  const isOutOfStock = product.stock_count <= 0;

  // Stagger the beam animation so adjacent product boxes don't run in identical phase
  const beamDelay = React.useMemo(() => {
    const seed = typeof product.id === "number" ? product.id : (product.id ? String(product.id).charCodeAt(0) : 0);
    return `${-((seed % 4) * 1.5)}s`;
  }, [product.id]);

  return (
    <div className="group relative rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 shadow-[0_12px_28px_-4px_rgba(15,23,42,0.1),0_6px_12px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.85)] hover:shadow-[0_20px_35px_-6px_rgba(15,23,42,0.16)] dark:hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.95)] flex flex-col justify-between">
      
      {/* 💎 Glass Base Border Frame (Replaces the plain black/dark border) */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-200/90 via-slate-200/40 to-slate-200/80 dark:from-white/20 dark:via-white/5 dark:to-white/15 pointer-events-none" />

      {/* 💫 Glowing Running Beam that travels around the box */}
      <div
        className="absolute -inset-[150%] animate-border-beam pointer-events-none opacity-85 group-hover:opacity-100 group-hover:animate-border-beam-fast transition-opacity duration-300 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_280deg,rgba(56,189,248,0.25)_305deg,#38bdf8_330deg,#818cf8_348deg,#ec4899_360deg)] dark:bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_270deg,rgba(56,189,248,0.35)_300deg,#38bdf8_330deg,#818cf8_350deg,#f43f5e_360deg)]"
        style={{ animationDelay: beamDelay }}
      />

      {/* 🧊 Frosted Glass Card Body with top specular shine */}
      <div className="relative z-10 w-full h-full rounded-[14.5px] bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
        
        {/* Top Banner: Category & Stock Status */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/80 text-slate-300 border border-slate-800 min-w-0 max-w-[62%] flex-shrink">
              <span className="flex-shrink-0">{product.category?.icon || "📦"}</span>
              <span className="truncate whitespace-nowrap">{product.category?.name || "General"}</span>
            </span>

            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap flex-shrink-0">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{t("out_of_stock")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap flex-shrink-0">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                <span>{product.stock_count} {t("in_stock")}</span>
              </span>
            )}
          </div>

          {/* Product Image / Icon placeholder */}
          <div className={`w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 relative flex items-center justify-center group/img ${discount.hasPromo ? "mb-3" : "mb-4"}`}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                {product.category?.icon || "⚡"}
              </div>
            )}
          </div>

          {discount.hasPromo && (
            <div className="mb-2.5">
              <PromoSticker discountPercent={discount.discountPercent} variant="overlay" />
            </div>
          )}

          {/* Product Title */}
          <Link to={`/products/${product.id}`} className="block group-hover:text-blue-400 transition-colors">
            <h3 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-1 mb-1.5">
              {product.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {product.description || "High quality instant automated subscription license."}
          </p>
        </div>

        {/* Bottom: Price & Buy Action */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                {discount.hasPromo ? t("promo_price") : t("total_price")}
              </span>
              {discount.hasPromo && (
                <PromoSticker discountPercent={discount.discountPercent} variant="compact" />
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-lg sm:text-xl font-extrabold font-mono ${discount.hasPromo ? "text-emerald-600 dark:text-emerald-400" : "text-blue-400"}`}>
                ${product.price.toFixed(2)}
              </span>
              {discount.hasPromo && discount.originalPrice !== null && (
                <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through decoration-rose-500 decoration-2 font-mono">
                  ${discount.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to={`/products/${product.id}`}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors text-xs font-semibold"
              title={t("view_details")}
            >
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Button
              size="sm"
              disabled={isOutOfStock}
              onClick={() => navigate(`/checkout/${product.id}`)}
              className={`text-xs font-bold gap-1.5 rounded-xl h-9 px-3.5 transition-all shadow-md ${
                isOutOfStock
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:via-indigo-500 hover:to-rose-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-rose-500/30 filter hover:brightness-110 border border-white/10 active:scale-95 btn-line-rolling btn-rolling-gradient"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>{isOutOfStock ? t("out_of_stock") : t("buy_now")}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

