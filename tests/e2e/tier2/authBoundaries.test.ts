/**
 * Tier 2: Boundary & Corner Cases
 * Suite: Auth & Token Boundaries
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

const samplePayload: OrderCreatePayload = {
  items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
  shipping_address: {
    first_name: 'Test',
    last_name: 'User',
    phone: '01711223344',
    address: 'Dhaka',
    city: 'Dhaka',
    country: 'Bangladesh'
  },
  payment_method: 'cod'
};

export const authBoundaryTests: TestCase[] = [
  {
    id: 'T2-AUTH-01',
    name: 'T2: Completely missing Authorization header rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, undefined);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.success, false);
    }
  },
  {
    id: 'T2-AUTH-02',
    name: 'T2: Empty string Authorization header rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, '');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.success, false);
    }
  },
  {
    id: 'T2-AUTH-03',
    name: 'T2: Whitespace-only Authorization header rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, '    ');
      assert.strictEqual(res.status, 401);
    }
  },
  {
    id: 'T2-AUTH-04',
    name: 'T2: Non-Bearer auth scheme ("Basic dXNlcjpwYXNz") rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, 'Basic dXNlcjpwYXNz');
      assert.strictEqual(res.status, 401);
      assert.ok(res.error?.includes('Expected Bearer'));
    }
  },
  {
    id: 'T2-AUTH-05',
    name: 'T2: Bearer scheme with missing token string ("Bearer ") rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, 'Bearer ');
      assert.strictEqual(res.status, 401);
    }
  },
  {
    id: 'T2-AUTH-06',
    name: 'T2: Token with expired timestamp (exp in the past) rejected with 401',
    run: async () => {
      const expired = createExpiredToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const res = await dispatchOrderRequest(samplePayload, `Bearer ${expired}`);
      assert.strictEqual(res.status, 401);
    }
  },
  {
    id: 'T2-AUTH-07',
    name: 'T2: Token with only 2 segments instead of 3 rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, 'Bearer header.payload');
      assert.strictEqual(res.status, 401);
    }
  },
  {
    id: 'T2-AUTH-08',
    name: 'T2: Token with 4 segments instead of 3 rejected with 401',
    run: async () => {
      const res = await dispatchOrderRequest(samplePayload, 'Bearer header.payload.sig.extra');
      assert.strictEqual(res.status, 401);
    }
  },
  {
    id: 'T2-AUTH-09',
    name: 'T2: Random non-JWT string rejected with 401',
    run: async () => {
      const malformed = createMalformedToken();
      const res = await dispatchOrderRequest(samplePayload, `Bearer ${malformed}`);
      assert.strictEqual(res.status, 401);
    }
  },
  {
    id: 'T2-AUTH-10',
    name: 'T2: Tampered signature (altered payload claims) rejected with 403',
    run: async () => {
      const tampered = createTamperedSignatureToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const res = await dispatchOrderRequest(samplePayload, `Bearer ${tampered}`);
      assert.strictEqual(res.status, 403);
    }
  },
  {
    id: 'T2-AUTH-11',
    name: 'T2: Token with foreign/untrusted audience claim rejected with 403',
    run: async () => {
      const wrongAud = createWrongAudienceToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const res = await dispatchOrderRequest(samplePayload, `Bearer ${wrongAud}`);
      assert.strictEqual(res.status, 403);
    }
  },
  {
    id: 'T2-AUTH-12',
    name: 'T2: Case-insensitive Bearer prefix ("bearer <token>") is accepted',
    run: async () => {
      const valid = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const res = await dispatchOrderRequest(samplePayload, `bearer ${valid}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.success, true);
    }
  }
];
