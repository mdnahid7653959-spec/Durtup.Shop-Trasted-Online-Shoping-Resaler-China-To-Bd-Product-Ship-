import { 
  getSyncProducts, 
  filterProductsByCategory, 
  hydrateCatalog,
  isCompleteCatalogReady,
  COMPLETE_CATALOG_MIN_COUNT
} from "../src/utils/mohasagorCache";
import { CATEGORIES_DATA } from "../src/data/categoriesData";

async function verifyAllCategories() {
  console.log("=== COMPREHENSIVE CATEGORY COVERAGE & HYDRATION TEST ===");

  // 1. Initial Synchronous State
  const initial = getSyncProducts();
  console.log(`Initial seed products available: ${initial.length}`);
  if (initial.length < 40) {
    throw new Error(`Expected at least 40 initial seed products, got ${initial.length}`);
  }

  // 2. Hydrate catalog
  const t0 = performance.now();
  const hydrated = await hydrateCatalog();
  const t1 = performance.now();
  console.log(`Hydrated catalog loaded: ${hydrated.length} products in ${(t1 - t0).toFixed(2)}ms`);

  if (hydrated.length < COMPLETE_CATALOG_MIN_COUNT) {
    throw new Error(`Hydrated catalog item count (${hydrated.length}) is below COMPLETE_CATALOG_MIN_COUNT (${COMPLETE_CATALOG_MIN_COUNT})`);
  }

  // 3. Verify every single category has matching products
  console.log("\n--- Checking All Categories in CATEGORIES_DATA ---");
  let failedCategories = 0;

  for (const cat of CATEGORIES_DATA) {
    const productsBySlug = filterProductsByCategory(hydrated, cat.slug, cat.name);
    console.log(`[Category: ${cat.slug}] "${cat.name}" -> ${productsBySlug.length} products matched`);
    
    if (productsBySlug.length === 0) {
      console.error(`FAILED: Category "${cat.slug}" (${cat.name}) has 0 products!`);
      failedCategories++;
    }

    // Check subcategories as well
    if (cat.subcategories && cat.subcategories.length > 0) {
      for (const sub of cat.subcategories.slice(0, 3)) { // test first 3 subcategories
        const subProducts = filterProductsByCategory(hydrated, sub.slug, cat.name);
        console.log(`   └── [Subcategory: ${sub.slug}] "${sub.name}" -> ${subProducts.length} products`);
      }
    }
  }

  if (failedCategories > 0) {
    throw new Error(`Test failed: ${failedCategories} categories have 0 products!`);
  }

  console.log("\n=======================================================");
  console.log("ALL CATEGORIES VERIFIED: ZERO EMPTY CATEGORIES FOUND!");
  console.log("=======================================================");
}

verifyAllCategories().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
