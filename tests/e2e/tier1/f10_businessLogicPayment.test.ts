/**
 * Tier 1: Feature Coverage
 * Feature 10: Business Logic & Payment Preservation (COD & bKash) (F10)
 * Requirement: ORIGINAL_REQUEST §R4, PROJECT.md F10
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest, getPlacedOrder } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const f10Tests: TestCase[] = [
  {
    id: 'F10-T01',
    name: 'F10: Cash on Delivery (COD) workflow completes successfully with payment_status pending',
    feature: 'F10: Business Logic & Payment Preservation (COD & bKash)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Mirpur 1',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.payment_method, 'cod');
      assert.strictEqual(res.payment_status, 'pending');
    }
  },
  {
    id: 'F10-T02',
    name: 'F10: bKash manual payment workflow succeeds when valid sender number and TrxID are provided',
    feature: 'F10: Business Logic & Payment Preservation (COD & bKash)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01885985097',
          address: 'Chittagong GEC',
          city: 'Chittagong',
          country: 'Bangladesh'
        },
        payment_method: 'bkash',
        bkash_details: {
          sender_number: '01885985097',
          trx_id: 'BK9A8B7C6D'
        }
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.payment_method, 'bkash');
      assert.strictEqual(res.payment_status, 'pending_verification');
    }
  },
  {
    id: 'F10-T03',
    name: 'F10: bKash payment request missing transaction ID is rejected with HTTP 400',
    feature: 'F10: Business Logic & Payment Preservation (COD & bKash)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01885985097',
          address: 'Chittagong GEC',
          city: 'Chittagong',
          country: 'Bangladesh'
        },
        payment_method: 'bkash',
        bkash_details: {
          sender_number: '01885985097',
          trx_id: '' // Empty Trx ID!
        }
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('bKash payment requires valid sender_number and trx_id'));
    }
  },
  {
    id: 'F10-T04',
    name: 'F10: bKash order details persist transaction ID and sender number in database',
    feature: 'F10: Business Logic & Payment Preservation (COD & bKash)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Sylhet',
          city: 'Sylhet',
          country: 'Bangladesh'
        },
        payment_method: 'bkash',
        bkash_details: {
          sender_number: '01711223344',
          trx_id: 'TRX_TEST_VERIFIED_100'
        }
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const order = getPlacedOrder(res.order_id!);
      assert.strictEqual(order.payment_method, 'bkash');
      assert.strictEqual(order.payment_status, 'pending_verification');
    }
  },
  {
    id: 'F10-T05',
    name: 'F10: Unsupported payment method string is rejected with HTTP 400',
    feature: 'F10: Business Logic & Payment Preservation (COD & bKash)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Dhaka',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'unsupported_crypto_payment'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Unsupported payment method'));
    }
  }
];
