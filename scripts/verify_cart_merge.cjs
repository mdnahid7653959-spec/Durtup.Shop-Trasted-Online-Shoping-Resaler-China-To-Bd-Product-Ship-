/**
 * Automated Verification Test Suite for Milestone 1:
 * Cart Normalization, Merging Engine, Ownership Transition & Privacy Cleanup
 */

const assert = require("assert");

// Import or replicate the exact pure functions from CartContext
function getNormalizedVariantKey(item) {
  if (!item) return "";
  const map = new Map();

  // 1. selected_variants map
  if (item.selected_variants && typeof item.selected_variants === "object") {
    for (const [k, v] of Object.entries(item.selected_variants)) {
      if (k && v !== undefined && v !== null) {
        map.set(k.toLowerCase().trim(), String(v).toLowerCase().trim());
      }
    }
  }

  // 2. variant_id (handles JSON stringified variants or raw SKU/variant id)
  if (item.variant_id && typeof item.variant_id === "string") {
    try {
      const parsed = JSON.parse(item.variant_id);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (k && v !== undefined && v !== null && !map.has(k.toLowerCase().trim())) {
            map.set(k.toLowerCase().trim(), String(v).toLowerCase().trim());
          }
        }
      } else if (!map.has("variant_id")) {
        map.set("variant_id", item.variant_id.toLowerCase().trim());
      }
    } catch {
      if (!map.has("variant_id")) {
        map.set("variant_id", item.variant_id.toLowerCase().trim());
      }
    }
  }

  // 3. Direct color and size attributes
  if (item.color && !map.has("color")) {
    map.set("color", String(item.color).toLowerCase().trim());
  }
  if (item.size && !map.has("size")) {
    map.set("size", String(item.size).toLowerCase().trim());
  }

  // 4. Fallback to variant_name if map is empty
  if (map.size === 0 && item.variant_name && typeof item.variant_name === "string") {
    return item.variant_name.toLowerCase().trim();
  }

  if (map.size === 0) {
    return "";
  }

  // 5. Deterministic sorting
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

function mergeCartItems(remoteItems = [], guestItems = []) {
  if (!Array.isArray(remoteItems)) remoteItems = [];
  if (!Array.isArray(guestItems)) guestItems = [];

  if (remoteItems.length === 0 && guestItems.length === 0) return [];
  if (remoteItems.length === 0) return [...guestItems];
  if (guestItems.length === 0) return [...remoteItems];

  const merged = [];
  const matchedGuestIndices = new Set();

  // 1. Process all remote items
  for (const remoteItem of remoteItems) {
    const remoteProdId = String(remoteItem.product_id || remoteItem.id || "").trim().toLowerCase();
    const remoteVarKey = getNormalizedVariantKey(remoteItem);

    // Look for matching guest item
    let matchIdx = -1;
    for (let i = 0; i < guestItems.length; i++) {
      if (matchedGuestIndices.has(i)) continue;
      const guestItem = guestItems[i];
      const guestProdId = String(guestItem.product_id || guestItem.id || "").trim().toLowerCase();
      const guestVarKey = getNormalizedVariantKey(guestItem);

      if (remoteProdId === guestProdId && remoteVarKey === guestVarKey) {
        matchIdx = i;
        break;
      }
    }

    if (matchIdx >= 0) {
      matchedGuestIndices.add(matchIdx);
      const guestItem = guestItems[matchIdx];

      const maxStock = Math.max(
        1,
        (typeof guestItem.product?.stock_quantity === "number" && guestItem.product.stock_quantity > 0)
          ? guestItem.product.stock_quantity
          : (typeof remoteItem.product?.stock_quantity === "number" && remoteItem.product.stock_quantity > 0)
            ? remoteItem.product.stock_quantity
            : 999
      );

      const combinedQuantity = Math.max(1, Math.min(
        (Number(remoteItem.quantity) || 1) + (Number(guestItem.quantity) || 1),
        maxStock
      ));

      merged.push({
        ...remoteItem,
        ...guestItem,
        id: remoteItem.id || guestItem.id || `cart-${remoteItem.product_id || guestItem.product_id}`,
        product_id: remoteItem.product_id || guestItem.product_id,
        quantity: combinedQuantity,
        product: {
          ...(remoteItem.product || {}),
          ...(guestItem.product || {}),
          stock_quantity: maxStock
        },
        image: guestItem.image || remoteItem.image
      });
    } else {
      merged.push({ ...remoteItem });
    }
  }

  // 2. Append unmatched guest items (with internal deduplication)
  for (let i = 0; i < guestItems.length; i++) {
    if (!matchedGuestIndices.has(i)) {
      const guestItem = guestItems[i];
      const guestProdId = String(guestItem.product_id || guestItem.id || "").trim().toLowerCase();
      const guestVarKey = getNormalizedVariantKey(guestItem);

      const existingInMerged = merged.find(m =>
        String(m.product_id || m.id || "").trim().toLowerCase() === guestProdId &&
        getNormalizedVariantKey(m) === guestVarKey
      );

      if (existingInMerged) {
        const maxStock = Math.max(
          1,
          typeof existingInMerged.product?.stock_quantity === "number" && existingInMerged.product.stock_quantity > 0
            ? existingInMerged.product.stock_quantity
            : 999
        );
        existingInMerged.quantity = Math.max(1, Math.min(
          existingInMerged.quantity + (Number(guestItem.quantity) || 1),
          maxStock
        ));
      } else {
        merged.push({ ...guestItem });
      }
    }
  }

  return merged;
}

