const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));
console.log('Slim catalog length:', slim.length);

const categories = {};
slim.forEach(p => {
  const c = p.category || 'unknown';
  categories[c] = (categories[c] || 0) + 1;
});
console.log('Categories distribution in slim:', categories);

// Check products matching "women"
const womenProds = slim.filter(p => {
  const cat = (p.category || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  return cat.includes('women') || cat.includes('sharee') || cat.includes('saree') || name.includes('saree') || name.includes('kurti') || name.includes('lehenga') || name.includes('hijab') || name.includes('borkha') || name.includes('burqa') || name.includes('jewelry') || name.includes('necklace') || name.includes('ring') || name.includes('earring');
});
console.log('Products matching women:', womenProds.length);
console.log('Sample women products:', womenProds.slice(0, 5).map(p => ({ id: p.id, name: p.name, cat: p.category, img: p.image })));
