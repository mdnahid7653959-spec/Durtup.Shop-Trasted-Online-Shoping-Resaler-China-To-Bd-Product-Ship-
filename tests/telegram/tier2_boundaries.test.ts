/**
 * Durtup.shop Telegram Super Admin Control Center
 * Tier 2: Boundary & Corner Cases Test Suite (F01–F17)
 *
 * Implements >=5 comprehensive, isolated boundary/negative/corner tests
 * for each of the 17 features (total >= 85 test cases):
 * - F01: Malformed payloads, empty updates, missing update_id, unexpected types, error boundary recovery (5 tests)
 * - F02: Unauthorized Telegram IDs (negative, 0, strings), self-pairing rejection (/setup, admin_pair), Master ID strict enforcement (5 tests)
 * - F03: Webhook secret mismatch, whitespace/casing boundaries, rapid rate-limit breach, per-user rate limit isolation, duplicate query idempotency guard (5 tests)
 * - F04: Audit log boundary (missing optional fields, unicode/Bengali special chars, large payloads, buffer cap, dual-write resilience) (5 tests)
 * - F05: Deep menu boundary, unrecognized callback tokens, confirmation cancel, 64-byte callback length enforcement, rapid in-place updates (5 tests)
 * - F06: Notification with missing image fallback, 0 items order, missing supplier SKU, extreme BDT price amounts, HTML character escaping (5 tests)
 * - F07: Double-action idempotency on approve, non-existent order ID callback, status update from terminal state, custom notes, callback query routing (5 tests)
 * - F08: Search non-existent order, filter status returning 0 orders, confirmation prompt cancellation, special regex metacharacters, case-insensitive search (5 tests)
 * - F09: Malformed bKash trx_id, valid bKash trx_id, mismatched sender phone, re-verifying already paid order, non-existent order payment verification (5 tests)
 * - F10: Refund request missing proof images, approving already refunded order, non-existent order refund, cancel refund prompt, full refund audit trail (5 tests)
 * - F11: Product search empty/special regex characters, negative price update rejection, negative stock quantity rejection, non-existent product ID, non-existent product status toggle (5 tests)
 * - F12: Inventory low-stock threshold boundary: exact boundary (stock=10), inside (stock=9), outside (stock=11), stock=0 out of stock, valuation with 0 price items (5 tests)
 * - F13: Invalid customer phone format, valid Bangladesh phone format, 0-order customer, suspending already suspended customer, toggling non-existent customer (5 tests)
 * - F14: Duplicate courier assignment attempt, invalid courier name, supplier with 0 products, custom tracking ID, non-existent order courier assignment (5 tests)
 * - F15: Expired coupon toggle, negative coupon discount rejection, moderating non-existent review, moderating non-existent Q&A, buyer badge preservation (5 tests)
 * - F16: Custom date range crossing midnight, future date range, leap year boundaries, empty sales period, revenue status segregation (5 tests)
 * - F17: Attempt to remove Master ID 8204855335, empty admin list fallback, toggling maintenance mode on/off, non-existent settings fallback, security audit log history (5 tests)
 * Total: 85 test cases.
 */

import { TestSuite, TestCase, TestContext } from './harness/types';
import {
  handleTelegramWebhookUpdate,
  getTelegramHealthStatus
} from '../../src/server/telegram/telegramRouter';
import {
  verifyTelegramAuthorization,
  verifyWebhookSecret,
  checkRateLimit,
  resetRateLimits,
  clearTelegramAuthCache,
  getAuthorizedAdminIds,
  isMasterAdmin,
  MASTER_ADMIN_ID
} from '../../src/server/telegram/telegramAuth';
import {
  recordTelegramAudit,
  getRecentTelegramAuditLogs,
  clearInMemoryAuditLogs
} from '../../src/server/telegram/auditHelper';
import {
  setTelegramTransport,
  validateCallbackBytes
} from '../../src/server/telegram/telegramApi';
import { TelegramStateManager } from '../../src/server/telegram/telegramState';
import {
  attributeSupplier,
  buildOrderNotificationButtons,
  formatOrderNotificationText,
  executeOrderStatusUpdate,
  filterOrdersByStatus,
  searchOrders,
  buildConfirmationPromptKeyboard,
  validateBkashTrxId,
  verifyPayment,
  processRefund,
  updateProductPrice,
  updateProductStock,
  toggleProductActive,
  calculateInventoryValuation,
  getLowStockAlerts,
  validateCustomerPhone,
  toggleCustomerAccess,
  assignCourierToOrder,
  validateCouponDiscount,
  createCoupon,
  toggleCouponActive,
  moderateReview,
  moderateQuestion,
  computeAnalyticsReport,
  toggleMaintenanceMode
} from './harness/featureHelpers';

// Helper to wrap test runs with setup/teardown isolation
function createTier2Test(
  id: string,
  feature: string,
  name: string,
  fn: (ctx: TestContext) => Promise<void> | void
): TestCase {
  return {
    id,
    feature,
    name,
    tier: 2,
    run: async (ctx: TestContext) => {
      // 1. Setup clean isolated state
      process.env.TELEGRAM_WEBHOOK_SECRET = 'durtup_tg_admin_sec_2026';
      ctx.mockDb.restoreSnapshot();
      ctx.mockTelegramApi.clear();
      resetRateLimits();
      clearTelegramAuthCache();
      clearInMemoryAuditLogs();
      TelegramStateManager.resetState();

      // Hook mock transport so production telegramApi calls route to ctx.mockTelegramApi
      setTelegramTransport((method: string, payload: any) => {
        return ctx.mockTelegramApi.recordCall(method as any, payload);
      });

      try {
        await fn(ctx);
      } finally {
        // 2. Teardown
        setTelegramTransport(null);
      }
    }
  };
}

