const fs = require('fs');

const content = fs.readFileSync('src/data/fastSeedCatalog.ts', 'utf8');
const cats = {};
const regex = /"category":\s*"([^"]+)"/g;
let m;
while ((m = regex.exec(content)) !== null) {
  cats[m[1]] = (cats[m[1]] || 0) + 1;
}
console.log('Categories in FAST_SEED_PRODUCTS:', cats);
