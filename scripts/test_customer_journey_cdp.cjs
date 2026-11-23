const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function run() {
  const port = 9338;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-journey-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targets = await getJson('http://127.0.0.1:' + port + '/json');
    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id).resolve(msg.result);
        callbacks.delete(msg.id);
      }
    };
    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        callbacks.set(id, { resolve });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    const routesToTest = [
      { name: 'Homepage', url: 'http://localhost:8080/' },
      { name: 'Category - Gadgets', url: 'http://localhost:8080/category/gadgets' },
      { name: 'Product Detail', url: 'http://localhost:8080/product/x5-full-hd-mini-wifi-ip-camera-ac0a83b2' },
      { name: 'Cart', url: 'http://localhost:8080/cart' },
      { name: 'Checkout', url: 'http://localhost:8080/checkout' }
    ];

    const results = [];

    for (const r of routesToTest) {
      console.log(`Testing route: ${r.name} (${r.url}) ...`);
      const navStart = Date.now();
      await send('Page.navigate', { url: r.url });
      await new Promise(res => setTimeout(res, 2500));

      const evalMetrics = await send('Runtime.evaluate', {
        expression: `(() => {
          const perf = performance.getEntriesByType('paint');
          const fcp = perf.find(p => p.name === 'first-contentful-paint');
          const broken = Array.from(document.querySelectorAll('img')).filter(img => img.complete && img.naturalWidth === 0).length;
          const renderedImgs = Array.from(document.querySelectorAll('img')).filter(img => img.naturalWidth > 1).length;
          const totalImgs = document.querySelectorAll('img').length;
          const cards = document.querySelectorAll('h3, [data-product-id]').length;
          const hasErrorText = document.body.innerText.includes('Something went wrong') || document.body.innerText.includes('Cannot read properties');
          const pageTitle = document.title;
          return {
            fcp: fcp ? Math.round(fcp.startTime) : null,
            brokenImages: broken,
            renderedImages: renderedImgs,
            totalImages: totalImgs,
            cards,
            hasErrorText,
            pageTitle
          };
        })()`,
        returnByValue: true
      });

      const metrics = evalMetrics.result?.value || {};
      const loadTime = Date.now() - navStart;
      console.log(`  -> Result: LoadTime=${loadTime}ms, FCP=${metrics.fcp}ms, RenderedImgs=${metrics.renderedImages}/${metrics.totalImages}, Broken=${metrics.brokenImages}, ErrorText=${metrics.hasErrorText}`);
      results.push({
        route: r.name,
        url: r.url,
        loadTimeMs: loadTime,
        metrics
      });
    }

    fs.writeFileSync('scripts/customer_journey_results.json', JSON.stringify(results, null, 2));
    console.log('\nAll customer journey tests complete! Saved to scripts/customer_journey_results.json');
    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

run().catch(console.error);
