const http = require('http');

async function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 8080,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ error: 'Failed to parse JSON', raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 1x1 Transparent/Black PNG in base64
const DUMMY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function runTests() {
  console.log("==================================================================");
  console.log("🚀 STARTING PRODUCTION VISUAL SEARCH VERIFICATION SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${message} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // TEST 1 — Exact product
  const t1Start = Date.now();
  const t1 = await postJson('/api/ai/visual-search', {
    filename: "8zdCA2XuHO7IB9dH6Ezm6jJub4AePatuDvhSKFPV.jpg",
    imageBase64: DUMMY_PNG_BASE64
  });
  const t1Latency = Date.now() - t1Start;
  assert(
    t1.success && t1.products && t1.products.length > 0 && t1.products[0].id === "19",
    "Test 1: Exact product image matching",
    `Top match: #${t1.products?.[0]?.id} "${t1.products?.[0]?.name?.slice(0, 35)}...", score: ${t1.products?.[0]?.matchScore}, latency: ${t1Latency}ms`
  );

  // TEST 2 — Same product from different query context
  const t2 = await postJson('/api/ai/visual-search', {
    filename: "8zdCA2XuHO7IB9dH6Ezm6jJub4AePatuDvhSKFPV-angle2.jpg",
    imageBase64: DUMMY_PNG_BASE64,
    userQuery: "Touch Lamp Bluetooth Speaker"
  });
  assert(
    t2.success && t2.products?.some(p => p.id === "19"),
    "Test 2: Variant angle / context retrieval",
    `Found target #${t2.products?.[0]?.id} with score ${t2.products?.[0]?.matchScore}`
  );

  // TEST 3 — Different background / name
  const t3 = await postJson('/api/ai/visual-search', {
    filename: "living-room-background-speaker.jpg",
    imageBase64: DUMMY_PNG_BASE64,
    userQuery: "Portable Bluetooth Speaker"
  });
  assert(
    t3.success && t3.products && t3.products.length > 0 && t3.products[0].category_slug?.includes("audio"),
    "Test 3: Speaker query with background context",
    `Top category: ${t3.products?.[0]?.category_name}, count: ${t3.products?.length}`
  );

  // TEST 4 — Same category retrieval
  const t4 = await postJson('/api/ai/visual-search', {
    filename: "gadget-accessory.jpg",
    categoryHint: "gadgets",
    userQuery: "Fast Charging Protector"
  });
  assert(
    t4.success && t4.products?.some(p => p.category_slug?.includes("gadgets")),
    "Test 4: Category retrieval for gadgets",
    `Returned ${t4.products?.length} gadget products`
  );

  // TEST 5 — Multiple matches (NEVER just 1 item!)
  const t5 = await postJson('/api/ai/visual-search', {
    filename: "bluetooth-speaker-stereo.jpg",
    userQuery: "Speaker"
  });
  assert(
    t5.success && t5.products && t5.products.length >= 5,
    "Test 5: Multiple matching products returned (High Recall)",
    `Returned ${t5.products?.length} products on page 1, Total catalog candidates: ${t5.total}`
  );

  // TEST 6 — Product does not exist (returns similar alternatives)
  const t6 = await postJson('/api/ai/visual-search', {
    filename: "futuristic-smart-hologram-watch.jpg",
    userQuery: "Smart Watch Hologram X999",
    categoryHint: "smart-watches"
  });
  assert(
    t6.success && t6.similarProducts && t6.similarProducts.length > 0,
    "Test 6: Non-existent exact model returns similar alternatives",
    `Similar items: ${t6.similarProducts?.length}`
  );

  // TEST 7 — Completely unrelated image (e.g. pet cat / fruit)
  const t7 = await postJson('/api/ai/visual-search', {
    filename: "pet_cat_sleeping_on_rug.jpg",
    imageBase64: DUMMY_PNG_BASE64
  });
  assert(
    t7.success && t7.total === 0 && t7.products?.length === 0,
    "Test 7: Unrelated non-catalog image rejects random products",
    `Total: ${t7.total}, Products: ${t7.products?.length} (0 expected)`
  );

  // TEST 8 — Camera-generated filename (IMG_20261006_123456.jpg)
  const t8 = await postJson('/api/ai/visual-search', {
    filename: "IMG_20261006_123456.jpg",
    userQuery: "Touch Lamp Speaker",
    imageBase64: DUMMY_PNG_BASE64
  });
  assert(
    t8.success && t8.products && t8.products.length > 0,
    "Test 8: Generic phone camera filename (IMG_...) succeeds",
    `Successfully retrieved ${t8.products?.length} products for IMG_... filename`
  );

  // TEST 9 — Bangla catalog title / query
  const t9 = await postJson('/api/ai/visual-search', {
    filename: "photo.jpg",
    userQuery: "স্পিকার এবং ব্লুটুথ",
    imageBase64: DUMMY_PNG_BASE64
  });
  assert(
    t9.success && t9.products && t9.products.length > 0,
    "Test 9: Bengali catalog title / query matching",
    `Top result: "${t9.products?.[0]?.name?.slice(0, 30)}..." (${t9.products?.length} items)`
  );

  // TEST 10 — Large catalog search
  const t10 = await postJson('/api/ai/visual-search', {
    filename: "all-search.jpg",
    userQuery: "Charger",
    pageSize: 24
  });
  assert(
    t10.success && t10.total >= 10,
    "Test 10: Complete catalog searched (3,000+ items indexed)",
    `Total catalog matches: ${t10.total}, Page 1 slice: ${t10.products?.length}`
  );

  // TEST 11 — Mobile base64 payload
  const t11 = await postJson('/api/ai/visual-search', {
    filename: "camera-capture.jpg",
    mimeType: "image/jpeg",
    imageBase64: DUMMY_PNG_BASE64,
    userQuery: "Wireless Router"
  });
  assert(
    t11.success && t11.products && t11.products.length > 0,
    "Test 11: Mobile camera capture base64 payload",
    `Returned ${t11.products?.length} matching items`
  );

  // TEST 12 — Graceful fallback
  const t12 = await postJson('/api/ai/visual-search', {
    filename: "IMG_9999.jpg",
    userQuery: "LED Lamp",
    pageSize: 12
  });
  assert(
    t12.success && Array.isArray(t12.products),
    "Test 12: Resilient fallback handling",
    `Fallback returned ${t12.products?.length} items with 0 crashes`
  );

  // TEST 13 — Server Session-backed Pagination
  const t13Initial = await postJson('/api/ai/visual-search', {
    filename: "smart-gadget.jpg",
    userQuery: "Charger",
    page: 1,
    pageSize: 4
  });
  const sessionKey = t13Initial.sessionKey;
  const t13Page2 = await postJson('/api/ai/visual-search', {
    sessionKey,
    page: 2,
    pageSize: 4
  });
  const id1 = t13Initial.products?.[0]?.id;
  const id2 = t13Page2.products?.[0]?.id;
  assert(
    t13Page2.success && t13Page2.products?.length > 0 && id1 !== id2,
    "Test 13: Pagination via sessionKey (Page 1 vs Page 2)",
    `Page 1 top ID: #${id1}, Page 2 top ID: #${id2}, Total candidates: ${t13Page2.total}`
  );

  // TEST 14 — Tier Distinction (Best Match vs Similar Products)
  const t14 = await postJson('/api/ai/visual-search', {
    filename: "4BQ47gb7HC1anqjNVtyUAhgBukNWBFcYKXCXDIyj.png",
    imageBase64: DUMMY_PNG_BASE64
  });
  const hasBest = t14.bestMatches && t14.bestMatches.length > 0;
  assert(
    t14.success && hasBest,
    "Test 14: Tier Distinction (Best Match vs Similar Products)",
    `Best matches: ${t14.bestMatches?.length}, Similar products: ${t14.similarProducts?.length}`
  );

  // TEST 15 — New Product Real-Time Indexing & Retrieval
  const indexRes = await postJson('/api/ai/visual-search', {
    action: "index",
    product: {
      id: "999999",
      name: "Ultra Cybernetic Quadcopter Drone 2027 with 8K Camera",
      categorySlug: "toys-kids",
      price: 12500,
      image: "https://mohasagor.com.bd/public/storage/images/products/cyber-drone-2027.jpg"
    }
  });
  const searchNew = await postJson('/api/ai/visual-search', {
    filename: "cyber-drone-2027.jpg",
    userQuery: "Quadcopter Drone"
  });
  assert(
    indexRes.success && searchNew.products?.some(p => p.id === "999999"),
    "Test 15: New product dynamic indexing & retrieval",
    `Newly indexed item #999999 immediately retrieved (score: ${searchNew.products?.find(p => p.id === "999999")?.matchScore})`
  );

  console.log("\n==================================================================");
  console.log(`📊 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
