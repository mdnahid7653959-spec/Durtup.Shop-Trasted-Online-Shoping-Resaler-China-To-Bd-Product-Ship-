const fs = require('fs');
const path = require('path');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Helper to determine category
function getCleanCat(p) {
  const c = (p.category || '').toLowerCase();
  if (c.includes('gadget') || c.includes('electronic')) return 'gadgets-electronics';
  if (c.includes('women')) return 'womens-fashion';
  if (c.includes('men')) return 'mens-fashion';
  if (c.includes('home') || c.includes('lifestyle')) return 'home-lifestyle';
  if (c.includes('kid') || c.includes('baby')) return 'kids-zone';
  if (c.includes('winter')) return 'winter';
  if (c.includes('watch')) return 'watch';
  if (c.includes('food')) return 'foods';
  if (c.includes('health') || c.includes('beauty')) return 'health-beauty';
  return 'other';
}

const groups = {};
slim.forEach(p => {
  const key = getCleanCat(p);
  if (!groups[key]) groups[key] = [];
  groups[key].push(p);
});

console.log('Group counts:');
Object.keys(groups).forEach(k => console.log(k, groups[k].length));

// Select curated slice
const targets = {
  'gadgets-electronics': 16,
  'womens-fashion': 16,
  'mens-fashion': 16,
  'home-lifestyle': 16,
  'kids-zone': 12,
  'winter': 12,
  'watch': 12,
  'foods': 7,
  'health-beauty': 10
};

const curated = [];
Object.entries(targets).forEach(([catKey, count]) => {
  const items = groups[catKey] || [];
  const selected = items.slice(0, count).map(p => {
    return {
      ...p,
      category_slug: p.category_slug || catKey,
      categorySlug: p.categorySlug || catKey
    };
  });
  curated.push(...selected);
});

console.log('Total curated fast seed products:', curated.length);

const content = `import type { Product } from "@/components/products/ProductCard";

export const FAST_SEED_PRODUCTS: Product[] = ${JSON.stringify(curated, null, 2)};
`;

fs.writeFileSync('src/data/fastSeedCatalog.ts', content);
console.log('Successfully wrote balanced authentic FAST_SEED_PRODUCTS to src/data/fastSeedCatalog.ts!');
