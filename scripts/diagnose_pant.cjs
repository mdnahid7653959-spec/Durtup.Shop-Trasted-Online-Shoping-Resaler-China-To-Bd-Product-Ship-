const fs = require('fs');

// We simulate line by line of categoryHelper.ts productMatchesCategory
const product = {
  id: '35',
  name: "Men's Gabardine Pant (Black Color)",
  category: "Men's Fashion"
};

const categoryQuery = 'womens-fashion';

// Target normalized:
const targetSlug = 'womens-fashion';
const targetParentSlug = undefined;
const targetName = "Women's Fashion".toLowerCase();
const targetKeywords = [];

const pCat = String(product.category || "").toLowerCase().trim();
const pCatName = "";
const pCatSlug = "";
const pCatId = "";
const pName = String(product.name || "").toLowerCase();

const cleanCat = (s) => s.toLowerCase().trim().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const pCatClean = cleanCat(pCat);
const targetSlugClean = cleanCat(targetSlug);

console.log('pCatClean:', pCatClean);
console.log('targetSlugClean:', targetSlugClean);

// Line 169
console.log('169:', pCatSlug && (pCatSlug === targetSlug || pCatSlug === targetParentSlug));
// Line 172
console.log('172 pCat === targetSlug:', pCat === targetSlug);
console.log('172 pCat === targetName:', pCat === targetName);
console.log('172 pCat.includes(targetSlug):', pCat.includes(targetSlug));
console.log('172 targetName.includes(pCat):', targetName.includes(pCat));
console.log('173 pCatClean === targetSlugClean:', pCatClean === targetSlugClean);

// Line 181
console.log('targetSlug === "womens-fashion":', targetSlug === "womens-fashion");
const isOtherMajorCat = pCat.includes("gadget") || pCat.includes("electronic") || pCat.includes("mobile") || pCat.includes("food") || (pCat.includes("men") && !pCat.includes("women"));
console.log('isOtherMajorCat:', isOtherMajorCat);
const hasExplicitWomenKeyword = /\b(women|womens|women's|ladies|lady|মহিলা|মেয়ে)\b/i.test(pName);
console.log('hasExplicitWomenKeyword:', hasExplicitWomenKeyword);

// What about line 472 inferProductCategory?
function inferProductCategory(name, category) {
  const n = (name || "").toLowerCase().trim();
  const c = (category || "").toLowerCase().trim();

  if (n.includes("panjabi") || n.includes("kabli") || n.includes("shirt") || n.includes("pant") || c === "mens-fashion") return "mens-fashion";
  return "gadgets-electronics";
}
console.log('inferProductCategory:', inferProductCategory(pName, pCat));
