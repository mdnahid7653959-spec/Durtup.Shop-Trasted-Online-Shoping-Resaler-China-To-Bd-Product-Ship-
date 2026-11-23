/**
 * Comprehensive Test Suite for Push Notification System Repair
 * Durtup.shop - E2E Verification
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🚀 Starting Durtup.shop Push Notification System Verification...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${totalTests}: ${name}`);
    console.error(`   Error: ${err.message}\n`);
  }
}

// -------------------------------------------------------------
// Test 1: Service Worker Self-Destruct Removal in index.html
// -------------------------------------------------------------
runTest('Verify index.html does NOT aggressively unregister service workers', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(!indexHtml.includes('regs[i].unregister()'), 'index.html must not contain regs[i].unregister()');
  assert.ok(!indexHtml.includes('Immediate proactive Service Worker unregistration'), 'Legacy destructive unregister header must be removed');
});

// -------------------------------------------------------------
// Test 2: Standard Service Worker (public/sw.js)
// -------------------------------------------------------------
runTest('Verify public/sw.js structure, push listener, and click deep linking', () => {
  const swJs = fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8');
  
  // 1. Must NOT unregister itself
  assert.ok(!swJs.includes('self.registration.unregister()'), 'sw.js must never unregister itself on activate');
  
  // 2. Must handle push events
  assert.ok(swJs.includes("self.addEventListener('push'"), 'sw.js must have push event listener');
  assert.ok(swJs.includes('self.registration.showNotification'), 'sw.js must display notifications');
  
  // 3. Must handle notificationclick events and deep linking
  assert.ok(swJs.includes("self.addEventListener('notificationclick'"), 'sw.js must have notificationclick listener');
  assert.ok(swJs.includes('clients.openWindow'), 'sw.js must open target URL on notification click');
  assert.ok(swJs.includes('client.navigate'), 'sw.js must navigate existing client window');
  
  // 4. Must support vibration and badge
  assert.ok(swJs.includes('vibrate:'), 'sw.js must include mobile vibration pattern');
  assert.ok(swJs.includes('badge:'), 'sw.js must set notification badge');
});

// -------------------------------------------------------------
// Test 3: Firebase Messaging Service Worker (public/firebase-messaging-sw.js)
// -------------------------------------------------------------
runTest('Verify public/firebase-messaging-sw.js exists and is configured for FCM', () => {
  const fcmSwPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
  assert.ok(fs.existsSync(fcmSwPath), 'public/firebase-messaging-sw.js must exist');
  
  const fcmSw = fs.readFileSync(fcmSwPath, 'utf8');
  assert.ok(fcmSw.includes('firebase-app-compat.js'), 'Must load firebase-app-compat.js');
  assert.ok(fcmSw.includes('firebase-messaging-compat.js'), 'Must load firebase-messaging-compat.js');
  assert.ok(fcmSw.includes('messagingSenderId: "18064875571"'), 'Must have correct project messagingSenderId');
  assert.ok(fcmSw.includes('onBackgroundMessage'), 'Must listen for background FCM messages');
  assert.ok(fcmSw.includes("self.addEventListener('notificationclick'"), 'Must handle notification click navigation');
});

// -------------------------------------------------------------
// Test 4: Firebase Client Messaging Export
// -------------------------------------------------------------
runTest('Verify src/integrations/firebase/client.ts exports getFirebaseMessaging and firebaseConfig', () => {
  const clientTs = fs.readFileSync(path.join(__dirname, '../src/integrations/firebase/client.ts'), 'utf8');
  assert.ok(clientTs.includes('getFirebaseMessaging'), 'Must export getFirebaseMessaging function');
  assert.ok(clientTs.includes('isSupported'), 'Must check isSupported() before getMessaging');
  assert.ok(clientTs.includes('firebaseConfig'), 'Must export firebaseConfig');
});

// -------------------------------------------------------------
// Test 5: PushNotificationInitializer Token & Listener Logic
// -------------------------------------------------------------
runTest('Verify PushNotificationInitializer handles FCM token generation, storage & listeners', () => {
  const initTs = fs.readFileSync(path.join(__dirname, '../src/components/PushNotificationInitializer.tsx'), 'utf8');
  assert.ok(initTs.includes('getOrGenerateFCMToken'), 'Must call getOrGenerateFCMToken');
  assert.ok(initTs.includes('getFirebaseMessaging'), 'Must import getFirebaseMessaging');
  assert.ok(initTs.includes('onMessage'), 'Must listen for foreground messages via onMessage');
  assert.ok(initTs.includes('broadcast_notifications'), 'Must listen to broadcast_notifications collection');
  assert.ok(initTs.includes('playNewOrderSound'), 'Must play sound and vibrate');
});

// -------------------------------------------------------------
// Test 6: Unified Push Notification Service (7 Required Types)
// -------------------------------------------------------------
runTest('Verify src/services/notificationService.ts supports all 7 required notification types', () => {
  const serviceTs = fs.readFileSync(path.join(__dirname, '../src/services/notificationService.ts'), 'utf8');
  
  // 1. New Offers
  assert.ok(serviceTs.includes('sendOfferPushNotification'), 'Must support New Offers');
  
  // 2. Flash Sale
  assert.ok(serviceTs.includes('sendFlashSalePushNotification'), 'Must support Flash Sale');
  
  // 3. Order Updates
  assert.ok(serviceTs.includes('sendOrderUpdatePushNotification'), 'Must support Order Updates');
  
  // 4. Cashback Rewards
  assert.ok(serviceTs.includes('sendCashbackAwardNotification'), 'Must support Cashback Rewards');
  
  // 5. Loyalty Points
  assert.ok(serviceTs.includes('sendLoyaltyEarnedNotification'), 'Must support Loyalty Points');
  
  // 6. Back in Stock
  assert.ok(serviceTs.includes('sendBackInStockPushNotification'), 'Must support Back in Stock');
  
  // 7. Price Drop Alerts
  assert.ok(serviceTs.includes('sendPriceDropPushNotification'), 'Must support Price Drop Alerts');
  
  // Helper essentials
  assert.ok(serviceTs.includes('requestNotificationPermission'), 'Must provide permission requester');
  assert.ok(serviceTs.includes('getOrGenerateFCMToken'), 'Must provide token generator');
  assert.ok(serviceTs.includes('dispatchNativePushNotification'), 'Must provide native SW dispatcher');
});

// -------------------------------------------------------------
// Test 7: Integration in Subsystems
// -------------------------------------------------------------
runTest('Verify notifications are wired to loyalty, cashback, back-in-stock & price-drop services', () => {
  const loyaltyTs = fs.readFileSync(path.join(__dirname, '../src/services/loyaltyService.ts'), 'utf8');
  assert.ok(loyaltyTs.includes('sendLoyaltyEarnedNotification'), 'Loyalty service must trigger notification');

  const cashbackTs = fs.readFileSync(path.join(__dirname, '../src/services/cashbackService.ts'), 'utf8');
  assert.ok(cashbackTs.includes('sendCashbackAwardNotification'), 'Cashback service must trigger notification');

  const stockTs = fs.readFileSync(path.join(__dirname, '../src/services/backInStockService.ts'), 'utf8');
  assert.ok(stockTs.includes('sendBackInStockPushNotification'), 'Back-in-stock service must trigger notification');

  const priceTs = fs.readFileSync(path.join(__dirname, '../src/services/priceDropService.ts'), 'utf8');
  assert.ok(priceTs.includes('sendPriceDropPushNotification'), 'Price-drop service must trigger notification');
});

// -------------------------------------------------------------
// Test 8: Admin Push Notifications UI Presets
// -------------------------------------------------------------
runTest('Verify AdminPushNotifications includes templates for all required notification types', () => {
  const adminTs = fs.readFileSync(path.join(__dirname, '../src/pages/admin/AdminPushNotifications.tsx'), 'utf8');
  assert.ok(adminTs.includes('Flash Sale Alert'), 'Admin must have Flash Sale template');
  assert.ok(adminTs.includes('Special Offer / Discount'), 'Admin must have Offers template');
  assert.ok(adminTs.includes('Order Status Update'), 'Admin must have Order Update template');
  assert.ok(adminTs.includes('Cashback Reward Awarded'), 'Admin must have Cashback template');
  assert.ok(adminTs.includes('Loyalty Points Credited'), 'Admin must have Loyalty template');
  assert.ok(adminTs.includes('Back in Stock Alert'), 'Admin must have Back in Stock template');
  assert.ok(adminTs.includes('Price Drop Alert'), 'Admin must have Price Drop template');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log('🎉 ALL PUSH NOTIFICATION AUDIT & REPAIR CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED!');
  process.exit(1);
}
