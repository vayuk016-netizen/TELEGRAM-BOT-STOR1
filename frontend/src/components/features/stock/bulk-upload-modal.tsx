"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Copy,
  Sparkles,
  Info,
  Loader2,
  Eye,
} from "lucide-react";
import { stockService } from "@/services/stock.service";
import { Product } from "@/types/product.types";
import { formatCurrency } from "@/lib/utils";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: number | null;
  onSuccess: (data?: { productId: number; keysAdded: number; currentStock: number }) => void;
  onInspectRequested?: (productId: number) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  onSuccess,
  onInspectRequested,
}) => {
  const [productId, setProductId] = useState<number>(
    initialProductId || products[0]?.id || 0
  );

  React.useEffect(() => {
    if (initialProductId) {
      setProductId(initialProductId);
    } else if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [initialProductId, products]);

  const [rawKeysText, setRawKeysText] = useState<string>("");
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUploadedInfo, setLastUploadedInfo] = useState<{
    keysAdded: number;
    currentStock: number;
    duplicatesSkipped: number;
    productTitle: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected product object
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  // Real-time text analysis
  const { totalLines, uniqueCount, duplicateCount } = useMemo(() => {
    const lines = rawKeysText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const uniqueSet = new Set(lines);
    return {
      totalLines: lines.length,
      uniqueCount: uniqueSet.size,
      duplicateCount: lines.length - uniqueSet.size,
    };
  }, [rawKeysText]);

  const effectiveCount = skipDuplicates ? uniqueCount : totalLines;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setErrorMsg("សូមជ្រើសរើសទំនិញជាមុនសិន (Please select a target product).");
      return;
    }
    if (effectiveCount === 0) {
      setErrorMsg("សូមបញ្ចូលកូដ Keys ឬ Account Credentials យ៉ាងហោចណាស់ ១ បន្ទាត់។");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await stockService.bulkUploadKeys({
        product_id: productId,
        raw_keys_text: rawKeysText,
        skip_duplicates: skipDuplicates,
      });

      // ⚡ IMMEDIATE REAL-TIME TRIGGER: Call onSuccess immediately without waiting!
      onSuccess({
        productId,
        keysAdded: res.keys_added,
        currentStock: res.current_stock,
      });

      setLastUploadedInfo({
        keysAdded: res.keys_added,
        currentStock: res.current_stock,
        duplicatesSkipped: res.duplicates_skipped || 0,
        productTitle: selectedProduct?.title || `Product #${productId}`,
      });

      // Clear input so user can add more or close
      setRawKeysText("");
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to upload keys. Please verify connection and try again.";
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSample = (type: "account" | "license") => {
    if (type === "account") {
      setRawKeysText((prev) =>
        prev
          ? `${prev}\nuser_premium_${Math.floor(1000 + Math.random() * 9000)}@gmail.com:SecretPass@${Math.floor(100 + Math.random() * 900)}`
          : `user_pro_vip1@gmail.com:PassWord#2026\nuser_pro_vip2@gmail.com:SecureKey@8899\nuser_pro_vip3@gmail.com:FastVault$7711`
      );
    } else {
      setRawKeysText((prev) =>
        prev
          ? `${prev}\nKEY-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-PRO`
          : `CNV-PRO-9842-8812-7721\nCNV-PRO-3321-5512-9900\nCNV-PRO-4412-1123-6644`
      );
    }
    setErrorMsg(null);
  };

  const resetAllAndClose = () => {
    setRawKeysText("");
    setErrorMsg(null);
    setLastUploadedInfo(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAllAndClose}
      title="🔑 បន្ថែមស្តុកទំនិញថ្មី (Add Digital Keys Vault)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            ជ្រើសរើសផលិតផល (Target Product)
          </label>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(Number(e.target.value));
              setErrorMsg(null);
              setLastUploadedInfo(null);
            }}
            className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({formatCurrency(p.price)}) — ស្តុកបច្ចុប្បន្ន: {p.stock_count} Keys
              </option>
            ))}
          </select>
        </div>

        {/* Textarea for Multi-Line Paste */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              បញ្ជី Keys / Account Credentials (១ បន្ទាត់ = ១ Key)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleInsertSample("account")}
                className="text-[11px] text-slate-400 hover:text-emerald-400 underline transition-colors"
              >
                + គំរូ Account
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => handleInsertSample("license")}
                className="text-[11px] text-slate-400 hover:text-blue-400 underline transition-colors"
              >
                + គំរូ License
              </button>
            </div>
          </div>

          <textarea
            rows={7}
            value={rawKeysText}
            onChange={(e) => {
              setRawKeysText(e.target.value);
              setErrorMsg(null);
            }}
            placeholder={`បិទភ្ជាប់ (Paste) កូដ Keys ឬ Account នៅទីនេះ (១ បន្ទាត់ = ១ Key):\nemail1@gmail.com:password123\nemail2@gmail.com:password456\nLICENSE-KEY-XXXX-YYYY-ZZZZ`}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all leading-relaxed"
          />

          {/* Real-time Counter Pills */}
          <div className="flex items-center justify-between mt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono">
                <span>រកឃើញ:</span>
                <strong className="text-emerald-400">{totalLines}</strong>
              </span>

              {duplicateCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono">
                  <span>ស្ទួន (Duplicates):</span>
                  <strong>{duplicateCount}</strong>
                </span>
              )}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 select-none">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 bg-slate-900"
              />
              <span>ច្រោះចោលកូដស្ទួន (Skip duplicates)</span>
            </label>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <b>AES-256 Vault Encryption:</b> រាល់កូដ Keys ដែលបាន Upload នឹងត្រូវ Encrypt
            ភ្លាមៗនៅក្នុង Supabase Database ដោយស្វ័យប្រវត្តិ។
          </span>
        </div>

        {/* Instant Success Banner */}
        {lastUploadedInfo && (
          <div className="rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 p-3.5 text-xs text-emerald-200 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>បានបញ្ចូលកូដ Keys ទៅក្នុងស្តុកជោគជ័យ!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                + {lastUploadedInfo.keysAdded} Keys ថ្មី
              </span>
            </div>

            <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-emerald-500/20">
              <span>
                ផលិតផល: <b>{lastUploadedInfo.productTitle}</b>
              </span>
              <span>
                ស្តុកសរុបបច្ចុប្បន្ន:{" "}
                <strong className="text-emerald-400 font-mono text-sm">
                  {lastUploadedInfo.currentStock}
                </strong>{" "}
                Keys
              </span>
            </div>

            {onInspectRequested && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const pid = productId;
                    resetAllAndClose();
                    onInspectRequested(pid);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>មើលបញ្ជី Keys ដែលទើបបញ្ចូល</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={resetAllAndClose}
            disabled={loading}
            className="text-xs"
          >
            {lastUploadedInfo ? "រួចរាល់ (Close)" : "បោះបង់ (Cancel)"}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || effectiveCount === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs shadow-lg shadow-emerald-600/20 px-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>កំពុង Encrypt & បញ្ចូល...</span>
              </>
            ) : (
              <>
                <Key className="h-3.5 w-3.5" />
                <span>
                  បញ្ចូល {effectiveCount > 0 ? `${effectiveCount} Keys ទៅស្តុក` : "Keys"}
                </span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
