const fs = require('fs');
const content = fs.readFileSync('src/data/fastSeedCatalog.ts', 'utf8');
const count = (content.match(/"id":/g) || []).length;
console.log('Total items in FAST_SEED_PRODUCTS:', count);
