const fs = require('fs');
const names = [
  "2-in-1 Dumbbell Shape Water Bottle",
  "Electric Panci Mini Non-Stick",
  "Creative Detachable Shoe Rack",
  "T900 Ultra",
  "Butter Fly Lock OLEVS 9931G",
  "Eiffel Tower Metal Showpiece",
  "World Map 3D Rotating Glove",
  "Men's Half Sleeve T",
  "Maximum MB3031",
  "Aluminum Alloy Adjustable Portable",
  "Hair Straightener Styling Comb"
];

for (const file of ['public/mohasagor_catalog_slim.json', 'public/mohasagor_catalog.json']) {
  if (fs.existsSync(file)) {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`\n=== CHECKING ${file} (total: ${raw.length}) ===`);
    for (const n of names) {
      const found = raw.find(p => p.name && p.name.toLowerCase().includes(n.toLowerCase()));
      if (found) {
        console.log(`Found: "${found.name.slice(0, 40)}" | id: ${found.id} | image: ${found.image} | images: ${found.images ? found.images.length : 0}`);
      }
    }
  }
}
