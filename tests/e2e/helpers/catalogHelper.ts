/**
 * Durtup.shop Mandatory Customer Authentication System
 * E2E Testing Framework - Catalog and Pricing Helper
 */

import { OrderItemInput, ProductCatalogItem, CouponItem } from './types';

export const STANDARD_SHIPPING_COST = 60; // 60 BDT standard delivery across BD

export const TEST_CATALOG: ProductCatalogItem[] = [
  {
    id: 'ac0a83b2-e060-450f-aabe-6ef05e56eb31',
    name: 'X5 Full HD Mini WiFi IP Camera',
    slug: 'x5-full-hd-mini-wifi-ip-camera-ac0a83b2',
    regular_price: 1650,
    price: 1150, // Authoritative sale price
    stock: 45,
    source: 'regular'
  },
  {
    id: '14',
    name: 'X01 Full Charge Separator Type-C Auto Power Cut-Off',
    slug: 'x01-full-charge-separator-type-c-14',
    regular_price: 450,
    price: 350,
    stock: 50,
    source: 'regular'
  },
  {
    id: 'prod_smart_watch_99',
    name: 'Tisselly Smart Watch Tonneau Quartz Luxury',
    slug: 'tisselly-smart-watch-99',
    regular_price: 3200,
    price: 2400,
    stock: 15,
    source: 'regular',
    variants: [
      { id: 'v_black', name: 'Black Standard', color: 'Black', size: 'Standard', price: 2400, stock: 10 },
      { id: 'v_silver', name: 'Silver Steel', color: 'Silver', size: 'Standard', price: 2600, stock: 5 }
    ]
  },
  {
    id: 'cj_apparel_777',
    name: 'China Direct Dropship Winter Fleece Jacket',
    slug: 'cj-winter-fleece-jacket-777',
    regular_price: 1800,
    price: 1250,
    stock: 100,
    source: 'cj',
    variants: [
      { id: 'v_m_navy', name: 'Navy / M', color: 'Navy', size: 'M', price: 1250, stock: 40 },
      { id: 'v_l_black', name: 'Black / L', color: 'Black', size: 'L', price: 1300, stock: 60 }
    ]
  },
  {
    id: 'prod_rare_collectible',
    name: 'Limited Collector Edition Wireless Speaker',
    slug: 'limited-speaker-rare',
    regular_price: 6000,
    price: 5000,
    stock: 2,
    source: 'regular'
  },
  {
    id: 'prod_sold_out_item',
    name: 'Completely Out of Stock Vintage Radio',
    slug: 'vintage-radio-sold-out',
    regular_price: 2000,
    price: 1500,
    stock: 0,
    source: 'regular'
  }
];

export const TEST_COUPONS: Record<string, CouponItem> = {
  DURTUP2026: {
    code: 'DURTUP2026',
    discount_type: 'percentage',
    discount_value: 20, // 20%
    max_discount_amount: null,
    min_order_amount: 0,
    is_active: true
  },
  SAVE100: {
    code: 'SAVE100',
    discount_type: 'fixed',
    discount_value: 100, // 100 BDT
    max_discount_amount: 100,
    min_order_amount: 1000,
    is_active: true
  },
  HALFPRICE: {
    code: 'HALFPRICE',
    discount_type: 'percentage',
    discount_value: 50, // 50%
    max_discount_amount: 1500,
    min_order_amount: 2000,
    is_active: true
  },
  HIGHMIN5000: {
    code: 'HIGHMIN5000',
    discount_type: 'fixed',
    discount_value: 500,
    max_discount_amount: 500,
    min_order_amount: 5000,
    is_active: true
  },
  EXPIRED2025: {
    code: 'EXPIRED2025',
    discount_type: 'percentage',
    discount_value: 25,
    min_order_amount: 0,
    is_active: false, // inactive / expired
    expires_at: '2025-01-01T00:00:00Z'
  }
};

/**
 * Finds a product in the catalog
 */
