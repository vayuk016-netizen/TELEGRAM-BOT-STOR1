export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number;
  image_url?: string;
  is_active: boolean;
  stock_count: number;
  created_at: string;
  updated_at: string;
}
