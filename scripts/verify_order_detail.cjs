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
  const port = 9369;
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + path.join(os.tmpdir(), 'chrome-order-detail-' + Date.now()),
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

    console.log('Seeding order ORD-064942-1261 in localStorage...');
    await send('Page.navigate', { url: 'http://localhost:8080/' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const mockOrder = {
          id: 'ORD-064942-1261',
          order_number: 'ORD-064942-1261',
          status: 'pending',
          payment_status: 'pending',
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

    console.log('Navigating to /orders/ORD-064942-1261...');
    await send('Page.navigate', { url: 'http://localhost:8080/orders/ORD-064942-1261' });
    await new Promise(r => setTimeout(r, 3000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/unslop_order_detail_verified.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved unslop_order_detail_verified.png');

    ws.close();
  } finally {
    try { chromeProc.kill(); } catch {}
  }
})();
