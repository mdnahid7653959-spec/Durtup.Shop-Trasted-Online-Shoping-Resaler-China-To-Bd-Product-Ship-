const fs = require('fs');

console.log('Optimizing catalogs for ultra-fast, lightweight performance...');

// 1. Optimize mohasagor_catalog_slim.json
const slimPath = 'public/mohasagor_catalog_slim.json';
if (fs.existsSync(slimPath)) {
  const slim = JSON.parse(fs.readFileSync(slimPath, 'utf8'));
  const originalSize = fs.statSync(slimPath).size;

  const optimizedSlim = slim.map(p => {
    const c = { ...p };
    // Keep essential summary in slim catalog; full HTML lives in mohasagor_catalog.json for detail pages
    if (c.details && c.details.length > 150) c.details = c.details.substring(0, 150) + '...';
    if (c.description && c.description.length > 150) c.description = c.description.substring(0, 150) + '...';
    return c;
  });

  const minifiedStr = JSON.stringify(optimizedSlim);
  fs.writeFileSync(slimPath, minifiedStr, 'utf8');
  const newSize = fs.statSync(slimPath).size;
  console.log(`mohasagor_catalog_slim.json: ${(originalSize / 1024 / 1024).toFixed(2)} MB -> ${(newSize / 1024 / 1024).toFixed(2)} MB (${Math.round((1 - newSize / originalSize) * 100)}% lighter!)`);
}

// 2. Minify visual_index.json
const visPath = 'public/visual_index.json';
if (fs.existsSync(visPath)) {
  const vis = JSON.parse(fs.readFileSync(visPath, 'utf8'));
  const origSize = fs.statSync(visPath).size;
  const minified = JSON.stringify(vis);
  fs.writeFileSync(visPath, minified, 'utf8');
  const newSize = fs.statSync(visPath).size;
  console.log(`visual_index.json: ${(origSize / 1024 / 1024).toFixed(2)} MB -> ${(newSize / 1024 / 1024).toFixed(2)} MB`);
}
