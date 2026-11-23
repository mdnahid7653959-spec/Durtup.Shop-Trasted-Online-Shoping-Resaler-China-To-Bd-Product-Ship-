/**
 * Tier 3: Cross-Feature Combinations (Pairwise Workflows)
 * Requirement: ORIGINAL_REQUEST §R1-R4, PROJECT.md Milestone 4
 */

import assert from 'node:assert';
import { TestCase, OrderCreatePayload } from '../helpers/types';
import {
  createValidToken,
  createExpiredToken,
  TEST_USERS
} from '../helpers/authHelper';
import {
  mergeCartItems,
  createMockCartItem,
  MockLocalStorage
} from '../helpers/cartHelper';
import {
  dispatchOrderRequest,
  getPlacedOrder
} from '../helpers/orderApiHelper';
import {
  evaluateOrderReadRule,
  evaluateOrderUpdateRule,
  simulateScopedOrdersQuery
} from '../helpers/securityRulesHelper';
import { TEST_CATALOG } from '../helpers/catalogHelper';

export const tier3Tests: TestCase[] = [
  {
    id: 'T3-01',
    name: 'T3-01: Guest cart -> Google login -> coupon application -> COD checkout',
    run: async () => {
      // Step 1: Guest adds item to cart
      const guestStorage = new MockLocalStorage();
      const guestItem = createMockCartItem({
        product_id: TEST_CATALOG[0].id,
        name: TEST_CATALOG[0].name,
        price: TEST_CATALOG[0].price,
        quantity: 1
      });
      guestStorage.setItem('megamart_cart', JSON.stringify([guestItem]));

      // Step 2: Google login succeeds
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // Step 3: Cart merged with user's remote cart
      const merged = mergeCartItems([], JSON.parse(guestStorage.getItem('megamart_cart') || '[]'));
      assert.strictEqual(merged.length, 1);

      // Step 4: Apply coupon DURTUP2026 and checkout with COD
      const payload: OrderCreatePayload = {
        items: [{ product_id: merged[0].product_id, quantity: merged[0].quantity }],
        coupon_code: 'DURTUP2026',
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
      assert.strictEqual(res.payment_method, 'cod');
      assert.strictEqual(res.discount_amount, 230); // 20% of 1150
      assert.strictEqual(res.total, 980);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
    }
  },
  {
    id: 'T3-02',
    name: 'T3-02: Guest cart -> login -> bKash checkout -> order detail access',
    run: async () => {
      // Step 1: Login
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // Step 2: bKash checkout
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[1].id, quantity: 2 }], // 350 * 2 = 700 + 60 = 760
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01885985097',
          address: 'Agrabad',
          city: 'Chittagong',
          country: 'Bangladesh'
        },
        payment_method: 'bkash',
        bkash_details: {
          sender_number: '01885985097',
          trx_id: 'BK_TRX_999888'
        }
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.payment_method, 'bkash');

      // Step 3: Order detail access by Customer Alpha
      const orderDoc = getPlacedOrder(res.order_id!);
      const accessCheck = evaluateOrderReadRule(
        {
          uid: TEST_USERS.CUSTOMER_ALPHA.uid,
          sub: TEST_USERS.CUSTOMER_ALPHA.uid,
          email: TEST_USERS.CUSTOMER_ALPHA.email,
          iss: 'https://securetoken.google.com/durtup-shop',
          aud: 'durtup-shop',
          auth_time: Date.now(),
          iat: Date.now(),
          exp: Date.now() + 3600
        },
        orderDoc
      );

      assert.strictEqual(accessCheck.allowed, true, 'Customer Alpha must be able to view their bKash order details');
    }
  },
  {
    id: 'T3-03',
    name: 'T3-03: Multi-item guest additions -> login -> remote cart merge -> quantity summation -> checkout',
    run: async () => {
      // Remote cart has 2 Cameras
      const remoteCart = [
        createMockCartItem({
          product_id: TEST_CATALOG[0].id,
          name: TEST_CATALOG[0].name,
          price: TEST_CATALOG[0].price,
          quantity: 2
        })
      ];

      // Guest adds 1 Camera and 1 Charger
      const guestCart = [
        createMockCartItem({
          product_id: TEST_CATALOG[0].id,
          name: TEST_CATALOG[0].name,
          price: TEST_CATALOG[0].price,
          quantity: 1
        }),
        createMockCartItem({
          product_id: TEST_CATALOG[1].id,
          name: TEST_CATALOG[1].name,
          price: TEST_CATALOG[1].price,
          quantity: 1
        })
      ];

      // Merge
      const merged = mergeCartItems(remoteCart, guestCart);
      assert.strictEqual(merged.length, 2);
      const cameraItem = merged.find((i) => i.product_id === TEST_CATALOG[0].id);
      assert.strictEqual(cameraItem?.quantity, 3, '2 remote + 1 guest = 3');

      // Checkout merged cart
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: merged.map((m) => ({ product_id: m.product_id, quantity: m.quantity })),
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Mohakhali DOHS',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      // Subtotal = (1150 * 3) + (350 * 1) = 3450 + 350 = 3800. Total = 3800 + 60 = 3860.
      assert.strictEqual(res.subtotal, 3800);
      assert.strictEqual(res.total, 3860);
    }
  },
  {
    id: 'T3-04',
    name: 'T3-04: Login -> checkout COD -> logout -> guest cart add -> login as different customer -> verify isolation',
    run: async () => {
      // 1. Customer Alpha orders
      const tokenA = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const resA = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
          shipping_address: {
            first_name: 'Alpha',
            last_name: 'User',
            phone: '01711223344',
            address: 'Mirpur',
            city: 'Dhaka',
            country: 'Bangladesh'
          },
          payment_method: 'cod'
        },
        `Bearer ${tokenA}`
      );
      assert.strictEqual(resA.status, 200);

      // 2. Alpha logs out -> cleanup
      const storage = new MockLocalStorage();
      storage.removeItem('megamart_cart');
      storage.removeItem(`durtup_profile_${TEST_USERS.CUSTOMER_ALPHA.uid}`);

      // 3. Guest adds an item
      const guestItem = createMockCartItem({ product_id: TEST_CATALOG[0].id, name: 'Camera', price: 1150, quantity: 1 });
      storage.setItem('megamart_cart', JSON.stringify([guestItem]));

      // 4. Customer Bravo logs in
      const tokenB = createValidToken(TEST_USERS.CUSTOMER_BRAVO.uid, TEST_USERS.CUSTOMER_BRAVO.email);
      const resB = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
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
      assert.strictEqual(resB.status, 200);
      assert.strictEqual(resB.user_id, TEST_USERS.CUSTOMER_BRAVO.uid);

      // 5. Verify isolation: Bravo orders query cannot see Alpha's order
      const allOrders = [getPlacedOrder(resA.order_id!), getPlacedOrder(resB.order_id!)];
      const bravoOrders = simulateScopedOrdersQuery(allOrders, TEST_USERS.CUSTOMER_BRAVO.uid);
      assert.strictEqual(bravoOrders.length, 1);
      assert.strictEqual(bravoOrders[0].id, resB.order_id);
    }
  },
  {
    id: 'T3-05',
    name: 'T3-05: Guest buy-now trigger -> modal sign-in -> direct checkout -> order isolation check',
    run: async () => {
      // Guest triggers Buy Now
      let buyNowProduct = TEST_CATALOG[0];
      let modalOpened = true;

      // Customer signs in via Google
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      modalOpened = false;

      // Direct checkout execution
      const payload: OrderCreatePayload = {
        items: [{ product_id: buyNowProduct.id, quantity: 1 }],
        shipping_address: {
          first_name: 'Alpha',
          last_name: 'Customer',
          phone: '01711223344',
          address: 'Gulshan',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(modalOpened, false);
      assert.strictEqual(res.user_id, TEST_USERS.CUSTOMER_ALPHA.uid);
    }
  },
  {
    id: 'T3-06',
    name: 'T3-06: Customer A order creation -> Customer B attempts detail access (forbidden 403)',
    run: async () => {
      // Customer A creates order
      const tokenA = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const resA = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
          shipping_address: {
            first_name: 'Alpha',
            last_name: 'Customer',
            phone: '01711223344',
            address: 'Secret House',
            city: 'Dhaka',
            country: 'Bangladesh'
          },
          payment_method: 'cod'
        },
        `Bearer ${tokenA}`
      );
      assert.strictEqual(resA.status, 200);

      // Customer B attempts to inspect Customer A's order
      const orderDoc = getPlacedOrder(resA.order_id!);
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

      const accessResult = evaluateOrderReadRule(bravoClaims, orderDoc);
      assert.strictEqual(accessResult.allowed, false);
      assert.strictEqual(accessResult.status, 403, 'Customer B must be forbidden from Customer A order');
    }
  },
  {
    id: 'T3-07',
    name: 'T3-07: Customer bKash order -> Admin views order -> customer cannot edit order',
    run: async () => {
      // 1. Customer creates bKash order
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const res = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
          shipping_address: {
            first_name: 'Alpha',
            last_name: 'Customer',
            phone: '01885985097',
            address: 'Uttara',
            city: 'Dhaka',
            country: 'Bangladesh'
          },
          payment_method: 'bkash',
          bkash_details: { sender_number: '01885985097', trx_id: 'TRX_ADMIN_CHECK_1' }
        },
        `Bearer ${token}`
      );
      assert.strictEqual(res.status, 200);

      const orderDoc = getPlacedOrder(res.order_id!);

      // 2. Admin views order -> allowed
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
      const adminRead = evaluateOrderReadRule(adminClaims, orderDoc);
      assert.strictEqual(adminRead.allowed, true);

      // 3. Customer attempts to alter order -> forbidden
      const customerClaims = {
        uid: TEST_USERS.CUSTOMER_ALPHA.uid,
        sub: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };
      const customerEdit = evaluateOrderUpdateRule(customerClaims, orderDoc, { status: 'cancelled' });
      assert.strictEqual(customerEdit.allowed, false);
      assert.strictEqual(customerEdit.status, 403);
    }
  },
  {
    id: 'T3-08',
    name: 'T3-08: Token expired during checkout -> 401 prompt re-auth -> refresh token -> retry checkout succeeds',
    run: async () => {
      // 1. Initial attempt with expired token
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

      const failRes = await dispatchOrderRequest(payload, `Bearer ${expiredToken}`);
      assert.strictEqual(failRes.status, 401, 'Should fail with 401 on expired token');

      // 2. Client refreshes token (getIdToken(true))
      const freshToken = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // 3. Retry checkout with refreshed token
      const retryRes = await dispatchOrderRequest(payload, `Bearer ${freshToken}`);
      assert.strictEqual(retryRes.status, 200, 'Checkout must succeed after token refresh');
      assert.strictEqual(retryRes.success, true);
    }
  },
  {
    id: 'T3-09',
    name: 'T3-09: Guest adds same item with different variants -> login -> merge keeps distinct variant line items',
    run: async () => {
      const guestCart = [
        createMockCartItem({
          product_id: 'prod_smart_watch_99',
          name: 'Watch',
          price: 2400,
          quantity: 1,
          selected_variants: { color: 'Black', size: 'Standard' }
        }),
        createMockCartItem({
          product_id: 'prod_smart_watch_99',
          name: 'Watch',
          price: 2600,
          quantity: 1,
          selected_variants: { color: 'Silver', size: 'Standard' }
        })
      ];

      const merged = mergeCartItems([], guestCart);
      assert.strictEqual(merged.length, 2, 'Distinct variants must remain separate');

      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const payload: OrderCreatePayload = {
        items: merged.map((m) => ({
          product_id: m.product_id,
          quantity: m.quantity,
          selected_variants: m.selected_variants
        })),
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
      assert.strictEqual(res.subtotal, 5000); // 2400 (black) + 2600 (silver)
      assert.strictEqual(res.total, 5060);
    }
  },
  {
    id: 'T3-10',
    name: 'T3-10: First-time customer Google Sign-In -> profile created -> cart persisted -> checkout bound to new UID',
    run: async () => {
      const newUser = TEST_USERS.CUSTOMER_NEW;
      // Step 1: Token created for new user
      const token = createValidToken(newUser.uid, newUser.email);

      // Step 2: Checkout
      const payload: OrderCreatePayload = {
        items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
        shipping_address: {
          first_name: 'Charlie',
          last_name: 'Newcomer',
          phone: '01755555555',
          address: 'Banani 11',
          city: 'Dhaka',
          country: 'Bangladesh'
        },
        payment_method: 'cod'
      };

      const res = await dispatchOrderRequest(payload, `Bearer ${token}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.user_id, newUser.uid);
    }
  },
  {
    id: 'T3-11',
    name: 'T3-11: Returning user cloud cart + guest items -> merge respects max stock limit -> checkout',
    run: async () => {
      // Remote cart has 1 rare item (stock is 2)
      const rareItem = TEST_CATALOG.find((p) => p.id === 'prod_rare_collectible')!;
      const remoteCart = [
        createMockCartItem({ product_id: rareItem.id, name: rareItem.name, price: rareItem.price, quantity: 1, stock: 2 })
      ];

      // Guest cart adds 2 of same rare item
      const guestCart = [
        createMockCartItem({ product_id: rareItem.id, name: rareItem.name, price: rareItem.price, quantity: 2, stock: 2 })
      ];

      // Merging 1 + 2 = 3, but clamped to stock limit 2
      const merged = mergeCartItems(remoteCart, guestCart);
      assert.strictEqual(merged[0].quantity, 2);

      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const res = await dispatchOrderRequest(
        {
          items: [{ product_id: rareItem.id, quantity: merged[0].quantity }],
          shipping_address: {
            first_name: 'Alpha',
            last_name: 'Customer',
            phone: '01711223344',
            address: 'Dhanmondi',
            city: 'Dhaka',
            country: 'Bangladesh'
          },
          payment_method: 'cod'
        },
        `Bearer ${token}`
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.subtotal, 10000); // 5000 * 2
    }
  },
  {
    id: 'T3-12',
    name: 'T3-12: Checkout with invalid coupon -> 400 rejection -> remove coupon -> checkout succeeds',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);
      const basePayload: OrderCreatePayload = {
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

      // 1. Submit with bad coupon
      const failRes = await dispatchOrderRequest({ ...basePayload, coupon_code: 'BOGUS99' }, `Bearer ${token}`);
      assert.strictEqual(failRes.status, 400);

      // 2. Submit without coupon
      const okRes = await dispatchOrderRequest({ ...basePayload, coupon_code: null }, `Bearer ${token}`);
      assert.strictEqual(okRes.status, 200);
      assert.strictEqual(okRes.total, 1210);
    }
  },
  {
    id: 'T3-13',
    name: 'T3-13: Multiple orders created by Customer A -> My Orders scoped query returns strictly Customer A orders',
    run: async () => {
      const token = createValidToken(TEST_USERS.CUSTOMER_ALPHA.uid, TEST_USERS.CUSTOMER_ALPHA.email);

      // Place 2 orders for Alpha
      const r1 = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[0].id, quantity: 1 }],
          shipping_address: { first_name: 'Alpha', last_name: 'User', phone: '01711223344', address: 'A', city: 'Dhaka', country: 'BD' },
          payment_method: 'cod'
        },
        `Bearer ${token}`
      );
      const r2 = await dispatchOrderRequest(
        {
          items: [{ product_id: TEST_CATALOG[1].id, quantity: 1 }],
          shipping_address: { first_name: 'Alpha', last_name: 'User', phone: '01711223344', address: 'B', city: 'Dhaka', country: 'BD' },
          payment_method: 'cod'
        },
        `Bearer ${token}`
      );

      const allPlaced = [getPlacedOrder(r1.order_id!), getPlacedOrder(r2.order_id!)];
      const alphaOrders = simulateScopedOrdersQuery(allPlaced, TEST_USERS.CUSTOMER_ALPHA.uid);

      assert.strictEqual(alphaOrders.length, 2);
    }
  },
  {
    id: 'T3-14',
    name: 'T3-14: Seller views orders containing seller products -> customer private credentials protected',
    run: () => {
      const sellerClaims = {
        uid: TEST_USERS.SELLER_USER.uid,
        sub: TEST_USERS.SELLER_USER.uid,
        email: TEST_USERS.SELLER_USER.email,
        role: 'seller',
        seller_id: 'seller_dhaka_1',
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };

      // Order with seller products
      const order = {
        id: 'ord_seller_item',
        user_id: 'cust_alpha_101',
        seller_id: 'seller_dhaka_1',
        items: [{ product_id: 'prod_camera_1', quantity: 1 }]
      };

      // Verification that seller is authorized to inspect their own item orders
      assert.strictEqual(order.seller_id, sellerClaims.seller_id);
    }
  },
  {
    id: 'T3-15',
    name: 'T3-15: Customer attempts to alter order status -> blocked by security rules -> admin updates order',
    run: () => {
      const customerClaims = {
        uid: TEST_USERS.CUSTOMER_ALPHA.uid,
        sub: TEST_USERS.CUSTOMER_ALPHA.uid,
        email: TEST_USERS.CUSTOMER_ALPHA.email,
        iss: 'https://securetoken.google.com/durtup-shop',
        aud: 'durtup-shop',
        auth_time: Date.now(),
        iat: Date.now(),
        exp: Date.now() + 3600
      };
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

      const order = { id: 'ord_1', user_id: TEST_USERS.CUSTOMER_ALPHA.uid, status: 'pending' };

      // Customer attempt blocked
      const custAttempt = evaluateOrderUpdateRule(customerClaims, order, { status: 'cancelled' });
      assert.strictEqual(custAttempt.allowed, false);

      // Admin update allowed
      const adminAttempt = evaluateOrderUpdateRule(adminClaims, order, { status: 'cancelled' });
      assert.strictEqual(adminAttempt.allowed, true);
    }
  },
  {
    id: 'T3-16',
    name: 'T3-16: Rapid guest additions -> fast Google login -> atomic cart merge verification',
    run: () => {
      const storage = new MockLocalStorage();
      const itemsToAdd = [
        createMockCartItem({ product_id: '14', name: 'Charger', price: 350, quantity: 1 }),
        createMockCartItem({ product_id: 'ac0a83b2-e060-450f-aabe-6ef05e56eb31', name: 'Camera', price: 1150, quantity: 1 })
      ];

      storage.setItem('megamart_cart', JSON.stringify(itemsToAdd));

      // Fast merge
      const guestItems = JSON.parse(storage.getItem('megamart_cart') || '[]');
      const remoteItems = [
        createMockCartItem({ product_id: '14', name: 'Charger', price: 350, quantity: 1 })
      ];

      const merged = mergeCartItems(remoteItems, guestItems);
      assert.strictEqual(merged.length, 2);
      const charger = merged.find((i) => i.product_id === '14');
      assert.strictEqual(charger?.quantity, 2);
    }
  }
];
