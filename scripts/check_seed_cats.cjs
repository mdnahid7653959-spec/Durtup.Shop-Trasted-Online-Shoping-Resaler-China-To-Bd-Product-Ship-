const fs = require('fs');
const content = fs.readFileSync('src/data/fastSeedCatalog.ts', 'utf8');

// Parse items
const items = [];
const blocks = content.split(/\n\s*\{\s*\n\s*"id":/);
console.log('Total blocks:', blocks.length);
let withCategory = 0;
let withoutCategory = 0;
blocks.forEach((b, i) => {
  if (i === 0) return;
  if (b.includes('"category":')) withCategory++;
  else withoutCategory++;
});
console.log('With category:', withCategory, 'Without category:', withoutCategory);
