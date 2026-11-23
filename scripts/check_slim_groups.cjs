const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Group slim products by category
const byCat = {};
slim.forEach(p => {
  const cat = p.category || 'Other';
  if (!byCat[cat]) byCat[cat] = [];
  byCat[cat].push(p);
});

console.log('Categories available:');
Object.keys(byCat).forEach(k => console.log(k, byCat[k].length));
