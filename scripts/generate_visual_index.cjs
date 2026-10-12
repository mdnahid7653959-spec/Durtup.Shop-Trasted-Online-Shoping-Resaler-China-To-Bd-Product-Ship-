const fs = require('fs');
const path = require('path');

const SLIM_PATH = path.join(__dirname, '..', 'public', 'mohasagor_catalog_slim.json');
const ECOM_PATH = path.join(__dirname, '..', 'public', 'ecomseller_catalog.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'visual_index.json');

// Category classification rules
const CATEGORY_MAP = [
  {
    slug: 'jewelry',
    name: 'Jewelry & Ornaments',
    bangla: 'জুয়েলারি ও গহনা',
    keywords: ['necklace', 'ring', 'earring', 'kundan', 'pearl', 'jewelry', 'jewellery', 'chain', 'bangle', 'locket', 'pendant', 'diamond', 'gemstone', 'gold ring', 'nose pin', 'bracelet', 'choker', 'payel', 'bangles', 'আংটি', 'নেকলেস', 'দুল', 'গহনা', 'চুড়ি', 'পায়েল', 'কুণ্ডন', 'jewel', 'gorgeous kundan', 'triangle earrings'],
    defaultAspect: 'square',
    defaultColors: ['Gold', 'Silver / Grey', 'Red', 'Green', 'Pink', 'White']
  },
  {
    slug: 'smart-watches',
    name: 'Smart Watches & Wearables',
    bangla: 'স্মার্ট ওয়াচ ও ঘড়ি',
    keywords: ['smart watch', 'smartwatch', 't800', 'ultra', 'amoled', 'wrist watch', 'watch strap', 'watch band', 'fitness tracker', 'digital watch', 'analog watch', 'oled', 'hk9', 'hw8', 'hoco watch', 'haylou', 'y60', 'series 8', 'series 9', 'olevs watch', 'curren', 'naviforce', 'skmei', 'poedagar', 'rolex', 'ঘড়ি', 'স্মার্টওয়াচ', 'হাত ঘড়ি'],
    defaultAspect: 'square',
    defaultColors: ['Black', 'Silver / Grey', 'Orange', 'Gold']
  },
  {
    slug: 'audio',
    name: 'Earbuds & Audio',
    bangla: 'ইয়ারবাডস ও অডিও',
    keywords: ['earbud', 'earbuds', 'earphone', 'earphones', 'headphone', 'headphones', 'headset', 'airpod', 'airpods', 'tws', 'bluetooth speaker', 'soundbar', 'm10', 'f9', 'pro 4', 'lenovo earbud', 'neckband', 'wireless earbud', 'wireless mic', 'wireless microphone', 'lavalier', 'speaker', 'ইয়ারফোন', 'হেডফোন', 'স্পিকার'],
    defaultAspect: 'square',
    defaultColors: ['Black', 'White', 'Silver / Grey']
  },
  {
    slug: 'gadgets',
    name: 'Gadgets, Mouse & Cameras',
    bangla: 'মাউস, ক্যামেরা ও গ্যাজেটস',
    keywords: [
      'mouse', 'gaming mouse', 'optical mouse', 'wireless mouse', 'usb mouse', 'rgb mouse', 'mouse pad',
      'keyboard', 'gaming keyboard', 'mechanical keyboard', 'trackball',
      'camera', 'cctv', 'ip camera', 'webcam', 'spy camera', 'security camera', 'night vision camera', 'action camera', 'lens',
      'charger', 'fast charger', 'cable', 'type-c', 'power bank', 'adapter', 'separator', 'protector',
      'phone holder', 'tripod', 'router', 'otg', 'battery', 'converter', 'usb',
      'মাউস', 'কীবোর্ড', 'ক্যামেরা', 'চার্জার', 'পাওয়ার ব্যাংক', 'ক্যাবল'
    ],
    defaultAspect: 'square',
    defaultColors: ['Black', 'White', 'Silver / Grey', 'Blue']
  },
  {
    slug: 'beauty',
    name: 'Trimmers & Personal Care',
    bangla: 'ট্রিমার ও শেভার',
    keywords: ['trimmer', 'shaver', 'vgr', 'kemei', 'vintage t9', 'hair dryer', 'straightener', 'hair clipper', 'skincare', 'lotion', 'face cream', 'perfume', 'massager', 'hair brush', 'grooming', 'razor', 'electric razor', 'ট্রিমার', 'শেভার'],
    defaultAspect: 'portrait',
    defaultColors: ['Gold', 'Black', 'Silver / Grey', 'Bronze']
  },
  {
    slug: 'home',
    name: 'Fans, Lights & Home',
    bangla: 'ফ্যান ও লাইটিং',
    keywords: [
      'fan', 'rechargeable fan', 'mini fan', 'desk fan', 'ceiling fan', 'standing fan', 'table fan',
      'table lamp', 'desk lamp', 'night lamp', 'led light', 'ring light', 'tube light', 'emergency light',
      'projector', 'wall clock', 'alarm clock', 'kitchen knife', 'cleaver knife', 'blender', 'grinder',
      'rice cooker', 'gas stove', 'water bottle', 'vacuum cleaner', 'humidifier', 'electric kettle',
      'ফ্যান', 'বাতি', 'টেবিল ল্যাম্প', 'ব্লেন্ডার'
    ],
    defaultAspect: 'square',
    defaultColors: ['White', 'Black', 'Green', 'Blue', 'Pink']
  },
  {
    slug: 'womens-fashion',
    name: "Women's Fashion",
    bangla: 'মহিলাদের ফ্যাশন ও পোশাক',
    keywords: ['saree', 'katan saree', 'silk saree', 'kurti', 'salwar', 'three piece', 'kameez', 'gown', 'hijab', 'borka', 'abaya', 'lehenga', 'dupatta', 'ladies dress', 'women dress', 'শাড়ি', 'কুর্তি', 'থ্রি পিস', 'বোরকা', 'হিজাব'],
    defaultAspect: 'portrait',
    defaultColors: ['Red', 'Pink', 'Green', 'Blue', 'Black', 'Yellow / Gold', 'Purple']
  },
  {
    slug: 'fashion',
    name: "Men's Fashion & Clothing",
    bangla: 'পুরুষদের টি-শার্ট ও হুডি',
    keywords: ['polo shirt', 't-shirt', 'tshirt', 'hoodie', 'winter jacket', 'panjabi', 'cotton shirt', 'sweatpant', 'trouser', 'jersey', 'casual shirt', 'formal shirt', 'jeans pant', 'joggers pant', 'পাঞ্জাবি', 'শার্ট', 'টি-শার্ট', 'হুডি', 'প্যান্ট'],
    defaultAspect: 'portrait',
    defaultColors: ['Black', 'White', 'Navy', 'Blue', 'Red', 'Maroon', 'Green']
  },
  {
    slug: 'shoes-footwear',
    name: 'Footwear & Shoes',
    bangla: 'জুতো ও স্নিকার্স',
    keywords: ['shoe', 'sneaker', 'running shoe', 'sports shoe', 'leather shoe', 'sandal', 'loafer', 'slippers', 'জুতা', 'স্নিকার্স', 'স্যান্ডেল'],
    defaultAspect: 'landscape',
    defaultColors: ['Black', 'White', 'Brown', 'Blue', 'Red']
  },
  {
    slug: 'bags-backpacks',
    name: 'Bags & Backpacks',
    bangla: 'ব্যাগ ও ওয়ালেট',
    keywords: ['backpack', 'handbag', 'shoulder bag', 'purse', 'leather wallet', 'pouch', 'tote bag', 'travel bag', 'duffle bag', 'crossbody bag', 'ব্যাগ', 'ওয়ালেট'],
    defaultAspect: 'portrait',
    defaultColors: ['Black', 'Brown', 'Navy', 'Grey']
  },
  {
    slug: 'toys-kids',
    name: 'Toys & Kids',
    bangla: 'খেলনা ও কিডস',
    keywords: ['drone toy', 'rc car', 'toy car', 'puzzle game', 'robot toy', 'remote control car', 'baby toy', 'kid toy', 'খেলনা'],
    defaultAspect: 'square',
    defaultColors: ['Red', 'Yellow / Gold', 'Blue', 'Green', 'Pink']
  }
];

const COLOR_RULES = [
  { name: 'Gold', hex: '#eab308', keywords: ['gold', 'golden', 'সোনালী', 'yellow', 'হলুদ', 'brass', 'bronze', 'kundan'] },
  { name: 'Silver / Grey', hex: '#94a3b8', keywords: ['silver', 'grey', 'gray', 'সিলভার', 'chrome', 'ash', 'মেটালিক', 'titanium', 'pearl'] },
  { name: 'Black', hex: '#18181b', keywords: ['black', 'কালো', 'dark', 'midnight', 'noir'] },
  { name: 'White', hex: '#f8fafc', keywords: ['white', 'সাদা', 'ivory', 'clear'] },
  { name: 'Orange', hex: '#f97316', keywords: ['orange', 'কমলা', 'amber', 'peach'] },
  { name: 'Red', hex: '#ef4444', keywords: ['red', 'লাল', 'maroon', 'crimson', 'burgundy', 'মেরুন'] },
  { name: 'Navy', hex: '#1e3a8a', keywords: ['navy', 'নেভি', 'dark blue'] },
  { name: 'Blue', hex: '#3b82f6', keywords: ['blue', 'নীল', 'cyan', 'sky', 'royal blue', 'আকাশি'] },
  { name: 'Green', hex: '#22c55e', keywords: ['green', 'সবুজ', 'olive', 'mint', 'emerald'] },
  { name: 'Pink', hex: '#ec4899', keywords: ['pink', 'গোলাপি', 'rose', 'magenta'] },
  { name: 'Purple', hex: '#a855f7', keywords: ['purple', 'বেগুনী', 'violet', 'lavender'] },
  { name: 'Brown', hex: '#78350f', keywords: ['brown', 'বাদামী', 'tan', 'coffee', 'chocolate', 'khaki'] }
];

function textMatchesKeyword(text, keyword) {
  if (!text || !keyword) return false;
  if (keyword.length <= 6) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function detectCategory(name, existingCategory) {
  const combined = ((name || '') + ' ' + (existingCategory || '')).toLowerCase();
  
  // Specific check for jewelry first to avoid falling into generic women's fashion or fashion
  const jewelryCat = CATEGORY_MAP.find(c => c.slug === 'jewelry');
  if (jewelryCat && jewelryCat.keywords.some(k => textMatchesKeyword(combined, k))) {
    return jewelryCat;
  }

  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some(k => textMatchesKeyword(combined, k))) {
      return cat;
    }
  }
  // Default fallback
  return CATEGORY_MAP[3]; // gadgets
}

