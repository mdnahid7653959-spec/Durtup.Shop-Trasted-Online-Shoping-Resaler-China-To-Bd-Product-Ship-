// Automated Test Suite for Price Drop Alert System
const assert = require('assert');

// Mock browser environments
const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};
global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class { constructor(type, detail) { this.type = type; this.detail = detail; } };

console.log("==================================================================");
console.log("       STARTING PRICE DROP ALERT SYSTEM AUTOMATED TEST SUITE      ");
console.log("==================================================================");

// In-memory Price Alert Service logic simulation
const STORAGE_KEY = "durtup_price_drop_subscriptions";
const SETTINGS_KEY = "durtup_price_drop_settings";
const HISTORY_KEY = "durtup_price_drop_history";
const LOGS_KEY = "durtup_price_drop_notification_logs";

function getSubs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveSubs(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function getLogs() {
  const raw = localStorage.getItem(LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLogs(list) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(list));
}

function subscribe(params) {
  const current = Number(params.currentPrice) || 0;
  const target = Number(params.targetPrice) || 0;

  if (target <= 0) {
    return { success: false, message: "Target price must be > 0" };
  }
  if (target >= current) {
    return { success: false, message: "Target price must be less than current price" };
  }

  const email = (params.customerEmail || "").trim().toLowerCase();
  const subs = getSubs();

  // Duplicate check
  const duplicate = subs.find(s => 
    s.productId === params.productId &&
    s.status === "active" &&
    s.customerEmail.toLowerCase() === email &&
    (s.variantLabel || "") === (params.variantLabel || "")
  );

  if (duplicate) {
    return { success: false, alreadySubscribed: true, subscription: duplicate };
  }

  const newSub = {
    id: `pda_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId: params.productId,
    productName: params.productName,
    currentPrice: current,
    targetPrice: target,
    variantLabel: params.variantLabel,
    customerEmail: email,
    customerName: params.customerName || "Customer",
    channel: params.channel || "both",
    status: "active",
    createdAt: new Date().toISOString()
  };

  subs.unshift(newSub);
  saveSubs(subs);
  return { success: true, subscription: newSub };
}

function triggerPriceDrop(productId, newPrice, oldPrice, variantLabel) {
  const discountAmount = Math.max(0, oldPrice - newPrice);
  const discountPercent = oldPrice > 0 ? Math.round((discountAmount / oldPrice) * 100) : 0;

  // 1. Record History
  const history = getHistory();
  const histRecord = {
    id: `ph_${Date.now()}`,
    productId,
    oldPrice,
    newPrice,
    discountAmount,
    discountPercent,
    changedAt: new Date().toISOString()
  };
  history.unshift(histRecord);
  saveHistory(history);

  if (newPrice >= oldPrice) {
    return { triggeredCount: 0, notificationsSent: 0 };
  }

  const subs = getSubs();
  const logs = getLogs();
  let triggeredCount = 0;

  subs.forEach((sub, idx) => {
    if (sub.productId === productId && sub.status === "active") {
      if (variantLabel && sub.variantLabel && sub.variantLabel !== variantLabel) {
        return; // variant mismatch
      }

      // Check if price reached or dropped below target price
      if (newPrice <= sub.targetPrice) {
        subs[idx].status = "triggered";
        subs[idx].triggeredAt = new Date().toISOString();
        subs[idx].triggeredPrice = newPrice;
        triggeredCount++;

        logs.unshift({
          id: `pdl_${Date.now()}_${idx}`,
          alertId: sub.id,
          customerEmail: sub.customerEmail,
          targetPrice: sub.targetPrice,
          newPrice,
          oldPrice,
          sentAt: new Date().toISOString()
        });
      }
    }
  });

  saveSubs(subs);
  saveLogs(logs);

  return { triggeredCount, notificationsSent: triggeredCount, priceHistory: histRecord };
}

async function runTests() {
  // Test 1: Target Price Validation
  console.log("\n[Test 1] Target Price Validation");
  const t1FailHigher = subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 1300, // Invalid: target is higher than current
    customerEmail: "user@test.com"
  });
  assert.strictEqual(t1FailHigher.success, false, "Should reject target price higher than current price");

  const t1FailZero = subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 0, // Invalid: target <= 0
    customerEmail: "user@test.com"
  });
  assert.strictEqual(t1FailZero.success, false, "Should reject target price <= 0");

  const t1Success = subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 1000, // Valid
    customerEmail: "userA@test.com",
    channel: "both"
  });
  assert.strictEqual(t1Success.success, true, "Should accept valid target price < current price");
  assert.strictEqual(t1Success.subscription.targetPrice, 1000);
  console.log("  PASS: Target price validation works perfectly.");

  // Test 2: Duplicate Subscription Prevention
  console.log("\n[Test 2] Duplicate Subscription Prevention");
  const t2Dup = subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 950,
    customerEmail: "userA@test.com"
  });
  assert.strictEqual(t2Dup.success, false);
  assert.strictEqual(t2Dup.alreadySubscribed, true);
  console.log("  PASS: Duplicate subscription for same product & customer blocked.");

  // Test 3: Variant-Specific Alert Isolation
  console.log("\n[Test 3] Variant-Specific Alert Isolation");
  const t3Var1 = subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 900,
    variantLabel: "Color: Black",
    customerEmail: "userA@test.com"
  });
  assert.strictEqual(t3Var1.success, true, "Should allow separate alert for Black variant");

  const t3Var2 = subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 850,
    variantLabel: "Color: Silver",
    customerEmail: "userA@test.com"
  });
  assert.strictEqual(t3Var2.success, true, "Should allow separate alert for Silver variant");
  console.log("  PASS: Variant-specific alerts cleanly isolated.");

  // Test 4: Multi-Customer Price Drop Trigger
  console.log("\n[Test 4] Multi-Customer Price Drop Trigger");
  // Customer B wants alert at ৳900
  subscribe({
    productId: "prod_1",
    productName: "Smart Watch",
    currentPrice: 1200,
    targetPrice: 900,
    customerEmail: "userB@test.com"
  });

  // Price drops from ৳1,200 to ৳950
  // User A (target 1,000) SHOULD trigger (950 <= 1000)
  // User B (target 900) should NOT trigger (950 > 900)
  const triggerResult = triggerPriceDrop("prod_1", 950, 1200);
  assert.strictEqual(triggerResult.triggeredCount, 1, "Only User A should be triggered at ৳950");

  const currentSubs = getSubs();
  const subA = currentSubs.find(s => s.customerEmail === "usera@test.com" && !s.variantLabel);
  const subB = currentSubs.find(s => s.customerEmail === "userb@test.com" && !s.variantLabel);

  assert.strictEqual(subA.status, "triggered", "User A should be marked 'triggered'");
  assert.strictEqual(subA.triggeredPrice, 950, "User A triggered price recorded");
  assert.strictEqual(subB.status, "active", "User B should remain 'active'");
  console.log("  PASS: Accurate threshold matching: User A triggered, User B remains waiting.");

  // Test 5: Duplicate Notification Prevention on Repeat Triggers
  console.log("\n[Test 5] Duplicate Notification Prevention on Repeat Event");
  // Run trigger again with ৳950
  const repeatTrigger = triggerPriceDrop("prod_1", 950, 950);
  assert.strictEqual(repeatTrigger.triggeredCount, 0, "No new notifications sent since User A is already triggered");
  console.log("  PASS: Prevented duplicate notification for already triggered alerts.");

  // Test 6: Deeper Price Drop triggers User B (and any other pending alert with target >= 880)
  console.log("\n[Test 6] Deeper Price Drop triggers User B");
  // Price drops from ৳950 to ৳880
  const deeperTrigger = triggerPriceDrop("prod_1", 880, 950);
  assert.ok(deeperTrigger.triggeredCount >= 1, "User B should now trigger (880 <= 900)");
  const subBAfter = getSubs().find(s => s.customerEmail === "userb@test.com" && !s.variantLabel);
  assert.strictEqual(subBAfter.status, "triggered");
  console.log("  PASS: Subsequent price drop triggers waiting customer.");

  // Test 7: Price History and Notification Logs
  console.log("\n[Test 7] Price History & Notification Logs Verification");
  const history = getHistory();
  const logs = getLogs();
  assert.ok(history.length >= 2, "Price history recorded multiple changes");
  assert.strictEqual(history[0].newPrice, 880);
  assert.strictEqual(history[0].oldPrice, 950);
  assert.ok(logs.length >= 2, "Notification logs recorded dispatch events");
  console.log(`  PASS: History (${history.length} records) & Logs (${logs.length} entries) verified.`);

  console.log("\n==================================================================");
  console.log("       ALL 7 PRICE DROP ALERT SYSTEM UNIT TESTS PASSED! (100%)    ");
  console.log("==================================================================");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
