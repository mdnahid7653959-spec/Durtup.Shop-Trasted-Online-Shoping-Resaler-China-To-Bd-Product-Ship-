const fs = require('fs');
let file = fs.readFileSync('src/data/fastSeedCatalog.ts', 'utf8');

// Replace mismatched camera image on Saree (ID 40)
file = file.replace(
  'name": "Premium Dupion Silk Saree with Blouse Piece | Soft & Elegant Traditional Wear for Wedding, Eid & Party",\n    "slug": "premium-dupion-silk-saree-with-blouse-piece-soft-elegant-traditional-wear-for-wedding-eid-party-841",\n    "product_code": "841",\n    "category": "Women\'s Fashion",\n    "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop"',
  'name": "Premium Dupion Silk Saree with Blouse Piece | Soft & Elegant Traditional Wear for Wedding, Eid & Party",\n    "slug": "premium-dupion-silk-saree-with-blouse-piece-soft-elegant-traditional-wear-for-wedding-eid-party-841",\n    "product_code": "841",\n    "category": "Women\'s Fashion",\n    "image": "/products/premium-silk-katan-saree.jpg"'
);

// Replace mismatched camera image on Nose Pin (ID 45)
file = file.replace(
  'name": "Premium Quality Fashionable Classic Design Imitation Gold Polish 5 Stone Nose Pin For Women",\n    "slug": "premium-quality-fashionable-classic-design-imitation-gold-polish-5-stone-nose-pin-for-women-444",\n    "product_code": "444",\n    "category": "Women\'s Fashion",\n    "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop"',
  'name": "Premium Quality Fashionable Classic Design Imitation Gold Polish 5 Stone Nose Pin For Women",\n    "slug": "premium-quality-fashionable-classic-design-imitation-gold-polish-5-stone-nose-pin-for-women-444",\n    "product_code": "444",\n    "category": "Women\'s Fashion",\n    "image": "/products/necklace-earrings-set.jpg"'
);

// Replace mismatched camera image on Water Purifier (ID 24)
file = file.replace(
  'name": "SWS Hi-Tech Ceramic Cartidge Water Purifier",\n    "slug": "sws-hi-tech-ceramic-cartidge-water-purifier",\n    "product_code": "297745",\n    "category": "Home & Lifestyle",\n    "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop"',
  'name": "SWS Hi-Tech Ceramic Cartidge Water Purifier",\n    "slug": "sws-hi-tech-ceramic-cartidge-water-purifier",\n    "product_code": "297745",\n    "category": "Home & Lifestyle",\n    "image": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&h=600&fit=crop"'
);

// Replace mismatched camera image on Exercise Gripper (ID 26)
file = file.replace(
  'name": "Adjustable Power Exercise Gripper Strengthener Hand Grip with Counter 5kg to 60kg Presser 1 pc",\n    "slug": "adjustable-power-exercise-gripper-strengthener-hand-grip-with-counter-5kg-to-60kg-presser-1-pc",\n    "product_code": "297686",\n    "category": "Home & Lifestyle",\n    "image": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop"',
  'name": "Adjustable Power Exercise Gripper Strengthener Hand Grip with Counter 5kg to 60kg Presser 1 pc",\n    "slug": "adjustable-power-exercise-gripper-strengthener-hand-grip-with-counter-5kg-to-60kg-presser-1-pc",\n    "product_code": "297686",\n    "category": "Home & Lifestyle",\n    "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&h=600&fit=crop"'
);

// Replace mismatched smartwatch images (ID 37, 38)
file = file.replace(
  'name": "X7 Bluetooth Call Smart Watch",\n    "slug": "x7-bluetooth-call-smart-watch-750",\n    "product_code": "750",\n    "category": "Watch",\n    "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop"',
  'name": "X7 Bluetooth Call Smart Watch",\n    "slug": "x7-bluetooth-call-smart-watch-750",\n    "product_code": "750",\n    "category": "Watch",\n    "image": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop"'
);

file = file.replace(
  'name": "K10 SIM Suported Android Smart Watch",\n    "slug": "k10-sim-suported-android-smart-watch-1650",\n    "product_code": "1650",\n    "category": "Watch",\n    "image": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop"',
  'name": "K10 SIM Suported Android Smart Watch",\n    "slug": "k10-sim-suported-android-smart-watch-1650",\n    "product_code": "1650",\n    "category": "Watch",\n    "image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop"'
);

fs.writeFileSync('src/data/fastSeedCatalog.ts', file, 'utf8');
console.log('Successfully updated fastSeedCatalog.ts images with authentic matches!');
