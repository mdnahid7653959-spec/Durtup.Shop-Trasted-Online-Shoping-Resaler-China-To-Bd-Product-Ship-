const fs = require('fs');

// Emulate buildSections from useHomeProducts.ts
const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Check mapDbProduct logic
const sample = slim.slice(0, 15);
for (const p of sample) {
  console.log({
    id: p.id,
    name: p.name.slice(0, 30),
    image: p.image,
    images: p.images ? p.images.length : 0,
    hasImgProp: 'image' in p,
    imageType: typeof p.image
  });
}
