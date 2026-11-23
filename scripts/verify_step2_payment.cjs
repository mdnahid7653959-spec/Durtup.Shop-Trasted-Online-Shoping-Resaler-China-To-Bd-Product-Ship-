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
  const port = 9385;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-step2-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=430,932',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targets = await getJson('http://127.0.0.1:' + port + '/json');
    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id).resolve(msg.result);
        callbacks.delete(msg.id);
      }
    };
    function send(method, params = {}) {
      return new Promise(resolve => {
        const id = msgId++;
        callbacks.set(id, { resolve });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Seeding cart & address...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 1500));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const testItems = [{
          id: 'item-1',
          product_id: 'x5-camera',
          quantity: 1,
          price: 1150,
          product: { id: 'x5-camera', name: 'X5 Camera', price: 1150, regular_price: 1650, discount_price: 1150, stock_quantity: 50 },
          image: 'https://mohasagor.com.bd/public/storage/images/products/ZayMrvAT1IUcFNk3XpehinyDoaeyDC7JqzmPmpSo.jpg'
        }];
        localStorage.setItem('megamart_cart', JSON.stringify(testItems));
        localStorage.setItem('durtup_saved_address', JSON.stringify({
          fullName: 'Nahid Islam',
          phone: '01622530550',
          address: 'Rangamati Sadar',
          city: 'Rangamati',
          zipCode: '4500'
        }));
      })()`
    });

    console.log('Navigating to checkout...');
    await send('Page.navigate', { url: 'http://localhost:8080/checkout' });
    await new Promise(r => setTimeout(r, 2500));

    // Fill all form inputs and trigger submit to go to step 2
    console.log('Advancing to Step 2...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const setVal = (selector, val) => {
          const el = document.querySelector(selector);
          if (el) {
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };
        setVal('input[name="firstName"]', 'Nahid');
        setVal('input[name="lastName"]', 'Islam');
        setVal('input[name="phone"]', '01622530550');
        setVal('input[name="address"]', 'Rangamati Sadar');
        setVal('input[name="city"]', 'Rangamati');
        setVal('input[name="zipCode"]', '4500');

        const form = document.getElementById('checkout-form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/unslop_checkout_step2_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved unslop_checkout_step2_verified.png');

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
