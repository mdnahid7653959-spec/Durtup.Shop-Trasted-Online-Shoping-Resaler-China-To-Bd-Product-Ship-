import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectCategoryKey, getCategoryFallbackImage, getCategoryFallbackImages, CATEGORY_IMAGES } from '../src/utils/productImageHelper.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const slimPath = path.join(__dirname, '../public/mohasagor_catalog_slim.json');
const visualPath = path.join(__dirname, '../public/visual_index.json');

const slim = JSON.parse(fs.readFileSync(slimPath, 'utf8'));
const visual = JSON.parse(fs.readFileSync(visualPath, 'utf8'));

console.log(`Loaded ${slim.length} products from slim, ${visual.length} from visual_index.`);

// Known generic fallback Unsplash IDs that were improperly mass-assigned to products:
const GENERIC_SHIRT_IDS = ['photo-1581655353564', 'photo-1521572267360', 'photo-1562157873', 'photo-1583743814966'];
const GENERIC_POWERBANK_IDS = ['photo-1609091839311'];
const GENERIC_BAG_IDS = ['photo-1553062407'];
const GENERIC_GADGET_IDS = ['photo-1526170375'];
const WATERMELON_IDS = ['photo-1587049352846'];

function shouldReassign(p, catKey) {
  const img = (p.image || '').toLowerCase();
  
  // Always fix dead supplier or watermelon images
  if (img.includes('mohasagor.com.bd') || WATERMELON_IDS.some(id => img.includes(id))) {
    return true;
  }

  // If product is NOT a shirt/tshirt but has a generic shirt image:
  if (catKey !== 'shirt' && catKey !== 'jersey' && GENERIC_SHIRT_IDS.some(id => img.includes(id))) {
    return true;
  }

  // If product is NOT a powerbank/charger but has powerbank image:
  if (catKey !== 'powerbank' && catKey !== 'electronics' && GENERIC_POWERBANK_IDS.some(id => img.includes(id))) {
    return true;
  }

  // If product is NOT a bag but has backpack image:
  if (catKey !== 'bags' && GENERIC_BAG_IDS.some(id => img.includes(id))) {
    return true;
  }

  // If product is a watch, hair_care, saree, borka, jewelry, kids_fashion, tripod, headphones, kitchen
  // but has generic electronics image:
  if (['watch', 'hair_care', 'saree', 'borka', 'jewelry', 'kids_fashion', 'tripod', 'headphones', 'hoodie'].includes(catKey) && GENERIC_GADGET_IDS.some(id => img.includes(id))) {
    return true;
  }

  return false;
}

let fixedSlimCount = 0;

slim.forEach((p, index) => {
  const numId = typeof p.id === 'number' ? p.id : (parseInt(p.id) || index);
  const catKey = detectCategoryKey(p.name, p.category || p.category_name);

  // Specific high-priority fix for Nanotech Hair Oil
  if (p.id === '5227' || (p.name && p.name.toLowerCase().includes('nanotech hair oil'))) {
    p.category = "Hair Care";
    p.category_name = "Hair Care";
    p.categorySlug = "hair-care";
    p.image = "https://images.unsplash.com/photo-1608248597359-2ff9242d5930?w=600&h=600&fit=crop";
    p.images = [
      "https://images.unsplash.com/photo-1608248597359-2ff9242d5930?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop"
    ];
    p.product_images = [
      { id: "img-0", image_url: "https://images.unsplash.com/photo-1608248597359-2ff9242d5930?w=600&h=600&fit=crop", is_primary: true, sort_order: 0 },
      { id: "img-1", image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop", is_primary: false, sort_order: 1 }
    ];
    fixedSlimCount++;
    return;
  }

  // Specific fix for BINBOND 818 Stainless Steel Watch
  if (p.id === '5878' || (p.name && p.name.toLowerCase().includes('binbond 818'))) {
    p.image = "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop";
    p.images = ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop"];
    p.product_images = [{ id: "img-0", image_url: p.image, is_primary: true, sort_order: 0 }];
    fixedSlimCount++;
    return;
  }

  if (catKey && shouldReassign(p, catKey)) {
    const newImg = getCategoryFallbackImage(p.name, p.category || p.category_name, numId);
    if (newImg && newImg !== p.image) {
      p.image = newImg;
      p.images = [newImg];
      p.product_images = [{ id: 'img-0', image_url: newImg, is_primary: true, sort_order: 0 }];
      fixedSlimCount++;
    }
  }
});

// Update visual_index from updated slim map
const slimMap = new Map();
slim.forEach(p => slimMap.set(String(p.id), p));

let fixedVisualCount = 0;
visual.forEach((v, index) => {
  const match = slimMap.get(String(v.id));
  if (match) {
    if (v.image !== match.image) {
      v.image = match.image;
      fixedVisualCount++;
    }
    if (match.category && match.category !== v.category) {
      v.category = match.category;
      v.category_name = match.category;
      v.categoryName = match.category;
    }
  } else {
    const catKey = detectCategoryKey(v.name, v.category || v.category_name);
    if (catKey && shouldReassign(v, catKey)) {
      const numId = typeof v.id === 'number' ? v.id : (parseInt(v.id) || index);
      const newImg = getCategoryFallbackImage(v.name, v.category || v.category_name, numId);
      if (newImg && newImg !== v.image) {
        v.image = newImg;
        fixedVisualCount++;
      }
    }
  }
});

fs.writeFileSync(slimPath, JSON.stringify(slim, null, 2), 'utf8');
fs.writeFileSync(visualPath, JSON.stringify(visual, null, 2), 'utf8');

const minPath = path.join(__dirname, '../public/visual_index.min.json');
if (fs.existsSync(minPath)) {
  fs.writeFileSync(minPath, JSON.stringify(visual), 'utf8');
}

console.log(`Successfully fixed ${fixedSlimCount} products in slim, ${fixedVisualCount} in visual_index!`);
