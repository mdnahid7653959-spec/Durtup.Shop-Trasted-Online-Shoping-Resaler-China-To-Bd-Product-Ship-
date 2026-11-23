const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9230;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-img-diag-' + Date.now(),
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

  const networkFailed = [];
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      consoleErrors.push(msg.params.entry);
    }
    if (msg.method === 'Network.loadingFailed') {
      networkFailed.push(msg.params);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');

  console.log('Navigating to http://localhost:8080/ ...');
  await send('Page.navigate', { url: 'http://localhost:8080/' });
  await new Promise(r => setTimeout(r, 5000));

  const diag = await send('Runtime.evaluate', {
    expression: `(() => {
      // Find Just Added section
      const headers = Array.from(document.querySelectorAll('h2, h3, div')).filter(el => el.textContent && el.textContent.includes('Just Added'));
      const justAddedEl = headers[0];
      
      const cards = Array.from(document.querySelectorAll('#product-card, [id^="product-card-"]'));
      const cardDetails = cards.slice(0, 10).map(c => {
        const titleEl = c.querySelector('h3, a, p');
        const imgEl = c.querySelector('img');
        const skeleton = c.querySelector('.skeleton-shimmer');
        return {
          title: titleEl ? titleEl.innerText : 'Unknown',
          hasImg: Boolean(imgEl),
          imgSrc: imgEl ? imgEl.src : null,
          imgComplete: imgEl ? imgEl.complete : null,
          imgNaturalWidth: imgEl ? imgEl.naturalWidth : null,
          imgOpacity: imgEl ? window.getComputedStyle(imgEl).opacity : null,
          hasSkeleton: Boolean(skeleton)
        };
      });

      return {
        totalCardsFound: cards.length,
        cardDetails
      };
    })()`,
    returnByValue: true
  });

  console.log('--- CARD DIAGNOSTICS ---');
  console.log(JSON.stringify(diag.result.value, null, 2));

  console.log('--- NETWORK FAILED (Sample) ---');
  console.log(networkFailed.slice(0, 5));

  console.log('--- CONSOLE ERRORS ---');
  console.log(consoleErrors.slice(0, 5));

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
