import { EcomsellerEngine } from '../ecomsellerEngine';
import { SupplierManager } from '../supplierManager';
import { CategoryMappingService, DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS } from '../categoryMappingService';
import { SupplierPricingConfig } from '../supplierTypes';

console.log("=== RUNNING FULL ECOMSELLER BD INTEGRATION VERIFICATION ===");

async function runVerification() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // TEST 1: Catalog Fetch & Seroval AST Decoding
  console.log("\n--- TEST 1: Live Catalog Fetch & Seroval AST Decoding ---");
  const catalogData = await EcomsellerEngine.fetchLiveCatalog(true);
  const products = catalogData?.products || [];
  const categories = catalogData?.categories || [];
  const brands = catalogData?.brands || [];

  assert(products.length > 200, `Catalog returns ${products.length} products (expected > 200)`);
  assert(categories.length > 30, `Catalog returns ${categories.length} categories (expected > 30)`);
  assert(brands.length > 0, `Catalog returns ${brands.length} brands`);
  
  if (products.length > 0) {
    const sample = products[0];
    assert(!!sample.id, `Product has id: ${sample.id}`);
    assert(!!sample.name, `Product has name: ${sample.name}`);
    assert(!!sample.code, `Product has code/SKU: ${sample.code}`);
    assert(sample.price > 0, `Product has suggested sale price: ৳${sample.price}`);
    assert(sample.resellerPrice > 0, `Product has wholesale cost: ৳${sample.resellerPrice}`);
    assert(sample.resellerPrice <= sample.price, `Wholesale cost (৳${sample.resellerPrice}) <= Suggested price (৳${sample.price})`);
    assert(sample.images && sample.images.length > 0, `Product has images (found ${sample.images.length})`);
  }

  // TEST 2: Product Detail Fetch & Seroval Object Hydration
  console.log("\n--- TEST 2: Product Detail Fetch & Full Data Extraction ---");
  if (products.length > 0) {
    const testSlug = products[0].slug;
    console.log(`Fetching detail for slug: "${testSlug}"...`);
    const detail = await EcomsellerEngine.fetchProductDetail(testSlug);
    assert(!!detail, `Product detail returned for ${testSlug}`);
    if (detail) {
      assert(!!detail.name, `Detail has name: ${detail.name}`);
      assert(detail.images && detail.images.length > 0, `Detail has ${detail.images?.length} images`);
      assert(typeof detail.description === 'string', `Detail has description (length: ${detail.description.length})`);
      assert(detail.deliveryInside > 0, `Detail has delivery rate inside: ৳${detail.deliveryInside}`);
    }
  }

  // TEST 3: Category Mapping System (37+ Ecomseller BD Categories)
  console.log("\n--- TEST 3: Category Mapping System (37+ Ecomseller BD Categories) ---");
  const defaultMappingKeys = Object.keys(DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS);
  assert(defaultMappingKeys.length >= 25, `Default mapping rule keys count: ${defaultMappingKeys.length}`);
  
  const mappedSmart = CategoryMappingService.resolveCategory("earbuds", "Earbuds", []);
  assert(mappedSmart.slug === "electronics" || mappedSmart.name.includes("Electronics"), `Earbuds mapped to "${mappedSmart.name}" (${mappedSmart.slug})`);
  
  const mappedKitchen = CategoryMappingService.resolveCategory("kitchen-gadget", "Kitchen Gadget", []);
  assert(mappedKitchen.slug === "home" || mappedKitchen.name.includes("Home"), `Kitchen Gadget mapped to "${mappedKitchen.name}" (${mappedKitchen.slug})`);

  const mappedWatch = CategoryMappingService.resolveCategory("jewellery", "Jewellery", []);
  assert(mappedWatch.slug === "watches" || mappedWatch.name.includes("Watches"), `Jewellery mapped to "${mappedWatch.name}" (${mappedWatch.slug})`);

  // TEST 4: Tiered Margin Calculation Hierarchy
  console.log("\n--- TEST 4: Tiered Margin System Hierarchy ---");
  // Hierarchy: Product Margin > Category Margin > Supplier Margin > Global Margin
  const testConfig: SupplierPricingConfig = {
    globalMargin: {
      type: "fixed",
      marginValue: 100,
      enabled: true
    },
    supplierMargins: {
      "ecomseller_bd": {
        type: "fixed",
        marginValue: 150,
        enabled: true
      }
    },
    categoryMargins: {
      "electronics": {
        type: "percentage",
        marginValue: 10, // 10%
        enabled: true
      }
    },
    productMargins: {
      "test-prod-123": {
        type: "fixed",
        marginValue: 300,
        enabled: true
      }
    }
  };

  // Case A: Specific Product Match -> Should use product rule (+300)
  const priceA = EcomsellerEngine.calculatePrice(1000, "electronics", "test-prod-123", testConfig);
  assert(priceA.finalSellingPrice === 1300 && priceA.durtupMargin === 300 && priceA.appliedRuleLevel === "product", 
    `Product rule applied: Base 1000 + 300 = ${priceA.finalSellingPrice} (rule: ${priceA.appliedRuleLevel})`);

  // Case B: Category Match -> Should use category rule (10% of 1000 = 100 -> 1100)
  const priceB = EcomsellerEngine.calculatePrice(1000, "electronics", "other-prod", testConfig);
  assert(priceB.finalSellingPrice === 1100 && priceB.durtupMargin === 100 && priceB.appliedRuleLevel === "category", 
    `Category rule applied: Base 1000 + 10% = ${priceB.finalSellingPrice} (rule: ${priceB.appliedRuleLevel})`);

  // Case C: Supplier Match -> Should use supplier rule (+150 -> 1150)
  const priceC = EcomsellerEngine.calculatePrice(1000, "fashion", "other-prod", testConfig);
  assert(priceC.finalSellingPrice === 1150 && priceC.durtupMargin === 150 && priceC.appliedRuleLevel === "supplier", 
    `Supplier rule applied: Base 1000 + 150 = ${priceC.finalSellingPrice} (rule: ${priceC.appliedRuleLevel})`);

  // Case D: Global Match -> Should use global rule (+100 -> 1100)
  const configNoSupplier: SupplierPricingConfig = {
    ...testConfig,
    supplierMargins: {}
  };
  const priceD = EcomsellerEngine.calculatePrice(1000, "fashion", "other-prod", configNoSupplier);
  assert(priceD.finalSellingPrice === 1100 && priceD.durtupMargin === 100 && priceD.appliedRuleLevel === "global", 
    `Global rule applied: Base 1000 + 100 = ${priceD.finalSellingPrice} (rule: ${priceD.appliedRuleLevel})`);

  // TEST 5: Multi-Supplier Order Partitioning
  console.log("\n--- TEST 5: Multi-Supplier Fulfillment Partitioning ---");
  const testOrderItems = [
    {
      id: "item-1",
      product_name: "T-Shirt",
      supplier_id: "durtup",
      supplier_name: "Durtup Direct",
      quantity: 2,
      price: 500,
      wholesale_price: 350
    },
    {
      id: "item-2",
      product_name: "Wireless Earbuds",
      supplier_id: "mohasagor",
      supplier_name: "Dropshipping.com.bd",
      supplier_sku: "MOH-1234",
      quantity: 1,
      price: 1200,
      wholesale_price: 800
    },
    {
      id: "item-3",
      product_name: "Smart Watch Ultra",
      supplier_id: "ecomseller_bd",
      supplier_name: "Ecomseller BD",
      supplier_sku: "ECOM-SW9",
      quantity: 1,
      price: 1800,
      wholesale_price: 1250
    }
  ];

  const fulfillmentGroups = SupplierManager.groupOrderItemsBySupplier(testOrderItems);
  assert(fulfillmentGroups.length === 3, `Order split into 3 distinct fulfillment groups (got ${fulfillmentGroups.length})`);
  
  const durtupGroup = fulfillmentGroups.find(g => g.supplierId === "durtup");
  const dropshippingGroup = fulfillmentGroups.find(g => g.supplierId === "dropshipping_bd");
  const ecomsellerGroup = fulfillmentGroups.find(g => g.supplierId === "ecomseller_bd");

  assert(!!durtupGroup && durtupGroup.items.length === 1, "Durtup Direct group partitioned correctly");
  assert(!!dropshippingGroup && dropshippingGroup.items.length === 1, "Dropshipping.com.bd group partitioned correctly");
  assert(!!ecomsellerGroup && ecomsellerGroup.items.length === 1 && ecomsellerGroup.totalWholesaleCost === 1250, "Ecomseller BD group partitioned correctly with wholesale cost ৳1250");

  console.log(`\n==================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
