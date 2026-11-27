/**
 * scripts/telegram_bot_daemon.cjs
 * Real-time background Telegram Bot Polling Daemon for Durtup.shop.
 * Handles:
 * 1. Instant order approvals & rejections via interactive buttons.
 * 2. Automatic processing of direct message replies to order alerts (Reply-to-message: "approve", "confirm", "yes", "cancel", "reject", etc.).
 * 3. Text commands & natural language queries (Bengali & English: /pending, /orders, /stats, /search, /customer, /help).
 * 4. Direct order lookups by order number (#ORD-...) or customer phone number (01...).
 * 5. Intelligent conversational greeting and helpful guidance.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9052891455:AAEABwgEKbLVeCw1ZogwnUI_3LrPWGPuJGY';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/eshop-app-6119d/databases/(default)/documents';
const MASTER_ADMIN_ID = '8204855335';
let ADMIN_CHAT_IDS = ['8204855335'];
const STORE_NAME = 'Durtup.shop';
const STORE_URL = 'https://durtup.shop';

async function refreshAdminChatIds() {
  try {
    const doc = await fetchFirestore('/settings/telegram');
    const f = doc?.fields || {};
    const primary = f.chat_id?.stringValue;
    const list = f.admin_chat_ids?.arrayValue?.values?.map(v => v.stringValue).filter(Boolean) || [];
    const set = new Set(['8204855335']);
    if (primary) set.add(primary);
    list.forEach(id => set.add(id));
    ADMIN_CHAT_IDS = Array.from(set);
  } catch {}
}

// Cache catalog in memory for instant product searches
let cachedCatalog = null;
function getCatalog() {
  if (!cachedCatalog) {
    try {
      const catalogPath = path.join(__dirname, '..', 'public', 'mohasagor_catalog.json');
      if (fs.existsSync(catalogPath)) {
        cachedCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      }
    } catch (e) {
      cachedCatalog = [];
    }
  }
  return cachedCatalog || [];
}

function callTelegram(method, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ ok: false, error: 'JSON parse error', raw: body });
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`[Telegram Bot] Request error on ${method}:`, err.message);
      resolve({ ok: false, error: err.message });
    });

    req.write(data);
    req.end();
  });
}

function fetchFirestore(docPath) {
  return new Promise((resolve) => {
    const url = new URL(`${FIRESTORE_BASE}${docPath}`);
    https.get({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: { 'Accept': 'application/json' },
      timeout: 8000
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch { resolve(null); }
      });
    }).on('error', (err) => {
      console.warn('[Firestore fetch error]:', err.message);
      resolve(null);
    });
  });
}

function parseOrderDoc(doc) {
  if (!doc) return null;
  const f = doc.fields || {};
  const id = (doc.name || '').split('/').pop() || 'N/A';
  const orderNum = f.order_number?.stringValue || f.orderNumber?.stringValue || id;
  const total = f.total?.integerValue || f.total?.doubleValue || f.total_price?.integerValue || f.total_price?.doubleValue || 0;
  const status = (f.status?.stringValue || 'pending').toLowerCase();

  const shipMap = f.shipping_address?.mapValue?.fields || {};
  const name = f.customer_name?.stringValue || f.customerName?.stringValue || shipMap.name?.stringValue || [shipMap.firstName?.stringValue, shipMap.lastName?.stringValue].filter(Boolean).join(' ') || 'Customer';
  const phone = f.phone?.stringValue || f.customer_phone?.stringValue || shipMap.phone?.stringValue || 'N/A';
  const address = f.address?.stringValue || shipMap.address?.stringValue || [shipMap.address?.stringValue, shipMap.city?.stringValue].filter(Boolean).join(', ') || 'N/A';
  const paymentMethod = f.payment_method?.stringValue || f.paymentMethod?.stringValue || 'COD';
  const createdAt = f.created_at?.stringValue || f.createdAt?.stringValue || new Date().toISOString();

  let items = [];
  if (f.items?.arrayValue?.values) {
    items = f.items.arrayValue.values.map(v => {
      const im = v.mapValue?.fields || {};
      return {
        name: im.name?.stringValue || im.product_name?.stringValue || 'Product',
        quantity: im.quantity?.integerValue || im.qty?.integerValue || 1,
        price: im.price?.integerValue || im.price?.doubleValue || 0
      };
    });
  }

  return { id, orderNum, total: Number(total), status, name, phone, address, paymentMethod, createdAt, items };
}

function buildOrderActionKeyboard(orderNum, status = 'pending', paymentStatus = 'pending', phone = '') {
  const normStatus = (status || 'pending').toLowerCase();
  const normPayment = (paymentStatus || 'pending').toLowerCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('880') ? cleanPhone : (cleanPhone.startsWith('0') ? `88${cleanPhone}` : `880${cleanPhone}`);

  const keyboard = [];

  // Row 1: Primary Lifecycle Transitions
  if (normStatus === 'pending') {
    keyboard.push([
      { text: '✅ APPROVE ORDER', callback_data: `order_approve:${orderNum}` },
      { text: '🚚 MARK SHIPPED', callback_data: `order_ship:${orderNum}` }
    ]);
    keyboard.push([
      { text: '🎉 MARK DELIVERED', callback_data: `order_deliver:${orderNum}` },
      { text: '❌ CANCEL ORDER', callback_data: `order_reject:${orderNum}` }
    ]);
  } else if (normStatus === 'confirmed' || normStatus === 'processing') {
    keyboard.push([
      { text: '🚚 MARK SHIPPED', callback_data: `order_ship:${orderNum}` },
      { text: '🎉 MARK DELIVERED', callback_data: `order_deliver:${orderNum}` }
    ]);
    keyboard.push([
      { text: '⚙️ Processing (Active)', callback_data: `order_noop:${orderNum}` },
      { text: '❌ CANCEL ORDER', callback_data: `order_reject:${orderNum}` }
    ]);
  } else if (normStatus === 'shipped') {
    keyboard.push([
      { text: '🎉 MARK DELIVERED', callback_data: `order_deliver:${orderNum}` },
      { text: '↩️ MARK REFUNDED', callback_data: `order_refund:${orderNum}` }
    ]);
    keyboard.push([
      { text: '🚚 Shipped (In Transit)', callback_data: `order_noop:${orderNum}` },
      { text: '❌ CANCEL ORDER', callback_data: `order_reject:${orderNum}` }
    ]);
  } else if (normStatus === 'delivered') {
    keyboard.push([
      { text: '🟢 DELIVERED / COMPLETED', callback_data: `order_noop:${orderNum}` },
      { text: '↩️ MARK REFUNDED', callback_data: `order_refund:${orderNum}` }
    ]);
  } else if (normStatus === 'cancelled') {
    keyboard.push([
      { text: '🔴 CANCELLED / REJECTED', callback_data: `order_noop:${orderNum}` },
      { text: '🔄 REOPEN (PENDING)', callback_data: `order_pending:${orderNum}` }
    ]);
  } else {
    keyboard.push([
      { text: '✅ APPROVE', callback_data: `order_approve:${orderNum}` },
      { text: '🚚 SHIP', callback_data: `order_ship:${orderNum}` },
      { text: '🎉 DELIVER', callback_data: `order_deliver:${orderNum}` }
    ]);
  }

  // Row 2: Payment Management Action
  const payRow = [];
  if (normPayment === 'paid') {
    payRow.push({ text: '💵 PAID ✅', callback_data: `order_noop:${orderNum}` });
    payRow.push({ text: '↩️ Mark Unpaid', callback_data: `order_unpaid:${orderNum}` });
  } else {
    payRow.push({ text: '💵 MARK AS PAID', callback_data: `order_paid:${orderNum}` });
  }
  keyboard.push(payRow);

  // Row 3: Communication & Store Admin Links
  const linksRow = [];
  if (cleanPhone && cleanPhone.length >= 10) {
    linksRow.push({ text: '💬 WhatsApp', url: `https://wa.me/${waPhone}` });
  }
  linksRow.push({ text: '🌐 View in Admin', url: `${STORE_URL}/admin/orders?id=${orderNum}` });
  keyboard.push(linksRow);

  return { inline_keyboard: keyboard };
}

function escapeTgHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTelegramOrderCard(ord) {
  const itemsText = ord.items.length > 0
    ? ord.items.map((it, idx) => `  ▫️ <b>Item #${idx + 1}:</b> ${escapeTgHtml(it.name)} (x${it.quantity}) - ৳${it.price.toLocaleString()}`).join('\n')
    : '  • Ordered Product Item';

  const statusEmojiMap = {
    pending: '⏳',
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '🟢',
    cancelled: '❌',
    refunded: '↩️'
  };
  const statusEmoji = statusEmojiMap[ord.status] || '⏳';
  const statusLabel = ord.status.toUpperCase();
  const paymentStatus = ord.paymentStatus || (ord.status === 'delivered' ? 'paid' : 'pending');

  const text = `🔔 <b>NEW ORDER RECEIVED!</b> 🎉\n━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>Order ID:</b> <code>#${escapeTgHtml(ord.orderNum)}</code>\n` +
    `👤 <b>Customer:</b> <b>${escapeTgHtml(ord.name)}</b>\n` +
    `📞 <b>Phone:</b> <code>${escapeTgHtml(ord.phone)}</code>\n` +
    `📍 <b>Address:</b> ${escapeTgHtml(ord.address)}\n` +
    `💳 <b>Payment Method:</b> <b>${escapeTgHtml(ord.paymentMethod.toUpperCase())}</b>\n` +
    `⚡ <b>Status:</b> ${statusEmoji} <b>${statusLabel}</b>\n` +
    `💵 <b>Payment Status:</b> ${paymentStatus === 'paid' ? '💵 <b>PAID</b>' : '⏳ <b>PENDING</b>'}\n\n` +
    `🛒 <b>Ordered Items:</b>\n${itemsText}\n\n` +
    `💰 <b>Total Amount:</b> <b>৳${ord.total.toLocaleString()}</b>`;

  const reply_markup = buildOrderActionKeyboard(ord.orderNum, ord.status, paymentStatus, ord.phone);

  return { text, reply_markup };
}

async function updateOrderStatus(orderIdentifier, status, adminId, adminName, paymentStatus = null) {
  const cleanId = orderIdentifier.replace(/^#/, '').trim();
  const nowIso = new Date().toISOString();
  const statusFields = {
    updated_at: { stringValue: nowIso },
    updated_by_telegram: { stringValue: String(adminId) },
    updated_by_name: { stringValue: String(adminName) }
  };

  if (status) {
    statusFields.status = { stringValue: status };
    if (status === 'confirmed' || status === 'processing') {
      statusFields.confirmed_at = { stringValue: nowIso };
      statusFields.approved_by_telegram = { stringValue: String(adminId) };
      statusFields.approved_by_name = { stringValue: String(adminName) };
    } else if (status === 'shipped') {
      statusFields.shipped_at = { stringValue: nowIso };
      statusFields.shipped_by_telegram = { stringValue: String(adminId) };
    } else if (status === 'delivered') {
      statusFields.delivered_at = { stringValue: nowIso };
      statusFields.delivered_by_telegram = { stringValue: String(adminId) };
      if (!paymentStatus) {
        statusFields.payment_status = { stringValue: 'paid' };
        statusFields.paid_at = { stringValue: nowIso };
      }
    } else if (status === 'cancelled') {
      statusFields.cancelled_at = { stringValue: nowIso };
      statusFields.cancelled_by_telegram = { stringValue: String(adminId) };
    } else if (status === 'refunded') {
      statusFields.refunded_at = { stringValue: nowIso };
      statusFields.payment_status = { stringValue: 'refunded' };
    }
  }

  if (paymentStatus) {
    statusFields.payment_status = { stringValue: paymentStatus };
    if (paymentStatus === 'paid') {
      statusFields.paid_at = { stringValue: nowIso };
      statusFields.payment_verified_by_telegram = { stringValue: String(adminId) };
    }
  }

  const mask = Object.keys(statusFields).map(k => 'updateMask.fieldPaths=' + k).join('&');

  // 1. Direct PATCH by cleanId
  try {
    const patchUrl = `${FIRESTORE_BASE}/orders/${cleanId}?${mask}`;
    const patchData = JSON.stringify({ fields: statusFields });
    await new Promise((resolve) => {
      const u = new URL(patchUrl);
      const req = https.request({
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(patchData) },
        timeout: 5000
      }, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => resolve(b));
      });
      req.on('error', () => resolve(null));
      req.write(patchData);
      req.end();
    });
  } catch (e) {
    console.warn('[Telegram Bot] Direct PATCH catch:', e.message);
  }

  // 2. Query Firestore by order_number to patch all instances (both ORD- and ord_)
  try {
    const qData = JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'orders' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'order_number' },
            op: 'EQUAL',
            value: { stringValue: cleanId }
          }
        }
      }
    });

    const qRes = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'firestore.googleapis.com',
        port: 443,
        path: '/v1/projects/eshop-app-6119d/databases/(default)/documents:runQuery',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(qData) },
        timeout: 5000
      }, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          try { resolve(JSON.parse(b)); } catch { resolve([]); }
        });
      });
      req.on('error', () => resolve([]));
      req.write(qData);
      req.end();
    });

    if (Array.isArray(qRes)) {
      for (const item of qRes) {
        if (item.document?.name) {
          const docPath = item.document.name;
          const patchUrl = `https://firestore.googleapis.com/v1/${docPath}?${mask}`;
          const patchBody = JSON.stringify({ fields: statusFields });
          await new Promise((resolve) => {
            const u = new URL(patchUrl);
            const req = https.request({
              hostname: u.hostname,
              port: 443,
              path: u.pathname + u.search,
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(patchBody) },
              timeout: 5000
            }, (res) => {
              res.on('data', () => {});
              res.on('end', resolve);
            });
            req.on('error', () => resolve(null));
            req.write(patchBody);
            req.end();
          });
        }
      }
    }
  } catch (e) {
    console.warn('[Telegram Bot] Query PATCH catch:', e.message);
  }
}

async function updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, newStatus, newPaymentStatus, adminName, adminId) {
  if (!chatId || !messageId) return;

  const statusBadgeMap = {
    pending: '⏳ <b>PENDING REVIEW</b>',
    confirmed: '⚙️ <b>CONFIRMED / PROCESSING</b>',
    processing: '⚙️ <b>PROCESSING</b>',
    shipped: '🚚 <b>SHIPPED / IN TRANSIT</b>',
    delivered: '🟢 <b>DELIVERED / COMPLETED</b>',
    cancelled: '🔴 <b>CANCELLED / REJECTED</b>',
    refunded: '↩️ <b>REFUNDED</b>'
  };

  let updatedText = originalText || '';

  if (newStatus && statusBadgeMap[newStatus]) {
    const replacement = `⚡ <b>Status:</b> ${statusBadgeMap[newStatus]}\n👤 <b>Updated By:</b> ${adminName} (${adminId})\n`;
    if (/⚡ Status:.*\n?/i.test(updatedText)) {
      updatedText = updatedText.replace(/⚡ Status:.*\n?/i, replacement);
    } else {
      updatedText += `\n${replacement}`;
    }
  }

  if (newPaymentStatus === 'paid') {
    const payReplacement = `💳 <b>Payment:</b> 💵 <b>PAID & VERIFIED</b> (by ${adminName})\n`;
    if (/💳 Payment:.*\n?/i.test(updatedText)) {
      updatedText = updatedText.replace(/💳 Payment:.*\n?/i, payReplacement);
    } else {
      updatedText += `\n${payReplacement}`;
    }
  } else if (newPaymentStatus === 'pending') {
    const payReplacement = `💳 <b>Payment:</b> ⏳ <b>PENDING / UNPAID</b>\n`;
    if (/💳 Payment:.*\n?/i.test(updatedText)) {
      updatedText = updatedText.replace(/💳 Payment:.*\n?/i, payReplacement);
    }
  }

  // Extract customer phone if present in text
  const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
  const phone = phoneMatch ? phoneMatch[1] : '';

  const keyboard = buildOrderActionKeyboard(orderNum, newStatus || 'pending', newPaymentStatus || 'pending', phone);

  await callTelegram('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: updatedText,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

// Helper: Check intent
function isApproveIntent(text) {
  const t = text.toLowerCase().trim();
  return (
    t.includes('approve') ||
    t.includes('confirm') ||
    t.includes('yes') ||
    t.includes('ok') ||
    t.includes('done') ||
    t.includes('অ্যাপ্রুভ') ||
    t.includes('কনফার্ম') ||
    t.includes('হ্যাঁ') ||
    t.includes('হয়েছে') ||
    t.includes('পাঠিয়ে দাও') ||
    t.includes('ঠিক আছে') ||
    t === 'y' ||
    t === '1' ||
    t === '👍' ||
    t === '✅'
  );
}

function isRejectIntent(text) {
  const t = text.toLowerCase().trim();
  return (
    t.includes('reject') ||
    t.includes('cancel') ||
    t.includes('no') ||
    t.includes('বাতিল') ||
    t.includes('ক্যান্সেল') ||
    t.includes('না') ||
    t.includes('বাদ') ||
    t.includes('ভুয়া') ||
    t === 'n' ||
    t === '0' ||
    t === '❌' ||
    t === '👎'
  );
}

function isShipIntent(text) {
  const t = text.toLowerCase().trim();
  return (
    t.includes('ship') ||
    t.includes('shipped') ||
    t.includes('dispatch') ||
    t.includes('dispatched') ||
    t.includes('courier') ||
    t.includes('পাঠিয়ে') ||
    t.includes('কুরিয়ার') ||
    t.includes('শিপ') ||
    t.includes('শিপড') ||
    t === '2' ||
    t === '🚚'
  );
}

function isDeliverIntent(text) {
  const t = text.toLowerCase().trim();
  return (
    t.includes('deliver') ||
    t.includes('delivered') ||
    t.includes('completed') ||
    t.includes('ডেলিভারি') ||
    t.includes('ডেলিভার্ড') ||
    t.includes('পৌঁছেছে') ||
    t.includes('সম্পন্ন') ||
    t === '3' ||
    t === '📦' ||
    t === '🎉'
  );
}

function isPaidIntent(text) {
  const t = text.toLowerCase().trim();
  return (
    t.includes('paid') ||
    t.includes('payment received') ||
    t.includes('টাকা পেয়েছি') ||
    t.includes('পেইড') ||
    t.includes('পরিশোধ') ||
    t === '💵' ||
    t === '💰'
  );
}

function isRefundIntent(text) {
  const t = text.toLowerCase().trim();
  return (
    t.includes('refund') ||
    t.includes('refunded') ||
    t.includes('রিফান্ড') ||
    t.includes('টাকা ফেরত') ||
    t === '↩️'
  );
}

function getMainAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '⏳ পেন্ডিং অর্ডার (Pending)', callback_data: 'cmd_pending' },
        { text: '📊 বিক্রির হিসাব (Stats)', callback_data: 'cmd_stats' }
      ],
      [
        { text: '📦 সাম্প্রতিক অর্ডারসমূহ', callback_data: 'cmd_orders' },
        { text: '🌐 ওয়েব অ্যাডমিন প্যানেল', url: `${STORE_URL}/admin/orders` }
      ]
    ]
  };
}

async function handleCallbackQuery(cb) {
  const cbId = cb.id;
  const data = (cb.data || '').trim();
  const fromId = String(cb.from?.id || '');
  const fromName = cb.from?.first_name || 'Admin';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const originalText = cb.message?.text || '';

  console.log(`[Telegram Bot] Inbound CallbackQuery: "${data}" from ${fromName} (${fromId})`);

  // 1. APPROVE / PROCESS
  if (data.startsWith('order_approve:')) {
    const orderNum = data.replace('order_approve:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing APPROVAL for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'confirmed', fromId, fromName);

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `✅ অর্ডার #${orderNum} সফলভাবে অ্যাপ্রুভ / কনফার্ম হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, 'confirmed', null, fromName, fromId);
    console.log(`[Telegram Bot] Order #${orderNum} approved and updated with full action buttons!`);
    return;
  }

  // 2. MARK SHIPPED
  if (data.startsWith('order_ship:')) {
    const orderNum = data.replace('order_ship:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing SHIPMENT for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'shipped', fromId, fromName);

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `🚚 অর্ডার #${orderNum} সফলভাবে SHIPPED মার্ক করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, 'shipped', null, fromName, fromId);
    console.log(`[Telegram Bot] Order #${orderNum} shipped and updated!`);
    return;
  }

  // 3. MARK DELIVERED
  if (data.startsWith('order_deliver:')) {
    const orderNum = data.replace('order_deliver:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing DELIVERY for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'delivered', fromId, fromName, 'paid');

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `🎉 অর্ডার #${orderNum} সফলভাবে DELIVERED মার্ক করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, 'delivered', 'paid', fromName, fromId);
    console.log(`[Telegram Bot] Order #${orderNum} delivered and updated!`);
    return;
  }

  // 4. MARK AS PAID
  if (data.startsWith('order_paid:')) {
    const orderNum = data.replace('order_paid:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Marking payment as PAID for order #${orderNum}...`);

    await updateOrderStatus(orderNum, null, fromId, fromName, 'paid');

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `💵 অর্ডার #${orderNum} এর পেমেন্ট PAID হিসেবে ভেরিফাই করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, null, 'paid', fromName, fromId);
    console.log(`[Telegram Bot] Order #${orderNum} payment marked as PAID!`);
    return;
  }

  // 5. MARK AS UNPAID
  if (data.startsWith('order_unpaid:')) {
    const orderNum = data.replace('order_unpaid:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Marking payment as UNPAID for order #${orderNum}...`);

    await updateOrderStatus(orderNum, null, fromId, fromName, 'pending');

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `⏳ অর্ডার #${orderNum} এর পেমেন্ট UNPAID করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, null, 'pending', fromName, fromId);
    return;
  }

  // 6. CANCEL / REJECT
  if (data.startsWith('order_reject:') || data.startsWith('order_cancel:')) {
    const orderNum = data.replace(/^(order_reject:|order_cancel:)/, '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing REJECTION for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'cancelled', fromId, fromName);

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `❌ অর্ডার #${orderNum} বাতিল (Cancelled) করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, 'cancelled', null, fromName, fromId);
    console.log(`[Telegram Bot] Order #${orderNum} cancelled and message updated!`);
    return;
  }

  // 7. MARK REFUNDED
  if (data.startsWith('order_refund:')) {
    const orderNum = data.replace('order_refund:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing REFUND for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'refunded', fromId, fromName, 'refunded');

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `↩️ অর্ডার #${orderNum} রিফান্ড (Refunded) মার্ক করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, 'refunded', 'refunded', fromName, fromId);
    return;
  }

  // 8. REOPEN AS PENDING
  if (data.startsWith('order_pending:')) {
    const orderNum = data.replace('order_pending:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Reopening order #${orderNum} as PENDING...`);

    await updateOrderStatus(orderNum, 'pending', fromId, fromName);

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `⏳ অর্ডার #${orderNum} পুনরায় PENDING করা হয়েছে!`,
      show_alert: false
    });

    await updateTelegramOrderMessage(chatId, messageId, originalText, orderNum, 'pending', null, fromName, fromId);
    return;
  }

  // 9. NO-OP (Current status button tap)
  if (data.startsWith('order_noop:')) {
    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `অর্ডারটি ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।`,
      show_alert: false
    });
    return;
  }

  if (data === 'cmd_pending') {
    await callTelegram('answerCallbackQuery', { callback_query_id: cbId, text: 'Fetching pending orders...' });
    await sendPendingOrders(chatId);
    return;
  }

  if (data === 'cmd_stats') {
    await callTelegram('answerCallbackQuery', { callback_query_id: cbId, text: 'Calculating statistics...' });
    await sendStoreStats(chatId);
    return;
  }

  if (data === 'cmd_orders') {
    await callTelegram('answerCallbackQuery', { callback_query_id: cbId, text: 'Fetching recent orders...' });
    await sendRecentOrders(chatId);
    return;
  }

  // Fallback answer callback
  await callTelegram('answerCallbackQuery', { callback_query_id: cbId, text: 'Action received.' });
}

async function sendPendingOrders(chatId) {
  const res = await fetchFirestore('/orders?pageSize=30');
  const docs = res?.documents || [];
  const pendingOrders = docs
    .map(parseOrderDoc)
    .filter(o => o && o.status === 'pending');

  if (pendingOrders.length === 0) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `📦 <b>পেন্ডিং অর্ডার তালিকা:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n✨ <i>বর্তমানে কোনো পেন্ডিং অর্ডার নেই। সকল অর্ডার অ্যাপ্রুভড!</i>`,
      parse_mode: 'HTML',
      reply_markup: getMainAdminKeyboard()
    });
    return;
  }

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: `⏳ <b>মোট ${pendingOrders.length}টি পেন্ডিং অর্ডার অপেক্ষায় রয়েছে:</b>\n━━━━━━━━━━━━━━━━━━━━━━\nনিচের অর্ডারগুলো যাচাই করে সরাসরি অ্যাপ্রুভ বা রিজেক্ট করুন:`,
    parse_mode: 'HTML'
  });

  for (const ord of pendingOrders.slice(0, 5)) {
    const card = formatTelegramOrderCard(ord);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: card.text,
      parse_mode: 'HTML',
      reply_markup: card.reply_markup
    });
  }
}

async function sendRecentOrders(chatId) {
  const res = await fetchFirestore('/orders?pageSize=15');
  const docs = res?.documents || [];
  const orders = docs.map(parseOrderDoc).filter(Boolean);

  if (orders.length === 0) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `📦 কোনো অর্ডার পাওয়া যায়নি।`,
      parse_mode: 'HTML',
      reply_markup: getMainAdminKeyboard()
    });
    return;
  }

  let text = `📦 <b>সাম্প্রতিক অর্ডারসমূহ (${orders.length}):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  orders.slice(0, 8).forEach(o => {
    const statusEmoji = o.status === 'confirmed' ? '✅' : o.status === 'cancelled' ? '❌' : '⏳';
    text += `• <b>#${o.orderNum}</b> - ৳${o.total.toLocaleString()} (${statusEmoji} ${o.status.toUpperCase()})\n  👤 ${o.name} | 📞 <code>${o.phone}</code>\n\n`;
  });

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⏳ শুধু পেন্ডিং অর্ডার দেখুন', callback_data: 'cmd_pending' },
          { text: '🌐 ওয়েব প্যানেলে দেখুন', url: `${STORE_URL}/admin/orders` }
        ]
      ]
    }
  });
}

async function sendStoreStats(chatId) {
  const res = await fetchFirestore('/orders?pageSize=100');
  const docs = res?.documents || [];
  const orders = docs.map(parseOrderDoc).filter(Boolean);

  let totalOrders = orders.length;
  let confirmed = 0;
  let pending = 0;
  let cancelled = 0;
  let totalRevenue = 0;

  orders.forEach(o => {
    if (o.status === 'confirmed' || o.status === 'delivered' || o.status === 'shipped') {
      confirmed++;
      totalRevenue += o.total;
    } else if (o.status === 'pending') {
      pending++;
    } else if (o.status === 'cancelled') {
      cancelled++;
    }
  });

  const text = `📊 <b>DURTUP.SHOP সেলস ও অর্ডার অ্যানালিটিক্স</b>\n━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>মোট অর্ডার:</b> ${totalOrders} টি\n` +
    `✅ <b>কনফার্মড / সফল অর্ডার:</b> ${confirmed} টি\n` +
    `⏳ <b>পেন্ডিং অর্ডার:</b> ${pending} টি\n` +
    `❌ <b>বাতিল অর্ডার:</b> ${cancelled} টি\n` +
    `💰 <b>ভেরিফাইড সেলস ভলিউম:</b> ৳${totalRevenue.toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>রিয়েল-টাইম ডাটা আপডেট সম্পন্ন।</i>`;

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: getMainAdminKeyboard()
  });
}

async function handleMessage(msg) {
  const text = (msg.text || '').trim();
  const lowerText = text.toLowerCase();
  const chatId = msg.chat?.id;
  const fromId = String(msg.from?.id || '');
  const fromName = msg.from?.first_name || 'Admin';

  if (!text) return;

  console.log(`[Telegram Bot] Inbound Message from ${fromName} (${fromId}): "${text}"`);

  // =========================================================================
  // 1. HANDLE DIRECT REPLIES TO MESSAGES (Reply-to-message feature)
  // =========================================================================
  if (msg.reply_to_message) {
    const parentText = msg.reply_to_message.text || '';
    // Extract Order ID from the parent message
    const orderMatch = parentText.match(/#(ORD-[\w-]+)/i) ||
                       parentText.match(/\b(ORD-[\w-]+)\b/i) ||
                       parentText.match(/Order ID:\s*#?([A-Za-z0-9_-]+)/i) ||
                       parentText.match(/Order Number:\s*#?([A-Za-z0-9_-]+)/i);

    if (orderMatch) {
      const orderNum = orderMatch[1].replace(/^#/, '').trim();

      // 1. Check if user replied with an approval intent
      if (isApproveIntent(lowerText)) {
        await updateOrderStatus(orderNum, 'confirmed', fromId, fromName);
        const origChatId = msg.reply_to_message.chat?.id;
        const origMsgId = msg.reply_to_message.message_id;
        if (origChatId && origMsgId) {
          await updateTelegramOrderMessage(origChatId, origMsgId, parentText, orderNum, 'confirmed', null, fromName, fromId);
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          reply_to_message_id: msg.message_id,
          text: `✅ <b>অর্ডার #${orderNum} সফলভাবে অ্যাপ্রুভ ও কনফার্ম করা হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>অনুমোদনকারী:</b> ${fromName} (${fromId})\n⚡ <b>স্ট্যাটাস:</b> ⚙️ <b>CONFIRMED / PROCESSING</b>`,
          parse_mode: 'HTML',
          reply_markup: buildOrderActionKeyboard(orderNum, 'confirmed', 'pending')
        });
        return;
      }

      // 2. Check if user replied with a shipping intent
      if (isShipIntent(lowerText)) {
        await updateOrderStatus(orderNum, 'shipped', fromId, fromName);
        const origChatId = msg.reply_to_message.chat?.id;
        const origMsgId = msg.reply_to_message.message_id;
        if (origChatId && origMsgId) {
          await updateTelegramOrderMessage(origChatId, origMsgId, parentText, orderNum, 'shipped', null, fromName, fromId);
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          reply_to_message_id: msg.message_id,
          text: `🚚 <b>অর্ডার #${orderNum} সফলভাবে SHIPPED মার্ক করা হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>শিপমেন্টকারী:</b> ${fromName} (${fromId})\n⚡ <b>স্ট্যাটাস:</b> 🚚 <b>SHIPPED / IN TRANSIT</b>`,
          parse_mode: 'HTML',
          reply_markup: buildOrderActionKeyboard(orderNum, 'shipped', 'pending')
        });
        return;
      }

      // 3. Check if user replied with a delivery intent
      if (isDeliverIntent(lowerText)) {
        await updateOrderStatus(orderNum, 'delivered', fromId, fromName, 'paid');
        const origChatId = msg.reply_to_message.chat?.id;
        const origMsgId = msg.reply_to_message.message_id;
        if (origChatId && origMsgId) {
          await updateTelegramOrderMessage(origChatId, origMsgId, parentText, orderNum, 'delivered', 'paid', fromName, fromId);
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          reply_to_message_id: msg.message_id,
          text: `🎉 <b>অর্ডার #${orderNum} সফলভাবে DELIVERED মার্ক করা হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>ডেলিভারিকারক:</b> ${fromName} (${fromId})\n⚡ <b>স্ট্যাটাস:</b> 🟢 <b>DELIVERED</b> | 💵 <b>PAID</b>`,
          parse_mode: 'HTML',
          reply_markup: buildOrderActionKeyboard(orderNum, 'delivered', 'paid')
        });
        return;
      }

      // 4. Check if user replied with a payment intent
      if (isPaidIntent(lowerText)) {
        await updateOrderStatus(orderNum, null, fromId, fromName, 'paid');
        const origChatId = msg.reply_to_message.chat?.id;
        const origMsgId = msg.reply_to_message.message_id;
        if (origChatId && origMsgId) {
          await updateTelegramOrderMessage(origChatId, origMsgId, parentText, orderNum, null, 'paid', fromName, fromId);
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          reply_to_message_id: msg.message_id,
          text: `💵 <b>অর্ডার #${orderNum} এর পেমেন্ট PAID হিসেবে ভেরিফাই হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>ভেরিফাইকারী:</b> ${fromName} (${fromId})`,
          parse_mode: 'HTML',
          reply_markup: buildOrderActionKeyboard(orderNum, 'confirmed', 'paid')
        });
        return;
      }

      // 5. Check if user replied with a rejection intent
      if (isRejectIntent(lowerText)) {
        await updateOrderStatus(orderNum, 'cancelled', fromId, fromName);
        const origChatId = msg.reply_to_message.chat?.id;
        const origMsgId = msg.reply_to_message.message_id;
        if (origChatId && origMsgId) {
          await updateTelegramOrderMessage(origChatId, origMsgId, parentText, orderNum, 'cancelled', null, fromName, fromId);
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          reply_to_message_id: msg.message_id,
          text: `❌ <b>অর্ডার #${orderNum} বাতিল (Cancelled) করা হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>বাতিলকারী:</b> ${fromName} (${fromId})\n⚡ <b>স্ট্যাটাস:</b> 🔴 <b>CANCELLED</b>`,
          parse_mode: 'HTML',
          reply_markup: buildOrderActionKeyboard(orderNum, 'cancelled', 'pending')
        });
        return;
      }

      // 6. Check if user replied with a refund intent
      if (isRefundIntent(lowerText)) {
        await updateOrderStatus(orderNum, 'refunded', fromId, fromName, 'refunded');
        const origChatId = msg.reply_to_message.chat?.id;
        const origMsgId = msg.reply_to_message.message_id;
        if (origChatId && origMsgId) {
          await updateTelegramOrderMessage(origChatId, origMsgId, parentText, orderNum, 'refunded', 'refunded', fromName, fromId);
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          reply_to_message_id: msg.message_id,
          text: `↩️ <b>অর্ডার #${orderNum} রিফান্ড (Refunded) করা হয়েছে!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👤 <b>রিফান্ডকারী:</b> ${fromName} (${fromId})`,
          parse_mode: 'HTML',
          reply_markup: buildOrderActionKeyboard(orderNum, 'refunded', 'refunded')
        });
        return;
      }

      // If user typed notes or remarks
      await callTelegram('sendMessage', {
        chat_id: chatId,
        reply_to_message_id: msg.message_id,
        text: `📝 <b>অর্ডার #${orderNum} এর জন্য নোট:</b>\n<i>"${text}"</i>\n\nঅর্ডারটি পরিচালনা করতে নিচের বাটন ব্যবহার করুন অথবা <b>Approve</b>, <b>Ship</b>, <b>Deliver</b>, <b>Paid</b>, <b>Reject</b> লিখুন:`,
        parse_mode: 'HTML',
        reply_markup: buildOrderActionKeyboard(orderNum, 'pending', 'pending')
      });
      return;
    }
  }

  // =========================================================================
  // 2. TEXT-BASED ORDER LIFECYCLE COMMANDS (approve, ship, deliver, paid, cancel)
  // =========================================================================
  const explicitApproveMatch = lowerText.match(/^(?:\/approve|approve|confirm|অ্যাপ্রুভ|কনফার্ম)\s+#?(ord-[\w-]+|\d[\w-]+)/i);
  if (explicitApproveMatch) {
    const ordId = explicitApproveMatch[1].replace(/^#/, '').trim();
    await updateOrderStatus(ordId, 'confirmed', fromId, fromName);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      reply_to_message_id: msg.message_id,
      text: `✅ <b>অর্ডার #${ordId} সফলভাবে অ্যাপ্রুভ ও কনফার্ম করা হয়েছে!</b>\n👤 <b>Approved by:</b> ${fromName} (${fromId})`,
      parse_mode: 'HTML',
      reply_markup: buildOrderActionKeyboard(ordId, 'confirmed', 'pending')
    });
    return;
  }

  const explicitShipMatch = lowerText.match(/^(?:\/ship|ship|shipped|শিপ|কুরিয়ার|পাঠাও)\s+#?(ord-[\w-]+|\d[\w-]+)/i);
  if (explicitShipMatch) {
    const ordId = explicitShipMatch[1].replace(/^#/, '').trim();
    await updateOrderStatus(ordId, 'shipped', fromId, fromName);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      reply_to_message_id: msg.message_id,
      text: `🚚 <b>অর্ডার #${ordId} সফলভাবে SHIPPED মার্ক করা হয়েছে!</b>\n👤 <b>Shipped by:</b> ${fromName} (${fromId})`,
      parse_mode: 'HTML',
      reply_markup: buildOrderActionKeyboard(ordId, 'shipped', 'pending')
    });
    return;
  }

  const explicitDeliverMatch = lowerText.match(/^(?:\/deliver|deliver|delivered|ডেলিভারি|পৌঁছেছে)\s+#?(ord-[\w-]+|\d[\w-]+)/i);
  if (explicitDeliverMatch) {
    const ordId = explicitDeliverMatch[1].replace(/^#/, '').trim();
    await updateOrderStatus(ordId, 'delivered', fromId, fromName, 'paid');
    await callTelegram('sendMessage', {
      chat_id: chatId,
      reply_to_message_id: msg.message_id,
      text: `🎉 <b>অর্ডার #${ordId} সফলভাবে DELIVERED মার্ক করা হয়েছে!</b>\n👤 <b>Delivered by:</b> ${fromName} (${fromId})\n💵 <b>Payment:</b> 💵 PAID`,
      parse_mode: 'HTML',
      reply_markup: buildOrderActionKeyboard(ordId, 'delivered', 'paid')
    });
    return;
  }

  const explicitPaidMatch = lowerText.match(/^(?:\/paid|paid|pay|টাকা পেয়েছি|পেইড)\s+#?(ord-[\w-]+|\d[\w-]+)/i);
  if (explicitPaidMatch) {
    const ordId = explicitPaidMatch[1].replace(/^#/, '').trim();
    await updateOrderStatus(ordId, null, fromId, fromName, 'paid');
    await callTelegram('sendMessage', {
      chat_id: chatId,
      reply_to_message_id: msg.message_id,
      text: `💵 <b>অর্ডার #${ordId} এর পেমেন্ট PAID হিসেবে ভেরিফাই করা হয়েছে!</b>\n👤 <b>Verified by:</b> ${fromName} (${fromId})`,
      parse_mode: 'HTML',
      reply_markup: buildOrderActionKeyboard(ordId, 'confirmed', 'paid')
    });
    return;
  }

  const explicitRejectMatch = lowerText.match(/^(?:\/cancel|cancel|reject|বাতিল|ক্যান্সেল)\s+#?(ord-[\w-]+|\d[\w-]+)/i);
  if (explicitRejectMatch) {
    const ordId = explicitRejectMatch[1].replace(/^#/, '').trim();
    await updateOrderStatus(ordId, 'cancelled', fromId, fromName);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      reply_to_message_id: msg.message_id,
      text: `❌ <b>অর্ডার #${ordId} বাতিল (Cancelled) করা হয়েছে!</b>\n👤 <b>Rejected by:</b> ${fromName} (${fromId})`,
      parse_mode: 'HTML',
      reply_markup: buildOrderActionKeyboard(ordId, 'cancelled', 'pending')
    });
    return;
  }

  // =========================================================================
  // 3. DIRECT ORDER NUMBER LOOKUP (e.g. "ORD-211137-4060", "#ORD-...")
  // =========================================================================
  const directOrderMatch = text.match(/^#?(ORD-[\w-]+)$/i) || text.match(/^\/order\s+#?([\w-]+)$/i);
  if (directOrderMatch) {
    const ordNum = directOrderMatch[1].replace(/^#/, '').trim();
    const docData = await fetchFirestore(`/orders/${ordNum}`);
    if (docData && docData.fields) {
      const ord = parseOrderDoc(docData);
      const card = formatTelegramOrderCard(ord);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: card.text,
        parse_mode: 'HTML',
        reply_markup: card.reply_markup
      });
    } else {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: `❌ অর্ডার <b>#${ordNum}</b> খুঁজে পাওয়া যায়নি।\nসঠিক অর্ডার নম্বর লিখুন অথবা ওয়েব প্যানেলে সার্চ করুন।`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 ওয়েব প্যানেলে অর্ডার সার্চ করুন', url: `${STORE_URL}/admin/orders?search=${ordNum}` }]
          ]
        }
      });
    }
    return;
  }

  // =========================================================================
  // 4. PHONE NUMBER SEARCH (11-digit Bangladesh phone e.g. "01622530550")
  // =========================================================================
  const cleanDigits = text.replace(/[^\d]/g, '');
  if (cleanDigits.length === 11 && cleanDigits.startsWith('01')) {
    const resOrders = await fetchFirestore('/orders?pageSize=50');
    const docs = resOrders?.documents || [];
    const customerOrders = docs
      .map(parseOrderDoc)
      .filter(o => o && o.phone && o.phone.replace(/[^\d]/g, '').includes(cleanDigits));

    if (customerOrders.length > 0) {
      const first = customerOrders[0];
      let reply = `👤 <b>কাস্টমার প্রোফাইল ও অর্ডার হিস্টোরি:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• <b>নাম:</b> ${first.name}\n` +
        `• <b>ফোন:</b> <code>${first.phone}</code>\n` +
        `• <b>ঠিকানা:</b> ${first.address}\n` +
        `• <b>মোট অর্ডার:</b> ${customerOrders.length} টি\n\n` +
        `📦 <b>অর্ডার তালিকা:</b>\n`;

      customerOrders.slice(0, 5).forEach(o => {
        const sEmoji = o.status === 'confirmed' ? '✅' : o.status === 'cancelled' ? '❌' : '⏳';
        reply += `• <b>#${o.orderNum}</b> - ৳${o.total.toLocaleString()} (${sEmoji} ${o.status.toUpperCase()})\n`;
      });

      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: reply,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 ওয়েব প্যানেলে কাস্টমার দেখুন', url: `${STORE_URL}/admin/orders?search=${cleanDigits}` }]
          ]
        }
      });
      return;
    }
  }

  // =========================================================================
  // 5. COMMANDS: /start, /admin, /menu, /help, /pending, /orders, /stats, /search
  // =========================================================================
  if (lowerText === '/start' || lowerText === '/admin' || lowerText === '/menu' || lowerText === 'menu') {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `🏠 <b>DURTUP.SHOP SUPER ADMIN CONTROL CENTER</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👋 স্বাগতম, <b>${fromName}</b>!\n⚡ <i>রিয়েল-টাইম অর্ডার কনফার্মেশন ও স্টোর ম্যানেজমেন্ট বট</i>\n\n• নতুন অর্ডার আসলে এখানে স্বয়ংক্রিয় নোটিফিকেশন আসবে।\n• নোটিফিকেশনে <b>Reply</b> দিয়ে <b>Approve</b> বা <b>Reject</b> লিখতে পারেন।\n• অথবা নিচের বাটনগুলো চেপে নিয়ন্ত্রণ করুন:`,
      parse_mode: 'HTML',
      reply_markup: getMainAdminKeyboard()
    });
    return;
  }

  if (lowerText === '/pending' || lowerText === 'pending' || lowerText === 'পেন্ডিং') {
    await sendPendingOrders(chatId);
    return;
  }

  if (lowerText === '/orders' || lowerText === 'orders' || lowerText === 'অর্ডার') {
    await sendRecentOrders(chatId);
    return;
  }

  if (lowerText === '/stats' || lowerText === 'stats' || lowerText === 'হিসাব' || lowerText === 'বিক্রি') {
    await sendStoreStats(chatId);
    return;
  }

  if (lowerText.startsWith('/search ') || lowerText.startsWith('search ') || lowerText.startsWith('খোঁজ ') || lowerText.startsWith('পণ্য ')) {
    const q = lowerText.replace(/^(\/search|search|খোঁজ|পণ্য)\s+/i, '').trim();
    const catalog = getCatalog();
    const matches = catalog.filter(p => {
      const n = (p.name || '').toLowerCase();
      const c = (p.category_name || p.category || '').toLowerCase();
      return n.includes(q) || c.includes(q);
    });

    if (matches.length === 0) {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: `🔍 <i>"${q}"</i> নামে কোনো পণ্য পাওয়া যায়নি।\n\n<a href="${STORE_URL}/products?q=${encodeURIComponent(q)}">ওয়েবসাইটে সার্চ করুন</a>`,
        parse_mode: 'HTML'
      });
    } else {
      let reply = `🔍 <b>পণ্য সার্চ ফলাফল ("${q}"):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      matches.slice(0, 5).forEach(m => {
        reply += `🛍️ <b>${m.name}</b>\n• মূল্য: <b>৳${m.price.toLocaleString()}</b>\n• ক্যাটাগরি: ${m.category_name || m.category}\n• <a href="${STORE_URL}/product/${m.slug}">পণ্যটি দেখুন</a>\n\n`;
      });
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: reply,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
    }
    return;
  }

  if (lowerText === '/myid' || lowerText === 'myid') {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `🆔 <b>Your Telegram User ID:</b> <code>${fromId}</code>\nChat ID: <code>${chatId}</code>\nStatus: 🟢 <b>Active Administrator</b>`,
      parse_mode: 'HTML'
    });
    return;
  }

  if (lowerText === '/help' || lowerText === 'help' || lowerText === 'সাহায্য') {
    const helpText = `📖 <b>Durtup বট সুপার অ্যাডমিন কন্ট্রোল নির্দেশিকা:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <b>অর্ডার লাইফসাইকেল কন্ট্রোল:</b>\n` +
      `• <b>অর্ডারে রিপ্লাই:</b> মেসেজে Reply দিয়ে <code>Approve</code>, <code>Ship</code>, <code>Deliver</code>, <code>Paid</code>, <code>Cancel</code> লিখলেই স্ট্যাটাস আপডেট হবে!\n` +
      `• <b>/ship &lt;অর্ডার_আইডি&gt;</b> - কুরিয়ারে পাঠানো হলে সরাসরি Shipped করুন\n` +
      `• <b>/deliver &lt;অর্ডার_আইডি&gt;</b> - ডেলিভারি সম্পন্ন হলে Delivered করুন\n` +
      `• <b>/paid &lt;অর্ডার_আইডি&gt;</b> - পেমেন্ট পরিশোধ হলে Paid হিসেবে ভেরিফাই করুন\n` +
      `• <b>/cancel &lt;অর্ডার_আইডি&gt;</b> - অর্ডার বাতিল করুন\n` +
      `• <b>/pending</b> - পেন্ডিং অর্ডারসমূহ দেখুন\n` +
      `• <b>/orders</b> - সাম্প্রতিক সকল অর্ডার দেখুন\n` +
      `• <b>/stats</b> - মোট বিক্রি ও হিসাব দেখুন\n` +
      `• <b>ORD-xxxxxx</b> - যেকোনো অর্ডারের অ্যাকশন কার্ড দেখুন\n` +
      `• <b>01xxxxxxxxx</b> - কাস্টমারের ফোন নম্বর দিয়ে তথ্য ও হিস্টোরি খুঁজুন\n` +
      `• <b>/search &lt;পণ্য&gt;</b> - পণ্য সার্চ করুন\n` +
      `• <b>/admin</b> - মূল কন্ট্রোল প্যানেল খুলুন`;
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: helpText,
      parse_mode: 'HTML',
      reply_markup: getMainAdminKeyboard()
    });
    return;
  }

  // =========================================================================
  // 6. GREETINGS & CONVERSATIONAL RESPONSES
  // =========================================================================
  const isGreeting = (
    lowerText === 'hi' ||
    lowerText === 'hello' ||
    lowerText === 'হাই' ||
    lowerText === 'হ্যালো' ||
    lowerText === 'hey' ||
    lowerText === 'salam' ||
    lowerText === 'সালাম' ||
    lowerText === 'আসসালামু আলাইকুম' ||
    lowerText === 'কেমন আছো' ||
    lowerText === 'bot' ||
    lowerText === 'বট'
  );

  if (isGreeting) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `👋 <b>আসসালামু আলাইকুম, ${fromName}!</b>\n\nআমি <b>Durtup.shop</b> এর সার্বক্ষণিক অ্যাডমিন অ্যাসিস্ট্যান্ট। আমি সম্পূর্ণ সচল আছি এবং আপনার নির্দেশনার অপেক্ষায় রয়েছি।\n\nআপনি কী করতে চান? নিচের যেকোনো বাটন চাপুন:`,
      parse_mode: 'HTML',
      reply_markup: getMainAdminKeyboard()
    });
    return;
  }

  // =========================================================================
  // 7. SMART FALLBACK (Never stay silent!)
  // =========================================================================
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: `👋 <b>হ্যালো ${fromName}!</b>\nআমি আপনার বার্তা পেয়েছি: <i>"${text}"</i>\n\n💡 <b>আপনি যা করতে পারেন:</b>\n• যেকোনো অর্ডারে <b>Reply</b> দিয়ে <code>Approve</code> বা <code>Reject</code> লিখতে পারেন।\n• অর্ডার চেক করতে লিখুন: <code>ORD-xxxxxx</code>\n• পেন্ডিং অর্ডার দেখতে: <code>/pending</code>\n• বিক্রির হিসাব দেখতে: <code>/stats</code>\n• সাহায্য বা গাইড পেতে: <code>/help</code>`,
    parse_mode: 'HTML',
    reply_markup: getMainAdminKeyboard()
  });
}

const seenOrderIds = new Set();
let isFirstOrderScan = true;

async function markOrderNotifiedInFirestore(orderIdentifier) {
  const cleanId = orderIdentifier.replace(/^#/, '').trim();
  const mask = 'updateMask.fieldPaths=telegram_notified&updateMask.fieldPaths=telegram_notified_at';
  const patchData = JSON.stringify({
    fields: {
      telegram_notified: { booleanValue: true },
      telegram_notified_at: { stringValue: new Date().toISOString() }
    }
  });
  try {
    const patchUrl = `${FIRESTORE_BASE}/orders/${cleanId}?${mask}`;
    await new Promise((resolve) => {
      const u = new URL(patchUrl);
      const req = https.request({
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(patchData) },
        timeout: 4000
      }, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => resolve(b));
      });
      req.on('error', () => resolve(null));
      req.write(patchData);
      req.end();
    });
  } catch {}
}

async function scanAndNotifyNewOrders() {
  try {
    const res = await fetchFirestore('/orders?pageSize=20');
    const docs = res?.documents || [];
    if (isFirstOrderScan) {
      // First boot: populate existing IDs so we don't spam old orders
      for (const d of docs) {
        const id = (d.name || '').split('/').pop();
        const f = d.fields || {};
        const orderNum = f.order_number?.stringValue || f.orderNumber?.stringValue || id;
        if (id) seenOrderIds.add(id);
        if (orderNum) seenOrderIds.add(orderNum);
      }
      isFirstOrderScan = false;
      console.log(`[Order Watcher] Initialized with ${seenOrderIds.size} existing orders.`);
      return;
    }

    for (const d of docs) {
      const id = (d.name || '').split('/').pop();
      const f = d.fields || {};
      const orderNum = f.order_number?.stringValue || f.orderNumber?.stringValue || id;
      if (!orderNum) continue;

      // If already recorded or already marked as notified, skip duplicate
      if (seenOrderIds.has(id) || seenOrderIds.has(orderNum) || f.telegram_notified?.booleanValue) {
        seenOrderIds.add(id);
        seenOrderIds.add(orderNum);
        continue;
      }

      // Found a brand new order created in store!
      seenOrderIds.add(id);
      seenOrderIds.add(orderNum);

      const ord = parseOrderDoc(d);
      if (!ord) continue;

      console.log(`[Order Watcher] 🔔 BRAND NEW ORDER DETECTED: #${ord.orderNum} from ${ord.name} (৳${ord.total})! Sending to Telegram...`);

      const { text, reply_markup } = formatTelegramOrderCard(ord);
      for (const adminId of ADMIN_CHAT_IDS) {
        await callTelegram('sendMessage', {
          chat_id: adminId,
          text,
          parse_mode: 'HTML',
          reply_markup,
          disable_web_page_preview: true
        });
      }

      // Mark as notified in Firestore
      await markOrderNotifiedInFirestore(ord.orderNum);
    }
  } catch (err) {
    // silently handle polling notice
  }
}

async function startPolling() {
  console.log('====================================================');
  console.log('🚀 Starting Durtup Telegram Bot Realtime Polling Service');
  console.log(`🤖 Bot Token: ${BOT_TOKEN.slice(0, 15)}...`);
  console.log('====================================================\n');

  // Refresh admin chat ids
  await refreshAdminChatIds().catch(() => {});
  setInterval(refreshAdminChatIds, 60000);

  // Initialize and start realtime Firestore order watcher (super fast 2s interval)
  await scanAndNotifyNewOrders().catch(() => {});
  setInterval(scanAndNotifyNewOrders, 2000);

  // 1. Delete webhook so getUpdates receives all callback queries and messages
  const delRes = await callTelegram('deleteWebhook', { drop_pending_updates: false });
  console.log('[Telegram Bot] deleteWebhook result:', delRes.ok ? 'SUCCESS' : delRes);

  let offset = 0;

  while (true) {
    try {
      const res = await callTelegram('getUpdates', {
        offset,
        timeout: 20,
        allowed_updates: ['message', 'callback_query']
      });

      if (res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;

          if (update.callback_query) {
            await handleCallbackQuery(update.callback_query).catch(e => console.error('[Telegram Bot] CB error:', e));
          } else if (update.message) {
            await handleMessage(update.message).catch(e => console.error('[Telegram Bot] Msg error:', e));
          }
        }
      } else {
        // Wait 2s if non-ok response
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (loopErr) {
      console.warn('[Telegram Bot] Polling loop error:', loopErr.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

startPolling();
