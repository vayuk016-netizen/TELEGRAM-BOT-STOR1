"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Package,
  Edit,
  Trash2,
  Tag,
  RefreshCw,
  FolderOpen,
  Search,
  Filter,
  LayoutGrid,
  List,
  Key,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductFormModal } from "@/components/features/products/product-form";
import { CategoryFormModal } from "@/components/features/products/category-form";
import { productService } from "@/services/product.service";
import { Category, Product } from "@/types/product.types";
import { formatCurrency } from "@/lib/utils";

type TabKey = "products" | "categories";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productService.deleteProduct(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  const handleEditCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleAddNewCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? All products inside will also be affected.")) return;
    try {
      await productService.deleteCategory(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete category.");
    }
  };

  const handleToggleCategoryStatus = async (cat: Category) => {
    try {
      await productService.updateCategory(cat.id, {
        is_active: !cat.is_active,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err) {
      alert("Failed to toggle category stock status.");
    }
  };

  const handleToggleProductStatus = async (prod: Product) => {
    try {
      await productService.updateProduct(prod.id, {
        is_active: !prod.is_active,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      alert("Failed to toggle product stock status.");
    }
  };

  // Stats calculation
  const totalProducts = products.length;
  const inStockProducts = products.filter((p) => p.stock_count > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock_count <= 0).length;
  const totalStockKeys = products.reduce((acc, p) => acc + (p.stock_count || 0), 0);
  const totalCategories = categories.length;

  // Filter & Search logic
  const filteredProducts = products.filter((prod) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = prod.title.toLowerCase().includes(q);
      const matchDesc = (prod.description || "").toLowerCase().includes(q);
      const matchId = String(prod.id).includes(q);
      if (!matchTitle && !matchDesc && !matchId) return false;
    }

    if (categoryFilter !== "all" && prod.category_id !== Number(categoryFilter)) {
      return false;
    }

    if (stockFilter === "in_stock" && prod.stock_count <= 0) return false;
    if (stockFilter === "out_of_stock" && prod.stock_count > 0) return false;

    if (statusFilter === "active" && !prod.is_active) return false;
    if (statusFilter === "inactive" && prod.is_active) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
    if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
    if (sortBy === "stock_desc") return (b.stock_count || 0) - (a.stock_count || 0);
    if (sortBy === "title_asc") return a.title.localeCompare(b.title);
    return b.id - a.id;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setStatusFilter("all");
    setSortBy("newest");
  };

  const isFiltered = searchQuery || categoryFilter !== "all" || stockFilter !== "all" || statusFilter !== "all" || sortBy !== "newest";

  const tabs = [
    { key: "products" as TabKey, label: "📦 Products", count: products.length },
    { key: "categories" as TabKey, label: "📂 Categories", count: categories.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">🛍️ Products Catalog Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage store product categories, prices, descriptions, and active stock levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddNewCategory}
            className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddNewProduct} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* 📊 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Products</span>
            <Package className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{totalProducts}</div>
          <div className="text-[11px] text-slate-500">Across {totalCategories} categories</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>In Stock</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{inStockProducts}</div>
          <div className="text-[11px] text-emerald-500/80 font-medium">Ready for instant delivery</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Out of Stock</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{outOfStockProducts}</div>
          <div className="text-[11px] text-rose-500/80 font-medium">Needs digital keys refill</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Available Keys</span>
            <Key className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalStockKeys}</div>
          <div className="text-[11px] text-slate-500">Total digital license pool</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Categories</span>
            <FolderOpen className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{totalCategories}</div>
          <div className="text-[11px] text-slate-500">Active store groups</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-slate-800 text-slate-100 border-b-2 border-blue-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-4">
          
          {/* 🔍 Filters & Search Toolbar - All on ONE LINE */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-x-auto scrollbar-none">
            
            {/* Search Input */}
            <div className="relative min-w-[200px] max-w-[280px] flex-1 flex-shrink-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-7 h-9 text-xs bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
            >
              <option value="all">📁 All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || "📦"} {c.name}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
            >
              <option value="all">⚡ All Stock</option>
              <option value="in_stock">✓ In Stock</option>
              <option value="out_of_stock">⚠️ Out of Stock</option>
            </select>

            {/* Active / Inactive Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
            >
              <option value="all">🏷️ All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low - High</option>
              <option value="price_desc">Price: High - Low</option>
              <option value="stock_desc">Highest Stock</option>
              <option value="title_asc">Name: A - Z</option>
            </select>

            {/* Reset button if filtered */}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-0.5 ml-auto flex-shrink-0">
              <button
                onClick={() => setViewMode("cards")}
                title="Card Grid View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Results count indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-200">{filteredProducts.length}</strong> of {products.length} products
            </span>
          </div>

          {/* 🗂️ View 1: Card Grid View */}
          {viewMode === "cards" && (
            <div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
                  <Package className="h-10 w-10 text-slate-600 mx-auto" />
                  <h4 className="font-bold text-slate-300 text-sm">No products found</h4>
                  <p className="text-xs text-slate-500">Try adjusting your search or filters.</p>
                  {isFiltered && (
                    <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2 text-xs">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((prod) => {
                    const cat = categories.find((c) => c.id === prod.category_id);
                    const inStock = prod.stock_count > 0;

                    return (
                      <div
                        key={prod.id}
                        className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5 hover:border-blue-500/40 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          
                          {/* Card Thumbnail Image (or Icon fallback) */}
                          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="text-4xl text-slate-600 flex flex-col items-center justify-center gap-1">
                                <span>{cat?.icon || "📦"}</span>
                                <span className="text-[10px] text-slate-500">No Photo</span>
                              </div>
                            )}

                            {/* Badge overlays */}
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/85 backdrop-blur-md text-slate-200 border border-slate-700/60">
                                <span>{cat?.icon || "📁"}</span>
                                <span className="truncate max-w-[90px]">{cat?.name || "General"}</span>
                              </span>
                            </div>

                            <div className="absolute top-2 right-2">
                              <Badge variant={inStock ? "success" : "danger"} className="text-[10px] px-2 py-0.5 backdrop-blur-md">
                                {inStock ? `${prod.stock_count} Keys` : "Out of Stock"}
                              </Badge>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span className="font-mono">#{prod.id}</span>
                              <span className="font-extrabold text-sm text-emerald-400">
                                {formatCurrency(prod.price)}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                              {prod.title}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {prod.description || "No description provided."}
                            </p>
                          </div>
                        </div>

                        {/* Card Bottom: Status & Actions */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(prod)}
                            title="Click to toggle In-Stock / Out-Stock"
                            className="cursor-pointer active:scale-95 transition-transform"
                          >
                            <Badge variant={prod.is_active ? "success" : "danger"} className="text-[10px]">
                              {prod.is_active ? "In-Stock" : "Out-Stock"}
                            </Badge>
                          </button>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(prod)}
                              className="h-8 px-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 📊 View 2: Table View */}
          {viewMode === "table" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Available Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      {loading ? "Loading products catalog..." : "No products matching your search or filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((prod) => {
                    const cat = categories.find((c) => c.id === prod.category_id);
                    const inStock = prod.stock_count > 0;
                    return (
                      <TableRow key={prod.id}>
                        <TableCell className="font-mono text-xs text-slate-400">#{prod.id}</TableCell>
                        <TableCell className="font-semibold text-slate-100">
                          <div className="flex items-center gap-3">
                            {/* Product Photo Thumbnail */}
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                              {prod.image_url ? (
                                <img
                                  src={prod.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-base">{cat?.icon || "📦"}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-sm text-slate-100">
                                {prod.title}
                              </span>
                              {prod.description && (
                                <span className="block text-[11px] text-slate-400 truncate max-w-[220px]">
                                  {prod.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">
                            <Tag className="h-3 w-3 mr-1 text-slate-400" />
                            {cat ? `${cat.icon || "📦"} ${cat.name}` : `Cat #${prod.category_id}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-emerald-400">
                          {formatCurrency(prod.price)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={inStock ? "success" : "danger"}>
                            {inStock ? `${prod.stock_count} Keys Available` : "Out of Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(prod)}
                            title="Click to toggle In-Stock / Out-Stock"
                            className="cursor-pointer transition-transform active:scale-95 text-left"
                          >
                            <Badge variant={prod.is_active ? "success" : "danger"}>
                              {prod.is_active ? "In-Stock" : "Out-Stock"}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(prod)}>
                            <Edit className="h-4 w-4 text-blue-400" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(prod.id)}>
                            <Trash2 className="h-4 w-4 text-rose-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                  {loading ? "Loading categories..." : "No categories yet. Click 'Add Category' to start."}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => {
                const productCount = products.filter((p) => p.category_id === cat.id).length;
                return (
                  <TableRow key={cat.id}>
                    <TableCell className="font-mono text-xs text-slate-400">#{cat.id}</TableCell>
                    <TableCell className="text-2xl">{cat.icon || "📦"}</TableCell>
                    <TableCell className="font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-yellow-400" />
                        <span>{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 max-w-[200px] truncate">
                      {cat.description || <span className="italic text-slate-600">No description</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">
                        <Package className="h-3 w-3 mr-1" />
                        {productCount} Products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleCategoryStatus(cat)}
                        title="Click to toggle In-Stock / Out-Stock"
                        className="cursor-pointer transition-transform active:scale-95 text-left"
                      >
                        <Badge variant={cat.is_active ? "success" : "danger"}>
                          {cat.is_active ? "In-Stock" : "Out-Stock"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCategory(cat)}>
                        <Edit className="h-4 w-4 text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categories={categories}
          initialProduct={selectedProduct}
          onSuccess={fetchData}
        />
      )}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setSelectedCategory(null);
          }}
          onSuccess={fetchData}
          editCategory={selectedCategory}
        />
      )}
    </div>
  );
}

