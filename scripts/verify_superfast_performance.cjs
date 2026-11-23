const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9334;

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-verify-' + Date.now());
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const eventHandlers = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method && eventHandlers.has(msg.method)) {
        for (const handler of eventHandlers.get(msg.method)) {
          handler(msg.params);
        }
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function on(event, handler) {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event).push(handler);
    }

    await send('Page.enable');
    await send('Network.enable');
    await send('Runtime.enable');

    const networkRequests = [];
    const imageRequests = [];
    let totalBytes = 0;

    on('Network.requestWillBeSent', (params) => {
      networkRequests.push({
        url: params.request.url,
        type: params.type,
        timestamp: params.timestamp
      });
      if (params.type === 'Image' || params.request.url.match(/\.(jpg|jpeg|png|webp|avif|svg)/i)) {
        imageRequests.push({
          url: params.request.url,
          status: 'pending'
        });
      }
    });

    on('Network.responseReceived', (params) => {
      const req = imageRequests.find(r => r.url === params.response.url);
      if (req) {
        req.status = params.response.status;
        req.mimeType = params.response.mimeType;
      }
      if (params.response.encodedDataLength) {
        totalBytes += params.response.encodedDataLength;
      }
    });

    on('Network.loadingFailed', (params) => {
      const req = imageRequests.find(r => r.url === params.requestId);
      if (req) {
        req.status = 'FAILED: ' + params.errorText;
      }
    });

    console.log('Navigating to http://localhost:8080/ ...');
    const navStart = Date.now();
    await send('Page.navigate', { url: 'http://localhost:8080/' });

    // Wait 3.5 seconds for all initial rendering to settle
    await new Promise(r => setTimeout(r, 3500));

    // Evaluate metrics
    const metricsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const perf = performance.getEntriesByType('paint');
        const fcp = perf.find(p => p.name === 'first-contentful-paint');
        const productCards = document.querySelectorAll('[data-product-id], .group.relative, .product-card').length;
        const skeletons = document.querySelectorAll('.skeleton-shimmer, [class*="skeleton"]').length;
        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => img.naturalWidth === 0 && img.complete).length;
        const totalImages = document.querySelectorAll('img').length;
        const renderedImages = Array.from(document.querySelectorAll('img')).filter(img => img.naturalWidth > 1).length;
        return {
          fcp: fcp ? Math.round(fcp.startTime) : null,
          productCards,
          skeletons,
          brokenImages,
          totalImages,
          renderedImages
        };
      })()`,
      returnByValue: true
    });

    const pageMetrics = metricsRes.result?.value || {};
    console.log('=== VERIFICATION PAGE METRICS ===');
    console.log(JSON.stringify(pageMetrics, null, 2));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/superfast_verification.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to:', shotPath);

    const failedImages = imageRequests.filter(r => typeof r.status === 'number' ? r.status >= 400 : String(r.status).includes('FAILED'));
    console.log('Total Network Requests:', networkRequests.length);
    console.log('Total Image Requests:', imageRequests.length);
    console.log('Failed Image Requests:', failedImages.length);

    const report = {
      timestamp: new Date().toISOString(),
      pageMetrics,
      totalNetworkRequests: networkRequests.length,
      totalImageRequests: imageRequests.length,
      failedImageCount: failedImages.length,
      totalBytesTransferred: totalBytes
    };

    fs.writeFileSync('scripts/verification_results.json', JSON.stringify(report, null, 2));
    console.log('Saved report to scripts/verification_results.json');

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
}

run().catch(console.error);