function detectColor(name, variants) {
  const text = ((name || '') + ' ' + (variants ? JSON.stringify(variants) : '')).toLowerCase();
  for (const color of COLOR_RULES) {
    if (color.keywords.some(k => textMatchesKeyword(text, k))) {
      return color;
    }
  }
  return { name: 'Multi-color', hex: '#6366f1' };
}

function extractTokens(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !['with', 'and', 'for', 'the', 'new', 'best', 'hot', 'pro', 'set'].includes(t))
    .slice(0, 10);
}

function buildIndex() {
  console.log('Generating production visual index for Durtup.shop...');
  
  let slimProducts = [];
  if (fs.existsSync(SLIM_PATH)) {
    slimProducts = JSON.parse(fs.readFileSync(SLIM_PATH, 'utf8'));
  }
  
  let ecomProducts = [];
  if (fs.existsSync(ECOM_PATH)) {
    const raw = JSON.parse(fs.readFileSync(ECOM_PATH, 'utf8'));
    ecomProducts = raw.products || [];
  }

  const allRaw = [...slimProducts, ...ecomProducts];
  console.log(`Found ${allRaw.length} total products across catalogs.`);

  const seenIds = new Set();
  const index = [];

  for (const p of allRaw) {
    const id = String(p.id);
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);

    const name = p.name || 'Product';
    const categoryInfo = detectCategory(name, p.category);
    const colorInfo = detectColor(name, p.product_variants || p.variants);
    const tokens = extractTokens(name);

    index.push({
      id,
      slug: p.slug || id,
      name,
      price: Number(p.price) || 0,
      regular_price: Number(p.regular_price || p.originalPrice) || Number(p.price) || 0,
      image: p.image || (p.images && p.images[0]) || '',
      rating: Number(p.rating) || 4.7,
      sold: Number(p.sold) || 0,
      categorySlug: categoryInfo.slug,
      categoryName: categoryInfo.name,
      categoryBangla: categoryInfo.bangla,
      color: colorInfo.name,
      colorHex: colorInfo.hex,
      aspect: categoryInfo.defaultAspect,
      tokens
    });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2), 'utf8');
  const stats = fs.statSync(OUTPUT_PATH);
  console.log(`Successfully generated visual index with ${index.length} items at ${OUTPUT_PATH} (${(stats.size / 1024).toFixed(1)} KB)`);
}

buildIndex();
