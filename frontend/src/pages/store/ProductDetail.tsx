"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Clock,
  Sparkles,
} from "lucide-react";
import { storeService, StoreProduct } from "@/services/store.service";
import { useLanguageStore } from "@/store/use-language-store";
import { Button } from "@/components/ui/button";

export const StoreProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await storeService.getProduct(Number(id));
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-xs text-slate-500">The product you are looking for is currently unavailable.</p>
        <Button onClick={() => navigate("/products")}>Back to Catalog</Button>
      </div>
    );
  }

  const isOutOfStock = product.stock_count <= 0;
  const maxQty = Math.min(10, Math.max(1, product.stock_count));
  const totalPrice = product.price * quantity;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("nav_products")}</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Image / Visual Showcase */}
        <div className="md:col-span-6 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-sm">
          {product.image_url ? (
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              {/* Ambient blurred backdrop for seamless edge matching */}
              <img
                src={product.image_url}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110 pointer-events-none"
              />
              <img
                src={product.image_url}
                alt={product.title}
                className="relative z-10 max-w-full max-h-full object-contain p-2"
              />
              <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs text-white font-bold flex items-center gap-1.5 shadow">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>{t("instant_badge")}</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-80 sm:h-96 rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border border-blue-500/10 flex items-center justify-center text-7xl">
              {product.category?.icon || "⚡"}
            </div>
          )}

          {/* Quick Info Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <Zap className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <span className="font-bold text-[11px] block text-slate-100">Instant</span>
              <span className="text-[10px] text-slate-400">Automated Delivery</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <span className="font-bold text-[11px] block text-slate-100">Verified</span>
              <span className="text-[10px] text-slate-400">100% Genuine</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <Clock className="h-4 w-4 text-purple-500 mx-auto mb-1" />
              <span className="font-bold text-[11px] block text-slate-100">24/7 Bot</span>
              <span className="text-[10px] text-slate-400">Telegram Sync</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Purchase Options */}
        <div className="md:col-span-6 space-y-6">
          
          {/* Category Badge & Share */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <span>{product.category?.icon || "📦"}</span>
              <span>{product.category?.name || "General"}</span>
            </span>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-slate-800 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copiedLink ? "Copied!" : "Share"}</span>
            </button>
          </div>

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            {product.title}
          </h1>

          {/* Price & Stock Badge */}
          <div className="flex items-baseline gap-4 py-2 border-y border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Unit Price</span>
              <span className="text-3xl font-black text-blue-500 font-mono">
                ${product.price.toFixed(2)}
              </span>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{t("out_of_stock")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{product.stock_count} {t("in_stock")}</span>
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector (1-10) */}
          {!isOutOfStock && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {t("quantity")} (1 - {maxQty})
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`h-10 w-11 rounded-xl text-xs font-bold transition-all border font-mono ${
                      quantity === q
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total Price preview */}
          {!isOutOfStock && (
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  {t("total_price")} ({quantity} item{quantity > 1 ? "s" : ""})
                </span>
                <span className="text-2xl font-black text-slate-100 font-mono">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <Button
                size="lg"
                onClick={() => navigate(`/checkout/${product.id}?qty=${quantity}`)}
                className="h-12 px-8 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 gap-2 active:scale-95 transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{t("buy_now")}</span>
              </Button>
            </div>
          )}

          {/* Description & Feature list */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">
              Description & Subscription Details
            </h3>
            <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {product.description || "100% genuine private subscription with automated instant key delivery upon payment."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

