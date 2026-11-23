const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Test filtering
const testSlugs = ['womens-fashion', 'mens-fashion', 'gadgets-electronics', 'foods', 'kids-zone', 'watch', 'winter', 'home-lifestyle'];

testSlugs.forEach(slug => {
  const matchingInSlim = slim.filter(p => {
    const c = (p.category || '').toLowerCase();
    const s = (p.category_slug || '').toLowerCase();
    if (slug === 'womens-fashion') return c.includes('women') || s === 'womens-fashion';
    if (slug === 'mens-fashion') return (c.includes('men') && !c.includes('women')) || s === 'mens-fashion';
    if (slug === 'gadgets-electronics') return c.includes('gadget') || c.includes('electronic') || s === 'gadgets-electronics';
    if (slug === 'foods') return c.includes('food') || s === 'foods';
    if (slug === 'kids-zone') return c.includes('kid') || c.includes('baby') || s === 'kids-zone';
    if (slug === 'watch') return c.includes('watch') || s === 'watch';
    if (slug === 'winter') return c.includes('winter') || s === 'winter';
    if (slug === 'home-lifestyle') return c.includes('home') || c.includes('lifestyle') || s === 'home-lifestyle';
    return false;
  });
  console.log('Category [' + slug + '] matches in slim: ' + matchingInSlim.length);
});
