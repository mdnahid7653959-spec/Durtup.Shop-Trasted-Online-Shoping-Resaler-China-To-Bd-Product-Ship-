import { smartSearchService } from "../src/services/search/SmartSearchService";
import { CATEGORIES_DATA } from "../src/data/categoriesData";

async function testSearchCategories() {
  console.log("=== TESTING SMART SEARCH SERVICE WITH CATEGORIES ===");
  for (const cat of CATEGORIES_DATA) {
    const res = await smartSearchService.search("", { category: cat.slug, limit: 1000 });
    console.log(`Category slug "${cat.slug}": found ${res.products.length} products`);
    const resByName = await smartSearchService.search("", { category: cat.name, limit: 1000 });
    console.log(`Category name "${cat.name}": found ${resByName.products.length} products`);
  }
}

testSearchCategories().catch(console.error);
