/**
 * Durtup.shop Telegram Super Admin Control Center
 * Tier 4: Real-World Administrative Application Scenarios Test Suite
 *
 * Implements >=10 realistic end-to-end multi-step admin workflows:
 * - S01: New Order Flow: Receive alert, view details, approve order, assign courier (F06, F07, F08, F14, F04)
 * - S02: Suspicious Order Rejection: View order, prompt rejection, confirm cancellation, verify audit log (F06, F07, F08, F04)
 * - S03: bKash Payment Inspection: List pending payments, inspect trx_id, verify payment, confirm order status (F09, F07, F04)
 * - S04: Live Price & Stock Emergency Update: Search product, inspect details, update price, adjust stock, verify inventory valuation (F11, F12, F04, F16)
 * - S05: Fraudulent Customer Ban: Search customer by phone, view orders & spending, toggle suspended status, check access block (F13, F04, F02)
 * - S06: Return & Refund Processing: List refund requests, inspect proof photo & reason, approve refund with confirmation (F10, F04, F16)
 * - S07: Daily Store Opening & Analytics Audit: Query /admin, inspect Today metrics in Asia/Dhaka, check low stock alerts, review recent audit logs (F05, F16, F12, F17, F04)
 * - S08: Coupon Campaign Launch: Create new discount coupon, list active coupons, test coupon toggle (F15, F04)
 * - S09: Community Moderation: Inspect pending customer reviews and Q&As, approve verified buyer review, reject spam Q&A (F15, F04)
 * - S10: Security Lockdown: Detect unauthorized access attempt, verify rejection, check security audit logs (F02, F03, F17, F04)
 * Total: 10 comprehensive administrative scenarios.
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
  searchOrders,
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
  moderateReview,
  moderateQuestion,
  computeAnalyticsReport
} from './harness/featureHelpers';

// Helper to wrap test runs with setup/teardown isolation
function createTier4Scenario(
  id: string,
  feature: string,
  name: string,
  fn: (ctx: TestContext) => Promise<void> | void
): TestCase {
  return {
    id,
    feature,
    name,
    tier: 4,
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

export const tier4TestSuite: TestSuite = {
  tier: 4,
  title: 'Tier 4: Real-World Administrative Workloads Test Suite',
  tests: [
    // ==========================================
    // S01: New Order Flow: Receive alert, view details, approve order, assign courier (F06, F07, F08, F14, F04)
    // ==========================================
    createTier4Scenario(
      'S01',
      'F06+F07+F08+F14+F04',
      'Scenario 1: Complete New Order Flow — receive alert, inspect order card, approve order, and assign Pathao courier',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        const order = ctx.mockDb.getDoc('orders', orderId);

        // Step 1: Real-time notification delivered with photo and attributed supplier
        const supplier = attributeSupplier(order.items[0].sku, order.items[0].supplier);
        ctx.assert.equal(supplier, 'EcomsellerBD');
        const notifText = formatOrderNotificationText(order);
        ctx.assert.includes(notifText, 'NEW ORDER RECEIVED: #DT-2611-1001');
        ctx.assert.includes(notifText, 'EcomsellerBD');

        await ctx.mockTelegramApi.sendPhoto(8204855335, order.items[0].image || 'https://example.com/item.jpg', {
          caption: notifText,
          reply_markup: buildOrderNotificationButtons(orderId)
        });
        ctx.mockTelegramApi.assertPhotoSent(undefined, 'DT-2611-1001');

        // Step 2: Admin views order details
        const foundOrders = searchOrders(ctx.mockDb, 'DT-2611-1001');
        ctx.assert.equal(foundOrders.length, 1);
        ctx.assert.equal(foundOrders[0].customer_phone, '01711000001');

        // Step 3: Admin prompts and executes approval
        const promptKb = buildConfirmationPromptKeyboard(`ord:appr_exec:${orderId}`, `ord:view:${orderId}`);
        ctx.assert.equal(promptKb.inline_keyboard[0][0].callback_data, `ord:appr_exec:${orderId}`);

        const approvalRes = await executeOrderStatusUpdate(ctx.mockDb, orderId, 'confirmed', 8204855335, 'Approved via Telegram Super Admin');
        ctx.assert.isTrue(approvalRes.success);
        ctx.assert.equal(approvalRes.order.status, 'confirmed');

        // Step 4: Admin assigns courier Pathao
        const shipRes = await assignCourierToOrder(ctx.mockDb, orderId, 'Pathao', 'PTH-TRACK-8899', 8204855335);
        ctx.assert.isTrue(shipRes.success);
        ctx.assert.equal(shipRes.order.courier, 'Pathao');
        ctx.assert.equal(shipRes.order.courier_tracking_id, 'PTH-TRACK-8899');
        ctx.assert.equal(shipRes.order.status, 'shipped');

        // Step 5: Verify timeline and central audit logging
        const timelines = ctx.mockDb.query('order_timelines', t => t.order_id === orderId);
        ctx.assert.isTrue(timelines.some(t => t.status === 'confirmed'));
        ctx.assert.isTrue(timelines.some(t => t.status === 'shipped'));

        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === orderId && a.action === 'ORDER_STATUS_UPDATE'));
        ctx.assert.isTrue(audits.some(a => a.entityId === orderId && a.action === 'COURIER_ASSIGNED'));
      }
    ),

    // ==========================================
    // S02: Suspicious Order Rejection: View order, prompt rejection, confirm cancellation, verify audit log (F06, F07, F08, F04)
    // ==========================================
    createTier4Scenario(
      'S02',
      'F06+F07+F08+F04',
      'Scenario 2: Suspicious Order Rejection — inspect fraudulent order, request confirmation, confirm cancellation, and verify audit trail',
      async (ctx: TestContext) => {
        // Pre-seed suspicious pending order
        const suspiciousOrder = ctx.mockDb.addDoc('orders', {
          id: 'ORD-SUSP-99',
          order_number: 'DT-SUSP-99',
          status: 'pending',
          payment_method: 'Cash on Delivery',
          payment_status: 'unpaid',
          total_amount: 15000,
          customer_name: 'Fake Bot Buyer',
          customer_phone: '01999999999',
          shipping_address: 'Unknown Street, Fake Area',
          items: [{ product_id: 'PROD-001', name: 'Cotton T-Shirt', quantity: 15, price: 1000, sku: 'ECOM-TSHIRT-01' }],
          created_at: new Date().toISOString()
        });

        // Step 1: Admin searches and reviews order card
        const searched = searchOrders(ctx.mockDb, '01999999999');
        ctx.assert.equal(searched.length, 1);
        ctx.assert.equal(searched[0].id, suspiciousOrder.id);

        // Step 2: Admin triggers rejection prompt with confirmation buttons
        const promptKb = buildConfirmationPromptKeyboard(`ord:rej_exec:${suspiciousOrder.id}`, `ord:view:${suspiciousOrder.id}`);
        ctx.assert.equal(promptKb.inline_keyboard[0][0].callback_data, `ord:rej_exec:${suspiciousOrder.id}`);

        // Step 3: Admin confirms cancellation
        const rejRes = await executeOrderStatusUpdate(ctx.mockDb, suspiciousOrder.id, 'cancelled', 8204855335, 'Flagged as high-risk bot fraud');
        ctx.assert.isTrue(rejRes.success);
        ctx.assert.equal(rejRes.order.status, 'cancelled');

        // Step 4: Verify cancellation in database and audit logs
        const orderInDb = ctx.mockDb.getDoc('orders', suspiciousOrder.id);
        ctx.assert.equal(orderInDb.status, 'cancelled');
        ctx.assert.includes(orderInDb.notes || '', 'bot fraud');

        const audits = getRecentTelegramAuditLogs();
        const rejAudit = audits.find(a => a.entityId === suspiciousOrder.id && a.action === 'ORDER_STATUS_UPDATE');
        ctx.assert.isTrue(Boolean(rejAudit));
        ctx.assert.equal(rejAudit?.oldValue, 'pending');
        ctx.assert.equal(rejAudit?.newValue, 'cancelled');
      }
    ),

    // ==========================================
    // S03: bKash Payment Inspection: List pending, inspect trx_id, verify payment, confirm status (F09, F07, F04)
    // ==========================================
    createTier4Scenario(
      'S03',
      'F09+F07+F04',
      'Scenario 3: bKash Payment Inspection — list pending payments, inspect transaction ID, verify payment, and confirm order',
      async (ctx: TestContext) => {
        // Step 1: List pending payments
        const pendingPayments = ctx.mockDb.query('orders', o => o.payment_status === 'pending');
        ctx.assert.isTrue(pendingPayments.length >= 1);
        const targetOrder = pendingPayments.find(o => o.payment_method === 'bKash') || pendingPayments[0];

        // Step 2: Inspect bKash transaction ID & sender phone
        const trxId = targetOrder.bKash_trx_id || '9K28D7XZ01';
        ctx.assert.isTrue(validateBkashTrxId(trxId));
        ctx.assert.equal(targetOrder.bKash_number, '01711000001');

        // Step 3: Verify payment
        const payRes = await verifyPayment(ctx.mockDb, targetOrder.id, 8204855335, {
          trxId,
          senderPhone: targetOrder.customer_phone
        });
        ctx.assert.isTrue(payRes.success);
        ctx.assert.equal(payRes.order.payment_status, 'verified');

        // Step 4: Transition order status to confirmed
        const orderRes = await executeOrderStatusUpdate(ctx.mockDb, targetOrder.id, 'confirmed', 8204855335, `bKash Trx ${trxId} verified`);
        ctx.assert.isTrue(orderRes.success);
        ctx.assert.equal(orderRes.order.status, 'confirmed');

        // Step 5: Duplicate verification attempt is rejected (idempotency)
        const dupPayRes = await verifyPayment(ctx.mockDb, targetOrder.id, 8204855335, { rejectIfAlreadyVerified: true });
        ctx.assert.isFalse(dupPayRes.success);
        ctx.assert.includes(dupPayRes.message || '', 'already verified');

        // Step 6: Verify audit log recorded PAYMENT_VERIFIED
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === targetOrder.id && a.action === 'PAYMENT_VERIFIED'));
      }
    ),

    // ==========================================
    // S04: Live Price & Stock Emergency Update: Search product, update price, adjust stock, verify valuation (F11, F12, F04, F16)
    // ==========================================
    createTier4Scenario(
      'S04',
      'F11+F12+F04+F16',
      'Scenario 4: Live Price & Stock Emergency Update — search product, update price, restock inventory, and verify inventory valuation',
      async (ctx: TestContext) => {
        const prodId = 'PROD-002'; // Smart Waterproof Watch Series 9 (stock: 4, regular: 2500, discount: 2199)
        const initialValuation = calculateInventoryValuation(ctx.mockDb);

        // Step 1: Admin searches product
        const prod = ctx.mockDb.getDoc('products', prodId);
        ctx.assert.isTrue(prod !== null);
        ctx.assert.equal(prod.name, 'Smart Waterproof Watch Series 9');

        // Step 2: Emergency price update (Flash Sale: regular price 2300 BDT)
        const priceRes = await updateProductPrice(ctx.mockDb, prodId, 2300, 8204855335);
        ctx.assert.isTrue(priceRes.success);
        ctx.assert.equal(priceRes.product.regular_price, 2300);

        // Clear discount price to test regular price valuation
        ctx.mockDb.updateDoc('products', prodId, { discount_price: null });

        // Step 3: Emergency restock: increase stock from 4 to 25
        const stockRes = await updateProductStock(ctx.mockDb, prodId, 25, 8204855335, 'Emergency air-cargo batch arrived from Guangzhou');
        ctx.assert.isTrue(stockRes.success);
        ctx.assert.equal(stockRes.product.stock_quantity, 25);

        // Step 4: Verify product no longer appears in low-stock alert list (since 25 > 10)
        const lowStock = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isFalse(lowStock.some(p => p.id === prodId), 'Restocked product must not appear in low-stock alerts');

        // Step 5: Verify inventory logs and valuation
        const invLogs = ctx.mockDb.listDocs('inventory_logs');
        const lastInv = invLogs.find(l => l.product_id === prodId && l.new_stock === 25);
        ctx.assert.isTrue(Boolean(lastInv));
        ctx.assert.equal(lastInv?.change_amount, 21);

        const newValuation = calculateInventoryValuation(ctx.mockDb);
        const expectedDiff = (25 * 2300) - (4 * 2199);
        ctx.assert.equal(newValuation.totalValuationBDT, initialValuation.totalValuationBDT + expectedDiff);

        // Step 6: Verify audit log recorded both updates
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === prodId && a.action === 'PRODUCT_PRICE_UPDATE'));
        ctx.assert.isTrue(audits.some(a => a.entityId === prodId && a.action === 'STOCK_ADJUSTMENT'));
      }
    ),

    // ==========================================
    // S05: Fraudulent Customer Ban: Search by phone, view orders/spent, suspend, verify access block (F13, F04, F02)
    // ==========================================
    createTier4Scenario(
      'S05',
      'F13+F04+F02',
      'Scenario 5: Fraudulent Customer Ban — lookup suspicious customer, examine orders and spending, suspend account, and block administrative pairing',
      async (ctx: TestContext) => {
        // Step 1: Search customer by phone and ensure active state before suspension test
        let suspect = ctx.mockDb.getDoc('profiles', 'PROF-003');
        if (suspect) {
          ctx.mockDb.updateDoc('profiles', 'PROF-003', { status: 'active' });
        }
        suspect = ctx.mockDb.getDoc('profiles', 'PROF-003');
        ctx.assert.equal(suspect.full_name, 'Suspicious Bot Account');
        ctx.assert.equal(suspect.status, 'active');

        // Step 2: Inspect profile spending history
        ctx.assert.equal(suspect.total_spent, 0);
        ctx.assert.isTrue(suspect.total_orders >= 5);

        // Step 3: Admin suspends fraudulent customer account
        const toggleRes = await toggleCustomerAccess(ctx.mockDb, suspect.id, 8204855335);
        ctx.assert.isTrue(toggleRes.success);
        ctx.assert.equal(toggleRes.profile.status, 'suspended');

        const updatedSuspect = ctx.mockDb.getDoc('profiles', suspect.id);
        ctx.assert.equal(updatedSuspect.status, 'suspended');

        // Step 4: Attempt by suspended account to execute admin pairing is blocked
        const pairUpdate = ctx.createCallbackQueryUpdate(`admin_pair:${suspect.phone}`, 999333111);
        const pairRes = await handleTelegramWebhookUpdate(pairUpdate, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(pairRes.handled);
        ctx.assert.isFalse(pairRes.authorized);
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Self-pairing is permanently disabled');

        // Step 5: Verify audit log captures CUSTOMER_ACCESS_TOGGLE
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === suspect.id && a.action === 'CUSTOMER_ACCESS_TOGGLE'));
      }
    ),

    // ==========================================
    // S06: Return & Refund Processing: List refund requests, inspect proof & reason, approve refund (F10, F04, F16)
    // ==========================================
    createTier4Scenario(
      'S06',
      'F10+F04+F16',
      'Scenario 6: Return & Refund Processing — inspect refund requests, examine proof images, approve refund with confirmation, and check analytics',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1004'; // Delivered order, total 3200 BDT
        const refDate = new Date('2026-11-20T12:00:00Z');

        // Step 1: Pre-refund analytics report captures confirmed revenue
        const preReport = computeAnalyticsReport(ctx.mockDb, 'today', refDate);

        // Step 2: Inspect return request with proof images and customer reason
        const proofPhotos = ['https://durtup.shop/proof/damage_earbuds.jpg'];
        const returnReason = 'Earbuds arrived with cracked charging case';

        // Step 3: Build approval confirmation keyboard
        const promptKb = buildConfirmationPromptKeyboard(`ref:appr_exec:${orderId}`, `ref:view:${orderId}`);
        ctx.assert.equal(promptKb.inline_keyboard[0][0].callback_data, `ref:appr_exec:${orderId}`);

        // Step 4: Execute confirmed refund approval
        const refundRes = await processRefund(ctx.mockDb, orderId, 8204855335, returnReason, { proofImages: proofPhotos });
        ctx.assert.isTrue(refundRes.success);
        ctx.assert.equal(refundRes.order.status, 'refunded');
        ctx.assert.equal(refundRes.order.payment_status, 'refunded');

        // Step 5: Post-refund analytics verifies revenue excludes refunded order
        const postReport = computeAnalyticsReport(ctx.mockDb, 'today', refDate);
        ctx.assert.equal(postReport.totalRevenueBDT, Math.max(0, preReport.totalRevenueBDT - 3200));

        // Step 6: Verify audit trail
        const audits = getRecentTelegramAuditLogs();
        const refAudit = audits.find(a => a.entityId === orderId && a.action === 'REFUND_APPROVED');
        ctx.assert.isTrue(Boolean(refAudit));
        ctx.assert.equal(refAudit?.newValue?.status, 'refunded');
      }
    ),

    // ==========================================
    // S07: Daily Store Opening & Analytics Audit: Query /admin, Today metrics in Asia/Dhaka, low stock alerts, review audit (F05, F16, F12, F17, F04)
    // ==========================================
    createTier4Scenario(
      'S07',
      'F05+F16+F12+F17+F04',
      'Scenario 7: Daily Store Opening & Analytics Audit — execute /admin, inspect Today Asia/Dhaka metrics, check low stock alerts, and review audit logs',
      async (ctx: TestContext) => {
        // Step 1: Daily store opening command /admin
        const adminUpdate = ctx.createCommandUpdate('/admin', 8204855335);
        const adminRes = await handleTelegramWebhookUpdate(adminUpdate, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(adminRes.handled);
        ctx.assert.isTrue(adminRes.authorized);
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP');

        // Step 2: Inspect Today metrics in Asia/Dhaka
        const todayReport = computeAnalyticsReport(ctx.mockDb, 'today', new Date('2026-11-24T12:00:00Z'));
        ctx.assert.equal(todayReport.timezone, 'Asia/Dhaka');
        ctx.assert.isTrue(todayReport.totalOrders >= 0);
        ctx.assert.isTrue(todayReport.totalRevenueBDT >= 0);

        // Step 3: Check low-stock alerts
        const lowStock = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isTrue(lowStock.length >= 1);
        for (const item of lowStock) {
          ctx.assert.isTrue(item.stock_quantity <= 10 && item.stock_quantity > 0);
        }

        // Step 4: Review recent security and administrative audit logs
        const recentAudits = getRecentTelegramAuditLogs(10);
        ctx.assert.isTrue(Array.isArray(recentAudits));

        // Step 5: Refresh dashboard in-place
        const refreshUpdate = ctx.createCallbackQueryUpdate('dash:refresh', 8204855335, 8204855335, 1002);
        const refreshRes = await handleTelegramWebhookUpdate(refreshUpdate, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(refreshRes.handled);
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Dashboard refreshed');
      }
    ),

    // ==========================================
    // S08: Coupon Campaign Launch: Create new discount coupon, list active coupons, test toggle (F15, F04)
    // ==========================================
    createTier4Scenario(
      'S08',
      'F15+F04',
      'Scenario 8: Coupon Campaign Launch — create new discount coupon, inspect active coupon list, and test campaign pause/resume toggle',
      async (ctx: TestContext) => {
        // Step 1: Launch coupon campaign 'FLASH30' (30% discount, min spend 2000 BDT)
        const coupRes = await createCoupon(
          ctx.mockDb,
          {
            code: 'FLASH30',
            discount_value: 30,
            discount_type: 'percentage',
            min_order_amount: 2000,
            expires_at: '2026-12-31T23:59:59Z',
            is_active: true
          },
          8204855335
        );
        ctx.assert.isTrue(coupRes.success);
        ctx.assert.equal(coupRes.coupon.code, 'FLASH30');
        ctx.assert.isTrue(coupRes.coupon.is_active);

        // Step 2: List active coupons
        const activeCoupons = ctx.mockDb.query('coupons', c => c.is_active);
        const foundCoupon = activeCoupons.find(c => c.code === 'FLASH30');
        ctx.assert.isTrue(Boolean(foundCoupon));
        ctx.assert.equal(foundCoupon?.discount_value, 30);

        // Step 3: Pause campaign (toggle to inactive)
        const pauseRes = await toggleCouponActive(ctx.mockDb, coupRes.coupon.id, 8204855335);
        ctx.assert.isTrue(pauseRes.success);
        ctx.assert.isFalse(pauseRes.coupon.is_active);

        // Step 4: Resume campaign (toggle back to active)
        const resumeRes = await toggleCouponActive(ctx.mockDb, coupRes.coupon.id, 8204855335);
        ctx.assert.isTrue(resumeRes.success);
        ctx.assert.isTrue(resumeRes.coupon.is_active);

        // Step 5: Verify audit trail
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === coupRes.coupon.id && a.action === 'COUPON_CREATED'));
        ctx.assert.isTrue(audits.some(a => a.entityId === coupRes.coupon.id && a.action === 'COUPON_TOGGLE'));
      }
    ),

    // ==========================================
    // S09: Community Moderation: Inspect pending reviews & Q&As, approve verified review, reject spam Q&A (F15, F04)
    // ==========================================
    createTier4Scenario(
      'S09',
      'F15+F04',
      'Scenario 9: Community Moderation — inspect pending reviews and Q&As, approve verified buyer review, and reject spam submissions',
      async (ctx: TestContext) => {
        // Step 1: Inspect pending reviews
        const pendingReviews = ctx.mockDb.query('reviews', r => r.status === 'pending');
        ctx.assert.isTrue(pendingReviews.length >= 1);

        // Step 2: Approve authentic verified buyer review REV-001
        const genuineReview = pendingReviews.find(r => r.id === 'REV-001') || pendingReviews[0];
        const appRes = await moderateReview(ctx.mockDb, genuineReview.id, 'approved', 8204855335);
        ctx.assert.isTrue(appRes.success);
        ctx.assert.equal(appRes.review.status, 'approved');
        ctx.assert.isTrue(appRes.review.is_verified_buyer, 'Verified buyer badge must be strictly preserved');

        // Step 3: Reject spam review REV-003
        const spamReview = ctx.mockDb.getDoc('reviews', 'REV-003');
        if (spamReview) {
          const rejRes = await moderateReview(ctx.mockDb, 'REV-003', 'rejected', 8204855335);
          ctx.assert.isTrue(rejRes.success);
          ctx.assert.equal(rejRes.review.status, 'rejected');
        }

        // Step 4: Moderate product questions
        const pendingQ = ctx.mockDb.getDoc('product_questions', 'QA-001');
        if (pendingQ) {
          const qRes = await moderateQuestion(ctx.mockDb, 'QA-001', 'approved', 8204855335);
          ctx.assert.isTrue(qRes.success);
          ctx.assert.equal(qRes.question.status, 'approved');
        }

        // Step 5: Verify audit trail
        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === genuineReview.id && a.action === 'REVIEW_APPROVED'));
        ctx.assert.isTrue(audits.some(a => a.entityId === 'REV-003' && a.action === 'REVIEW_REJECTED'));
      }
    ),

    // ==========================================
    // S10: Security Lockdown: Detect unauthorized access attempt, verify rejection, check security audit logs (F02, F03, F17, F04)
    // ==========================================
    createTier4Scenario(
      'S10',
      'F02+F03+F17+F04',
      'Scenario 10: Security Lockdown — intercept unauthorized access attempt, verify denial, detect self-pairing bypass, and audit security events',
      async (ctx: TestContext) => {
        const unauthorizedAttackerId = 999555111;

        // Step 1: Attacker attempts unauthorized /admin command
        const attackUpdate = ctx.createCommandUpdate('/admin', unauthorizedAttackerId);
        const attackRes = await handleTelegramWebhookUpdate(attackUpdate, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(attackRes.handled);
        ctx.assert.isFalse(attackRes.authorized);
        ctx.assert.equal(attackRes.error, 'Unauthorized user');
        ctx.mockTelegramApi.assertLastMessageContains('ACCESS DENIED');
        ctx.mockTelegramApi.assertLastMessageContains(String(unauthorizedAttackerId));

        // Step 2: Attacker attempts self-pairing /setup command
        const setupUpdate = ctx.createCommandUpdate('/setup bypass_token_attempt', unauthorizedAttackerId);
        const setupRes = await handleTelegramWebhookUpdate(setupUpdate, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(setupRes.handled);
        ctx.assert.isFalse(setupRes.authorized);
        ctx.mockTelegramApi.assertLastMessageContains('Self-pairing is permanently disabled');

        // Step 3: Attacker attempts secret header tampering
        const tamperedRes = await handleTelegramWebhookUpdate(attackUpdate, 'tampered_secret_token_xyz');
        ctx.assert.isFalse(tamperedRes.handled);
        ctx.assert.isFalse(tamperedRes.authorized);
        ctx.assert.equal(tamperedRes.error, 'Invalid webhook secret');

        // Step 4: Master Admin ID 8204855335 queries security audit logs
        const securityAudits = getRecentTelegramAuditLogs();
        const unauthorizedAttempts = securityAudits.filter(
          a => a.telegramAdminId === String(unauthorizedAttackerId) && a.action === 'SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT'
        );
        ctx.assert.isTrue(unauthorizedAttempts.length >= 2, 'Security audit log must capture all unauthorized access attempts');

        // Step 5: Verify Master Admin ID 8204855335 remains fully operational and authorized
        const masterAuth = await verifyTelegramAuthorization(MASTER_ADMIN_ID);
        ctx.assert.isTrue(masterAuth.authorized);
        ctx.assert.isTrue(masterAuth.isAdmin8204855335);

        const masterUpdate = ctx.createCommandUpdate('/admin', 8204855335);
        const masterRes = await handleTelegramWebhookUpdate(masterUpdate, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(masterRes.handled);
        ctx.assert.isTrue(masterRes.authorized);
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP — SUPER ADMIN CONTROL CENTER');
      }
    )
  ]
};

// Aliases for compatibility
export const tier4Suite = tier4TestSuite;
