const fs = require('fs');
const path = require('path');

const visual = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/visual_index.json'), 'utf8'));

// Test if productMatchesCategory works
function cleanCat(s) {
  return (s || '').toLowerCase().trim().replace(/['’"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function testMatch(p, targetQuery) {
  const targetClean = cleanCat(targetQuery);
  const pCatClean = cleanCat(p.category || p.category_name);
  const pSlugClean = cleanCat(p.category_slug);

  if (pCatClean === targetClean || pSlugClean === targetClean) return true;
  if (targetClean.includes('men') && !targetClean.includes('women')) {
    if (pCatClean.includes('men') && !pCatClean.includes('women')) return true;
    if (pSlugClean === 'mens-fashion') return true;
  }
  if (targetClean.includes('home') || targetClean.includes('lifestyle')) {
    if (pCatClean.includes('home') || pSlugClean === 'home-lifestyle') return true;
  }
  return false;
}

const menMatches = visual.filter(p => testMatch(p, "Men's Fashion"));
console.log("productMatchesCategory for Men's Fashion:", menMatches.length);

const homeMatches = visual.filter(p => testMatch(p, "Home & Lifestyle"));
console.log("productMatchesCategory for Home & Lifestyle:", homeMatches.length);
