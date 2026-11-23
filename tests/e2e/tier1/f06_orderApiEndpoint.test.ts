/**
 * Tier 1: Feature Coverage
 * Feature 6: Secure Backend Order API (/api/orders) (F6)
 * Requirement: ORIGINAL_REQUEST §R2, PROJECT.md F6
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const f06Tests: TestCase[] = [
  {
    id: 'F6-T01',
    name: 'F6: Valid order creation request to /api/orders returns 200 OK with order_id and order_number',
    feature: 'F6: Secure Backend Order API (/api/orders)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0];

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'House 12, Road 5, Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      assert.strictEqual(res.success, true);
      assert.ok(res.order_id, 'Response must include order_id');
      assert.ok(res.order_number, 'Response must include order_number');
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
    }
  },
  {
    id: 'F6-T02',
    name: 'F6: Order creation request without Authorization header returns HTTP 401 Unauthorized',
    feature: 'F6: Secure Backend Order API (/api/orders)',
    run: async () => {
      const prod = TEST_CATALOG[0];
      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Guest',
          last_name: 'Anonymous',
          phone: '01888888888',
          address: 'Banani',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload); // No auth header

      assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Authentication required') || res.error?.includes('Missing or invalid'));
    }
  },
  {
    id: 'F6-T03',
    name: 'F6: Order endpoint generates standard order number format ORD-XXXXXX-XXXX',
    feature: 'F6: Secure Backend Order API (/api/orders)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[1];

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Gulshan 2',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.order_number?.startsWith('ORD-'), `Order number ${res.order_number} should start with ORD-`);
      assert.match(res.order_number || '', /^ORD-\d{6}-\d{4}$/, 'Must match ORD-XXXXXX-XXXX pattern');
    }
  },
  {
    id: 'F6-T04',
    name: 'F6: Order endpoint rejects request with missing delivery address fields with HTTP 400',
    feature: 'F6: Secure Backend Order API (/api/orders)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0];

      // Missing address and city
      const invalidPayload: any = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          phone: '01711223344',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(invalidPayload, `Bearer ${token}`);

      assert.strictEqual(res.status, 400, `Expected 400 for missing address, got ${res.status}`);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Validation failed'));
    }
  },
  {
    id: 'F6-T05',
    name: 'F6: Order endpoint returns authoritative total, subtotal, and shipping cost in response',
    feature: 'F6: Secure Backend Order API (/api/orders)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0]; // Price: 1150, Shipping: 60 -> Total: 1210

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Mirpur 10',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 1150);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 1210);
    }
  }
];
