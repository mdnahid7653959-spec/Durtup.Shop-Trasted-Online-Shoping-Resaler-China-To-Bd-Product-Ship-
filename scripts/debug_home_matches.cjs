const fs = require('fs');
const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

const homeKeywords = ['fan', 'rechargeable fan', 'mini fan', 'desk fan', 'light', 'lamp', 'led', 'projector', 'decor', 'clock', 'kitchen', 'bottle', 'cup', 'night light', 'humidifier', 'blender', 'cutter', 'cooker', 'scale', 'ফ্যান', 'লাইট'];

function wordMatches(text, keyword) {
  if (!text || !keyword) return false;
  if (keyword.length <= 6) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

const productsToTest = [
  'Premium Black Hammered Finish',
  'HnB Y17 Mini True Wireless',
  'Baseus Adaman 20000mAh',
  'Islam is light Islamic Hoodie',
  'Butter Fly Lock Olievs',
  'Premium Silk Katan Saree'
];

productsToTest.forEach(query => {
  const p = slim.find(item => item.name.toLowerCase().includes(query.toLowerCase()));
  if (p) {
    console.log('\n--- Checking:', p.name, '| Category:', p.category);
    homeKeywords.forEach(k => {
      const nameMatch = wordMatches(p.name.toLowerCase(), k);
      const catMatch = wordMatches((p.category || '').toLowerCase(), k);
      if (nameMatch || catMatch) {
        console.log('  Matched keyword:', k, '(in name:', nameMatch, 'in cat:', catMatch, ')');
      }
    });
  } else {
    console.log('Not found in slim:', query);
  }
});
