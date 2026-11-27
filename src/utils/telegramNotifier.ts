import { db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { supabase } from "@/lib/firebaseAdapter";

export interface TelegramConfig {
  enabled: boolean;
  bot_token: string;
  chat_id: string;
  admin_chat_ids?: string[];
}

export const DEFAULT_TELEGRAM_BOT_TOKEN = "9052891455:AAEABwgEKbLVeCw1ZogwnUI_3LrPWGPuJGY";
export const DEFAULT_TELEGRAM_CHAT_ID = "8204855335";

export function escapeTgHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const LOCAL_STORAGE_KEY = "durtup_telegram_config";

export async function getTelegramConfig(): Promise<TelegramConfig> {
  // 1. Check local storage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.bot_token && parsed.chat_id) return parsed;
    }
  } catch {}

  // 2. Check Firestore
  try {
    const snap = await getDoc(doc(db, "settings", "telegram"));
    if (snap.exists()) {
      const data = snap.data() as TelegramConfig;
      if (data.bot_token && data.chat_id) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn("Firestore telegram config read warning:", e);
  }

  // 3. Check Supabase site_settings
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "telegram_notification")
      .maybeSingle();
    if (data?.value) {
      const val = data.value as TelegramConfig;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(val));
      return val;
    }
  } catch (e) {
    console.warn("Supabase telegram config read warning:", e);
  }

  return { enabled: true, bot_token: DEFAULT_TELEGRAM_BOT_TOKEN, chat_id: DEFAULT_TELEGRAM_CHAT_ID };
}

export async function saveTelegramConfig(config: TelegramConfig): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    
    // Save to Firestore
    try {
      await setDoc(doc(db, "settings", "telegram"), config, { merge: true });
    } catch (fsErr) {
      console.warn("Firestore save warning:", fsErr);
    }

    // Save to Supabase
    try {
      await supabase
        .from("site_settings")
        .upsert({
          key: "telegram_notification",
          value: config,
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });
    } catch (sbErr) {
      console.warn("Supabase save warning:", sbErr);
    }

    return true;
  } catch (e) {
    console.error("Failed to save telegram config:", e);
    return false;
  }
}

export async function sendTelegramMessage(text: string, customConfig?: Partial<TelegramConfig>, replyMarkup?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const saved = await getTelegramConfig();
    const botToken = (customConfig?.bot_token || saved.bot_token || DEFAULT_TELEGRAM_BOT_TOKEN).trim();
    const chatId = (customConfig?.chat_id || saved.chat_id || DEFAULT_TELEGRAM_CHAT_ID).trim();
    
    if (!botToken || !chatId) {
      return { success: false, error: "Telegram Bot Token বা Chat ID সেট করা নেই।" };
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn("Telegram API result warning:", result);
      return { success: false, error: result.description || "Failed to send Telegram message" };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Telegram send error:", e);
    return { success: false, error: e.message || "Network request failed" };
  }
}

export function buildOrderActionKeyboard(
  orderNum: string,
  status: string = "pending",
  paymentStatus: string = "pending",
  phone: string = "",
  baseUrl: string = "https://durtup.shop"
) {
  const normStatus = (status || "pending").toLowerCase();
  const normPayment = (paymentStatus || "pending").toLowerCase();
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("880") ? cleanPhone : (cleanPhone.startsWith("0") ? `88${cleanPhone}` : `880${cleanPhone}`);

  const keyboard: any[][] = [];

  // Row 1: Primary Lifecycle Transitions
  if (normStatus === "pending") {
    keyboard.push([
      { text: "✅ APPROVE ORDER", callback_data: `order_approve:${orderNum}` },
      { text: "🚚 MARK SHIPPED", callback_data: `order_ship:${orderNum}` }
    ]);
    keyboard.push([
      { text: "🎉 MARK DELIVERED", callback_data: `order_deliver:${orderNum}` },
      { text: "❌ CANCEL ORDER", callback_data: `order_reject:${orderNum}` }
    ]);
  } else if (normStatus === "confirmed" || normStatus === "processing") {
    keyboard.push([
      { text: "🚚 MARK SHIPPED", callback_data: `order_ship:${orderNum}` },
      { text: "🎉 MARK DELIVERED", callback_data: `order_deliver:${orderNum}` }
    ]);
    keyboard.push([
      { text: "⚙️ Processing (Active)", callback_data: `order_noop:${orderNum}` },
      { text: "❌ CANCEL ORDER", callback_data: `order_reject:${orderNum}` }
    ]);
  } else if (normStatus === "shipped") {
    keyboard.push([
      { text: "🎉 MARK DELIVERED", callback_data: `order_deliver:${orderNum}` },
      { text: "↩️ MARK REFUNDED", callback_data: `order_refund:${orderNum}` }
    ]);
    keyboard.push([
      { text: "🚚 Shipped (In Transit)", callback_data: `order_noop:${orderNum}` },
      { text: "❌ CANCEL ORDER", callback_data: `order_reject:${orderNum}` }
    ]);
  } else if (normStatus === "delivered") {
    keyboard.push([
      { text: "🟢 DELIVERED / COMPLETED", callback_data: `order_noop:${orderNum}` },
      { text: "↩️ MARK REFUNDED", callback_data: `order_refund:${orderNum}` }
    ]);
  } else if (normStatus === "cancelled") {
    keyboard.push([
      { text: "🔴 CANCELLED / REJECTED", callback_data: `order_noop:${orderNum}` },
      { text: "🔄 REOPEN (PENDING)", callback_data: `order_pending:${orderNum}` }
    ]);
  } else {
    keyboard.push([
      { text: "✅ APPROVE", callback_data: `order_approve:${orderNum}` },
      { text: "🚚 SHIP", callback_data: `order_ship:${orderNum}` },
      { text: "🎉 DELIVER", callback_data: `order_deliver:${orderNum}` }
    ]);
  }

  // Row 2: Payment Action
  const payRow: any[] = [];
  if (normPayment === "paid") {
    payRow.push({ text: "💵 PAID ✅", callback_data: `order_noop:${orderNum}` });
    payRow.push({ text: "↩️ Mark Unpaid", callback_data: `order_unpaid:${orderNum}` });
  } else {
    payRow.push({ text: "💵 MARK AS PAID", callback_data: `order_paid:${orderNum}` });
  }
  keyboard.push(payRow);

  // Row 3: Direct WhatsApp / Web Admin Links
  const linksRow: any[] = [];
  if (cleanPhone && cleanPhone.length >= 10) {
    linksRow.push({ text: "💬 WhatsApp Customer", url: `https://wa.me/${waPhone}` });
  }
  linksRow.push({ text: "🌐 View in Admin", url: `${baseUrl}/admin/orders?id=${orderNum}` });
  keyboard.push(linksRow);

  return { inline_keyboard: keyboard };
}

