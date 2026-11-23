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
  const port = 9414;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-test-root-' + Date.now()),
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
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const callbacks = new Map();
    const consoleLogs = [];
    const pageErrors = [];

    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push(`[${msg.params.type}] ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        pageErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
      }
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

    console.log('Navigating to http://localhost:8080/ ...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    
    // Check at 150ms (before React mounts)
    await new Promise(r => setTimeout(r, 150));
    const isStaticShell1 = await send('Runtime.evaluate', {
      expression: 'document.getElementById("root").innerHTML.includes("Period Pain Relief Waist Belt")'
    });
    console.log('At 150ms, is static shell in DOM?', isStaticShell1.result.value);

    // Check at 3500ms (after React mounts)
    await new Promise(r => setTimeout(r, 3500));
    const isStaticShell2 = await send('Runtime.evaluate', {
      expression: 'document.getElementById("root").innerHTML.includes("Period Pain Relief Waist Belt")'
    });
    console.log('At 3650ms, is static shell still in DOM?', isStaticShell2.result.value);

    console.log('Page errors count:', pageErrors.length);
    if (pageErrors.length) console.log('Errors:', pageErrors);

    ws.close();
  } catch(e) {
    console.error('Error:', e);
  } finally {
    chromeProc.kill();
  }
})();
