#!/usr/bin/env node
/**
 * Durtup.shop Telegram Super Admin Control Center
 * Test Runner & Offline Verification Suite
 *
 * Usage:
 *   npx tsx tests/telegram/run_all_tests.ts
 *   npx tsx tests/telegram/run_all_tests.ts --tier=0
 *   npx tsx tests/telegram/run_all_tests.ts --tier=1
 *   npx tsx tests/telegram/run_all_tests.ts --tier=2
 *   npx tsx tests/telegram/run_all_tests.ts --tier=3
 *   npx tsx tests/telegram/run_all_tests.ts --tier=4
 *   npx tsx tests/telegram/run_all_tests.ts --feature=F01
 *   npx tsx tests/telegram/run_all_tests.ts --verbose
 */

import { MockTelegramApi } from './harness/mockTelegramApi';
import { MockDatabase } from './harness/mockDatabase';
import {
  TestCase,
  TestSuite,
  TestResult,
  TestContext,
  TestAssertions,
  TelegramWebhookUpdate
} from './harness/types';

// ==========================================
// Terminal Color Palette & Formatting
// ==========================================
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m'
};

// ==========================================
// Assertion Engine Implementation
// ==========================================
export function createAssertions(): TestAssertions {
  return {
    equal<T>(actual: T, expected: T, message?: string): void {
      if (actual !== expected) {
        throw new Error(
          message || `[Assertion Error] Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
        );
      }
    },
    deepEqual<T>(actual: T, expected: T, message?: string): void {
      const actStr = JSON.stringify(actual);
      const expStr = JSON.stringify(expected);
      if (actStr !== expStr) {
        throw new Error(
          message || `[Assertion Error] Deep equal mismatch:\nExpected: ${expStr}\nActual:   ${actStr}`
        );
      }
    },
    isTrue(value: boolean, message?: string): void {
      if (value !== true) {
        throw new Error(message || `[Assertion Error] Expected true, but got ${JSON.stringify(value)}`);
      }
    },
    isFalse(value: boolean, message?: string): void {
      if (value !== false) {
        throw new Error(message || `[Assertion Error] Expected false, but got ${JSON.stringify(value)}`);
      }
    },
    includes(haystack: string | any[], needle: any, message?: string): void {
      if (typeof haystack === 'string') {
        if (!haystack.includes(String(needle))) {
          throw new Error(
            message || `[Assertion Error] Expected string to contain "${needle}", but got: "${haystack}"`
          );
        }
      } else if (Array.isArray(haystack)) {
        if (!haystack.includes(needle)) {
          throw new Error(
            message || `[Assertion Error] Expected array to include ${JSON.stringify(needle)}`
          );
        }
      } else {
        throw new Error(`[Assertion Error] Haystack is neither string nor array.`);
      }
    },
    notIncludes(haystack: string | any[], needle: any, message?: string): void {
      if (typeof haystack === 'string') {
        if (haystack.includes(String(needle))) {
          throw new Error(
            message || `[Assertion Error] Expected string NOT to contain "${needle}", but it was found in: "${haystack}"`
          );
        }
      } else if (Array.isArray(haystack)) {
        if (haystack.includes(needle)) {
          throw new Error(
            message || `[Assertion Error] Expected array NOT to include ${JSON.stringify(needle)}`
          );
        }
      }
    },
    throws(fn: () => any, expectedMessageOrRegex?: string | RegExp, message?: string): void {
      let threw = false;
      let caughtError: any = null;
      try {
        fn();
      } catch (err: any) {
        threw = true;
        caughtError = err;
      }
      if (!threw) {
        throw new Error(message || `[Assertion Error] Expected function to throw an error, but it did not.`);
      }
      if (expectedMessageOrRegex && caughtError) {
        const errText = caughtError.message || String(caughtError);
        if (typeof expectedMessageOrRegex === 'string') {
          if (!errText.includes(expectedMessageOrRegex)) {
            throw new Error(
              message || `[Assertion Error] Expected thrown error to include "${expectedMessageOrRegex}", but got: "${errText}"`
            );
          }
        } else if (expectedMessageOrRegex instanceof RegExp) {
          if (!expectedMessageOrRegex.test(errText)) {
            throw new Error(
              message || `[Assertion Error] Expected thrown error to match ${expectedMessageOrRegex}, but got: "${errText}"`
            );
          }
        }
      }
    },
    async rejects(promise: Promise<any>, expectedMessageOrRegex?: string | RegExp, message?: string): Promise<void> {
      let threw = false;
      let caughtError: any = null;
      try {
        await promise;
      } catch (err: any) {
        threw = true;
        caughtError = err;
      }
      if (!threw) {
        throw new Error(message || `[Assertion Error] Expected promise to reject, but it resolved.`);
      }
      if (expectedMessageOrRegex && caughtError) {
        const errText = caughtError.message || String(caughtError);
        if (typeof expectedMessageOrRegex === 'string') {
          if (!errText.includes(expectedMessageOrRegex)) {
            throw new Error(
              message || `[Assertion Error] Expected rejection message to include "${expectedMessageOrRegex}", but got: "${errText}"`
            );
          }
        } else if (expectedMessageOrRegex instanceof RegExp) {
          if (!expectedMessageOrRegex.test(errText)) {
            throw new Error(
              message || `[Assertion Error] Expected rejection to match ${expectedMessageOrRegex}, but got: "${errText}"`
            );
          }
        }
      }
    }
  };
}

// ==========================================
// Test Context Factory
// ==========================================
export function createTestContext(api?: MockTelegramApi, db?: MockDatabase): TestContext {
  const mockTelegramApi = api || new MockTelegramApi();
  const mockDb = db || new MockDatabase();
  const assert = createAssertions();

  let updateIdCounter = 500000;

  const createCommandUpdate = (
    command: string,
    userId: number = 8204855335,
    chatId: number = 8204855335,
    username: string = 'master_admin'
  ): TelegramWebhookUpdate => {
    updateIdCounter += 1;
    return {
      update_id: updateIdCounter,
      message: {
        message_id: Math.floor(Math.random() * 100000) + 1000,
        from: {
          id: userId,
          is_bot: false,
          first_name: 'AdminUser',
          username
        },
        chat: {
          id: chatId,
          type: 'private',
          first_name: 'AdminUser',
          username
        },
        date: Math.floor(Date.now() / 1000),
        text: command.startsWith('/') ? command : `/${command}`
      }
    };
  };

  const createCallbackQueryUpdate = (
    callbackData: string,
    userId: number = 8204855335,
    chatId: number = 8204855335,
    messageId: number = 1001
  ): TelegramWebhookUpdate => {
    updateIdCounter += 1;
    return {
      update_id: updateIdCounter,
      callback_query: {
        id: `cbq_${updateIdCounter}_${Date.now().toString(36)}`,
        from: {
          id: userId,
          is_bot: false,
          first_name: 'AdminUser',
          username: 'master_admin'
        },
        message: {
          message_id: messageId,
          from: {
            id: 9052891455,
            is_bot: true,
            first_name: 'DurtupBot'
          },
          chat: {
            id: chatId,
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: 'Menu Options'
        },
        data: callbackData
      }
    };
  };

  const createTextUpdate = (
    text: string,
    userId: number = 8204855335,
    chatId: number = 8204855335
  ): TelegramWebhookUpdate => {
    updateIdCounter += 1;
    return {
      update_id: updateIdCounter,
      message: {
        message_id: Math.floor(Math.random() * 100000) + 1000,
        from: {
          id: userId,
          is_bot: false,
          first_name: 'AdminUser'
        },
        chat: {
          id: chatId,
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text
      }
    };
  };

  return {
    mockTelegramApi,
    mockDb,
    createCommandUpdate,
    createCallbackQueryUpdate,
    createTextUpdate,
    assert
  };
}

// ==========================================
// Tier 0: Harness & Mock Sanity Test Suite
// ==========================================
export const tier0HarnessSanitySuite: TestSuite = {
  tier: 0,
  title: 'Tier 0: Harness & Mock Infrastructure Sanity Verification',
  tests: [
    {
      id: 'T0-API-01',
      feature: 'HARNESS',
      name: 'MockTelegramApi records sendMessage and validates response structure',
      tier: 0,
      run: async (ctx: TestContext) => {
        const res = await ctx.mockTelegramApi.sendMessage(8204855335, 'Hello Admin', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Orders', callback_data: 'ord:list:pending:1' }]]
          }
        });

        ctx.assert.isTrue(res.ok);
        ctx.assert.equal(res.result.chat.id, 8204855335);
        ctx.assert.equal(res.result.text, 'Hello Admin');
        ctx.assert.equal(ctx.mockTelegramApi.calls.length, 1);
        ctx.mockTelegramApi.assertLastMessageContains('Hello Admin');
        ctx.mockTelegramApi.assertLastInlineKeyboardHasCallback('ord:list');
        ctx.mockTelegramApi.assertNoCallbackDataExceeds64Bytes();
      }
    },
    {
      id: 'T0-API-02',
      feature: 'HARNESS',
      name: 'MockTelegramApi records editMessageText and answerCallbackQuery',
      tier: 0,
      run: async (ctx: TestContext) => {
        await ctx.mockTelegramApi.editMessageText('Updated Menu', {
          chat_id: 8204855335,
          message_id: 1002,
          reply_markup: {
            inline_keyboard: [[{ text: 'Back', callback_data: 'dash:main' }]]
          }
        });
        await ctx.mockTelegramApi.answerCallbackQuery('cbq_test_123', {
          text: 'Action Processed',
          show_alert: false
        });

        ctx.mockTelegramApi.assertLastMessageContains('Updated Menu');
        ctx.mockTelegramApi.assertAnswerCallbackQueryCalled('Action Processed');
        ctx.mockTelegramApi.assertCallCount('editMessageText', 1);
        ctx.mockTelegramApi.assertCallCount('answerCallbackQuery', 1);
      }
    },
    {
      id: 'T0-API-03',
      feature: 'HARNESS',
      name: 'MockTelegramApi sendPhoto records URL and caption',
      tier: 0,
      run: async (ctx: TestContext) => {
        await ctx.mockTelegramApi.sendPhoto(8204855335, 'https://example.com/product.jpg', {
          caption: 'China Premium Cotton T-Shirt',
          reply_markup: {
            inline_keyboard: [[{ text: 'Approve', callback_data: 'ord:appr_prompt:ORD-1001' }]]
          }
        });

        ctx.mockTelegramApi.assertPhotoSent('product.jpg', 'Premium Cotton');
        ctx.assert.isTrue(ctx.mockTelegramApi.lastPhoto() !== undefined);
      }
    },
    {
      id: 'T0-API-04',
      feature: 'HARNESS',
      name: 'MockTelegramApi enforces 64-byte callback_data constraint',
      tier: 0,
      run: async (ctx: TestContext) => {
        // String of 70+ characters (> 64 bytes)
        const longCallback = 'ord:status_menu:order_with_extremely_long_identifier_that_definitely_exceeds_64_bytes_limit';
        
        await ctx.assert.rejects(
          ctx.mockTelegramApi.sendMessage(8204855335, 'Test Overflow', {
            reply_markup: {
              inline_keyboard: [[{ text: 'Fail', callback_data: longCallback }]]
            }
          }),
          /exceeds 64 bytes/
        );
      }
    },
    {
      id: 'T0-DB-01',
      feature: 'HARNESS',
      name: 'MockDatabase contains realistic pre-seeded fixtures and Master Admin ID',
      tier: 0,
      run: async (ctx: TestContext) => {
        // Master Admin ID
        const tgSettings = ctx.mockDb.getDoc('settings', 'telegram');
        ctx.assert.isTrue(tgSettings !== null);
        ctx.assert.equal(tgSettings.chat_id, '8204855335');
        ctx.assert.includes(tgSettings.admin_chat_ids, '8204855335');

        // Orders
        const pendingOrder = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.isTrue(pendingOrder !== null);
        ctx.assert.equal(pendingOrder.status, 'pending');
        ctx.assert.equal(pendingOrder.payment_method, 'bKash');
        ctx.assert.equal(pendingOrder.bKash_trx_id, '9K28D7XZ01');
        ctx.assert.includes(pendingOrder.items[0].sku, 'ECOM-');

        // Products
        const inStock = ctx.mockDb.getDoc('products', 'PROD-001');
        ctx.assert.isTrue(inStock.stock_quantity > 10);
        const lowStock = ctx.mockDb.getDoc('products', 'PROD-002');
        ctx.assert.isTrue(lowStock.stock_quantity <= 10 && lowStock.stock_quantity > 0);
        const outOfStock = ctx.mockDb.getDoc('products', 'PROD-003');
        ctx.assert.equal(outOfStock.stock_quantity, 0);

        // Profiles
        const suspendedUser = ctx.mockDb.getDoc('profiles', 'PROF-003');
        ctx.assert.equal(suspendedUser.status, 'suspended');
      }
    },
    {
      id: 'T0-DB-02',
      feature: 'HARNESS',
      name: 'MockDatabase supports CRUD operations and non-destructive queries',
      tier: 0,
      run: async (ctx: TestContext) => {
        // Add doc
        const newProduct = {
          name: 'Temporary Test Product',
          sku: 'TEMP-999',
          regular_price: 500,
          discount_price: null,
          stock_quantity: 15,
          is_active: true,
          category: 'Test',
          created_at: new Date().toISOString()
        };
        const created = ctx.mockDb.addDoc('products', newProduct);
        ctx.assert.isTrue(created.id !== undefined);

        // Update doc
        ctx.mockDb.updateDoc('products', created.id, { regular_price: 550, stock_quantity: 12 });
        const updated = ctx.mockDb.getDoc('products', created.id);
        ctx.assert.equal(updated.regular_price, 550);
        ctx.assert.equal(updated.stock_quantity, 12);

        // Query
        const lowStockProducts = ctx.mockDb.query('products', p => p.stock_quantity <= 10 && p.stock_quantity > 0);
        ctx.assert.isTrue(lowStockProducts.length >= 1);

        // Delete doc
        const deleted = ctx.mockDb.deleteDoc('products', created.id);
        ctx.assert.isTrue(deleted);
        ctx.assert.equal(ctx.mockDb.getDoc('products', created.id), null);
      }
    },
    {
      id: 'T0-DB-03',
      feature: 'HARNESS',
      name: 'MockDatabase snapshot and restore guarantee test isolation',
      tier: 0,
      run: async (ctx: TestContext) => {
        const snap = ctx.mockDb.snapshot();

        // Mutate DB
        ctx.mockDb.deleteDoc('orders', 'ORD-1001');
        ctx.mockDb.updateDoc('products', 'PROD-001', { stock_quantity: 0 });
        ctx.mockDb.addAuditLog({
          telegramAdminId: '8204855335',
          adminName: 'Master Admin',
          action: 'test_mutation',
          entityType: 'test',
          entityId: 'test_01'
        });

        ctx.assert.equal(ctx.mockDb.getDoc('orders', 'ORD-1001'), null);
        ctx.assert.equal(ctx.mockDb.getDoc('products', 'PROD-001').stock_quantity, 0);

        // Restore snapshot
        ctx.mockDb.restore(snap);

        // Verify restoration
        const restoredOrder = ctx.mockDb.getDoc('orders', 'ORD-1001');
        ctx.assert.isTrue(restoredOrder !== null);
        ctx.assert.equal(restoredOrder.status, 'pending');
        ctx.assert.equal(ctx.mockDb.getDoc('products', 'PROD-001').stock_quantity, 50);
      }
    },
    {
      id: 'T0-CTX-01',
      feature: 'HARNESS',
      name: 'TestContext update creator helpers generate compliant TelegramWebhookUpdate structures',
      tier: 0,
      run: async (ctx: TestContext) => {
        // Command update
        const cmdUpdate = ctx.createCommandUpdate('/admin', 8204855335);
        ctx.assert.isTrue(cmdUpdate.update_id > 0);
        ctx.assert.equal(cmdUpdate.message?.text, '/admin');
        ctx.assert.equal(cmdUpdate.message?.from.id, 8204855335);

        // Callback query update
        const cbUpdate = ctx.createCallbackQueryUpdate('dash:main', 8204855335, 8204855335, 2002);
        ctx.assert.isTrue(cbUpdate.update_id > 0);
        ctx.assert.equal(cbUpdate.callback_query?.data, 'dash:main');
        ctx.assert.equal(cbUpdate.callback_query?.from.id, 8204855335);
        ctx.assert.equal(cbUpdate.callback_query?.message?.message_id, 2002);

        // Text update
        const txtUpdate = ctx.createTextUpdate('01711000001', 8204855335);
        ctx.assert.equal(txtUpdate.message?.text, '01711000001');
      }
    }
  ]
};

// ==========================================
// CLI Options Parser
// ==========================================
export interface RunnerOptions {
  tier?: number;
  feature?: string;
  verbose: boolean;
}

export function parseCliOptions(argv: string[]): RunnerOptions {
  const options: RunnerOptions = {
    verbose: false
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg.startsWith('--tier=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val)) options.tier = val;
    } else if (arg.startsWith('--feature=')) {
      options.feature = arg.split('=')[1].trim().toUpperCase();
    }
  }

  return options;
}

// ==========================================
// Test Suite Loader (Dynamic Tier 1-4)
// ==========================================
export async function loadAllSuites(): Promise<TestSuite[]> {
  const suites: TestSuite[] = [tier0HarnessSanitySuite];

  // Try loading Tier 1
  try {
    const tier1Module = await import('./tier1_features.test');
    const tier1 = tier1Module?.tier1TestSuite || tier1Module?.tier1Suite;
    if (tier1) {
      suites.push(tier1);
    }
  } catch (err: any) {
    console.error('[Error loading Tier 1 Suite]:', err);
  }

  // Try loading Tier 2
  try {
    const tier2Module = await import('./tier2_boundaries.test');
    const tier2 = tier2Module?.tier2TestSuite || tier2Module?.tier2Suite;
    if (tier2) {
      suites.push(tier2);
    }
  } catch (err: any) {
    // Module not created yet
  }

  // Try loading Tier 3
  try {
    const tier3Module = await import('./tier3_combos.test');
    if (tier3Module?.tier3Suite) {
      suites.push(tier3Module.tier3Suite);
    }
  } catch (err: any) {
    // Module not created yet
  }

  // Try loading Tier 4
  try {
    const tier4Module = await import('./tier4_scenarios.test');
    if (tier4Module?.tier4Suite) {
      suites.push(tier4Module.tier4Suite);
    }
  } catch (err: any) {
    // Module not created yet
  }

  return suites;
}

// ==========================================
// Test Execution Engine
// ==========================================
export async function runTests(
  suites: TestSuite[],
  options: RunnerOptions
): Promise<{ passed: boolean; results: TestResult[]; durationMs: number }> {
  const startTime = Date.now();
  const results: TestResult[] = [];

  console.log(`\n${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  Durtup.shop Telegram Super Admin Control Center - Test Runner${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}\n`);

  if (options.tier !== undefined) {
    console.log(`${colors.yellow}Filter: Tier ${options.tier}${colors.reset}`);
  }
  if (options.feature) {
    console.log(`${colors.yellow}Filter: Feature ${options.feature}${colors.reset}`);
  }
  if (options.verbose) {
    console.log(`${colors.dim}Mode: Verbose diagnostics enabled${colors.reset}`);
  }

  for (const suite of suites) {
    if (options.tier !== undefined && suite.tier !== options.tier) {
      continue;
    }

    let testsToRun = suite.tests;
    if (options.feature) {
      testsToRun = testsToRun.filter(t => t.feature.toUpperCase() === options.feature);
    }

    if (testsToRun.length === 0) {
      continue;
    }

    console.log(`\n${colors.bold}${colors.blue}--- [Tier ${suite.tier}] ${suite.title} (${testsToRun.length} tests) ---${colors.reset}`);

    for (const test of testsToRun) {
      const ctx = createTestContext();
      const testStart = Date.now();
      let passed = true;
      let errorMsg: string | undefined;

      try {
        await test.run(ctx);
      } catch (err: any) {
        passed = false;
        errorMsg = err.message || String(err);
      }

      const durationMs = Date.now() - testStart;
      const result: TestResult = {
        tier: test.tier,
        feature: test.feature,
        id: test.id,
        name: test.name,
        passed,
        durationMs,
        error: errorMsg
      };
      results.push(result);

      const statusBadge = passed
        ? `${colors.green}✓ PASS${colors.reset}`
        : `${colors.red}✗ FAIL${colors.reset}`;

      const featureTag = `${colors.magenta}[${test.feature}]${colors.reset}`;
      const idTag = `${colors.dim}${test.id}${colors.reset}`;
      console.log(`  ${statusBadge} ${idTag} ${featureTag} ${test.name} ${colors.gray}(${durationMs}ms)${colors.reset}`);

      if (!passed && errorMsg) {
        console.log(`     ${colors.red}Error: ${errorMsg}${colors.reset}`);
        if (options.verbose) {
          console.log(`     ${colors.gray}Mock API Calls Recorded: ${ctx.mockTelegramApi.calls.length}${colors.reset}`);
        }
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  printSummaryTable(results, totalDuration);

  const allPassed = results.length > 0 && results.every(r => r.passed);
  return {
    passed: allPassed,
    results,
    durationMs: totalDuration
  };
}

// ==========================================
// Summary Table Formatter
// ==========================================
function printSummaryTable(results: TestResult[], totalDuration: number): void {
  console.log(`\n${colors.bold}${colors.cyan}==============================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                      EXECUTION SUMMARY                       ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}==============================================================${colors.reset}`);

  // Group by Tier & Feature
  const featureMap = new Map<string, { tier: number; feature: string; total: number; passed: number; duration: number }>();

  for (const r of results) {
    const key = `T${r.tier}-${r.feature}`;
    const existing = featureMap.get(key) || { tier: r.tier, feature: r.feature, total: 0, passed: 0, duration: 0 };
    existing.total += 1;
    if (r.passed) existing.passed += 1;
    existing.duration += r.durationMs;
    featureMap.set(key, existing);
  }

  console.log(
    `${colors.bold}${'Tier'.padEnd(8)} ${'Feature'.padEnd(12)} ${'Passed/Total'.padEnd(16)} ${'Time'.padEnd(10)} ${'Status'.padEnd(8)}${colors.reset}`
  );
  console.log(`${colors.gray}--------------------------------------------------------------${colors.reset}`);

  for (const entry of Array.from(featureMap.values()).sort((a, b) => a.tier - b.tier || a.feature.localeCompare(b.feature))) {
    const status = entry.passed === entry.total
      ? `${colors.green}PASSED${colors.reset}`
      : `${colors.red}FAILED${colors.reset}`;
    console.log(
      `Tier ${String(entry.tier).padEnd(3)} ${entry.feature.padEnd(12)} ${(entry.passed + '/' + entry.total).padEnd(16)} ${(entry.duration + 'ms').padEnd(10)} ${status}`
    );
  }

  const totalCount = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = totalCount - passedCount;

  console.log(`${colors.gray}--------------------------------------------------------------${colors.reset}`);
  console.log(`Total Tests Run:  ${colors.bold}${totalCount}${colors.reset}`);
  console.log(`Passed:           ${colors.green}${passedCount}${colors.reset}`);
  console.log(`Failed:           ${failedCount > 0 ? colors.red : colors.green}${failedCount}${colors.reset}`);
  console.log(`Duration:         ${totalDuration}ms`);

  if (failedCount === 0 && totalCount > 0) {
    console.log(`\n${colors.bgGreen}  ✓ ALL TESTS PASSED SUCCESSFULLY  ${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bgRed}  ✗ TEST RUN COMPLETED WITH FAILURES  ${colors.reset}\n`);
  }
}

// ==========================================
// CLI Invocation Entrypoint
// ==========================================
if (process.argv[1] && (process.argv[1].endsWith('run_all_tests.ts') || process.argv[1].endsWith('run_all_tests.js'))) {
  (async () => {
    const options = parseCliOptions(process.argv);
    const suites = await loadAllSuites();
    const outcome = await runTests(suites, options);
    process.exit(outcome.passed ? 0 : 1);
  })();
}
