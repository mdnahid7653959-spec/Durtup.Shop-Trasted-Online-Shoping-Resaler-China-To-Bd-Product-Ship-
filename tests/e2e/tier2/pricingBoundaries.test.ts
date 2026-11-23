/**
 * Tier 2: Boundary & Corner Cases
 * Suite: Pricing Tampering & Coupon Boundaries
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

const validAddress = {
  first_name: 'Alpha',
  last_name: 'Customer',
  phone: '01711223344',
  address: 'Dhaka',
  city: 'Dhaka',
  country: 'Bangladesh'
};

export const pricingBoundaryTests: TestCase[] = [
  {
    id: 'T2-PRICE-01',
    name: 'T2: Client attempt to submit client_price = 0 (free product exploit) is overridden by catalog price',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0]; // Real price: 1150

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1, client_price: 0 }],
        shipping_address: validAddress,
        payment_method: 'cod',
        total: 60 // Attacker claims only paying 60 shipping
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 1150, 'Must use catalog price');
      assert.strictEqual(res.total, 1210);
    }
  },
  {
    id: 'T2-PRICE-02',
    name: 'T2: Client attempt to submit negative price (client_price = -999) is overridden by catalog price',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[1]; // Price: 350

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1, client_price: -999 }],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 350);
      assert.strictEqual(res.total, 410);
    }
  },
  {
    id: 'T2-PRICE-03',
    name: 'T2: Inactive / expired coupon code is rejected with HTTP 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: 'EXPIRED2025',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('expired or inactive'));
    }
  },
  {
    id: 'T2-PRICE-04',
    name: 'T2: Coupon applied below minimum order amount is rejected with HTTP 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // HIGHMIN5000 requires 5000 BDT minimum. Single item is 1150 BDT.
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: 'HIGHMIN5000',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('minimum threshold'));
    }
  },
  {
    id: 'T2-PRICE-05',
    name: 'T2: Coupon code is case-insensitive (durtup2026 matches DURTUP2026)',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0]; // 1150

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        coupon_code: 'durtup2026', // lowercase
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.discount_amount, 230); // 20% of 1150
      assert.strictEqual(res.total, 980);
    }
  },
  {
    id: 'T2-PRICE-06',
    name: 'T2: Coupon code with leading and trailing whitespace is trimmed and applied',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: '   DURTUP2026   ',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.discount_amount, 230);
    }
  },
  {
    id: 'T2-PRICE-07',
    name: 'T2: Fixed discount coupon (SAVE100) applied accurately when order meets threshold',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // Item price 1150 >= 1000 threshold. Discount = 100. Total = 1150 - 100 + 60 = 1110.
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: 'SAVE100',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.discount_amount, 100);
      assert.strictEqual(res.total, 1110);
    }
  },
  {
    id: 'T2-PRICE-08',
    name: 'T2: Fixed discount coupon rejected when order falls below threshold',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // Item price 350 < 1000 threshold for SAVE100.
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
        coupon_code: 'SAVE100',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('minimum threshold'));
    }
  },
  {
    id: 'T2-PRICE-09',
    name: 'T2: Coupon capped at max_discount_amount does not exceed cap',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // HALFPRICE gives 50% up to 1500 max. Order subtotal: 5000 (prod_rare_collectible).
      // 50% of 5000 = 2500, but capped at 1500.
      const rareItem = TEST_CATALOG.find((p) => p.id === 'prod_rare_collectible')!;
      const payload: OrderCreatePayload = {
        items: [{ product_id: rareItem.id, quantity: 1 }],
        coupon_code: 'HALFPRICE',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 5000);
      assert.strictEqual(res.discount_amount, 1500, 'Discount must be capped at 1500 max');
      assert.strictEqual(res.total, 3560); // 5000 - 1500 + 60
    }
  },
  {
    id: 'T2-PRICE-10',
    name: 'T2: Payable total can never be negative, floored at minimum payable',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[1]; // 350

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: validAddress,
        payment_method: 'cod',
        total: -500 // Malicious negative total in payload
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.total! >= 0, 'Total cannot be negative');
      assert.strictEqual(res.total, 410); // 350 + 60
    }
  },
  {
    id: 'T2-PRICE-11',
    name: 'T2: Server ignores negative shipping cost attempts and applies standard 60 BDT',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0];

      const payload: any = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: validAddress,
        payment_method: 'cod',
        shipping_cost: -200
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 1210);
    }
  },
  {
    id: 'T2-PRICE-12',
    name: 'T2: Variant surcharge correctly factored into authoritative subtotal',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // Silver watch variant price: 2600 (base: 2400)
      const payload: OrderCreatePayload = {
        items: [
          {
            product_id: 'prod_smart_watch_99',
            quantity: 1,
            selected_variants: { color: 'Silver', size: 'Standard' }
          }
        ],
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 2600);
      assert.strictEqual(res.total, 2660);
    }
  },
  {
    id: 'T2-PRICE-13',
    name: 'T2: Attempted coupon SQL injection attack string is safely rejected',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: "' OR '1'='1' --",
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.success, false);
    }
  },
  {
    id: 'T2-PRICE-14',
    name: 'T2: Discount rounding produces clean whole integer BDT total',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // X5 Camera: 1150. 20% discount = 230 exact integer.
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        coupon_code: 'DURTUP2026',
        shipping_address: validAddress,
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(Number.isInteger(res.total), true);
      assert.strictEqual(Number.isInteger(res.discount_amount), true);
    }
  }
];
