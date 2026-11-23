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
  const port = 9359;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-lb-mob-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=430,932',
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

    console.log('Navigating mobile...');
    await send('Page.navigate', { url: 'http://localhost:8080/product/windshield-glass-crack-repair-kit' });
    await new Promise(r => setTimeout(r, 3500));

    // On mobile, tap main image or zoom button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const zoomBtn = document.querySelector('button[title*="Fullscreen HD Zoom"]') || 
                        Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Zoom'));
        if (zoomBtn) {
          zoomBtn.click();
          return;
        }
        const aspectContainers = Array.from(document.querySelectorAll('div.aspect-square'));
        if (aspectContainers.length > 0) {
          aspectContainers[0].click();
        }
      })()`
    });

    await new Promise(r => setTimeout(r, 1200));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/lightbox_unslop_mobile_verified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved mobile screenshot to:', shotPath);

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
