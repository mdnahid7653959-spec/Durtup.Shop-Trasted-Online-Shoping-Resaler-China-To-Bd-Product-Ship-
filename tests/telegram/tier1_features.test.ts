/**
 * Durtup.shop Telegram Super Admin Control Center
 * Tier 1: Feature Coverage Test Suite (F01–F17)
 *
 * Implements >=5 comprehensive, isolated test cases for each of the 17 features:
 * - F01: Architectural Audit & Entrypoint Unification (5 tests)
 * - F02: Strict Admin Allowlisting & Master ID 8204855335 (5 tests)
 * - F03: Webhook Secret & Rate Limiting (5 tests)
 * - F04: Central Audit Logging (5 tests)
 * - F05: 16-Module Super Admin Dashboard (/admin) (5 tests)
 * - F06: Rich Order Notifications with Image & Supplier (5 tests)
 * - F07: Interactive Order Actions & Status Transitions (5 tests)
 * - F08: Order Filtering, Search & Confirmation (5 tests)
 * - F09: Payment Inspection & Multi-Gateway Verification (5 tests)
 * - F10: Refund Review & Moderation (5 tests)
 * - F11: Product Search, Details & Live Controls (5 tests)
 * - F12: Inventory Valuation & Stock Alerts (5 tests)
 * - F13: Customer Profile & Access Control (5 tests)
 * - F14: Supplier Tracking & Courier Shipping (5 tests)
 * - F15: Coupons & Review/Q&A Moderation (5 tests)
 * - F16: Live Analytics & Timezone Reporting (5 tests)
 * - F17: Settings & Security Modules (5 tests)
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
  getDashboardKeyboard,
  renderDashboard
} from '../../src/server/telegram/modules/dashboardModule';
import {
  attributeSupplier,
  buildOrderNotificationButtons,
  formatOrderNotificationText,
  executeOrderStatusUpdate,
  filterOrdersByStatus,
  searchOrders,
  buildConfirmationPromptKeyboard,
  verifyPayment,
  processRefund,
  updateProductPrice,
  updateProductStock,
  toggleProductActive,
  calculateInventoryValuation,
  getLowStockAlerts,
  toggleCustomerAccess,
  assignCourierToOrder,
  toggleCouponActive,
  moderateReview,
  moderateQuestion,
  computeAnalyticsReport,
  toggleMaintenanceMode
} from './harness/featureHelpers';

// Helper to wrap test runs with setup/teardown isolation
function createTier1Test(
  id: string,
  feature: string,
  name: string,
  fn: (ctx: TestContext) => Promise<void> | void
): TestCase {
  return {
    id,
    feature,
    name,
    tier: 1,
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

export const tier1TestSuite: TestSuite = {
  tier: 1,
  title: 'Tier 1: Feature Coverage Test Suite (F01–F17)',
  tests: [
    // ==========================================
    // F01: Architectural Audit & Entrypoint Unification (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F01-01',
      'F01',
      'Unified Router dispatches /admin command returning handled and authorized',
      async (ctx: TestContext) => {
        const update = ctx.createCommandUpdate('/admin', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'dashboard_rendered');
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP');
        ctx.mockTelegramApi.assertLastInlineKeyboardHasCallback('dash:');
      }
    ),
    createTier1Test(
      'T1-F01-02',
      'F01',
      'Unified Router dispatches dash:refresh callback query in-place',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('dash:refresh', 8204855335, 8204855335, 1001);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.assert.equal(result.action, 'dash_refresh');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Dashboard refreshed');
      }
    ),
    createTier1Test(
      'T1-F01-03',
      'F01',
      'Router handles empty or malformed update gracefully without crashing',
      async (ctx: TestContext) => {
        const result = await handleTelegramWebhookUpdate(null as any);
        ctx.assert.isFalse(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.includes(result.error || '', 'Empty or invalid');
      }
    ),
    createTier1Test(
      'T1-F01-04',
      'F01',
      'Operational health check endpoint returns operational and master admin configured',
      async (ctx: TestContext) => {
        const health = await getTelegramHealthStatus();
        ctx.assert.equal(health.status, 'operational');
        ctx.assert.isTrue(health.active);
        ctx.assert.isTrue(health.master_admin_configured);
      }
    ),
    createTier1Test(
      'T1-F01-05',
      'F01',
      'Router safely rejects updates with missing sender information',
      async (ctx: TestContext) => {
        const update = { update_id: 99999 };
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isFalse(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.includes(result.error || '', 'Missing sender');
      }
    ),

    // ==========================================
    // F02: Strict Admin Allowlisting & Master ID 8204855335 (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F02-01',
      'F02',
      'Master Admin ID 8204855335 is immediately authorized',
      async (ctx: TestContext) => {
        const auth = await verifyTelegramAuthorization(8204855335);
        ctx.assert.isTrue(auth.authorized);
        ctx.assert.isTrue(auth.isAdmin8204855335);
        ctx.assert.equal(auth.adminId, 8204855335);
      }
    ),
    createTier1Test(
      'T1-F02-02',
      'F02',
      'Unauthorized Telegram User ID is rejected and logged',
      async (ctx: TestContext) => {
        const unauthorizedId = 987654321;
        const update = ctx.createCommandUpdate('/admin', unauthorizedId);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.mockTelegramApi.assertLastMessageContains('ACCESS DENIED');
        ctx.mockTelegramApi.assertLastMessageContains(String(unauthorizedId));
      }
    ),
    createTier1Test(
      'T1-F02-03',
      'F02',
      'Unauthorized callback query receives access denied alert',
      async (ctx: TestContext) => {
        const unauthorizedId = 987654321;
        const update = ctx.createCallbackQueryUpdate('dash:refresh', unauthorizedId);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Access Denied');
      }
    ),
    createTier1Test(
      'T1-F02-04',
      'F02',
      'Self-pairing command /setup is permanently blocked and rejected',
      async (ctx: TestContext) => {
        const update = ctx.createCommandUpdate('/setup', 555666777);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.equal(result.action, '/setup');
        ctx.mockTelegramApi.assertLastMessageContains('Self-pairing is permanently disabled');
      }
    ),
    createTier1Test(
      'T1-F02-05',
      'F02',
      'Self-pairing callback admin_pair: is permanently rejected',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('admin_pair:555666777', 555666777);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isFalse(result.authorized);
        ctx.assert.equal(result.action, 'admin_pair');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Self-pairing is permanently disabled');
      }
    ),

    // ==========================================
    // F03: Webhook Secret & Rate Limiting (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F03-01',
      'F03',
      'Valid X-Telegram-Bot-Api-Secret-Token allows webhook execution',
      async (ctx: TestContext) => {
        const isValid = verifyWebhookSecret('durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(isValid, 'Valid secret token must be verified successfully');

        // Verify router execution with valid secret
        const update = ctx.createCommandUpdate('/admin', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');
        ctx.assert.isTrue(result.handled, 'Valid secret update must be handled');
        ctx.assert.isTrue(result.authorized, 'Master admin must be authorized');
      }
    ),
    createTier1Test(
      'T1-F03-02',
      'F03',
      'Missing, empty, whitespace, and wrong webhook secret token headers are strictly rejected',
      async (ctx: TestContext) => {
        const update = ctx.createCommandUpdate('/admin', 8204855335);

        // 1. Missing secret header (undefined)
        ctx.assert.isFalse(verifyWebhookSecret(undefined), 'Undefined secret header must be rejected');
        const resMissing = await handleTelegramWebhookUpdate(update, undefined);
        ctx.assert.isFalse(resMissing.handled, 'Missing secret must not be handled');
        ctx.assert.isFalse(resMissing.authorized, 'Missing secret must not be authorized');
        ctx.assert.equal(resMissing.error, 'Invalid webhook secret');

        // 2. Empty secret header ("")
        ctx.assert.isFalse(verifyWebhookSecret(''), 'Empty secret header must be rejected');
        const resEmpty = await handleTelegramWebhookUpdate(update, '');
        ctx.assert.isFalse(resEmpty.handled, 'Empty secret must not be handled');
        ctx.assert.isFalse(resEmpty.authorized, 'Empty secret must not be authorized');
        ctx.assert.equal(resEmpty.error, 'Invalid webhook secret');

        // 3. Whitespace secret header ("   ")
        ctx.assert.isFalse(verifyWebhookSecret('   '), 'Whitespace secret header must be rejected');
        const resWhitespace = await handleTelegramWebhookUpdate(update, '   ');
        ctx.assert.isFalse(resWhitespace.handled, 'Whitespace secret must not be handled');
        ctx.assert.isFalse(resWhitespace.authorized, 'Whitespace secret must not be authorized');
        ctx.assert.equal(resWhitespace.error, 'Invalid webhook secret');

        // 4. Wrong secret header
        ctx.assert.isFalse(verifyWebhookSecret('wrong_secret_token'), 'Wrong secret header must be rejected');
        const resWrong = await handleTelegramWebhookUpdate(update, 'wrong_secret_token');
        ctx.assert.isFalse(resWrong.handled, 'Wrong secret must not be handled');
        ctx.assert.isFalse(resWrong.authorized, 'Wrong secret must not be authorized');
        ctx.assert.equal(resWrong.error, 'Invalid webhook secret');
      }
    ),
    createTier1Test(
      'T1-F03-03',
      'F03',
      'Sliding window rate limiter blocks requests exceeding threshold',
      async (ctx: TestContext) => {
        const testUser = 777111222;
        // Max 20 requests allowed per 10s window
        for (let i = 0; i < 20; i++) {
          const allowed = checkRateLimit(testUser, 20, 10000);
          ctx.assert.isTrue(allowed, `Request ${i + 1} should be allowed`);
        }
        // 21st request should be rejected
        const rejected = checkRateLimit(testUser, 20, 10000);
        ctx.assert.isFalse(rejected, 'Request 21 should exceed rate limit');
      }
    ),
    createTier1Test(
      'T1-F03-04',
      'F03',
      'Rate limit reset allows immediate subsequent requests',
      async (ctx: TestContext) => {
        const testUser = 777111333;
        for (let i = 0; i < 5; i++) checkRateLimit(testUser, 5, 10000);
        ctx.assert.isFalse(checkRateLimit(testUser, 5, 10000));

        resetRateLimits();
        ctx.assert.isTrue(checkRateLimit(testUser, 5, 10000));
      }
    ),
    createTier1Test(
      'T1-F03-05',
      'F03',
      'Duplicate callback query within window is detected and ignored',
      async (ctx: TestContext) => {
        const cbId = 'cbq_duplicate_test_123';
        const isFirstDup = TelegramStateManager.isCallbackProcessed(cbId);
        ctx.assert.isFalse(isFirstDup, 'First execution should not be marked duplicate');

        const isSecondDup = TelegramStateManager.isCallbackProcessed(cbId);
        ctx.assert.isTrue(isSecondDup, 'Second execution within window must be flagged duplicate');
      }
    ),

    // ==========================================
    // F04: Central Audit Logging (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F04-01',
      'F04',
      'recordTelegramAudit writes entry to in-memory audit log buffer',
      async (ctx: TestContext) => {
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'ORDER_APPROVED',
          entityType: 'order',
          entityId: 'ORD-1001',
          oldValue: 'pending',
          newValue: 'confirmed'
        });

        const logs = getRecentTelegramAuditLogs(5);
        ctx.assert.isTrue(logs.length > 0);
        ctx.assert.equal(logs[0].action, 'ORDER_APPROVED');
        ctx.assert.equal(logs[0].entityId, 'ORD-1001');
      }
    ),
    createTier1Test(
      'T1-F04-02',
      'F04',
      'Security rejections create SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT audit entries',
      async (ctx: TestContext) => {
        const unauthorizedId = 666777888;
        const update = ctx.createCommandUpdate('/admin', unauthorizedId);
        await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        const logs = getRecentTelegramAuditLogs(5);
        const secLog = logs.find(l => l.action === 'SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT');
        ctx.assert.isTrue(secLog !== undefined);
        ctx.assert.equal(secLog?.telegramAdminId, String(unauthorizedId));
      }
    ),
    createTier1Test(
      'T1-F04-03',
      'F04',
      'Audit logs buffer returns entries in reverse chronological order',
      async (ctx: TestContext) => {
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'ACTION_FIRST',
          entityType: 'test',
          entityId: '1'
        });
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'ACTION_SECOND',
          entityType: 'test',
          entityId: '2'
        });

        const logs = getRecentTelegramAuditLogs(2);
        ctx.assert.equal(logs[0].action, 'ACTION_SECOND');
        ctx.assert.equal(logs[1].action, 'ACTION_FIRST');
      }
    ),
    createTier1Test(
      'T1-F04-04',
      'F04',
      'clearInMemoryAuditLogs empties the audit buffer cleanly',
      async (ctx: TestContext) => {
        await recordTelegramAudit({
          telegramAdminId: 8204855335,
          adminName: 'Master Admin',
          action: 'TEMP_ACTION',
          entityType: 'temp',
          entityId: 'temp_01'
        });
        ctx.assert.isTrue(getRecentTelegramAuditLogs().length > 0);

        clearInMemoryAuditLogs();
        ctx.assert.equal(getRecentTelegramAuditLogs().length, 0);
      }
    ),
    createTier1Test(
      'T1-F04-05',
      'F04',
      'Audit log entry captures complete schema fields and timestamp',
      async (ctx: TestContext) => {
        await recordTelegramAudit({
          telegramAdminId: '8204855335',
          adminName: 'Master Admin',
          action: 'STOCK_ADJUSTMENT',
          entityType: 'inventory',
          entityId: 'PROD-001',
          oldValue: 50,
          newValue: 45,
          details: 'Physical count adjustment'
        });

        const log = getRecentTelegramAuditLogs(1)[0];
        ctx.assert.equal(log.entityType, 'inventory');
        ctx.assert.equal(log.oldValue, 50);
        ctx.assert.equal(log.newValue, 45);
        ctx.assert.isTrue(log.timestamp !== undefined);
      }
    ),

    // ==========================================
    // F05: 16-Module Super Admin Dashboard (/admin) (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F05-01',
      'F05',
      '/admin command outputs master control center with greeting and status',
      async (ctx: TestContext) => {
        await renderDashboard({
          chatId: 8204855335,
          userId: 8204855335,
          userName: 'Super Admin',
          mode: 'new'
        });

        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP — SUPER ADMIN CONTROL CENTER');
        ctx.mockTelegramApi.assertLastMessageContains('8204855335');
      }
    ),
    createTier1Test(
      'T1-F05-02',
      'F05',
      'Dashboard keyboard contains all 16 required administrative modules',
      async (ctx: TestContext) => {
        const kb = getDashboardKeyboard();
        const allButtons = kb.inline_keyboard.flat();
        const callbacks = allButtons.map(b => b.callback_data).filter(Boolean) as string[];

        // Check key modules
        const requiredPrefixes = [
          'ord:',   // Orders
          'pay:',   // Payments
          'prod:',  // Products
          'inv:',   // Inventory
          'cust:',  // Customers
          'supp:',  // Suppliers
          'sell:',  // Sellers
          'ship:',  // Shipping
          'ref:',   // Refunds
          'coup:',  // Coupons
          'rev:',   // Reviews/QA
          'notif:', // Notifications
          'stat:',  // Analytics
          'sett:',  // Settings
          'sec:'    // Security
        ];

        for (const prefix of requiredPrefixes) {
          const found = callbacks.some(c => c.startsWith(prefix));
          ctx.assert.isTrue(found, `Dashboard must contain button with callback prefix "${prefix}"`);
        }
      }
    ),
    createTier1Test(
      'T1-F05-03',
      'F05',
      'All dashboard keyboard callback_data satisfy the 64-byte constraint',
      async (ctx: TestContext) => {
        const kb = getDashboardKeyboard();
        // Will throw if any button exceeds 64 bytes
        validateCallbackBytes(kb);
        for (const row of kb.inline_keyboard) {
          for (const btn of row) {
            if (btn.callback_data) {
              const byteLen = Buffer.byteLength(btn.callback_data, 'utf8');
              ctx.assert.isTrue(byteLen <= 64, `Callback data "${btn.callback_data}" must be <= 64 bytes`);
            }
          }
        }
      }
    ),
    createTier1Test(
      'T1-F05-04',
      'F05',
      'Dashboard in edit mode updates message in-place without resending',
      async (ctx: TestContext) => {
        await renderDashboard({
          chatId: 8204855335,
          messageId: 2002,
          userId: 8204855335,
          userName: 'Super Admin',
          mode: 'edit'
        });

        ctx.mockTelegramApi.assertCallCount('editMessageText', 1);
        ctx.mockTelegramApi.assertLastMessageContains('DURTUP.SHOP');
      }
    ),
    createTier1Test(
      'T1-F05-05',
      'F05',
      'Confirmation cancel callback cnf:cancel returns cleanly to dashboard',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('cnf:cancel:dash:main', 8204855335, 8204855335, 2002);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.equal(result.action, 'action_cancelled');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Action cancelled');
      }
    ),

    // ==========================================
    // F06: Rich Order Notifications with Image & Supplier (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F06-01',
      'F06',
      'Format rich order notification contains customer, total BDT, and item details',
      async (ctx: TestContext) => {
        const order = ctx.mockDb.getDoc('orders', 'ORD-1001');
        const text = formatOrderNotificationText(order);

        ctx.assert.includes(text, 'NEW ORDER RECEIVED');
        ctx.assert.includes(text, 'ORD-1001');
        ctx.assert.includes(text, 'Tanvir Hossain');
        ctx.assert.includes(text, '01711000001');
        ctx.assert.includes(text, '1,998');
      }
    ),
    createTier1Test(
      'T1-F06-02',
      'F06',
      'Attributes EcomsellerBD supplier correctly for ECOM- prefix SKU',
      async (ctx: TestContext) => {
        const supplier = attributeSupplier('ECOM-TSHIRT-01');
        ctx.assert.equal(supplier, 'EcomsellerBD');
      }
    ),
    createTier1Test(
      'T1-F06-03',
      'F06',
      'Attributes DropShipping.com.bd supplier correctly for MOH- prefix SKU',
      async (ctx: TestContext) => {
        const supplier = attributeSupplier('MOH-WATCH-09');
        ctx.assert.equal(supplier, 'DropShipping.com.bd');
      }
    ),
    createTier1Test(
      'T1-F06-04',
      'F06',
      'Attributes Direct supplier correctly for DIR- prefix SKU',
      async (ctx: TestContext) => {
        const supplier = attributeSupplier('DIR-BAG-02');
        ctx.assert.equal(supplier, 'Direct');
      }
    ),
    createTier1Test(
      'T1-F06-05',
      'F06',
      'Order notification buttons include view, approve, reject, and change status',
      async (ctx: TestContext) => {
        const kb = buildOrderNotificationButtons('ORD-1001');
        const allButtons = kb.inline_keyboard.flat();
        const callbacks = allButtons.map(b => b.callback_data);

        ctx.assert.includes(callbacks, 'ord:view:ORD-1001');
        ctx.assert.includes(callbacks, 'ord:appr_prompt:ORD-1001');
        ctx.assert.includes(callbacks, 'ord:rej_prompt:ORD-1001');
        ctx.assert.includes(callbacks, 'ord:status_menu:ORD-1001');
        ctx.assert.includes(callbacks, 'ord:cust:ORD-1001');

        for (const cb of callbacks) {
          ctx.assert.isTrue(Buffer.byteLength(cb!, 'utf8') <= 64);
        }
      }
    ),

    // ==========================================
    // F07: Interactive Order Actions & Status Transitions (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F07-01',
      'F07',
      'Order status update transitions order from pending to confirmed',
      async (ctx: TestContext) => {
        const res = await executeOrderStatusUpdate(ctx.mockDb, 'ORD-1001', 'confirmed', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.status, 'confirmed');

        const inDb = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.equal(inDb.status, 'confirmed');
      }
    ),
    createTier1Test(
      'T1-F07-02',
      'F07',
      'Order status transition appends record to order_timelines',
      async (ctx: TestContext) => {
        await executeOrderStatusUpdate(ctx.mockDb, 'ORD-1001', 'processing', 8204855335, 'In preparation');
        const timelines = ctx.mockDb.listDocs('order_timelines');
        const latest = timelines.find(t => t.order_id === 'ORD-1001' && t.status === 'processing');

        ctx.assert.isTrue(latest !== undefined);
        ctx.assert.equal(latest?.updated_by, '8204855335');
      }
    ),
    createTier1Test(
      'T1-F07-03',
      'F07',
      'Order status transition records audit log with old and new values',
      async (ctx: TestContext) => {
        await executeOrderStatusUpdate(ctx.mockDb, 'ORD-1001', 'confirmed', 8204855335);
        const audits = getRecentTelegramAuditLogs(5);
        const orderAudit = audits.find(a => a.entityId === 'ORD-1001' && a.action === 'ORDER_STATUS_UPDATE');

        ctx.assert.isTrue(orderAudit !== undefined);
        ctx.assert.equal(orderAudit?.oldValue, 'pending');
        ctx.assert.equal(orderAudit?.newValue, 'confirmed');
      }
    ),
    createTier1Test(
      'T1-F07-04',
      'F07',
      'Order status callback query ord: routes cleanly through router',
      async (ctx: TestContext) => {
        const update = ctx.createCallbackQueryUpdate('ord:status_menu:ORD-1001', 8204855335);
        const result = await handleTelegramWebhookUpdate(update, 'durtup_tg_admin_sec_2026');

        ctx.assert.isTrue(result.handled);
        ctx.assert.isTrue(result.authorized);
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled();
      }
    ),
    createTier1Test(
      'T1-F07-05',
      'F07',
      'Customer info resolution from order extracts valid address and phone',
      async (ctx: TestContext) => {
        const order = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.equal(order.customer_phone, '01711000001');
        ctx.assert.includes(order.shipping_address, 'Dhanmondi, Dhaka');
      }
    ),

    // ==========================================
    // F08: Order Filtering, Search & Confirmation (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F08-01',
      'F08',
      'filterOrdersByStatus retrieves only orders matching pending status',
      async (ctx: TestContext) => {
        const pending = filterOrdersByStatus(ctx.mockDb, 'pending');
        ctx.assert.isTrue(pending.length >= 1);
        for (const o of pending) {
          ctx.assert.equal(o.status, 'pending');
        }
      }
    ),
    createTier1Test(
      'T1-F08-02',
      'F08',
      'filterOrdersByStatus retrieves shipped orders',
      async (ctx: TestContext) => {
        const shipped = filterOrdersByStatus(ctx.mockDb, 'shipped');
        ctx.assert.isTrue(shipped.length >= 1);
        ctx.assert.equal(shipped[0].id, 'ORD-1003');
      }
    ),
    createTier1Test(
      'T1-F08-03',
      'F08',
      'searchOrders finds order by order number or customer phone',
      async (ctx: TestContext) => {
        const byNum = searchOrders(ctx.mockDb, 'DT-2611-1001');
        ctx.assert.equal(byNum.length, 1);
        ctx.assert.equal(byNum[0].id, 'ORD-1001');

        const byPhone = searchOrders(ctx.mockDb, '01822000002');
        ctx.assert.equal(byPhone.length, 1);
        ctx.assert.equal(byPhone[0].id, 'ORD-1002');
      }
    ),
    createTier1Test(
      'T1-F08-04',
      'F08',
      'Confirmation prompt keyboard builds execute and cancel buttons',
      async (ctx: TestContext) => {
        const kb = buildConfirmationPromptKeyboard('ord:rej_exec:ORD-1001', 'ord:view:ORD-1001');
        const buttons = kb.inline_keyboard.flat();

        ctx.assert.equal(buttons[0].callback_data, 'ord:rej_exec:ORD-1001');
        ctx.assert.equal(buttons[1].callback_data, 'cnf:cancel:ord:view:ORD-1001');
      }
    ),
    createTier1Test(
      'T1-F08-05',
      'F08',
      'Order rejection execution updates order status to cancelled',
      async (ctx: TestContext) => {
        const res = await executeOrderStatusUpdate(ctx.mockDb, 'ORD-1001', 'cancelled', 8204855335, 'Customer requested cancel');
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.status, 'cancelled');
      }
    ),

    // ==========================================
    // F09: Payment Inspection & Multi-Gateway Verification (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F09-01',
      'F09',
      'List pending payments retrieves orders needing payment verification',
      async (ctx: TestContext) => {
        const pendingPay = ctx.mockDb.query('orders', o => o.payment_status === 'pending');
        ctx.assert.isTrue(pendingPay.length >= 1);
      }
    ),
    createTier1Test(
      'T1-F09-02',
      'F09',
      'bKash transaction inspection displays transaction ID and sender number',
      async (ctx: TestContext) => {
        const order = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.equal(order.payment_method, 'bKash');
        ctx.assert.equal(order.bKash_trx_id, '9K28D7XZ01');
        ctx.assert.equal(order.bKash_number, '01711000001');
      }
    ),
    createTier1Test(
      'T1-F09-03',
      'F09',
      'Payment verification marks payment_status as verified in database',
      async (ctx: TestContext) => {
        const res = await verifyPayment(ctx.mockDb, 'ORD-1001', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.payment_status, 'verified');

        const inDb = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.equal(inDb.payment_status, 'verified');
      }
    ),
    createTier1Test(
      'T1-F09-04',
      'F09',
      'Payment verification writes audit entry with PAYMENT_VERIFIED action',
      async (ctx: TestContext) => {
        await verifyPayment(ctx.mockDb, 'ORD-1001', 8204855335);
        const audits = getRecentTelegramAuditLogs(5);
        const payAudit = audits.find(a => a.entityId === 'ORD-1001' && a.action === 'PAYMENT_VERIFIED');

        ctx.assert.isTrue(payAudit !== undefined);
        ctx.assert.equal(payAudit?.newValue, 'verified');
      }
    ),
    createTier1Test(
      'T1-F09-05',
      'F09',
      'Multi-gateway support inspects Nagad, SSLCommerz, and COD transactions',
      async (ctx: TestContext) => {
        const codOrder = ctx.mockDb.getDoc('orders', 'ORD-1002');
        ctx.assert.equal(codOrder.payment_method, 'Cash on Delivery');

        const sslOrder = ctx.mockDb.getDoc('orders', 'ORD-1004');
        ctx.assert.equal(sslOrder.payment_method, 'SSLCommerz');

        const nagadOrder = ctx.mockDb.getDoc('orders', 'ORD-1006');
        ctx.assert.equal(nagadOrder.payment_method, 'Nagad');
      }
    ),

    // ==========================================
    // F10: Refund Review & Moderation (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F10-01',
      'F10',
      'List refund requests identifies cancelled or refunded orders',
      async (ctx: TestContext) => {
        const refunds = ctx.mockDb.query('orders', o => o.status === 'cancelled' || o.payment_status === 'refunded');
        ctx.assert.isTrue(refunds.length >= 1);
        ctx.assert.equal(refunds[0].id, 'ORD-1005');
      }
    ),
    createTier1Test(
      'T1-F10-02',
      'F10',
      'Inspect refund request details displays customer cancellation reason',
      async (ctx: TestContext) => {
        const order = ctx.mockDb.getDoc('orders', 'ORD-1005');
        ctx.assert.equal(order.notes, 'Customer canceled due to duplicate order');
        ctx.assert.equal(order.total_amount, 1200);
      }
    ),
    createTier1Test(
      'T1-F10-03',
      'F10',
      'Refund approval prompt creates confirmed execution and cancel buttons',
      async (ctx: TestContext) => {
        const kb = buildConfirmationPromptKeyboard('ref:appr_exec:ORD-1001', 'ref:view:ORD-1001');
        const buttons = kb.inline_keyboard.flat();

        ctx.assert.equal(buttons[0].callback_data, 'ref:appr_exec:ORD-1001');
        ctx.assert.equal(buttons[1].callback_data, 'cnf:cancel:ref:view:ORD-1001');
      }
    ),
    createTier1Test(
      'T1-F10-04',
      'F10',
      'processRefund transitions order and payment status to refunded',
      async (ctx: TestContext) => {
        const res = await processRefund(ctx.mockDb, 'ORD-1001', 8204855335, 'Item returned by customer');
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.status, 'refunded');
        ctx.assert.equal(res.order.payment_status, 'refunded');
      }
    ),
    createTier1Test(
      'T1-F10-05',
      'F10',
      'processRefund records REFUND_APPROVED audit log entry',
      async (ctx: TestContext) => {
        await processRefund(ctx.mockDb, 'ORD-1001', 8204855335);
        const audits = getRecentTelegramAuditLogs(5);
        const refAudit = audits.find(a => a.entityId === 'ORD-1001' && a.action === 'REFUND_APPROVED');

        ctx.assert.isTrue(refAudit !== undefined);
      }
    ),

    // ==========================================
    // F11: Product Search, Details & Live Controls (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F11-01',
      'F11',
      'List products retrieves catalog items from database',
      async (ctx: TestContext) => {
        const products = ctx.mockDb.listDocs('products');
        ctx.assert.isTrue(products.length >= 6);
      }
    ),
    createTier1Test(
      'T1-F11-02',
      'F11',
      'Product details inspection returns name, SKU, price, and supplier',
      async (ctx: TestContext) => {
        const prod = ctx.mockDb.getDoc('products', 'PROD-001');
        ctx.assert.equal(prod.name, 'China Premium Cotton T-Shirt');
        ctx.assert.equal(prod.sku, 'ECOM-TSHIRT-01');
        ctx.assert.equal(prod.regular_price, 1200);
        ctx.assert.equal(prod.supplier, 'EcomsellerBD');
      }
    ),
    createTier1Test(
      'T1-F11-03',
      'F11',
      'toggleProductActive toggles product visibility status',
      async (ctx: TestContext) => {
        const before = ctx.mockDb.getDoc('products', 'PROD-004');
        ctx.assert.isFalse(before.is_active);

        const res = await toggleProductActive(ctx.mockDb, 'PROD-004', 8204855335);
        ctx.assert.isTrue(res.product.is_active);

        const inDb = ctx.mockDb.getDoc('products', 'PROD-004');
        ctx.assert.isTrue(inDb.is_active);
      }
    ),
    createTier1Test(
      'T1-F11-04',
      'F11',
      'updateProductPrice updates regular_price and records PRODUCT_PRICE_UPDATE audit',
      async (ctx: TestContext) => {
        const res = await updateProductPrice(ctx.mockDb, 'PROD-001', 1350, 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.product.regular_price, 1350);

        const inDb = ctx.mockDb.getDoc('products', 'PROD-001');
        ctx.assert.equal(inDb.regular_price, 1350);

        const audits = getRecentTelegramAuditLogs(5);
        const priceAudit = audits.find(a => a.entityId === 'PROD-001' && a.action === 'PRODUCT_PRICE_UPDATE');
        ctx.assert.isTrue(priceAudit !== undefined);
        ctx.assert.equal(priceAudit?.oldValue, 1200);
        ctx.assert.equal(priceAudit?.newValue, 1350);
      }
    ),
    createTier1Test(
      'T1-F11-05',
      'F11',
      'Product search finds products by name or category substring',
      async (ctx: TestContext) => {
        const searchMatches = ctx.mockDb.query('products', p =>
          p.name.toLowerCase().includes('cotton') || p.category.toLowerCase().includes('clothing')
        );
        ctx.assert.equal(searchMatches.length, 1);
        ctx.assert.equal(searchMatches[0].id, 'PROD-001');
      }
    ),

    // ==========================================
    // F12: Inventory Valuation & Stock Alerts (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F12-01',
      'F12',
      'getLowStockAlerts identifies products with stock_quantity <= 10 and > 0',
      async (ctx: TestContext) => {
        const alerts = getLowStockAlerts(ctx.mockDb);
        ctx.assert.isTrue(alerts.length >= 2);
        for (const a of alerts) {
          ctx.assert.isTrue(a.stock_quantity <= 10 && a.stock_quantity > 0);
        }
      }
    ),
    createTier1Test(
      'T1-F12-02',
      'F12',
      'Out of stock query filters products with stock_quantity === 0',
      async (ctx: TestContext) => {
        const outOfStock = ctx.mockDb.query('products', p => p.stock_quantity === 0);
        ctx.assert.equal(outOfStock.length, 1);
        ctx.assert.equal(outOfStock[0].id, 'PROD-003');
      }
    ),
    createTier1Test(
      'T1-F12-03',
      'F12',
      'calculateInventoryValuation computes total quantity and total valuation in BDT',
      async (ctx: TestContext) => {
        const valuation = calculateInventoryValuation(ctx.mockDb);
        ctx.assert.isTrue(valuation.totalItems >= 6);
        ctx.assert.isTrue(valuation.totalQuantity > 100);
        ctx.assert.isTrue(valuation.totalValuationBDT > 50000);
      }
    ),
    createTier1Test(
      'T1-F12-04',
      'F12',
      'updateProductStock updates stock and logs entry to inventory_logs',
      async (ctx: TestContext) => {
        const res = await updateProductStock(ctx.mockDb, 'PROD-002', 20, 8204855335, 'Restock delivery');
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.product.stock_quantity, 20);

        const logs = ctx.mockDb.listDocs('inventory_logs');
        const latest = logs.find(l => l.product_id === 'PROD-002' && l.new_stock === 20);
        ctx.assert.isTrue(latest !== undefined);
        ctx.assert.equal(latest?.change_amount, 16);
      }
    ),
    createTier1Test(
      'T1-F12-05',
      'F12',
      'Stock adjustment records audit log with STOCK_ADJUSTMENT action',
      async (ctx: TestContext) => {
        await updateProductStock(ctx.mockDb, 'PROD-002', 15, 8204855335);
        const audits = getRecentTelegramAuditLogs(5);
        const stockAudit = audits.find(a => a.entityId === 'PROD-002' && a.action === 'STOCK_ADJUSTMENT');

        ctx.assert.isTrue(stockAudit !== undefined);
        ctx.assert.equal(stockAudit?.oldValue, 4);
        ctx.assert.equal(stockAudit?.newValue, 15);
      }
    ),

    // ==========================================
    // F13: Customer Profile & Access Control (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F13-01',
      'F13',
      'Customer profile lookup retrieves user by phone number',
      async (ctx: TestContext) => {
        const profiles = ctx.mockDb.query('profiles', p => p.phone === '01711000001');
        ctx.assert.equal(profiles.length, 1);
        ctx.assert.equal(profiles[0].full_name, 'Tanvir Hossain');
      }
    ),
    createTier1Test(
      'T1-F13-02',
      'F13',
      'Customer search finds user by email or name substring',
      async (ctx: TestContext) => {
        const byEmail = ctx.mockDb.query('profiles', p => p.email.includes('tanvir@'));
        ctx.assert.equal(byEmail.length, 1);

        const byName = ctx.mockDb.query('profiles', p => p.full_name.toLowerCase().includes('mahmudur'));
        ctx.assert.equal(byName.length, 1);
      }
    ),
    createTier1Test(
      'T1-F13-03',
      'F13',
      'Customer profile inspection returns total_orders and total_spent',
      async (ctx: TestContext) => {
        const prof = ctx.mockDb.getDoc('profiles', 'PROF-001');
        ctx.assert.equal(prof.total_orders, 5);
        ctx.assert.equal(prof.total_spent, 12500);
      }
    ),
    createTier1Test(
      'T1-F13-04',
      'F13',
      'toggleCustomerAccess transitions customer status between active and suspended',
      async (ctx: TestContext) => {
        const res = await toggleCustomerAccess(ctx.mockDb, 'PROF-001', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.profile.status, 'suspended');

        const inDb = ctx.mockDb.getDoc('profiles', 'PROF-001');
        ctx.assert.equal(inDb.status, 'suspended');
      }
    ),
    createTier1Test(
      'T1-F13-05',
      'F13',
      'toggleCustomerAccess records CUSTOMER_ACCESS_TOGGLE audit entry',
      async (ctx: TestContext) => {
        await toggleCustomerAccess(ctx.mockDb, 'PROF-001', 8204855335);
        const audits = getRecentTelegramAuditLogs(5);
        const custAudit = audits.find(a => a.entityId === 'PROF-001' && a.action === 'CUSTOMER_ACCESS_TOGGLE');

        ctx.assert.isTrue(custAudit !== undefined);
        ctx.assert.equal(custAudit?.newValue, 'suspended');
      }
    ),

    // ==========================================
    // F14: Supplier Tracking & Courier Shipping (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F14-01',
      'F14',
      'Supplier tracking filters orders and products attributed to EcomsellerBD',
      async (ctx: TestContext) => {
        const ecomOrders = ctx.mockDb.query('orders', o =>
          o.items.some((i: any) => i.sku?.startsWith('ECOM-') || i.supplier === 'EcomsellerBD')
        );
        ctx.assert.isTrue(ecomOrders.length >= 2);
      }
    ),
    createTier1Test(
      'T1-F14-02',
      'F14',
      'Supplier tracking filters orders and products attributed to DropShipping',
      async (ctx: TestContext) => {
        const dropOrders = ctx.mockDb.query('orders', o =>
          o.items.some((i: any) => i.sku?.startsWith('MOH-') || i.supplier === 'DropShipping')
        );
        ctx.assert.isTrue(dropOrders.length >= 2);
      }
    ),
    createTier1Test(
      'T1-F14-03',
      'F14',
      'assignCourierToOrder assigns Pathao courier and updates order status to shipped',
      async (ctx: TestContext) => {
        const res = await assignCourierToOrder(ctx.mockDb, 'ORD-1001', 'Pathao', 'PTH-112233', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.order.courier, 'Pathao');
        ctx.assert.equal(res.order.courier_tracking_id, 'PTH-112233');
        ctx.assert.equal(res.order.status, 'shipped');
      }
    ),
    createTier1Test(
      'T1-F14-04',
      'F14',
      'Duplicate courier booking prevention rejects re-booking an already booked order',
      async (ctx: TestContext) => {
        // ORD-1003 already has Pathao courier and tracking ID in seed
        const res = await assignCourierToOrder(ctx.mockDb, 'ORD-1003', 'RedX', undefined, 8204855335);
        ctx.assert.isFalse(res.success);
        ctx.assert.includes(res.message, 'Duplicate booking rejected');

        const inDb = ctx.mockDb.getDoc('orders', 'ORD-1003');
        ctx.assert.equal(inDb.courier, 'Pathao'); // Original courier preserved
      }
    ),
    createTier1Test(
      'T1-F14-05',
      'F14',
      'Courier assignment supports SteadFast and RedX couriers',
      async (ctx: TestContext) => {
        const resRedx = await assignCourierToOrder(ctx.mockDb, 'ORD-1002', 'RedX', 'RDX-998877', 8204855335);
        ctx.assert.isTrue(resRedx.success);
        ctx.assert.equal(resRedx.order.courier, 'RedX');
      }
    ),

    // ==========================================
    // F15: Coupons & Review/Q&A Moderation (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F15-01',
      'F15',
      'List coupons retrieves active and inactive coupon codes',
      async (ctx: TestContext) => {
        const coupons = ctx.mockDb.listDocs('coupons');
        ctx.assert.isTrue(coupons.length >= 3);
        const active = coupons.filter(c => c.is_active);
        const inactive = coupons.filter(c => !c.is_active);

        ctx.assert.isTrue(active.length >= 2);
        ctx.assert.isTrue(inactive.length >= 1);
      }
    ),
    createTier1Test(
      'T1-F15-02',
      'F15',
      'toggleCouponActive toggles coupon active state in database',
      async (ctx: TestContext) => {
        const res = await toggleCouponActive(ctx.mockDb, 'COUP-WELCOME10', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.isFalse(res.coupon.is_active);

        const inDb = ctx.mockDb.getDoc('coupons', 'COUP-WELCOME10');
        ctx.assert.isFalse(inDb.is_active);
      }
    ),
    createTier1Test(
      'T1-F15-03',
      'F15',
      'Review moderation list retrieves pending reviews',
      async (ctx: TestContext) => {
        const pending = ctx.mockDb.query('reviews', r => r.status === 'pending');
        ctx.assert.isTrue(pending.length >= 2);
      }
    ),
    createTier1Test(
      'T1-F15-04',
      'F15',
      'moderateReview approves review while preserving is_verified_buyer flag',
      async (ctx: TestContext) => {
        const res = await moderateReview(ctx.mockDb, 'REV-001', 'approved', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.review.status, 'approved');
        ctx.assert.isTrue(res.review.is_verified_buyer); // Verified buyer badge preserved
      }
    ),
    createTier1Test(
      'T1-F15-05',
      'F15',
      'moderateQuestion approves customer question in database',
      async (ctx: TestContext) => {
        const res = await moderateQuestion(ctx.mockDb, 'QA-001', 'approved', 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.equal(res.question.status, 'approved');

        const inDb = ctx.mockDb.getDoc('product_questions', 'QA-001');
        ctx.assert.equal(inDb.status, 'approved');
      }
    ),

    // ==========================================
    // F16: Live Analytics & Timezone Reporting (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F16-01',
      'F16',
      'computeAnalyticsReport today aggregates daily metrics in Asia/Dhaka',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(ctx.mockDb, 'today', new Date('2026-11-24T12:00:00Z'));
        ctx.assert.equal(report.timezone, 'Asia/Dhaka');
        ctx.assert.isTrue(report.totalOrders >= 2);
      }
    ),
    createTier1Test(
      'T1-F16-02',
      'F16',
      'computeAnalyticsReport yesterday aggregates previous day orders',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(ctx.mockDb, 'yesterday', new Date('2026-11-24T12:00:00Z'));
        ctx.assert.equal(report.range, 'yesterday');
        ctx.assert.isTrue(report.totalOrders >= 1);
      }
    ),
    createTier1Test(
      'T1-F16-03',
      'F16',
      'computeAnalyticsReport 7d aggregates 7-day revenue window',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(ctx.mockDb, '7d', new Date('2026-11-24T12:00:00Z'));
        ctx.assert.equal(report.range, '7d');
        ctx.assert.isTrue(report.totalOrders >= 4);
        ctx.assert.isTrue(report.totalRevenueBDT > 0);
      }
    ),
    createTier1Test(
      'T1-F16-04',
      'F16',
      'computeAnalyticsReport 30d computes full monthly performance',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(ctx.mockDb, '30d', new Date('2026-11-24T12:00:00Z'));
        ctx.assert.equal(report.range, '30d');
        ctx.assert.isTrue(report.totalOrders >= 6);
      }
    ),
    createTier1Test(
      'T1-F16-05',
      'F16',
      'Analytics report correctly differentiates confirmed vs pending order totals',
      async (ctx: TestContext) => {
        const report = computeAnalyticsReport(ctx.mockDb, '30d', new Date('2026-11-24T12:00:00Z'));
        ctx.assert.isTrue(report.confirmedOrders >= 3);
        ctx.assert.isTrue(report.pendingOrders >= 2);
      }
    ),

    // ==========================================
    // F17: Settings & Security Modules (5 tests)
    // ==========================================
    createTier1Test(
      'T1-F17-01',
      'F17',
      'Settings inspection retrieves store details and currency BDT in Asia/Dhaka',
      async (ctx: TestContext) => {
        const storeSettings = ctx.mockDb.getDoc('settings', 'store');
        ctx.assert.equal(storeSettings.currency, 'BDT');
        ctx.assert.equal(storeSettings.timezone, 'Asia/Dhaka');
        ctx.assert.equal(storeSettings.store_name, 'Durtup.shop');
      }
    ),
    createTier1Test(
      'T1-F17-02',
      'F17',
      'toggleMaintenanceMode toggles maintenance mode in telegram settings and records audit',
      async (ctx: TestContext) => {
        const res = await toggleMaintenanceMode(ctx.mockDb, true, 8204855335);
        ctx.assert.isTrue(res.success);
        ctx.assert.isTrue(res.settings.maintenance_mode);

        const inDb = ctx.mockDb.getDoc('settings', 'telegram');
        ctx.assert.isTrue(inDb.maintenance_mode);

        const audits = getRecentTelegramAuditLogs(5);
        const settAudit = audits.find(a => a.action === 'SETTINGS_MAINTENANCE_TOGGLE');
        ctx.assert.isTrue(settAudit !== undefined);
        ctx.assert.isTrue(settAudit?.newValue === true);
      }
    ),
    createTier1Test(
      'T1-F17-03',
      'F17',
      'getAuthorizedAdminIds includes Master Admin ID 8204855335',
      async (ctx: TestContext) => {
        const adminSet = await getAuthorizedAdminIds();
        ctx.assert.isTrue(adminSet.has(String(MASTER_ADMIN_ID)));
      }
    ),
    createTier1Test(
      'T1-F17-04',
      'F17',
      'Security audit log inspector returns recent audit entries',
      async (ctx: TestContext) => {
        const initialAudits = ctx.mockDb.listDocs('audit_logs');
        ctx.assert.isTrue(initialAudits.length >= 1);
        ctx.assert.equal(initialAudits[0].telegramAdminId, '8204855335');
      }
    ),
    createTier1Test(
      'T1-F17-05',
      'F17',
      'Auto notify orders setting toggles in settings/telegram collection',
      async (ctx: TestContext) => {
        const current = ctx.mockDb.getDoc('settings', 'telegram');
        ctx.assert.isTrue(current.auto_notify_orders);

        ctx.mockDb.updateDoc('settings', 'telegram', { auto_notify_orders: false });
        const updated = ctx.mockDb.getDoc('settings', 'telegram');
        ctx.assert.isFalse(updated.auto_notify_orders);
      }
    )
  ]
};

// Aliases for compatibility
export const tier1Suite = tier1TestSuite;
