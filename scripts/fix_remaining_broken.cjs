const fs = require('fs');

const FIXES = {
  '1036': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=600&fit=crop',
  '7553': 'https://ecomsellerbd.com/uploads/product-images/master/03e4c2c0-f1b8-4b73-b898-00052116e016.webp',
  '8227': 'https://ecomsellerbd.com/uploads/product-images/master/9ee3d720-1058-4339-a311-3bc39d62bae9.webp',
  '8272': 'https://ecomsellerbd.com/uploads/product-images/master/03e4c2c0-f1b8-4b73-b898-00052116e016.webp',
  '8789': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
  '9428': 'https://ecomsellerbd.com/uploads/product-images/master/03e4c2c0-f1b8-4b73-b898-00052116e016.webp'
};

['public/visual_index.json', 'public/visual_index.min.json', 'public/mohasagor_catalog_slim.json'].forEach(f => {
  if (fs.existsSync(f)) {
    const list = JSON.parse(fs.readFileSync(f, 'utf8'));
    list.forEach(p => {
      const fix = FIXES[String(p.id)];
      if (fix) {
        p.image = fix;
        if (p.images) p.images = [fix];
        if (p.product_images) p.product_images = [{ id: 'img-0', image_url: fix, is_primary: true, sort_order: 0 }];
      }
    });
    fs.writeFileSync(f, JSON.stringify(list, null, f.includes('.min.') ? undefined : 2), 'utf8');
    console.log('Fixed final broken products in', f);
  }
});
