const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));
const names = [
  '3 in 1 Panda Desk Lamp with pen holder & sharpener',
  'Long Leather Wallet',
  'X-2652 Portable Bluetooth Speaker',
  'Hot and Cold Compress Massage Gun',
  'EUROBEST LED Steam Iron 2200W',
  'Piyasa Real Saffron Goat Milk Bar Soap 100gm'
];

for (const name of names) {
  const prod = slim.find(p => p.name && p.name.includes(name));
  if (prod) {
    console.log(`Product: ${prod.name}`);
    console.log(`  image: ${prod.image}`);
    console.log(`  product_images:`, prod.product_images);
  } else {
    console.log(`Not found: ${name}`);
  }
}
