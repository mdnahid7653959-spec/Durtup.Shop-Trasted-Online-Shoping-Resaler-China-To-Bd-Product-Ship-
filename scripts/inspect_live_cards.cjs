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
  const port = 9467;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-inspect-products-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,1200',
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

    await send('Page.navigate', { url: 'http://localhost:8080/' });
    // Scroll down to products
    await new Promise(r => setTimeout(r, 3000));
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800);' });
    await new Promise(r => setTimeout(r, 3000));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const productCards = Array.from(document.querySelectorAll('[id^="product-card-"]'));
        return {
          totalCards: productCards.length,
          sample: productCards.slice(0, 10).map(c => {
            const h3 = c.querySelector('h3, h2, a')?.innerText || '';
            const img = c.querySelector('img');
            return {
              id: c.id,
              title: h3.substring(0, 35),
              src: img ? img.src.substring(0, 80) : '',
              complete: img ? img.complete : false,
              naturalWidth: img ? img.naturalWidth : 0,
              isSvg: img ? img.src.startsWith('data:image/svg') : false,
              isLoadedOpacity: img ? img.classList.contains('opacity-100') : false
            };
          })
        };
      })()`,
      returnByValue: true
    });

    console.log('Result:', JSON.stringify(res.result.value, null, 2));

    ws.close();
  } finally {
    chromeProc.kill();
  }
})();
