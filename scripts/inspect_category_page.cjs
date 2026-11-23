const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9225;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-diag-cat-' + Date.now(),
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

  const targets = await getJson('http://127.0.0.1:' + port + '/json');
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
      consoleLogs.push({ type: data.params.type, args: data.params.args.map(a => a.value || a.description) });
    }
    if (data.method === 'Runtime.exceptionThrown') {
      consoleLogs.push({ type: 'EXCEPTION', text: data.params.exceptionDetails?.text, desc: data.params.exceptionDetails?.exception?.description });
    }
  };

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Runtime.enable');

      for (const url of ['http://localhost:8080/category/womens-fashion', 'http://localhost:8080/']) {
        consoleLogs.length = 0;
        console.log('\n========================================');
        console.log('NAVIGATING TO:', url);
        console.log('========================================');
        await send('Page.navigate', { url });
        await new Promise(r => setTimeout(r, 3000));

        const info = await send('Runtime.evaluate', {
          expression: `({
            url: window.location.href,
            title: document.title,
            productLinksCount: document.querySelectorAll('a[href*="/product/"]').length,
            mainTextSnippet: document.querySelector('main') ? document.querySelector('main').innerText.slice(0, 400).replace(/\\n+/g, ' ') : 'no main',
            sections: Array.from(document.querySelectorAll('section, main > div')).map(s => (s.className || '').slice(0, 30) + ' -> ' + s.innerText.slice(0, 60).replace(/\\n+/g, ' '))
          })`,
          returnByValue: true
        });
        console.log('Page Info:', JSON.stringify(info.result?.value, null, 2));
        const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'EXCEPTION');
        console.log('Errors count:', errors.length);
        if (errors.length) {
          console.log('Errors:', JSON.stringify(errors.slice(0, 10), null, 2));
        }
      }

      ws.close();
      chromeProc.kill();
    } catch(err) {
      console.error(err);
      ws.close();
      chromeProc.kill();
    }
  };
}
run();
