/**
 * Durtup.shop - Telegram Admin Notification & Config Engine
 * 
 * Server-side engine handling Telegram Bot API operations for store events:
 * - Instant rich order notifications with interactive Inline Keyboards for orderServerEngine
 * - Authoritative Telegram Bot configuration from Firestore settings/telegram and environment
 * - Webhook update handling delegated cleanly to central telegramRouter engine
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { handleTelegramWebhookUpdate as routerHandleTelegramWebhookUpdate } from "./telegram/telegramRouter";

const firebaseConfig = {
  apiKey: "AIzaSyCIcvphAtwx7rup-aV3MZPDK0w-xCN1Xoc",
  authDomain: "eshop-app-6119d.firebaseapp.com",
  projectId: "eshop-app-6119d",
  storageBucket: "eshop-app-6119d.firebasestorage.app",
  messagingSenderId: "18064875571",
  appId: "1:18064875571:web:0cd166f0bc0446c7bc0346"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface TelegramBotConfig {
  bot_token: string;
  admin_chat_ids: string[]; // List of authorized numeric Telegram User/Chat IDs
  enabled: boolean;
  webhook_secret?: string;
}

const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const STORE_NAME = "Durtup.shop";
const STORE_URL = process.env.VITE_SITE_URL || "https://durtup.shop";

/**
 * Retrieves the authoritative Telegram Bot configuration from Firestore or environment
 */
export async function getAuthoritativeTelegramConfig(): Promise<TelegramBotConfig> {
  const envAdmins = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  let config: TelegramBotConfig = {
    bot_token: DEFAULT_BOT_TOKEN,
    admin_chat_ids: envAdmins,
    enabled: true,
  };

  try {
    const snap = await getDoc(doc(db, "settings", "telegram"));
    if (snap.exists()) {
      const data = snap.data();
      config.bot_token = (data.bot_token || config.bot_token || "").trim();
      config.enabled = data.enabled !== false;
      
      const firestoreAdmins = Array.isArray(data.admin_chat_ids)
        ? data.admin_chat_ids.map(String)
        : (data.chat_id ? [String(data.chat_id).trim()] : []);
      
      const merged = Array.from(new Set([...config.admin_chat_ids, ...firestoreAdmins])).filter(Boolean);
      config.admin_chat_ids = merged;
    }
  } catch (err) {
    console.warn("[Telegram Engine] Error reading Firestore settings/telegram:", err);
  }

  return config;
}

/**
 * Persists updated authorized Admin IDs to Firestore
 */