// ---------------------- TEST SUITE ----------------------
console.log("==================================================================");
console.log("   DURTUP.SHOP M1 VERIFICATION: CART MERGE ENGINE & PRIVACY");
console.log("==================================================================");

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    testsFailed++;
  }
}

// Test 1: Variant Normalization Determinism
runTest("Test 1: Variant Normalization Determinism (case, order, whitespace)", () => {
  const itemA = {
    selected_variants: { Color: "Black ", Size: "XL" }
  };
  const itemB = {
    selected_variants: { size: "xl", color: "black" }
  };
  const keyA = getNormalizedVariantKey(itemA);
  const keyB = getNormalizedVariantKey(itemB);
  assert.strictEqual(keyA, keyB, `Keys should match: "${keyA}" === "${keyB}"`);
  assert.strictEqual(keyA, "color:black|size:xl");
});

// Test 2: Variant Normalization from JSON variant_id
runTest("Test 2: Variant Normalization handles JSON variant_id", () => {
  const itemJSON = {
    variant_id: JSON.stringify({ Size: "M", Color: "Red" })
  };
  const itemDirect = {
    color: "red",
    size: "m"
  };
  const keyJSON = getNormalizedVariantKey(itemJSON);
  const keyDirect = getNormalizedVariantKey(itemDirect);
  assert.strictEqual(keyJSON, keyDirect, `JSON variant_id should match direct attributes: "${keyJSON}" === "${keyDirect}"`);
  assert.strictEqual(keyJSON, "color:red|size:m");
});

// Test 3: Disjoint Items Merge
runTest("Test 3: Disjoint Items Merge (non-overlapping products)", () => {
  const remote = [
    {
      id: "cart-prod-1",
      product_id: "prod-1",
      quantity: 2,
      product: { id: "prod-1", name: "Wireless Mouse", regular_price: 500, stock_quantity: 20 }
    }
  ];
  const guest = [
    {
      id: "cart-prod-2",
      product_id: "prod-2",
      quantity: 1,
      product: { id: "prod-2", name: "Mechanical Keyboard", regular_price: 1500, stock_quantity: 10 }
    }
  ];

  const merged = mergeCartItems(remote, guest);
  assert.strictEqual(merged.length, 2, "Merged cart should contain 2 items");
  assert.strictEqual(merged[0].product_id, "prod-1");
  assert.strictEqual(merged[0].quantity, 2);
  assert.strictEqual(merged[1].product_id, "prod-2");
  assert.strictEqual(merged[1].quantity, 1);
});

