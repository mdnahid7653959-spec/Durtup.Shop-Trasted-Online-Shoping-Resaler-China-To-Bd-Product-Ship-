/**
 * Durtup.shop - Authoritative Telegram Admin Control Webhook (Self-Contained Vercel Serverless Function)
 * 
 * Runs directly on Vercel Serverless Node.js runtime without external path dependencies.
 * Handles:
 * - /start, /help, /orders, /pending, /stats, /products
 * - One-click admin pairing and authorization
 * - Instant order approval & rejection with Firestore sync
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCIcvphAtwx7rup-aV3MZPDK0w-xCN1Xoc",
  authDomain: "eshop-app-6119d.firebaseapp.com",
  projectId: "eshop-app-6119d",
  storageBucket: "eshop-app-6119d.firebasestorage.app",
  messagingSenderId: "18064875571",
  appId: "1:18064875571:web:0cd166f0bc0446c7bc0346"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "9052891455:AAGoY4tAc6JaEAN8AxAI96RMMQBS6UcMYpw";
const STORE_NAME = "Durtup.shop";
const STORE_URL = process.env.VITE_SITE_URL || "https://www.durtup.shop";

async function callTelegram(method: string, payload: any, tokenOverride?: string) {
  const token = (tokenOverride || DEFAULT_BOT_TOKEN).trim();
  const url = `https://api.telegram.org/bot${token}/${method}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err: any) {
    console.error(`[Telegram Call Error ${method}]:`, err.message);
    return { ok: false, description: err.message };
  }
}

async function getTelegramConfig() {
  const config = {
    bot_token: DEFAULT_BOT_TOKEN,
    admin_chat_ids: [] as string[],
    enabled: true
  };

  try {
    const snap = await getDoc(doc(db, "settings", "telegram"));
    if (snap.exists()) {
      const data = snap.data();
      if (data.bot_token) config.bot_token = data.bot_token;
      if (Array.isArray(data.admin_chat_ids)) {
        config.admin_chat_ids = data.admin_chat_ids.map(String).filter((id: string) => id && id !== "123456789");
      } else if (data.chat_id) {
        config.admin_chat_ids = [String(data.chat_id).trim()];
      }
      if (typeof data.enabled === "boolean") config.enabled = data.enabled;
    }
  } catch (err) {
    console.warn("[Config read error]:", err);
  }

  return config;
}

async function addAdminId(id: string | number) {
  try {
    const strId = String(id).trim();
    const cfg = await getTelegramConfig();
    if (!cfg.admin_chat_ids.includes(strId)) {
      cfg.admin_chat_ids.push(strId);
      await setDoc(doc(db, "settings", "telegram"), {
        bot_token: cfg.bot_token,
        admin_chat_ids: cfg.admin_chat_ids,
        chat_id: cfg.admin_chat_ids[0] || strId,
        enabled: true,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    return true;
  } catch (err) {
    console.error("[Failed to save admin ID]:", err);
    return false;
  }
}

function getAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📦 Recent Orders", callback_data: "cmd_orders" },
        { text: "⏳ Pending Orders", callback_data: "cmd_pending" }
      ],
      [
        { text: "📊 Store Analytics", callback_data: "cmd_stats" },
        { text: "🛍️ Products", callback_data: "cmd_products" }
      ],
      [
        { text: "🌐 Open Admin Panel", url: `${STORE_URL}/admin/orders` }
      ]
    ]
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Bot-Api-Secret-Token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET Health Check
  if (req.method === "GET") {
    return res.status(200).json({
      status: "active",
      service: "Durtup Telegram Admin Control Webhook (Serverless)",
      time: new Date().toISOString()
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    let update = req.body;
    if (typeof update === "string") {
      try {
        update = JSON.parse(update);
      } catch {
        update = null;
      }
    }

    if (!update || typeof update !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const config = await getTelegramConfig();

    // 1. Handle Inline Button Callbacks
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const data = cb.data || "";
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;
      const fromId = String(cb.from?.id || "");
      const fromName = [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(" ") || "Admin";

      // Self-pairing callback
      if (data.startsWith("admin_pair:")) {
        const pairId = data.replace("admin_pair:", "").trim();
        await addAdminId(pairId);
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId, text: "Admin Access Granted! 🎉" });
        if (chatId) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `🎉 <b>Congratulations, ${fromName}!</b>\n\nYour Telegram User ID (<code>${pairId}</code>) is now registered as an Authorized Admin for <b>${STORE_NAME}</b>.\n\nYou have full real-time control over orders, products, and store analytics.`,
            parse_mode: "HTML",
            reply_markup: getAdminKeyboard()
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Authorization Check for action callbacks
      const isAuthorized = config.admin_chat_ids.length === 0 || config.admin_chat_ids.includes(fromId);
      if (!isAuthorized) {
        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: "⛔ Access Denied! Your Telegram ID is not authorized.",
          show_alert: true
        });
        return res.status(200).json({ ok: true });
      }

      // Approve Order
      if (data.startsWith("order_approve:")) {
        const orderNum = data.replace("order_approve:", "").trim();
        const nowIso = new Date().toISOString();
        let orderRef = doc(db, "orders", orderNum);
        let snap = await getDoc(orderRef);

        if (!snap.exists()) {
          const q = query(collection(db, "orders"), where("order_number", "==", orderNum), limit(1));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            orderRef = qSnap.docs[0].ref;
            snap = qSnap.docs[0];
          }
        }

        const oData = snap.exists() ? snap.data() : null;
        if (oData && (oData.status === "confirmed" || oData.status === "delivered")) {
          await callTelegram("answerCallbackQuery", {
            callback_query_id: cbId,
            text: `⚠️ Order #${orderNum} is already ${oData.status.toUpperCase()}!`,
            show_alert: true
          });
          return res.status(200).json({ ok: true });
        }

        await setDoc(orderRef, {
          status: "confirmed",
          approved_by_telegram: fromId,
          approved_by_name: fromName,
          approved_at: nowIso,
          updated_at: nowIso
        }, { merge: true });

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `✅ Order #${orderNum} Approved Successfully!`,
          show_alert: false
        });

        if (chatId && messageId) {
          const originalText = cb.message?.text || "";
          const updatedText = originalText
            ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> ✅ <b>APPROVED / CONFIRMED</b>\n👤 <b>Approved By:</b> ${fromName}\n`)
            : `✅ <b>Order #${orderNum} Approved!</b>\nApproved by ${fromName}`;

          await callTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ APPROVED", callback_data: "none" },
                  { text: "🌐 Open in Admin", url: `${STORE_URL}/admin/orders?id=${orderNum}` }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Reject Order
      if (data.startsWith("order_reject:")) {
        const orderNum = data.replace("order_reject:", "").trim();
        const nowIso = new Date().toISOString();
        let orderRef = doc(db, "orders", orderNum);
        let snap = await getDoc(orderRef);

        if (!snap.exists()) {
          const q = query(collection(db, "orders"), where("order_number", "==", orderNum), limit(1));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            orderRef = qSnap.docs[0].ref;
            snap = qSnap.docs[0];
          }
        }

        await setDoc(orderRef, {
          status: "cancelled",
          rejected_by_telegram: fromId,
          rejected_by_name: fromName,
          cancelled_at: nowIso,
          updated_at: nowIso
        }, { merge: true });

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `❌ Order #${orderNum} Cancelled / Rejected.`,
          show_alert: false
        });

        if (chatId && messageId) {
          await callTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `❌ <b>Order #${orderNum} Cancelled.</b>\nRejected by ${fromName}`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "❌ CANCELLED", callback_data: "none" },
                  { text: "🌐 Open in Admin", url: `${STORE_URL}/admin/orders?id=${orderNum}` }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Orders navigation callbacks
      if (data === "cmd_orders" || data === "cmd_pending") {
        const statusFilter = data === "cmd_pending" ? "pending" : null;
        let q = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(5));
        if (statusFilter) {
          q = query(collection(db, "orders"), where("status", "==", statusFilter), limit(5));
        }
        const oSnap = await getDocs(q);
        let text = `📦 <b>${statusFilter ? "Pending" : "Recent"} Orders (Latest 5):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (oSnap.empty) {
          text += `<i>No orders found.</i>`;
        } else {
          oSnap.docs.forEach((d) => {
            const o = d.data();
            text += `• <b>#${o.order_number || d.id}</b> - ৳${(o.total || o.total_price || 0).toLocaleString()} (${(o.status || "pending").toUpperCase()})\n  👤 ${o.customer_name || "Customer"} | 📞 ${o.phone || "N/A"}\n\n`;
          });
        }
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          reply_markup: getAdminKeyboard()
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // Stats Callback
      if (data === "cmd_stats") {
        const oSnap = await getDocs(query(collection(db, "orders"), limit(100)));
        let totalRevenue = 0;
        let totalOrders = oSnap.size;
        let confirmed = 0;
        let pending = 0;

        oSnap.docs.forEach(d => {
          const o = d.data();
          const amount = Number(o.total || o.total_price || 0);
          if (o.status === "confirmed" || o.status === "delivered") {
            totalRevenue += amount;
            confirmed++;
          } else if (o.status === "pending") {
            pending++;
          }
        });

        const statsText = `📊 <b>${STORE_NAME} Store Statistics:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n📦 <b>Total Orders:</b> ${totalOrders}\n✅ <b>Confirmed/Delivered:</b> ${confirmed}\n⏳ <b>Pending Confirmation:</b> ${pending}\n💰 <b>Total Verified Revenue:</b> ৳${totalRevenue.toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━━━\n🕒 <i>Live as of ${new Date().toLocaleTimeString("en-BD")}</i>`;

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: statsText,
          parse_mode: "HTML",
          reply_markup: getAdminKeyboard()
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
      return res.status(200).json({ ok: true });
    }

    // 2. Handle Text Messages and Commands
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const userId = String(msg.from?.id || "");
      const userName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "User";
      const text = (msg.text || "").trim();

      // First-time self-pairing command or /start when no admin registered
      if (text.startsWith("/setup") || (config.admin_chat_ids.length === 0 && (text === "/start" || text.toLowerCase() === "start"))) {
        await addAdminId(userId);
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `🎉 <b>Welcome, Administrator ${userName}!</b>\n\nYour Telegram User ID (<code>${userId}</code>) has been successfully verified and registered as an Authorized Admin for <b>${STORE_NAME}</b>.\n\nYou now have full real-time control over orders, products, and store analytics.`,
          parse_mode: "HTML",
          reply_markup: getAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Check if user is authorized admin
      const isAuthorized = config.admin_chat_ids.includes(userId);

      // Handle /start or /menu for any user
      if (text === "/start" || text.toLowerCase() === "start" || text === "/menu") {
        if (!isAuthorized) {
          // Send friendly pairing option
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `👋 <b>Hello, ${userName}!</b>\n\nWelcome to <b>${STORE_NAME} Assistant</b>.\n\nYour Telegram User ID is: <code>${userId}</code>\n\nTo connect this bot as your Store Admin, click the button below:`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔑 Register My ID as Admin", callback_data: `admin_pair:${userId}` }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `👋 <b>Hello, ${userName}!</b>\n\nWelcome to the <b>${STORE_NAME} Admin Control Bot</b>. Select an action below:`,
          parse_mode: "HTML",
          reply_markup: getAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      if (!isAuthorized) {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `⛔ <b>Access Denied!</b>\n\nYour Telegram ID: <code>${userId}</code> is not registered as an authorized administrator of <b>${STORE_NAME}</b>.`,
          parse_mode: "HTML"
        });
        return res.status(200).json({ ok: true });
      }

      // Commands for authorized admin
      if (text === "/help") {
        const helpText = `📖 <b>${STORE_NAME} Admin Commands:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n🔹 <b>/start</b> - Show Dashboard\n🔹 <b>/orders</b> - Latest customer orders\n🔹 <b>/pending</b> - Orders awaiting confirmation\n🔹 <b>/stats</b> - Sales & revenue analytics\n🔹 <b>/myid</b> - Show your numeric Telegram ID\n━━━━━━━━━━━━━━━━━━━━━━`;
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: helpText,
          parse_mode: "HTML",
          reply_markup: getAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      if (text === "/myid") {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `🆔 Your Telegram User ID is: <code>${userId}</code>\nChat ID: <code>${chatId}</code>`,
          parse_mode: "HTML"
        });
        return res.status(200).json({ ok: true });
      }

      if (text === "/stats") {
        const oSnap = await getDocs(query(collection(db, "orders"), limit(100)));
        let totalRevenue = 0;
        let confirmed = 0;
        let pending = 0;

        oSnap.docs.forEach(d => {
          const o = d.data();
          const amount = Number(o.total || o.total_price || 0);
          if (o.status === "confirmed" || o.status === "delivered") {
            totalRevenue += amount;
            confirmed++;
          } else if (o.status === "pending") {
            pending++;
          }
        });

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `📊 <b>${STORE_NAME} Statistics:</b>\n\n• Total Orders: <b>${oSnap.size}</b>\n• Confirmed: <b>${confirmed}</b>\n• Pending: <b>${pending}</b>\n• Revenue: <b>৳${totalRevenue.toLocaleString()}</b>`,
          parse_mode: "HTML",
          reply_markup: getAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Fallback
      await callTelegram("sendMessage", {
        chat_id: chatId,
        text: `❓ Unrecognized command: <i>${text}</i>\nUse <b>/start</b> or <b>/help</b> for commands.`,
        parse_mode: "HTML",
        reply_markup: getAdminKeyboard()
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true, ignored: true });
  } catch (err: any) {
    console.error("[Telegram Webhook Crash Error]:", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
