"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { stockService } from "@/services/stock.service";
import { Product } from "@/types/product.types";
import { StockKeyItem } from "@/types/stock.types";

interface InspectKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onStockUpdated: (productId: number, newStock: number) => void;
  onOpenAddModal: (productId: number) => void;
}

export const InspectKeysModal: React.FC<InspectKeysModalProps> = ({
  isOpen,
  onClose,
  product,
  onStockUpdated,
  onOpenAddModal,
}) => {
  const [keys, setKeys] = useState<StockKeyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<number>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "unsold" | "sold">("all");

  const loadKeys = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const isSoldParam =
        filterMode === "unsold" ? false : filterMode === "sold" ? true : undefined;
      const data = await stockService.listKeys(product.id, isSoldParam, 150);
      setKeys(data);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      loadKeys();
    }
  }, [isOpen, product, filterMode]);

  const toggleReveal = (id: number) => {
    setRevealedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm("តើអ្នកពិតជាចង់លុប Key នេះចេញពីស្តុកមែនទេ? (Delete this key?)")) return;
    setDeletingId(keyId);
    try {
      const res = await stockService.deleteKey(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      if (product) {
        onStockUpdated(product.id, res.current_stock);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete key.");
    } finally {
      setDeletingId(null);
    }
  };

  const unsoldKeysCount = keys.filter((k) => !k.is_sold).length;
  const soldKeysCount = keys.filter((k) => k.is_sold).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🔍 ពិនិត្យបញ្ជី Keys ក្នុងស្តុក — ${product?.title || "Product"}`}
    >
      <div className="space-y-4">
        {/* Header Stats & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ស្តុកនៅសល់: {unsoldKeysCount}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300">
              <span>លក់រួច: {soldKeysCount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterMode === "all" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                ទាំងអស់
              </button>
              <button
                onClick={() => setFilterMode("unsold")}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterMode === "unsold" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                នៅសល់
              </button>
              <button
                onClick={() => setFilterMode("sold")}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  filterMode === "sold" ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                លក់ហើយ
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadKeys}
              disabled={loading}
              className="h-7 text-xs px-2 gap-1 border-slate-700"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>

            {product && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenAddModal(product.id);
                }}
                className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
              >
                <Plus className="h-3 w-3" />
                <span>+ បន្ថែម Keys</span>
              </Button>
            )}
          </div>
        </div>

        {/* Keys List Container */}
        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <span>កំពុងទាញយកទិន្នន័យ Keys ពី Vault...</span>
            </div>
          ) : keys.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-6 space-y-2">
              <Key className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">មិនទាន់មាន Key ណាមួយនៅក្នុងស្តុកឡើយ</p>
              <p className="text-[11px] text-slate-500">
                ចុចប៊ូតុង &ldquo;+ បន្ថែម Keys&rdquo; ដើម្បី Paste បញ្ចូលកូដភ្លាមៗ។
              </p>
            </div>
          ) : (
            keys.map((k, index) => {
              const isRevealed = revealedKeyIds.has(k.id);
              const displayText = isRevealed ? k.raw_content || k.key_preview : k.key_preview;

              return (
                <div
                  key={k.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-slate-500 flex-shrink-0 w-8">
                      #{index + 1}
                    </span>

                    <Badge
                      variant={k.is_sold ? "neutral" : "success"}
                      className="text-[10px] px-1.5 py-0 flex-shrink-0"
                    >
                      {k.is_sold ? "លក់ហើយ" : "នៅសល់"}
                    </Badge>

                    {/* Key content */}
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-emerald-400 break-all select-all font-medium">
                        {displayText}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        បានបន្ថែម: {new Date(k.created_at).toLocaleString("km-KH")}
                        {k.order_id && ` • Order #${k.order_id}`}
                      </div>
                    </div>
                  </div>

                  {/* Actions for single key */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleReveal(k.id)}
                      title={isRevealed ? "Hide Key" : "Show Full Key"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(k.id, k.raw_content || k.key_preview)}
                      title="Copy Key"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                    >
                      {copiedKeyId === k.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {!k.is_sold && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(k.id)}
                        disabled={deletingId === k.id}
                        title="Delete from stock"
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === k.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-500 text-[11px]">
            បង្ហាញសរុប {keys.length} keys (AES-256 Encrypted)
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            បិទ (Close)
          </Button>
        </div>
      </div>
    </Modal>
  );
};

