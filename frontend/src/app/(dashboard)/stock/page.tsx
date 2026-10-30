"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Upload,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  LayoutGrid,
  List,
  X,
  Package,
  FolderOpen,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BulkUploadModal } from "@/components/features/stock/bulk-upload-modal";
import { productService } from "@/services/product.service";
import { Product, Category } from "@/types/product.types";
import { formatCurrency } from "@/lib/utils";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

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

  const handleOpenUpload = (productId?: number) => {
    setSelectedProductId(productId || null);
    setIsUploadModalOpen(true);
  };

  // Stats calculation
  const totalStockKeys = products.reduce((acc, p) => acc + (p.stock_count || 0), 0);
  const inStockProducts = products.filter((p) => p.stock_count > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock_count <= 0).length;
  const totalProducts = products.length;

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
    if (stockFilter === "low_stock" && (prod.stock_count <= 0 || prod.stock_count > 5)) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "stock_desc") return (b.stock_count || 0) - (a.stock_count || 0);
    if (sortBy === "stock_asc") return (a.stock_count || 0) - (b.stock_count || 0);
    if (sortBy === "price_desc") return Number(b.price) - Number(a.price);
    if (sortBy === "price_asc") return Number(a.price) - Number(b.price);
    if (sortBy === "title_asc") return a.title.localeCompare(b.title);
    return b.id - a.id;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("newest");
  };

  const isFiltered = searchQuery || categoryFilter !== "all" || stockFilter !== "all" || sortBy !== "newest";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>🔑 Digital Inventory & Keys Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            AES-256 Encrypted stock repository with instant bulk multi-line text ingestion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenUpload()}
            disabled={products.length === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          >
            <Upload className="h-4 w-4" />
            Bulk Key Upload
          </Button>
        </div>
      </div>

      {/* 📊 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Available Keys</span>
            <Key className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{totalStockKeys}</div>
          <div className="text-[11px] text-slate-500">Ready in digital vault</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>In Stock</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{inStockProducts}</div>
          <div className="text-[11px] text-emerald-500/80 font-medium">Products with keys</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Out of Stock</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{outOfStockProducts}</div>
          <div className="text-[11px] text-rose-500/80 font-medium">Needs urgent refill</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tracked Items</span>
            <Package className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{totalProducts}</div>
          <div className="text-[11px] text-slate-500">Products in catalog</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Security Vault</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-slate-100 flex items-center gap-1.5 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AES-256</span>
          </div>
          <div className="text-[11px] text-slate-500">Encrypted at rest</div>
        </div>
      </div>

      {/* 🔍 Filters & Search Toolbar - All on ONE LINE */}
      <div className="flex items-center gap-2 p-2.5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm overflow-x-auto scrollbar-none">
        
        {/* Search Input */}
        <div className="relative min-w-[200px] max-w-[280px] flex-1 flex-shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search vault products..."
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
          <option value="all">⚡ All Vault Stock</option>
          <option value="in_stock">✓ In Stock (Keys &gt; 0)</option>
          <option value="low_stock">⚠️ Low Stock (&le; 5 Keys)</option>
          <option value="out_of_stock">🔴 Out of Stock (0 Keys)</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-xl border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
        >
          <option value="newest">Newest</option>
          <option value="stock_desc">Highest Keys</option>
          <option value="stock_asc">Lowest Keys</option>
          <option value="price_desc">Price: High - Low</option>
          <option value="price_asc">Price: Low - High</option>
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
          Showing <strong className="text-slate-200">{filteredProducts.length}</strong> of {products.length} vault items
        </span>
      </div>

      {/* 🗂️ View 1: Card Grid View */}
      {viewMode === "cards" && (
        <div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
              <Key className="h-10 w-10 text-slate-600 mx-auto" />
              <h4 className="font-bold text-slate-300 text-sm">No vault stock found</h4>
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
                    className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
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
                            <span>{cat?.icon || "🔑"}</span>
                            <span className="text-[10px] text-slate-500">No Photo</span>
                          </div>
                        )}

                        {/* Category badge */}
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900/85 backdrop-blur-md text-slate-200 border border-slate-700/60">
                            <span>{cat?.icon || "📁"}</span>
                            <span className="truncate max-w-[90px]">{cat?.name || "General"}</span>
                          </span>
                        </div>

                        {/* Live Key Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={prod.stock_count > 5 ? "success" : prod.stock_count > 0 ? "warning" : "danger"}
                            className="text-[10px] px-2 py-0.5 backdrop-blur-md font-bold"
                          >
                            {inStock ? `🟢 ${prod.stock_count} Keys` : "🔴 Out of Stock"}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-mono">#{prod.id}</span>
                          <span className="font-extrabold text-sm text-slate-200">
                            {formatCurrency(prod.price)}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                          {prod.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {prod.description || "Encrypted digital subscription license pool."}
                        </p>
                      </div>
                    </div>

                    {/* Card Bottom: Action Button */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {inStock ? `${prod.stock_count} Available` : "Refill needed"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenUpload(prod.id)}
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Keys
                      </Button>
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
              <TableHead>Unit Price</TableHead>
              <TableHead>Vault Stock Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                  {loading ? "Inspecting vault stock..." : "No vault items matching your search or filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((prod) => {
                const cat = categories.find((c) => c.id === prod.category_id);
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
                            <span className="text-base">{cat?.icon || "🔑"}</span>
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
                        <FolderOpen className="h-3 w-3 mr-1 text-slate-400" />
                        {cat ? `${cat.icon || "📦"} ${cat.name}` : `Cat #${prod.category_id}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-300">{formatCurrency(prod.price)}</TableCell>
                    <TableCell>
                      <Badge variant={prod.stock_count > 5 ? "success" : prod.stock_count > 0 ? "warning" : "danger"}>
                        {prod.stock_count > 0 ? `🟢 ${prod.stock_count} Unsold Keys` : "🔴 Out of Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUpload(prod.id)}
                        className="text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Keys
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Bulk Upload Modal */}
      {isUploadModalOpen && (
        <BulkUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedProductId(null);
          }}
          products={products}
          initialProductId={selectedProductId}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
