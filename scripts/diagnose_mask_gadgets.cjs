const fs = require('fs');

const mask = {
  id: 'ecom-07cad8a4-b52e-4ce3-9d99-9d679204cfa7',
  name: '4 PCS Hooded Scarf Mask',
  category: 'Fashion & Accessories',
  category_slug: 'mens-fashion'
};

const targetSlug = 'gadgets-electronics';
const targetName = "Gadgets & Electronics".toLowerCase();

const pCat = String(mask.category || "").toLowerCase().trim();
const pCatName = "";
const pCatSlug = String(mask.category_slug || "").toLowerCase().trim();
const pName = String(mask.name || "").toLowerCase();

const cleanCat = (s) => s.toLowerCase().trim().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const pCatClean = cleanCat(pCat);
const targetSlugClean = cleanCat(targetSlug);

// Let's see what matches in categoryHelper.ts:
console.log('169:', pCatSlug && (pCatSlug === targetSlug));
console.log('172 pCat === targetSlug:', pCat === targetSlug);
console.log('172 pCat === targetName:', pCat === targetName);
console.log('172 pCat.includes(targetSlug):', pCat.includes(targetSlug));
console.log('172 targetName.includes(pCat):', targetName.includes(pCat));
console.log('173 pCatClean === targetSlugClean:', pCatClean === targetSlugClean);

// What about inferProductCategory?
function inferProductCategory(name, category) {
  const n = (name || "").toLowerCase().trim();
  const c = (category || "").toLowerCase().trim();

  if (n.includes("panjabi") || n.includes("kabli") || n.includes("shirt") || n.includes("pant") || c === "mens-fashion") return "mens-fashion";
  return "gadgets-electronics";
}
console.log('inferProductCategory(mask):', inferProductCategory(pName, pCat));
