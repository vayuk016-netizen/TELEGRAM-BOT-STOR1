"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productService } from "@/services/product.service";
import { Category } from "@/types/product.types";
import { AlertCircle, Loader2, FolderPlus, Save } from "lucide-react";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category, isNew: boolean) => void;
  editCategory?: Category | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editCategory = null,
}) => {
  const [name, setName] = useState<string>("");
  const [icon, setIcon] = useState<string>("📁");
  const [description, setDescription] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEditMode = !!editCategory;

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name || "");
      setIcon(editCategory.icon || "📁");
      setDescription(editCategory.description || "");
      setIsActive(editCategory.is_active ?? true);
      setErrorMsg(null);
    } else {
      setName("");
      setIcon("📁");
      setDescription("");
      setIsActive(true);
      setErrorMsg(null);
    }
  }, [editCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("សូមបញ្ចូលឈ្មោះ Category (Please enter category name).");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let savedCat: Category;
      if (isEditMode && editCategory) {
        savedCat = await productService.updateCategory(editCategory.id, {
          name: name.trim(),
          icon: icon.trim() || "📁",
          description: description.trim() || undefined,
          is_active: isActive,
        });
      } else {
        savedCat = await productService.createCategory({
          name: name.trim(),
          icon: icon.trim() || "📁",
          description: description.trim() || undefined,
          is_active: isActive,
        });
      }

      onSuccess(savedCat, !isEditMode);
      onClose();
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        (isEditMode ? "Failed to update category." : "Failed to create category.");
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  const sampleIcons = ["🎬", "🎨", "🎵", "⚡", "🤖", "🎮", "📱", "💼", "🔐", "📁"];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `✏️ កែប្រែ Category — ${editCategory?.name}` : "📁 បង្កើត Category ថ្មី (Add Category)"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-kantumruy-pro">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Icon / Emoji</label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📁"
              className="text-center text-lg h-10 text-slate-100 font-emoji"
              required
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ឈ្មោះ Category <span className="text-rose-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="ឧទាហរណ៍៖ Video Editing, Streaming..."
              className="text-slate-100"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Quick Icon Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-slate-500 mr-1">Icon គំរូ:</span>
          {sampleIcons.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm flex items-center justify-center transition-colors"
            >
              {ic}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            ការពិពណ៌នា (Description - Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="សេចក្តីលម្អិតសង្ខេបអំពី Category នេះ..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <input
            type="checkbox"
            id="cat-active-toggle"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
          />
          <label htmlFor="cat-active-toggle" className="text-xs text-slate-300 cursor-pointer select-none">
            បើកដំណើរការ (Active Category ដាក់លក់ជាសាធារណៈ)
          </label>
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
            disabled={loading || !name.trim()}
            className="text-xs gap-1.5 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>កំពុងរក្សាទុក...</span>
              </>
            ) : (
              <>
                {isEditMode ? <Save className="h-4 w-4" /> : <FolderPlus className="h-4 w-4" />}
                <span>{isEditMode ? "រក្សាទុកការកែប្រែ" : "បង្កើត Category ថ្មី"}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
