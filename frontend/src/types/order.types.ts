export interface CustomerUser {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  balance: number;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  unit_price: number;
  delivered_payload?: string;
  product?: {
    title: string;
  };
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  source?: string;
  payment_method?: string;
  receipt_url?: string;
  khqr_md5?: string;
  created_at: string;
  user?: CustomerUser;
  items: OrderItem[];
}

export interface AnalyticsOverview {
  today_revenue: number;
  total_revenue: number;
  sold_today: number;
  total_orders: number;
  total_users: number;
  low_stock_alerts: number;
  live_feed: Array<{
    order_id: number;
    user: string;
    product_title: string;
    amount: number;
    created_at: string;
  }>;
  chart_data?: Array<{
    name: string;
    revenue: number;
    sales: number;
  }>;
}

