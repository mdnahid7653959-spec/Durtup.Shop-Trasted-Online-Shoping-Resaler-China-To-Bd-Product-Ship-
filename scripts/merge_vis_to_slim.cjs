const fs = require('fs');
const path = require('path');

const slimPath = path.join(__dirname, '../public/mohasagor_catalog_slim.json');
const visPath = path.join(__dirname, '../public/visual_index.json');

const slimRaw = JSON.parse(fs.readFileSync(slimPath, 'utf8'));
const isWrapped = Boolean(slimRaw.products);
const slimList = isWrapped ? slimRaw.products : slimRaw;

const existingIds = new Set(slimList.map(p => String(p.id)));
const existingSlugs = new Set(slimList.map(p => String(p.slug || '').toLowerCase()));

const visList = JSON.parse(fs.readFileSync(visPath, 'utf8'));
let added = 0;

for (const p of visList) {
  const idStr = String(p.id);
  const slugStr = String(p.slug || '').toLowerCase();

  if (!existingIds.has(idStr) && (!slugStr || !existingSlugs.has(slugStr))) {
    const regPrice = p.regular_price || Math.round((p.price || 500) * 1.35);
    const item = {
      id: p.id,
      name: p.name,
      slug: p.slug || `product-${p.id}`,
      product_code: `ECOM-${p.id.slice(0, 8)}`,
      sku: `ECOM-${p.id.slice(0, 8)}`,
      category: p.category || p.categoryName || 'General',
      category_name: p.categoryName || p.category || 'General',
      category_slug: p.categorySlug || 'general',
      categorySlug: p.categorySlug || 'general',
      categoryName: p.categoryName || p.category || 'General',
      image: p.image,
      images: [p.image],
      product_images: [
        {
          id: `img-${p.id}-0`,
          image_url: p.image,
          is_primary: true
        }
      ],
      price: Number(p.price || 0),
      originalPrice: regPrice,
      regular_price: regPrice,
      rating: p.rating || 4.7,
      reviews: Math.floor(Math.random() * 20) + 10,
      sold: p.sold || Math.floor(Math.random() * 80) + 20,
      stock: 50,
      product_variants: [],
      details: p.name,
      description: p.name
    };

    slimList.push(item);
    existingIds.add(idStr);
    if (slugStr) existingSlugs.add(slugStr);
    added++;
  }
}

console.log(`Added ${added} missing visual_index products to slim catalog. Total now: ${slimList.length}`);

const output = isWrapped ? { ...slimRaw, products: slimList } : slimList;
fs.writeFileSync(slimPath, JSON.stringify(output));
console.log(`Wrote updated minified ${slimPath} (${(fs.statSync(slimPath).size / (1024 * 1024)).toFixed(2)} MB)`);
