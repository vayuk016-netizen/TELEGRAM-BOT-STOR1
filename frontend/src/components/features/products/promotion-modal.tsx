"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { productService } from "@/services/product.service";
import { Category, Product } from "@/types/product.types";
import { Flame, Check, X, Tag, Percent, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onPromotionUpdated: () => void;
  initialProductId?: number | null;
}

const PRESET_PERCENTAGES = [5, 10, 15, 20, 25, 30, 40, 50];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onPromotionUpdated,
  initialProductId,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<"all" | "category" | "specific">(
    initialProductId ? "specific" : "all"
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(categories[0]?.id || 0);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(
    initialProductId ? [initialProductId] : []
  );
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync initial product if changed
  React.useEffect(() => {
    if (initialProductId) {
      setSelectedTarget("specific");
      setSelectedProductIds([initialProductId]);
    }
  }, [initialProductId]);

  // Determine affected products
  const targetProducts = React.useMemo(() => {
    if (selectedTarget === "all") {
      return products;
    }
    if (selectedTarget === "category") {
      return products.filter((p) => p.category_id === Number(selectedCategoryId));
    }
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedTarget, selectedCategoryId, selectedProductIds]);

  const handleApply = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload: any = {
        action: "apply",
        discount_percent: discountPercent,
      };

      if (selectedTarget === "specific") {
        if (selectedProductIds.length === 0) {
          setErrorMsg("សូមជ្រើសរើសផលិតផលយ៉ាងហោចណាស់មួយ!");
          setLoading(false);
          return;
        }
        payload.product_ids = selectedProductIds;
      } else if (selectedTarget === "category") {
        payload.category_id = Number(selectedCategoryId);
      }

      const res = await productService.bulkPromotion(payload);
      setSuccessMsg(`🎉 ${res.message}`);
      onPromotionUpdated();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "មានបញ្ហាក្នុងការកំណត់ប្រូម៉ូសិន!");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload: any = {
        action: "clear",
      };

      if (selectedTarget === "specific") {
        if (selectedProductIds.length === 0) {
          setErrorMsg("សូមជ្រើសរើសផលិតផលយ៉ាងហោចណាស់មួយ!");
          setLoading(false);
          return;
        }
        payload.product_ids = selectedProductIds;
      } else if (selectedTarget === "category") {
        payload.category_id = Number(selectedCategoryId);
      }

      const res = await productService.bulkPromotion(payload);
      setSuccessMsg(`✅ ${res.message}`);
      onPromotionUpdated();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "មានបញ្ហាក្នុងការលុបប្រូម៉ូសិន!");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔥 កំណត់ប្រូម៉ូសិនផលិតផល (ProMotion Manager)"
      className="max-w-2xl"
    >
      <div className="space-y-6 pt-2 text-slate-100">
        {/* Banner Alert Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Target Scope Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            ១. ជ្រើសរើសមុខទំនិញដែលត្រូវធ្វើប្រូម៉ូសិន (Target Products)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedTarget("all")}
              className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                selectedTarget === "all"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-md shadow-rose-500/20"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              🌐 គ្រប់ទំនិញ ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTarget("category")}
              className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                selectedTarget === "category"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-md shadow-rose-500/20"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              📂 តាមជំពូក (Category)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTarget("specific")}
              className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                selectedTarget === "specific"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/60 shadow-md shadow-rose-500/20"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              🎯 ជ្រើសរើសមួយៗ
            </button>
          </div>

          {/* Category Dropdown */}
          {selectedTarget === "category" && (
            <div className="pt-2">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="w-full h-10 rounded-xl bg-slate-950 border border-slate-800 text-xs px-3 text-slate-100 focus:outline-none focus:border-rose-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || "📦"} {c.name} ({products.filter((p) => p.category_id === c.id).length} ផលិតផល)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Specific Products Checkboxes */}
          {selectedTarget === "specific" && (
            <div className="pt-2 max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
              {products.map((p) => {
                const checked = selectedProductIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition-colors ${
                      checked
                        ? "bg-rose-500/15 border-rose-500/40 text-slate-100"
                        : "border-transparent hover:bg-slate-900 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectProduct(p.id)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span className="font-medium">{p.title}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">${Number(p.price).toFixed(2)}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Choose Promotion Percentage (5% - 50%) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-rose-400" />
              <span>២. ជ្រើសរើសភាគរយបញ្ចុះតម្លៃ (5% ដល់ 50%)</span>
            </label>
            <span className="text-base font-black font-mono text-rose-400 bg-rose-500/10 px-3 py-0.5 rounded-full border border-rose-500/30">
              -{discountPercent}%
            </span>
          </div>

          {/* Preset Buttons: 5%, 10%, 15%, 20%, 25%, 30%, 40%, 50% */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {PRESET_PERCENTAGES.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setDiscountPercent(pct)}
                className={`py-2 px-1 rounded-xl text-xs font-black border transition-all ${
                  discountPercent === pct
                    ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 scale-105"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                }`}
              >
                -{pct}%
              </button>
            ))}
          </div>

          {/* Range Slider for Custom % */}
          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">5%</span>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="flex-1 accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="text-xs text-slate-500 font-mono">50%</span>
          </div>
        </div>

        {/* 3. Live Preview Table of Affected Products */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">
              ទិដ្ឋភាពទូទៅនៃការបញ្ចុះតម្លៃ ({targetProducts.length} មុខទំនិញ)
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-850 p-1">
            {targetProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                គ្មានផលិតផលត្រូវបានជ្រើសរើសទេ។
              </div>
            ) : (
              targetProducts.map((p) => {
                const base = Number(p.original_price) > 0 ? Number(p.original_price) : Number(p.price);
                const discounted = base * (1 - discountPercent / 100);
                return (
                  <div key={p.id} className="flex items-center justify-between p-2 text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[200px]">{p.title}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="line-through text-slate-500">${base.toFixed(2)}</span>
                      <span className="text-emerald-400 font-bold">${discounted.toFixed(2)}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        -{discountPercent}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || targetProducts.length === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            ✕ លុបប្រូម៉ូសិន (Clear Promo)
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              បិទ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={loading || targetProducts.length === 0}
              className="bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-rose-500/25 border border-white/20 gap-1.5"
            >
              <Flame className="h-4 w-4" />
              <span>{loading ? "កំពុងអនុវត្ត..." : `អនុវត្ត -${discountPercent}% ឥឡូវ`}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
