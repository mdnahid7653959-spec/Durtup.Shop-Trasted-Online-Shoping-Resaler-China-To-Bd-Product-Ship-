const { spawn } = require('child_process');
const http = require('http');
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
  const port = 9394;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-overflow-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=412,915',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targets = await getJson('http://127.0.0.1:' + port + '/json');
    const pageTarget = targets.find(t => t.type === 'page');
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = e => {
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      mobile: true
    });

    console.log('Navigating to http://localhost:8080/ ...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 3500));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const windowInner = window.innerWidth;

        // Find all elements wider than docWidth or extending beyond docWidth
        const overflowing = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > docWidth + 2 || el.scrollWidth > docWidth + 2) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              className: el.className ? (typeof el.className === 'string' ? el.className.slice(0, 100) : '') : '',
              rectRight: Math.round(rect.right),
              rectWidth: Math.round(rect.width),
              scrollWidth: el.scrollWidth,
              outerHTMLSnippet: el.outerHTML ? el.outerHTML.slice(0, 120) : ''
            });
          }
        }

        return {
          windowInner,
          docWidth,
          bodyScrollWidth,
          docScrollWidth,
          overflowCount: overflowing.length,
          topOverflowing: overflowing.slice(0, 20)
        };
      })()`,
      returnByValue: true
    });

    console.log('Overflow evaluation:\n', JSON.stringify(evalRes.result.value, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const fs = require('fs');
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/mobile_home_investigation.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved mobile_home_investigation.png');

    ws.close();
  } catch(e) {
    console.error('Error:', e);
  } finally {
    chromeProc.kill();
  }
})();
