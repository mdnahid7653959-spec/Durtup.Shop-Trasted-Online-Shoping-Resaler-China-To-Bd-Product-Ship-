const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

function isWomensProduct(p) {
  const pCat = String(p.category || '').toLowerCase().trim();
  const pCatSlug = String(p.category_slug || '').toLowerCase().trim();
  const pName = String(p.name || '').toLowerCase().trim();

  // 1. If explicit category is Women's Fashion, it is Women's Fashion
  if (pCat === "women's fashion" || pCat.includes('women') || pCatSlug === 'womens-fashion' || pCatSlug.includes('women')) {
    return true;
  }

  // 2. If explicitly belonging to another major category (Gadgets, Men's Fashion, etc.), exclude unless name explicitly specifies women/ladies/মহিলা
  const isOtherMajorCat = pCat.includes('gadget') || pCat.includes('electronic') || pCat.includes('mobile') || pCat.includes('food') || (pCat.includes('men') && !pCat.includes('women'));
  const hasExplicitWomenKeyword = /\b(women|womens|women's|ladies|lady|মহিলা|মেয়ে)\b/i.test(pName);

  if (isOtherMajorCat && !hasExplicitWomenKeyword) {
    return false;
  }

  // 3. Name-based match with strict word boundaries
  const womenKeywordRegex = /\b(saree|sari|sharee|kurti|kurtis|lehenga|salwar|kameez|kamiz|tunic|palazzo|hijab|hijabs|abaya|borkha|burqa|khimar|niqab|jewelry|jewellery|necklace|necklaces|earring|earrings|bracelet|bracelets|bangle|bangles|lingerie|nighty|bra|bras|ring|rings)\b/i;
  const isBengaliWomen = /শাড়ি|লেহেঙ্গা|বোরকা|হিজাব|মহিলা|মেয়ে/.test(pName);

  if (womenKeywordRegex.test(pName) || isBengaliWomen) {
    // Avoid false positives like "braided cable", "spring", "bearing", "panjabi", "men's", etc.
    const isFalsePositive = /\b(braided|bracket|brake|spring|bearing|hearing|steering|cable|charger|panjabi|punjabi|boxer|lungi|gents|men|mens)\b/i.test(pName) && !hasExplicitWomenKeyword;
    if (!isFalsePositive) {
      return true;
    }
  }

  return false;
}

const matched = slim.filter(isWomensProduct);
console.log('Total matched Women\'s Fashion products:', matched.length);
console.log('Sample matches:');
matched.slice(0, 10).forEach(p => console.log(' - [' + p.id + '] ' + p.name.slice(0, 50) + ' (' + p.category + ')'));

// Check if braided cable is excluded:
const cable = slim.find(p => p.name && p.name.includes('240W 5A Fast'));
console.log('Is cable matched as women?', isWomensProduct(cable));

// Check if men's gabardine is excluded:
const gabardine = slim.find(p => p.name && p.name.includes("Men's Gabardine"));
console.log('Is gabardine matched as women?', isWomensProduct(gabardine));
