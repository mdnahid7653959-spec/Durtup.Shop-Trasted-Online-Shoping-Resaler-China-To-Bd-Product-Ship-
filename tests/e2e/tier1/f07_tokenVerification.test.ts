/**
 * Tier 1: Feature Coverage
 * Feature 7: Backend Firebase ID Token Verification (F7)
 * Requirement: ORIGINAL_REQUEST §R2, PROJECT.md F7
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import {
  createValidToken,
  createExpiredToken,
  createMalformedToken,
  createTamperedSignatureToken,
  createWrongAudienceToken,
  TEST_USERS
} from '../helpers/authHelper';
import { dispatchOrderRequest } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const f07Tests: TestCase[] = [
  {
    id: 'F7-T01',
    name: 'F7: Valid cryptographic Firebase ID token is accepted and verified by server',
    feature: 'F7: Backend Firebase ID Token Verification',
    run: async () => {
      const validToken = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
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

      const res = await dispatchOrderRequest(payload, `Bearer ${validToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.success, true);
    }
  },
  {
    id: 'F7-T02',
    name: 'F7: Expired Firebase ID token is rejected with HTTP 401',
    feature: 'F7: Backend Firebase ID Token Verification',
    run: async () => {
      const expiredToken = createExpiredToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
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

      const res = await dispatchOrderRequest(payload, `Bearer ${expiredToken}`);

      assert.strictEqual(res.status, 401, `Expected 401 for expired token, got ${res.status}`);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.toLowerCase().includes('expired') || res.error?.includes('Authentication required'));
    }
  },
  {
    id: 'F7-T03',
    name: 'F7: Malformed token payload is rejected with HTTP 401',
    feature: 'F7: Backend Firebase ID Token Verification',
    run: async () => {
      const malformedToken = createMalformedToken();
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

      const res = await dispatchOrderRequest(payload, `Bearer ${malformedToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.success, false);
    }
  },
  {
    id: 'F7-T04',
    name: 'F7: Tampered token signature is rejected with HTTP 403',
    feature: 'F7: Backend Firebase ID Token Verification',
    run: async () => {
      const tamperedToken = createTamperedSignatureToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
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

      const res = await dispatchOrderRequest(payload, `Bearer ${tamperedToken}`);

      assert.strictEqual(res.status, 403, `Expected 403 Forbidden for tampered signature, got ${res.status}`);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('forbidden') || res.error?.includes('signature') || res.error?.includes('verification failed'));
    }
  },
  {
    id: 'F7-T05',
    name: 'F7: Token with untrusted audience is rejected with HTTP 403',
    feature: 'F7: Backend Firebase ID Token Verification',
    run: async () => {
      const wrongAudToken = createWrongAudienceToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
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

      const res = await dispatchOrderRequest(payload, `Bearer ${wrongAudToken}`);

      assert.strictEqual(res.status, 403, `Expected 403 Forbidden for wrong audience, got ${res.status}`);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('forbidden') || res.error?.includes('Audience mismatch') || res.error?.includes('verification failed'));
    }
  }
];
