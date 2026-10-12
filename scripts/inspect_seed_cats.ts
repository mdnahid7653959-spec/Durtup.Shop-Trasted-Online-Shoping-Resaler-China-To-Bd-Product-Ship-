import { FAST_SEED_PRODUCTS } from "../src/data/fastSeedCatalog";
import { inferCategory, filterProductsByCategory } from "../src/utils/mohasagorCache";
import { CATEGORIES_DATA } from "../src/data/categoriesData";

console.log("Total FAST_SEED_PRODUCTS:", FAST_SEED_PRODUCTS.length);
CATEGORIES_DATA.forEach(cat => {
  const matches = filterProductsByCategory(FAST_SEED_PRODUCTS, cat.slug, cat.name);
  console.log(`Category: ${cat.slug} (${cat.name}) -> Found in seed: ${matches.length}`);
});