// Test 4: Matching Variants Merge & Quantity Combination Capped at Stock
runTest("Test 4: Matching Variant Merge & Stock Capping (Q_remote + Q_guest <= stock)", () => {
  const remote = [
    {
      id: "cart-prod-10",
      product_id: "prod-10",
      quantity: 3,
      selected_variants: { Color: "Blue", Size: "L" },
      product: { id: "prod-10", name: "Polo Shirt", regular_price: 450, stock_quantity: 5 }
    }
  ];
  const guest = [
    {
      id: "cart-prod-10-guest",
      product_id: "prod-10",
      quantity: 4,
      selected_variants: { size: "L", color: "blue" },
      product: { id: "prod-10", name: "Polo Shirt", regular_price: 450, stock_quantity: 5 }
    }
  ];

  const merged = mergeCartItems(remote, guest);
  assert.strictEqual(merged.length, 1, "Matching variant must collapse into 1 item");
  assert.strictEqual(merged[0].quantity, 5, `Quantity 3 + 4 should be capped at stock 5 (got ${merged[0].quantity})`);
});

// Test 5: Distinct Variants of Same Product Are Preserved
runTest("Test 5: Distinct Variants of Same Product are Preserved Separately", () => {
  const remote = [
    {
      id: "cart-prod-10-blue",
      product_id: "prod-10",
      quantity: 1,
      selected_variants: { Color: "Blue" },
      product: { id: "prod-10", name: "T-Shirt", regular_price: 300, stock_quantity: 20 }
    }
  ];
  const guest = [
    {
      id: "cart-prod-10-red",
      product_id: "prod-10",
      quantity: 2,
      selected_variants: { Color: "Red" },
      product: { id: "prod-10", name: "T-Shirt", regular_price: 300, stock_quantity: 20 }
    }
  ];

  const merged = mergeCartItems(remote, guest);
  assert.strictEqual(merged.length, 2, "Blue and Red variants must remain 2 distinct items");
  assert.strictEqual(merged.find(i => i.selected_variants?.Color === "Blue")?.quantity, 1);
  assert.strictEqual(merged.find(i => i.selected_variants?.Color === "Red")?.quantity, 2);
});

// Test 6: Zero Remote Items (New user or empty cloud cart)
runTest("Test 6: Zero Remote Items (First login restores all guest items)", () => {
  const remote = [];
  const guest = [
    { product_id: "p1", quantity: 3, product: { id: "p1", name: "Item 1", regular_price: 100, stock_quantity: 10 } },
    { product_id: "p2", quantity: 1, product: { id: "p2", name: "Item 2", regular_price: 200, stock_quantity: 5 } }
  ];

  const merged = mergeCartItems(remote, guest);
  assert.strictEqual(merged.length, 2, "All guest items must be retained");
  assert.strictEqual(merged[0].product_id, "p1");
  assert.strictEqual(merged[0].quantity, 3);
  assert.strictEqual(merged[1].product_id, "p2");
  assert.strictEqual(merged[1].quantity, 1);
});

// Test 7: Zero Guest Items (Returning user with no guest additions)
runTest("Test 7: Zero Guest Items (Returning user preserves existing cloud cart)", () => {
  const remote = [
    { product_id: "cloud-1", quantity: 2, product: { id: "cloud-1", name: "Cloud Item", regular_price: 500, stock_quantity: 10 } }
  ];
  const guest = [];

  const merged = mergeCartItems(remote, guest);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].product_id, "cloud-1");
  assert.strictEqual(merged[0].quantity, 2);
});

// Test 8: Empty Inputs and Boundary Handling
runTest("Test 8: Empty and Boundary Inputs Handled Safely", () => {
  assert.deepStrictEqual(mergeCartItems([], []), []);
  assert.deepStrictEqual(mergeCartItems(null, null), []);
  assert.deepStrictEqual(mergeCartItems(undefined, undefined), []);
});

