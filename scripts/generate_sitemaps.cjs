const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://durtup.shop';
const TODAY = new Date().toISOString().split('T')[0];

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildUrlSetXml(urls) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
  for (const item of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${item.url}</loc>\n`;
    xml += `    <lastmod>${item.lastmod || TODAY}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq || 'daily'}</changefreq>\n`;
    xml += `    <priority>${item.priority || '0.8'}</priority>\n`;
    if (item.image) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(item.image)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(item.imageTitle || 'Durtup.shop Product')}</image:title>\n`;
      xml += `      <image:caption>${escapeXml(item.imageCaption || 'Buy Online in Bangladesh with 100% Cash on Delivery at Durtup.shop')}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// 1. Core Public Pages
const CORE_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/products', priority: '0.9', changefreq: 'daily' },
  { url: '/categories', priority: '0.9', changefreq: 'daily' },
  { url: '/flash-sale', priority: '0.9', changefreq: 'daily' },
  { url: '/new-arrivals', priority: '0.9', changefreq: 'daily' },
  { url: '/free-shipping', priority: '0.9', changefreq: 'daily' },
  { url: '/guides', priority: '0.9', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/help', priority: '0.7', changefreq: 'monthly' },
  { url: '/shipping', priority: '0.8', changefreq: 'monthly' },
  { url: '/returns', priority: '0.8', changefreq: 'monthly' },
  { url: '/track', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/seller', priority: '0.7', changefreq: 'monthly' },
  { url: '/affiliate', priority: '0.7', changefreq: 'monthly' },
  { url: '/press', priority: '0.6', changefreq: 'monthly' },
  { url: '/careers', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { url: '/terms', priority: '0.5', changefreq: 'yearly' },
  { url: '/cookies', priority: '0.5', changefreq: 'yearly' },
  { url: '/ip', priority: '0.5', changefreq: 'yearly' },
];

// 2. Category & Subcategory Pages
const CATEGORY_SLUGS = [
  'gadgets-electronics',
  'mobile-accessories',
  'watch',
  'smart-watch',
  'earbuds-headphones',
  'audio-speakers',
  'shaver-trimmer',
  'fan-coolers',
  'computer-gaming',
  'content-tools-camera',
  'smart-gadgets',
  'mens-fashion',
  'panjabi-pajama',
  'tshirt-polo',
  'trouser-joggers',
  'undergarments-socks',
  'wallet-belt',
  'womens-fashion',
  'saree',
  'three-piece',
  'kurti-tops',
  'abaya-borka-hijab',
  'bra-panty-lingerie',
  'bags-purse',
  'home-lifestyle',
  'kitchen-gadgets',
  'home-decor',
  'lights-lamp',
  'cleaning-storage',
  'kids-zone',
  'baby-clothing',
  'educational-toys',
  'baby-care',
  'winter',
  'foods',
  'customize-gift',
  'offer',
  'others'
];

function getCategoryUrls() {
  return CATEGORY_SLUGS.map(slug => ({
    url: `/category/${slug}`,
    priority: '0.8',
    changefreq: 'daily'
  }));
}

// 3. Buying Guides & Content Pages
const BUYING_GUIDE_SLUGS = [
  'smart-watch-buying-guide-bangladesh',
  'tws-wireless-earbuds-buying-guide-bangladesh',
  'fast-charger-power-bank-guide-bangladesh',
  'mobile-accessories-buying-guide-bangladesh',
  'safe-online-shopping-cash-on-delivery-bangladesh'
];

function getGuideUrls() {
  return BUYING_GUIDE_SLUGS.map(slug => ({
    url: `/guides/${slug}`,
    priority: '0.8',
    changefreq: 'weekly'
  }));
}

// 4. Dynamic Product Detail Pages (Aggregated across all supplier catalogs)
function getProductUrls() {
  const publicDir = path.join(__dirname, '..', 'public');
  const mohasagorPath = path.join(publicDir, 'mohasagor_catalog.json');
  const ecomsellerPath = path.join(publicDir, 'ecomseller_catalog.json');
  
  let allProducts = [];

  if (fs.existsSync(mohasagorPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(mohasagorPath, 'utf8'));
      if (Array.isArray(data)) allProducts.push(...data);
    } catch (e) {
      console.error('Error reading mohasagor catalog:', e.message);
    }
  }

  if (fs.existsSync(ecomsellerPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(ecomsellerPath, 'utf8'));
      if (Array.isArray(data)) allProducts.push(...data);
    } catch (e) {
      console.error('Error reading ecomseller catalog:', e.message);
    }
  }

  const urls = [];
  const seen = new Set();

  for (const p of allProducts) {
    if (!p) continue;
    let rawSlug = (p.slug || p.id || '').toString().trim();
    if (!rawSlug) continue;

    // Clean slug for URL safety
    rawSlug = rawSlug.toLowerCase().replace(/[^\w\u0980-\u09FF-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!rawSlug || seen.has(rawSlug)) continue;
    seen.add(rawSlug);

    const name = p.name || p.title || 'Product in Bangladesh';
    const image = p.image || p.image_url || (p.images && p.images[0]) || '';

    urls.push({
      url: `/product/${rawSlug}`,
      priority: '0.8',
      changefreq: 'daily',
      image: image,
      imageTitle: `${name} Price in Bangladesh | Durtup.shop`,
      imageCaption: `Buy ${name} at best price in Bangladesh with Cash on Delivery at Durtup.shop`,
    });
  }

  return urls;
}

function generateMasterIndex(sitemaps) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const file of sitemaps) {
    xml += `  <sitemap>\n    <loc>${BASE_URL}/${file}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>\n`;
  }
  xml += `</sitemapindex>`;
  return xml;
}

function main() {
  try {
    const publicDir = path.join(__dirname, '..', 'public');
    const distDir = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    console.log('Generating Production Dynamic XML Sitemaps for Durtup.shop...');

    const pageUrls = CORE_PAGES;
    const categoryUrls = getCategoryUrls();
    const guideUrls = getGuideUrls();
    const productUrls = getProductUrls();

    console.log(`Found ${pageUrls.length} pages, ${categoryUrls.length} categories, ${guideUrls.length} guides, and ${productUrls.length} products.`);

    const sitemapsData = [
      { file: 'sitemap-pages.xml', content: buildUrlSetXml(pageUrls) },
      { file: 'sitemap-categories.xml', content: buildUrlSetXml(categoryUrls) },
      { file: 'sitemap-guides.xml', content: buildUrlSetXml(guideUrls) },
      { file: 'sitemap-products.xml', content: buildUrlSetXml(productUrls) },
    ];

    // Write sub-sitemaps
    for (const item of sitemapsData) {
      fs.writeFileSync(path.join(publicDir, item.file), item.content, 'utf8');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, item.file), item.content, 'utf8');
      }
    }

    // Master Sitemap Index
    const activeSitemaps = [
      'sitemap-pages.xml',
      'sitemap-categories.xml',
      'sitemap-guides.xml',
      'sitemap-products.xml',
    ];

    const masterIndexContent = generateMasterIndex(activeSitemaps);
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), masterIndexContent, 'utf8');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), masterIndexContent, 'utf8');
    }

    console.log('✅ Master Sitemap Index (sitemap.xml) and all clean sub-sitemaps generated successfully!');
  } catch (err) {
    console.warn('⚠️ Warning during sitemap generation (non-fatal):', err.message);
  }
}

main();
