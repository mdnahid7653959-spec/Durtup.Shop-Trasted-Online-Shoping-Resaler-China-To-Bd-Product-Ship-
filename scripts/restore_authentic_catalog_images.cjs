const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '../public/mohasagor_catalog.json');
const slimPath = path.join(__dirname, '../public/mohasagor_catalog_slim.json');
const visualPath = path.join(__dirname, '../public/visual_index.json');
const visualMinPath = path.join(__dirname, '../public/visual_index.min.json');

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const slim = JSON.parse(fs.readFileSync(slimPath, 'utf8'));
const visual = JSON.parse(fs.readFileSync(visualPath, 'utf8'));

const masterMap = new Map();
master.forEach(p => {
  if (p.id) masterMap.set(String(p.id), p);
});

let restoredSlim = 0;
slim.forEach(p => {
  const m = masterMap.get(String(p.id));
  if (m) {
    if (m.image && m.image.includes('mohasagor.com.bd')) {
      p.image = m.image;
      p.images = Array.isArray(m.images) && m.images.length > 0 ? m.images : [m.image];
      p.product_images = Array.isArray(m.product_images) && m.product_images.length > 0 ? m.product_images : [{ id: 'img-0', image_url: m.image, is_primary: true, sort_order: 0 }];
      restoredSlim++;
    }
  }
});

// Also update visual_index
const slimMap = new Map();
slim.forEach(p => slimMap.set(String(p.id), p));

let restoredVisual = 0;
visual.forEach(v => {
  const s = slimMap.get(String(v.id));
  if (s && s.image && v.image !== s.image) {
    v.image = s.image;
    restoredVisual++;
  }
});

fs.writeFileSync(slimPath, JSON.stringify(slim, null, 2), 'utf8');
fs.writeFileSync(visualPath, JSON.stringify(visual, null, 2), 'utf8');
if (fs.existsSync(visualMinPath)) {
  fs.writeFileSync(visualMinPath, JSON.stringify(visual), 'utf8');
}

console.log(`Successfully restored authentic catalog images: ${restoredSlim} in slim, ${restoredVisual} in visual_index.`);
