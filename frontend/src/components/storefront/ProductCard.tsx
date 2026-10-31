"use client";

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, CheckCircle2, AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { StoreProduct } from "@/services/store.service";
import { useLanguageStore } from "@/store/use-language-store";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: StoreProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const isOutOfStock = product.stock_count <= 0;

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm">
      
      {/* Top Banner: Category & Stock Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/80 text-slate-300 border border-slate-800">
            <span>{product.category?.icon || "📦"}</span>
            <span>{product.category?.name || "General"}</span>
          </span>

          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-3 w-3" />
              <span>{t("out_of_stock")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              <span>{product.stock_count} {t("in_stock")}</span>
            </span>
          )}
        </div>

        {/* Product Image / Icon placeholder */}
        {product.image_url ? (
          <div className="w-full aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-slate-950 border border-slate-800 relative flex items-center justify-center">
            {/* Ambient blurred backdrop for seamless edge matching */}
            <img
              src={product.image_url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
            />
            {/* Main image fits completely without cropping */}
            <img
              src={product.image_url}
              alt={product.title}
              className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-[1.03] transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] text-white font-bold flex items-center gap-1 shadow">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>{t("instant_badge")}</span>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[16/10] sm:aspect-[4/3] rounded-2xl mb-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/10 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
            {product.category?.icon || "⚡"}
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
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            {t("total_price")}
          </span>
          <span className="text-lg sm:text-xl font-extrabold text-blue-400 font-mono">
            ${product.price.toFixed(2)}
          </span>
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
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-95"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{isOutOfStock ? t("out_of_stock") : t("buy_now")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

