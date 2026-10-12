const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://durtup.shop';
const SITE_NAME = 'Durtup.shop';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\\x[0-9A-Fa-f]{2}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  try {
    const rootDir = path.join(__dirname, '..');
    const distDir = path.join(rootDir, 'dist');
    const templatePath = path.join(distDir, 'index.html');

    if (!fs.existsSync(templatePath)) {
      console.warn('⚠️ dist/index.html not found, skipping pre-rendering.');
      return;
    }

    const baseHtml = fs.readFileSync(templatePath, 'utf8');

  // Load catalogs
  const mohasagorPath = path.join(rootDir, 'public', 'mohasagor_catalog.json');
  const ecomsellerPath = path.join(rootDir, 'public', 'ecomseller_catalog.json');

  let allProducts = [];
  if (fs.existsSync(mohasagorPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(mohasagorPath, 'utf8'));
      if (Array.isArray(data)) allProducts.push(...data);
    } catch (e) {
      console.warn('Could not read mohasagor catalog:', e.message);
    }
  }

  if (fs.existsSync(ecomsellerPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(ecomsellerPath, 'utf8'));
      if (Array.isArray(data)) allProducts.push(...data);
    } catch (e) {
      console.warn('Could not read ecomseller catalog:', e.message);
    }
  }

  console.log(`Starting SSG Pre-rendering for ${allProducts.length} catalog items...`);

  const seenSlugs = new Set();
  let generatedCount = 0;

  for (const p of allProducts) {
    if (!p) continue;
    let rawSlug = (p.slug || p.id || '').toString().trim();
    if (!rawSlug) continue;

    // Normalize slug to match client routing
    const slug = rawSlug.toLowerCase().replace(/[^\w\u0980-\u09FF-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const name = cleanText(p.name || p.title || 'Product');
    const price = Number(p.discount_price || p.price || 0);
    const regularPrice = Number(p.regular_price || p.originalPrice || 0);
    const inStock = (p.stock_quantity ?? p.stock ?? 1) > 0;
    const image = p.image || p.image_url || (p.images && p.images[0]) || `${BASE_URL}/icon-512.png`;
    const canonicalUrl = `${BASE_URL}/product/${slug}`;
    const rawDesc = cleanText(p.short_description || p.description || p.details || name);
    const snippet = rawDesc.length > 15 ? rawDesc.slice(0, 110) + '... ' : '';
    const metaDescription = `Buy ${name} online at ৳${price.toLocaleString('en-BD')} in Bangladesh. ${snippet}100% Cash on Delivery & fast delivery at ${SITE_NAME}.`;
    const title = `${name} Price in Bangladesh | ${SITE_NAME}`;
    const categoryName = p.category || p.category_name || 'Electronics & Gadgets';
    const categorySlug = (p.category_slug || (typeof p.category === 'string' ? p.category.toLowerCase().replace(/\s+/g, '-') : 'products')).replace(/[^\w-]/g, '');

    // Schema.org Product
    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": name,
      "image": [image],
      "description": metaDescription,
      "sku": String(p.sku || p.id || `DURTUP-${slug}`),
      "mpn": String(p.id || p.sku || slug),
      "brand": {
        "@type": "Brand",
        "name": p.brand || p.brand_name || "Durtup"
      },
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": "BDT",
        "price": price.toString(),
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": SITE_NAME,
          "url": BASE_URL
        },
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "BD",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 7,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": p.free_shipping || p.freeShipping ? "0" : "60",
            "currency": "BDT"
          },
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "businessDays": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "d"
            }
          }
        }
      }
    };

    // Breadcrumbs Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": categoryName, "item": `${BASE_URL}/category/${categorySlug}` },
        { "@type": "ListItem", "position": 3, "name": name, "item": canonicalUrl }
      ]
    };

    // Semantic visible pre-render markup inside #root
    const crawlableMarkup = `
    <main class="product-seo-prerender" style="font-family:Inter,system-ui,sans-serif;max-width:1200px;margin:0 auto;padding:16px;">
      <nav aria-label="Breadcrumb" style="font-size:13px;margin-bottom:12px;color:#64748b;">
        <a href="/" style="color:#64748b;text-decoration:none;">Home</a> &gt; 
        <a href="/category/${categorySlug}" style="color:#64748b;text-decoration:none;">${escapeXml(categoryName)}</a> &gt; 
        <span style="color:#0f172a;font-weight:600;">${escapeXml(name)}</span>
      </nav>
      <article style="display:flex;flex-wrap:wrap;gap:24px;">
        <div style="flex:1;min-width:280px;max-width:540px;">
          <img src="${escapeXml(image)}" alt="${escapeXml(name)}" width="540" height="540" style="width:100%;height:auto;aspect-ratio:1/1;object-fit:contain;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;" loading="eager" />
        </div>
        <div style="flex:1;min-width:300px;">
          <h1 style="font-size:22px;line-height:1.3;font-weight:800;color:#0f172a;margin-top:0;">${escapeXml(name)}</h1>
          <div style="font-size:26px;font-weight:800;color:#ea580c;margin:12px 0;">
            ৳${price.toLocaleString('en-BD')}
            ${regularPrice > price ? `<del style="font-size:16px;color:#94a3b8;margin-left:8px;font-weight:normal;">৳${regularPrice.toLocaleString('en-BD')}</del>` : ''}
          </div>
          <p style="font-size:14px;color:${inStock ? '#16a34a' : '#dc2626'};font-weight:600;">
            Status: ${inStock ? 'In Stock (স্টকে আছে)' : 'Out of Stock'}
          </p>
          <div style="font-size:14px;line-height:1.6;color:#334155;margin:16px 0;background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;">
            <h2 style="font-size:15px;font-weight:700;margin-top:0;">Product Details &amp; Specifications:</h2>
            <p>${escapeXml(rawDesc)}</p>
          </div>
          <div style="font-size:13px;line-height:1.5;color:#475569;border-top:1px solid #e2e8f0;padding-top:12px;">
            <p><strong>Payment:</strong> 100% Cash on Delivery across Bangladesh (ক্যাশ অন ডেলিভারি)</p>
            <p><strong>Delivery:</strong> 24-48 hours within Dhaka, 2-3 days nationwide</p>
            <p><strong>Return:</strong> 7 days easy return &amp; replacement guarantee</p>
          </div>
        </div>
      </article>
    </main>`;

    // Replace <title>, <meta description>, canonical, OpenGraph, Schema in HTML template
    let productHtml = baseHtml;

    // Replace title
    productHtml = productHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeXml(title)}</title>`);

    // Replace description
    productHtml = productHtml.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeXml(metaDescription)}" />`
    );

    // Replace or set canonical link
    productHtml = productHtml.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeXml(canonicalUrl)}" />`
    );

    // Replace OpenGraph
    productHtml = productHtml.replace(
      /<meta\s+property=["']og:title["'][^>]*>/i,
      `<meta property="og:title" content="${escapeXml(title)}" />`
    );
    productHtml = productHtml.replace(
      /<meta\s+property=["']og:description["'][^>]*>/i,
      `<meta property="og:description" content="${escapeXml(metaDescription)}" />`
    );
    productHtml = productHtml.replace(
      /<meta\s+property=["']og:image["'][^>]*>/i,
      `<meta property="og:image" content="${escapeXml(image)}" />`
    );
    productHtml = productHtml.replace(
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${escapeXml(canonicalUrl)}" />`
    );

    // Injected Schema.org block before </head>
    const schemaBlock = `
    <!-- Pre-rendered Schema.org Product & Breadcrumb JSON-LD -->
    <script type="application/ld+json" data-prerender-seo="true">
    ${JSON.stringify(productSchema)}
    </script>
    <script type="application/ld+json" data-prerender-seo="true">
    ${JSON.stringify(breadcrumbSchema)}
    </script>
    </head>`;

    productHtml = productHtml.replace(/<\/head>/i, schemaBlock);

    // Injected crawlable visible markup into #root
    productHtml = productHtml.replace(
      /<div\s+id=["']root["']>[\s\S]*?<\/div>/i,
      `<div id="root">${crawlableMarkup}</div>`
    );

    // Save to dist/product/{slug}/index.html
    const targetDir = path.join(distDir, 'product', slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, 'index.html'), productHtml, 'utf8');

    generatedCount++;
  }

  console.log(`✅ Pre-rendered ${generatedCount} static crawlable product HTML pages in dist/product/`);

  // Pre-render core categories
  const CATEGORIES = [
    { slug: 'gadgets-electronics', name: 'Gadgets & Electronics' },
    { slug: 'mobile-accessories', name: 'Mobile Accessories' },
    { slug: 'smart-watch', name: 'Smart Watches' },
    { slug: 'earbuds-headphones', name: 'Earbuds & Headphones' },
    { slug: 'mens-fashion', name: "Men's Fashion" },
    { slug: 'womens-fashion', name: "Women's Fashion" },
    { slug: 'home-lifestyle', name: 'Home & Lifestyle' },
    { slug: 'kitchen-gadgets', name: 'Kitchen Gadgets' },
    { slug: 'kids-zone', name: 'Kids Zone' },
  ];

  for (const cat of CATEGORIES) {
    const catCanonical = `${BASE_URL}/category/${cat.slug}`;
    const catTitle = `${cat.name} Price in Bangladesh | ${SITE_NAME}`;
    const catDesc = `Explore genuine ${cat.name} at best prices in Bangladesh at ${SITE_NAME}. 100% Cash on Delivery and fast nationwide home delivery.`;

    let catHtml = baseHtml;
    catHtml = catHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeXml(catTitle)}</title>`);
    catHtml = catHtml.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeXml(catDesc)}" />`);
    catHtml = catHtml.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeXml(catCanonical)}" />`);
    catHtml = catHtml.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeXml(catTitle)}" />`);
    catHtml = catHtml.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeXml(catDesc)}" />`);
    catHtml = catHtml.replace(/<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${escapeXml(catCanonical)}" />`);

    const catDir = path.join(distDir, 'category', cat.slug);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
    fs.writeFileSync(path.join(catDir, 'index.html'), catHtml, 'utf8');
  }

  console.log(`✅ Pre-rendered ${CATEGORIES.length} static crawlable category HTML pages in dist/category/`);
  } catch (err) {
    console.warn('⚠️ Warning during SSG pre-rendering (non-fatal):', err.message);
  }
}

main();
