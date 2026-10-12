const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const CATEGORY_MAP = [
  {
    name: 'category-gadgets.webp',
    url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-smartwatch.webp',
    url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-mens.webp',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-womens.webp',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-home.webp',
    url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-foods.webp',
    url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-kids.webp',
    url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-winter.webp',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-watch.webp',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-gift.webp',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-offer.webp',
    url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=500&fit=crop&q=80',
  },
  {
    name: 'category-others.webp',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop&q=80',
  },
];

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log(`Generating ${CATEGORY_MAP.length} category WebP images...`);

  for (const item of CATEGORY_MAP) {
    const targetFile = path.join(publicDir, item.name);
    try {
      console.log(`Fetching ${item.name}...`);
      const buffer = await fetchBuffer(item.url);
      await sharp(buffer)
        .resize(320, 320, { fit: 'cover' })
        .webp({ quality: 85 })
        .toFile(targetFile);
      console.log(`✓ Saved ${item.name} (${fs.statSync(targetFile).size} bytes)`);
    } catch (err) {
      console.error(`✗ Error generating ${item.name}:`, err.message);
    }
  }

  console.log('Category images generation complete!');
}

main();
