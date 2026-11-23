const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

(async () => {
  const port = 9452;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-diag-load-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targets = await getJson('http://127.0.0.1:' + port + '/json');
    const pageTarget = targets.find(t => t.type === 'page');
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    const send = (method, params = {}) => new Promise(res => {
      const id = msgId++;
      callbacks.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    console.log('Navigating to http://localhost:8080/ ...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    
    // Wait for network and images
    await new Promise(r => setTimeout(r, 5000));
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800);' });
    await new Promise(r => setTimeout(r, 3000));

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot && shot.data) {
      fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/home_images_fixed_verified.png', Buffer.from(shot.data, 'base64'));
      console.log('Screenshot saved to home_images_fixed_verified.png');
    }

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const imgs = Array.from(document.querySelectorAll('article img, [class*="product-card"] img, a[href*="/product/"] img'));
        const loaded = imgs.filter(i => i.complete && i.naturalWidth > 1).length;
        const svgs = imgs.filter(i => i.src.startsWith('data:image/svg')).length;
        const total = imgs.length;
        return { total, loaded, svgs };
      })()`,
      returnByValue: true
    });
    console.log('Image status in DOM:', check.result.value);

    ws.close();
  } finally {
    chromeProc.kill();
  }
})();
