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
  const port = 9341;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-pda-test-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=430,932', // Mobile iPhone viewport like in user's screenshot
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

    console.log('Navigating to product detail page on mobile viewport...');
    await send('Page.navigate', { url: 'http://localhost:8080/product/x5-full-hd-mini-wifi-ip-camera-ac0a83b2' });
    await new Promise(r => setTimeout(r, 3000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasPriceDropText = bodyText.includes('দাম কমলে জানান') || bodyText.includes('Price Drop Alert');
        const hasPriceDropButton = document.querySelector('[aria-label="Price Drop Alert"]') !== null;
        const actionButtons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean);
        return {
          hasPriceDropText,
          hasPriceDropButton,
          actionButtonsCount: actionButtons.length
        };
      })()`,
      returnByValue: true
    });

    console.log('Price Drop Removal Audit:', JSON.stringify(evalRes.result?.value, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/price_drop_removed_verification.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to:', shotPath);

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
