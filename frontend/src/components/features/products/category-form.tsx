"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productService } from "@/services/product.service";
import { Category } from "@/types/product.types";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

  const isEditMode = !!editCategory;

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name || "");
      setIcon(editCategory.icon || "📁");
      setDescription(editCategory.description || "");
      setIsActive(editCategory.is_active ?? true);
    } else {
      setName("");
      setIcon("📁");
      setDescription("");
      setIsActive(true);
    }
  }, [editCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (isEditMode && editCategory) {
        await productService.updateCategory(editCategory.id, {
          name,
          icon,
          description,
          is_active: isActive,
        });
      } else {
        await productService.createCategory({
          name,
          icon,
          description,
          is_active: isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(isEditMode ? "Failed to update category." : "Failed to create category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `✏️ Edit Category — ${editCategory?.name}` : "📁 Add New Category"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-kantumruy-pro">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Icon / Emoji</label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📁"
              className="text-center text-lg h-10 text-slate-100"
              required
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Video Editing, Streaming Accounts"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Category description details..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
            {loading
              ? isEditMode ? "Saving..." : "Creating..."
              : isEditMode ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
