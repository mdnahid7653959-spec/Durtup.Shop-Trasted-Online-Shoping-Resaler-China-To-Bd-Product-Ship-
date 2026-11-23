const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9250 + Math.floor(Math.random() * 50);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + os.tmpdir() + '/chrome-diag-' + Date.now(),
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

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

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  await new Promise(r => ws.on('open', r));
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Navigating to http://localhost:8080/ ...');
  await send('Page.navigate', { url: 'http://localhost:8080/' });
  await new Promise(r => setTimeout(r, 4000));

  // Scroll down to Just Added section
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: 1200, behavior: 'instant' })`
  });
  await new Promise(r => setTimeout(r, 3000));

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const allHeadings = Array.from(document.querySelectorAll('h2, h3, div'));
      const justAddedHeader = allHeadings.find(el => el.textContent && el.textContent.trim() === 'Just Added');
      if (!justAddedHeader) return { error: 'Just Added header not found' };

      let container = justAddedHeader.closest('section');
      if (!container) container = justAddedHeader.parentElement;

      const cards = Array.from(container.querySelectorAll('.group, [data-product-id], [id^="product-card-"]'));
      return {
        cardsCount: cards.length,
        items: cards.slice(0, 10).map(card => {
          const img = card.querySelector('img');
          const title = card.querySelector('h3, h4, p, a')?.textContent?.trim() || '';
          const skeleton = card.querySelector('.skeleton-shimmer');
          return {
            title: title.substring(0, 30),
            imgFound: Boolean(img),
            imgSrc: img ? img.src : null,
            imgComplete: img ? img.complete : null,
            naturalWidth: img ? img.naturalWidth : null,
            hasSkeleton: Boolean(skeleton),
            opacity: img ? window.getComputedStyle(img).opacity : null,
          };
        })
      };
    })()`,
    returnByValue: true
  });

  console.log('Just Added Diagnostics:');
  console.log(JSON.stringify(result.result.value, null, 2));

  ws.close();
  chromeProc.kill();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
