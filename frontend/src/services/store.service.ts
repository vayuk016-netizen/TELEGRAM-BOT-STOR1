import { apiClient } from "@/lib/api-client";
import {
  getBrowserCache,
  setBrowserCache,
  invalidateBrowserCache,
} from "@/lib/browser-cache";

const TTL_STORE_INFO_MS = 5 * 60 * 1000;
const TTL_CATEGORIES_MS = 2 * 60 * 1000;
const TTL_PRODUCTS_MS = 45 * 1000;

function buildProductsCacheKey(params?: {
  category_id?: number;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): string {
  return `products:${params?.category_id ?? "all"}:${(params?.search || "").trim().toLowerCase()}:${params?.sort || "newest"}:${params?.limit ?? "all"}:${params?.offset ?? 0}`;
}

export interface StoreCategory {
  id: number;
  name: string;
  icon: string;
  description: string;
  product_count: number;
}

export interface StoreProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number;
  image_url?: string;
  is_active: boolean;
  stock_count: number;
  category: {
    id: number;
    name: string;
    icon: string;
  };
}

export interface StoreInfo {
  store_name: string;
  currency: string;
  currency_symbol: string;
  bot_username: string;
  telegram_contact: string;
  aba: {
    account_name: string;
    account_number: string;
    qr_link?: string;
  };
  khqr: {
    merchant_name: string;
    merchant_city: string;
    account_number: string;
  };
}

export interface CreateOrderPayload {
  product_id: number;
  quantity: number;
  payment_method: "khqr" | "manual" | "balance";
  telegram_id?: number;
  customer_name?: string;
}

export interface OrderDetail {
  order_id: number;
  status: "PENDING" | "PAID" | "COMPLETED" | "DELIVERED" | "CANCELLED";
  total_amount: number;
  source: string;
  payment_method?: string;
  receipt_url?: string;
  created_at: string;
  khqr_qr_data_url?: string;
  khqr_qr_url?: string;
  deep_link?: string;
  product: {
    id: number;
    title: string;
    price: number;
    image_url?: string;
  };
  delivered_payload?: string | null;
}

export interface TelegramAuthData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const storeService = {
  invalidateCache() {
    invalidateBrowserCache("products");
    invalidateBrowserCache("categories");
  },

  async getStoreInfo(): Promise<StoreInfo> {
    const cached = getBrowserCache<StoreInfo>("store-info");
    if (cached) return cached;

    const res = await apiClient.get<StoreInfo>("/public/store-info");
    setBrowserCache("store-info", res.data, TTL_STORE_INFO_MS);
    return res.data;
  },

  async getCategories(): Promise<StoreCategory[]> {
    const cached = getBrowserCache<StoreCategory[]>("categories");
    if (cached) return cached;

    const res = await apiClient.get<StoreCategory[]>("/public/categories");
    setBrowserCache("categories", res.data, TTL_CATEGORIES_MS);
    return res.data;
  },

  async getProducts(params?: {
    category_id?: number;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoreProduct[]> {
    const cacheKey = buildProductsCacheKey(params);
    const cached = getBrowserCache<StoreProduct[]>(`list:${cacheKey}`);
    if (cached) return cached;

    const res = await apiClient.get<StoreProduct[]>("/public/products", { params });
    setBrowserCache(`list:${cacheKey}`, res.data, TTL_PRODUCTS_MS);
    return res.data;
  },

  async getProductsPage(
    params?: {
      category_id?: number;
      search?: string;
      sort?: string;
      limit?: number;
      offset?: number;
    },
    skipLoader: boolean = false
  ): Promise<{ items: StoreProduct[]; total: number }> {
    const cacheKey = `page:${buildProductsCacheKey(params)}`;
    const cached = getBrowserCache<{ items: StoreProduct[]; total: number }>(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get<StoreProduct[]>("/public/products", {
      params,
      headers: skipLoader ? { "x-skip-loader": "true" } : undefined,
    });
    const rawHeader = res.headers?.["x-total-count"] ?? res.headers?.["X-Total-Count"];
    const parsedTotal = rawHeader !== undefined ? Number(rawHeader) : NaN;
    const offset = params?.offset ?? 0;
    const items = Array.isArray(res.data) ? res.data : [];
    const total = Number.isFinite(parsedTotal) ? parsedTotal : offset + items.length;
    const payload = { items, total };
    setBrowserCache(cacheKey, payload, TTL_PRODUCTS_MS);
    return payload;
  },

  async getProduct(id: number): Promise<StoreProduct> {
    const cacheKey = `product:${id}`;
    const cached = getBrowserCache<StoreProduct>(cacheKey);
    if (cached) return cached;

    const res = await apiClient.get<StoreProduct>(`/public/products/${id}`);
    setBrowserCache(cacheKey, res.data, TTL_PRODUCTS_MS);
    return res.data;
  },

  async createOrder(data: CreateOrderPayload): Promise<any> {
    const res = await apiClient.post("/public/orders", data);
    this.invalidateCache();
    return res.data;
  },

  async getOrderStatus(orderId: number, skipLoader: boolean = false): Promise<OrderDetail> {
    const res = await apiClient.get<OrderDetail>(`/public/orders/${orderId}`, {
      headers: skipLoader ? { "x-skip-loader": "true" } : undefined,
    });
    return res.data;
  },

  async verifyKhqrPayment(orderId: number): Promise<{
    order_id: number;
    status: string;
    delivered_payload?: string;
    message: string;
  }> {
    const res = await apiClient.post(`/public/orders/${orderId}/verify-payment`);
    return res.data;
  },

  async uploadReceipt(orderId: number, file: File): Promise<{
    order_id: number;
    receipt_url: string;
    message: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`/public/orders/${orderId}/upload-receipt`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getUserOrders(telegramId: number): Promise<any[]> {
    const res = await apiClient.get(`/public/orders/user/${telegramId}`);
    return res.data;
  },

  async telegramLogin(data: TelegramAuthData): Promise<{
    access_token: string;
    token_type: string;
    user: {
      id: number;
      telegram_id: number;
      username?: string;
      first_name: string;
      last_name?: string;
      balance: number;
      photo_url?: string;
    };
  }> {
    const res = await apiClient.post("/public/auth/telegram", data);
    return res.data;
  },

  async getCustomerProfile(): Promise<any> {
    const res = await apiClient.get("/public/auth/me");
    return res.data;
  },
};

