import { apiClient } from "@/lib/api-client";

export interface GeneralMerchantInfo {
  merchant_name: string;
  merchant_city: string;
  bakong_account_id: string;
  merchant_id: string;
  acquiring_bank: string;
  aba_account_name: string;
  aba_account_number: string;
  currency: string;
  api_url: string;
}

export interface BakongTokenItem {
  index: number;
  preview: string;
  full_token: string;
  status: "ACTIVE" | "EXHAUSTED";
  status_text: string;
  requests_per_day: number;
  used_requests?: number;
  remaining_requests?: number;
  quota_display?: string;
  is_current: boolean;
}

export interface TokenPoolStatus {
  total_tokens: number;
  active_count: number;
  exhausted_count: number;
  total_daily_quota: number;
  used_requests: number;
  remaining_quota: number;
  quota_display: string;
  tokens: BakongTokenItem[];
}

export interface PaymentMetrics {
  total_khqr_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_khqr_volume_usd: number;
  total_transactions: number;
  total_topup_volume_usd: number;
}

export interface PaymentManagementData {
  general_info: GeneralMerchantInfo;
  token_pool: TokenPoolStatus;
  metrics: PaymentMetrics;
}

export interface TokenTestResult {
  valid: boolean;
  status: string;
  message: string;
  raw?: any;
}

export interface CustomerPaymentItem {
  id: string;
  raw_id: number;
  category: "ORDER" | "TOPUP";
  payment_type: "KHQR_ORDER" | "BALANCE_ORDER" | "KHQR_TOPUP" | "TOPUP";
  payment_method: string;
  customer: {
    id: number | null;
    telegram_id: number | null;
    username: string | null;
    name: string;
  };
  amount: number;
  status: "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED" | string;
  raw_status: string;
  khqr_md5: string | null;
  description: string;
  created_at: string | null;
}

export interface PaymentHistorySummary {
  total_volume_usd: number;
  completed_count: number;
  pending_count: number;
  failed_count: number;
}

export interface PaymentHistoryResponse {
  items: CustomerPaymentItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: PaymentHistorySummary;
}

export interface PaymentHistoryFilters {
  search?: string;
  status?: string;
  payment_type?: string;
  date_range?: string;
  page?: number;
  page_size?: number;
}

export const paymentService = {
  async getPaymentStatus(): Promise<PaymentManagementData> {
    const res = await apiClient.get<PaymentManagementData>("/payments/status");
    return res.data;
  },

  async testToken(token: string): Promise<TokenTestResult> {
    const res = await apiClient.post<TokenTestResult>("/payments/test-token", { token });
    return res.data;
  },

  async updateTokens(tokens: string[]): Promise<{ success: boolean; message: string; total_tokens: number; total_daily_quota: number }> {
    const res = await apiClient.put("/payments/tokens", { tokens });
    return res.data;
  },

  async updateMerchantInfo(data: Partial<GeneralMerchantInfo>): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.put("/payments/merchant-info", data);
    return res.data;
  },

  async getTransactions(limit: number = 50): Promise<any[]> {
    const res = await apiClient.get<any[]>("/payments/transactions", { params: { limit } });
    return res.data;
  },

  async getPaymentHistory(filters?: PaymentHistoryFilters): Promise<PaymentHistoryResponse> {
    const res = await apiClient.get<PaymentHistoryResponse>("/payments/history", { params: filters });
    return res.data;
  },

  async verifyPayment(paymentId: string): Promise<{ success: boolean; status: string; message: string; details?: any }> {
    const res = await apiClient.post<{ success: boolean; status: string; message: string; details?: any }>(
      `/payments/verify/${paymentId}`
    );
    return res.data;
  },
};

