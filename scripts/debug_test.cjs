const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('public/visual_index.json', 'utf8'));

function wordMatches(text, keyword) {
  if (!text || !keyword) return false;
  const kw = keyword.trim().toLowerCase();
  const tx = text.toLowerCase();
  if (kw.length <= 6) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    return regex.test(tx);
  }
  return tx.includes(kw);
}

const homeKeywords = [
  "fan", "rechargeable fan", "mini fan", "desk fan", "ceiling fan", "standing fan", "table fan",
  "table lamp", "desk lamp", "night lamp", "led light", "ring light", "tube light", "emergency light",
  "projector", "wall clock", "alarm clock", "kitchen knife", "blender", "grinder", "rice cooker",
  "gas stove", "water bottle", "vacuum cleaner", "humidifier", "electric kettle", "ফ্যান", "বাতি"
];

const testNames = [
  "Premium Black Hammered Finish",
  "HnB Y17 Mini",
  "Baseus Adaman",
  "Islam is light",
  "Butter Fly Lock",
  "Premium Silk Katan"
];

testNames.forEach(tn => {
  const match = catalog.find(p => p.name.includes(tn));
  if (match) {
    const nameLower = match.name.toLowerCase();
    const catLower = (match.category || '').toLowerCase();
    const matchedKw = homeKeywords.filter(k => wordMatches(nameLower, k) || wordMatches(catLower, k));
    console.log(match.name.slice(0, 45), '--> MATCHED HOME KW:', matchedKw);
  } else {
    console.log('Not found in catalog:', tn);
  }
});