export async function addAuthorizedAdminId(chatId: string | number): Promise<boolean> {
  try {
    const strId = String(chatId).trim();
    const config = await getAuthoritativeTelegramConfig();
    if (!config.admin_chat_ids.includes(strId)) {
      config.admin_chat_ids.push(strId);
      await setDoc(doc(db, "settings", "telegram"), {
        bot_token: config.bot_token,
        admin_chat_ids: config.admin_chat_ids,
        chat_id: config.admin_chat_ids[0] || strId,
        enabled: true,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    return true;
  } catch (e) {
    console.error("[Telegram Engine] Failed to save authorized admin ID:", e);
    return false;
  }
}

/**
 * Checks if a Telegram User ID is an authorized admin
 */
export async function isAuthorizedAdmin(userId: string | number): Promise<boolean> {
  const config = await getAuthoritativeTelegramConfig();
  const uidStr = String(userId).trim();
  
  // Filter out mock test IDs
  const realAdmins = config.admin_chat_ids.filter(id => id && id !== "123456789" && id !== "000000");
  
  if (realAdmins.length === 0) {
    return false;
  }

  return realAdmins.includes(uidStr);
}

/**
 * Raw Telegram API caller
 */
export async function callTelegramApi(method: string, payload: any, tokenOverride?: string): Promise<any> {
  let token = tokenOverride || DEFAULT_BOT_TOKEN;
  if (!token) {
    try {
      const cfg = await getAuthoritativeTelegramConfig();
      token = cfg.bot_token;
    } catch {}
  }
  if (!token) {
    throw new Error("Telegram Bot Token is not configured.");
  }

  const url = `https://api.telegram.org/bot${token.trim()}/${method}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn(`[Telegram API] Call to ${method} error (${err.message}). On Vercel cloud hosting, this connects directly.`);
    return { ok: false, description: err.message, network_error: true };
  }
}

/**
 * Sends order notification with interactive buttons to all configured admin chats
 */
export async function sendTelegramOrderNotificationWithActions(order: {
  id?: string;
  order_number?: string;
  orderNumber?: string;
  customer_name?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  payment_method?: string;
  paymentMethod?: string;
  total?: number;
  total_price?: number;
  items?: Array<{ name: string; quantity: number; price: number }>;
}): Promise<{ success: boolean; sentCount: number; errors?: string[] }> {
  const config = await getAuthoritativeTelegramConfig();
  if (!config.enabled || !config.bot_token || config.admin_chat_ids.length === 0) {
    return { success: false, sentCount: 0, errors: ["Telegram notifications disabled or no admin chat IDs configured"] };
  }

  const orderNum = order.order_number || order.orderNumber || order.id || "N/A";
  const custName = order.customer_name || order.customerName || "Customer";
  const phone = order.phone || "N/A";
  const payMethod = (order.payment_method || order.paymentMethod || "Cash on Delivery").toUpperCase();
  const totalAmount = order.total ?? order.total_price ?? 0;
  const address = order.address ? `${order.address}, ${order.city || ""}` : (order.city || "Dhaka");

  const itemsList = order.items && order.items.length > 0
    ? order.items.map(i => `  ▫️ <b>${i.name}</b> (x${i.quantity}) - ৳${(i.price * i.quantity).toLocaleString()}`).join("\n")
    : "  ▫️ Item details in admin portal";

  const timeStr = new Date().toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = new Date().toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });

  const message = `🔔 <b>NEW ORDER RECEIVED!</b> 🎉
━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Order Number:</b> <code>#${orderNum}</code>
⏰ <b>Time:</b> ${dateStr} at ${timeStr}
👤 <b>Customer:</b> <b>${custName}</b>
📞 <b>Phone:</b> <code>${phone}</code>
${order.email ? `📧 <b>Email:</b> ${order.email}\n` : ""}📍 <b>Delivery Address:</b> ${address}
💳 <b>Payment Method:</b> <b>${payMethod}</b>
━━━━━━━━━━━━━━━━━━━━━━
🛍️ <b>Ordered Items:</b>
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━
💰 <b>Total Bill:</b> <b>৳${totalAmount.toLocaleString()}</b>
⚡ <b>Status:</b> ⏳ <b>PENDING CONFIRMATION</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ APPROVE ORDER", callback_data: `order_approve:${orderNum}` },
        { text: "❌ REJECT ORDER", callback_data: `order_reject:${orderNum}` }
      ],
      [
        { text: "🌐 View in Admin Panel", url: `${STORE_URL}/admin/orders?id=${orderNum}` }
      ]
    ]
  };

  let sentCount = 0;
  const errors: string[] = [];

  for (const chatId of config.admin_chat_ids) {
    try {
      const res = await callTelegramApi("sendMessage", {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard
      }, config.bot_token);

      if (res.ok) {
        sentCount++;
      } else {
        errors.push(`Chat ${chatId}: ${res.description}`);
      }
    } catch (e: any) {
      errors.push(`Chat ${chatId}: ${e.message}`);
    }
  }

  return { success: sentCount > 0, sentCount, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Handles incoming Telegram Webhook updates (commands & callback queries)
 * Unified: delegates directly to central telegramRouter engine.
 */
export async function handleTelegramWebhookUpdate(
  update: any,
  secretHeader?: string
): Promise<{ handled: boolean; response?: any; action?: string; authorized?: boolean; error?: string }> {
  return routerHandleTelegramWebhookUpdate(update, secretHeader);
}
