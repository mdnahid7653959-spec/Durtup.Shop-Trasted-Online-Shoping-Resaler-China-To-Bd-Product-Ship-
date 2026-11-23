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
  const port = 9445;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-diag2-' + Date.now()),
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
    await new Promise(r => setTimeout(r, 3000));

    // Scroll down to trigger lazy loading / product feed
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1000);' });
    await new Promise(r => setTimeout(r, 2000));

    const imgInfos = await send('Runtime.evaluate', {
      expression: `(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(i => ({
          alt: i.alt,
          src: i.src ? i.src.substring(0, 80) : '',
          isSvg: i.src.startsWith('data:image/svg'),
          complete: i.complete,
          naturalWidth: i.naturalWidth,
          naturalHeight: i.naturalHeight
        }));
      })()`,
      returnByValue: true
    });

    console.log('Total images found on page:', imgInfos.result.value.length);
    console.log('Sample images:');
    console.dir(imgInfos.result.value.slice(0, 25), { depth: null });

    ws.close();
  } finally {
    chromeProc.kill();
  }
})();
