export interface ProductDiscountInfo {
  hasPromo: boolean;
  originalPrice: number | null;
  currentPrice: number;
  discountPercent: number;
  savingsAmount: number;
}

interface DiscountableProduct {
  price: number;
  original_price?: number | null;
  discount_percent?: number;
}

/**
 * Compute uniform discount metrics from a product's current and original price.
 * Promotion 50% / discount badges are disabled so cards display standard pricing.
 */
export function getProductDiscount(product: DiscountableProduct): ProductDiscountInfo {
  const curr = Number(product?.price) || 0;
  return {
    hasPromo: false,
    originalPrice: null,
    currentPrice: curr,
    discountPercent: 0,
    savingsAmount: 0,
  };
}

