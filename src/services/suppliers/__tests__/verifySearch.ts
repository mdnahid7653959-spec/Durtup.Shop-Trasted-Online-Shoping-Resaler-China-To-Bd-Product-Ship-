import { EcomsellerEngine } from '../ecomsellerEngine';

async function testSearchIntegration() {
  console.log("=== Testing Ecomseller Products in Search Catalog ===");
  const products = await EcomsellerEngine.getCachedEcomsellerProducts(true);
  console.log(`Loaded ${products.length} products from Ecomseller BD.`);

  // Test search for some terms
  const searchTerms = ["necklace", "watch", "fan", "earbuds", "magnetic", "clover"];
  
  for (const term of searchTerms) {
    const matched = products.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    console.log(`Search for "${term}": Found ${matched.length} items (e.g., "${matched[0]?.name || 'N/A'}")`);
  }
}

testSearchIntegration().catch(console.error);
