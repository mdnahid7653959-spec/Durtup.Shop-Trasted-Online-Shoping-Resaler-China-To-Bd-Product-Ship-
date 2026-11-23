const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9223;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-diag-multi-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  function getJson(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
  }

  let targets = [];
  try {
    targets = await getJson(`http://127.0.0.1:${port}/json`);
  } catch(e) {
    console.error('Failed to connect:', e.message);
    chromeProc.kill();
    return;
  }

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

  const collectedErrors = [];

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Log.enable');

      const routesToTest = [
        '/',
        '/products',
        '/account',
        '/admin/back-in-stock',
        '/admin/flash-sale',
        '/admin/loyalty',
        '/admin/cashback',
        '/admin/abandoned-carts',
        '/admin/recommendations',
        '/admin/inventory'
      ];

      for (const route of routesToTest) {
        console.log(`\nTesting route: http://localhost:8080${route} ...`);
        await send('Page.navigate', { url: `http://localhost:8080${route}` });
        await new Promise(r => setTimeout(r, 2000));

        const res = await send('Runtime.evaluate', {
          expression: `({
            url: window.location.href,
            hasErrorBoundary: document.body.innerText.includes('সাময়িক বিভ্রাট'),
            bodySnippet: document.body.innerText.slice(0, 150).replace(/\\n/g, ' ')
          })`,
          returnByValue: true
        });
        console.log(`Route [${route}] result:`, res.result?.value);
      }

      console.log('\nAll Tested Routes Done! Total runtime exceptions caught:', collectedErrors.length);
      ws.close();
      chromeProc.kill();
    } catch(err) {
      console.error('Test error:', err);
      ws.close();
      chromeProc.kill();
    }
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id).resolve(data.result);
      pending.delete(data.id);
    } else if (data.method === 'Runtime.exceptionThrown') {
      collectedErrors.push(data.params.exceptionDetails);
      console.error('*** EXCEPTION ***:', data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text);
    }
  };
}

main().catch(console.error);
