const fs = require('fs');

const slim = JSON.parse(fs.readFileSync('public/mohasagor_catalog_slim.json', 'utf8'));

// Find these products
const searchNames = [
  "2-in-1 Dumbbell",
  "Electric Panci",
  "Creative Detachable Shoe Rack",
  "T900 Ultra",
  "OLEVS 9931G",
  "Eiffel Tower",
  "World Map 3D",
  "Half Sleeve T",
  "Maximum MB3031",
  "Hair Straightener"
];

for (const sn of searchNames) {
  const match = slim.find(p => p.name.toLowerCase().includes(sn.toLowerCase()));
  if (match) {
    console.log("------------------------------------------");
    console.log("Name:", match.name);
    console.log("Image:", match.image);
    console.log("Images array:", match.images);
  }
}
