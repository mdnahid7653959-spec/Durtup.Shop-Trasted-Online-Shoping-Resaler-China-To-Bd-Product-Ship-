/**
 * src/server/telegram/modules/dashboardModule.ts
 * 16-Module Master Control Center for Durtup.shop
 */

import {
  InlineKeyboardMarkup,
  sendTelegramMessage,
  editTelegramMessageText,
  escapeHtml
} from "../telegramApi";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export interface DashboardRenderOptions {
  chatId: number | string;
  messageId?: number;
  userId: number;
  userName?: string;
  mode: "new" | "edit";
}

/**
 * 16-Module Interactive Inline Keyboard (2-column layout + 1 bottom utility row)
 * All callback_data strings are strictly <= 18 bytes (limit is 64 bytes).
 */
export function getDashboardKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "📊 Dashboard", callback_data: "dash:refresh" },
        { text: "📦 Orders", callback_data: "ord:list:pending:1" }
      ],
      [
        { text: "💳 Payments", callback_data: "pay:list:pending:1" },
        { text: "🛍️ Products", callback_data: "prod:list:1" }
      ],
      [
        { text: "⚠️ Inventory", callback_data: "inv:menu" },
        { text: "👥 Customers", callback_data: "cust:menu" }
      ],
      [
        { text: "🏭 Suppliers", callback_data: "supp:menu" },
        { text: "🏪 Sellers", callback_data: "sell:menu" }
      ],
      [
        { text: "🚚 Shipping", callback_data: "ship:menu" },
        { text: "🔄 Refunds", callback_data: "ref:list:1" }
      ],
      [
        { text: "🎟️ Coupons", callback_data: "coup:list:1" },
        { text: "⭐ Reviews/Q&A", callback_data: "rev:menu" }
      ],
      [
        { text: "🔔 Notifications", callback_data: "notif:menu" },
        { text: "📈 Analytics", callback_data: "stat:menu" }
      ],
      [
        { text: "⚙️ Settings", callback_data: "sett:menu" },
        { text: "🛡️ Security", callback_data: "sec:menu" }
      ],
      [
        { text: "🔄 Refresh Stats", callback_data: "dash:refresh" },
        { text: "🌐 Web Portal", url: "https://www.durtup.shop/admin" }
      ]
    ]
  };
}

let dbInstance: any = null;
function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyCIcvphAtwx7rup-aV3MZPDK0w-xCN1Xoc",
      authDomain: "eshop-app-6119d.firebaseapp.com",
      projectId: "eshop-app-6119d",
      storageBucket: "eshop-app-6119d.firebasestorage.app",
      messagingSenderId: "18064875571",
      appId: "1:18064875571:web:0cd166f0bc0446c7bc0346"
    };
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err: any) {
    return null;
  }
}

/**
 * Computes live or cached KPI metrics for the header.
 * When Firestore is disconnected or empty, returns zeros and isOffline = true.
 */
export async function getDashboardStats(): Promise<{
  pendingOrders: number;
  pendingPayments: number;
  totalProducts: number;
  lowStockCount: number;
  recentRevenue: number;
  isOffline: boolean;
}> {
  let pendingOrders = 0;
  let pendingPayments = 0;
  let totalProducts = 0;
  let lowStockCount = 0;
  let recentRevenue = 0;
  let isOffline = false;

  try {
    const db = getDb();
    if (db) {
      const queryPromise = getDocs(
        query(collection(db, "orders"), orderBy("created_at", "desc"), limit(50))
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore orders query timeout")), 2000)
      );
      const ordersSnap = (await Promise.race([queryPromise, timeoutPromise])) as any;
      ordersSnap.forEach((docSnap: any) => {
        const data = docSnap.data();
        const status = (data.status || "pending").toLowerCase();
        const payStatus = (data.payment_status || "pending").toLowerCase();
        const total = Number(data.total || data.total_price || data.total_amount || 0);

        if (status === "pending") pendingOrders++;
        if (payStatus === "pending" || payStatus === "pending_verification") pendingPayments++;
        if (status === "confirmed" || status === "delivered" || payStatus === "paid" || payStatus === "verified") {
          recentRevenue += total;
        }
      });
    } else {
      isOffline = true;
    }
  } catch (e) {
    // Graceful offline fallback: strictly zeroed metrics with offline indicator
    isOffline = true;
    pendingOrders = 0;
    pendingPayments = 0;
    totalProducts = 0;
    lowStockCount = 0;
    recentRevenue = 0;
  }

  return { pendingOrders, pendingPayments, totalProducts, lowStockCount, recentRevenue, isOffline };
}

/**
 * Builds the complete dashboard message text in Asia/Dhaka time.
 */
export async function getDashboardSummaryText(
  userName = "Super Admin",
  userId: number | string = 8204855335
): Promise<string> {
  const stats = await getDashboardStats();
  const dhakaTime = new Date().toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short"
  });

  const statusLine = stats.isOffline
    ? "🟡 <b>Status:</b> All 16 Modules Online (Firestore Offline / Zero State)"
    : "🟢 <b>Status:</b> All 16 Modules Online";

  const offlineSuffix = stats.isOffline ? " <i>(offline)</i>" : "";

  return `🏠 <b>DURTUP.SHOP — SUPER ADMIN CONTROL CENTER</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>Admin:</b> ${escapeHtml(userName)} <code>(${userId})</code>
🕒 <b>Dhaka Time:</b> ${dhakaTime} BST
${statusLine}

📊 <b>QUICK STORE OVERVIEW:</b>
• ⏳ <b>Pending Orders:</b> <code>${stats.pendingOrders}</code> awaiting confirmation${offlineSuffix}
• 💳 <b>Pending Payments:</b> <code>${stats.pendingPayments}</code> awaiting verification${offlineSuffix}
• 🛍️ <b>Catalog Products:</b> <code>${stats.totalProducts}</code> active items${offlineSuffix}
• ⚠️ <b>Low Stock Items:</b> <code>${stats.lowStockCount}</code> items &le; 10 pcs${offlineSuffix}
• 💰 <b>Sampled Revenue:</b> ৳${stats.recentRevenue.toLocaleString()}${offlineSuffix}

👇 <b>Select an administrative module below:</b>`;
}

/**
 * Renders or updates the master dashboard.
 */
export async function renderDashboard(options: DashboardRenderOptions): Promise<any> {
  const text = await getDashboardSummaryText(options.userName, options.userId);
  const keyboard = getDashboardKeyboard();

  if (options.mode === "edit" && options.messageId) {
    try {
      const editResult = await editTelegramMessageText({
        chat_id: options.chatId,
        message_id: options.messageId,
        text,
        reply_markup: keyboard
      });
      return editResult;
    } catch (err) {
      // Fallback if editMessageText fails (e.g. message too old or deleted)
      return await sendTelegramMessage({
        chat_id: options.chatId,
        text,
        reply_markup: keyboard
      });
    }
  } else {
    return await sendTelegramMessage({
      chat_id: options.chatId,
      text,
      reply_markup: keyboard
    });
  }
}
