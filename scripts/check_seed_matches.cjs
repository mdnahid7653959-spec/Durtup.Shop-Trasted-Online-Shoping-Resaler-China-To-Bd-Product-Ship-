const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));
const slimMap = new Map();
slim.forEach(p => {
  if (p.id) slimMap.set(String(p.id).toLowerCase(), p);
  if (p.slug) slimMap.set(String(p.slug).toLowerCase(), p);
});

console.log('Slim map entries:', slimMap.size);

// Read current fast seed catalog
const seedCode = fs.readFileSync('src/data/fastSeedCatalog.ts', 'utf8');
const lines = seedCode.split('\n');

let seedIds = [];
let currentId = null;
lines.forEach(l => {
  const m = l.match(/"id":\s*"([^"]+)"/);
  if (m) seedIds.push(m[1]);
});
console.log('Seed IDs found:', seedIds.length);
let matched = 0;
seedIds.forEach(id => {
  if (slimMap.has(id.toLowerCase())) matched++;
});
console.log('Matched in slim:', matched);
