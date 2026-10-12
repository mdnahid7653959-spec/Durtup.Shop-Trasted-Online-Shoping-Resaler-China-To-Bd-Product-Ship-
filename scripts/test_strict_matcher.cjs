const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('public/visual_index.json', 'utf8'));

console.log('Testing visual matching logic on real catalog of', catalog.length, 'products...');

function wordMatches(text, keyword) {
  if (!text || !keyword) return false;
  const kw = keyword.trim().toLowerCase();
  const tx = text.toLowerCase();
  if (kw.length <= 6) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    return regex.test(tx);
  }
  return tx.includes(kw);
}

function matchProducts({ detectedCategorySlug, detectedKeywords = [], color = 'Black' }) {
  const scored = [];

  for (const p of catalog) {
    // 1. Strict Category Isolation: product must belong to category or match its core keywords
    const pCatSlug = p.categorySlug || '';
    const pName = (p.name || '').toLowerCase();
    
    // Check category alignment
    const isCatMatch = (pCatSlug === detectedCategorySlug);
    if (!isCatMatch) {
      continue; // Strictly reject products from other categories
    }

    let score = 50; // Base score for matching category
    const reasons = [p.categoryBangla || p.categoryName || 'Category Match'];

    // 2. Keyword relevance
    for (const kw of detectedKeywords) {
      if (wordMatches(pName, kw)) {
        score += 30;
        reasons.push(kw);
        break;
      }
    }

    // 3. Color relevance
    if (color && p.color && (p.color.toLowerCase() === color.toLowerCase() || wordMatches(pName, color))) {
      score += 15;
      reasons.push(`${color} Color`);
    }

    // 4. Rating tiebreaker
    if (p.rating >= 4.7) score += 3;

    const finalScore = Math.min(98, score);
    if (finalScore >= 60) {
      scored.push({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.categoryBangla,
        score: finalScore,
        reasons
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10);
}

// Test 1: Gaming Mouse
console.log('\n--- TEST 1: Gaming Mouse (Category: gadgets, Keywords: [mouse, gaming]) ---');
const mouseMatches = matchProducts({ detectedCategorySlug: 'gadgets', detectedKeywords: ['mouse', 'gaming'], color: 'Black' });
mouseMatches.forEach(m => console.log(`[${m.score}%] ${m.category} - ${m.name.slice(0, 45)} (৳${m.price})`));

// Test 2: Jewelry Ring
console.log('\n--- TEST 2: Gemstone Ring (Category: jewelry, Keywords: [ring, gemstone]) ---');
const ringMatches = matchProducts({ detectedCategorySlug: 'jewelry', detectedKeywords: ['ring', 'gemstone'], color: 'Gold' });
ringMatches.forEach(m => console.log(`[${m.score}%] ${m.category} - ${m.name.slice(0, 45)} (৳${m.price})`));

// Test 3: Camera / CCTV
console.log('\n--- TEST 3: Camera (Category: gadgets, Keywords: [camera, cctv, ip camera]) ---');
const camMatches = matchProducts({ detectedCategorySlug: 'gadgets', detectedKeywords: ['camera', 'cctv', 'ip camera'], color: 'Black' });
camMatches.forEach(m => console.log(`[${m.score}%] ${m.category} - ${m.name.slice(0, 45)} (৳${m.price})`));

// Test 4: Fans & Lighting
console.log('\n--- TEST 4: Fan (Category: home, Keywords: [fan, rechargeable fan]) ---');
const fanMatches = matchProducts({ detectedCategorySlug: 'home', detectedKeywords: ['fan', 'rechargeable fan'], color: 'White' });
fanMatches.forEach(m => console.log(`[${m.score}%] ${m.category} - ${m.name.slice(0, 45)} (৳${m.price})`));

// Check if any hoodie or saree or cleaver appeared in Test 1 or Test 4
const badInMouse = mouseMatches.filter(m => m.name.toLowerCase().includes('hoodie') || m.name.toLowerCase().includes('saree') || m.name.toLowerCase().includes('cleaver'));
const badInFan = fanMatches.filter(m => m.name.toLowerCase().includes('hoodie') || m.name.toLowerCase().includes('saree') || m.name.toLowerCase().includes('earbuds'));

console.log('\n--- SANITY CHECK ---');
console.log('Bad items in Mouse results:', badInMouse.length);
console.log('Bad items in Fan results:', badInFan.length);
