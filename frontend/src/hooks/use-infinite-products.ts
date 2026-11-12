import { useCallback, useEffect, useRef, useState } from "react";
import { storeService, StoreProduct } from "@/services/store.service";

interface UseInfiniteProductsOptions {
  categoryId?: number | null;
  search?: string;
  sort?: string;
  pageSize?: number;
  debounceMs?: number;
}

export function useInfiniteProducts({
  categoryId = null,
  search = "",
  sort = "newest",
  pageSize = 8,
  debounceMs = 0,
}: UseInfiniteProductsOptions = {}) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const requestIdRef = useRef<number>(0);
  const fetchingMoreRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = products.length < total;

  useEffect(() => {
    const reqId = ++requestIdRef.current;
    fetchingMoreRef.current = false;
    setLoadingMore(false);
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { items, total: totalCount } = await storeService.getProductsPage(
          {
            category_id: categoryId || undefined,
            search: search.trim() || undefined,
            sort,
            limit: pageSize,
            offset: 0,
          },
          false
        );
        if (requestIdRef.current !== reqId) return;
        setProducts(items);
        setTotal(totalCount);
      } catch (err) {
        if (requestIdRef.current !== reqId) return;
        console.error("Failed to load products:", err);
      } finally {
        if (requestIdRef.current === reqId) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [categoryId, search, sort, pageSize, debounceMs]);

  const loadMore = useCallback(async () => {
    if (loading || fetchingMoreRef.current || products.length >= total) return;

    const reqId = requestIdRef.current;
    fetchingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const { items, total: totalCount } = await storeService.getProductsPage(
        {
          category_id: categoryId || undefined,
          search: search.trim() || undefined,
          sort,
          limit: pageSize,
          offset: products.length,
        },
        true
      );
      if (requestIdRef.current !== reqId) return;

      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const uniqueNext = items.filter((p) => !seen.has(p.id));
        return [...prev, ...uniqueNext];
      });
      setTotal(totalCount);
    } catch (err) {
      if (requestIdRef.current !== reqId) return;
      console.error("Failed to load more products:", err);
    } finally {
      if (requestIdRef.current === reqId) {
        fetchingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [loading, products.length, total, categoryId, search, sort, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "280px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return {
    products,
    total,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sentinelRef,
  };
}

