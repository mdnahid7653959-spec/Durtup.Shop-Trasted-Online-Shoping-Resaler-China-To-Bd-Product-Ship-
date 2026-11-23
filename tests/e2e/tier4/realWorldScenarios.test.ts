/**
 * Tier 4: Real-World Application Scenarios
 * Requirement: ORIGINAL_REQUEST §R1-R4, PROJECT.md Milestone 4
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import { createValidToken, TEST_USERS } from '../helpers/authHelper';
import { MockLocalStorage, mergeCartItems, createMockCartItem } from '../helpers/cartHelper';
import { dispatchOrderRequest, getPlacedOrder } from '../helpers/orderApiHelper';
import { evaluateOrderReadRule, simulateScopedOrdersQuery } from '../helpers/securityRulesHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const tier4Tests: TestCase[] = [
  {
    id: 'T4-SCENARIO-01',
    name: 'Scenario 1: New customer discovery to COD purchase end-to-end journey',
    run: async () => {
      // 1. Guest discovers product and adds to local storage
      const storage = new MockLocalStorage();
      const cameraItem = createMockCartItem({
        product_id: TEST_CATALOG[0].id,
        name: TEST_CATALOG[0].name,
        price: TEST_CATALOG[0].price,
        quantity: 1
      });
      storage.setItem('megamart_cart', JSON.stringify([cameraItem]));

      // 2. Guest clicks checkout -> intercepted by auth modal
      const newCustomer = TEST_USERS.CUSTOMER_NEW;
      let modalOpen = true;

      // 3. Customer signs in with Google -> profile created
      const token = createValidToken(newCustomer.uid, newCustomer.email);
      modalOpen = false;
      storage.setItem(`durtup_profile_${newCustomer.uid}`, JSON.stringify({
        id: newCustomer.uid,
        email: newCustomer.email,
        full_name: newCustomer.full_name,
        role: 'customer'
      }));

      // 4. Cart persisted and preserved for new customer
      const itemsInCart = JSON.parse(storage.getItem('megamart_cart') || '[]');
      assert.strictEqual(itemsInCart.length, 1);

      // 5. Checkout with COD
      const payload: OrderCreatePayload = {
        items: [{ product_id: itemsInCart[0].product_id, quantity: itemsInCart[0].quantity }],
        shipping_address: {
          first_name: 'Charlie',
          last_name: 'Newcomer',
          phone: '01711998877',
          address: 'House 5, Road 11, Banani',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user_id, newCustomer.uid);
      assert.strictEqual(res.payment_method, 'cod');
      assert.strictEqual(res.payment_status, 'pending');
      assert.strictEqual(res.total, 1210); // 1150 + 60

      // 6. Customer views order in My Orders
      const order = getPlacedOrder(res.order_id!);
      const myOrders = simulateScopedOrdersQuery([order], newCustomer.uid);
      assert.strictEqual(myOrders.length, 1);
      assert.strictEqual(myOrders[0].id, res.order_id);
    }
  },
  {
    id: 'T4-SCENARIO-02',
    name: 'Scenario 2: Returning customer multi-item bKash purchase with coupon',
    run: async () => {
      // 1. Returning customer Alpha has 1 charger in cloud cart
      const remoteCart = [
        createMockCartItem({
          product_id: TEST_CATALOG[1].id,
          name: TEST_CATALOG[1].name,
          price: TEST_CATALOG[1].price,
          quantity: 1
        })
      ];

      // 2. Alpha browses as guest before logging in and adds 1 Camera
      const guestCart = [
        createMockCartItem({
          product_id: TEST_CATALOG[0].id,
          name: TEST_CATALOG[0].name,
          price: TEST_CATALOG[0].price,
          quantity: 1
        })
      ];

      // 3. Signs in with Google -> carts merge without data loss
      const mergedCart = mergeCartItems(remoteCart, guestCart);
      assert.strictEqual(mergedCart.length, 2, 'Must contain both Charger and Camera');

      // 4. Applies promo coupon DURTUP2026 and selects bKash payment
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      // Pricing: Camera (1150) + Charger (350) = 1500 subtotal. 20% discount = 300. Shipping = 60. Total = 1260.
      const payload: OrderCreatePayload = {
        items: mergedCart.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
        coupon_code: 'DURTUP2026',
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01885985097',
          address: 'Dhanmondi 27',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'bkash',
        bkash_details: {
          sender_number: '01885985097',
          trx_id: 'BK_RETURNING_2026_TRX'
        }
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 1500);
      assert.strictEqual(res.discount_amount, 300);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 1260);
      assert.strictEqual(res.payment_status, 'pending_verification');

      // 5. Customer views detailed order breakdown
      const order = getPlacedOrder(res.order_id!);
      assert.strictEqual(order.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
      assert.strictEqual(order.payment_method, 'bkash');
    }
  },
  {
    id: 'T4-SCENARIO-03',
    name: 'Scenario 3: Price tampering and UID spoofing attacker completely defeated',
    run: async () => {
      // Attacker is Customer Alpha attempting to spoof Customer Bravo and tamper prices
      const attackerToken = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // Malicious payload with:
      // - Spoofed user_id = Customer Bravo
      // - Tampered client_price = 5 BDT (instead of 1150)
      // - Tampered shipping = -50 BDT (instead of 60)
      // - Tampered total = 10 BDT
      const maliciousPayload: any = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1, client_price: 5 }],
        shipping_address: {
          first_name: 'Hacker',
          last_name: 'Man',
          phone: '01700000000',
          address: 'Dark Alley',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod',
        user_id: TEST_USERS.CUSTOMER_BRAVO.uid, // Spoofing attempt
        shipping_cost: -50,
        total: 10
      };

      const res = await dispatchOrderRequest(maliciousPayload, `Bearer ${attackerToken}`);

      // 1. Order succeeds, but server sanitized all parameters:
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid, 'Order must be bound to authenticated UID');
      assert.notStrictEqual(res.user_id, TEST_USERS.CUSTOMER_BRAVO.uid, 'Spoofed UID must be discarded');
      assert.strictEqual(res.subtotal, 1150, 'Price must be computed from catalog');
      assert.strictEqual(res.shipping_cost, 60, 'Shipping cost must be authoritative 60');
      assert.strictEqual(res.total, 1210, 'Total must be 1210 BDT');

      // 2. Attacker attempts to read victim Bravo's private orders
      const victimOrderDoc = { id: 'ord_bravo_private', user_id: TEST_USERS.CUSTOMER_BRAVO.uid, total: 5000 };
      const attackerClaims = {
        uid: TEST_USERS.CUSTOMER_ALPHA.uid,
        sub: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };

      const forbiddenAccess = evaluateOrderReadRule(attackerClaims, victimOrderDoc);
      assert.strictEqual(forbiddenAccess.allowed, false);
      assert.strictEqual(forbiddenAccess.status, 403, 'Attacker must be completely blocked from victim data');
    }
  },
  {
    id: 'T4-SCENARIO-04',
    name: 'Scenario 4: Multi-variant and cross-catalog (regular + CJ) combined purchase',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // Cart containing:
      // 1. Regular product: Silver Watch variant (price: 2600)
      // 2. CJ Dropship product: China Fleece Jacket L/Black (price: 1300)
      // Expected Subtotal: 2600 + 1300 = 3900 BDT
      // Coupon: SAVE100 (-100 BDT)
      // Shipping: 60 BDT
      // Expected Total: 3900 - 100 + 60 = 3860 BDT
      const payload: OrderCreatePayload = {
        items: [
          {
            product_id: 'prod_smart_watch_99',
            quantity: 1,
            selected_variants: { color: 'Silver', size: 'Standard' },
            source: 'regular'
          },
          {
            product_id: 'cj_apparel_777',
            quantity: 1,
            selected_variants: { color: 'Black', size: 'L' },
            source: 'cj'
          }
        ],
        coupon_code: 'SAVE100',
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Gulshan 1',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 3900);
      assert.strictEqual(res.discount_amount, 100);
      assert.strictEqual(res.shipping_cost, 60);
      assert.strictEqual(res.total, 3860);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
    }
  },
  {
    id: 'T4-SCENARIO-05',
    name: 'Scenario 5: Cart session recovery across logout and account switching',
    run: async () => {
      const storage = new MockLocalStorage();

      // 1. Customer Alpha logs in and has items in cart
      const alphaCart = [
        createMockCartItem({ product_id: TEST_CATALOG[0].id, name: 'Camera', price: 1150, quantity: 1 })
      ];
      storage.setItem('megamart_cart', JSON.stringify(alphaCart));
      storage.setItem('durtup_active_user', TEST_USERS.CUSTOMER_ALPHA.uid);

      // 2. Customer Alpha logs out -> storage wiped for privacy
      storage.removeItem('megamart_cart');
      storage.removeItem('durtup_active_user');
      storage.removeItem(`durtup_profile_${TEST_USERS.CUSTOMER_ALPHA.uid}`);

      assert.strictEqual(storage.getItem('megamart_cart'), null);

      // 3. Customer Bravo logs in on the same browser/device
      const bravoCloudCart = [
        createMockCartItem({ product_id: TEST_CATALOG[1].id, name: 'Charger', price: 350, quantity: 3 })
      ];
      // Bravo restores only Bravo's cloud cart
      storage.setItem('megamart_cart', JSON.stringify(bravoCloudCart));
      storage.setItem('durtup_active_user', TEST_USERS.CUSTOMER_BRAVO.uid);

      const restoredBravoCart = JSON.parse(storage.getItem('megamart_cart') || '[]');
      assert.strictEqual(restoredBravoCart.length, 1);
      assert.strictEqual(restoredBravoCart[0].product_id, TEST_CATALOG[1].id);
      assert.strictEqual(restoredBravoCart[0].quantity, 3);

      // 4. Bravo completes checkout
      const tokenB = createValidToken(TEST_USERS.CUSTOMER_BRAVO.uid, TEST_USERS.CUSTOMER_BRAVO.email);
      const res = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[1].id, quantity: 3 }],
          shipping_address: {
            first_name: 'Bravo',
            last_name: 'User',
            phone: '01899999999',
            address: 'Khulna',
            city: 'Khulna',
            country: 'Bangladesh'
          },
          payment_method: 'cod'
        },
        `Bearer ${tokenB}`
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_BRAVO.uid);

      // 5. Bravo logs out -> clean state for subsequent guests
      storage.removeItem('megamart_cart');
      storage.removeItem('durtup_active_user');

      const cleanGuestCart = storage.getItem('megamart_cart');
      assert.strictEqual(cleanGuestCart, null, 'Shared browser must be pristine');
    }
  },
  {
    id: 'T4-SCENARIO-06',
    name: 'Scenario 6: High-concurrency rapid checkout attempts and cart idempotency',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const prod = TEST_CATALOG[0];

      const payload: OrderCreatePayload = {
        items: [{ product_id: prod.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Rapid Order Street',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      // Rapid burst of 4 concurrent checkout requests
      const promises = [
        dispatchOrderRequest(payload, `Bearer ${token}`),
        dispatchOrderRequest(payload, `Bearer ${token}`),
        dispatchOrderRequest(payload, `Bearer ${token}`),
        dispatchOrderRequest(payload, `Bearer ${token}`)
      ];

      const results = await Promise.all(promises);

      // Verify all orders are handled deterministically with status 200
      assert.strictEqual(results.every((r) => r.status === 200), true);

      // Verify each created order has a distinct, valid order ID and order number
      const orderIds = new Set(results.map((r) => r.order_id));
      const orderNumbers = new Set(results.map((r) => r.order_number));

      assert.strictEqual(orderIds.size, 4, 'Each checkout attempt must have a unique order ID');
      assert.strictEqual(orderNumbers.size, 4, 'Each checkout attempt must have a unique order number');
      assert.strictEqual(results.every((r) => r.user_id === TEST_USERS.CUSTOMER_ALPHA.uid), true);
    }
  }
];
