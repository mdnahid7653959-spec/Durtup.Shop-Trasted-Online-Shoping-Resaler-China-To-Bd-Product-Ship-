/**
 * Tier 1: Feature Coverage
 * Feature 9: Client UID Spoofing Protection (F9)
 * Requirement: ORIGINAL_REQUEST §R2, §R3, PROJECT.md F9
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest, getPlacedOrder } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const f09Tests: TestCase[] = [
  {
    id: 'F9-T01',
    name: 'F9: Order creation ignores client-provided user_id and binds strictly to token UID',
    feature: 'F9: Client UID Spoofing Protection',
    run: async () => {
      // Authenticated as Customer Alpha
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // Client submits payload claiming to be Customer Bravo
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        user_id: TEST_USERS.CUSTOMER_BRAVO.uid // Spoof attempt!
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(
        res.user_id,
        TEST_USERS.CUSTOMER_ALPHA.uid,
        'Server must attribute order to token UID (Alpha), not spoofed user_id (Bravo)'
      );
    }
  },
  {
    id: 'F9-T02',
    name: 'F9: Attempt to inject synthetic guest_12345 user_id is ignored and bound to token UID',
    feature: 'F9: Client UID Spoofing Protection',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        user_id: 'guest_01711223344_legacy_bypass' // Synthetic guest bypass attempt
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
      assert.notStrictEqual(res.user_id, 'guest_01711223344_legacy_bypass');
    }
  },
  {
    id: 'F9-T03',
    name: 'F9: Attacker claiming admin UID in payload does not gain admin attribution',
    feature: 'F9: Client UID Spoofing Protection',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Attacker',
          last_name: 'User',
          phone: '01700000000',
          address: 'Secret Location',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        user_id: TEST_USERS.ADMIN_USER.uid // Admin spoof attempt
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
    }
  },
  {
    id: 'F9-T04',
    name: 'F9: Order stored in database has user_id matching token claims sub',
    feature: 'F9: Client UID Spoofing Protection',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhanmondi',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        user_id: 'malicious_random_uid'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const savedOrder = getPlacedOrder(res.order_id!);
      assert.ok(savedOrder, 'Saved order must exist in DB');
      assert.strictEqual(savedOrder.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
    }
  },
  {
    id: 'F9-T05',
    name: 'F9: Order creation preserves verified customer email alongside verified UID',
    feature: 'F9: Client UID Spoofing Protection',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
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
      assert.strictEqual(res.status, 200);

      const savedOrder = getPlacedOrder(res.order_id!);
      assert.strictEqual(savedOrder.customer_email, TEST_USERS.CUSTOMER_ALPHA.email);
    }
  }
];
