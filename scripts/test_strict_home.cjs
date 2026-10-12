const fs = require('fs');
const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// New strict home keywords without generic "led" and "light"
const strictHomeKeywords = [
  "fan", "rechargeable fan", "mini fan", "desk fan", "ceiling fan", "standing fan", "table fan", "exhaust fan",
  "table lamp", "desk lamp", "night lamp", "led light", "ring light", "tube light", "emergency light", "bulb",
  "lamp", "projector", "wall clock", "alarm clock", "kitchen knife", "blender", "grinder", "rice cooker",
  "gas stove", "water bottle", "vacuum cleaner", "humidifier", "electric kettle", "scale", "ফ্যান", "বাতি"
];

function wordMatches(text, keyword) {
  if (!text || !keyword) return false;
  if (keyword.length <= 6) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

const badMatches = [
  'HnB Y17 Mini True Wireless',
  'Baseus Adaman 20000mAh',
  'Islam is light Islamic Hoodie',
  'Premium Silk Katan Saree',
  'Butter Fly Lock OLEVS'
];

console.log('--- TESTING STRICT HOME KEYWORDS ---');
badMatches.forEach(query => {
  const p = slim.find(item => item.name.toLowerCase().includes(query.toLowerCase()));
  if (p) {
    let matched = false;
    strictHomeKeywords.forEach(k => {
      if (wordMatches(p.name.toLowerCase(), k) || wordMatches((p.category || '').toLowerCase(), k)) {
        console.log(`FAIL: ${p.name.slice(0, 40)} STILL MATCHED: ${k}`);
        matched = true;
      }
    });
    if (!matched) {
      console.log(`PASS: ${p.name.slice(0, 45)} did NOT match Home!`);
    }
  }
});
