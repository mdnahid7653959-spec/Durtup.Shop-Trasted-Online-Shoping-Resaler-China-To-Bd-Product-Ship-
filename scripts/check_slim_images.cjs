const fs = require('fs');
const slimPath = 'public/mohasagor_catalog_slim.json';

if (fs.existsSync(slimPath)) {
  const data = JSON.parse(fs.readFileSync(slimPath, 'utf8'));
  console.log("Total products in slim:", data.length);
  const sample = data.slice(0, 10);
  for (const p of sample) {
    console.log({
      id: p.id,
      name: p.name,
      image: p.image,
      thumbnail: p.thumbnail,
      images: p.images
    });
  }
} else {
  console.log("No slim catalog found");
}
