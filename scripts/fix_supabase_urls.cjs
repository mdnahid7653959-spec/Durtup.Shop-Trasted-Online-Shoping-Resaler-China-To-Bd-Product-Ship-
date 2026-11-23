const fs = require('fs');

function fixSupabaseUrls(text) {
  return text.replace(/https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/(?:sign|public)\/product-images\/master\/([a-zA-Z0-9\-\_]+(?:\.webp|\.jpg|\.png|\.jpeg|\.gif)?)(?:\?[^\s\"\'\`]+)?/g, (match, filename) => {
    const fn = filename.endsWith('.webp') ? filename : filename + '.webp';
    return 'https://ecomsellerbd.com/uploads/product-images/master/' + fn;
  });
}

const files = [
  'src/utils/productImageHelper.ts',
  'public/visual_index.json',
  'public/visual_index.min.json',
  'public/mohasagor_catalog_slim.json'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const orig = fs.readFileSync(f, 'utf8');
    const updated = fixSupabaseUrls(orig);
    if (orig !== updated) {
      fs.writeFileSync(f, updated, 'utf8');
      console.log('Fixed supabase URLs in', f);
    } else {
      console.log('No supabase URLs in', f);
    }
  }
});
