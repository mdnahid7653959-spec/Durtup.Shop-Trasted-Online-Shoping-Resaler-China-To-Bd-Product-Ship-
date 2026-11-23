const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9227;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-compare-diag-' + Date.now(),
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

  console.log('Navigating to http://localhost:8080/compare ...');
  await send('Page.navigate', { url: 'http://localhost:8080/compare' });
  await new Promise(r => setTimeout(r, 3500));

  const compareEval = await send('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          hasDemoButton: Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes('ডেমো')),
          emptyStateText: document.querySelector('h2')?.innerText || '',
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Compare Page Render Result:', compareEval.result.value);

  // Click demo button to test comparison matrix rendering
  console.log('Clicking Demo button to test live comparison table...');
  await send('Runtime.evaluate', {
    expression: `
      (function() {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ডেমো'));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  const tableEval = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const table = document.querySelector('table');
        const headers = Array.from(document.querySelectorAll('th')).map(th => th.innerText.trim()).filter(Boolean);
        const rowsCount = document.querySelectorAll('tr').length;
        return {
          hasTable: !!table,
          headersCount: headers.length,
          rowsCount,
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Comparison Matrix Table State:', tableEval.result.value);

  console.log('\n--- Chrome CDP Diagnostics Summary ---');
  console.log('Total Console Errors:', collectedErrors.length);
  if (collectedErrors.length > 0) {
    console.log('Errors:', collectedErrors.slice(0, 5));
  } else {
    console.log('✅ 0 Errors detected during compare navigation and rendering!');
  }

  ws.close();
  chromeProc.kill();
  console.log('🎉 Browser verification finished cleanly.');
}

main().catch(console.error);
