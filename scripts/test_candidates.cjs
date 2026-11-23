const fs = require('fs');
const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Test candidates for first 3 products
const testProducts = slim.slice(0, 5);
for (const p of testProducts) {
  console.log('--- Product:', p.name);
  console.log('p.image:', p.image);
  console.log('p.product_images count:', p.product_images?.length);
}
