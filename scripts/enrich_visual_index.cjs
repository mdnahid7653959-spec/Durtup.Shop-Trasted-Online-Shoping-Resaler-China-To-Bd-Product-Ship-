const fs = require('fs');
const path = require('path');

const visualPath = path.join(__dirname, '../public/visual_index.json');
const slimPath = path.join(__dirname, '../public/mohasagor_catalog_slim.json');

if (!fs.existsSync(visualPath) || !fs.existsSync(slimPath)) {
  console.error('Files not found');
  process.exit(1);
}

const visual = JSON.parse(fs.readFileSync(visualPath, 'utf8'));
const slim = JSON.parse(fs.readFileSync(slimPath, 'utf8'));

// Build lookup map from slim
const slimMap = new Map();
slim.forEach(p => {
  if (p.id) slimMap.set(String(p.id), p);
  if (p.slug) slimMap.set(String(p.slug), p);
});

// Infer category helper
function inferCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('watch') || n.includes('smartwatch') || n.includes('quartz') || n.includes('ঘড়ি')) return 'Watch';
  if (n.includes('panjabi') || n.includes('shirt') || n.includes('pant') || n.includes('polo') || n.includes('trouser') || n.includes('boxer') || n.includes('lungi')) return "Men's Fashion";
  if (n.includes('saree') || n.includes('kurti') || n.includes('lehenga') || n.includes('hijab') || n.includes('borkha') || n.includes('jewelry') || n.includes('ring') || n.includes('necklace') || n.includes('earring')) return "Women's Fashion";
  if (n.includes('knife') || n.includes('chopper') || n.includes('blender') || n.includes('cooker') || n.includes('kitchen') || n.includes('lamp') || n.includes('light') || n.includes('cleaner') || n.includes('mop') || n.includes('bed sheet')) return 'Home & Lifestyle';
  if (n.includes('hoodie') || n.includes('jacket') || n.includes('sweater') || n.includes('sweatshirt') || n.includes('windbreaker') || n.includes('winter')) return 'Winter';
  if (n.includes('toy') || n.includes('doll') || n.includes('puzzle') || n.includes('baby') || n.includes('kid')) return 'Kids Zone';
  if (n.includes('honey') || n.includes('food') || n.includes('dates') || n.includes('ghee') || n.includes('milkshake')) return 'Foods';
  if (n.includes('earbud') || n.includes('headphone') || n.includes('speaker') || n.includes('charger') || n.includes('cable') || n.includes('power bank') || n.includes('gadget') || n.includes('camera') || n.includes('mouse') || n.includes('keyboard')) return 'Gadgets & Electronics';
  return 'Gadgets & Electronics';
}

function normalizeSlug(cat) {
  const c = (cat || '').toLowerCase().trim();
  if (c.includes('men') && !c.includes('women')) return 'mens-fashion';
  if (c.includes('women')) return 'womens-fashion';
  if (c.includes('gadget') || c.includes('electronic')) return 'gadgets-electronics';
  if (c.includes('home') || c.includes('lifestyle')) return 'home-lifestyle';
  if (c.includes('watch')) return 'watch';
  if (c.includes('food')) return 'foods';
  if (c.includes('kid') || c.includes('baby')) return 'kids-zone';
  if (c.includes('winter')) return 'winter';
  if (c.includes('gift')) return 'customize-gift';
  if (c.includes('offer')) return 'offer';
  return 'others';
}

const banglaMap = {
  'mens-fashion': 'পুরুষদের পোশাক',
  'womens-fashion': 'শাড়ি ও ড্রেস',
  'gadgets-electronics': 'ইলেকট্রনিক্স ও গ্যাজেটস',
  'home-lifestyle': 'হোম ও লিভিং',
  'watch': 'স্মার্ট ও রিস্ট ওয়াচ',
  'kids-zone': 'বাচ্চাদের খেলনা ও যত্ন',
  'foods': 'খাবার ও পুষ্টি',
  'winter': 'উইন্টার কালেকশন',
  'customize-gift': 'কাস্টমাইজ ও গিফট',
  'offer': 'অফার ও কম্বো',
  'others': 'অন্যান্য পণ্য'
};

let enrichedCount = 0;
const catBreakdown = {};

visual.forEach(p => {
  const match = slimMap.get(String(p.id)) || slimMap.get(String(p.slug));
  let cat = match?.category || match?.category_name || p.category || p.category_name;
  if (!cat || cat === 'none' || cat === 'General' || cat === 'Gadgets, Mouse & Cameras') {
    cat = inferCategory(p.name);
  }
  const slug = normalizeSlug(cat);
  const bangla = banglaMap[slug] || 'সাধারণ পণ্য';

  // Keep ALL variations completely consistent
  p.category = cat;
  p.category_name = cat;
  p.categoryName = cat;
  p.category_slug = slug;
  p.categorySlug = slug;
  p.categoryBangla = bangla;
  enrichedCount++;

  catBreakdown[cat] = (catBreakdown[cat] || 0) + 1;
});

fs.writeFileSync(visualPath, JSON.stringify(visual, null, 2), 'utf8');

const minPath = path.join(__dirname, '../public/visual_index.min.json');
if (fs.existsSync(minPath)) {
  fs.writeFileSync(minPath, JSON.stringify(visual), 'utf8');
}

console.log(`Enriched ${enrichedCount} products in visual_index.json!`);
console.log('Category breakdown:');
console.table(catBreakdown);
