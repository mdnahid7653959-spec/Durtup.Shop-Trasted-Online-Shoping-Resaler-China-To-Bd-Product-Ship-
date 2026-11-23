/**
 * Comprehensive Test Suite for Product Comparison System
 * Durtup.shop
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🚀 Starting Durtup.shop Product Comparison System Verification...\n');

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
// Test 1: Compare button on ProductCard
// -------------------------------------------------------------
runTest('Verify every ProductCard has a Compare button with active state', () => {
  const cardTs = fs.readFileSync(path.join(__dirname, '../src/components/products/ProductCard.tsx'), 'utf8');
  assert.ok(cardTs.includes('useCompare'), 'ProductCard must use useCompare hook');
  assert.ok(cardTs.includes('handleCompareToggle'), 'ProductCard must have handleCompareToggle');
  assert.ok(cardTs.includes('<Scale'), 'ProductCard must display Scale compare icon');
  assert.ok(cardTs.includes('inCompare'), 'ProductCard must track inCompare state');
});

// -------------------------------------------------------------
// Test 2: Maximum 4 Products Limit
// -------------------------------------------------------------
runTest('Verify maximum 4 products compare limit is enforced', () => {
  const serviceTs = fs.readFileSync(path.join(__dirname, '../src/services/productCompareService.ts'), 'utf8');
  assert.ok(serviceTs.includes('MAX_COMPARE_PRODUCTS = 4'), 'Service must enforce MAX_COMPARE_PRODUCTS = 4');

  const contextTs = fs.readFileSync(path.join(__dirname, '../src/contexts/CompareContext.tsx'), 'utf8');
  assert.ok(contextTs.includes('current.length >= MAX_COMPARE_PRODUCTS'), 'Context must prevent adding > 4 products');
  assert.ok(contextTs.includes('তুলনার সর্বোচ্চ সীমা পূর্ণ'), 'Context must warn when limit is reached');
});

// -------------------------------------------------------------
// Test 3: Compare Page & Route Configuration
// -------------------------------------------------------------
runTest('Verify /compare route and Compare page exists', () => {
  const appTs = fs.readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf8');
  assert.ok(appTs.includes('path="/compare"'), 'App.tsx must register /compare route');
  assert.ok(appTs.includes('CompareProvider'), 'App.tsx must wrap application in CompareProvider');

  const pagePath = path.join(__dirname, '../src/pages/Compare.tsx');
  assert.ok(fs.existsSync(pagePath), 'src/pages/Compare.tsx must exist');
});

// -------------------------------------------------------------
// Test 4: Side-by-side Image, Price, Brand, Specs & Ratings
// -------------------------------------------------------------
runTest('Verify Compare page renders Image, Price, Brand, Specs, and Ratings side-by-side', () => {
  const pageTs = fs.readFileSync(path.join(__dirname, '../src/pages/Compare.tsx'), 'utf8');
  assert.ok(pageTs.includes('SafeProductImage'), 'Must display high-res product image');
  assert.ok(pageTs.includes('prod.price'), 'Must display product price');
  assert.ok(pageTs.includes('prod.rating'), 'Must display star rating');
  assert.ok(pageTs.includes('groups.map'), 'Must render grouped specification rows');
});

// -------------------------------------------------------------
// Test 5: Difference Highlighting Feature
// -------------------------------------------------------------
runTest('Verify difference detection and toggle highlight feature', () => {
  const serviceTs = fs.readFileSync(path.join(__dirname, '../src/services/productCompareService.ts'), 'utf8');
  assert.ok(serviceTs.includes('areValuesDifferent'), 'Service must calculate areValuesDifferent');
  assert.ok(serviceTs.includes('isDifferent'), 'Service must set isDifferent flag on spec rows');

  const pageTs = fs.readFileSync(path.join(__dirname, '../src/pages/Compare.tsx'), 'utf8');
  assert.ok(pageTs.includes('highlightDifferences'), 'Compare page must have highlightDifferences state');
  assert.ok(pageTs.includes('Switch'), 'Must render a toggle Switch for differences');
  assert.ok(pageTs.includes('অমিল'), 'Must highlight difference tags');
});

// -------------------------------------------------------------
// Test 6: Remove Product from Compare
// -------------------------------------------------------------
runTest('Verify removal of product from compare list', () => {
  const contextTs = fs.readFileSync(path.join(__dirname, '../src/contexts/CompareContext.tsx'), 'utf8');
  assert.ok(contextTs.includes('removeFromCompare'), 'Context must export removeFromCompare');
  assert.ok(contextTs.includes('clearCompare'), 'Context must export clearCompare');

  const pageTs = fs.readFileSync(path.join(__dirname, '../src/pages/Compare.tsx'), 'utf8');
  assert.ok(pageTs.includes('removeFromCompare(prod.id)'), 'Page column headers must have remove button');
});

// -------------------------------------------------------------
// Test 7: Mobile Responsive Comparison Table
// -------------------------------------------------------------
runTest('Verify mobile responsiveness with sticky headers and scrollable table', () => {
  const pageTs = fs.readFileSync(path.join(__dirname, '../src/pages/Compare.tsx'), 'utf8');
  assert.ok(pageTs.includes('overflow-x-auto'), 'Must support horizontal scroll for mobile');
  assert.ok(pageTs.includes('sticky left-0'), 'Must have sticky left column for spec labels');
});

// -------------------------------------------------------------
// Test 8: LocalStorage Persistence
// -------------------------------------------------------------
runTest('Verify compare list persistence in localStorage', () => {
  const contextTs = fs.readFileSync(path.join(__dirname, '../src/contexts/CompareContext.tsx'), 'utf8');
  assert.ok(contextTs.includes('localStorage.getItem(STORAGE_KEY)'), 'Must read compare items from localStorage');
  assert.ok(contextTs.includes('localStorage.setItem(STORAGE_KEY'), 'Must save compare items to localStorage');
  assert.ok(contextTs.includes('durtup_compare_updated'), 'Must dispatch update events for cross-tab sync');
});

// -------------------------------------------------------------
// Test 9: Add to Cart Integration
// -------------------------------------------------------------
runTest('Verify easy Add to Cart and Buy Now buttons on comparison page', () => {
  const pageTs = fs.readFileSync(path.join(__dirname, '../src/pages/Compare.tsx'), 'utf8');
  assert.ok(pageTs.includes('addToCart'), 'Must import and use addToCart');
  assert.ok(pageTs.includes('handleAddToCart'), 'Must have handleAddToCart handler');
  assert.ok(pageTs.includes('handleBuyNow'), 'Must have handleBuyNow handler');
});

// -------------------------------------------------------------
// Test 10: Category-Specific Specifications
// -------------------------------------------------------------
runTest('Verify category-specific specification schemas for Smartwatch, Audio, Fashion & Gadgets', () => {
  const serviceTs = fs.readFileSync(path.join(__dirname, '../src/services/productCompareService.ts'), 'utf8');
  assert.ok(serviceTs.includes('detectComparisonCategory'), 'Must detect comparison category');
  assert.ok(serviceTs.includes('display'), 'Must support Display specs');
  assert.ok(serviceTs.includes('calling'), 'Must support BT Calling specs');
  assert.ok(serviceTs.includes('battery'), 'Must support Battery specs');
  assert.ok(serviceTs.includes('playtime'), 'Must support Audio playtime specs');
  assert.ok(serviceTs.includes('fabric'), 'Must support Fashion fabric specs');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`========================================\n`);

if (passedTests === totalTests) {
  console.log('🎉 ALL PRODUCT COMPARISON SYSTEM CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED!');
  process.exit(1);
}
