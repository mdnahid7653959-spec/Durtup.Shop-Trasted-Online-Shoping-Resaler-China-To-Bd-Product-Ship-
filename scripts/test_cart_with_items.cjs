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
  const port = 9339;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-cart-test-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
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

    // 1. First navigate to homepage to set cart items in localStorage
    console.log('Navigating to homepage to seed cart item...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 2000));

    // Populate localStorage with test cart item to simulate user having added items
    await send('Runtime.evaluate', {
      expression: `(() => {
        const testCart = [
          {
            id: 'cart-item-1',
            product_id: 'ac0a83b2-e060-450f-aabe-6ef05e56eb31',
            quantity: 1,
            price: 1150,
            product: {
              id: 'ac0a83b2-e060-450f-aabe-6ef05e56eb31',
              name: 'X5 Full HD Mini WiFi IP Camera',
              slug: 'x5-full-hd-mini-wifi-ip-camera-ac0a83b2',
              price: 1150,
              regular_price: 1650,
              image: 'https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg'
            }
          }
        ];
        localStorage.setItem('megamart_cart', JSON.stringify(testCart));
        localStorage.setItem('durtup_cart', JSON.stringify(testCart));
      })()`
    });

    // 2. Navigate to /cart
    console.log('Navigating to http://localhost:8080/cart ...');
    await send('Page.navigate', { url: 'http://localhost:8080/cart' });
    await new Promise(r => setTimeout(r, 2500));

    // Check if error modal exists or if cart rendered properly
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const hasErrorModal = document.body.innerText.includes('সাময়িক বিভ্রাট দেখা দিয়েছে') || document.body.innerText.includes('getDirectImageUrl is not defined');
        const heading = document.querySelector('h1')?.textContent || '';
        const cartItemNames = Array.from(document.querySelectorAll('.font-medium')).map(el => el.textContent.trim()).filter(Boolean);
        const checkoutBtn = document.querySelector('button, a')?.textContent || '';
        return {
          hasErrorModal,
          heading,
          cartItemNames,
          bodySnippet: document.body.innerText.substring(0, 300)
        };
      })()`,
      returnByValue: true
    });

    console.log('Cart Page Audit Result:', JSON.stringify(evalRes.result?.value, null, 2));

    // Capture screenshot of cart page
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.resolve('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/cart_verified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot of cart page to:', shotPath);

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
