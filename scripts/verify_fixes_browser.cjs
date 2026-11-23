const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9226;
  const userDataDir = path.join(require('os').tmpdir(), 'chrome-verify-' + Date.now());

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
  const networkErrors = [];

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
    if (data.method === 'Network.loadingFailed') {
      networkErrors.push({ url: data.params.requestId, type: data.params.type, errorText: data.params.errorText });
    }
  };

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Network.enable');

      const testUrls = [
        'http://localhost:8080/',
        'http://localhost:8080/category/womens-fashion',
        'http://localhost:8080/category/gadgets-electronics',
        'http://localhost:8080/category/mens-fashion'
      ];

      const results = {};

      for (const url of testUrls) {
        consoleLogs.length = 0;
        networkErrors.length = 0;
        console.log(`\n========================================`);
        console.log(`TESTING URL: ${url}`);
        console.log(`========================================`);

        await send('Page.navigate', { url });
        // Wait 6 seconds for React & data to settle
        await new Promise(r => setTimeout(r, 6000));

        const evaluation = await send('Runtime.evaluate', {
          expression: `(() => {
            const productLinks = Array.from(document.querySelectorAll('a[href*="/product/"]'));
            const productNames = productLinks.map(a => a.innerText.trim()).filter(Boolean);
            const images = Array.from(document.querySelectorAll('img')).map(img => ({
              src: img.src ? img.src.slice(0, 80) : '',
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              complete: img.complete
            }));
            
            const justAddedSection = Array.from(document.querySelectorAll('h2, h3, div')).find(el => el.textContent && el.textContent.includes('Just Added'));
            const justAddedParent = justAddedSection ? justAddedSection.closest('section') || justAddedSection.parentElement : null;
            const justAddedImages = justAddedParent ? Array.from(justAddedParent.querySelectorAll('img')).map(i => i.src) : [];

            // Duplicate images check in Just Added
            const imageCounts = {};
            justAddedImages.forEach(src => { imageCounts[src] = (imageCounts[src] || 0) + 1; });
            const duplicates = Object.entries(imageCounts).filter(([_, count]) => count > 1);

            return {
              title: document.title,
              productCount: productLinks.length,
              sampleProducts: productNames.slice(0, 8),
              totalImages: images.length,
              brokenImages: images.filter(i => i.complete && i.naturalWidth === 0).length,
              loadedImages: images.filter(i => i.naturalWidth > 0).length,
              justAddedImagesCount: justAddedImages.length,
              justAddedDuplicates: duplicates,
              hasMain: !!document.querySelector('main'),
              mainSnippet: document.querySelector('main') ? document.querySelector('main').innerText.slice(0, 300).replace(/\\n+/g, ' ') : 'NO MAIN'
            };
          })()`,
          returnByValue: true
        });

        const val = evaluation.result?.value;
        results[url] = {
          data: val,
          errors: consoleLogs.filter(l => l.type === 'error' || l.type === 'EXCEPTION'),
          networkErrors: networkErrors
        };

        console.log('Result:', JSON.stringify(val, null, 2));
        if (results[url].errors.length > 0) {
          console.log('Errors:', results[url].errors);
        }
      }

      // Check Cart / Checkout functionality
      console.log(`\n========================================`);
      console.log(`TESTING CHECKOUT / CART NAVIGATION`);
      console.log(`========================================`);
      await send('Page.navigate', { url: 'http://localhost:8080/cart' });
      await new Promise(r => setTimeout(r, 4000));
      const cartEval = await send('Runtime.evaluate', {
        expression: `({
          title: document.title,
          hasMain: !!document.querySelector('main'),
          text: document.body.innerText.slice(0, 300).replace(/\\n+/g, ' ')
        })`,
        returnByValue: true
      });
      console.log('Cart Page:', JSON.stringify(cartEval.result?.value, null, 2));

      fs.writeFileSync('scripts/verification_results.json', JSON.stringify(results, null, 2));
      console.log('\nWrote full results to scripts/verification_results.json');

      ws.close();
      chromeProc.kill();
    } catch (err) {
      console.error('Test execution error:', err);
      ws.close();
      chromeProc.kill();
    }
  };
}

run();