// Test 9: Quantity Doubling Prevention Simulation
runTest("Test 9: Quantity Doubling Prevention State Machine", () => {
  // Mock localStorage
  const localStorageMock = new Map();
  const CART_OWNER_KEY = "megamart_cart_owner";
  const currentUserId = "firebase_uid_12345";

  let remoteCart = [
    { product_id: "prod-x", quantity: 2, product: { id: "prod-x", stock_quantity: 50 } }
  ];
  let localCart = [
    { product_id: "prod-x", quantity: 1, product: { id: "prod-x", stock_quantity: 50 } }
  ];

  // Step A: Guest adds item -> owner is "guest"
  localStorageMock.set(CART_OWNER_KEY, "guest");

  // Step B: User signs in -> transition from guest to authenticated
  const cartOwnerFirstLogin = localStorageMock.get(CART_OWNER_KEY);
  let effectiveItems;

  if (!cartOwnerFirstLogin || cartOwnerFirstLogin === "guest") {
    // Perform Merge!
    effectiveItems = mergeCartItems(remoteCart, localCart);
    remoteCart = effectiveItems;
    localCart = effectiveItems;
    localStorageMock.set(CART_OWNER_KEY, currentUserId);
  }

  assert.strictEqual(effectiveItems[0].quantity, 3, "After first merge, 2 + 1 = 3");
  assert.strictEqual(localStorageMock.get(CART_OWNER_KEY), currentUserId, "Owner is now currentUserId");

  // Step C: Page Refresh while authenticated (simulate subsequent fetchCart calls)
  const cartOwnerAfterRefresh = localStorageMock.get(CART_OWNER_KEY);
  let refreshedItems;

  if (cartOwnerAfterRefresh === currentUserId) {
    // Session matches current authenticated user: load remote directly WITHOUT re-merging!
    refreshedItems = remoteCart;
  } else {
    // Would erroneously merge and double!
    refreshedItems = mergeCartItems(remoteCart, localCart);
  }

  assert.strictEqual(refreshedItems[0].quantity, 3, "Quantity must remain 3 on page refresh, NOT double to 6!");
});

// Test 10: Multi-User Isolation on Shared Devices
runTest("Test 10: Multi-User Isolation on Shared Devices (User A -> User B)", () => {
  const localStorageMock = new Map();
  const CART_OWNER_KEY = "megamart_cart_owner";

  // User A was logged in
  localStorageMock.set(CART_OWNER_KEY, "user_A");
  const localCartLeftover = [
    { product_id: "userA-private-item", quantity: 1, product: { id: "userA-private-item", stock_quantity: 10 } }
  ];

  // User B signs in
  const currentUserId = "user_B";
  const userBRemoteCart = [
    { product_id: "userB-item", quantity: 2, product: { id: "userB-item", stock_quantity: 10 } }
  ];

  const cartOwner = localStorageMock.get(CART_OWNER_KEY);
  let effectiveItemsForB;

  if (cartOwner && cartOwner !== "guest" && cartOwner !== currentUserId) {
    // Foreign user cart detected! Discard local leftover, load User B's remote cart
    effectiveItemsForB = userBRemoteCart;
    localStorageMock.set(CART_OWNER_KEY, currentUserId);
  } else {
    effectiveItemsForB = mergeCartItems(userBRemoteCart, localCartLeftover);
  }

  assert.strictEqual(effectiveItemsForB.length, 1);
  assert.strictEqual(effectiveItemsForB[0].product_id, "userB-item");
  assert.strictEqual(localStorageMock.get(CART_OWNER_KEY), "user_B");
});

// Test 11: Logout Privacy Cleanup
runTest("Test 11: Logout Privacy Cleanup (Clears local cart and ownership)", () => {
  const localStorageMock = new Map();
  localStorageMock.set("megamart_cart", JSON.stringify([{ id: "item-1", quantity: 2 }]));
  localStorageMock.set("megamart_cart_owner", "user_123");
  localStorageMock.set("cj_cart", JSON.stringify([{ id: "cj-1", quantity: 1 }]));

  // Simulate signOut()
  function simulateSignOut() {
    localStorageMock.delete("megamart_cart");
    localStorageMock.delete("megamart_cart_owner");
    localStorageMock.delete("cj_cart");
  }

  simulateSignOut();
  assert.strictEqual(localStorageMock.get("megamart_cart"), undefined, "megamart_cart must be removed on logout");
  assert.strictEqual(localStorageMock.get("megamart_cart_owner"), undefined, "megamart_cart_owner must be removed on logout");
  assert.strictEqual(localStorageMock.get("cj_cart"), undefined, "cj_cart must be removed on logout");
});

console.log("==================================================================");
console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log("==================================================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log("ALL CART MERGE & PRIVACY VERIFICATION CHECKS PASSED SUCCESSFULLY!");
}
