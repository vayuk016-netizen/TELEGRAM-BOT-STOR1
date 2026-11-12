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
 */
export function getProductDiscount(product: DiscountableProduct): ProductDiscountInfo {
  const curr = Number(product.price) || 0;
  const orig =
    product.original_price !== null && product.original_price !== undefined
      ? Number(product.original_price)
      : null;

  if (orig !== null && orig > curr && orig > 0) {
    const computedPct = Math.round(((orig - curr) / orig) * 100);
    const pct =
      product.discount_percent && product.discount_percent > 0
        ? product.discount_percent
        : computedPct;
    return {
      hasPromo: true,
      originalPrice: orig,
      currentPrice: curr,
      discountPercent: pct,
      savingsAmount: Math.max(0, orig - curr),
    };
  }

  return {
    hasPromo: false,
    originalPrice: null,
    currentPrice: curr,
    discountPercent: 0,
    savingsAmount: 0,
  };
}
