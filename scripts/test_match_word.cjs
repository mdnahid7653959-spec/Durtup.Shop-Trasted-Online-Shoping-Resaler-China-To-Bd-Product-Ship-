const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));
const cable = slim.find(p => p.name && p.name.includes('240W 5A Fast'));

const pName = cable.name.toLowerCase();
console.log('Includes ring?', pName.includes('ring'));
// Let's find what substring matched:
const matchWords = ["saree", "sari", "sharee", "kurti", "lehenga", "salwar", "kameez", "kamiz", "tunic", "palazzo", "two piece", "three piece", "hijab", "abaya", "borkha", "burqa", "khimar", "niqab", "jewelry", "jewellery", "ring", "necklace", "earring", "bracelet", "bangle", "bra", "lingerie", "nighty"];
matchWords.forEach(w => {
  if (pName.includes(w)) console.log('MATCHED WORD:', w, 'at index', pName.indexOf(w), 'around:', pName.slice(Math.max(0, pName.indexOf(w) - 5), pName.indexOf(w) + w.length + 5));
});
