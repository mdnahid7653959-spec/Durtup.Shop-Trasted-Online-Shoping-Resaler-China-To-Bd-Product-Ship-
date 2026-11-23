const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9226;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--window-size=1400,900',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-screen-cmp2-' + Date.now(),
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

  let targets = await getJson(`http://127.0.0.1:${port}/json`);
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

  ws.onmessage = (evt) => {
    const res = JSON.parse(evt.data);
    if (res.id && pending.has(res.id)) {
      const { resolve } = pending.get(res.id);
      pending.delete(res.id);
      resolve(res.result);
    }
  };

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Page.navigate', { url: 'http://localhost:8080/compare' });
      await new Promise(r => setTimeout(r, 2000));

      // Click the demo button
      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const demoBtn = btns.find(b => (b.innerText || '').includes('ডেমো'));
            if (demoBtn) {
              demoBtn.click();
              return 'clicked';
            }
            return 'not found';
          })()
        `
      });
      console.log('Eval result:', evalRes);

      await new Promise(r => setTimeout(r, 2000));

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const outPath = path.join('C:\\Users\\mdnah\\.gemini\\antigravity\\brain\\4a0ec98f-b643-4d8a-8324-6a10793efea6', 'compare_table_preview.png');
      fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
      console.log('Saved screenshot to:', outPath);
    } catch (e) {
      console.error(e);
    } finally {
      ws.close();
      chromeProc.kill();
      process.exit(0);
    }
  };
}

main();