export async function sendTelegramOrderNotification(order: {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  paymentMethod: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    id?: string;
    productId?: string;
    product_id?: string;
    supplier?: string;
    supplier_name?: string;
  }>;
}) {
  const config = await getTelegramConfig();
  const botToken = config.bot_token || DEFAULT_TELEGRAM_BOT_TOKEN;
  const primaryChatId = config.chat_id || DEFAULT_TELEGRAM_CHAT_ID;

  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
  const baseUrl = origin.startsWith("https://") ? origin : "https://durtup.shop";

  const itemsList = order.items && order.items.length > 0
    ? order.items.map((item, idx) => {
        const pId = item.productId || item.product_id || item.id || "";
        let supplier = item.supplier || item.supplier_name || "";
        if (!supplier) {
          if (pId.startsWith("ecom-") || item.name.toLowerCase().includes("camera") || item.name.toLowerCase().includes("speaker") || item.name.toLowerCase().includes("cable")) {
            supplier = "EcomsellerBD";
          } else if (pId.startsWith("drop-") || item.name.toLowerCase().includes("lamp") || item.name.toLowerCase().includes("watch") || item.name.toLowerCase().includes("saree") || item.name.toLowerCase().includes("necklace")) {
            supplier = "DropShipping.com.bd";
          } else if (pId.startsWith("cj-") || item.name.toLowerCase().includes("china")) {
            supplier = "CJ Dropshipping (China to BD)";
          } else {
            supplier = "Direct Inventory";
          }
        }
        const lineTotal = item.price * item.quantity;
        const linkTag = pId ? `<a href="${baseUrl}/product/${pId}">Store Link</a>` : "";
        return `  ▫️ <b>Item #${idx + 1}:</b> ${escapeTgHtml(item.name)}
     🆔 ID: <code>${escapeTgHtml(pId) || "N/A"}</code> | 🏢 Supplier: <b>${escapeTgHtml(supplier)}</b>
     💰 ৳${item.price.toLocaleString()} × ${item.quantity} = <b>৳${lineTotal.toLocaleString()}</b>${linkTag ? `\n     🔗 ${linkTag}` : ""}`;
      }).join("\n──────────────────────\n")
    : "  ▫️ Details in Admin Panel";

  const timeString = new Date().toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateString = new Date().toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });

  const message = `🔔 <b>NEW ORDER RECEIVED!</b> 🎉
━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>#${escapeTgHtml(order.orderNumber)}</code>
⏰ <b>Time:</b> ${dateString} at ${timeString}
👤 <b>Customer:</b> <b>${escapeTgHtml(order.customerName)}</b>
📞 <b>Phone:</b> <code>${escapeTgHtml(order.phone)}</code>
${order.email ? `📧 <b>Email:</b> ${escapeTgHtml(order.email)}\n` : ""}📍 <b>Address:</b> ${escapeTgHtml(order.address)}, ${escapeTgHtml(order.city)}
💳 <b>Payment:</b> <b>${escapeTgHtml(order.paymentMethod.toUpperCase())}</b>
💰 <b>Total Amount:</b> <b>৳${order.total.toLocaleString()}</b>
⚡️ <b>Status:</b> ⏳ <b>PENDING CONFIRMATION</b>

🛒 <b>Ordered Items (${order.items?.length || 0}):</b>
${itemsList}`;

  const inlineKeyboard = buildOrderActionKeyboard(
    order.orderNumber,
    "pending",
    order.paymentMethod.toLowerCase().includes("cod") ? "pending" : "pending",
    order.phone,
    baseUrl
  );

  // Send to all authorized admin IDs (deduplicated)
  const targetChatIds = Array.from(new Set([
    primaryChatId,
    ...(config.admin_chat_ids || [])
  ])).filter(Boolean);

  let firstResult: any = { success: false };
  for (const cid of targetChatIds) {
    const res = await sendTelegramMessage(message, { bot_token: botToken, chat_id: String(cid) }, inlineKeyboard);
    if (!firstResult.success && res.success) {
      firstResult = res;
    }
  }

  if (firstResult.success) {
    try {
      setDoc(doc(db, "orders", order.orderNumber), {
        telegram_notified: true,
        telegram_notified_at: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    } catch {}
  }

  return firstResult;
}
