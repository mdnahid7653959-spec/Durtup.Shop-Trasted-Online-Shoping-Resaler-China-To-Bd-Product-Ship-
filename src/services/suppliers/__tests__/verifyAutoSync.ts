import { EcomsellerEngine } from "../ecomsellerEngine";
import { EcomsellerAutoSync } from "../ecomsellerAutoSync";

async function verify() {
  console.log("=== Testing EcomsellerEngine.getCachedEcomsellerProducts ===");
  const products = await EcomsellerEngine.getCachedEcomsellerProducts(true);
  console.log(`Fetched ${products.length} products successfully.`);

  if (products.length > 0) {
    const sample = products[0];
    console.log("Sample unified product:", {
      id: sample.id,
      name: sample.name,
      slug: sample.slug,
      price: sample.price,
      regular_price: sample.regular_price,
      supplier_sku: sample.supplier_sku,
      category: sample.category,
      hasImage: Boolean(sample.image),
    });
  }

  console.log("\n=== Testing AutoSync Run ===");
  const analysis = await EcomsellerAutoSync.runSyncAndAnalysis(true);
  console.log("Analysis result:", {
    status: analysis.status,
    totalLiveProducts: analysis.totalLiveProducts,
    newProductsCount: analysis.newProductsCount,
    priceChangesCount: analysis.priceChangesCount,
    message: analysis.message,
  });
}

verify().catch(console.error);
