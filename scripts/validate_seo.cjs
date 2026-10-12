const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
let errors = 0;
let passes = 0;

function report(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passes++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    errors++;
  }
}

console.log('\n========================================');
console.log('  DURTUP.SHOP ENTERPRISE SEO TEST SUITE ');
console.log('========================================\n');

// 1. Check index.html
console.log('1. Checking index.html Pre-rendered & Structured Data...');
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

report(indexHtml.includes('<title>Durtup.shop') && indexHtml.includes('পছন্দের পণ্য খুঁজে নিন Durtup.shop-এ'), 'Title tag and meta description contains brand and Bengali intent snippet');
report(indexHtml.includes('rel="canonical" href="https://durtup.shop"'), 'Canonical URL set to https://durtup.shop');
report(indexHtml.includes('"Organization"'), 'Organization JSON-LD schema is present');
report(indexHtml.includes('"Durtup Shop BD"'), 'Brand query variations (alternateName) included');
report(indexHtml.includes('"@type": "WebSite"'), 'WebSite schema with Sitelinks SearchBox is present');
report(indexHtml.includes('<noscript>'), 'Semantic noscript fallback content is present for non-JS/AI crawlers');
report(!indexHtml.toLowerCase().includes('megamart'), 'index.html is completely free of MegaMart references');

// 2. Check Sitemaps & robots.txt
console.log('\n2. Checking XML Sitemaps & robots.txt...');
const publicDir = path.join(ROOT_DIR, 'public');
const sitemapIndex = path.join(publicDir, 'sitemap.xml');
const sitemapPages = path.join(publicDir, 'sitemap-pages.xml');
const sitemapCategories = path.join(publicDir, 'sitemap-categories.xml');
const sitemapGuides = path.join(publicDir, 'sitemap-guides.xml');
const sitemapProducts = path.join(publicDir, 'sitemap-products.xml');
const robotsTxt = path.join(publicDir, 'robots.txt');

report(fs.existsSync(sitemapIndex), 'sitemap.xml exists in /public');
report(fs.existsSync(sitemapPages), 'sitemap-pages.xml exists in /public');
report(fs.existsSync(sitemapCategories), 'sitemap-categories.xml exists in /public');
report(fs.existsSync(sitemapGuides), 'sitemap-guides.xml exists in /public');
report(fs.existsSync(sitemapProducts), 'sitemap-products.xml exists in /public');

if (fs.existsSync(robotsTxt)) {
  const robotsContent = fs.readFileSync(robotsTxt, 'utf8');
  report(robotsContent.includes('Sitemap: https://durtup.shop/sitemap.xml'), 'robots.txt references sitemap index');
  report(robotsContent.includes('User-agent: GPTBot') || robotsContent.includes('User-agent: Google-Extended'), 'robots.txt explicitly welcomes AI & search engine crawlers');
  report(robotsContent.includes('Disallow: /admin'), 'robots.txt disallows admin paths');
  report(robotsContent.includes('Allow: /guides/'), 'robots.txt allows buying guides');
} else {
  report(false, 'robots.txt exists');
}

// 3. Check for leftover "MegaMart" template strings in user-facing source files
console.log('\n3. Scanning for legacy "MegaMart" leaks in user-facing code...');
const scanDirs = ['src/pages', 'src/components', 'src/hooks'];
let leakFound = false;

function scanDir(dir) {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) return;
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const f of files) {
    const res = path.join(fullPath, f.name);
    if (f.isDirectory()) {
      if (f.name !== 'admin' && f.name !== 'staff') {
        scanDir(path.join(dir, f.name));
      }
    } else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
      const content = fs.readFileSync(res, 'utf8');
      if (content.includes('megamart.com') || (content.includes('MegaMart') && !res.includes('megamart_admin_session'))) {
        console.error(`     Found legacy reference in: ${res}`);
        leakFound = true;
      }
    }
  }
}

for (const d of scanDirs) scanDir(d);
report(!leakFound, 'Zero legacy MegaMart references found across all user-facing pages and components');