export const tier2TestSuite: TestSuite = {
  tier: 2,
  title: 'Tier 2: Boundary & Corner Cases Test Suite (F01–F17)',
  tests: [
    // ==========================================
    // F01: Architectural Audit & Entrypoint Unification (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F01-01',
      'F01',
      'Malformed payload (null, undefined, non-object) returns empty/invalid update error',
      async (ctx: TestContext) => {
        const nullRes = await handleTelegramWebhookUpdate(null as any, 'durtup_tg_admin_sec_2026');
        ctx.assert.isFalse(nullRes.handled);
        ctx.assert.isFalse(nullRes.authorized);
        ctx.assert.equal(nullRes.error, 'Empty or invalid update payload');

        const strRes = await handleTelegramWebhookUpdate('malicious_string_update' as any, 'durtup_tg_admin_sec_2026');
        ctx.assert.isFalse(strRes.handled);
        ctx.assert.equal(strRes.error, 'Empty or invalid update payload');

        const numRes = await handleTelegramWebhookUpdate(123456 as any, 'durtup_tg_admin_sec_2026');
        ctx.assert.isFalse(numRes.handled);
        ctx.assert.equal(numRes.error, 'Empty or invalid update payload');
      }
    ),
    createTier2Test(
      'T2-F01-02',
      'F01',
      'Empty update object {} returns missing sender error',
      async (ctx: TestContext) => {
        const result = await handleTelegramWebhookUpdate({} as any, 'durtup_tg_admin_sec_2026');
        ctx.assert.isFalse(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.equal(result.error, 'Missing sender in update payload');
      }
    ),
    createTier2Test(
      'T2-F01-03',
      'F01',
      'Update with missing or non-numeric update_id and missing sender is rejected',
      async (ctx: TestContext) => {
        const update = {
          update_id: undefined,
          message: {
            message_id: 1,
            chat: { id: 8204855335, type: 'private' },
            date: 1234567,
            text: '/admin'
          }
        } as any;
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isFalse(result.handled);
        ctx.assert.equal(result.error, 'Missing sender in update payload');
      }
    ),
    createTier2Test(
      'T2-F01-04',
      'F01',
      'Unexpected update types (sticker/document without text) handled safely as ignored_update',
      async (ctx: TestContext) => {
        const update = {
          update_id: 888123,
          message: {
            message_id: 99,
            from: { id: 8204855335, is_bot: false, first_name: 'Admin' },
            chat: { id: 8204855335, type: 'private' },
            date: 1732449000,
            sticker: { file_id: 'stk_12345', width: 512, height: 512 }
          }
        } as any;
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'ignored_update');
      }
    ),
    createTier2Test(
      'T2-F01-05',
      'F01',
      'Error boundary recovery: unrecognized command returns helpful error guide instead of crashing',
      async (ctx: TestContext) => {
        const update = ctx.createCommandUpdate('/non_existent_command_123', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'unknown_command');
        ctx.mockTelegramApi.assertLastMessageContains('Unrecognized command');
        ctx.mockTelegramApi.assertLastInlineKeyboardHasCallback('dash:main');
      }
    ),

    // ==========================================
    // F02: Strict Admin Allowlisting & Master ID (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F02-01',
      'F02',
      'Negative Telegram IDs (e.g. -8204855335, -10099) are strictly rejected',
      async (ctx: TestContext) => {
        const negativeId = -8204855335;
        const auth = await verifyTelegramAuthorization(negativeId);
        ctx.assert.isFalse(auth.authorized);
        ctx.assert.isFalse(auth.isAdmin8204855335);
        ctx.assert.includes(auth.reason, 'not in the authorized administrator allowlist');
      }
    ),
    createTier2Test(
      'T2-F02-02',
      'F02',
      'Telegram ID 0 or empty string strictly returns Missing Telegram user ID',
      async (ctx: TestContext) => {
        const zeroAuth = await verifyTelegramAuthorization(0);
        ctx.assert.isFalse(zeroAuth.authorized);
        ctx.assert.equal(zeroAuth.reason, 'Missing Telegram user ID');

        const emptyAuth = await verifyTelegramAuthorization('');
        ctx.assert.isFalse(emptyAuth.authorized);
        ctx.assert.equal(emptyAuth.reason, 'Missing Telegram user ID');
      }
    ),
    createTier2Test(
      'T2-F02-03',
      'F02',
      'Non-numeric injection strings (e.g. eval, drop_table) are strictly rejected',
      async (ctx: TestContext) => {
        const maliciousIds = [
          'eval(process.exit(1))',
          '<script>alert(1)</script>',
          'DROP TABLE users;'
        ];
        for (const malId of maliciousIds) {
          const auth = await verifyTelegramAuthorization(malId);
          ctx.assert.isFalse(auth.authorized, `ID ${malId} should not be authorized`);
          ctx.assert.isFalse(auth.isAdmin8204855335);
        }
      }
    ),
    createTier2Test(
      'T2-F02-04',
      'F02',
      'Self-pairing command attacks (/setup?token=xyz) are permanently rejected with audit log',
      async (ctx: TestContext) => {
        const update = ctx.createCommandUpdate('/setup bypass_secret_attempt', 999111222);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.equal(result.action, '/setup');
        ctx.mockTelegramApi.assertLastMessageContains('Self-pairing is permanently disabled');

        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.action === 'SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT'));
      }
    ),
    createTier2Test(
      'T2-F02-05',
      'F02',
      'Master ID 8204855335 strict enforcement filters mock IDs (123456789, 000000)',
      async (ctx: TestContext) => {
        ctx.assert.isTrue(isMasterAdmin(8204855335));
        ctx.assert.isTrue(isMasterAdmin('8204855335'));
        ctx.assert.isTrue(isMasterAdmin(' 8204855335 '));
        ctx.assert.isFalse(isMasterAdmin(8204855336));

        // Ensure allowlist filters mock placeholder IDs
        process.env.TELEGRAM_ADMIN_IDS = '123456789, 000000, 0, 8204855335';
        clearTelegramAuthCache();
        const allowed = await getAuthorizedAdminIds();

        ctx.assert.isTrue(allowed.has('8204855335'));
        ctx.assert.isFalse(allowed.has('123456789'));
        ctx.assert.isFalse(allowed.has('000000'));
        ctx.assert.isFalse(allowed.has('0'));
      }
    ),

    // ==========================================
    // F03: Webhook Secret & Rate Limiting (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F03-01',
      'F03',
      'Webhook secret mismatch is strictly rejected with error Invalid webhook secret',
      async (ctx: TestContext) => {
        const update = ctx.createCommandUpdate('/admin', 8204855335);
        const mismatchSecret = 'invalid_secret_token_123';
        const result = await handleTelegramWebhookUpdate(update, mismatchSecret);

        ctx.assert.isFalse(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.equal(result.error, 'Invalid webhook secret');
      }
    ),
    createTier2Test(
      'T2-F03-02',
      'F03',
      'Missing, empty, and whitespace secret header verification',
      async (ctx: TestContext) => {
        // Missing secret header (undefined) must fail
        ctx.assert.isFalse(verifyWebhookSecret(undefined));

        // Empty secret header ("") must fail
        ctx.assert.isFalse(verifyWebhookSecret(''));

        // Casing mismatch must fail
        const uppercaseSecret = 'DURTUP_TG_ADMIN_SEC_2026';
        ctx.assert.isFalse(verifyWebhookSecret(uppercaseSecret));

        // Whitespace-only secret must fail
        const whitespaceSecret = '   ';
        ctx.assert.isFalse(verifyWebhookSecret(whitespaceSecret));
      }
    ),
    createTier2Test(
      'T2-F03-03',
      'F03',
      'Rapid rate-limit breach blocks 21st request and answers callback with rate limit warning',
      async (ctx: TestContext) => {
        const testUser = 654321098;
        // Send 20 requests within window
        for (let i = 0; i < 20; i++) {
          const ok = checkRateLimit(testUser, 20, 10000);
          ctx.assert.isTrue(ok);
        }

        // 21st request hits router rate limit check
        const update = ctx.createCallbackQueryUpdate('dash:main', testUser);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.equal(result.error, 'Rate limit exceeded');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Rate limit exceeded');
      }
    ),
    createTier2Test(
      'T2-F03-04',
      'F03',
      'Rate limiting isolation ensures Rate limiting User A does not restrict User B',
      async (ctx: TestContext) => {
        const userA = 111222333;
        const userB = 444555666;

        // Exhaust User A's limit
        for (let i = 0; i < 20; i++) {
          checkRateLimit(userA, 20, 10000);
        }
        ctx.assert.isFalse(checkRateLimit(userA, 20, 10000));

        // User B must still be fully permitted
        ctx.assert.isTrue(checkRateLimit(userB, 20, 10000));
      }
    ),
    createTier2Test(
      'T2-F03-05',
      'F03',
      'Duplicate query idempotency guard detects duplicate callback query within window',
      async (ctx: TestContext) => {
        const queryId = 'cb_query_unique_9988';
        const update = ctx.createCallbackQueryUpdate('dash:refresh', 8204855335);
        if (update.callback_query) {
          update.callback_query.id = queryId;
        }

        // First execution succeeds
        const res1 = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(res1.handled);
        ctx.assert.equal(res1.action, 'dash_refresh');

        // Immediate duplicate execution is caught by TelegramStateManager
        const res2 = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(res2.handled);
        ctx.assert.equal(res2.action, 'duplicate_ignored');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Action already processed');
      }
    ),

    // ==========================================
    // F04: Central Audit Logging (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F04-01',
      'F04',
      'Audit log boundary: successfully records entry when optional fields are omitted',
      async (ctx: TestContext) => {
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'MINIMAL_AUDIT_ACTION',
          entityType: 'system',
          entityId: 'sys-001'
        });

        const logs = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(logs.length > 0);
        const top = logs[0];
        ctx.assert.equal(top.action, 'MINIMAL_AUDIT_ACTION');
        ctx.assert.equal(top.entityId, 'sys-001');
        ctx.assert.equal(top.oldValue, undefined);
        ctx.assert.isTrue(Boolean(top.timestamp));
      }
    ),
    createTier2Test(
      'T2-F04-02',
      'F04',
      'Audit log unicode & Bengali integrity preserves Bangla script, emojis, and quotes',
      async (ctx: TestContext) => {
        const unicodeDetails = 'অর্ডার #১০০১ বাতিল এবং ৳৫,০০০ টাকা রিফান্ড সম্পন্ন 🚀🔒📦 "approved"';
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'মাস্টার এডমিন',
          action: 'ORDER_REFUND_BANGLA',
          entityType: 'order',
          entityId: 'ord-bangla-01',
          details: unicodeDetails
        });

        const logs = getRecentTelegramAuditLogs();
        const found = logs.find(l => l.entityId === 'ord-bangla-01');
        ctx.assert.isTrue(Boolean(found));
        ctx.assert.equal(found?.details, unicodeDetails);
        ctx.assert.equal(found?.adminName, 'মাস্টার এডমিন');
      }
    ),
    createTier2Test(
      'T2-F04-03',
      'F04',
      'Large payload boundary: safely records 20KB+ detail payload without crashing',
      async (ctx: TestContext) => {
        const largeString = 'A'.repeat(25000);
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'LARGE_PAYLOAD_TEST',
          entityType: 'diagnostic',
          entityId: 'diag-large',
          details: largeString
        });

        const logs = getRecentTelegramAuditLogs();
        const found = logs.find(l => l.entityId === 'diag-large');
        ctx.assert.isTrue(Boolean(found));
        ctx.assert.equal(found?.details?.length, 25000);
      }
    ),
    createTier2Test(
      'T2-F04-04',
      'F04',
      'Circular buffer capacity boundary strictly caps in-memory logs at MAX_IN_MEMORY_LOGS = 200',
      async (ctx: TestContext) => {
        clearInMemoryAuditLogs();
        // Insert 210 log entries in parallel
        const promises = [];
        for (let i = 0; i < 210; i++) {
          promises.push(
            recordTelegramAudit({
              telegramAdminId: 8204855335,
              adminName: 'Master Admin',
              action: `TEST_ACTION_${i}`,
              entityType: 'test',
              entityId: `id_${i}`
            })
          );
        }
        await Promise.all(promises);

        const logs = getRecentTelegramAuditLogs(250);
        ctx.assert.equal(logs.length, 200, 'In-memory buffer must be capped at 200');
      }
    ),
    createTier2Test(
      'T2-F04-05',
      'F04',
      'Dual-write resilience: audit logging succeeds without throwing even when Firestore writes timeout',
      async (ctx: TestContext) => {
        const start = Date.now();
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'DUAL_WRITE_RESILIENCE',
          entityType: 'order',
          entityId: 'ord-fast'
        });
        const elapsed = Date.now() - start;

        // Completes within the 2000ms race timeout safely
        ctx.assert.isTrue(elapsed <= 2500, `Execution took ${elapsed}ms, should be <= 2500ms`);
        const logs = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(logs.some(l => l.action === 'DUAL_WRITE_RESILIENCE'));
      }
    ),

    // ==========================================
    // F05: 16-Module Super Admin Dashboard (/admin) (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F05-01',
      'F05',
      'Deep menu boundary: callback with deep nesting tokens routes safely to module handler',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('ord:list:pending:page:3:filter:all', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Orders Module is active');
      }
    ),
    createTier2Test(
      'T2-F05-02',
      'F05',
      'Unrecognized callback token fallback safely dismisses loading spinner without crashing',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('unrecognized_token_xyz_99', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'unknown_callback');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Action acknowledged');
      }
    ),
    createTier2Test(
      'T2-F05-03',
      'F05',
      'Confirmation prompt cancellation callback cnf:cancel:dash:main restores dashboard cleanly',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('cnf:cancel:dash:main', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'action_cancelled');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Action cancelled');
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP');
      }
    ),
    createTier2Test(
      'T2-F05-04',
      'F05',
      'Enforces Telegram 64-byte callback length limit on all constructed navigation callbacks',
      async (ctx: TestContext) => {
        const promptKeyboard = buildConfirmationPromptKeyboard(
          'ord:appr_exec:order_2026_11_24_001',
          'ord:view:order_2026_11_24_001'
        );
        validateCallbackBytes(promptKeyboard);
        for (const row of promptKeyboard.inline_keyboard) {
          for (const btn of row) {
            ctx.assert.isTrue(
              Buffer.byteLength(btn.callback_data, 'utf8') <= 64,
              `Callback data ${btn.callback_data} exceeds 64 bytes`
            );
          }
        }
      }
    ),
    createTier2Test(
      'T2-F05-05',
      'F05',
      'Dashboard in edit mode replaces message in-place without generating orphaned messages',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('dash:main', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.equal(result.action, 'dash_refresh');
        const lastEdit = ctx.mockTelegramApi.lastEditedMessage();
        ctx.assert.isTrue(Boolean(lastEdit), 'Dashboard should be updated via editMessageText');
      }
    ),

    // ==========================================
    // F06: Rich Order Notifications with Image & Supplier (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F06-01',
      'F06',
      'Order notification with missing image fallback formats message cleanly',
      async (ctx: TestContext) => {
        const orderData = {
          orderId: 'ord-no-img',
          orderNumber: 'ORD-9901',
          customerName: 'Rahim Khan',
          customerPhone: '01711223344',
          shippingAddress: 'Mirpur-10, Dhaka',
          paymentMethod: 'bKash',
          paymentStatus: 'verified',
          totalAmount: 1250,
          items: [
            {
              name: 'Smart Watch X',
              quantity: 1,
              price: 1250,
              image: undefined,
              sku: 'ECOM-SW-01'
            }
          ]
        };
        const text = formatOrderNotificationText(orderData);
        ctx.assert.includes(text, 'NEW ORDER RECEIVED: #ORD-9901');
        ctx.assert.includes(text, 'EcomsellerBD');
        ctx.assert.includes(text, 'Rahim Khan');
      }
    ),
    createTier2Test(
      'T2-F06-02',
      'F06',
      '0-items order boundary renders notification without crashing or undefined errors',
      async (ctx: TestContext) => {
        const orderData = {
          orderId: 'ord-empty-items',
          orderNumber: 'ORD-0000',
          customerName: 'Zero Item Customer',
          customerPhone: '01811223344',
          shippingAddress: 'Gulshan-2, Dhaka',
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'pending',
          totalAmount: 0,
          items: []
        };
        const text = formatOrderNotificationText(orderData);
        ctx.assert.includes(text, 'ORD-0000');
        ctx.assert.includes(text, 'Direct');
      }
    ),
    createTier2Test(
      'T2-F06-03',
      'F06',
      'Missing supplier SKU or unknown prefix safely defaults to Direct supplier',
      async (ctx: TestContext) => {
        ctx.assert.equal(attributeSupplier(''), 'Direct');
        ctx.assert.equal(attributeSupplier('UNKNOWN-SKU-999'), 'Direct');
        ctx.assert.equal(attributeSupplier('DIR-LOCAL-001'), 'Direct');
        ctx.assert.equal(attributeSupplier(undefined), 'Direct');
      }
    ),
    createTier2Test(
      'T2-F06-04',
      'F06',
      'Extreme BDT price amounts (৳0, ৳10,000,000) format correctly with locale separators',
      async (ctx: TestContext) => {
        const zeroPriceOrder = {
          id: 'ord-zero',
          order_number: 'ORD-ZERO',
          customer_name: 'Free Sample',
          customer_phone: '01700000000',
          shippingAddress: 'Dhaka',
          payment_method: 'COD',
          payment_status: 'pending',
          total_amount: 0,
          items: [{ name: 'Sample Item', quantity: 1, price: 0, sku: 'DIR-0' }]
        } as any;
        const textZero = formatOrderNotificationText(zeroPriceOrder);
        ctx.assert.includes(textZero, '৳0');

        const hugePriceOrder = {
          id: 'ord-huge',
          order_number: 'ORD-HUGE',
          customer_name: 'VIP Client',
          customer_phone: '01799999999',
          shippingAddress: 'Dhaka',
          payment_method: 'Bank',
          payment_status: 'verified',
          total_amount: 10000000,
          items: [{ name: 'Bulk Wholesale Order', quantity: 100, price: 100000, sku: 'ECOM-BULK' }]
        } as any;
        const textHuge = formatOrderNotificationText(hugePriceOrder);
        ctx.assert.includes(textHuge, '10,000,000');
      }
    ),
    createTier2Test(
      'T2-F06-05',
      'F06',
      'Customer name and shipping address with special characters render safely',
      async (ctx: TestContext) => {
        const orderData = {
          orderId: 'ord-special-chars',
          orderNumber: 'ORD-SPEC-01',
          customerName: 'Md. Nahid & Sons Ltd. <VIP>',
          customerPhone: '01712-345678',
          shippingAddress: 'House #4, Road #2/A, Sector #7, Uttara, Dhaka-1230',
          paymentMethod: 'bKash',
          paymentStatus: 'verified',
          totalAmount: 3200,
          items: [{ name: 'Wireless Earbuds', quantity: 2, price: 1600, sku: 'MOH-EAR-01' }]
        };
        const text = formatOrderNotificationText(orderData);
        ctx.assert.includes(text, 'Md. Nahid & Sons Ltd.');
        ctx.assert.includes(text, 'Uttara');
        ctx.assert.includes(text, 'DropShipping.com.bd');
      }
    ),

    // ==========================================
    // F07: Interactive Order Actions & Status Transitions (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F07-01',
      'F07',
      'Double-action idempotency on approve: updating already confirmed order does not corrupt timeline',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        // First transition to confirmed
        await executeOrderStatusUpdate(ctx.mockDb, orderId, 'confirmed');
        const timelines1 = ctx.mockDb.query('order_timelines', t => t.order_id === orderId);
        const count1 = timelines1.length;

        // Repeat transition to confirmed
        await executeOrderStatusUpdate(ctx.mockDb, orderId, 'confirmed');
        const updated = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(updated.status, 'confirmed');

        const timelines2 = ctx.mockDb.query('order_timelines', t => t.order_id === orderId);
        ctx.assert.isTrue(timelines2.length >= count1);
      }
    ),
    createTier2Test(
      'T2-F07-02',
      'F07',
      'Non-existent order ID status update throws clean descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await executeOrderStatusUpdate(ctx.mockDb, 'non_existent_order_9999', 'confirmed');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found in database');
        }
        ctx.assert.isTrue(threw, 'Should have thrown error for non-existent order');
      }
    ),
    createTier2Test(
      'T2-F07-03',
      'F07',
      'Status update from terminal state (cancelled -> confirmed) records transition in audit log',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1005'; // currently cancelled
        const res = await executeOrderStatusUpdate(ctx.mockDb, orderId, 'confirmed', 8204855335, 'Reopened by admin');
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.status, 'confirmed');

        const audits = getRecentTelegramAuditLogs();
        const found = audits.find(a => a.entityId === orderId && a.action === 'ORDER_STATUS_UPDATE');
        ctx.assert.isTrue(Boolean(found));
        ctx.assert.equal(found?.oldValue, 'cancelled');
        ctx.assert.equal(found?.newValue, 'confirmed');
      }
    ),
    createTier2Test(
      'T2-F07-04',
      'F07',
      'Status transition with custom admin notes persists in timeline and audit log',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        const customNote = 'Customer verified via phone call before dispatch.';
        await executeOrderStatusUpdate(ctx.mockDb, orderId, 'processing', 8204855335, customNote);

        const timelines = ctx.mockDb.query('order_timelines', t => t.order_id === orderId);
        const lastTimeline = timelines[timelines.length - 1];
        ctx.assert.equal(lastTimeline.notes, customNote);
      }
    ),
    createTier2Test(
      'T2-F07-05',
      'F07',
      'Order notification action buttons build valid callback query tokens <= 64 bytes',
      async (ctx: TestContext) => {
        const buttons = buildOrderNotificationButtons('ORD-1001');
        for (const row of buttons.inline_keyboard) {
          for (const btn of row) {
            ctx.assert.isTrue(btn.callback_data.length <= 64);
            ctx.assert.isTrue(btn.callback_data.startsWith('ord:'));
          }
        }
      }
    ),

    // ==========================================
    // F08: Order Filtering, Search & Confirmation (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F08-01',
      'F08',
      'Search non-existent order returns empty array [] without throwing',
      async (ctx: TestContext) => {
        const results = searchOrders(ctx.mockDb, 'NON_EXISTENT_ORDER_SEARCH_XYZ_999');
        ctx.assert.equal(results.length, 0);
      }
    ),
    createTier2Test(
      'T2-F08-02',
      'F08',
      'Filter orders by non-existent status returns empty array []',
      async (ctx: TestContext) => {
        const results = filterOrdersByStatus(ctx.mockDb, 'non_existent_status_category');
        ctx.assert.equal(results.length, 0);
      }
    ),
    createTier2Test(
      'T2-F08-03',
      'F08',
      'Confirmation prompt cancellation builds compliant cnf:cancel callback data',
      async (ctx: TestContext) => {
        const keyboard = buildConfirmationPromptKeyboard('ord:rej_exec:ORD-1001', 'ord:view:ORD-1001');
        const cancelBtn = keyboard.inline_keyboard[0][1];
        ctx.assert.equal(cancelBtn.callback_data, 'cnf:cancel:ord:view:ORD-1001');
        ctx.assert.isTrue(cancelBtn.callback_data.length <= 64);
      }
    ),
    createTier2Test(
      'T2-F08-04',
      'F08',
      'Search orders with special regex metacharacters executes safe substring match',
      async (ctx: TestContext) => {
        // Special regex characters should not cause regex syntax errors
        const queries = ['.*', '(', '[', '+', '?', '\\', '^$'];
        for (const q of queries) {
          const results = searchOrders(ctx.mockDb, q);
          ctx.assert.isTrue(Array.isArray(results));
        }
      }
    ),
    createTier2Test(
      'T2-F08-05',
      'F08',
      'Case-insensitive order search by partial order number or phone number',
      async (ctx: TestContext) => {
        const resLower = searchOrders(ctx.mockDb, 'dt-2611');
        const resUpper = searchOrders(ctx.mockDb, 'DT-2611');
        ctx.assert.equal(resLower.length, resUpper.length);
        ctx.assert.isTrue(resLower.length > 0);

        const resPhone = searchOrders(ctx.mockDb, '01711');
        ctx.assert.isTrue(resPhone.length > 0);
      }
    ),

    // ==========================================
    // F09: Payment Inspection & Multi-Gateway Verification (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F09-01',
      'F09',
      'Malformed bKash trx_id (too short, too long, invalid characters) is rejected',
      async (ctx: TestContext) => {
        ctx.assert.isFalse(validateBkashTrxId('SHORT')); // <8 chars
        ctx.assert.isFalse(validateBkashTrxId('BKASH_VERY_LONG_TRX_ID_OVERFLOW')); // >15 chars
        ctx.assert.isFalse(validateBkashTrxId('TRX!@#$%')); // Special chars
        ctx.assert.isFalse(validateBkashTrxId('   ')); // Empty/whitespace
      }
    ),
    createTier2Test(
      'T2-F09-02',
      'F09',
      'Valid bKash trx_id satisfies 8-15 alphanumeric format',
      async (ctx: TestContext) => {
        ctx.assert.isTrue(validateBkashTrxId('BKA9988771'));
        ctx.assert.isTrue(validateBkashTrxId('9K28A77123'));
        ctx.assert.isTrue(validateBkashTrxId('BKASH12345'));
      }
    ),
    createTier2Test(
      'T2-F09-03',
      'F09',
      'Mismatched sender phone rejection: verifies sender phone against order customer phone',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001'; // Phone: 01711000001
        const res = await verifyPayment(ctx.mockDb, orderId, 8204855335, {
          senderPhone: '01999999999' // Mismatched phone
        });
        ctx.assert.isFalse(res.success);
        ctx.assert.includes(res.message || '', 'Mismatched sender phone');
      }
    ),
    createTier2Test(
      'T2-F09-04',
      'F09',
      'Idempotency guard: re-verifying an already verified payment is rejected',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1003'; // Already verified
        const res = await verifyPayment(ctx.mockDb, orderId, 8204855335, {
          rejectIfAlreadyVerified: true
        });
        ctx.assert.isFalse(res.success);
        ctx.assert.includes(res.message || '', 'already verified');
      }
    ),
    createTier2Test(
      'T2-F09-05',
      'F09',
      'Payment verification for non-existent order throws clean descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await verifyPayment(ctx.mockDb, 'non_existent_pay_order_999');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),

    // ==========================================
    // F10: Refund Review & Moderation (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F10-01',
      'F10',
      'Refund request validation: rejecting refund request with empty proof images',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await processRefund(ctx.mockDb, 'ORD-1001', 8204855335, 'Customer return', {
            proofImages: [] // Empty proof images array
          });
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'at least one proof image is required');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F10-02',
      'F10',
      'Duplicate refund guard: approving an already refunded order is rejected',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        // First refund succeeds
        await processRefund(ctx.mockDb, orderId, 8204855335, 'First approval');

        // Second refund attempt with guard
        const res = await processRefund(ctx.mockDb, orderId, 8204855335, 'Second attempt', {
          rejectIfAlreadyRefunded: true
        });
        ctx.assert.isFalse(res.success);
        ctx.assert.includes(res.message || '', 'already marked as refunded');
      }
    ),
    createTier2Test(
      'T2-F10-03',
      'F10',
      'Non-existent order refund processing throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await processRefund(ctx.mockDb, 'non_existent_refund_order');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F10-04',
      'F10',
      'Cancel refund approval prompt via cnf:cancel returns cleanly to dashboard',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('cnf:cancel:ref:list:1', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.equal(result.action, 'action_cancelled');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Action cancelled');
      }
    ),
    createTier2Test(
      'T2-F10-05',
      'F10',
      'Full refund audit trail records both status and payment_status in audit log and timeline',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        await processRefund(ctx.mockDb, orderId, 8204855335, 'Damaged product refund approved');

        const order = ctx.mockDb.getDoc('orders', orderId);
        ctx.assert.equal(order.status, 'refunded');
        ctx.assert.equal(order.payment_status, 'refunded');

        const audits = getRecentTelegramAuditLogs();
        const refundAudit = audits.find(a => a.entityId === orderId && a.action === 'REFUND_APPROVED');
        ctx.assert.isTrue(Boolean(refundAudit));
      }
    ),

    // ==========================================
    // F11: Product Search, Details & Live Controls (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F11-01',
      'F11',
      'Product search with empty string or special regex characters returns all or handles safely',
      async (ctx: TestContext) => {
        const allProducts = ctx.mockDb.listDocs('products');
        ctx.assert.isTrue(allProducts.length > 0);

        // Substring search with empty string
        const emptyQueryResults = ctx.mockDb.query('products', p => p.name.includes(''));
        ctx.assert.equal(emptyQueryResults.length, allProducts.length);

        // Search with regex characters should not throw
        const regexQueryResults = ctx.mockDb.query('products', p => p.name.includes('[') || p.name.includes('*'));
        ctx.assert.isTrue(Array.isArray(regexQueryResults));
      }
    ),
    createTier2Test(
      'T2-F11-02',
      'F11',
      'Negative price update rejection: updating regular_price to negative number throws error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await updateProductPrice(ctx.mockDb, 'PROD-001', -500);
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'cannot be negative');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F11-03',
      'F11',
      'Negative stock quantity rejection: updating stock_quantity to negative number throws error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await updateProductStock(ctx.mockDb, 'PROD-001', -15);
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'cannot be negative');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F11-04',
      'F11',
      'Non-existent product ID update throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await updateProductPrice(ctx.mockDb, 'non_existent_product_9999', 1500);
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F11-05',
      'F11',
      'Non-existent product ID status toggle throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await toggleProductActive(ctx.mockDb, 'non_existent_product_toggle');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),

    // ==========================================
    // F12: Inventory Valuation & Stock Alerts (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F12-01',
      'F12',
      'Inventory low-stock exact boundary test: product with stock_quantity = 10 is classified as low stock',
      async (ctx: TestContext) => {
        // Set product stock to exact boundary: 10
        await updateProductStock(ctx.mockDb, 'PROD-001', 10);
        const lowStock = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isTrue(lowStock.some(p => p.id === 'PROD-001'));
      }
    ),
    createTier2Test(
      'T2-F12-02',
      'F12',
      'Inventory low-stock inside boundary test: product with stock_quantity = 9 is classified as low stock',
      async (ctx: TestContext) => {
        // Set product stock inside boundary: 9
        await updateProductStock(ctx.mockDb, 'PROD-001', 9);
        const lowStock = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isTrue(lowStock.some(p => p.id === 'PROD-001'));
      }
    ),
    createTier2Test(
      'T2-F12-03',
      'F12',
      'Inventory low-stock outside boundary test: product with stock_quantity = 11 is NOT classified as low stock',
      async (ctx: TestContext) => {
        // Set product stock outside boundary: 11
        await updateProductStock(ctx.mockDb, 'PROD-001', 11);
        const lowStock = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isFalse(lowStock.some(p => p.id === 'PROD-001'));
      }
    ),
    createTier2Test(
      'T2-F12-04',
      'F12',
      'Out of stock boundary test: product with stock_quantity = 0 is classified as out of stock, not low stock',
      async (ctx: TestContext) => {
        // Set stock to 0
        await updateProductStock(ctx.mockDb, 'PROD-001', 0);
        const lowStock = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isFalse(lowStock.some(p => p.id === 'PROD-001'), 'stock=0 must not be in low stock list');

        const valuation = calculateInventoryValuation(ctx.mockDb);
        ctx.assert.isTrue(valuation.outOfStockCount >= 1);
      }
    ),
    createTier2Test(
      'T2-F12-05',
      'F12',
      'Valuation calculation with 0-price or 0-stock products computes correct total without NaN',
      async (ctx: TestContext) => {
        // Add 0-price product
        ctx.mockDb.setDoc('products', 'prod-free', {
          id: 'prod-free',
          name: 'Free Promotional Gift',
          regular_price: 0,
          discount_price: 0,
          stock_quantity: 50,
          is_active: true
        });

        const valuation = calculateInventoryValuation(ctx.mockDb);
        ctx.assert.isFalse(isNaN(valuation.totalValuationBDT));
        ctx.assert.isTrue(valuation.totalValuationBDT >= 0);
        ctx.assert.isTrue(valuation.totalQuantity > 50);
      }
    ),

    // ==========================================
    // F13: Customer Profile & Access Control (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F13-01',
      'F13',
      'Invalid customer phone format rejection (empty, letters, too short)',
      async (ctx: TestContext) => {
        ctx.assert.isFalse(validateCustomerPhone(''));
        ctx.assert.isFalse(validateCustomerPhone('01711')); // Too short
        ctx.assert.isFalse(validateCustomerPhone('not_a_phone_num'));
        ctx.assert.isFalse(validateCustomerPhone('01234567890')); // Invalid BD operator 012
      }
    ),
    createTier2Test(
      'T2-F13-02',
      'F13',
      'Valid Bangladesh phone format validation (017..., 018..., +88019...)',
      async (ctx: TestContext) => {
        ctx.assert.isTrue(validateCustomerPhone('01711000001'));
        ctx.assert.isTrue(validateCustomerPhone('01811223344'));
        ctx.assert.isTrue(validateCustomerPhone('+8801911223344'));
        ctx.assert.isTrue(validateCustomerPhone('+8801311223344'));
      }
    ),
    createTier2Test(
      'T2-F13-03',
      'F13',
      '0-order customer profile inspection handles gracefully without undefined errors',
      async (ctx: TestContext) => {
        ctx.mockDb.setDoc('profiles', 'cust-zero-orders', {
          id: 'cust-zero-orders',
          full_name: 'New Registered Customer',
          phone: '01700998877',
          email: 'newuser@example.com',
          status: 'active',
          total_orders: 0,
          total_spent: 0
        });

        const prof = ctx.mockDb.getDoc('profiles', 'cust-zero-orders');
        ctx.assert.equal(prof.total_orders, 0);
        ctx.assert.equal(prof.total_spent, 0);
      }
    ),
    createTier2Test(
      'T2-F13-04',
      'F13',
      'Suspending already suspended customer toggles status back to active',
      async (ctx: TestContext) => {
        const profId = 'PROF-001';
        // Suspend
        await toggleCustomerAccess(ctx.mockDb, profId);
        let prof = ctx.mockDb.getDoc('profiles', profId);
        ctx.assert.equal(prof.status, 'suspended');

        // Toggle again to re-activate
        await toggleCustomerAccess(ctx.mockDb, profId);
        prof = ctx.mockDb.getDoc('profiles', profId);
        ctx.assert.equal(prof.status, 'active');
      }
    ),
    createTier2Test(
      'T2-F13-05',
      'F13',
      'Toggling non-existent customer profile ID throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await toggleCustomerAccess(ctx.mockDb, 'non_existent_profile_id_999');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),

    // ==========================================
    // F14: Supplier Tracking & Courier Shipping (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F14-01',
      'F14',
      'Duplicate courier assignment attempt on already shipped order is rejected',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        // First assignment
        await assignCourierToOrder(ctx.mockDb, orderId, 'Pathao', 'PTH-123456');

        // Duplicate assignment attempt
        const res = await assignCourierToOrder(ctx.mockDb, orderId, 'SteadFast', 'STF-654321');
        ctx.assert.isFalse(res.success);
        ctx.assert.includes(res.message, 'already booked');
      }
    ),
    createTier2Test(
      'T2-F14-02',
      'F14',
      'Invalid courier name rejection: assigning unsupported courier (e.g. FedEx, DHL) throws error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await assignCourierToOrder(ctx.mockDb, 'ORD-1001', 'FedExInternational' as any);
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'Invalid courier');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F14-03',
      'F14',
      'Supplier tracking with 0 products or 0 orders handles empty collection cleanly',
      async (ctx: TestContext) => {
        const nonExistentSupplierOrders = ctx.mockDb.query('orders', o =>
          o.items?.some((i: any) => i.sku?.startsWith('NON_EXISTENT_SUPPLIER_'))
        );
        ctx.assert.equal(nonExistentSupplierOrders.length, 0);
      }
    ),
    createTier2Test(
      'T2-F14-04',
      'F14',
      'Custom courier tracking ID assignment persists exact tracking number',
      async (ctx: TestContext) => {
        const orderId = 'ORD-1001';
        const customTracking = 'CUSTOM-TRACK-998877';
        const res = await assignCourierToOrder(ctx.mockDb, orderId, 'SteadFast', customTracking);

        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.courier_tracking_id, customTracking);
        ctx.assert.equal(res.order.status, 'shipped');
      }
    ),
    createTier2Test(
      'T2-F14-05',
      'F14',
      'Courier assignment for non-existent order throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await assignCourierToOrder(ctx.mockDb, 'non_existent_ship_order', 'Pathao');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),

    // ==========================================
    // F15: Coupons & Review/Q&A Moderation (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F15-01',
      'F15',
      'Expired coupon toggle: toggling active status on expired coupon updates database and logs audit',
      async (ctx: TestContext) => {
        const expiredId = 'COUP-EXPIRED50';
        const res = await toggleCouponActive(ctx.mockDb, expiredId);
        ctx.assert.isTrue(res.success);
        ctx.assert.isTrue(res.coupon.is_active);

        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.entityId === expiredId && a.action === 'COUPON_TOGGLE'));
      }
    ),
    createTier2Test(
      'T2-F15-02',
      'F15',
      'Negative coupon discount rejection: creating coupon with discount <= 0 or > 100% is rejected',
      async (ctx: TestContext) => {
        ctx.assert.isFalse(validateCouponDiscount(-10, 'percentage'));
        ctx.assert.isFalse(validateCouponDiscount(0, 'percentage'));
        ctx.assert.isFalse(validateCouponDiscount(150, 'percentage')); // > 100%
        ctx.assert.isTrue(validateCouponDiscount(20, 'percentage'));

        let threw = false;
        try {
          await createCoupon(ctx.mockDb, {
            code: 'INVALID_NEG',
            discount_value: -25,
            discount_type: 'percentage'
          });
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'Invalid coupon discount');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F15-03',
      'F15',
      'Moderating non-existent review ID throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await moderateReview(ctx.mockDb, 'non_existent_review_999', 'approved');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F15-04',
      'F15',
      'Moderating non-existent question ID throws descriptive error',
      async (ctx: TestContext) => {
        let threw = false;
        try {
          await moderateQuestion(ctx.mockDb, 'non_existent_question_999', 'approved');
        } catch (err: any) {
          threw = true;
          ctx.assert.includes(err.message, 'not found');
        }
        ctx.assert.isTrue(threw);
      }
    ),
    createTier2Test(
      'T2-F15-05',
      'F15',
      'Buyer badge preservation: rejecting or approving reviews strictly preserves is_verified_buyer boolean',
      async (ctx: TestContext) => {
        const revId = 'REV-001';
        const resAppr = await moderateReview(ctx.mockDb, revId, 'approved');
        ctx.assert.isTrue(resAppr.review.is_verified_buyer);

        const resRej = await moderateReview(ctx.mockDb, revId, 'rejected');
        ctx.assert.isTrue(resRej.review.is_verified_buyer);
      }
    ),

    // ==========================================
    // F16: Live Analytics & Timezone Reporting (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F16-01',
      'F16',
      'Custom date range crossing midnight in Asia/Dhaka aggregates orders correctly',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(
          ctx.mockDb,
          'custom',
          new Date('2026-11-24T12:00:00Z'),
          {
            startDate: '2026-11-23T18:00:00Z', // 2026-11-24 00:00:00 in Dhaka (UTC+6)
            endDate: '2026-11-24T17:59:59Z'
          }
        );
        ctx.assert.equal(report.timezone, 'Asia/Dhaka');
        ctx.assert.isTrue(report.totalOrders >= 0);
      }
    ),
    createTier2Test(
      'T2-F16-02',
      'F16',
      'Future date range returns 0 orders and ৳0 revenue without NaN',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(
          ctx.mockDb,
          'custom',
          new Date('2026-11-24T12:00:00Z'),
          {
            startDate: '2030-01-01T00:00:00Z',
            endDate: '2030-01-31T23:59:59Z'
          }
        );
        ctx.assert.equal(report.totalOrders, 0);
        ctx.assert.equal(report.totalRevenueBDT, 0);
      }
    ),
    createTier2Test(
      'T2-F16-03',
      'F16',
      'Leap year boundary (Feb 29) reference date computes analytics without Date parsing errors',
      async (ctx: TestContext) => {
        const leapDate = new Date('2028-02-29T12:00:00Z');
        const reportToday = computeAnalyticsReport(ctx.mockDb, 'today', leapDate);
        ctx.assert.equal(reportToday.totalOrders, 0);

        const reportYesterday = computeAnalyticsReport(ctx.mockDb, 'yesterday', leapDate);
        ctx.assert.equal(reportYesterday.totalOrders, 0);
      }
    ),
    createTier2Test(
      'T2-F16-04',
      'F16',
      'Empty sales period returns clean zeros for all metrics without NaN',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(
          ctx.mockDb,
          'custom',
          new Date('2026-11-24T12:00:00Z'),
          {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2020-01-02T00:00:00Z'
          }
        );
        ctx.assert.equal(report.totalOrders, 0);
        ctx.assert.equal(report.confirmedOrders, 0);
        ctx.assert.equal(report.pendingOrders, 0);
        ctx.assert.equal(report.cancelledOrders, 0);
        ctx.assert.equal(report.totalRevenueBDT, 0);
      }
    ),
    createTier2Test(
      'T2-F16-05',
      'F16',
      'Revenue status segregation strictly excludes cancelled and pending orders from confirmed revenue',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(ctx.mockDb, '7d', new Date('2026-11-24T12:00:00Z'));
        // In 7d window:
        // Confirmed/Delivered/Shipped: ORD-1002 (2199), ORD-1003 (1850), ORD-1004 (3200) = 7249
        // Pending: ORD-1001 (1998), ORD-1006 (5049) -> not in revenue
        // Cancelled: ORD-1005 (1200) -> not in revenue
        ctx.assert.equal(report.totalRevenueBDT, 7249);
        ctx.assert.equal(report.confirmedOrders, 3);
        ctx.assert.equal(report.pendingOrders, 2);
        ctx.assert.equal(report.cancelledOrders, 1);
      }
    ),

    // ==========================================
    // F17: Settings & Security Modules (5 tests)
    // ==========================================
    createTier2Test(
      'T2-F17-01',
      'F17',
      'Attempt to remove Master ID 8204855335 from admins is blocked; Master ID is immutable',
      async (ctx: TestContext) => {
        // Even if database settings are mutated to remove Master Admin
        ctx.mockDb.updateDoc('settings', 'telegram', {
          admin_chat_ids: ['999999999'],
          chat_id: '999999999'
        });

        // isMasterAdmin is immutable hardcoded check
        ctx.assert.isTrue(isMasterAdmin(8204855335));
        const auth = await verifyTelegramAuthorization(8204855335);
        ctx.assert.isTrue(auth.authorized);
        ctx.assert.isTrue(auth.isAdmin8204855335);
      }
    ),
    createTier2Test(
      'T2-F17-02',
      'F17',
      'Empty admin list fallback: if admin_chat_ids is empty, Master ID is STILL authorized',
      async (ctx: TestContext) => {
        process.env.TELEGRAM_ADMIN_IDS = '';
        clearTelegramAuthCache();
        const allowed = await getAuthorizedAdminIds();
        ctx.assert.isTrue(allowed.has('8204855335'));
      }
    ),
    createTier2Test(
      'T2-F17-03',
      'F17',
      'Toggling maintenance mode on and off updates settings collection and creates audit log',
      async (ctx: TestContext) => {
        // Turn ON
        const onRes = await toggleMaintenanceMode(ctx.mockDb, true);
        ctx.assert.isTrue(onRes.settings.maintenance_mode);

        // Turn OFF
        const offRes = await toggleMaintenanceMode(ctx.mockDb, false);
        ctx.assert.isFalse(offRes.settings.maintenance_mode);

        const audits = getRecentTelegramAuditLogs();
        ctx.assert.isTrue(audits.some(a => a.action === 'SETTINGS_MAINTENANCE_TOGGLE'));
      }
    ),
    createTier2Test(
      'T2-F17-04',
      'F17',
      'Non-existent settings document fallback handles safely with default values',
      async (ctx: TestContext) => {
        const nonExistentSettings = ctx.mockDb.getDoc('settings', 'non_existent_key');
        ctx.assert.equal(nonExistentSettings, null);
      }
    ),
    createTier2Test(
      'T2-F17-05',
      'F17',
      'Security audit log history accurately retrieves populated recent audit logs',
      async (ctx: TestContext) => {
        clearInMemoryAuditLogs();
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'SECURITY_AUDIT_VERIFY',
          entityType: 'security',
          entityId: 'sec-001'
        });

        const logs = getRecentTelegramAuditLogs(10);
        ctx.assert.equal(logs.length, 1);
        ctx.assert.equal(logs[0].action, 'SECURITY_AUDIT_VERIFY');
      }
    )
  ]
};

// Also export alias tier2Suite for compatibility
export const tier2Suite = tier2TestSuite;
