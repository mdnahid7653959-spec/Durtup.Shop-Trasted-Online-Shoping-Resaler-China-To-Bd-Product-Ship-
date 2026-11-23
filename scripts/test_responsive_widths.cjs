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
  const widths = [390, 500, 600, 768, 900, 1024];

  for (const w of widths) {
    const port = 9400 + Math.floor(Math.random() * 50);
    const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=' + port,
      '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-w-' + w + '-' + Date.now()),
      '--disable-gpu',
      '--no-sandbox',
      `--window-size=${w},900`,
      'about:blank'
    ]);

    try {
      await new Promise(r => setTimeout(r, 1200));
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
      function send(method, params = {}) {
        return new Promise(resolve => {
          const id = msgId++;
          callbacks.set(id, resolve);
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Page.navigate', { url: 'http://localhost:8080/' });
      await new Promise(r => setTimeout(r, 2000));

      const info = await send('Runtime.evaluate', {
        expression: `({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          sideCardsVisible: !!document.querySelector('.side-card-promo, [class*="side-prod-top"]'),
          mobileNavVisible: !!document.querySelector('nav.md\\\\:hidden')
        })`,
        returnByValue: true
      });

      console.log(`Width ${w}px:`, info.result.value);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/test_width_${w}.png`, Buffer.from(shot.data, 'base64'));

      ws.close();
    } catch (e) {
      console.error(`Error at width ${w}:`, e.message);
    } finally {
      chromeProc.kill();
    }
  }
})();
