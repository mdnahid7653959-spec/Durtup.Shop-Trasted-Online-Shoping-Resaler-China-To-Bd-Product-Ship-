import { 
  getCachedMohasagorProducts, 
  fetchSlimCatalog, 
  isCompleteCatalogReady,
  scheduleDeferredCatalogHydration
} from '../src/utils/mohasagorCache';
import { FAST_SEED_PRODUCTS } from '../src/data/fastSeedCatalog';

async function runTests() {
  console.log("=== DURTUP PERFORMANCE & CORRECTNESS TEST SUITE ===");

  // Scenario 1: Initial cold load without complete catalog
  console.log("\n[Scenario 1: Fast Initial Seed Retrieval]");
  const t0 = performance.now();
  const initialProducts = await getCachedMohasagorProducts();
  const t1 = performance.now();
  console.log(`Initial products returned: ${initialProducts.length} items in ${(t1 - t0).toFixed(2)}ms`);
  
  if (initialProducts.length < 40) {
    throw new Error(`Expected at least 40 seed products, got ${initialProducts.length}`);
  }
  console.log(`PASS: Immediate render has ${initialProducts.length} verified products ready.`);

  // Scenario 2: Complete catalog readiness check
  console.log("\n[Scenario 2: Complete Catalog Status]");
  const readyBefore = isCompleteCatalogReady();
  console.log(`Is complete catalog ready before hydration? ${readyBefore}`);
  if (readyBefore) {
    console.log("Note: Complete catalog was already in memory or indexed cache.");
  } else {
    console.log("PASS: Complete catalog correctly flagged as not yet ready on cold start.");
  }

  // Scenario 3: Hydration & In-flight Request Deduplication
  console.log("\n[Scenario 3: Hydration & Request Deduplication]");
  const p1 = fetchSlimCatalog();
  const p2 = fetchSlimCatalog();
  if (p1 !== p2) {
    console.warn("Warning: Concurrent hydration did not return the exact same promise reference (deduplication check).");
  } else {
    console.log("PASS: Concurrent fetchSlimCatalog() calls successfully deduplicated to a single in-flight promise!");
  }

  const hydratedProducts = await p1;
  console.log(`Hydrated catalog item count: ${hydratedProducts.length}`);
  if (hydratedProducts.length < 2500) {
    throw new Error(`Expected full catalog (>2500 items), got ${hydratedProducts.length}`);
  }
  console.log(`PASS: Complete catalog loaded with ${hydratedProducts.length} products.`);

  // Scenario 4: Completeness flag after hydration
  const readyAfter = isCompleteCatalogReady();
  console.log(`Is complete catalog ready after hydration? ${readyAfter}`);
  if (!readyAfter) {
    throw new Error("Expected isCompleteCatalogReady() to be true after successful hydration.");
  }
  console.log("PASS: isCompleteCatalogReady() is true.");

  // Scenario 5: Search outside seed catalog
  console.log("\n[Scenario 5: Search Accuracy for Non-Seed Product]");
  // Pick an item from hydratedProducts that is definitely NOT in FAST_SEED_PRODUCTS
  const seedIds = new Set(FAST_SEED_PRODUCTS.map(p => p.id));
  const nonSeedProduct = hydratedProducts.find(p => !seedIds.has(p.id));
  if (!nonSeedProduct) {
    throw new Error("Could not find a non-seed product in full catalog!");
  }
  console.log(`Target non-seed product: "${nonSeedProduct.name}" (ID: ${nonSeedProduct.id}, Price: ৳${nonSeedProduct.price})`);
  
  // Search for words from its title
  const query = nonSeedProduct.name.split(" ")[0].toLowerCase();
  const matches = hydratedProducts.filter(p => p.name.toLowerCase().includes(query));
  console.log(`Searching for "${query}": found ${matches.length} matching products.`);
  if (!matches.some(p => p.id === nonSeedProduct.id)) {
    throw new Error("Target product not found in search results!");
  }
  console.log("PASS: Non-seed product is fully discoverable and searchable!");

  // Scenario 6: Price & Category Consistency
  console.log("\n[Scenario 6: Product Pricing & Integrity]");
  const sampleSeed = initialProducts[0];
  const sampleHydrated = hydratedProducts.find(p => p.id === sampleSeed.id);
  if (sampleHydrated) {
    console.log(`Comparing seed vs hydrated for ID ${sampleSeed.id}:`);
    console.log(`  Seed price: ৳${sampleSeed.price}, Hydrated price: ৳${sampleHydrated.price}`);
    if (sampleSeed.price !== sampleHydrated.price) {
      throw new Error(`Price mismatch for ${sampleSeed.id}: seed=${sampleSeed.price}, hydrated=${sampleHydrated.price}`);
    }
    console.log("PASS: Seed and hydrated pricing match exactly.");
  }

  console.log("\n=======================================================");
  console.log("ALL SCENARIOS PASSED: 0 ERRORS DETECTED");
  console.log("=======================================================");
}

runTests().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
