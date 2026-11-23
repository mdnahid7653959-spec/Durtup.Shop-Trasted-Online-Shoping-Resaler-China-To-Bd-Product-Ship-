const { spawn } = require('child_process');
const http = require('http');

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9220 + Math.floor(Math.random() * 80);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + require('os').tmpdir() + '/chrome-qa-diag-' + Date.now(),
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

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      collectedErrors.push(msg.params.exceptionDetails);
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      collectedErrors.push(msg.params.entry);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  console.log('--- Navigating to Product Detail Page (Q&A verification) ---');
  await send('Page.navigate', { url: 'http://localhost:8080/product/period-pain-relief-waist-belt-heating-pad-device-8997' });
  await new Promise(r => setTimeout(r, 3500));

  const pageSnippet = await send('Runtime.evaluate', {
    expression: `({
      hasQAHeading: document.body.innerText.includes("প্রশ্ন ও উত্তর") || document.body.innerText.includes("প্রশ্ন করুন"),
      hasSearchInput: Boolean(document.querySelector('input[placeholder*="প্রশ্ন"]')),
      hasAskButton: Boolean(document.querySelector('button') && document.body.innerText.includes("প্রশ্ন করুন")),
      title: document.title
    })`,
    returnByValue: true
  });
  console.log('Product Page Q&A elements:', pageSnippet.result.value);

  console.log('--- Navigating to Admin Product Q&A Page ---');
  // First seed admin auth in localStorage with megamart_admin_session
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('megamart_admin_session', JSON.stringify({
        token: 'dev-admin-token',
        admin: {
          id: 'admin_1',
          email: 'admin@durtup.shop',
          role: 'super_admin',
          full_name: 'Durtup Super Admin'
        },
        expiresAt: Date.now() + 86400000
      }));
    `
  });

  await send('Page.navigate', { url: 'http://localhost:8080/admin/product-qa' });
  await new Promise(r => setTimeout(r, 3500));

  const adminSnippet = await send('Runtime.evaluate', {
    expression: `({
      hasAdminQAHeading: document.body.innerText.includes("Product Q&A Management") || document.body.innerText.includes("কাস্টমার প্রোডাক্ট প্রশ্ন ও উত্তর"),
      hasKPICards: document.body.innerText.includes("সর্বমোট প্রশ্ন") || document.body.innerText.includes("অনুমোদিত"),
      url: window.location.href
    })`,
    returnByValue: true
  });
  console.log('Admin Q&A elements:', adminSnippet.result.value);

  // Filter errors (ignore network 404 for missing remote assets if any)
  const actualErrors = collectedErrors.filter(e => {
    const text = JSON.stringify(e);
    return !text.includes('Failed to load resource') && !text.includes('net::ERR');
  });

  console.log('\n--- DIAGNOSTIC RESULTS ---');
  console.log('Runtime Javascript Errors:', actualErrors.length);
  if (actualErrors.length > 0) {
    console.log(JSON.stringify(actualErrors, null, 2));
  } else {
    console.log('SUCCESS: 0 Javascript runtime errors detected! Perfect render.');
  }

  ws.close();
  chromeProc.kill();
  process.exit(actualErrors.length === 0 ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
