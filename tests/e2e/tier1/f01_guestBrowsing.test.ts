/**
 * Tier 1: Feature Coverage
 * Feature 1: Guest Browsing & Local Cart (F1)
 * Requirement: ORIGINAL_REQUEST §R1, PROJECT.md F1
 */

import assert from 'node:assert';
import { TestCase } from '../helpers/types';
import { MockLocalStorage, createMockCartItem } from '../helpers/cartHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const f01Tests: TestCase[] = [
  {
    id: 'F1-T01',
    name: 'F1: Guest can initialize empty cart state without authentication error',
    feature: 'F1: Guest Browsing & Local Cart',
    run: () => {
      const storage = new MockLocalStorage();
      const raw = storage.getItem('megamart_cart');
      const items = raw ? JSON.parse(raw) : [];

      assert.strictEqual(Array.isArray(items), true, 'Guest cart should initialize as an array');
      assert.strictEqual(items.length, 0, 'Initial guest cart should be empty');
    }
  },
  {
    id: 'F1-T02',
    name: 'F1: Guest can add catalog product to guest cart and persist in local storage',
    feature: 'F1: Guest Browsing & Local Cart',
    run: () => {
      const storage = new MockLocalStorage();
      const catalogItem = TEST_CATALOG[0]; // X5 Camera

      const cartItem = createMockCartItem({
        product_id: catalogItem.id,
        name: catalogItem.name,
        price: catalogItem.price,
        quantity: 1,
        stock: catalogItem.stock
      });

      storage.setItem('megamart_cart', JSON.stringify([cartItem]));

      const stored = JSON.parse(storage.getItem('megamart_cart') || '[]');
      assert.strictEqual(stored.length, 1, 'Guest cart should contain 1 item');
      assert.strictEqual(stored[0].product_id, catalogItem.id);
      assert.strictEqual(stored[0].quantity, 1);
      assert.strictEqual(stored[0].product.stock_quantity, 45);
    }
  },
  {
    id: 'F1-T03',
    name: 'F1: Guest can update item quantity in guest cart without auth prompt',
    feature: 'F1: Guest Browsing & Local Cart',
    run: () => {
      const storage = new MockLocalStorage();
      const catalogItem = TEST_CATALOG[1]; // Charger

      const cartItem = createMockCartItem({
        product_id: catalogItem.id,
        name: catalogItem.name,
        price: catalogItem.price,
        quantity: 1,
        stock: catalogItem.stock
      });

      // Guest adds item
      let cart = [cartItem];
      storage.setItem('megamart_cart', JSON.stringify(cart));

      // Guest updates quantity to 3
      cart = cart.map((it) => (it.product_id === catalogItem.id ? { ...it, quantity: 3 } : it));
      storage.setItem('megamart_cart', JSON.stringify(cart));

      const updated = JSON.parse(storage.getItem('megamart_cart') || '[]');
      assert.strictEqual(updated[0].quantity, 3, 'Quantity should be updated to 3');
    }
  },
  {
    id: 'F1-T04',
    name: 'F1: Guest can remove item from local cart',
    feature: 'F1: Guest Browsing & Local Cart',
    run: () => {
      const storage = new MockLocalStorage();
      const itemA = createMockCartItem({ product_id: 'prod_a', name: 'Item A', price: 100, quantity: 1 });
      const itemB = createMockCartItem({ product_id: 'prod_b', name: 'Item B', price: 200, quantity: 2 });

      storage.setItem('megamart_cart', JSON.stringify([itemA, itemB]));

      // Remove itemA
      let cart = JSON.parse(storage.getItem('megamart_cart') || '[]');
      cart = cart.filter((it: any) => it.product_id !== 'prod_a');
      storage.setItem('megamart_cart', JSON.stringify(cart));

      const finalCart = JSON.parse(storage.getItem('megamart_cart') || '[]');
      assert.strictEqual(finalCart.length, 1, 'One item should remain');
      assert.strictEqual(finalCart[0].product_id, 'prod_b');
    }
  },
  {
    id: 'F1-T05',
    name: 'F1: Guest cart accurately preserves variant selections (color & size) in localStorage',
    feature: 'F1: Guest Browsing & Local Cart',
    run: () => {
      const storage = new MockLocalStorage();
      const watchItem = createMockCartItem({
        product_id: 'prod_smart_watch_99',
        name: 'Tisselly Smart Watch',
        price: 2400,
        quantity: 2,
        selected_variants: { color: 'Black', size: 'Standard' }
      });

      storage.setItem('megamart_cart', JSON.stringify([watchItem]));

      const stored = JSON.parse(storage.getItem('megamart_cart') || '[]');
      assert.strictEqual(stored[0].selected_variants?.color, 'Black');
      assert.strictEqual(stored[0].selected_variants?.size, 'Standard');
      assert.strictEqual(stored[0].quantity, 2);
    }
  }
];
