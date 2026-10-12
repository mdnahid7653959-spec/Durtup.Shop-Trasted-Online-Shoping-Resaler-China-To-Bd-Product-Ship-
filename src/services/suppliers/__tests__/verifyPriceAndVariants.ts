import { EcomsellerEngine } from '../ecomsellerEngine';
import { extractProductVariants } from '../../../utils/productVariantHelper';

async function verifyShoeCleaningCream() {
  console.log("=== Testing Price & Variant Extraction for Shoe Cleaning Cream ===");
  
  const products = await EcomsellerEngine.getCachedEcomsellerProducts(true);
  const cream = products.find(p => p.slug === 'multifunctional-shoe-cleaning-cream');

  if (!cream) {
    console.error("Cream product not found!");
    process.exit(1);
  }

  console.log(`Product Name: "${cream.name}"`);
  console.log(`Suggested / Live Price: ৳${cream.price} (Regular: ৳${cream.regular_price})`);

  if (cream.price === 490) {
    console.log("[PASS] Price is exactly ৳490 matching Ecomseller BD!");
  } else {
    console.error(`[FAIL] Expected ৳490 but got ৳${cream.price}`);
  }

  const variants = extractProductVariants(cream);
  console.log(`Extracted Variants Count: ${variants.length}`);
  if (variants.length === 0) {
    console.log("[PASS] No fake size/color variants generated for Shoe Cleaning Cream!");
  } else {
    console.error("[FAIL] Fake variants still present:", variants);
  }
}

verifyShoeCleaningCream().catch(console.error);