export function lookupProduct(productId: string): ProductCatalogItem | undefined {
  return TEST_CATALOG.find((p) => p.id === productId);
}

/**
 * Resolves unit price for a product, taking variants into account if applicable
 */
export function resolveItemUnitPrice(product: ProductCatalogItem, selectedVariants?: Record<string, string>): number {
  if (product.variants && product.variants.length > 0 && selectedVariants) {
    const matched = product.variants.find((v) => {
      let matches = true;
      if (selectedVariants.color && v.color && v.color.toLowerCase() !== selectedVariants.color.toLowerCase()) {
        matches = false;
      }
      if (selectedVariants.size && v.size && v.size.toLowerCase() !== selectedVariants.size.toLowerCase()) {
        matches = false;
      }
      return matches;
    });
    if (matched && matched.price) {
      return matched.price;
    }
  }
  return product.price;
}

/**
 * Computes authoritative server pricing
 */
export function computeAuthoritativeOrder(
  items: OrderItemInput[],
  couponCode?: string | null
): {
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  valid: boolean;
  error?: string;
  itemDetails: Array<{ product_id: string; quantity: number; unit_price: number; line_total: number }>;
} {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      shipping_cost: 0,
      discount_amount: 0,
      total: 0,
      valid: false,
      error: 'Cart is empty. At least one item required.',
      itemDetails: []
    };
  }

  let subtotal = 0;
  const itemDetails: Array<{ product_id: string; quantity: number; unit_price: number; line_total: number }> = [];

  for (const item of items) {
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return {
        subtotal: 0,
        shipping_cost: 0,
        discount_amount: 0,
        total: 0,
        valid: false,
        error: `Invalid quantity for product ${item.product_id}: must be positive integer`,
        itemDetails: []
      };
    }

    const prod = lookupProduct(item.product_id);
    if (!prod) {
      return {
        subtotal: 0,
        shipping_cost: 0,
        discount_amount: 0,
        total: 0,
        valid: false,
        error: `Product not found in catalog: ${item.product_id}`,
        itemDetails: []
      };
    }

    // Check stock
    if (prod.stock < item.quantity) {
      return {
        subtotal: 0,
        shipping_cost: 0,
        discount_amount: 0,
        total: 0,
        valid: false,
        error: `Insufficient stock for product ${prod.name}: requested ${item.quantity}, available ${prod.stock}`,
        itemDetails: []
      };
    }

    const unitPrice = resolveItemUnitPrice(prod, item.selected_variants);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    itemDetails.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal
    });
  }

  let discountAmount = 0;
  if (couponCode) {
    const coupon = TEST_COUPONS[couponCode.trim().toUpperCase()];
    if (!coupon) {
      return {
        subtotal,
        shipping_cost: STANDARD_SHIPPING_COST,
        discount_amount: 0,
        total: subtotal + STANDARD_SHIPPING_COST,
        valid: false,
        error: `Invalid coupon code: ${couponCode}`,
        itemDetails
      };
    }

    if (!coupon.is_active) {
      return {
        subtotal,
        shipping_cost: STANDARD_SHIPPING_COST,
        discount_amount: 0,
        total: subtotal + STANDARD_SHIPPING_COST,
        valid: false,
        error: `Coupon is expired or inactive: ${couponCode}`,
        itemDetails
      };
    }

    if (subtotal < coupon.min_order_amount) {
      return {
        subtotal,
        shipping_cost: STANDARD_SHIPPING_COST,
        discount_amount: 0,
        total: subtotal + STANDARD_SHIPPING_COST,
        valid: false,
        error: `Order subtotal ৳${subtotal} does not meet minimum threshold ৳${coupon.min_order_amount} for coupon ${couponCode}`,
        itemDetails
      };
    }

    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }
  }

  const shippingCost = STANDARD_SHIPPING_COST;
  const payableTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  return {
    subtotal,
    shipping_cost: shippingCost,
    discount_amount: discountAmount,
    total: payableTotal,
    valid: true,
    itemDetails
  };
}
