"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, Product } from "@/types/product.types";
import { productService } from "@/services/product.service";
import { stockService } from "@/services/stock.service";
import {
  Key,
  Shield,
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  Link2,
  Check,
  AlertCircle,
  Save,
  Plus,
} from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialProduct?: Product | null;
  onSuccess: (product: Product, isNew: boolean) => void;
  onOpenCreateCategory?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialProduct,
  onSuccess,
  onOpenCreateCategory,
}) => {
  const [categoryId, setCategoryId] = useState<number>(
    initialProduct?.category_id || categories[0]?.id || 1
  );
  const [title, setTitle] = useState<string>(initialProduct?.title || "");
  const [description, setDescription] = useState<string>(initialProduct?.description || "");
  const [price, setPrice] = useState<string>(
    initialProduct?.price ? String(initialProduct.price) : ""
  );
  const [imageUrl, setImageUrl] = useState<string>(initialProduct?.image_url || "");
  const [isActive, setIsActive] = useState<boolean>(
    initialProduct ? (initialProduct.is_active ?? true) : true
  );
  const [rawKeysText, setRawKeysText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("សូមជ្រើសរើស File រូបភាពត្រឹមត្រូវ (PNG, JPG, WEBP, GIF)");
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const res = await productService.uploadProductImage(file);
      setImageUrl(res.image_url);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          "Failed to upload image. Please paste image link or try again."
      );
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    setErrorMsg(null);
    if (initialProduct) {
      setCategoryId(initialProduct.category_id);
      setTitle(initialProduct.title || "");
      setDescription(initialProduct.description || "");
      setPrice(initialProduct.price ? String(initialProduct.price) : "");
      setImageUrl(initialProduct.image_url || "");
      setIsActive(initialProduct.is_active ?? true);
      setRawKeysText("");
    } else {
      const defaultCatId = categories[0]?.id || 1;
      setCategoryId(defaultCatId);
      setTitle("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setIsActive(true);
      setRawKeysText("");
    }
  }, [initialProduct, isOpen, categories]);

  const keyCount = rawKeysText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("សូមបញ្ចូលឈ្មោះផលិតផល (Please enter product title).");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg("តម្លៃផលិតផលត្រូវតែធំជាង $0 (Price must be greater than $0).");
      return;
    }
    if (!categoryId) {
      setErrorMsg("សូមជ្រើសរើស Category មួយ (Please select a category).");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let savedProduct: Product;
      const isNew = !initialProduct;

      if (initialProduct) {
        savedProduct = await productService.updateProduct(initialProduct.id, {
          category_id: categoryId,
          title: title.trim(),
          description: description.trim() || undefined,
          price: numPrice,
          image_url: imageUrl || undefined,
          is_active: isActive,
        });
      } else {
        savedProduct = await productService.createProduct({
          category_id: categoryId,
          title: title.trim(),
          description: description.trim() || undefined,
          price: numPrice,
          image_url: imageUrl || undefined,
          is_active: isActive,
        });
      }

      // If keys are provided, upload them immediately to add to stock
      if (rawKeysText.trim()) {
        try {
          const stockRes = await stockService.bulkUploadKeys({
            product_id: savedProduct.id,
            raw_keys_text: rawKeysText,
          });
          savedProduct.stock_count = stockRes.current_stock;
        } catch (stockErr) {
          console.warn("Stock keys upload warning:", stockErr);
        }
      }

      onSuccess(savedProduct, isNew);
      onClose();
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save product and stock keys. Please try again.";
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProduct ? `✏️ កែប្រែព័ត៌មានផលិតផល — ${initialProduct.title}` : "➕ បង្កើតផលិតផលថ្មី (Add Product)"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-kantumruy-pro max-h-[80vh] overflow-y-auto pr-1">
        {/* Category Picker */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Category <span className="text-rose-400">*</span>
            </label>
            {onOpenCreateCategory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateCategory();
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline"
              >
                + បង្កើត Category ថ្មី
              </button>
            )}
          </div>

          {categories.length === 0 ? (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between">
              <span>មិនទាន់មាន Category ណាមួយឡើយ។</span>
              {onOpenCreateCategory && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenCreateCategory();
                  }}
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  + បង្កើតឥឡូវនេះ
                </Button>
              )}
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(Number(e.target.value));
                setErrorMsg(null);
              }}
              className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || "📦"} {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Product Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            ឈ្មោះផលិតផល (Product Title) <span className="text-rose-400">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="ឧទាហរណ៍៖ CapCut Pro 1 Year Subscription"
            className="text-slate-100"
            required
            autoFocus
          />
        </div>

        {/* Price & Current Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              តម្លៃ ($ USD) <span className="text-rose-400">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="10.00"
              className="text-slate-100 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ស្តុកបច្ចុប្បន្ន</label>
            <div className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                <Key className="h-3.5 w-3.5 text-emerald-400" />
                Available:
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {initialProduct ? initialProduct.stock_count : 0} Keys
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            ការពិពណ៌នាផលិតផល (Description)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="សេចក្តីលម្អិតអំពីលក្ខណៈពិសេសរបស់ផលិតផលនេះ..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Product Photo Upload */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              <span>រូបភាពផលិតផល (Product Photo / Thumbnail)</span>
            </label>
            <span className="text-[10px] text-blue-400 font-medium">បង្ហាញលើគេហទំព័រ</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          {imageUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
              <div className="w-full h-36 bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium truncate">
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{imageUrl}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ប្តូររូប
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    លុប
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  uploadingImage
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-slate-700 hover:border-blue-500 hover:bg-slate-900/50"
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <span className="text-xs text-blue-400 font-medium">កំពុង Upload រូបភាព...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      ចុចទីនេះដើម្បី Upload រូបភាពផលិតផល
                    </div>
                    <div className="text-[10px] text-slate-400">
                      PNG, JPG, WEBP (Upload ដោយស្វ័យប្រវត្តិ)
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>ឬប្រើប្រាស់តំណភ្ជាប់រូបភាពផ្ទាល់ (Direct Link):</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Link2 className="h-3 w-3" />
                  {showUrlInput ? "លាក់ Link Input" : "Paste Link រូបភាព"}
                </button>
              </div>

              {showUrlInput && (
                <Input
                  type="url"
                  placeholder="https://example.com/photo.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-8 text-xs text-slate-100"
                />
              )}
            </div>
          )}
        </div>

        {/* Add Digital Keys directly */}
        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              📥 បញ្ចូលកូដ Keys ទៅក្នុងស្តុក (១ បន្ទាត់ = ១ Key, Optional)
            </label>
            {keyCount > 0 && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {keyCount} keys detected
              </span>
            )}
          </div>
          <textarea
            rows={3}
            value={rawKeysText}
            onChange={(e) => setRawKeysText(e.target.value)}
            placeholder={`បិទភ្ជាប់កូដ Keys ឬ Account នៅទីនេះ (១ បន្ទាត់ = ១ Key):\nemail1@gmail.com:password123\nemail2@gmail.com:password456`}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-400" /> Keys នឹងត្រូវ Encrypt ដោយ AES-256 ដោយស្វ័យប្រវត្តិ។
          </p>
        </div>

        {/* Stock Status toggle */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <label className="text-xs font-semibold text-slate-300">ស្ថានភាពលក់ (Status):</label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isActive ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-xs font-medium ${isActive ? "text-emerald-400" : "text-rose-400"}`}>
            {isActive ? "✓ ដាក់លក់ (In-Stock)" : "✕ បិទការលក់ (Out-Stock)"}
          </span>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="text-xs">
            បោះបង់ (Cancel)
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !title.trim() || !price}
            className="text-xs gap-1.5 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 px-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>កំពុងរក្សាទុក...</span>
              </>
            ) : (
              <>
                {initialProduct ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span>{initialProduct ? "រក្សាទុកការកែប្រែ" : "បង្កើតផលិតផលថ្មី"}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
