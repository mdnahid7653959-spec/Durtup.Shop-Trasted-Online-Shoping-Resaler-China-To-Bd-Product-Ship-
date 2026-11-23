const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
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
  const port = 9425;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-test-all-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
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
    const pageErrors = [];

    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        pageErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
      }
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result);
        callbacks.delete(msg.id);
      }
    };

    const send = (method, params = {}) => new Promise(res => {
      const id = msgId++;
      callbacks.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      fitWindow: false
    });

    // 1. Check Mobile Homepage
    console.log('--- 1. Testing Mobile Homepage ---');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 2000));

    const homeRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const title = document.title;
        const hasCriticalCss = !!document.getElementById('critical-ssr-css');
        const hasMarquee = !!document.querySelector('.animate-marquee');
        const hasHero = !!document.querySelector('.embla__container') || !!document.querySelector('img[alt*="banner" i], img[alt*="Banner" i]');
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        return { title, hasCriticalCss, hasMarquee, hasHero, scrollWidth, clientWidth };
      })()`,
      returnByValue: true
    });
    console.log('Homepage Result:', homeRes?.result?.value);
    console.log('Homepage Errors count:', pageErrors.length);

    // 2. Check Cart Page
    console.log('\n--- 2. Testing Cart Page ---');
    pageErrors.length = 0;
    await send('Page.navigate', { url: 'http://localhost:8080/cart' });
    await new Promise(r => setTimeout(r, 2000));

    const cartRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasCrashNotice = text.includes('সাময়িক বিভ্রাট দেখা দিয়েছে');
        const hasGetDirectImageErr = text.includes('getDirectImageUrl is not defined');
        const h1 = document.querySelector('h1')?.innerText || '';
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        return { hasCrashNotice, hasGetDirectImageErr, h1, scrollWidth, clientWidth };
      })()`,
      returnByValue: true
    });
    console.log('Cart Page Result:', cartRes?.result?.value);
    console.log('Cart Errors count:', pageErrors.length, pageErrors);

    // 3. Check Product Detail Page
    console.log('\n--- 3. Testing Product Detail Page ---');
    pageErrors.length = 0;
    await send('Page.navigate', { url: 'http://localhost:8080/product/silicon-dish-washing-kitchen-hand-gloves-1-pair' });
    await new Promise(r => setTimeout(r, 2500));

    const productRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasPriceDropText = text.includes('দাম কমলে জানান') || text.includes('Price Drop Alert');
        const hasNaN = text.includes('৳NaN') || text.includes('NaN');
        const hasFrequentlyBought = text.includes('Frequently Bought Together');
        const hasCrashNotice = text.includes('সাময়িক বিভ্রাট দেখা দিয়েছে');
        const title = document.querySelector('h1')?.innerText || '';
        return { title, hasPriceDropText, hasNaN, hasFrequentlyBought, hasCrashNotice };
      })()`,
      returnByValue: true
    });
    console.log('Product Detail Result:', productRes?.result?.value);
    console.log('Product Errors count:', pageErrors.length, pageErrors);

    // 4. Check Checkout Page
    console.log('\n--- 4. Testing Checkout Page ---');
    pageErrors.length = 0;
    await send('Page.navigate', { url: 'http://localhost:8080/checkout' });
    await new Promise(r => setTimeout(r, 2000));

    const checkoutRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasCrashNotice = text.includes('সাময়িক বিভ্রাট দেখা দিয়েছে');
        const hasDeliveryAddress = text.includes('ডেলিভারি ঠিকানা') || text.includes('Delivery Address');
        return { hasCrashNotice, hasDeliveryAddress };
      })()`,
      returnByValue: true
    });
    console.log('Checkout Page Result:', checkoutRes?.result?.value);
    console.log('Checkout Errors count:', pageErrors.length, pageErrors);

    ws.close();
  } finally {
    chromeProc.kill();
  }
})();
