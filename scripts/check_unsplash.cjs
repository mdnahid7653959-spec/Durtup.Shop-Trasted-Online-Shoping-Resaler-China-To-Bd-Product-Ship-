const fs = require('fs');
const helper = fs.readFileSync('src/utils/productImageHelper.ts', 'utf8');
const unsplashUrls = helper.match(/https:\/\/images\.unsplash\.com\/photo-[^\s\"\'\`]+/g);
console.log('Total unsplash URLs in helper:', unsplashUrls ? unsplashUrls.length : 0);
const unique = [...new Set(unsplashUrls)];
console.log('Unique unsplash URLs:', unique.length);

// Check CATEGORY_IMAGES object
const catImagesMatch = helper.match(/export const CATEGORY_IMAGES\s*=\s*(\{[\s\S]*?\n\};)/);
if (catImagesMatch) {
  try {
    // evaluate keys
    const lines = catImagesMatch[1].split('\n');
    let currentKey = '';
    const map = {};
    for (const l of lines) {
      const kMatch = l.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*\[/);
      if (kMatch) {
        currentKey = kMatch[1];
        map[currentKey] = [];
      } else if (currentKey && l.includes('https://')) {
        const u = l.match(/https:\/\/[^\s\"\'\`]+/);
        if (u) map[currentKey].push(u[0]);
      }
    }
    console.log('Category keys count:', Object.keys(map).length);
    for (const [k, urls] of Object.entries(map)) {
      console.log(k, ':', urls.length, 'images');
    }
  } catch (e) {
    console.error(e);
  }
}
