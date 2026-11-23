const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Test regex boundary for words:
// Instead of substring matching `includes("bra")` or `includes("ring")`,
// words must use word boundaries `\bbra\b` or `\bring\b`!
// And if a product's explicit category is "Gadgets & Electronics" or "Men's Fashion", it should NEVER be matched as Women's Fashion!

const gabardine = slim.find(p => p.name && p.name.toLowerCase().includes('gabardine'));
console.log('Gabardine product:', gabardine ? { id: gabardine.id, name: gabardine.name, category: gabardine.category, slug: gabardine.category_slug } : 'null');
