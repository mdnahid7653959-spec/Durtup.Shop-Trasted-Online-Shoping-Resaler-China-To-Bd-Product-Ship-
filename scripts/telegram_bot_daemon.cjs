/**
 * scripts/telegram_bot_daemon.cjs
 * Real-time background Telegram Bot Polling Daemon for Durtup.shop.
 * Handles instant order approvals, rejections, and admin commands.
 */

const https = require('https');
const http = require('http');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9052891455:AAEABwgEKbLVeCw1ZogwnUI_3LrPWGPuJGY';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/eshop-app-6119d/databases/(default)/documents';
const MASTER_ADMIN_ID = '8204855335';

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

async function updateOrderStatus(orderIdentifier, status, adminId, adminName) {
  const cleanId = orderIdentifier.replace(/^#/, '').trim();
  const nowIso = new Date().toISOString();
  const statusFields = {
    status: { stringValue: status },
    approved_by_telegram: { stringValue: String(adminId) },
    approved_by_name: { stringValue: String(adminName) },
    updated_at: { stringValue: nowIso }
  };
  if (status === 'confirmed') {
    statusFields.confirmed_at = { stringValue: nowIso };
  } else {
    statusFields.cancelled_at = { stringValue: nowIso };
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

async function handleCallbackQuery(cb) {
  const cbId = cb.id;
  const data = (cb.data || '').trim();
  const fromId = String(cb.from?.id || '');
  const fromName = cb.from?.first_name || 'Admin';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const originalText = cb.message?.text || '';

  console.log(`[Telegram Bot] Inbound CallbackQuery: "${data}" from ${fromName} (${fromId})`);

  if (data.startsWith('order_approve:')) {
    const orderNum = data.replace('order_approve:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing APPROVAL for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'confirmed', fromId, fromName);

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `✅ অর্ডার #${orderNum} সফলভাবে অ্যাপ্রুভ হয়েছে!`,
      show_alert: false
    });

    if (chatId && messageId) {
      const updatedText = originalText
        ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> ✅ <b>APPROVED / CONFIRMED</b>\n👤 <b>Approved By:</b> ${fromName} (${fromId})\n`)
        : `✅ <b>Order #${orderNum} Approved!</b>\nApproved by ${fromName} on ${new Date().toLocaleTimeString('en-BD')}`;

      await callTelegram('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: updatedText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ APPROVED', callback_data: 'none' },
              { text: '🌐 View in Admin', url: `https://durtup.shop/admin/orders?id=${orderNum}` }
            ]
          ]
        }
      });
    }

    console.log(`[Telegram Bot] Order #${orderNum} successfully approved and message updated!`);
    return;
  }

  if (data.startsWith('order_reject:')) {
    const orderNum = data.replace('order_reject:', '').replace(/^#/, '').trim();
    console.log(`[Telegram Bot] Processing REJECTION for order #${orderNum}...`);

    await updateOrderStatus(orderNum, 'cancelled', fromId, fromName);

    await callTelegram('answerCallbackQuery', {
      callback_query_id: cbId,
      text: `❌ অর্ডার #${orderNum} বাতিল করা হয়েছে!`,
      show_alert: false
    });

    if (chatId && messageId) {
      const updatedText = originalText
        ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> ❌ <b>REJECTED / CANCELLED</b>\n👤 <b>Rejected By:</b> ${fromName} (${fromId})\n`)
        : `❌ <b>Order #${orderNum} Rejected</b>`;

      await callTelegram('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: updatedText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '❌ REJECTED', callback_data: 'none' },
              { text: '🌐 View in Admin', url: `https://durtup.shop/admin/orders?id=${orderNum}` }
            ]
          ]
        }
      });
    }

    console.log(`[Telegram Bot] Order #${orderNum} rejected and message updated!`);
    return;
  }

  // Fallback answer callback
  await callTelegram('answerCallbackQuery', { callback_query_id: cbId, text: 'Action received.' });
}

async function handleMessage(msg) {
  const text = (msg.text || '').trim();
  const chatId = msg.chat?.id;
  const fromId = String(msg.from?.id || '');
  const fromName = msg.from?.first_name || 'Admin';

  if (text === '/start' || text === '/admin' || text === '/menu') {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `🏠 <b>DURTUP.SHOP SUPER ADMIN CONTROL CENTER</b>\n━━━━━━━━━━━━━━━━━━━━━━\n👋 Welcome, <b>${fromName}</b>!\n⚡ <i>Real-time order confirmation & store management bot</i>\n\n• New orders will arrive here automatically.\n• Tap <b>✅ APPROVE ORDER</b> on any notification to approve instantly!`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌐 Open Web Admin Panel', url: 'https://durtup.shop/admin/orders' }
          ]
        ]
      }
    });
    return;
  }

  if (text === '/myid') {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `🆔 <b>Your Telegram User ID:</b> <code>${fromId}</code>\nChat ID: <code>${chatId}</code>\nStatus: 🟢 <b>Active Administrator</b>`,
      parse_mode: 'HTML'
    });
    return;
  }
}

async function startPolling() {
  console.log('====================================================');
  console.log('🚀 Starting Durtup Telegram Bot Realtime Polling Service');
  console.log(`🤖 Bot Token: ${BOT_TOKEN.slice(0, 15)}...`);
  console.log('====================================================\n');

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
