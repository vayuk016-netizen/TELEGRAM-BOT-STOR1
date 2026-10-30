"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Key, ShieldCheck, AlertCircle } from "lucide-react";
import { stockService } from "@/services/stock.service";
import { Product } from "@/types/product.types";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: number | null;
  onSuccess: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  onSuccess,
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
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const lineCount = rawKeysText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setMessage({ text: "Please select a target product.", type: "error" });
      return;
    }
    if (!rawKeysText.trim()) {
      setMessage({ text: "Key content cannot be empty.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await stockService.bulkUploadKeys({
        product_id: productId,
        raw_keys_text: rawKeysText,
      });
      setMessage({ text: res.message, type: "success" });
      setRawKeysText("");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || "Failed to upload keys. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔑 Digital Inventory Vault - Bulk Key Upload">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Product Item
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (${Number(p.price || 0).toFixed(2)}) - Current Stock: {p.stock_count}
              </option>
            ))}
          </select>
        </div>

        {/* Textarea for Multi-Line Paste */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Digital Keys / Account Credentials Payload
            </label>
            <span className="text-[11px] font-mono text-blue-400">
              {lineCount} {lineCount === 1 ? "item" : "items"} detected
            </span>
          </div>
          <textarea
            rows={8}
            value={rawKeysText}
            onChange={(e) => setRawKeysText(e.target.value)}
            placeholder={`Paste raw credentials line-by-line:\nemail1@domain.com:password123\nemail2@domain.com:password456\nLICENSE-KEY-XXXX-YYYY-ZZZZ`}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
          <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            <b>AES-256 Fernet Encryption:</b> All uploaded keys will be automatically encrypted before storing in the database vault.
          </span>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || lineCount === 0}>
            {loading ? "Encrypting & Inserting..." : `Upload ${lineCount} Keys`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
