/**
 * Durtup.shop Mandatory Customer Authentication System
 * E2E Testing Framework - Cart Persistence and Merging Helper
 */

import { CartItem } from './types';
import { lookupProduct } from './catalogHelper';

/**
 * Generates a normalized variant signature key for deterministic comparison
 */
export function getVariantSignature(item: CartItem | { product_id: string; selected_variants?: Record<string, string>; color?: string | null; size?: string | null; variant_id?: string | null }): string {
  const parts: string[] = [`pid:${item.product_id}`];

  if (item.variant_id) {
    parts.push(`vid:${item.variant_id.toLowerCase().trim()}`);
  }

  if (item.selected_variants && Object.keys(item.selected_variants).length > 0) {
    const sortedKeys = Object.keys(item.selected_variants).sort();
    for (const k of sortedKeys) {
      const val = item.selected_variants[k];
      if (val) {
        parts.push(`${k.toLowerCase().trim()}=${String(val).toLowerCase().trim()}`);
      }
    }
  } else {
    if (item.color) parts.push(`color=${item.color.toLowerCase().trim()}`);
    if (item.size) parts.push(`size=${item.size.toLowerCase().trim()}`);
  }

  return parts.join('|');
}

/**
 * Pure cart merging engine matching the required contract in PROJECT.md
 */
export function mergeCartItems(remoteItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  if (!Array.isArray(remoteItems)) remoteItems = [];
  if (!Array.isArray(guestItems)) guestItems = [];

  // Deep clone remote items as initial accumulator
  const merged: CartItem[] = remoteItems.map((item) => ({
    ...item,
    selected_variants: item.selected_variants ? { ...item.selected_variants } : undefined,
    product: { ...item.product }
  }));

  for (const guestItem of guestItems) {
    const guestSig = getVariantSignature(guestItem);
    const existingIndex = merged.findIndex((m) => getVariantSignature(m) === guestSig);

    // Look up stock limit
    const catalogProd = lookupProduct(guestItem.product_id);
    const stockLimit = catalogProd ? catalogProd.stock : (guestItem.product?.stock_quantity ?? 50);

    if (existingIndex >= 0) {
      // Item exists in remote cart: combine quantities bounded by stock limit
      const existing = merged[existingIndex];
      const combinedQty = existing.quantity + guestItem.quantity;
      existing.quantity = Math.min(combinedQty, stockLimit);
    } else {
      // Item does not exist in remote cart: append with quantity bounded by stock limit
      merged.push({
        ...guestItem,
        id: guestItem.id || `merged_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        quantity: Math.min(guestItem.quantity, stockLimit),
        selected_variants: guestItem.selected_variants ? { ...guestItem.selected_variants } : undefined,
        product: { ...guestItem.product }
      });
    }
  }

  return merged;
}

/**
 * Creates a mock CartItem for tests
 */
export function createMockCartItem(params: {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
  selected_variants?: Record<string, string>;
  source?: 'regular' | 'cj';
}): CartItem {
  return {
    id: `item_${params.product_id}_${Math.random().toString(36).substring(2, 6)}`,
    product_id: params.product_id,
    quantity: params.quantity,
    selected_variants: params.selected_variants,
    source: params.source || 'regular',
    product: {
      id: params.product_id,
      name: params.name,
      slug: `slug-${params.product_id}`,
      regular_price: params.price * 1.2,
      discount_price: params.price,
      stock_quantity: params.stock ?? 50
    }
  };
}

/**
 * In-memory Mock LocalStorage for testing guest sessions and logout cleanup
 */
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }
}
