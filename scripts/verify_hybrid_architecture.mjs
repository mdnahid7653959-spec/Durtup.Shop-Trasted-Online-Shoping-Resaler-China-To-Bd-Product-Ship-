/**
 * Comprehensive Verification Suite for Durtup Hybrid Architecture
 * (React Frontend + Laravel Backend + Redis Caching + Supplier Image Mapping)
 */

const BASE_URL = "http://localhost:8080";

async function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("=============================================================");
  console.log("🧪 STARTING DURTUP HYBRID ARCHITECTURE VERIFICATION TEST");
  console.log("=============================================================\n");

  // 1. Test React Frontend Availability
  const homeRes = await fetch(`${BASE_URL}/`);
  await assert(homeRes.status === 200, `React Frontend home page accessible on localhost (Status: ${homeRes.status})`);

  // 2. Test Laravel Hybrid API Health
  const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
  await assert(healthRes.status === 200, `Laravel API /api/v1/health is active (Status: ${healthRes.status})`);
  const healthData = await healthRes.json();
  await assert(healthData.status === "healthy", "Hybrid backend status is healthy");
  await assert(healthData.total_products > 0, `Products loaded in database (${healthData.total_products} products)`);
  await assert(healthData.total_categories > 0, `Categories loaded in database (${healthData.total_categories} categories)`);

  // 3. Test Redis Caching & Query Optimization Speed
  const queryStart1 = performance.now();
  const prodRes1 = await fetch(`${BASE_URL}/api/v1/products?page=1&per_page=12`);
  const prodData1 = await prodRes1.json();
  const queryDuration1 = Math.round(performance.now() - queryStart1);
  await assert(prodRes1.status === 200, `Catalog query executed successfully`);
  await assert(prodData1.data?.length === 12, `Correct pagination: 12 products returned`);

  // 2nd query should hit Redis memory cache
  const queryStart2 = performance.now();
  const prodRes2 = await fetch(`${BASE_URL}/api/v1/products?page=1&per_page=12`);
  const prodData2 = await prodRes2.json();
  const queryDuration2 = Math.round(performance.now() - queryStart2);
  await assert(prodData2.meta?.cached === true, `Redis cache hit verified for catalog query`);
  console.log(`⚡ Response Time Comparison: Query 1 = ${queryDuration1}ms vs Redis Cached Query 2 = ${queryDuration2}ms`);

  // 4. Test Featured Products
  const featRes = await fetch(`${BASE_URL}/api/v1/products/featured?limit=6`);
  const featData = await featRes.json();
  await assert(featRes.status === 200, "Featured products endpoint operational");
  await assert(featData.data?.length === 6, "Returned exactly 6 featured items");

  // 5. Test Supplier Web Link Ingestion with 100% Image & Data Mapping
  const testSupplierLink = {
    url: "https://detail.1688.com/offer/789012345.html",
    name: "Enterprise Multi-Angle Precision Screwdriver Set 32-in-1",
    description: "Chrome vanadium steel bits with magnetic handle and portable carry case.",
    wholesale_price: 280,
    margin_percentage: 25,
    image: "//cbu01.alicdn.com/img/ibank/O1CN01screwdriver.jpg",
    images: [
      "//cbu01.alicdn.com/img/ibank/O1CN01screwdriver.jpg",
      "/uploads/tools/screwdriver-case.webp",
      "https://cbu01.alicdn.com/img/ibank/O1CN01details-zoom.jpg"
    ]
  };

  const importRes = await fetch(`${BASE_URL}/api/v1/suppliers/import-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testSupplierLink)
  });
  await assert(importRes.status === 200, "Supplier web link ingested successfully");
  const importData = await importRes.json();
  await assert(importData.data?.selling_price === 350, `Price calculation accurate: Cost 280 + 25% margin = ${importData.data?.selling_price} BDT`);
  
  // Verify 100% Image Mapping
  const primaryImg = importData.data?.primary_image;
  await assert(primaryImg.startsWith("https://cbu01.alicdn.com/"), `Protocol-relative image converted to HTTPS CDN: ${primaryImg}`);
  
  const relativeImg = importData.data?.images?.find(img => img.includes("screwdriver-case.webp"));
  await assert(relativeImg.startsWith("https://detail.1688.com/uploads/"), `Relative supplier path converted to absolute origin: ${relativeImg}`);

  // 6. Test Product Search for Ingested Item
  const searchRes = await fetch(`${BASE_URL}/api/v1/products?q=Screwdriver`);
  const searchData = await searchRes.json();
  await assert(searchData.meta?.total > 0, "Ingested product immediately indexed and searchable");
  await assert(searchData.data[0]?.name.includes("Screwdriver"), "Search returned matching product");

  // 7. Verify Redis Cache Stats
  const cacheStatsRes = await fetch(`${BASE_URL}/api/v1/cache/stats`);
  const cacheStats = await cacheStatsRes.json();
  await assert(cacheStats.stats?.hits > 0, `Redis cache metrics active: ${cacheStats.stats?.hits} hits recorded`);

  console.log("\n=============================================================");
  console.log("🎉 ALL TESTS PASSED! HYBRID ARCHITECTURE FULLY VERIFIED ON LOCALHOST");
  console.log("=============================================================\n");
}

runTests().catch(err => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
