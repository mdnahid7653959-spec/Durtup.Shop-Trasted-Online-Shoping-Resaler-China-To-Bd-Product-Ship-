/**
 * Tier 2: Boundary & Corner Cases
 * Suite: Address, Unicode & Security Payload Boundaries
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { dispatchOrderRequest, getPlacedOrder } from '../helpers/orderApiHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const payloadBoundaryTests: TestCase[] = [
  {
    id: 'T2-PAY-01',
    name: 'T2: Missing recipient first name rejected with HTTP 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: '',
          phone: '01711223344',
          address: 'Road 5',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('recipient name is required'));
    }
  },
  {
    id: 'T2-PAY-02',
    name: 'T2: Missing phone number rejected with HTTP 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          phone: '',
          address: 'Road 5',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('phone number is required'));
    }
  },
  {
    id: 'T2-PAY-03',
    name: 'T2: Missing delivery street address rejected with HTTP 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          phone: '01711223344',
          address: '',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('delivery address is required'));
    }
  },
  {
    id: 'T2-PAY-04',
    name: 'T2: Missing city/district rejected with HTTP 400',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          phone: '01711223344',
          address: 'Road 5, Block B',
          city: '',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 400);
      assert.ok(res.error?.includes('city/district is required'));
    }
  },
  {
    id: 'T2-PAY-05',
    name: 'T2: Bengali Unicode characters in customer name ("মোহাম্মদ নাঈম") preserved accurately',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const bengaliName = 'মোহাম্মদ নাঈম';

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: bengaliName,
          last_name: 'হোসেন',
          phone: '01711223344',
          address: 'ধানমন্ডি ৩২, ঢাকা ১২০৯',
          city: 'ঢাকা',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.shipping_address.first_name, bengaliName);
      assert.strictEqual(saved.shipping_address.city, 'ঢাকা');
    }
  },
  {
    id: 'T2-PAY-06',
    name: 'T2: Bengali Unicode characters in notes ("অর্ডারটি দুপুরের আগে ডেলিভারি করবেন") preserved',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const bengaliNotes = 'অর্ডারটি দুপুরের আগে ডেলিভারি করবেন। ধন্যবাদ।';

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Naim',
          last_name: 'Hossain',
          phone: '01711223344',
          address: 'Gulshan 1',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        notes: bengaliNotes
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.notes, bengaliNotes);
    }
  },
  {
    id: 'T2-PAY-07',
    name: 'T2: Phone number with international prefix "+8801711223344" accepted',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '+8801711223344',
          address: 'Banani',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
    }
  },
  {
    id: 'T2-PAY-08',
    name: 'T2: Phone number with dashes and formatting ("01711-223344") accepted',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711-223344',
          address: 'Banani',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
    }
  },
  {
    id: 'T2-PAY-09',
    name: 'T2: Ultra-long delivery address (500+ characters) handled safely without memory crash',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const longAddress = 'House ' + 'A'.repeat(550) + ', Sector 4, Uttara, Dhaka';

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: longAddress,
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.shipping_address.address.length, longAddress.length);
    }
  },
  {
    id: 'T2-PAY-10',
    name: 'T2: Ultra-long customer notes (1000+ characters) preserved intact',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const longNotes = 'Special instructions: ' + 'X'.repeat(1200);

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
        notes: longNotes
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.notes.length, longNotes.length);
    }
  },
  {
    id: 'T2-PAY-11',
    name: 'T2: XSS script tag payload in recipient name treated as safe literal text',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const xssPayload = '<script>alert("XSS_ATTACK_VECTOR")</script>';

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: xssPayload,
          last_name: 'Attacker',
          phone: '01711223344',
          address: 'Road 1',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.shipping_address.first_name, xssPayload);
    }
  },
  {
    id: 'T2-PAY-12',
    name: 'T2: SQL injection payload in address field safely treated as literal text',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const sqlPayload = "'; DROP TABLE orders; DROP TABLE users; --";

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: sqlPayload,
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.shipping_address.address, sqlPayload);
    }
  },
  {
    id: 'T2-PAY-13',
    name: 'T2: Special characters, ampersands, quotes, and emoji in notes preserved',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const complexNotes = 'Handle with care & love! "Fragile" items 📦✨';

      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Road 1',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        notes: complexNotes
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);

      const saved = getPlacedOrder(res.order_id!);
      assert.strictEqual(saved.notes, complexNotes);
    }
  },
  {
    id: 'T2-PAY-14',
    name: 'T2: Whitespace-padded address fields are cleanly accepted',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: '  Alpha  ',
          last_name: '  Customer  ',
          phone: '  01711223344  ',
          address: '  Road 12, Banani  ',
          city: '  Dhaka  ',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
    }
  }
];
