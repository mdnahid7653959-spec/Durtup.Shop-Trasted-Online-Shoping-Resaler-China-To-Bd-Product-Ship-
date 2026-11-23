const fs = require('fs');
const path = require('path');

console.log('--- Restoring Authentic Master Product Images ---');

// 1. Load Master Catalog
const masterRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/mohasagor_catalog.json'), 'utf8'));
const masterList = masterRaw.products || masterRaw;

const masterById = new Map();
const masterBySlug = new Map();
const masterByName = new Map();

for (const p of masterList) {
  if (p.id) masterById.set(String(p.id), p);
  if (p.slug) masterBySlug.set(String(p.slug).toLowerCase(), p);
  if (p.name) masterByName.set(String(p.name).toLowerCase().trim(), p);
}

console.log(`Indexed ${masterById.size} master catalog products.`);

// Helper to check if URL is a genuine supplier image
function isAuthenticSupplierUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('mohasagor.com.bd') || url.includes('ecomsellerbd.com');
}

// 2. Restore mohasagor_catalog_slim.json
const slimPath = path.join(__dirname, '../public/mohasagor_catalog_slim.json');
const slimRaw = JSON.parse(fs.readFileSync(slimPath, 'utf8'));
const isSlimWrapped = Boolean(slimRaw.products);
const slimList = isSlimWrapped ? slimRaw.products : slimRaw;

let slimRestoredCount = 0;

for (const p of slimList) {
  const m = masterById.get(String(p.id)) || 
            (p.slug ? masterBySlug.get(String(p.slug).toLowerCase()) : null) || 
            (p.name ? masterByName.get(String(p.name).toLowerCase().trim()) : null);

  if (m) {
    const masterPrimary = m.image || (Array.isArray(m.images) ? m.images[0] : null);
    if (isAuthenticSupplierUrl(masterPrimary)) {
      p.image = masterPrimary;
      slimRestoredCount++;
    }

    if (Array.isArray(m.images) && m.images.length > 0) {
      const validMasterImgs = m.images.filter(isAuthenticSupplierUrl);
      if (validMasterImgs.length > 0) {
        // If current product already has multi-images (e.g. from ecomseller bd), keep or merge
        if (!Array.isArray(p.images) || p.images.length <= 1 || p.images.some(u => u.includes('unsplash.com'))) {
          p.images = validMasterImgs;
        }
      }
    }
  }
}

console.log(`Restored authentic images for ${slimRestoredCount} products in mohasagor_catalog_slim.json`);

// Minified write
const slimOutput = isSlimWrapped ? { ...slimRaw, products: slimList } : slimList;
fs.writeFileSync(slimPath, JSON.stringify(slimOutput));
console.log(`Wrote minified ${slimPath} (${(fs.statSync(slimPath).size / (1024 * 1024)).toFixed(2)} MB)`);

// 3. Restore visual_index.json & visual_index.min.json
const visPath = path.join(__dirname, '../public/visual_index.json');
const visMinPath = path.join(__dirname, '../public/visual_index.min.json');

const visList = JSON.parse(fs.readFileSync(visPath, 'utf8'));
let visRestoredCount = 0;

for (const p of visList) {
  const m = masterById.get(String(p.id)) || 
            (p.slug ? masterBySlug.get(String(p.slug).toLowerCase()) : null) || 
            (p.name ? masterByName.get(String(p.name).toLowerCase().trim()) : null);

  if (m) {
    const masterPrimary = m.image || (Array.isArray(m.images) ? m.images[0] : null);
    if (isAuthenticSupplierUrl(masterPrimary)) {
      p.image = masterPrimary;
      visRestoredCount++;
    }
  }
}

console.log(`Restored authentic images for ${visRestoredCount} products in visual_index.json`);

const visJson = JSON.stringify(visList);
fs.writeFileSync(visPath, visJson);
fs.writeFileSync(visMinPath, visJson);
console.log(`Wrote minified ${visPath} and ${visMinPath}`);
console.log('--- Completed Restoring Authentic Master Images ---');
