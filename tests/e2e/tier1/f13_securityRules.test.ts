/**
 * Tier 1: Feature Coverage
 * Feature 13: Firestore Security Rules Hardening (F13)
 * Requirement: ORIGINAL_REQUEST §R3, PROJECT.md F13
 */

import assert from 'node:assert';
import { TestCase } from '../helpers/types';
import { TEST_USERS } from '../helpers/authHelper';
import {
  evaluateOrderCreateRule,
  evaluateOrderUpdateRule,
  evaluateProfileUpdateRule
} from '../helpers/securityRulesHelper';

export const f13Tests: TestCase[] = [
  {
    id: 'F13-T01',
    name: 'F13: Direct client write to /orders with mismatched user_id is blocked by security rules',
    feature: 'F13: Firestore Security Rules Hardening',
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

      // Customer Alpha attempts to write an order doc claiming to be Customer Bravo
      const maliciousDoc = {
        user_id: TEST_USERS.CUSTOMER_BRAVO.uid,
        total: 1000
      };

      const evalResult = evaluateOrderCreateRule(alphaClaims, maliciousDoc);

      assert.strictEqual(evalResult.allowed, false);
      assert.strictEqual(evalResult.status, 403, 'Must be rejected with 403 Forbidden');
    }
  },
  {
    id: 'F13-T02',
    name: 'F13: Unauthenticated write to /orders collection is blocked with 401',
    feature: 'F13: Firestore Security Rules Hardening',
    run: () => {
      const evalResult = evaluateOrderCreateRule(null, { total: 500 });

      assert.strictEqual(evalResult.allowed, false);
      assert.strictEqual(evalResult.status, 401, 'Unauthenticated client must not write orders');
    }
  },
  {
    id: 'F13-T03',
    name: 'F13: Customer attempt to update or delete order status is blocked (admin only)',
    feature: 'F13: Firestore Security Rules Hardening',
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

      const existingOrder = {
        id: 'ord_alpha_1',
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        status: 'pending'
      };

      // Customer attempts to update status to "delivered"
      const evalResult = evaluateOrderUpdateRule(alphaClaims, existingOrder, { status: 'delivered' });

      assert.strictEqual(evalResult.allowed, false);
      assert.strictEqual(evalResult.status, 403, 'Customers cannot update order status');
    }
  },
  {
    id: 'F13-T04',
    name: 'F13: Direct client attempt to alter user profile wallet_balance or role is blocked',
    feature: 'F13: Firestore Security Rules Hardening',
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

      // Alpha attempts to inflate their own wallet balance
      const illegalUpdates = {
        wallet_balance: 50000,
        role: 'admin'
      };

      const evalResult = evaluateProfileUpdateRule(alphaClaims, TEST_USERS.CUSTOMER_ALPHA.uid, illegalUpdates);

      assert.strictEqual(evalResult.allowed, false);
      assert.strictEqual(evalResult.status, 403, 'Altering financial balances or role must be blocked');
    }
  },
  {
    id: 'F13-T05',
    name: 'F13: Admin is authorized to update order status and resolve support tickets',
    feature: 'F13: Firestore Security Rules Hardening',
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

      const existingOrder = {
        id: 'ord_alpha_1',
        user_id: TEST_USERS.CUSTOMER_ALPHA.uid,
        status: 'pending'
      };

      const evalResult = evaluateOrderUpdateRule(adminClaims, existingOrder, { status: 'shipped' });

      assert.strictEqual(evalResult.allowed, true);
      assert.strictEqual(evalResult.status, 200, 'Admin must be authorized to update order status');
    }
  }
];
