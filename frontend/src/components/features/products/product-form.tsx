"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, Product } from "@/types/product.types";
import { productService } from "@/services/product.service";
import { stockService } from "@/services/stock.service";
import { Key, Shield, UploadCloud, Image as ImageIcon, X, Loader2, Link2, Check } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialProduct?: Product | null;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialProduct,
  onSuccess,
}) => {
  const [categoryId, setCategoryId] = useState<number>(
    initialProduct?.category_id || categories[0]?.id || 1
  );
  const [title, setTitle] = useState<string>(initialProduct?.title || "");
  const [description, setDescription] = useState<string>(initialProduct?.description || "");
  const [price, setPrice] = useState<string>(initialProduct?.price ? String(initialProduct.price) : "");
  const [imageUrl, setImageUrl] = useState<string>(initialProduct?.image_url || "");
  const [isActive, setIsActive] = useState<boolean>(initialProduct ? (initialProduct.is_active ?? true) : true);
  const [rawKeysText, setRawKeysText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF).");
      return;
    }

    setUploadingImage(true);
    try {
      const res = await productService.uploadProductImage(file);
      setImageUrl(res.image_url);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upload image. Please try again or paste image link.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (initialProduct) {
      setCategoryId(initialProduct.category_id);
      setTitle(initialProduct.title || "");
      setDescription(initialProduct.description || "");
      setPrice(initialProduct.price ? String(initialProduct.price) : "");
      setImageUrl(initialProduct.image_url || "");
      setIsActive(initialProduct.is_active ?? true);
      setRawKeysText("");
    } else {
      setCategoryId(categories[0]?.id || 1);
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
    if (!title || !price || !categoryId) return;

    setLoading(true);
    try {
      let savedProduct: Product;
      if (initialProduct) {
        savedProduct = await productService.updateProduct(initialProduct.id, {
          category_id: categoryId,
          title,
          description,
          price: Number(price),
          image_url: imageUrl,
          is_active: isActive,
        });
      } else {
        savedProduct = await productService.createProduct({
          category_id: categoryId,
          title,
          description,
          price: Number(price),
          image_url: imageUrl,
          is_active: isActive,
        });
      }

      // If keys are provided, upload them immediately to add to stock
      if (rawKeysText.trim()) {
        await stockService.bulkUploadKeys({
          product_id: savedProduct.id,
          raw_keys_text: rawKeysText,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert("Failed to save product and stock keys.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProduct ? "✏️ Edit Product Details" : "➕ Add New Product Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-kantumruy-pro max-h-[80vh] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || "📦"} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CapCut Pro 1 Year Subscription"
            className="text-slate-100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Price ($ USD)</label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10.00"
              className="text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Stock Level</label>
            <div className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Key className="h-4 w-4 text-emerald-400" />
                Available Keys:
              </span>
              <span className="font-bold text-emerald-400">
                {initialProduct ? initialProduct.stock_count : 0}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Item feature description details..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 🖼️ Product Thumbnail / Photo Upload (Displayed on Store Website) */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              <span>Product Photo / Thumbnail</span>
            </label>
            <span className="text-[10px] text-blue-400 font-medium">Shows on store website</span>
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
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Remove
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
                    <span className="text-xs text-blue-400 font-medium">Uploading photo...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      Click to upload photo or thumbnail
                    </div>
                    <div className="text-[10px] text-slate-400">
                      PNG, JPG, WEBP (Instant automated upload)
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Link toggle */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Or use direct image URL:</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Link2 className="h-3 w-3" />
                  {showUrlInput ? "Hide Link Input" : "Paste Image URL"}
                </button>
              </div>

              {showUrlInput && (
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-8 text-xs text-slate-100"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Digital Keys Payload directly to Stock */}
        <div className="border-t border-slate-800 pt-3 mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              📥 Add Stock Keys (One key per line, Optional)
            </label>
            {keyCount > 0 && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {keyCount} keys detected
              </span>
            )}
          </div>
          <textarea
            rows={4}
            value={rawKeysText}
            onChange={(e) => setRawKeysText(e.target.value)}
            placeholder={`Paste digital license keys, credentials, or codes here:\nKEY-XXXX-YYYY\nKEY-AAAA-BBBB`}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-400 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-400" /> Keys are encrypted with AES-256 upon submission.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Stock Status:</label>
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
            {isActive ? "In-Stock" : "Out-Stock"}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : initialProduct ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
