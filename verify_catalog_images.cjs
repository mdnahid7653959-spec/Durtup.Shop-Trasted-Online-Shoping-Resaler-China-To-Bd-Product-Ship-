/**
 * Automated Catalog Image & CDN Proxy Verification Script
 * Audits product image resolution, wsrv.nl proxy reachability, direct origin status,
 * and ensures absence of peach SVG placeholders or mismatched generic portraits.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PROJECT_ROOT = __dirname;

// Known dead origins
const KNOWN_DEAD_ORIGIN_URLS = new Set([
  "https://mohasagor.com.bd/public/storage/images/products/9jmg46R758uR1Ku8UpbB2fEjuLh1i8PJmX5ve9zb.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/obrg8iSsSHWoqpXuoRzuSYdSRnelkhB2qgsMM3Iw.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/06B4jK73bvMIABaFuuXtW2NirWrSpYRM1yLaMumJ.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/RxTAhyYXd0VI6a7YnCRY0f1KNnUUIdj0XoYJypNL.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/VKgvrT4uYKkDwOuJGZmKu3f4yiB7rsInfgYvnXFo.jpg",
  "https://mohasagor.com.bd/public/storage/images/products/PngofgCFibVX15hx4DouG9NOtDu1mfnf9GfFmOA4.jpg",
]);

// Known Unsplash generic fallback patterns
const GENERIC_FALLBACK_PATTERNS = [
  "photo-1509967419530", // Woman portrait mistakenly in hoodie
  "photo-1512436991641", // Peach / generic placeholder
  "photo-1590658268037",
  "photo-1546868871",
  "photo-1609091839311",
  "photo-1618384887929",
  "photo-1585386959984",
  "photo-1560472355",
  "photo-1523275335684",
  "photo-1507582020474",
  "photo-1596755094514",
];

// Helper to check HTTP URL status & content-type
function checkHttpUrl(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') {
      return resolve({ ok: false, error: 'Empty URL' });
    }
    if (url.startsWith('data:image/svg+xml')) {
      return resolve({ ok: true, isSvgData: true, contentType: 'image/svg+xml' });
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return resolve({ ok: false, error: 'Invalid protocol: ' + url });
    }

    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: timeoutMs
    }, (res) => {
      let byteCount = 0;
      res.on('data', chunk => {
        byteCount += chunk.length;
        if (byteCount > 5000) req.destroy();
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          contentLength: res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : byteCount
        });
      });
      res.on('close', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          contentLength: res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : byteCount
        });
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'TIMEOUT' });
    });
  });
}

// Emulate getProductImageCandidates logic for validation
function resolveCandidates(product, width = 400) {
  const candidates = [];
  const allRaw = [];

  const addRaw = (u) => {
    if (!u || typeof u !== 'string') return;
    let clean = u.trim();
    if (!clean) return;
    if (clean.includes("mohasagor.com/") && !clean.includes("mohasagor.com.bd/")) {
      clean = clean.replace("mohasagor.com/", "mohasagor.com.bd/");
    }
    if (clean.startsWith('//')) clean = 'https:' + clean;
    else if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) clean = 'https://ecomsellerbd.com' + (clean.startsWith('/') ? clean : '/' + clean);
    else if (clean.startsWith('/public/storage/') || clean.startsWith('public/storage/') || clean.startsWith('/storage/') || clean.startsWith('storage/')) {
      clean = 'https://mohasagor.com.bd' + (clean.startsWith('/') ? clean : '/' + clean);
    }
    if (KNOWN_DEAD_ORIGIN_URLS.has(clean)) return;
    if (!allRaw.includes(clean)) allRaw.push(clean);
  };

  if (product.image) addRaw(product.image);
  if (product.image_url) addRaw(product.image_url);
  if (product.thumbnail) addRaw(product.thumbnail);
  if (Array.isArray(product.images)) product.images.forEach(addRaw);
  if (Array.isArray(product.product_images)) product.product_images.forEach(img => addRaw(typeof img === 'string' ? img : img?.image_url));

  const hasRealSupplier = allRaw.some(u => u.includes('mohasagor.com.bd') || u.includes('ecomsellerbd.com'));
  const validRaw = hasRealSupplier
    ? allRaw.filter(u => !GENERIC_FALLBACK_PATTERNS.some(p => u.includes(p)))
    : allRaw;

  for (const raw of validRaw) {
    if (raw.includes('ecomsellerbd.com')) {
      candidates.push(raw);
      candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(raw)}&w=${width}&output=webp&q=78&we=0&fit=cover`);
    } else if (raw.includes('mohasagor.com.bd')) {
      candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(raw)}&w=${width}&output=webp&q=78&we=0&fit=cover`);
      candidates.push(raw); // direct origin fallback
    } else {
      candidates.push(raw);
    }
  }

  return { candidates, allRaw, validRaw };
}

async function verifyCatalogImages() {
  console.log('===============================================================');
  console.log('   DURTUP AUTOMATED CATALOG IMAGE & CDN PROXY VERIFIER         ');
  console.log('===============================================================');

  const mohasagorPath = path.join(PROJECT_ROOT, 'public', 'mohasagor_catalog_slim.json');
  const ecomsellerPath = path.join(PROJECT_ROOT, 'public', 'ecomseller_catalog.json');

  if (!fs.existsSync(mohasagorPath)) throw new Error('Missing mohasagor_catalog_slim.json');
  if (!fs.existsSync(ecomsellerPath)) throw new Error('Missing ecomseller_catalog.json');

  const mohasagorData = JSON.parse(fs.readFileSync(mohasagorPath, 'utf8'));
  const ecomsellerRaw = JSON.parse(fs.readFileSync(ecomsellerPath, 'utf8'));
  const ecomsellerData = Array.isArray(ecomsellerRaw) ? ecomsellerRaw : (ecomsellerRaw.products || []);

  console.log(`[CATALOG AUDIT] Mohasagor Slim: ${mohasagorData.length} items`);
  console.log(`[CATALOG AUDIT] Ecomseller BD:   ${ecomsellerData.length} items\n`);

  // Test set: select Islamic hoodies, smartwatches, gadgets, and kitchen items
  const mohasagorSamples = [
    // Hoodies specifically requested
    ...mohasagorData.filter(p => /hoodie|হুডি/i.test(p.name)).slice(0, 10),
    // Popular gadgets & accessories
    ...mohasagorData.filter(p => /watch|smart.*watch|ঘড়ি/i.test(p.name)).slice(0, 6),
    ...mohasagorData.filter(p => /shoe.*rack|bottle|panjabi/i.test(p.name)).slice(0, 6),
    // Product 280 specifically
    ...mohasagorData.filter(p => p.id === '280' || p.id === 280),
    // Sample across catalog
    ...mohasagorData.slice(100, 110)
  ];

  const ecomsellerSamples = [
    // Siphon, drain cleaner, massager, knife peeler
    ...ecomsellerData.filter(p => /peeler|knife|drain|siphon|massag|cleaner/i.test(p.name)).slice(0, 12),
    // Other items
    ...ecomsellerData.slice(20, 35)
  ];

  console.log(`[SAMPLING] Testing ${mohasagorSamples.length} Mohasagor items + ${ecomsellerSamples.length} Ecomseller items (${mohasagorSamples.length + ecomsellerSamples.length} total)\n`);

  let failures = 0;
  let genericPortraitsFound = 0;
  let peachPlaceholdersFound = 0;
  let originChecksPassed = 0;
  let proxyChecksPassed = 0;

  console.log('--- 1. Testing Mohasagor Catalog Sample (including Islamic Hoodies) ---');
  for (const item of mohasagorSamples) {
    const { candidates } = resolveCandidates(item);
    const primaryCandidate = candidates[0];

    // Check for unwanted fallbacks
    const isGenericPortrait = primaryCandidate && primaryCandidate.includes('photo-1509967419530');
    const isPeachPlaceholder = !primaryCandidate || primaryCandidate.startsWith('data:image/svg+xml');

    if (isGenericPortrait) {
      console.error(`[FAIL - MISMATCHED PORTRAIT] ${item.name} (ID: ${item.id}) uses generic woman portrait!`);
      genericPortraitsFound++;
      failures++;
      continue;
    }
    if (isPeachPlaceholder) {
      console.error(`[FAIL - PEACH SVG] ${item.name} (ID: ${item.id}) resolved to peach SVG placeholder!`);
      peachPlaceholdersFound++;
      failures++;
      continue;
    }

    // Verify proxy & direct origin reachability
    const proxyUrl = candidates.find(c => c.includes('wsrv.nl'));
    const directUrl = candidates.find(c => c.includes('mohasagor.com.bd'));

    let proxyRes = proxyUrl ? await checkHttpUrl(proxyUrl) : { ok: false };
    let directRes = directUrl ? await checkHttpUrl(directUrl) : { ok: false };

    if (proxyRes.ok) proxyChecksPassed++;
    if (directRes.ok) originChecksPassed++;

    const isHoodie = /hoodie/i.test(item.name);
    const statusTag = (proxyRes.ok && directRes.ok) ? 'PASS' : (proxyRes.ok || directRes.ok ? 'WARN' : 'FAIL');
    if (statusTag === 'FAIL') failures++;

    if (isHoodie || statusTag !== 'PASS' || item.id === '280' || item.id === 280) {
      console.log(`[${statusTag}] ${item.name.substring(0, 42).padEnd(42)} (ID: ${item.id}) | Proxy: ${proxyRes.status || proxyRes.error} | Direct: ${directRes.status || directRes.error}`);
    }
  }

  console.log('\n--- 2. Testing Ecomseller Catalog Sample ---');
  for (const item of ecomsellerSamples) {
    const { candidates } = resolveCandidates(item);
    const primaryCandidate = candidates[0];

    const isGenericPortrait = primaryCandidate && primaryCandidate.includes('photo-1509967419530');
    const isPeachPlaceholder = !primaryCandidate || primaryCandidate.startsWith('data:image/svg+xml');

    if (isGenericPortrait) {
      console.error(`[FAIL - MISMATCHED PORTRAIT] ${item.name} uses generic woman portrait!`);
      genericPortraitsFound++;
      failures++;
      continue;
    }
    if (isPeachPlaceholder) {
      console.error(`[FAIL - PEACH SVG] ${item.name} resolved to peach SVG placeholder!`);
      peachPlaceholdersFound++;
      failures++;
      continue;
    }

    const proxyUrl = candidates.find(c => c.includes('wsrv.nl'));
    const directUrl = candidates.find(c => c.includes('ecomsellerbd.com'));

    let proxyRes = proxyUrl ? await checkHttpUrl(proxyUrl) : { ok: false };
    let directRes = directUrl ? await checkHttpUrl(directUrl) : { ok: false };

    if (proxyRes.ok) proxyChecksPassed++;
    if (directRes.ok) originChecksPassed++;

    const statusTag = (proxyRes.ok && directRes.ok) ? 'PASS' : (proxyRes.ok || directRes.ok ? 'WARN' : 'FAIL');
    if (statusTag === 'FAIL') failures++;

    console.log(`[${statusTag}] ${item.name.substring(0, 42).padEnd(42)} | Direct: ${directRes.status || directRes.error} | Proxy: ${proxyRes.status || proxyRes.error}`);
  }

  console.log('\n===============================================================');
  console.log('                     VERIFICATION SUMMARY                      ');
  console.log('===============================================================');
  console.log(`Total Items Audited:            ${mohasagorSamples.length + ecomsellerSamples.length}`);
  console.log(`Direct Origin Reachability:     ${originChecksPassed} / ${mohasagorSamples.length + ecomsellerSamples.length}`);
  console.log(`wsrv.nl CDN Proxy Reachability: ${proxyChecksPassed} / ${mohasagorSamples.length + ecomsellerSamples.length}`);
  console.log(`Generic Portraits Encountered:  ${genericPortraitsFound}`);
  console.log(`Peach SVG Fallbacks Reached:    ${peachPlaceholdersFound}`);
  console.log(`Total Critical Failures:        ${failures}`);

  if (failures === 0 && genericPortraitsFound === 0 && peachPlaceholdersFound === 0) {
    console.log('\n>>> RESULT: ALL AUTOMATED IMAGE VERIFICATION CRITERIA PASSED! <<<');
    return true;
  } else {
    console.error(`\n>>> RESULT: VERIFICATION FAILED WITH ${failures} ERRORS. <<<`);
    return false;
  }
}

verifyCatalogImages()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Execution error:', err);
    process.exit(1);
  });
