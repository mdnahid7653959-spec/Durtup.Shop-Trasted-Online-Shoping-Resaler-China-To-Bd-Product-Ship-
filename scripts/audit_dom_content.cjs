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

(async () => {
  const port = 9337;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-diag-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,2400',
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
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 2500));

    // Smoothly scroll down to trigger all sections
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 1200, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 1500));

    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 2500, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 2000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const cardNames = Array.from(document.querySelectorAll('h3')).map(el => el.textContent.trim()).filter(Boolean);
        const images = Array.from(document.querySelectorAll('img'));
        const rendered = images.filter(i => i.naturalWidth > 1).length;
        const broken = images.filter(i => i.complete && i.naturalWidth === 0).length;
        const skeletons = document.querySelectorAll('.skeleton-shimmer').length;
        return {
          cardCount: cardNames.length,
          totalImages: images.length,
          renderedImages: rendered,
          brokenImages: broken,
          lingeringSkeletons: skeletons
        };
      })()`,
      returnByValue: true
    });

    console.log('Post-Scroll Audit Result:');
    console.log(JSON.stringify(evalRes.result?.value, null, 2));

    // Capture full-page screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/full_homepage_verification.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to:', shotPath);

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
