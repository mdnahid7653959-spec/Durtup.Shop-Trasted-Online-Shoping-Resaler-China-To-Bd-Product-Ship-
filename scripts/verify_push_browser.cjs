const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9225;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-push-diag-' + Date.now(),
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
    console.error('Failed to connect to Chrome:', e.message);
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
  const logs = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      logs.push(`[${msg.params.type}] ${text}`);
      if (msg.params.type === 'error') {
        collectedErrors.push(`[Console Error] ${text}`);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      collectedErrors.push(`[Exception] ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description || ''}`);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('ServiceWorker.enable');

  console.log('Navigating to http://localhost:8080/ ...');
  await send('Page.navigate', { url: 'http://localhost:8080/' });
  await new Promise(r => setTimeout(r, 4000));

  // Evaluate ServiceWorker & Notification support in browser
  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          serviceWorkerSupported: 'serviceWorker' in navigator,
          notificationSupported: 'Notification' in window,
          permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Browser Feature Support Check:', evalRes.result.value);

  // Navigate to Admin Push Notifications
  console.log('Navigating to http://localhost:8080/admin/push-notifications ...');
  await send('Page.navigate', { url: 'http://localhost:8080/admin/push-notifications' });
  await new Promise(r => setTimeout(r, 3000));

  const adminEval = await send('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Admin Page State:', adminEval.result.value);

  console.log('\n--- Chrome CDP Diagnostics Summary ---');
  console.log('Total Console Errors:', collectedErrors.length);
  if (collectedErrors.length > 0) {
    console.log('Errors:', collectedErrors.slice(0, 5));
  } else {
    console.log('✅ 0 Errors detected during navigation and rendering!');
  }

  ws.close();
  chromeProc.kill();
  console.log('🎉 Browser verification finished cleanly.');
}

main().catch(console.error);
