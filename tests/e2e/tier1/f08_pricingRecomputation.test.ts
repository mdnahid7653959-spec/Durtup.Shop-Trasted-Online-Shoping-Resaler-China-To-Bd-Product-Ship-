/**
 * Tier 1: Feature Coverage
 * Feature 8: Server-Side Pricing & Discount Recomputation (F8)
 * Requirement: ORIGINAL_REQUEST §R2, PROJECT.md F8
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const f08Tests: TestCase[] = [
  {
    id: 'F8-T01',
    name: 'F8: Server computes subtotal from authoritative catalog price, ignoring tampered client price',
    feature: 'F8: Server-Side Pricing & Discount Recomputation',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0]; // Real price: 1150

      // Attacker submits client_price = 10 BDT
      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1, client_price: 10 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        total: 70 // Attacker claims total = 10 + 60 = 70
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 1150, 'Subtotal must be computed from catalog price 1150, not client 10');
      assert.strictEqual(res.total, 1210, 'Payable total must be 1150 + 60 = 1210');
    }
  },
  {
    id: 'F8-T02',
    name: 'F8: Server automatically applies authoritative 60 BDT delivery fee',
    feature: 'F8: Server-Side Pricing & Discount Recomputation',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[1]; // Price: 350

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 2 }], // 350 * 2 = 700
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Uttara',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 700);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 760);
    }
  },
  {
    id: 'F8-T03',
    name: 'F8: Server evaluates valid coupon code DURTUP2026 and applies 20% discount to subtotal',
    feature: 'F8: Server-Side Pricing & Discount Recomputation',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0]; // Price: 1150. Subtotal: 1150. 20% of 1150 = 230. Total: 1150 - 230 + 60 = 980.

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        coupon_code: 'DURTUP2026',
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Banani',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 1150);
      assert.strictEqual(res.discount_amount, 230);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 980);
    }
  },
  {
    id: 'F8-T04',
    name: 'F8: Server rejects order with non-existent or invalid coupon code with HTTP 400',
    feature: 'F8: Server-Side Pricing & Discount Recomputation',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: 'FAKE_COUPON_CODE_9999',
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Invalid coupon code'));
    }
  },
  {
    id: 'F8-T05',
    name: 'F8: Server rejects order when requested item quantity exceeds available stock',
    feature: 'F8: Server-Side Pricing & Discount Recomputation',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const rareItem = TEST_CATALOG.find((p) => p.id === 'prod_rare_collectible')!; // Stock: 2

      const payload: OrderCreatePayload = {
        items: [{ product_id: rareItem.id, quantity: 10 }], // Exceeds stock 2
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Insufficient stock'));
    }
  }
];
