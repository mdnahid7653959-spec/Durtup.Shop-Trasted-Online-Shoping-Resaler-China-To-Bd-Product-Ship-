const fs = require('fs');
const path = require('path');

const slim = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/mohasagor_catalog_slim.json'), 'utf8'));
const top250 = slim.slice(0, 250);

const content = `import type { Product } from "@/components/products/ProductCard";

export const FAST_SEED_PRODUCTS: Product[] = ${JSON.stringify(top250, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/fastSeedCatalog.ts'), content);
console.log('fastSeedCatalog.ts updated with', top250.length, 'clean live products with authentic images and slugs!');
