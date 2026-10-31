import { apiClient } from "@/lib/api-client";
import {
  BulkUploadPayload,
  BulkUploadResponse,
  StockStats,
  StockKeyItem,
  DeleteKeyResponse,
} from "@/types/stock.types";

export const stockService = {
  async bulkUploadKeys(payload: BulkUploadPayload): Promise<BulkUploadResponse> {
    const res = await apiClient.post<BulkUploadResponse>("/stock/bulk-upload", payload);
    return res.data;
  },

  async auditStock(productId: number): Promise<{ product_id: number; stats: StockStats }> {
    const res = await apiClient.get<{ product_id: number; stats: StockStats }>(`/stock/audit/${productId}`);
    return res.data;
  },

  async listKeys(productId: number, isSold?: boolean, limit: number = 100): Promise<StockKeyItem[]> {
    const params: Record<string, any> = { limit };
    if (typeof isSold === "boolean") {
      params.is_sold = isSold;
    }
    const res = await apiClient.get<StockKeyItem[]>(`/stock/keys/${productId}`, { params });
    return res.data;
  },

  async deleteKey(keyId: number): Promise<DeleteKeyResponse> {
    const res = await apiClient.delete<DeleteKeyResponse>(`/stock/keys/${keyId}`);
    return res.data;
  },

  async clearUnsoldKeys(productId: number): Promise<DeleteKeyResponse> {
    const res = await apiClient.delete<DeleteKeyResponse>(`/stock/clear-unsold/${productId}`);
    return res.data;
  },
};
