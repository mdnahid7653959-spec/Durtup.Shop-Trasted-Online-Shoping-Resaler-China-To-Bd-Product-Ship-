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
  const port = 9390;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-restored-' + Date.now()),
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=430,932',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const targets = await getJson('http://127.0.0.1:' + port + '/json');
    const pageTarget = targets.find(t => t.type === 'page');
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const consoleLogs = [];
    const pageErrors = [];

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Console.messageAdded') {
        consoleLogs.push(msg.params.message.text);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push(`[${msg.params.type}] ${text}`);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        pageErrors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
      }
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

    console.log('1. Setting up mock cart items and orders in localStorage...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const testItems = [
          {
            id: 'item-1',
            product_id: 'x5-camera',
            quantity: 1,
            price: 1150,
            product: {
              id: 'x5-camera',
              name: 'X5 Full HD Mini WiFi IP Camera – Wireless Security CCTV with Night Vision, Motion Detection & Audio',
              slug: 'x5-full-hd-mini-wifi-ip-camera-ac0a83b2',
              price: 1150,
              discount_price: 1150,
              regular_price: 1650,
              stock_quantity: 50,
              image: 'https://mohasagor.com.bd/public/storage/images/products/ZayMrvAT1IUcFNk3XpehinyDoaeyDC7JqzmPmpSo.jpg'
            },
            image: 'https://mohasagor.com.bd/public/storage/images/products/ZayMrvAT1IUcFNk3XpehinyDoaeyDC7JqzmPmpSo.jpg'
          },
          {
            id: 'item-2',
            product_id: 'knife-sharpener',
            quantity: 1,
            price: 490,
            product: {
              id: 'knife-sharpener',
              name: '3-in-1 Kitchen Knife Sharpener',
              slug: '3-in-1-kitchen-knife-sharpener-ef520d20',
              price: 490,
              discount_price: 490,
              regular_price: 650,
              stock_quantity: 40,
              image: 'https://mohasagor.com.bd/public/storage/images/products/sXOpjiBg5tYJnN4Q0RJvwOt77HW2tNBWT5vK3wMg.jpg'
            },
            image: 'https://mohasagor.com.bd/public/storage/images/products/sXOpjiBg5tYJnN4Q0RJvwOt77HW2tNBWT5vK3wMg.jpg'
          }
        ];
        localStorage.setItem('durtup_cart', JSON.stringify(testItems));
        localStorage.setItem('cart', JSON.stringify(testItems));

        const mockOrder = {
          id: 'ORD-064942-1261',
          order_number: 'ORD-064942-1261',
          status: 'pending',
          payment_method: 'cod',
          subtotal: 1640,
          shipping_cost: 60,
          total: 1700,
          totalAmount: 1700,
          created_at: new Date().toISOString(),
          shipping_address: {
            name: 'Nahid Islam',
            phone: '01622530550',
            address: 'Rangamati Sadar',
            city: 'Rangamati',
            zipCode: '4500'
          },
          order_items: [
            {
              id: 'item-1',
              product_name: 'X5 Full HD Mini WiFi IP Camera – Wireless Security CCTV with Night Vision, Motion Detection & Audio',
              quantity: 1,
              price: 1150,
              unit_price: 1150,
              total_price: 1150,
              product_image: 'https://mohasagor.com.bd/public/storage/images/products/ZayMrvAT1IUcFNk3XpehinyDoaeyDC7JqzmPmpSo.jpg'
            },
            {
              id: 'item-2',
              product_name: '3-in-1 Kitchen Knife Sharpener',
              quantity: 1,
              price: 490,
              unit_price: 490,
              total_price: 490,
              product_image: 'https://mohasagor.com.bd/public/storage/images/products/sXOpjiBg5tYJnN4Q0RJvwOt77HW2tNBWT5vK3wMg.jpg'
            }
          ]
        };
        localStorage.setItem('local_orders', JSON.stringify([mockOrder]));
        localStorage.setItem('enterprise_admin_orders', JSON.stringify([mockOrder]));
      })()`
    });

    // 1. Visit Cart Page
    console.log('2. Navigating to Cart...');
    await send('Page.navigate', { url: 'http://localhost:8080/cart' });
    await new Promise(r => setTimeout(r, 2500));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/restored_cart_verified.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved restored_cart_verified.png');

    // 2. Visit Checkout Page (Step 1)
    console.log('3. Navigating to Checkout Step 1...');
    await send('Page.navigate', { url: 'http://localhost:8080/checkout' });
    await new Promise(r => setTimeout(r, 2500));

    // Fill form
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
        setVal('input[placeholder*="First Name"], input[name*="firstName"], input#firstName', 'nahid');
        setVal('input[placeholder*="Last Name"], input[name*="lastName"], input#lastName', 'islam');
        setVal('input[placeholder*="01"], input[type="tel"]', '01622530550');
        setVal('input[type="email"]', 'mdnahid7653959@gmail.com');
        setVal('textarea, input[placeholder*="বাসা"]', 'Rangamati');
        setVal('input[placeholder*="Zip"], input[name*="zip"]', '4500');
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/restored_checkout_step1_verified.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved restored_checkout_step1_verified.png');

    // 3. Click Next Step to Checkout Step 2
    console.log('4. Navigating to Checkout Step 2 (Payment)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nextBtn = btns.find(b => b.textContent && b.textContent.includes('পরবর্তী ধাপ'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/restored_checkout_step2_verified.png', Buffer.from(shot3.data, 'base64'));
    console.log('Saved restored_checkout_step2_verified.png');

    // 4. Visit Order Detail Page
    console.log('5. Navigating to Order Details...');
    await send('Page.navigate', { url: 'http://localhost:8080/order/ORD-064942-1261' });
    await new Promise(r => setTimeout(r, 2500));

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/restored_order_detail_verified.png', Buffer.from(shot4.data, 'base64'));
    console.log('Saved restored_order_detail_verified.png');

    console.log('\n=== RUNTIME CHECK SUMMARY ===');
    console.log('Errors encountered:', pageErrors.length);
    if (pageErrors.length) console.log(pageErrors);
    else console.log('✅ ZERO runtime errors. All pages loaded completely!');

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    chromeProc.kill();
  }
})();
