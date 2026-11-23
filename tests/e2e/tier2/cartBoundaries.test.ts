/**
 * Tier 2: Boundary & Corner Cases
 * Suite: Cart & Order Boundaries
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';
import { mergeCartItems, createMockCartItem } from '../helpers/cartHelper';

const validAddress = {
  first_name: 'Test',
  last_name: 'User',
  phone: '01711223344',
  address: 'Dhaka',
  city: 'Dhaka',
  country: 'Bangladesh'
};

export const cartBoundaryTests: TestCase[] = [
  {
    id: 'T2-CART-01',
    name: 'T2: Empty cart items array rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('empty') || res.error?.includes('Validation failed'));
    }
  },
  {
    id: 'T2-CART-02',
    name: 'T2: Missing items property rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
    }
  },
  {
    id: 'T2-CART-03',
    name: 'T2: Zero quantity (quantity: 0) rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 0 }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('Invalid quantity'));
    }
  },
  {
    id: 'T2-CART-04',
    name: 'T2: Negative quantity (quantity: -5) rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: -5 }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('Invalid quantity'));
    }
  },
  {
    id: 'T2-CART-05',
    name: 'T2: Fractional / floating point quantity (quantity: 1.5) rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1.5 }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('positive integer') || res.error?.includes('Invalid quantity'));
    }
  },
  {
    id: 'T2-CART-06',
    name: 'T2: NaN quantity rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: NaN }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
    }
  },
  {
    id: 'T2-CART-07',
    name: 'T2: String quantity ("3") rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: '3' }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
    }
  },
  {
    id: 'T2-CART-08',
    name: 'T2: Non-existent product ID rejected with 400 Product not found',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: 'non_existent_sku_99999999', quantity: 1 }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('not found'));
    }
  },
  {
    id: 'T2-CART-09',
    name: 'T2: Order quantity exceeding catalog stock limit rejected with 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG.find((p) => p.stock === 2)!; // Stock = 2

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 3 }], // 3 > 2
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('Insufficient stock'));
    }
  },
  {
    id: 'T2-CART-10',
    name: 'T2: Cart merge handles completely empty remote cart gracefully',
    run: () => {
      const remoteCart: any[] = [];
      const guestCart = [
        createMockCartItem({ product_id: 'prod_1', name: 'Item 1', price: 100, quantity: 2 })
      ];

      const merged = mergeCartItems(remoteCart, guestCart);
      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].product_id, 'prod_1');
      assert.strictEqual(merged[0].quantity, 2);
    }
  },
  {
    id: 'T2-CART-11',
    name: 'T2: Cart merge handles completely empty guest cart without altering remote cart',
    run: () => {
      const remoteCart = [
        createMockCartItem({ product_id: 'prod_1', name: 'Item 1', price: 100, quantity: 2 })
      ];
      const guestCart: any[] = [];

      const merged = mergeCartItems(remoteCart, guestCart);
      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].quantity, 2);
    }
  },
  {
    id: 'T2-CART-12',
    name: 'T2: Cart merge with both empty lists returns empty array',
    run: () => {
      const merged = mergeCartItems([], []);
      assert.strictEqual(Array.isArray(merged), true);
      assert.strictEqual(merged.length, 0);
    }
  },
  {
    id: 'T2-CART-13',
    name: 'T2: Multiple identical items within guest cart itself are collapsed to stock limit',
    run: () => {
      // Guest somehow added same item twice locally
      const guestItem1 = createMockCartItem({ product_id: 'prod_rare_collectible', name: 'Rare', price: 5000, quantity: 2, stock: 2 });
      const guestItem2 = createMockCartItem({ product_id: 'prod_rare_collectible', name: 'Rare', price: 5000, quantity: 2, stock: 2 });

      const merged = mergeCartItems([], [guestItem1, guestItem2]);
      assert.strictEqual(merged.length, 1);
      assert.strictEqual(merged[0].quantity, 2, 'Must not exceed stock limit of 2');
    }
  },
  {
    id: 'T2-CART-14',
    name: 'T2: Multi-item order with 5 distinct products calculates cumulative subtotal correctly',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // Items:
      // X5 Camera: 1150 * 1 = 1150
      // Charger: 350 * 2 = 700
      // Watch: 2400 * 1 = 2400
      // Total expected subtotal = 1150 + 700 + 2400 = 4250. With 60 shipping = 4310.
      const payload: OrderCreatePayload = {
        items: [
          { product_id: 'ac0a83b2-e060-450f-aabe-6ef05e56eb31', quantity: 1 },
          { product_id: '14', quantity: 2 },
          { product_id: 'prod_smart_watch_99', quantity: 1 }
        ],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 4250);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 4310);
    }
  }
];
