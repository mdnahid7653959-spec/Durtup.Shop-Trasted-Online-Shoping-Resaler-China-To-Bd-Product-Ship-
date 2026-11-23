const fs = require('fs');

// We simulate filterProductsByCategory exactly as it is in mohasagorCache.ts
const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));
const ecom = JSON.parse(fs.readFileSync('public/ecomseller_catalog.json', 'utf8'));

// Ecomseller items transformed:
const catMap = new Map();
(ecom.categories || []).forEach(c => catMap.set(c.id, { id: c.id, name: c.name, slug: c.slug }));

const transformedEcom = (ecom.products || []).map(p => {
  const rawCat = catMap.get(p.categoryId);
  return {
    id: `ecom-${p.id}`,
    name: p.name,
    category: rawCat?.name || "Men's Fashion",
    category_slug: "mens-fashion",
    category_id: "mens-fashion"
  };
});

// Now let's check inferCategory from mohasagorCache.ts
function inferCategory(pName, pCat) {
  const name = (pName || "").toLowerCase();
  const cat = (pCat || "").toLowerCase();

  if (cat.includes("women") || name.includes("saree") || name.includes("kurti") || name.includes("hijab") || name.includes("borkha")) return "womens-fashion";
  if (cat.includes("men") || name.includes("panjabi") || name.includes("shirt") || name.includes("pant")) return "mens-fashion";
  return "gadgets-electronics";
}

// Let's test what filterProductsByCategory does:
// Look at lines 1673-1695 of mohasagorCache.ts:
const query = "womens-fashion";
const targetSlug = "womens-fashion";

const mask = transformedEcom.find(p => p.name.includes('Hooded Scarf Mask'));
const pant = slim.find(p => p.name.includes('Gabardine Pant'));

console.log('mask:', mask);
console.log('pant:', pant);

// In mohasagorCache.ts:
// const detectedSlug = (p as any).category_slug || inferCategory(p.name, p.category);
// if (detectedSlug === targetSlug) return true;
// if (productMatchesCategory(p, targetSlug) || productMatchesCategory(p, info.category?.name)) return true;

// Why did pant match womens-fashion?!
console.log('pant category:', pant.category);
console.log('pant category_slug:', pant.category_slug);
