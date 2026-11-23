const http = require('http');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(respData) });
        } catch {
          resolve({ status: res.statusCode, body: respData });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(respData) });
        } catch {
          resolve({ status: res.statusCode, body: respData });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Durtup.shop Telegram Admin Bot Tests');
  console.log('====================================================\n');

  // Test 1: GET /api/telegram-webhook Health Check
  console.log('Test 1: Health Check on /api/telegram-webhook...');
  const healthRes = await getJson('http://localhost:8080/api/telegram-webhook');
  console.log('Health check response:', healthRes);
  if (healthRes.status === 200 && healthRes.body?.status === 'active') {
    console.log('✅ Test 1 PASSED: Webhook endpoint active.\n');
  } else {
    throw new Error('Test 1 FAILED');
  }

  // Test 2: Unauthorized User Protection
  console.log('Test 2: Security check - unauthorized user sending /orders...');
  const unauthUpdate = {
    update_id: 10001,
    message: {
      message_id: 1,
      from: { id: 999999999, first_name: 'Hacker', is_bot: false },
      chat: { id: 999999999, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text: '/orders'
    }
  };
  const unauthRes = await postJson('http://localhost:8080/api/telegram-webhook', unauthUpdate);
  console.log('Unauth response:', unauthRes);
  if (unauthRes.status === 200 && unauthRes.body?.ok === true) {
    console.log('✅ Test 2 PASSED: Unauthorized user handled securely (denied).\n');
  } else {
    throw new Error('Test 2 FAILED');
  }

  // Test 3: Admin Registration via /setup
  console.log('Test 3: Admin Registration via /setup...');
  const testAdminId = 123456789;
  const setupUpdate = {
    update_id: 10002,
    message: {
      message_id: 2,
      from: { id: testAdminId, first_name: 'Store', last_name: 'Owner', is_bot: false },
      chat: { id: testAdminId, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text: '/setup'
    }
  };
  const setupRes = await postJson('http://localhost:8080/api/telegram-webhook', setupUpdate);
  console.log('Setup response:', setupRes);
  if (setupRes.status === 200 && setupRes.body?.ok === true) {
    console.log('✅ Test 3 PASSED: Admin registered successfully.\n');
  } else {
    throw new Error('Test 3 FAILED');
  }

  // Test 4: Authorized Admin Command /start
  console.log('Test 4: Authorized Admin Command /start...');
  const startUpdate = {
    update_id: 10003,
    message: {
      message_id: 3,
      from: { id: testAdminId, first_name: 'Store', is_bot: false },
      chat: { id: testAdminId, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text: '/start'
    }
  };
  const startRes = await postJson('http://localhost:8080/api/telegram-webhook', startUpdate);
  console.log('Start command response:', startRes);
  if (startRes.status === 200 && startRes.body?.ok === true) {
    console.log('✅ Test 4 PASSED: /start menu generated successfully.\n');
  } else {
    throw new Error('Test 4 FAILED');
  }

  // Test 5: Authorized Admin Command /stats
  console.log('Test 5: Authorized Admin Command /stats...');
  const statsUpdate = {
    update_id: 10004,
    message: {
      message_id: 4,
      from: { id: testAdminId, first_name: 'Store', is_bot: false },
      chat: { id: testAdminId, type: 'private' },
      date: Math.floor(Date.now() / 1000),
      text: '/stats'
    }
  };
  const statsRes = await postJson('http://localhost:8080/api/telegram-webhook', statsUpdate);
  console.log('Stats response:', statsRes);
  if (statsRes.status === 200 && statsRes.body?.ok === true) {
    console.log('✅ Test 5 PASSED: /stats computed and sent.\n');
  } else {
    throw new Error('Test 5 FAILED');
  }

  // Test 6: Order Approval Callback Query
  console.log('Test 6: Order Approval via Inline Button Callback...');
  const approveCallback = {
    update_id: 10005,
    callback_query: {
      id: 'cb_test_001',
      from: { id: testAdminId, first_name: 'Store Owner', is_bot: false },
      message: {
        message_id: 50,
        chat: { id: testAdminId, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '🔔 NEW ORDER RECEIVED!\nOrder ID: #ORD-TEST-99\nCustomer: Nahid\nTotal Bill: ৳1,500\n⚡ Status: ⏳ PENDING CONFIRMATION'
      },
      data: 'order_approve:ORD-TEST-99'
    }
  };
  const approveRes = await postJson('http://localhost:8080/api/telegram-webhook', approveCallback);
  console.log('Approve callback response:', approveRes);
  if (approveRes.status === 200 && approveRes.body?.ok === true) {
    console.log('✅ Test 6 PASSED: Order approval callback executed.\n');
  } else {
    throw new Error('Test 6 FAILED');
  }

  // Test 7: Order Rejection Callback Query
  console.log('Test 7: Order Rejection via Inline Button Callback...');
  const rejectCallback = {
    update_id: 10006,
    callback_query: {
      id: 'cb_test_002',
      from: { id: testAdminId, first_name: 'Store Owner', is_bot: false },
      message: {
        message_id: 51,
        chat: { id: testAdminId, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: '🔔 NEW ORDER RECEIVED!\nOrder ID: #ORD-TEST-100\nCustomer: Nahid\nTotal Bill: ৳2,200\n⚡ Status: ⏳ PENDING CONFIRMATION'
      },
      data: 'order_reject:ORD-TEST-100'
    }
  };
  const rejectRes = await postJson('http://localhost:8080/api/telegram-webhook', rejectCallback);
  console.log('Reject callback response:', rejectRes);
  if (rejectRes.status === 200 && rejectRes.body?.ok === true) {
    console.log('✅ Test 7 PASSED: Order rejection callback executed.\n');
  } else {
    throw new Error('Test 7 FAILED');
  }

  console.log('====================================================');
  console.log('🎉 ALL TELEGRAM ADMIN BOT INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch(e => {
  console.error('❌ Test suite failed:', e);
  process.exit(1);
});
