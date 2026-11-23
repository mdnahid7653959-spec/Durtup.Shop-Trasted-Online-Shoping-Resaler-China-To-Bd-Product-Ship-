const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

const testCategories = [
  'gadgets-electronics',
  'mens-fashion',
  'womens-fashion',
  'home-lifestyle',
  'health-beauty',
  'kids-zone',
  'foods',
  'winter',
  'watch'
];

testCategories.forEach(cat => {
  const count = slim.filter(p => {
    const c = (p.category || '').toLowerCase();
    const s = (p.category_slug || '').toLowerCase();
    if (cat === 'gadgets-electronics') return c.includes('gadget') || c.includes('electronic') || s === 'gadgets-electronics';
    if (cat === 'mens-fashion') return (c.includes('men') && !c.includes('women')) || s === 'mens-fashion';
    if (cat === 'womens-fashion') return c.includes('women') || s === 'womens-fashion';
    if (cat === 'home-lifestyle') return c.includes('home') || c.includes('lifestyle') || s === 'home-lifestyle';
    if (cat === 'health-beauty') return c.includes('health') || c.includes('beauty') || c.includes('hair') || s === 'health-beauty';
    if (cat === 'kids-zone') return c.includes('kid') || c.includes('baby') || s === 'kids-zone';
    if (cat === 'foods') return c.includes('food') || s === 'foods';
    if (cat === 'winter') return c.includes('winter') || s === 'winter';
    if (cat === 'watch') return c.includes('watch') || s === 'watch';
    return false;
  }).length;
  console.log('Category [' + cat + ']: ' + count + ' products in catalog');
});
