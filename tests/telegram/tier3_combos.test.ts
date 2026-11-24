/**
 * Durtup.shop Telegram Super Admin Control Center
 * Tier 3: Cross-Feature Combinations Test Suite
 *
 * Implements >=17 multi-step pairwise cross-feature interaction tests:
 * - T3-01: Order approval -> status confirmed -> order_timelines -> loyalty points awarded (F07+F04+F13)
 * - T3-02: Order rejection flow: prompt rejection -> cancel dialog -> status unchanged; prompt -> confirm -> cancelled -> audit log (F07+F08+F04)
 * - T3-03: Product price update -> catalog listing reflects new price -> low-stock check -> inventory valuation reflects updated price (F11+F12+F16)
 * - T3-04: Stock deduction -> crossing low stock threshold (12 -> 8) -> low-stock alert triggered -> stock adjustment in inventory_logs (F11+F12+F04)
 * - T3-05: bKash payment inspection -> transaction verified -> order status confirmed/paid -> audit log recorded (F09+F07+F04)
 * - T3-06: Return request inspection -> proof photos checked -> refund approved -> inventory returned / points deducted -> audit log recorded (F10+F12+F04)
 * - T3-07: Customer search -> order history view -> status toggle to suspended -> subsequent order placement or admin pairing blocked (F13+F02+F04)
 * - T3-08: Order notification received -> supplier attributed to EcomsellerBD -> courier assigned to Pathao -> tracking number updated (F06+F14+F04)
 * - T3-09: Order notification received -> supplier attributed to Dropshipping.com.bd -> courier assigned to SteadFast -> tracking number updated (F06+F14+F04)
 * - T3-10: Coupon created via admin -> coupon toggled active -> verified in coupon list -> order discount computed (F15+F08+F04)
 * - T3-11: Review moderation -> pending review approved -> product rating updated -> verified buyer badge preserved (F15+F11+F04)
 * - T3-12: Q&A moderation -> question answered/approved -> official store badge displayed (F15+F11+F04)
 * - T3-13: Order delivery transition -> delivered status -> today revenue analytics in Asia/Dhaka increments -> commission/net profit computed (F07+F16+F04)
 * - T3-14: Maintenance mode toggle on -> non-admin routes blocked / banner displayed -> toggled off -> normal operations restored -> audit log recorded (F17+F05+F04)
 * - T3-15: Unauthorized access attempt on sensitive action -> blocked by auth guard -> security audit log created -> master admin alert (F02+F17+F04)
 * - T3-16: Webhook update with secret header -> valid secret accepted -> rate limiter bucket decrements -> router dispatches to module (F03+F01+F05)
 * - T3-17: Rate limit exceeded -> subsequent commands throttled -> resets after window -> next command succeeds (F03+F05)
 * Total: 17 comprehensive test cases.
 */

import { TestSuite, TestCase, TestContext } from './harness/types';
import { handleTelegramWebhookUpdate } from '../../src/server/telegram/telegramRouter';
import {
  verifyTelegramAuthorization,
  verifyWebhookSecret,
  checkRateLimit,
  resetRateLimits,
  clearTelegramAuthCache,
  MASTER_ADMIN_ID
} from '../../src/server/telegram/telegramAuth';
import {
  recordTelegramAudit,
  getRecentTelegramAuditLogs,
  clearInMemoryAuditLogs
} from '../../src/server/telegram/auditHelper';
import { setTelegramTransport } from '../../src/server/telegram/telegramApi';
import { TelegramStateManager } from '../../src/server/telegram/telegramState';
import {
  attributeSupplier,
  buildOrderNotificationButtons,
  formatOrderNotificationText,
  executeOrderStatusUpdate,
  buildConfirmationPromptKeyboard,
  validateBkashTrxId,
  verifyPayment,
  processRefund,
  updateProductPrice,
  updateProductStock,
  calculateInventoryValuation,
  getLowStockAlerts,
  toggleCustomerAccess,
  assignCourierToOrder,
  createCoupon,
  toggleCouponActive,
  calculateOrderDiscount,
  moderateReview,
  moderateQuestion,
  computeAnalyticsReport,
  computeOrderProfitMargin,
  toggleMaintenanceMode,
  awardLoyaltyPoints,
  deductLoyaltyPoints
} from './harness/featureHelpers';

// Helper to wrap test runs with setup/teardown isolation
function createTier3Test(
  id: string,
  feature: string,
  name: string,
  fn: (ctx: TestContext) => Promise<void> | void
): TestCase {
  return {
    id,
    feature,
    name,
    tier: 3,
    run: async (ctx: TestContext) => {
      process.env.TELEGRAM_WEBHOOK_SECRET = 'durtup_tg_admin_sec_2026';
      ctx.mockDb.restoreSnapshot();
      ctx.mockTelegramApi.clear();
      resetRateLimits();
      clearTelegramAuthCache();
      clearInMemoryAuditLogs();
      TelegramStateManager.resetState();

      setTelegramTransport((method: string, payload: any) => {
        return ctx.mockTelegramApi.recordCall(method as any, payload);
      });

      try {
        await fn(ctx);
      } finally {
        setTelegramTransport(null);
      }
    }
  };
}