// 4. Check SEO Head integration on key pages
console.log('\n4. Checking SEOHead component integration on core pages...');
const checkPages = [
  { file: 'src/pages/Index.tsx', label: 'Homepage (Index)' },
  { file: 'src/pages/ProductDetail.tsx', label: 'Product Details' },
  { file: 'src/pages/Categories.tsx', label: 'All Categories' },
  { file: 'src/pages/CategoryPage.tsx', label: 'Category Page' },
  { file: 'src/pages/Guides.tsx', label: 'Buying Guides Hub' },
  { file: 'src/pages/GuideDetail.tsx', label: 'Guide Detail' },
  { file: 'src/pages/Press.tsx', label: 'Press Center' },
  { file: 'src/pages/About.tsx', label: 'About Us' },
  { file: 'src/pages/Seller.tsx', label: 'Seller Hub' },
  { file: 'src/pages/Shipping.tsx', label: 'Shipping Policy' },
  { file: 'src/pages/Returns.tsx', label: 'Returns & Refunds' },
  { file: 'src/pages/Contact.tsx', label: 'Contact Us' },
  { file: 'src/pages/HelpCenter.tsx', label: 'Help Center' },
  { file: 'src/pages/Privacy.tsx', label: 'Privacy Policy' },
  { file: 'src/pages/Terms.tsx', label: 'Terms of Service' },
  { file: 'src/pages/TrackOrder.tsx', label: 'Track Order' },
];

for (const item of checkPages) {
  const p = path.join(ROOT_DIR, item.file);
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    report(code.includes('SEOHead') || code.includes('<SEOHead'), `${item.label} includes SEOHead`);
  } else {
    report(false, `${item.label} file exists at ${item.file}`);
  }
}

// 5. Check noindex on private / non-canonical pages
console.log('\n5. Checking noindex protection on private routes...');
const noindexPages = [
  { file: 'src/pages/Cart.tsx', label: 'Cart' },
  { file: 'src/pages/Checkout.tsx', label: 'Checkout' },
  { file: 'src/pages/Search.tsx', label: 'Search' },
  { file: 'src/pages/NotFound.tsx', label: 'NotFound (404)' },
  { file: 'src/pages/Login.tsx', label: 'Login' },
  { file: 'src/pages/Register.tsx', label: 'Register' },
  { file: 'src/pages/ForgotPassword.tsx', label: 'ForgotPassword' },
  { file: 'src/pages/ResetPassword.tsx', label: 'ResetPassword' },
];

for (const item of noindexPages) {
  const p = path.join(ROOT_DIR, item.file);
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    report(code.includes('noindex={true}'), `${item.label} protected with noindex={true}`);
  } else {
    report(false, `${item.label} file exists`);
  }
}

// 6. Check SEO Utilities & Canonical Engine
console.log('\n6. Checking SEO Helper & Canonical Engine...');
const seoHelperPath = path.join(ROOT_DIR, 'src', 'utils', 'seoHelper.ts');
if (fs.existsSync(seoHelperPath)) {
  const seoHelperCode = fs.readFileSync(seoHelperPath, 'utf8');
  report(seoHelperCode.includes('normalizeCanonicalUrl'), 'normalizeCanonicalUrl function implemented');
  report(seoHelperCode.includes('buildArticleJsonLd'), 'buildArticleJsonLd Schema.org implementation present');
  report(seoHelperCode.includes('buildBreadcrumbJsonLd'), 'buildBreadcrumbJsonLd Schema.org implementation present');
  report(seoHelperCode.includes('Price in Bangladesh | Durtup.shop'), 'Product Title pattern conforms to Bangladesh search intent standard');
} else {
  report(false, 'src/utils/seoHelper.ts exists');
}

console.log('\n----------------------------------------');
console.log(`Results: ${passes} Passed, ${errors} Failed`);
console.log('----------------------------------------\n');

if (errors > 0) {
  console.error(`🚨 SEO Verification Failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('🎉 ALL TECHNICAL SEO & ENTITY VERIFICATIONS PASSED PERFECTLY!\n');
  process.exit(0);
}
