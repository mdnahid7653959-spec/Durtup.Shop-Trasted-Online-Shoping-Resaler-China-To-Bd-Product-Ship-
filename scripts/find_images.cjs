const fs = require('fs');

const glob = (dir) => {
  let files = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const full = dir + '/' + f;
      if (fs.statSync(full).isDirectory()) files = files.concat(glob(full));
      else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.json')) files.push(full);
    });
  } catch {}
  return files;
};

const allFiles = glob('src').concat(glob('public'));
const urls = new Map();

allFiles.forEach(f => {
  if (f.includes('mohasagor_catalog.json')) return; // skip 16mb file
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/https:\/\/[^\s"'`]+/g) || [];
  matches.forEach(u => {
    if (u.includes('unsplash.com') || u.includes('cloudinary') || u.includes('supabase.co')) {
      const clean = u.split('?')[0];
      if (!urls.has(clean)) urls.set(clean, []);
      urls.get(clean).push(f);
    }
  });
});

console.log('Total unique URLs found:', urls.size);
for (const [u, files] of urls.entries()) {
  console.log(u, '=>', files.join(', '));
}
