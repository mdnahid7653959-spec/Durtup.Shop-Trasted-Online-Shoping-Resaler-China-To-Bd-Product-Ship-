const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/mohasagor_raw_all.json'), 'utf8'));

function resolveUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  return trimmed.startsWith('/') ? 'https://mohasagor.com.bd' + trimmed : 'https://mohasagor.com.bd/' + trimmed;
}

function extractImage(p) {
  if (p.thumbnail_img && typeof p.thumbnail_img === 'string') return resolveUrl(p.thumbnail_img);
  if (p.image && typeof p.image === 'string') return resolveUrl(p.image);
  if (Array.isArray(p.product_images) && p.product_images.length > 0) {
    const first = p.product_images[0];
    const u = typeof first === 'string' ? first : (first?.product_image || first?.image || first?.url);
    if (u) return resolveUrl(u);
  }
  return '';
}

function extractAllImages(p, primary) {
  const list = [];
  if (primary) list.push(primary);
  if (Array.isArray(p.product_images)) {
    for (const img of p.product_images) {
      const u = typeof img === 'string' ? resolveUrl(img) : resolveUrl(img?.product_image || img?.image || img?.url);
      if (u && !list.includes(u)) list.push(u);
    }
  }
  return list.length > 0 ? list : (primary ? [primary] : []);
}

function extractVariants(p) {
  if (!p) return [];
  if (Array.isArray(p.product_variants) && p.product_variants.length > 0) {
    return p.product_variants.map((v, i) => ({
      id: String(v.id || `v-${i}`),
      attribute: v.attribute || v.attribute_name || v.type || "Option",
      variant: v.variant || v.variant_name || v.value || v.name || "",
      price: Number(v.price) || 0,
      stock: Number(v.stock ?? v.stock_quantity ?? 50)
    }));
  }
  return [];
}

const fullCatalog = [];
const slimCatalog = [];

raw.forEach((p, idx) => {
  const primaryImg = extractImage(p);
  const images = extractAllImages(p, primaryImg);
  const variants = extractVariants(p);

  const price = parseFloat(p.price) || parseFloat(p.sale_price) || 0;
  const regularPrice = parseFloat(p.regular_price) || Math.round(price * 1.35) || price;
  const originalPrice = regularPrice > price ? regularPrice : undefined;

  const numId = Number(p.id) || idx + 1;
  const rating = 4.8;
  const reviews = 15 + (numId % 25);
  const sold = 45 + (numId % 120);
  const stock = parseInt(p.stock) || parseInt(p.stock_quantity) || 50;

  const item = {
    id: String(p.id || numId),
    name: p.name || "Product",
    slug: p.slug || `product-${p.id}`,
    product_code: p.product_code ? String(p.product_code) : `P-${numId}`,
    sku: p.product_code ? String(p.product_code) : `P-${numId}`,
    category: p.category || "General",
    image: primaryImg,
    images: images,
    product_images: images.map((u, i) => ({ id: `img-${i}`, image_url: u, is_primary: i === 0, sort_order: i })),
    price: price,
    originalPrice: originalPrice,
    regular_price: regularPrice,
    discount_price: originalPrice ? price : null,
    rating: rating,
    reviews: reviews,
    sold: sold,
    stock: stock,
    stock_quantity: stock,
    stock_status: p.stock_status || "available",
    freeShipping: true,
    isNew: idx < 50,
    isBestSeller: idx % 5 === 0,
    product_variants: variants,
    variants: variants,
    details: p.details || p.description || "",
    description: p.details || p.description || ""
  };

  fullCatalog.push(item);

  // Slim catalog: clean and fast, with ALL images and FULL details for instant 0ms accurate details load
  slimCatalog.push({
    id: item.id,
    name: item.name,
    slug: item.slug,
    product_code: item.product_code,
    category: item.category,
    image: item.image,
    images: item.images,
    product_images: item.product_images,
    price: item.price,
    originalPrice: item.originalPrice,
    regular_price: item.regular_price,
    rating: item.rating,
    reviews: item.reviews,
    sold: item.sold,
    stock: item.stock,
    product_variants: item.product_variants,
    details: item.details || item.description || "",
    description: item.details || item.description || ""
  });
});

console.log('Writing catalogs...');
fs.writeFileSync(path.join(__dirname, '../public/mohasagor_catalog.json'), JSON.stringify(fullCatalog));
fs.writeFileSync(path.join(__dirname, '../public/mohasagor_catalog_slim.json'), JSON.stringify(slimCatalog));

const fullStat = fs.statSync(path.join(__dirname, '../public/mohasagor_catalog.json'));
const slimStat = fs.statSync(path.join(__dirname, '../public/mohasagor_catalog_slim.json'));

console.log(`Full catalog size: ${(fullStat.size / (1024 * 1024)).toFixed(2)} MB (${fullCatalog.length} items)`);
console.log(`Slim catalog size: ${(slimStat.size / (1024 * 1024)).toFixed(2)} MB (${slimCatalog.length} items)`);
