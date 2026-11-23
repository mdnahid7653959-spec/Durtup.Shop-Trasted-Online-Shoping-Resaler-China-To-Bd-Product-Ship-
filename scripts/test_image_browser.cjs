const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9235;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  function getJson(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  const targets = await getJson(`http://127.0.0.1:${port}/json`);
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const networkEvents = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method && msg.method.startsWith('Network.')) {
      networkEvents.push(msg);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  const testUrl = 'https://wsrv.nl/?url=https%3A%2F%2Fmohasagor.com.bd%2Fpublic%2Fstorage%2Fimages%2Fproducts%2FXTG8zLWBYiZvD9ontjm26N3YTzOGqH3T04s04bMs.webp&w=300&output=webp&q=78&we=0&fit=cover';
  const directUrl = 'https://mohasagor.com.bd/public/storage/images/products/XTG8zLWBYiZvD9ontjm26N3YTzOGqH3T04s04bMs.webp';

  console.log('Testing image loads in real Chrome browser...');
  const res = await send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      const results = {};
      
      const img1 = new Image();
      img1.referrerPolicy = "no-referrer";
      img1.onload = () => { results.wsrv = { status: 'loaded', width: img1.naturalWidth, height: img1.naturalHeight }; check(); };
      img1.onerror = (e) => { results.wsrv = { status: 'error', event: String(e) }; check(); };
      img1.src = "${testUrl}";

      const img2 = new Image();
      img2.referrerPolicy = "no-referrer";
      img2.onload = () => { results.direct = { status: 'loaded', width: img2.naturalWidth, height: img2.naturalHeight }; check(); };
      img2.onerror = (e) => { results.direct = { status: 'error', event: String(e) }; check(); };
      img2.src = "${directUrl}";

      function check() {
        if (results.wsrv && results.direct) resolve(results);
      }
      setTimeout(() => resolve(results), 6000);
    })`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Browser Image Load Results:', res.result.value);

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
