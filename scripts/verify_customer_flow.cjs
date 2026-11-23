const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9227;
  const userDataDir = path.join(require('os').tmpdir(), 'chrome-flow-' + Date.now());

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + userDataDir,
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

  let targets;
  try {
    targets = await getJson('http://127.0.0.1:' + port + '/json');
  } catch (err) {
    console.error('Failed to get targets:', err.message);
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

  const consoleLogs = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id).resolve(data.result);
      pending.delete(data.id);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleLogs.push({ type: data.params.type, text });
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleLogs.push({ type: 'EXCEPTION', text: data.params.exceptionDetails?.text, desc: data.params.exceptionDetails?.exception?.description });
    }
  };

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Runtime.enable');

      const testUrls = [
        'http://localhost:8080/cart',
        'http://localhost:8080/checkout',
        'http://localhost:8080/login',
        'http://localhost:8080/register',
        'http://localhost:8080/categories'
      ];

      for (const url of testUrls) {
        consoleLogs.length = 0;
        console.log(`\n========================================`);
        console.log(`TESTING: ${url}`);
        console.log(`========================================`);

        await send('Page.navigate', { url });
        await new Promise(r => setTimeout(r, 4000));

        const evaluation = await send('Runtime.evaluate', {
          expression: `(() => {
            const h1 = document.querySelector('h1')?.innerText || '';
            const main = document.querySelector('main');
            const buttons = Array.from(document.querySelectorAll('button, a[role=\"button\"]')).map(b => b.innerText.trim()).filter(Boolean);
            const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ placeholder: i.placeholder, type: i.type }));
            return {
              title: document.title,
              h1,
              hasMain: !!main,
              buttonsCount: buttons.length,
              sampleButtons: buttons.slice(0, 6),
              inputsCount: inputs.length,
              sampleInputs: inputs.slice(0, 4),
              contentSnippet: (main?.innerText || document.body.innerText).slice(0, 200).replace(/\\n+/g, ' ')
            };
          })()`,
          returnByValue: true
        });

        console.log('Result:', JSON.stringify(evaluation.result?.value, null, 2));
        const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'EXCEPTION');
        console.log('Errors count:', errors.length);
        if (errors.length) {
          console.log('Errors:', JSON.stringify(errors.slice(0, 5), null, 2));
        }
      }

      ws.close();
      chromeProc.kill();
    } catch (err) {
      console.error('Test error:', err);
      ws.close();
      chromeProc.kill();
    }
  };
}

run();
