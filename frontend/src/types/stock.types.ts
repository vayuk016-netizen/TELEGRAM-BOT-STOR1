export interface BulkUploadPayload {
  product_id: number;
  raw_keys_text: string;
  skip_duplicates?: boolean;
}

export interface BulkUploadResponse {
  product_id: number;
  keys_added: number;
  current_stock: number;
  duplicates_skipped?: number;
  message: string;
}

export interface StockStats {
  total_keys: number;
  unsold_keys: number;
  sold_keys: number;
}

export interface StockKeyItem {
  id: number;
  product_id: number;
  is_sold: boolean;
  order_id?: number | null;
  created_at: string;
  sold_at?: string | null;
  key_preview: string;
  raw_content?: string | null;
}

export interface DeleteKeyResponse {
  success: boolean;
  message: string;
  product_id: number;
  current_stock: number;
}
