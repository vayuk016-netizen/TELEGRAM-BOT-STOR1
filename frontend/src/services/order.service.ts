import { apiClient } from "@/lib/api-client";
import { Order, AnalyticsOverview } from "@/types/order.types";

export const orderService = {
  async getAnalytics(skipLoader: boolean = false): Promise<AnalyticsOverview> {
    const res = await apiClient.get<AnalyticsOverview>("/analytics/overview", {
      headers: skipLoader ? { "x-skip-loader": "true" } : undefined,
    });
    return res.data;
  },

  async getOrders(skip: number = 0, limit: number = 50): Promise<Order[]> {
    const res = await apiClient.get<Order[]>("/orders", { params: { skip, limit } });
    return res.data;
  },

  async verifyBakongOrder(orderId: number): Promise<{ status: string; message: string; delivered_payload?: string }> {
    const res = await apiClient.post(`/orders/${orderId}/verify-bakong`);
    return res.data;
  },

  async fulfillOrderManually(orderId: number): Promise<{ status: string; message: string; delivered_payload?: string }> {
    const res = await apiClient.post(`/orders/${orderId}/fulfill`);
    return res.data;
  },

  async cancelOrder(orderId: number): Promise<{ status: string; message: string }> {
    const res = await apiClient.post(`/orders/${orderId}/cancel`);
    return res.data;
  },
};
