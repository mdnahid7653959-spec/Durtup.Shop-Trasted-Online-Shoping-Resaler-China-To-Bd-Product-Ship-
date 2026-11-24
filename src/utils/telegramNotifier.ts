import { db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { supabase } from "@/lib/firebaseAdapter";

export interface TelegramConfig {
  enabled: boolean;
  bot_token: string;
  chat_id: string;
}

export const DEFAULT_TELEGRAM_BOT_TOKEN = "9052891455:AAFjL5lmNWIgTBgrk-KN8gN3pY1ZNZYQhEI";
export const DEFAULT_TELEGRAM_CHAT_ID = "8204855335";

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
      body: JSON.stringify(payload)
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
  const chatId = config.chat_id || DEFAULT_TELEGRAM_CHAT_ID;
  const activeConfig = { ...config, bot_token: botToken, chat_id: chatId };

  const baseUrl = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://www.durtup.shop";

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
        return `  ▫️ <b>Item #${idx + 1}:</b> ${item.name}
     🆔 ID: <code>${pId || "N/A"}</code> | 🏢 Supplier: <b>${supplier}</b>
     💰 ৳${item.price.toLocaleString()} × ${item.quantity} = <b>৳${lineTotal.toLocaleString()}</b>${linkTag ? `\n     🔗 ${linkTag}` : ""}`;
      }).join("\n──────────────────────\n")
    : "  ▫️ Details in Admin Panel";

  const adminUrl = `${baseUrl}/admin/orders?id=${order.orderNumber}`;

  const timeString = new Date().toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateString = new Date().toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });

  const message = `🔔 <b>NEW ORDER RECEIVED!</b> 🎉
━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Order ID:</b> <code>#${order.orderNumber}</code>
⏰ <b>Time:</b> ${dateString} at ${timeString}
👤 <b>Customer:</b> <b>${order.customerName}</b>
📞 <b>Phone:</b> <code>${order.phone}</code>
${order.email ? `📧 <b>Email:</b> ${order.email}\n` : ""}📍 <b>Address:</b> ${order.address}, ${order.city}
💳 <b>Payment:</b> <b>${order.paymentMethod.toUpperCase()}</b>
💰 <b>Total Amount:</b> <b>৳${order.total.toLocaleString()}</b>
⚡️ <b>Status:</b> ⏳ <b>PENDING CONFIRMATION</b>

🛒 <b>Ordered Items (${order.items?.length || 0}):</b>
${itemsList}`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ APPROVE ORDER", callback_data: `order_approve:${order.orderNumber}` },
        { text: "❌ REJECT ORDER", callback_data: `order_reject:${order.orderNumber}` }
      ],
      [
        { text: "🌐 View in Admin Panel", url: adminUrl }
      ]
    ]
  };

  return sendTelegramMessage(message, activeConfig, inlineKeyboard);
}
