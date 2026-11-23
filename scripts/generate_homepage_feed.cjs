const fs = require('fs');
const path = require('path');

// 1. Load FAST_SEED_PRODUCTS
const seedPath = path.resolve(__dirname, '../src/data/fastSeedCatalog.ts');
const seedContent = fs.readFileSync(seedPath, 'utf8');

// Simple extractor for JSON object array from TypeScript file
const jsonMatch = seedContent.match(/export const FAST_SEED_PRODUCTS: Product\[\] = (\[[\s\S]*?\]);/);
let seedProducts = [];
if (jsonMatch && jsonMatch[1]) {
  try {
    seedProducts = eval(jsonMatch[1]);
  } catch (e) {
    console.error('Failed to parse fastSeedCatalog.ts with eval:', e.message);
  }
}

// 2. Also load ecomseller_catalog.json if available
let ecomProducts = [];
try {
  const ecomPath = path.resolve(__dirname, '../public/ecomseller_catalog.json');
  if (fs.existsSync(ecomPath)) {
    const raw = JSON.parse(fs.readFileSync(ecomPath, 'utf8'));
    if (raw && Array.isArray(raw.products)) {
      ecomProducts = raw.products.slice(0, 80).map((p, idx) => ({
        id: `ecom-${p.id || idx}`,
        name: p.title || p.name || 'Product',
        slug: p.slug || `product-${p.id || idx}`,
        price: Number(p.sale_price || p.price || 0),
        originalPrice: p.regular_price ? Number(p.regular_price) : undefined,
        regular_price: p.regular_price ? Number(p.regular_price) : undefined,
        image: p.image_url || p.image || (Array.isArray(p.images) ? p.images[0] : ''),
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images.slice(0, 3) : (p.image_url ? [p.image_url] : []),
        category: p.category_name || p.category || 'General',
        category_name: p.category_name || p.category || 'General',
        rating: 4.8,
        reviews: 25,
        sold: 60,
        stock: 50,
        freeShipping: true,
        isNew: true,
        isBestSeller: idx % 3 === 0
      }));
    }
  }
} catch (e) {
  console.warn('Ecomseller catalog parse note:', e.message);
}

// Combine and interleave
const combined = [];
const maxLen = Math.max(seedProducts.length, ecomProducts.length);
for (let i = 0; i < maxLen; i++) {
  if (i < seedProducts.length) combined.push(seedProducts[i]);
  if (i < ecomProducts.length) combined.push(ecomProducts[i]);
}

// Deduplicate
const seen = new Set();
const cleanProducts = [];

for (const p of combined) {
  if (!p || !p.name) continue;
  const name = p.name.trim().toLowerCase();
  const id = String(p.id || '').trim().toLowerCase();
  if (seen.has(name) || (id && seen.has(id))) continue;
  seen.add(name);
  if (id) seen.add(id);

  // Keep lean fields
  cleanProducts.push({
    id: String(p.id),
    name: p.name,
    slug: p.slug || `product-${p.id}`,
    price: Number(p.price || 0),
    originalPrice: p.originalPrice || p.regular_price ? Number(p.originalPrice || p.regular_price) : undefined,
    regular_price: p.regular_price ? Number(p.regular_price) : undefined,
    image: p.image || (Array.isArray(p.images) ? p.images[0] : ''),
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images.slice(0, 4) : (p.image ? [p.image] : []),
    category: p.category || p.category_name || 'General',
    category_name: p.category_name || p.category || 'General',
    category_slug: p.category_slug || p.categorySlug || 'general',
    rating: p.rating || 4.8,
    reviews: p.reviews || 24,
    sold: p.sold || 45,
    stock: p.stock || 30,
    freeShipping: p.freeShipping ?? true,
    isNew: p.isNew ?? true,
    isBestSeller: p.isBestSeller ?? false
  });

  if (cleanProducts.length >= 140) break;
}

const outPath = path.resolve(__dirname, '../public/homepage_feed.json');
fs.writeFileSync(outPath, JSON.stringify(cleanProducts, null, 2), 'utf8');

const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Generated public/homepage_feed.json with ${cleanProducts.length} items (${sizeKb} KB)`);