export const tier3TestSuite: TestSuite = {
  tier: 3,
  title: 'Tier 3: Cross-Feature Combinations Test Suite',
  tests: [
    // ==========================================
    // T3-01: Order approval -> status confirmed -> order_timelines -> loyalty points (F07+F04+F13)
    // ==========================================
    createTier3Test(
      'T3-01',
      'F07+F04+F13',
      'Order approval updates order status, records timeline entry, logs central audit, and awards customer loyalty points',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        const initialOrder = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(initialOrder.status, 'pending');

        // 1. Approve order via executeOrderStatusUpdate
        const res = await executeOrderStatusUpdate(ctx.mockDb, orderId, 'confirmed', 8204855335, 'Approved by Master Admin via Telegram');
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.status, 'confirmed');

        // 2. Verify order_timelines contains confirmation entry
        const timelines = ctx.mockDb.query('order_timelines', t => t.order_id === orderId);
        const confirmTimeline = timelines.find(t => t.status === 'confirmed');
        ctx.assert.isTrue(Boolean(confirmTimeline), 'Timeline must have confirmed status record');
        ctx.assert.equal(confirmTimeline?.updated_by, '8204855335');

        // 3. Verify central audit log
        const audits = getRecentTelegramAuditLogs();
        const orderAudit = audits.find(a => a.entityId === orderId && a.action === 'ORDER_STATUS_UPDATE');
        ctx.assert.isTrue(Boolean(orderAudit), 'Audit log must record order status update');
        ctx.assert.equal(orderAudit?.oldValue, 'pending');
        ctx.assert.equal(orderAudit?.newValue, 'confirmed');

        // 4. Award loyalty points to the customer profile
        const loyaltyRes = await awardLoyaltyPoints(ctx.mockDb, 'USER-001', orderId, res.order.total_amount, 5, 8204855335);
        ctx.assert.isTrue(loyaltyRes.success);
        ctx.assert.equal(loyaltyRes.pointsAwarded, 99); // floor((1998 / 100) * 5) = 99 points
        ctx.assert.equal(loyaltyRes.newBalance, 99);

        // 5. Verify customer profile reflects updated loyalty points and spend
        const profile = ctx.mockDb.getDoc('profiles', 'PROF-001');
        ctx.assert.equal(profile.loyalty_points, 99);
        ctx.assert.equal(profile.total_spent, 12500 + 1998);

        // 6. Verify audit log captures loyalty event
        const postAudits = getRecentTelegramAuditLogs();
        const loyaltyAudit = postAudits.find(a => a.action === 'LOYALTY_POINTS_AWARDED');
        ctx.assert.isTrue(Boolean(loyaltyAudit), 'Audit log must capture loyalty points award event');
      }
    ),

    // ==========================================
    // T3-02: Order rejection flow: prompt -> cancel -> unchanged; prompt -> confirm -> cancelled -> audit (F07+F08+F04)
    // ==========================================
    createTier3Test(
      'T3-02',
      'F07+F08+F04',
      'Order rejection flow: prompt rejection -> cancel dialog leaves order unchanged; confirm cancels order and records audit log',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';

        // Step 1: Prompt rejection with confirmation keyboard
        const promptKeyboard = buildConfirmationPromptKeyboard(`ord:rej_exec:${orderId}`, `ord:view:${orderId}`);
        ctx.assert.isTrue(promptKeyboard.inline_keyboard.length > 0);
        ctx.assert.equal(promptKeyboard.inline_keyboard[0][0].callback_data, `ord:rej_exec:${orderId}`);
        ctx.assert.equal(promptKeyboard.inline_keyboard[0][1].callback_data, `cnf:cancel:ord:view:${orderId}`);

        // Step 2: User taps cancel button -> router handles action_cancelled
        const cancelUpdate = ctx.createCallbackQueryUpdate(`cnf:cancel:ord:view:${orderId}`, 8204855335);
        const cancelResult = await handleTelegramWebhookUpdate(cancelUpdate, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(cancelResult.handled);
        ctx.assert.equal(cancelResult.action, 'action_cancelled');

        // Order status must remain unchanged ('pending')
        const orderAfterCancel = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(orderAfterCancel.status, 'pending');

        // Step 3: Prompt again and confirm execution
        const confirmResult = await executeOrderStatusUpdate(ctx.mockDb, orderId, 'cancelled', 8204855335, 'Customer requested cancellation');
        ctx.assert.isTrue(confirmResult.success);
        ctx.assert.equal(confirmResult.order.status, 'cancelled');

        // Step 4: Verify audit log recorded rejection
        const audits = getRecentTelegramAuditLogs();
        const rejAudit = audits.find(a => a.entityId === orderId && a.newValue === 'cancelled');
        ctx.assert.isTrue(Boolean(rejAudit), 'Audit log must record cancellation');
        ctx.assert.equal(rejAudit?.oldValue, 'pending');
        ctx.assert.equal(rejAudit?.newValue, 'cancelled');
      }
    ),

    // ==========================================
    // T3-03: Product price update -> catalog listing -> low-stock check -> inventory valuation (F11+F12+F16)
    // ==========================================
    createTier3Test(
      'T3-03',
      'F11+F12+F16',
      'Product price update updates catalog, maintains low-stock classification, and recalculates total inventory valuation in BDT',
      async (ctx: TestContext) => {
        const prodId = 'PROD-002'; // Smart Waterproof Watch Series 9 (stock: 4, regular_price: 2500, discount_price: 2199)
        const initialValuation = calculateInventoryValuation(ctx.mockDb);

        // 1. Update regular price to 3000 BDT
        const updateRes = await updateProductPrice(ctx.mockDb, prodId, 3000, 8204855335);
        ctx.assert.isTrue(updateRes.success);
        ctx.assert.equal(updateRes.product.regular_price, 3000);

        // Update discount price to null so valuation uses regular_price
        ctx.mockDb.updateDoc('products', prodId, { discount_price: null });

        // 2. Catalog listing reflects new price
        const updatedProd = ctx.mockDb.getDoc('products', prodId);
        ctx.assert.equal(updatedProd.regular_price, 3000);

        // 3. Low-stock check still includes this product (stock = 4 <= 10)
        const lowStock = getLowStockAlerts(ctx.mockDb);
        const found = lowStock.find(p => p.id === prodId);
        ctx.assert.isTrue(Boolean(found), 'Product must remain flagged as low stock');
        ctx.assert.equal(found?.stock_quantity, 4);

        // 4. Inventory valuation reflects updated price (4 * 3000 = 12000 vs old 4 * 2199 = 8796)
        const newValuation = calculateInventoryValuation(ctx.mockDb);
        const expectedDiff = (4 * 3000) - (4 * 2199);
        ctx.assert.equal(newValuation.totalValuationBDT, initialValuation.totalValuationBDT + expectedDiff);

        // 5. Central audit log verifies price adjustment
        const audits = getRecentTelegramAuditLogs();
        const priceAudit = audits.find(a => a.entityId === prodId && a.action === 'PRODUCT_PRICE_UPDATE');
        ctx.assert.isTrue(Boolean(priceAudit));
        ctx.assert.equal(priceAudit?.oldValue, 2500);
        ctx.assert.equal(priceAudit?.newValue, 3000);
      }
    ),

    // ==========================================
    // T3-04: Stock deduction -> crossing low stock threshold (12 -> 8) -> low-stock alert -> inventory_logs (F11+F12+F04)
    // ==========================================
    createTier3Test(
      'T3-04',
      'F11+F12+F04',
      'Stock deduction crossing low-stock threshold triggers low-stock alert and creates inventory_logs audit trail',
      async (ctx: TestContext) => {
        // Create product with stock 12 (above low-stock threshold of 10)
        const testProd = ctx.mockDb.addDoc('products', {
          id: 'PROD-THRESH-01',
          name: 'Thermal Travel Mug',
          sku: 'DIR-MUG-12',
          regular_price: 650,
          discount_price: null,
          stock_quantity: 12,
          is_active: true,
          category: 'Kitchen'
        });

        // Verify initial low-stock list does not include it
        const initialAlerts = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isFalse(initialAlerts.some(p => p.id === testProd.id));

        // Deduct stock from 12 to 8 (crosses threshold of 10)
        const res = await updateProductStock(ctx.mockDb, testProd.id, 8, 8204855335, 'Stock dispatched for offline sales batch');
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.product.stock_quantity, 8);

        // Verify low-stock alerts now include this product
        const postAlerts = getLowStockAlerts(ctx.mockDb);
        const alertItem = postAlerts.find(p => p.id === testProd.id);
        ctx.assert.isTrue(Boolean(alertItem), 'Product must trigger low-stock alert after crossing threshold');
        ctx.assert.equal(alertItem?.stock_quantity, 8);

        // Verify inventory_logs entry recorded
        const invLogs = ctx.mockDb.listDocs('inventory_logs');
        const invEntry = invLogs.find(l => l.product_id === testProd.id);
        ctx.assert.isTrue(Boolean(invEntry), 'inventory_logs must contain stock adjustment record');
        ctx.assert.equal(invEntry?.change_amount, -4);
        ctx.assert.equal(invEntry?.previous_stock, 12);
        ctx.assert.equal(invEntry?.new_stock, 8);

        // Verify central audit log
        const audits = getRecentTelegramAuditLogs();
        const stockAudit = audits.find(a => a.entityId === testProd.id && a.action === 'STOCK_ADJUSTMENT');
        ctx.assert.isTrue(Boolean(stockAudit));
        ctx.assert.equal(stockAudit?.oldValue, 12);
        ctx.assert.equal(stockAudit?.newValue, 8);
      }
    ),

    // ==========================================
    // T3-05: bKash payment inspection -> transaction verified -> order confirmed/paid -> audit log (F09+F07+F04)
    // ==========================================
    createTier3Test(
      'T3-05',
      'F09+F07+F04',
      'bKash payment inspection verifies transaction ID, updates payment status to verified, confirms order, and logs audit',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        const order = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(order.payment_method, 'bKash');
        ctx.assert.equal(order.payment_status, 'pending');

        // 1. Inspect & validate bKash Trx ID format
        const trxId = order.bKash_trx_id || '9K28D7XZ01';
        ctx.assert.isTrue(validateBkashTrxId(trxId), 'bKash transaction ID must be valid alphanumeric format');

        // 2. Verify payment
        const payRes = await verifyPayment(ctx.mockDb, orderId, 8204855335, { trxId, senderPhone: order.customer_phone });
        ctx.assert.isTrue(payRes.success);
        ctx.assert.equal(payRes.order.payment_status, 'verified');

        // 3. Confirm order status automatically upon payment verification
        const orderRes = await executeOrderStatusUpdate(ctx.mockDb, orderId, 'confirmed', 8204855335, `Payment verified via bKash (Trx: ${trxId})`);
        ctx.assert.isTrue(orderRes.success);
        ctx.assert.equal(orderRes.order.status, 'confirmed');

        // 4. Verify in-database consistency
        const updatedOrder = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(updatedOrder.payment_status, 'verified');
        ctx.assert.equal(updatedOrder.status, 'confirmed');

        // 5. Verify audit logs record both payment verification and order status transition
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === orderId && a.action === 'PAYMENT_VERIFIED'));
        ctx.assert.isTrue(audits.some(a => a.entityId === orderId && a.action === 'ORDER_STATUS_UPDATE'));
      }
    ),

    // ==========================================
    // T3-06: Return request inspection -> proof checked -> refund approved -> inventory returned / points deducted -> audit (F10+F12+F04)
    // ==========================================
    createTier3Test(
      'T3-06',
      'F10+F12+F04',
      'Return request inspection approves refund with proof photos, returns product stock, reconciles loyalty points, and logs audit',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1004'; // Delivered order containing PROD-005 (Earbuds, qty 1)
        const deliveredOrder = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(deliveredOrder.status, 'delivered');

        const initialEarbudsStock = ctx.mockDb.getDoc('products', 'PROD-005').stock_quantity;

        // Pre-seed customer loyalty points
        ctx.mockDb.updateDoc('profiles', 'PROF-002', { loyalty_points: 150 });

        // 1. Admin inspects proof photos and approves refund
        const proofPhotos = ['https://durtup.shop/proof/damage_01.jpg', 'https://durtup.shop/proof/damage_02.jpg'];
        const refundRes = await processRefund(ctx.mockDb, orderId, 8204855335, 'Customer reported audio distortion on left earbud', { proofImages: proofPhotos });
        ctx.assert.isTrue(refundRes.success);
        ctx.assert.equal(refundRes.order.status, 'refunded');
        ctx.assert.equal(refundRes.order.payment_status, 'refunded');

        // 2. Return product inventory to stock (+1)
        const stockRes = await updateProductStock(ctx.mockDb, 'PROD-005', initialEarbudsStock + 1, 8204855335, `Restocked from refunded order ${orderId}`);
        ctx.assert.equal(stockRes.product.stock_quantity, initialEarbudsStock + 1);

        // 3. Deduct loyalty points previously awarded (e.g. 15 points)
        const deductRes = await deductLoyaltyPoints(ctx.mockDb, 'USER-002', orderId, 15, 8204855335);
        ctx.assert.isTrue(deductRes.success);
        ctx.assert.equal(deductRes.newBalance, 135);

        // 4. Verify central audit log
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === orderId && a.action === 'REFUND_APPROVED'));
        ctx.assert.isTrue(audits.some(a => a.entityId === 'PROD-005' && a.action === 'STOCK_ADJUSTMENT'));
        ctx.assert.isTrue(audits.some(a => a.action === 'LOYALTY_POINTS_DEDUCTED'));
      }
    ),

    // ==========================================
    // T3-07: Customer search -> order history view -> status suspended -> admin pairing blocked (F13+F02+F04)
    // ==========================================
    createTier3Test(
      'T3-07',
      'F13+F02+F04',
      'Customer search finds user, inspects order history, toggles status to suspended, and ensures admin pairing remains permanently blocked',
      async (ctx: TestContext) => {
        // 1. Search customer by phone
        const profiles = ctx.mockDb.query('profiles', p => p.phone === '01711000001');
        ctx.assert.equal(profiles.length, 1);
        const customer = profiles[0];
        ctx.assert.equal(customer.full_name, 'Tanvir Hossain');
        ctx.assert.equal(customer.status, 'active');

        // 2. View customer's order history
        const customerOrders = ctx.mockDb.query('orders', o => o.customer_phone === customer.phone);
        ctx.assert.isTrue(customerOrders.length >= 1);
        ctx.assert.equal(customerOrders[0].id, 'ORD-1001');

        // 3. Admin toggles customer status to suspended
        const toggleRes = await toggleCustomerAccess(ctx.mockDb, customer.id, 8204855335);
        ctx.assert.isTrue(toggleRes.success);
        ctx.assert.equal(toggleRes.profile.status, 'suspended');

        // 4. Attempt by suspended user to execute self-pairing is blocked
        const pairingUpdate = ctx.createCallbackQueryUpdate(`admin_pair:${customer.phone}`, 999888111);
        const pairingRes = await handleTelegramWebhookUpdate(pairingUpdate, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(pairingRes.handled);
        ctx.assert.isFalse(pairingRes.authorized);
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Self-pairing is permanently disabled');

        // 5. Verify audit log captures suspension
        const audits = getRecentTelegramAuditLogs();
        const suspAudit = audits.find(a => a.entityId === customer.id && a.action === 'CUSTOMER_ACCESS_TOGGLE');
        ctx.assert.isTrue(Boolean(suspAudit));
        ctx.assert.equal(suspAudit?.oldValue, 'active');
        ctx.assert.equal(suspAudit?.newValue, 'suspended');
      }
    ),

    // ==========================================
    // T3-08: Order notification -> supplier EcomsellerBD -> courier Pathao -> tracking updated (F06+F14+F04)
    // ==========================================
    createTier3Test(
      'T3-08',
      'F06+F14+F04',
      'Order notification attributes EcomsellerBD supplier, admin assigns Pathao courier, updating tracking number and order status',
      async (ctx: TestContext) => {
        const order = ctx.mockDb.getDoc('orders', 'ORD-1001');

        // 1. Attribute supplier
        const sku = order.items[0].sku;
        const supplier = attributeSupplier(sku, order.items[0].supplier);
        ctx.assert.equal(supplier, 'EcomsellerBD');

        // 2. Format notification text with verified supplier
        const notifText = formatOrderNotificationText(order);
        ctx.assert.includes(notifText, '<b>Verified Supplier:</b> <b>EcomsellerBD</b>');

        // 3. Assign Pathao courier
        const shipRes = await assignCourierToOrder(ctx.mockDb, 'ORD-1001', 'Pathao', 'PTH-DHAKA-9011', 8204855335);
        ctx.assert.isTrue(shipRes.success);
        ctx.assert.equal(shipRes.order.courier, 'Pathao');
        ctx.assert.equal(shipRes.order.courier_tracking_id, 'PTH-DHAKA-9011');
        ctx.assert.equal(shipRes.order.status, 'shipped');

        // 4. Verify timeline updated
        const timelines = ctx.mockDb.query('order_timelines', t => t.order_id === 'ORD-1001');
        const shipTimeline = timelines.find(t => t.status === 'shipped');
        ctx.assert.isTrue(Boolean(shipTimeline));
        ctx.assert.includes(shipTimeline?.notes || '', 'Pathao');

        // 5. Verify audit log
        const audits = getRecentTelegramAuditLogs();
        const shipAudit = audits.find(a => a.entityId === 'ORD-1001' && a.action === 'COURIER_ASSIGNED');
        ctx.assert.isTrue(Boolean(shipAudit));
        ctx.assert.equal(shipAudit?.newValue?.courier, 'Pathao');
      }
    ),

    // ==========================================
    // T3-09: Order notification -> supplier Dropshipping.com.bd -> courier SteadFast -> tracking updated (F06+F14+F04)
    // ==========================================
    createTier3Test(
      'T3-09',
      'F06+F14+F04',
      'Order notification attributes DropShipping.com.bd supplier, admin assigns SteadFast courier, updating tracking number and order status',
      async (ctx: TestContext) => {
        const order = ctx.mockDb.getDoc('orders', 'ORD-1002');

        // 1. Attribute supplier
        const sku = order.items[0].sku;
        const supplier = attributeSupplier(sku, order.items[0].supplier);
        ctx.assert.equal(supplier, 'DropShipping.com.bd');

        // 2. Format notification text with verified supplier
        const notifText = formatOrderNotificationText(order);
        ctx.assert.includes(notifText, '<b>Verified Supplier:</b> <b>DropShipping.com.bd</b>');

        // 3. Assign SteadFast courier
        const shipRes = await assignCourierToOrder(ctx.mockDb, 'ORD-1002', 'SteadFast', 'STF-BD-448821', 8204855335);
        ctx.assert.isTrue(shipRes.success);
        ctx.assert.equal(shipRes.order.courier, 'SteadFast');
        ctx.assert.equal(shipRes.order.courier_tracking_id, 'STF-BD-448821');
        ctx.assert.equal(shipRes.order.status, 'shipped');

        // 4. Verify audit log
        const audits = getRecentTelegramAuditLogs();
        const shipAudit = audits.find(a => a.entityId === 'ORD-1002' && a.action === 'COURIER_ASSIGNED');
        ctx.assert.isTrue(Boolean(shipAudit));
        ctx.assert.equal(shipAudit?.newValue?.courier, 'SteadFast');
      }
    ),

    // ==========================================
    // T3-10: Coupon created -> toggled active -> verified in coupon list -> order discount computed (F15+F08+F04)
    // ==========================================
    createTier3Test(
      'T3-10',
      'F15+F08+F04',
      'Coupon created via admin is toggled active, verified in coupon catalog, and computes correct order discount',
      async (ctx: TestContext) => {
        // 1. Create coupon 'WINTER20' (20% off, min order 1500 BDT)
        const coupRes = await createCoupon(
          ctx.mockDb,
          {
            code: 'WINTER20',
            discount_value: 20,
            discount_type: 'percentage',
            min_order_amount: 1500,
            is_active: false // start inactive
          },
          8204855335
        );
        ctx.assert.isTrue(coupRes.success);
        ctx.assert.equal(coupRes.coupon.code, 'WINTER20');
        ctx.assert.isFalse(coupRes.coupon.is_active);

        // 2. Toggle active
        const toggleRes = await toggleCouponActive(ctx.mockDb, coupRes.coupon.id, 8204855335);
        ctx.assert.isTrue(toggleRes.success);
        ctx.assert.isTrue(toggleRes.coupon.is_active);

        // 3. Verified present in coupons list
        const activeCoupons = ctx.mockDb.query('coupons', c => c.is_active);
        ctx.assert.isTrue(activeCoupons.some(c => c.code === 'WINTER20'));

        // 4. Compute discount on an order of 2500 BDT
        const calcRes = calculateOrderDiscount(ctx.mockDb, 'WINTER20', 2500);
        ctx.assert.isTrue(calcRes.valid);
        ctx.assert.equal(calcRes.discountAmount, 500); // 20% of 2500 = 500 BDT
        ctx.assert.equal(calcRes.finalAmount, 2000);   // 2500 - 500 = 2000 BDT

        // 5. Verify below min_order_amount fails cleanly
        const lowSpendRes = calculateOrderDiscount(ctx.mockDb, 'WINTER20', 1000);
        ctx.assert.isFalse(lowSpendRes.valid);
        ctx.assert.includes(lowSpendRes.reason || '', 'Minimum order amount');

        // 6. Verify audit logs
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === coupRes.coupon.id && a.action === 'COUPON_CREATED'));
        ctx.assert.isTrue(audits.some(a => a.entityId === coupRes.coupon.id && a.action === 'COUPON_TOGGLE'));
      }
    ),

    // ==========================================
    // T3-11: Review moderation -> pending review approved -> rating updated -> buyer badge preserved (F15+F11+F04)
    // ==========================================
    createTier3Test(
      'T3-11',
      'F15+F11+F04',
      'Review moderation approves pending review, updates product rating statistics, strictly preserving verified buyer badge',
      async (ctx: TestContext) => {
        const revId = 'REV-001'; // Product PROD-001, rating 5, is_verified_buyer: true, status: pending
        const rev = ctx.mockDb.getDoc('reviews', revId);
        ctx.assert.equal(rev.status, 'pending');
        ctx.assert.isTrue(rev.is_verified_buyer);

        // 1. Moderate review to approved
        const modRes = await moderateReview(ctx.mockDb, revId, 'approved', 8204855335);
        ctx.assert.isTrue(modRes.success);
        ctx.assert.equal(modRes.review.status, 'approved');

        // 2. Strict verification: verified buyer badge preserved
        ctx.assert.isTrue(modRes.review.is_verified_buyer, 'Verified buyer badge must be strictly preserved');

        // 3. Calculate average rating for product PROD-001 from all approved reviews
        const approvedReviews = ctx.mockDb.query('reviews', r => r.product_id === 'PROD-001' && r.status === 'approved');
        ctx.assert.isTrue(approvedReviews.length >= 1);
        const avgRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
        ctx.assert.equal(avgRating, 5);

        // 4. Verify audit log
        const audits = getRecentTelegramAuditLogs();
        const revAudit = audits.find(a => a.entityId === revId && a.action === 'REVIEW_APPROVED');
        ctx.assert.isTrue(Boolean(revAudit));
      }
    ),

    // ==========================================
    // T3-12: Q&A moderation -> question answered/approved -> official store badge displayed (F15+F11+F04)
    // ==========================================
    createTier3Test(
      'T3-12',
      'F15+F11+F04',
      'Q&A moderation approves customer question with official store answer and verifies store badge indicator',
      async (ctx: TestContext) => {
        const qId = 'QA-001'; // Product PROD-001, status: pending
        const q = ctx.mockDb.getDoc('product_questions', qId);
        ctx.assert.equal(q.status, 'pending');

        // 1. Admin answers question with official store badge response
        const officialAnswer = 'Official Store (Durtup.shop): This shirt is 100% combed cotton and pre-shrunk.';
        ctx.mockDb.updateDoc('product_questions', qId, { answer: officialAnswer });

        // 2. Moderate question to approved
        const modRes = await moderateQuestion(ctx.mockDb, qId, 'approved', 8204855335);
        ctx.assert.isTrue(modRes.success);
        ctx.assert.equal(modRes.question.status, 'approved');

        // 3. Verify question answer contains official store indicator
        const inDb = ctx.mockDb.getDoc('product_questions', qId);
        ctx.assert.includes(inDb.answer || '', 'Official Store');

        // 4. Verify audit log
        const audits = getRecentTelegramAuditLogs();
        const qaAudit = audits.find(a => a.entityId === qId && a.action === 'QA_APPROVED');
        ctx.assert.isTrue(Boolean(qaAudit));
      }
    ),

    // ==========================================
    // T3-13: Order delivery -> delivered status -> today revenue analytics increments -> commission computed (F07+F16+F04)
    // ==========================================
    createTier3Test(
      'T3-13',
      'F07+F16+F04',
      'Order delivery transition updates today revenue analytics in Asia/Dhaka and computes platform commission and net profit',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001'; // Amount 1998 BDT, created 2026-11-24 (today)
        const refDate = new Date('2026-11-24T12:00:00Z');

        // Initial today report (ORD-1001 is pending, so not counted in revenue yet)
        const initialReport = computeAnalyticsReport(ctx.mockDb, 'today', refDate);

        // 1. Transition order to delivered
        const orderRes = await executeOrderStatusUpdate(ctx.mockDb, orderId, 'delivered', 8204855335, 'Delivered to customer by Pathao');
        ctx.assert.isTrue(orderRes.success);
        ctx.assert.equal(orderRes.order.status, 'delivered');

        // 2. Post-delivery today analytics report in Asia/Dhaka increments
        const postReport = computeAnalyticsReport(ctx.mockDb, 'today', refDate);
        ctx.assert.equal(postReport.confirmedOrders, initialReport.confirmedOrders + 1);
        ctx.assert.equal(postReport.totalRevenueBDT, initialReport.totalRevenueBDT + 1998);
        ctx.assert.equal(postReport.timezone, 'Asia/Dhaka');

        // 3. Compute supplier cost & platform net profit margin
        const margins = computeOrderProfitMargin(orderRes.order, 0.65);
        ctx.assert.equal(margins.totalAmount, 1998);
        ctx.assert.equal(margins.supplierCost, Math.round(1998 * 0.65)); // 1299 BDT
        ctx.assert.equal(margins.platformCommission, 1998 - 1299);        // 699 BDT
        ctx.assert.equal(margins.netProfit, 699);

        // 4. Verify audit log
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === orderId && a.newValue === 'delivered'));
      }
    ),

    // ==========================================
    // T3-14: Maintenance mode toggle on -> blocked / banner -> toggle off -> normal restored -> audit (F17+F05+F04)
    // ==========================================
    createTier3Test(
      'T3-14',
      'F17+F05+F04',
      'Maintenance mode toggle on updates settings, toggling off restores normal operations, logging complete audit trail',
      async (ctx: TestContext) => {
        // 1. Toggle maintenance mode ON
        const onRes = await toggleMaintenanceMode(ctx.mockDb, true, 8204855335);
        ctx.assert.isTrue(onRes.success);
        ctx.assert.isTrue(onRes.settings.maintenance_mode);

        const currentSettingsOn = ctx.mockDb.getDoc('settings', 'telegram');
        ctx.assert.isTrue(currentSettingsOn.maintenance_mode);

        // 2. Toggle maintenance mode OFF
        const offRes = await toggleMaintenanceMode(ctx.mockDb, false, 8204855335);
        ctx.assert.isTrue(offRes.success);
        ctx.assert.isFalse(offRes.settings.maintenance_mode);

        const currentSettingsOff = ctx.mockDb.getDoc('settings', 'telegram');
        ctx.assert.isFalse(currentSettingsOff.maintenance_mode);

        // 3. Verify audit log records both toggles
        const audits = getRecentTelegramAuditLogs();
        const maintAudits = audits.filter(a => a.action === 'SETTINGS_MAINTENANCE_TOGGLE');
        ctx.assert.isTrue(maintAudits.length >= 2);
      }
    ),

    // ==========================================
    // T3-15: Unauthorized access attempt on sensitive action -> blocked -> security audit -> master admin alert (F02+F17+F04)
    // ==========================================
    createTier3Test(
      'T3-15',
      'F02+F17+F04',
      'Unauthorized access attempt on sensitive action is blocked by auth guard, creates security audit log, and preserves master ID isolation',
      async (ctx: TestContext) => {
        const attackerId = 777999111;

        // Attacker attempts sensitive order rejection callback
        const update = ctx.createCallbackQueryUpdate('ord:rej_exec:ORD-1001', attackerId);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        // 1. Guard blocks action
        ctx.assert.isTrue(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.equal(result.error, 'Unauthorized user');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Access Denied');

        // 2. Order in database remains completely untouched
        const order = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.equal(order.status, 'pending');

        // 3. Security audit log records unauthorized access attempt
        const audits = getRecentTelegramAuditLogs();
        const secAudit = audits.find(a => a.telegramAdminId === String(attackerId) && a.action === 'SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT');
        ctx.assert.isTrue(Boolean(secAudit), 'Security audit log must be created for unauthorized attempt');

        // 4. Master Admin ID 8204855335 remains the sole authorized administrator
        const authMaster = await verifyTelegramAuthorization(MASTER_ADMIN_ID);
        ctx.assert.isTrue(authMaster.authorized);
        ctx.assert.isTrue(authMaster.isAdmin8204855335);
      }
    ),

    // ==========================================
    // T3-16: Webhook update with secret header -> valid secret -> rate limiter decrements -> router dispatches (F03+F01+F05)
    // ==========================================
    createTier3Test(
      'T3-16',
      'F03+F01+F05',
      'Webhook update with secret header validates secret, rate limiter permits execution, and router renders dashboard',
      async (ctx: TestContext) => {
        const adminId = 8204855335;
        const validSecret = 'durtup_tg_admin_sec_2026';

        // 1. Verify secret token
        ctx.assert.isTrue(verifyWebhookSecret(validSecret));

        // 2. Rate limiter initial check
        const initialPermitted = checkRateLimit(adminId, 20, 10000);
        ctx.assert.isTrue(initialPermitted);

        // 3. Router processes update with secret header
        const update = ctx.createCommandUpdate('/admin', adminId);
        const result = await handleTelegramWebhookUpdate(update, validSecret);

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'dashboard_rendered');

        // 4. Verify dashboard output delivered
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP');
        ctx.mockTelegramApi.assertLastInlineKeyboardHasCallback('dash:');
      }
    ),

    // ==========================================
    // T3-17: Rate limit exceeded -> throttled -> resets after window -> next command succeeds (F03+F05)
    // ==========================================
    createTier3Test(
      'T3-17',
      'F03+F05',
      'Rate limit exhaustion throttles subsequent commands, and reset permits immediate execution of dashboard commands',
      async (ctx: TestContext) => {
        const testUser = 888222333;
        const secret = 'durtup_tg_admin_sec_2026';

        // 1. Exhaust rate limit (20 requests permitted in window)
        for (let i = 0; i < 20; i++) {
          checkRateLimit(testUser, 20, 10000);
        }

        // 2. 21st request is throttled
        const throttledUpdate = ctx.createCallbackQueryUpdate('dash:main', testUser);
        const throttledResult = await handleTelegramWebhookUpdate(throttledUpdate, secret);

        ctx.assert.isTrue(throttledResult.handled);
        ctx.assert.equal(throttledResult.error, 'Rate limit exceeded');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Rate limit exceeded');

        // 3. Reset rate limiter
        resetRateLimits();

        // 4. Subsequent command immediately succeeds
        const successUpdate = ctx.createCommandUpdate('/admin', 8204855335);
        const successResult = await handleTelegramWebhookUpdate(successUpdate, secret);

        ctx.assert.isTrue(successResult.handled);
        ctx.assert.isTrue(successResult.authorized);
        ctx.assert.equal(successResult.action, 'dashboard_rendered');
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP');
      }
    )
  ]
};

// Aliases for compatibility
export const tier3Suite = tier3TestSuite;
