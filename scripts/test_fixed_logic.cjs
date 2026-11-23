const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));
const ecom = JSON.parse(fs.readFileSync('public/ecomseller_catalog.json', 'utf8'));

// Test products:
const womensTarget = "womens-fashion";
const gadgetsTarget = "gadgets-electronics";
const mensTarget = "mens-fashion";

const testProducts = [
  { name: "4 PCS Hooded Scarf Mask", category: "Men's Fashion", category_slug: "mens-fashion" },
  { name: "Men's Gabardine Pant (Black Color)", category: "Men's Fashion" },
  { name: "Casual Men's Sweatpant Trouser Black + Red", category: "Men's Fashion" },
  { name: "X5 Full HD Mini WiFi IP Camera", category: "Gadgets & Electronics", category_slug: "gadgets-electronics" },
  { name: "Silk Katan Saree", category: "Women's Fashion", category_slug: "womens-fashion" },
  { name: "Chowtushkoni Dyuti Women's Ring", category: "Women's Fashion", category_slug: "womens-fashion" }
];

function cleanCat(s) {
  return (s || "").toLowerCase().trim().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fixedProductMatchesCategory(product, targetSlug) {
  const pCat = String(product.category || "").toLowerCase().trim();
  const pCatSlug = String(product.category_slug || "").toLowerCase().trim();
  const pName = String(product.name || "").toLowerCase();

  const pCatClean = cleanCat(pCatSlug || pCat);
  const targetClean = cleanCat(targetSlug);

  // Exact slug / category match
  if (pCatClean === targetClean) {
    // Cross-contamination safeguard: Men vs Women
    if (targetClean === "womens-fashion" && (pCatClean === "mens-fashion" || (/\b(men|mens)\b/.test(pCat) && !pCat.includes("women")))) {
      return false;
    }
    if (targetClean === "mens-fashion" && (pCatClean === "womens-fashion" || pCat.includes("women"))) {
      return false;
    }
    return true;
  }

  // Women's Fashion specific checks
  if (targetClean === "womens-fashion") {
    // If category is explicitly men's fashion, reject unless explicit women's keyword
    if (pCatClean === "mens-fashion" || (pCat.includes("men") && !pCat.includes("women"))) {
      return false;
    }
    const womenKeywordRegex = /\b(saree|sari|sharee|kurti|kurtis|lehenga|lehengas|salwar|kameez|kamiz|tunic|palazzo|two piece|three piece|hijab|hijabs|abaya|borkha|burqa|khimar|niqab|jewelry|jewellery|necklace|necklaces|earring|earrings|bracelet|bracelets|bangle|bangles|lingerie|nighty|bra|bras|ring|rings)\b/i;
    if (womenKeywordRegex.test(pName)) {
      const isFalsePositive = /\b(braided|bracket|brake|spring|bearing|hearing|steering|cable|charger|panjabi|punjabi|boxer|lungi|gents|men|mens)\b/i.test(pName);
      return !isFalsePositive;
    }
    return false;
  }

  // Men's Fashion specific checks
  if (targetClean === "mens-fashion") {
    if (pCatClean === "womens-fashion" || pCat.includes("women")) return false;
    if (/\b(panjabi|punjabi|pajama|t-shirt|tshirt|polo|shirt|gabardine|pant|trouser|jogger|boxer|lungi|katua|fatua)\b/i.test(pName)) {
      if (!/\b(women|womens|ladies|lady|saree|kurti|hijab|borkha)\b/i.test(pName)) return true;
    }
    return false;
  }

  // Gadgets & Electronics specific checks
  if (targetClean === "gadgets-electronics") {
    if (pCatClean === "gadgets-electronics") return true;
    if (/\b(camera|cctv|charger|cable|earbuds|tws|headphone|speaker|router|wifi|ip camera|power bank|smart gadget)\b/i.test(pName)) {
      return true;
    }
    return false;
  }

  return false;
}

console.log('--- TESTING WOMEN\'S FASHION ---');
for (const p of testProducts) {
  console.log(p.name, '->', fixedProductMatchesCategory(p, 'womens-fashion'));
}

console.log('\n--- TESTING GADGETS & ELECTRONICS ---');
for (const p of testProducts) {
  console.log(p.name, '->', fixedProductMatchesCategory(p, 'gadgets-electronics'));
}

console.log('\n--- TESTING MEN\'S FASHION ---');
for (const p of testProducts) {
  console.log(p.name, '->', fixedProductMatchesCategory(p, 'mens-fashion'));
}
