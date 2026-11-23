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
  const port = 9343;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-fbt-test-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=430,1050',
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

    console.log('Navigating to Silicon Dish Washing product page...');
    await send('Page.navigate', { url: 'http://localhost:8080/product/silicon-dish-washing-kitchen-hand-gloves-1-pair-11738' });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll to Frequently Bought Together section
    const scrollRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const allSections = Array.from(document.querySelectorAll('section, h3'));
        const fbtEl = allSections.find(el => el.textContent.includes('Frequently Bought Together'));
        if (fbtEl) {
          fbtEl.scrollIntoView({ block: 'center', behavior: 'instant' });
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('Found FBT section:', scrollRes.result?.value);
    await new Promise(r => setTimeout(r, 1200));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasNaN = bodyText.includes('NaN');
        const fbtSec = Array.from(document.querySelectorAll('section')).find(s => s.textContent.includes('Frequently Bought Together'));
        return {
          hasNaN,
          fbtSnippet: fbtSec ? fbtSec.innerText.substring(0, 500) : 'Not found'
        };
      })()`,
      returnByValue: true
    });

    console.log('FBT Audit Result:', JSON.stringify(evalRes.result?.value, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/fbt_unslop_verified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved FBT screenshot to:', shotPath);

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
