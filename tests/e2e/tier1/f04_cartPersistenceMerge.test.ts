/**
 * Tier 1: Feature Coverage
 * Feature 4: Cart Persistence & Merging Across Auth (F4)
 * Requirement: ORIGINAL_REQUEST §R2, PROJECT.md F4
 */

import assert from 'node:assert';
import { TestCase } from '../helpers/types';
import { mergeCartItems, createMockCartItem } from '../helpers/cartHelper';

export const f04Tests: TestCase[] = [
  {
    id: 'F4-T01',
    name: 'F4: Merging non-overlapping guest items appends them cleanly to remote cart',
    feature: 'F4: Cart Persistence & Merging Across Auth',
    run: () => {
      const remoteCart = [
        createMockCartItem({ product_id: 'prod_camera_1', name: 'Camera', price: 1000, quantity: 1 })
      ];
      const guestCart = [
        createMockCartItem({ product_id: 'prod_charger_2', name: 'Charger', price: 300, quantity: 2 })
      ];

      const merged = mergeCartItems(remoteCart, guestCart);

      assert.strictEqual(merged.length, 2, 'Merged cart should contain 2 distinct items');
      assert.strictEqual(merged[0].product_id, 'prod_camera_1');
      assert.strictEqual(merged[0].quantity, 1);
      assert.strictEqual(merged[1].product_id, 'prod_charger_2');
      assert.strictEqual(merged[1].quantity, 2);
    }
  },
  {
    id: 'F4-T02',
    name: 'F4: Merging identical product without variants sums quantities without duplicating line item',
    feature: 'F4: Cart Persistence & Merging Across Auth',
    run: () => {
      const remoteCart = [
        createMockCartItem({ product_id: 'prod_camera_1', name: 'Camera', price: 1000, quantity: 2 })
      ];
      const guestCart = [
        createMockCartItem({ product_id: 'prod_camera_1', name: 'Camera', price: 1000, quantity: 3 })
      ];

      const merged = mergeCartItems(remoteCart, guestCart);

      assert.strictEqual(merged.length, 1, 'Should NOT create duplicate line items for same product');
      assert.strictEqual(merged[0].product_id, 'prod_camera_1');
      assert.strictEqual(merged[0].quantity, 5, 'Quantities must sum (2 + 3 = 5)');
    }
  },
  {
    id: 'F4-T03',
    name: 'F4: Merging matching items with identical variant selections (color/size) sums quantities',
    feature: 'F4: Cart Persistence & Merging Across Auth',
    run: () => {
      const remoteCart = [
        createMockCartItem({
          product_id: 'prod_watch_99',
          name: 'Watch',
          price: 2400,
          quantity: 1,
          selected_variants: { color: 'Black', size: 'Standard' }
        })
      ];
      const guestCart = [
        createMockCartItem({
          product_id: 'prod_watch_99',
          name: 'Watch',
          price: 2400,
          quantity: 2,
          selected_variants: { color: 'Black', size: 'Standard' }
        })
      ];

      const merged = mergeCartItems(remoteCart, guestCart);

      assert.strictEqual(merged.length, 1, 'Same variant must not duplicate');
      assert.strictEqual(merged[0].quantity, 3, 'Quantities should sum: 1 + 2 = 3');
      assert.strictEqual(merged[0].selected_variants?.color, 'Black');
    }
  },
  {
    id: 'F4-T04',
    name: 'F4: Merging same product with DIFFERENT variants keeps distinct line items',
    feature: 'F4: Cart Persistence & Merging Across Auth',
    run: () => {
      const remoteCart = [
        createMockCartItem({
          product_id: 'prod_watch_99',
          name: 'Watch',
          price: 2400,
          quantity: 1,
          selected_variants: { color: 'Black', size: 'Standard' }
        })
      ];
      const guestCart = [
        createMockCartItem({
          product_id: 'prod_watch_99',
          name: 'Watch',
          price: 2600,
          quantity: 1,
          selected_variants: { color: 'Silver', size: 'Standard' }
        })
      ];

      const merged = mergeCartItems(remoteCart, guestCart);

      assert.strictEqual(merged.length, 2, 'Different variants must remain separate line items');
      assert.strictEqual(merged[0].selected_variants?.color, 'Black');
      assert.strictEqual(merged[1].selected_variants?.color, 'Silver');
    }
  },
  {
    id: 'F4-T05',
    name: 'F4: Merged quantities are bounded by stock availability limits',
    feature: 'F4: Cart Persistence & Merging Across Auth',
    run: () => {
      // Product prod_rare_collectible has catalog stock of 2
      const remoteCart = [
        createMockCartItem({
          product_id: 'prod_rare_collectible',
          name: 'Rare Item',
          price: 5000,
          quantity: 2,
          stock: 2
        })
      ];
      const guestCart = [
        createMockCartItem({
          product_id: 'prod_rare_collectible',
          name: 'Rare Item',
          price: 5000,
          quantity: 3,
          stock: 2
        })
      ];

      const merged = mergeCartItems(remoteCart, guestCart);

      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].quantity, 2, 'Merged quantity must not exceed available stock limit of 2');
    }
  }
];
