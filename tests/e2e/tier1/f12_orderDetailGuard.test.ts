/**
 * Tier 1: Feature Coverage
 * Feature 12: Order Detail Ownership Guard (F12)
 * Requirement: ORIGINAL_REQUEST §R3, PROJECT.md F12
 */

import assert from 'node:assert';
import { TestCase } from '../helpers/types';
import { TEST_USERS } from '../helpers/authHelper';
import { evaluateOrderReadRule } from '../helpers/securityRulesHelper';

export const f12Tests: TestCase[] = [
  {
    id: 'F12-T01',
    name: 'F12: Customer A viewing their own order detail is authorized and allowed',
    feature: 'F12: Order Detail Ownership Guard',
    run: () => {
      const alphaClaims = {
        uid: TEST_USERS.CUSTOMER_ALPHA.uid,
        sub: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };

      const orderData = {
        id: 'ord_alpha_order_1',
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        total: 1210
      };

      const check = evaluateOrderReadRule(alphaClaims, orderData);

      assert.strictEqual(check.allowed, true);
      assert.strictEqual(check.status, 200);
    }
  },
  {
    id: 'F12-T02',
    name: 'F12: Customer B attempting to view Customer A order detail is rejected with HTTP 403 Forbidden',
    feature: 'F12: Order Detail Ownership Guard',
    run: () => {
      // Customer Bravo tries to view Customer Alpha's order
      const bravoClaims = {
        uid: TEST_USERS.CUSTOMER_BRAVO.uid,
        sub: TEST_USERS.CUSTOMER_BRAVO.uid,
        email: TEST_USERS.CUSTOMER_BRAVO.email,
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };

      const alphaOrderData = {
        id: 'ord_alpha_order_1',
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        shipping_address: { phone: '01711223344', address: 'Private House' },
        total: 1210
      };

      const check = evaluateOrderReadRule(bravoClaims, alphaOrderData);

      assert.strictEqual(check.allowed, false);
      assert.strictEqual(check.status, 403, 'Must return 403 Forbidden for unauthorized viewer');
      assert.ok(check.reason?.includes('Forbidden'));
    }
  },
  {
    id: 'F12-T03',
    name: 'F12: Unauthenticated guest attempting to access order detail route is rejected with HTTP 401',
    feature: 'F12: Order Detail Ownership Guard',
    run: () => {
      const orderData = {
        id: 'ord_123',
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        total: 500
      };

      const check = evaluateOrderReadRule(null, orderData);

      assert.strictEqual(check.allowed, false);
      assert.strictEqual(check.status, 401, 'Unauthenticated access must be rejected with 401');
    }
  },
  {
    id: 'F12-T04',
    name: 'F12: Administrator viewing customer order detail is permitted',
    feature: 'F12: Order Detail Ownership Guard',
    run: () => {
      const adminClaims = {
        uid: TEST_USERS.ADMIN_USER.uid,
        sub: TEST_USERS.ADMIN_USER.uid,
        email: TEST_USERS.ADMIN_USER.email,
        role: 'admin',
        admin: true,
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };

      const alphaOrderData = {
        id: 'ord_alpha_order_1',
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        total: 1210
      };

      const check = evaluateOrderReadRule(adminClaims, alphaOrderData);

      assert.strictEqual(check.allowed, true);
      assert.strictEqual(check.status, 200, 'Admin must be authorized to inspect order details');
    }
  },
  {
    id: 'F12-T05',
    name: 'F12: Order detail ownership guard prevents disclosure of customer PII to unauthorized users',
    feature: 'F12: Order Detail Ownership Guard',
    run: () => {
      const orderDoc = {
        id: 'ord_secret',
        user_id: 'cust_secret_uid',
        customer_phone: '01885985097',
        trx_id: 'SECRET_TRX_999'
      };

      const attackerClaims = {
        uid: 'attacker_uid',
        sub: 'attacker_uid',
        email: 'attacker@bad.com',
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };

      const check = evaluateOrderReadRule(attackerClaims, orderDoc);
      assert.strictEqual(check.allowed, false, 'PII must NOT be accessible to non-owner');
    }
  }
];
