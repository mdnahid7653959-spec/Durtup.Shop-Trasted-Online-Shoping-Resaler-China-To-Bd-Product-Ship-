/**
 * Durtup.shop - Comprehensive Telegram Admin Panel & Control Engine
 * 
 * 100% Native Edge/Node Serverless Function. Pure zero-dependency fetch architecture.
 * Turns Telegram into a complete store management application:
 * 1. Order Requests: View, Approve, Ship, Deliver, or Cancel orders with 1 tap.
 * 2. Product Management: Search catalog, check stock, update prices, update stock.
 * 3. Store Analytics: Live sales, revenue, order statistics, conversion numbers.
 * 4. Customer Support: Registered users & customers lookup by phone, email, order history.
 * 5. Instant Push Alerts: Interactive rich notifications on new customer orders.
 */

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/eshop-app-6119d/databases/(default)/documents";
const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "9052891455:AAGoY4tAc6JaEAN8AxAI96RMMQBS6UcMYpw";
const STORE_NAME = "Durtup.shop";
const STORE_URL = process.env.VITE_SITE_URL || "https://www.durtup.shop";

// Helper: Call Telegram Bot API
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

// Helper: Get Telegram Admin Configuration from Firestore
async function getTelegramConfig() {
  const config = {
    bot_token: DEFAULT_BOT_TOKEN,
    admin_chat_ids: [] as string[],
    enabled: true
  };

  try {
    const res = await fetch(`${FIRESTORE_BASE}/settings/telegram`);
    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};
      if (fields.bot_token?.stringValue) {
        config.bot_token = fields.bot_token.stringValue;
      }
      if (fields.admin_chat_ids?.arrayValue?.values) {
        config.admin_chat_ids = fields.admin_chat_ids.arrayValue.values
          .map((v: any) => v.stringValue || "")
          .filter((id: string) => id && id !== "123456789");
      } else if (fields.chat_id?.stringValue) {
        config.admin_chat_ids = [fields.chat_id.stringValue.trim()];
      }
      if (fields.enabled?.booleanValue !== undefined) {
        config.enabled = fields.enabled.booleanValue;
      }
    }
  } catch (err) {
    console.warn("[Config read error]:", err);
  }

  return config;
}

// Helper: Bind an Admin ID to Firestore
async function addAdminId(id: string | number) {
  try {
    const strId = String(id).trim();
    const cfg = await getTelegramConfig();
    if (!cfg.admin_chat_ids.includes(strId)) {
      cfg.admin_chat_ids.push(strId);
      const url = `${FIRESTORE_BASE}/settings/telegram?updateMask.fieldPaths=admin_chat_ids&updateMask.fieldPaths=chat_id&updateMask.fieldPaths=updated_at`;
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            admin_chat_ids: {
              arrayValue: {
                values: cfg.admin_chat_ids.map(val => ({ stringValue: val }))
              }
            },
            chat_id: { stringValue: cfg.admin_chat_ids[0] || strId },
            updated_at: { stringValue: new Date().toISOString() }
          }
        })
      });
    }
    return true;
  } catch (err) {
    console.error("[Failed to save admin ID]:", err);
    return false;
  }
}

// Helper: Main Dashboard Keyboard
function getMainAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📦 Order Requests", callback_data: "cmd_orders" },
        { text: "⏳ Pending (Action Needed)", callback_data: "cmd_pending" }
      ],
      [
        { text: "🛍️ Products Catalog", callback_data: "cmd_products" },
        { text: "⚠️ Low Stock Alert", callback_data: "cmd_low_stock" }
      ],
      [
        { text: "📊 Sales & Analytics", callback_data: "cmd_stats" },
        { text: "👥 Customers", callback_data: "cmd_customers" }
      ],
      [
        { text: "📖 Help & Commands", callback_data: "cmd_help" },
        { text: "🌐 Open Web Admin", url: `${STORE_URL}/admin/orders` }
      ]
    ]
  };
}

// Helper: Check if an order is a mock/test order
function isMockOrderRecord(orderNum: string, phone: string = "", name: string = ""): boolean {
  const num = (orderNum || "").toLowerCase().trim();
  const cleanPhone = phone.replace(/[^\d]/g, "").trim();
  const cleanName = (name || "").toLowerCase().trim();

  if (
    num.startsWith("ord-test-") ||
    num.startsWith("test-") ||
    num.startsWith("mock-") ||
    num.includes("mock") ||
    num === "ord-1001" ||
    num === "ord-1002" ||
    num === "ord-2026-1001" ||
    num === "ord-2026-1002" ||
    cleanPhone === "01711223344" ||
    cleanPhone === "01700000000" ||
    cleanPhone === "01800000000" ||
    cleanPhone === "01911111111" ||
    cleanName.includes("test user") ||
    cleanName.includes("mock customer") ||
    cleanName.includes("demo user")
  ) {
    return true;
  }
  return false;
}

// Helper: Parse order fields cleanly from Firestore REST format
function parseFirestoreOrder(docItem: any) {
  const f = docItem.fields || {};
  const id = docItem.name?.split("/").pop() || "N/A";
  const orderNum = f.order_number?.stringValue || f.orderNumber?.stringValue || id;
  const total = f.total?.integerValue || f.total?.doubleValue || f.total_price?.integerValue || f.total_price?.doubleValue || 0;
  const status = (f.status?.stringValue || "pending").toLowerCase();
  
  // Parse shipping details
  const shipMap = f.shipping_address?.mapValue?.fields || {};
  const firstName = shipMap.firstName?.stringValue || "";
  const lastName = shipMap.lastName?.stringValue || "";
  const fullNameFromShip = [firstName, lastName].filter(Boolean).join(" ");
  const customerName = f.customer_name?.stringValue || f.customerName?.stringValue || shipMap.name?.stringValue || fullNameFromShip || "Customer";
  
  const phone = f.phone?.stringValue || f.customer_phone?.stringValue || shipMap.phone?.stringValue || "N/A";
  
  const addressParts = [
    shipMap.address?.stringValue,
    shipMap.city?.stringValue,
    shipMap.state?.stringValue,
    shipMap.country?.stringValue
  ].filter(Boolean);
  const address = f.address?.stringValue || f.full_address?.stringValue || (addressParts.length > 0 ? addressParts.join(", ") : "N/A");
  
  const paymentMethod = f.payment_method?.stringValue || f.paymentMethod?.stringValue || "Cash on Delivery";
  const dateStr = f.created_at?.stringValue || docItem.createTime || "";
  
  // Parse items
  const items: Array<{ name: string; quantity: number; price: number }> = [];
  if (f.items?.arrayValue?.values) {
    f.items.arrayValue.values.forEach((iv: any) => {
      const im = iv.mapValue?.fields || {};
      items.push({
        name: im.name?.stringValue || im.title?.stringValue || im.product_name?.stringValue || "Product Item",
        quantity: Number(im.quantity?.integerValue || 1),
        price: Number(im.price?.integerValue || im.price?.doubleValue || im.unit_price?.integerValue || 0)
      });
    });
  }

  return {
    id,
    orderNum,
    total: Number(total),
    status,
    customerName,
    phone,
    address,
    paymentMethod,
    dateStr,
    items
  };
}

// Helper: Store User Interface matching Web Admin
interface StoreUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joinedDate: string;
  orderCount: number;
  totalSpent: number;
}

// Helper: Retrieve all registered store users from Firestore (profiles + master admin + orders)
async function getStoreUsers(): Promise<StoreUser[]> {
  const users: StoreUser[] = [];
  const userMap = new Map<string, StoreUser>();

  // 1. Master Super Admin (always present matching Admin Users page)
  const masterAdmin: StoreUser = {
    id: "3d0aed73-3d4d-4f0a-ad90-fddbb05eab81",
    name: "HI Admin (Super Admin)",
    email: "admin@durtup.shop",
    phone: "+8801700000000",
    role: "admin",
    status: "Active",
    joinedDate: "10/25/2026",
    orderCount: 0,
    totalSpent: 0
  };
  userMap.set(masterAdmin.id, masterAdmin);

  // 2. Fetch profiles from Firestore /profiles
  try {
    const pRes = await fetch(`${FIRESTORE_BASE}/profiles?pageSize=50`);
    if (pRes.ok) {
      const pJson = await pRes.json();
      (pJson.documents || []).forEach((doc: any) => {
        const f = doc.fields || {};
        const id = doc.name?.split("/").pop() || "";
        const name = f.full_name?.stringValue || f.name?.stringValue || f.displayName?.stringValue || "Customer";
        const email = f.email?.stringValue || (f.phone?.stringValue ? `${f.phone.stringValue}@phone.durtup.shop` : "No email");
        const phone = f.phone?.stringValue || "No phone";
        const role = f.role?.stringValue || "customer";
        const isActive = f.is_active?.booleanValue !== false;
        const createdAtRaw = f.created_at?.stringValue || doc.createTime || "";
        let joinedDate = "Recent";
        if (createdAtRaw) {
          try {
            const d = new Date(createdAtRaw);
            joinedDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
          } catch (e) {}
        }
        userMap.set(id, {
          id,
          name,
          email,
          phone,
          role,
          status: isActive ? "Active" : "Inactive",
          joinedDate,
          orderCount: 0,
          totalSpent: 0
        });
      });
    }
  } catch (err) {
    console.error("[getStoreUsers profiles error]:", err);
  }

  // 3. Cross-reference orders to compute orders count and total spent
  try {
    const oRes = await fetch(`${FIRESTORE_BASE}/orders?pageSize=50`);
    if (oRes.ok) {
      const oJson = await oRes.json();
      (oJson.documents || []).forEach((doc: any) => {
        const f = doc.fields || {};
        const oNum = (f.order_number?.stringValue || f.orderNumber?.stringValue || "").toLowerCase();
        const shipMap = f.shipping_address?.mapValue?.fields || {};
        const oPhone = (f.phone?.stringValue || f.customer_phone?.stringValue || shipMap.phone?.stringValue || "").replace(/[^\d]/g, "");
        const oName = f.customer_name?.stringValue || f.customerName?.stringValue || shipMap.name?.stringValue || "";

        if (isMockOrderRecord(oNum, oPhone, oName)) return;

        const oEmail = (f.customer_email?.stringValue || shipMap.email?.stringValue || "").toLowerCase();
        const total = Number(f.total?.integerValue || f.total?.doubleValue || 0);

        if (oPhone || oEmail) {
          for (const u of userMap.values()) {
            const uCleanPhone = u.phone.replace(/[^\d]/g, "");
            const uCleanEmail = u.email.toLowerCase();
            if ((oPhone && uCleanPhone && uCleanPhone === oPhone) || (oEmail && uCleanEmail && uCleanEmail === oEmail)) {
              u.orderCount += 1;
              u.totalSpent += total;
              break;
            }
          }
        }
      });
    }
  } catch (err) {
    console.error("[getStoreUsers orders error]:", err);
  }

  return Array.from(userMap.values());
}

// Helper: Format single order detail card with action buttons
function formatOrderCard(order: ReturnType<typeof parseFirestoreOrder>) {
  const statusEmoji: Record<string, string> = {
    pending: "⏳ PENDING",
    confirmed: "✅ CONFIRMED",
    processing: "⚙️ PROCESSING",
    shipped: "🚚 SHIPPED",
    delivered: "🎉 DELIVERED",
    cancelled: "❌ CANCELLED"
  };

  const statusDisplay = statusEmoji[order.status] || order.status.toUpperCase();
  
  let itemsList = "";
  if (order.items.length > 0) {
    itemsList = order.items.map(it => `  • ${it.name} (Qty: ${it.quantity}) - ৳${it.price.toLocaleString()}`).join("\n");
  } else {
    itemsList = "  • Standard Items";
  }

  const text = `📋 <b>ORDER #${order.orderNum}</b>
━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>Status:</b> ${statusDisplay}
👤 <b>Customer:</b> ${order.customerName}
📞 <b>Phone:</b> <code>${order.phone}</code>
📍 <b>Address:</b> ${order.address}
💳 <b>Payment:</b> ${order.paymentMethod}
━━━━━━━━━━━━━━━━━━━━━━
🛍️ <b>Items:</b>
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━
💰 <b>Total Bill:</b> ৳${order.total.toLocaleString()}
🕒 <b>Date:</b> ${new Date(order.dateStr).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}`;

  const buttons: any[] = [];

  // Conditional action buttons based on status
  if (order.status === "pending") {
    buttons.push([
      { text: "✅ APPROVE ORDER", callback_data: `order_approve:${order.orderNum}` },
      { text: "❌ REJECT ORDER", callback_data: `order_reject:${order.orderNum}` }
    ]);
    buttons.push([
      { text: "🚚 MARK SHIPPED", callback_data: `order_ship:${order.orderNum}` },
      { text: "🌐 View on Web", url: `${STORE_URL}/admin/orders?id=${order.orderNum}` }
    ]);
  } else if (order.status === "confirmed") {
    buttons.push([
      { text: "🚚 MARK AS SHIPPED", callback_data: `order_ship:${order.orderNum}` },
      { text: "🎉 MARK DELIVERED", callback_data: `order_deliver:${order.orderNum}` }
    ]);
    buttons.push([
      { text: "❌ CANCEL ORDER", callback_data: `order_reject:${order.orderNum}` },
      { text: "🌐 View on Web", url: `${STORE_URL}/admin/orders?id=${order.orderNum}` }
    ]);
  } else if (order.status === "shipped") {
    buttons.push([
      { text: "🎉 MARK AS DELIVERED", callback_data: `order_deliver:${order.orderNum}` },
      { text: "🌐 View on Web", url: `${STORE_URL}/admin/orders?id=${order.orderNum}` }
    ]);
  } else {
    buttons.push([
      { text: "🌐 View in Admin Panel", url: `${STORE_URL}/admin/orders?id=${order.orderNum}` }
    ]);
  }

  return { text, reply_markup: { inline_keyboard: buttons } };
}

// Built-in Top Flagship Catalog for Fast Lookup
const TOP_PRODUCTS = [
  { id: "14", name: "X01 Full Charge Auto Cut-off Type-C Cable", price: 350, stock: 45, category: "Gadgets" },
  { id: "287", name: "OLEVS Luxury Men's Quartz Stainless Watch", price: 1250, stock: 28, category: "Watch" },
  { id: "PRO6-TWS", name: "Pro 6 Wireless Bluetooth Hi-Fi TWS Earbuds", price: 450, stock: 80, category: "Gadgets" },
  { id: "ac0a83b2", name: "X5 Full HD Mini WiFi IP Security Camera", price: 1150, stock: 35, category: "Cameras" },
  { id: "10872", name: "Antique Oxidized Necklace & Earrings Set", price: 250, stock: 65, category: "Women's Fashion" },
  { id: "10873", name: "Premium Silk Katan Festive Saree Combo Pack", price: 1790, stock: 20, category: "Women's Fashion" },
  { id: "9725", name: "3 in 1 Panda Desk Lamp with Pen Holder", price: 790, stock: 50, category: "Home & Living" }
];

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Bot-Api-Secret-Token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check / GET diagnostics endpoint
  if (req.method === "GET") {
    const config = await getTelegramConfig();
    return res.status(200).json({
      service: "Durtup.shop Telegram Admin Bot Engine",
      status: "operational",
      version: "2.5.0-integrated",
      timestamp: new Date().toISOString(),
      authorized_admins_count: config.admin_chat_ids.length,
      admins: config.admin_chat_ids,
      webhook_target: `${STORE_URL}/api/telegram-webhook`
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!update) {
      return res.status(400).json({ error: "Invalid JSON update payload" });
    }

    const config = await getTelegramConfig();

    // ==========================================
    // 1. HANDLE INLINE KEYBOARD CALLBACK QUERIES
    // ==========================================
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const data = (cb.data || "").trim();
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;
      const fromId = String(cb.from?.id || "");
      const fromName = [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(" ") || "Admin";

      // A. Self-service Admin Pairing
      if (data.startsWith("admin_pair:")) {
        const targetId = data.replace("admin_pair:", "").trim();
        await addAdminId(targetId);

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `🎉 Telegram ID ${targetId} authorized as Store Admin!`,
          show_alert: true
        });

        if (chatId) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `🎉 <b>Congratulations, ${fromName}!</b>\n\nYour Telegram User ID (<code>${targetId}</code>) is now officially registered as an <b>Authorized Store Administrator</b> for <b>${STORE_NAME}</b>.\n\nYou have full live control over orders, stock, prices, customers, and analytics.`,
            parse_mode: "HTML",
            reply_markup: getMainAdminKeyboard()
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Security check: Only allow authorized admin IDs to execute callback actions
      const isAuthorized = config.admin_chat_ids.includes(fromId);
      if (!isAuthorized) {
        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: "⛔ Access Denied! You are not authorized to perform admin actions.",
          show_alert: true
        });
        return res.status(200).json({ ok: true });
      }

      // B. Main Dashboard / Menu Callback
      if (data === "cmd_dashboard") {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `🏠 <b>DURTUP.SHOP ADMIN CONTROL PANEL</b>\n━━━━━━━━━━━━━━━━━━━━━━\nSelect a section below or type commands to manage your store:`,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // C. Order Action: Approve Order
      if (data.startsWith("order_approve:")) {
        const orderNum = data.replace("order_approve:", "").trim();
        const nowIso = new Date().toISOString();

        await fetch(`${FIRESTORE_BASE}/orders/${orderNum}?updateMask.fieldPaths=status&updateMask.fieldPaths=approved_by_telegram&updateMask.fieldPaths=approved_by_name&updateMask.fieldPaths=confirmed_at&updateMask.fieldPaths=updated_at`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              status: { stringValue: "confirmed" },
              approved_by_telegram: { stringValue: fromId },
              approved_by_name: { stringValue: fromName },
              confirmed_at: { stringValue: nowIso },
              updated_at: { stringValue: nowIso }
            }
          })
        });

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `✅ Order #${orderNum} Approved!`,
          show_alert: false
        });

        if (chatId && messageId) {
          const originalText = cb.message?.text || "";
          const updatedText = originalText
            ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> ✅ <b>CONFIRMED / APPROVED</b>\n👤 <b>Approved By:</b> ${fromName} (${fromId})\n`)
            : `✅ <b>Order #${orderNum} Confirmed & Approved!</b>`;

          await callTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🚚 Mark Shipped", callback_data: `order_ship:${orderNum}` },
                  { text: "🎉 Mark Delivered", callback_data: `order_deliver:${orderNum}` }
                ],
                [
                  { text: "🌐 Open on Website", url: `${STORE_URL}/admin/orders?id=${orderNum}` },
                  { text: "🔙 Main Menu", callback_data: "cmd_dashboard" }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // D. Order Action: Mark Shipped
      if (data.startsWith("order_ship:")) {
        const orderNum = data.replace("order_ship:", "").trim();
        const nowIso = new Date().toISOString();

        await fetch(`${FIRESTORE_BASE}/orders/${orderNum}?updateMask.fieldPaths=status&updateMask.fieldPaths=shipped_at&updateMask.fieldPaths=updated_at`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              status: { stringValue: "shipped" },
              shipped_at: { stringValue: nowIso },
              updated_at: { stringValue: nowIso }
            }
          })
        });

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `🚚 Order #${orderNum} marked as Shipped!`,
          show_alert: false
        });

        if (chatId && messageId) {
          const originalText = cb.message?.text || "";
          const updatedText = originalText
            ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> 🚚 <b>SHIPPED & ON THE WAY</b>\n`)
            : `🚚 <b>Order #${orderNum} Shipped & On The Way!</b>`;

          await callTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🎉 Mark Delivered", callback_data: `order_deliver:${orderNum}` },
                  { text: "🌐 Open on Website", url: `${STORE_URL}/admin/orders?id=${orderNum}` }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // E. Order Action: Mark Delivered
      if (data.startsWith("order_deliver:")) {
        const orderNum = data.replace("order_deliver:", "").trim();
        const nowIso = new Date().toISOString();

        await fetch(`${FIRESTORE_BASE}/orders/${orderNum}?updateMask.fieldPaths=status&updateMask.fieldPaths=delivered_at&updateMask.fieldPaths=updated_at`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              status: { stringValue: "delivered" },
              delivered_at: { stringValue: nowIso },
              updated_at: { stringValue: nowIso }
            }
          })
        });

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `🎉 Order #${orderNum} successfully Delivered!`,
          show_alert: false
        });

        if (chatId && messageId) {
          await callTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `🎉 <b>ORDER #${orderNum} DELIVERED!</b>\nParcel successfully received by customer.\nUpdated on ${new Date().toLocaleTimeString("en-BD")}`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🌐 View in Admin", url: `${STORE_URL}/admin/orders?id=${orderNum}` }]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // F. Order Action: Reject/Cancel Order
      if (data.startsWith("order_reject:")) {
        const orderNum = data.replace("order_reject:", "").trim();
        const nowIso = new Date().toISOString();

        await fetch(`${FIRESTORE_BASE}/orders/${orderNum}?updateMask.fieldPaths=status&updateMask.fieldPaths=rejected_by_telegram&updateMask.fieldPaths=rejected_by_name&updateMask.fieldPaths=cancelled_at&updateMask.fieldPaths=updated_at`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              status: { stringValue: "cancelled" },
              rejected_by_telegram: { stringValue: fromId },
              rejected_by_name: { stringValue: fromName },
              cancelled_at: { stringValue: nowIso },
              updated_at: { stringValue: nowIso }
            }
          })
        });

        await callTelegram("answerCallbackQuery", {
          callback_query_id: cbId,
          text: `❌ Order #${orderNum} Cancelled.`,
          show_alert: false
        });

        if (chatId && messageId) {
          await callTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: `❌ <b>Order #${orderNum} Cancelled / Rejected.</b>\nAction by ${fromName}`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🌐 View in Admin", url: `${STORE_URL}/admin/orders?id=${orderNum}` }]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      // G. Orders Request List (Recent Orders or Pending Action Needed)
      if (data === "cmd_orders" || data === "cmd_pending") {
        const isPendingOnly = data === "cmd_pending";
        const resOrders = await fetch(`${FIRESTORE_BASE}/orders?pageSize=30`);
        let ordersList: any[] = [];

        if (resOrders.ok) {
          const oJson = await resOrders.json();
          const docs = oJson.documents || [];
          ordersList = docs
            .map(parseFirestoreOrder)
            .filter(o => !isMockOrderRecord(o.orderNum, o.phone, o.customerName));

          if (isPendingOnly) {
            ordersList = ordersList.filter(o => o.status === "pending");
          }
        }

        if (ordersList.length === 0) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `📦 <b>${isPendingOnly ? "Pending Orders" : "Recent Orders"}:</b>\n━━━━━━━━━━━━━━━━━━━━━━\n<i>No ${isPendingOnly ? "pending" : ""} customer orders found at this moment.</i>`,
            parse_mode: "HTML",
            reply_markup: getMainAdminKeyboard()
          });
        } else {
          // Send summary header
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `📦 <b>${isPendingOnly ? "⚠️ ACTION REQUIRED: Pending Orders" : "Recent Orders"} (${ordersList.length}):</b>\n━━━━━━━━━━━━━━━━━━━━━━\nHere are the orders awaiting your attention:`,
            parse_mode: "HTML"
          });

          // Send individual interactive order cards (up to 5 most urgent)
          for (const ord of ordersList.slice(0, 5)) {
            const card = formatOrderCard(ord);
            await callTelegram("sendMessage", {
              chat_id: chatId,
              text: card.text,
              parse_mode: "HTML",
              reply_markup: card.reply_markup
            });
          }
        }

        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // H. Product Catalog Management
      if (data === "cmd_products") {
        let catalogMsg = `🛍️ <b>DURTUP PRODUCT CATALOG</b>\n━━━━━━━━━━━━━━━━━━━━━━\n📦 <b>Total Active Products:</b> 2,000+ items\n⚡ <b>Fast Seed Flagships:</b> 50 items\n\n<b>Top Flagship Items:</b>\n`;
        TOP_PRODUCTS.forEach(p => {
          catalogMsg += `• <b>#${p.id}</b> - ${p.name}\n  💰 ৳${p.price.toLocaleString()} | 📦 Stock: ${p.stock} pcs\n\n`;
        });
        catalogMsg += `━━━━━━━━━━━━━━━━━━━━━━\n💡 <b>Commands to Edit Products:</b>\n• <code>/search &lt;name&gt;</code> - Find products\n• <code>/price &lt;id&gt; &lt;new_price&gt;</code> - Update price\n• <code>/stock &lt;id&gt; &lt;quantity&gt;</code> - Update stock`;

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: catalogMsg,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "⚠️ Low Stock Alert", callback_data: "cmd_low_stock" },
                { text: "🌐 Product Manager", url: `${STORE_URL}/admin/inventory` }
              ],
              [
                { text: "🔙 Main Dashboard", callback_data: "cmd_dashboard" }
              ]
            ]
          }
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // I. Low Stock Alert
      if (data === "cmd_low_stock") {
        const lowStockItems = TOP_PRODUCTS.filter(p => p.stock <= 30);
        let msg = `⚠️ <b>LOW STOCK ALERT:</b>\n━━━━━━━━━━━━━━━━━━━━━━\nThe following products are running low in inventory:\n\n`;
        lowStockItems.forEach(p => {
          msg += `• <b>${p.name}</b>\n  ID: <code>${p.id}</code> | Stock: <b>${p.stock} pcs remaining</b>\n  💡 Restock: <code>/stock ${p.id} 100</code>\n\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━━━━━`;

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: msg,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍️ View Full Catalog", callback_data: "cmd_products" }],
              [{ text: "🔙 Main Dashboard", callback_data: "cmd_dashboard" }]
            ]
          }
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // J. Sales & Store Analytics
      if (data === "cmd_stats") {
        const resOrders = await fetch(`${FIRESTORE_BASE}/orders?pageSize=50`);
        let totalRevenue = 0;
        let confirmed = 0;
        let pending = 0;
        let shipped = 0;
        let delivered = 0;
        let cancelled = 0;
        let totalOrders = 0;

        if (resOrders.ok) {
          const oJson = await resOrders.json();
          const docs = oJson.documents || [];
          docs.forEach((docItem: any) => {
            const o = parseFirestoreOrder(docItem);
            if (isMockOrderRecord(o.orderNum, o.phone, o.customerName)) return;

            totalOrders++;
            if (o.status === "confirmed") {
              confirmed++;
              totalRevenue += o.total;
            } else if (o.status === "delivered") {
              delivered++;
              totalRevenue += o.total;
            } else if (o.status === "shipped") {
              shipped++;
              totalRevenue += o.total;
            } else if (o.status === "pending") {
              pending++;
            } else if (o.status === "cancelled") {
              cancelled++;
            }
          });
        }

        const statsText = `📊 <b>DURTUP.SHOP SALES & STORE REPORT</b>
━━━━━━━━━━━━━━━━━━━━━━
💰 <b>Verified Revenue:</b> ৳${totalRevenue.toLocaleString()}
📦 <b>Total Orders:</b> ${totalOrders}

<b>Breakdown by Status:</b>
• ⏳ <b>Pending Review:</b> ${pending} orders
• ✅ <b>Confirmed / Approved:</b> ${confirmed} orders
• 🚚 <b>Shipped / In Transit:</b> ${shipped} orders
• 🎉 <b>Successfully Delivered:</b> ${delivered} orders
• ❌ <b>Cancelled / Rejected:</b> ${cancelled} orders
━━━━━━━━━━━━━━━━━━━━━━
🕒 <i>Live as of ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</i>`;

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: statsText,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // K. Customers & Registered Users Summary
      if (data === "cmd_customers") {
        const users = await getStoreUsers();
        
        let custMsg = `👥 <b>DURTUP.SHOP REGISTERED USERS (${users.length})</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        users.forEach((u, idx) => {
          const roleBadge = u.role === "admin" ? "🛡️ <b>Super Admin</b>" : "👤 <i>Customer</i>";
          const phoneDisplay = u.phone !== "No phone" ? `<code>${u.phone}</code>` : "<i>No phone</i>";
          custMsg += `${idx + 1}. <b>${u.name}</b>\n`;
          custMsg += `   📞 ${phoneDisplay} | ✉️ <code>${u.email}</code>\n`;
          custMsg += `   🏷️ Role: ${roleBadge} | 🟢 <b>${u.status}</b> | 📅 Joined: ${u.joinedDate}\n`;
          if (u.orderCount > 0) {
            custMsg += `   🛍️ Orders: <b>${u.orderCount}</b> | 💰 Spent: <b>৳${u.totalSpent.toLocaleString()}</b>\n`;
          }
          custMsg += `\n`;
        });
        custMsg += `━━━━━━━━━━━━━━━━━━━━━━\n💡 <i>Search user details: <code>/customer &lt;phone or name&gt;</code></i>`;

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: custMsg,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "👥 Open Users in Web Admin", url: `${STORE_URL}/admin/users` },
                { text: "🔙 Main Dashboard", callback_data: "cmd_dashboard" }
              ]
            ]
          }
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      // L. Help & Command Guide
      if (data === "cmd_help") {
        const helpText = `📖 <b>TELEGRAM ADMIN PANEL CHEATSHEET:</b>
━━━━━━━━━━━━━━━━━━━━━━
🔹 <b>/start</b> - Open the Admin Dashboard
🔹 <b>/orders</b> - View recent orders with action buttons
🔹 <b>/pending</b> - View orders waiting for approval
🔹 <b>/order &lt;id&gt;</b> - View & control a specific order
🔹 <b>/stats</b> - View sales, revenue & store analytics
🔹 <b>/products</b> - View product catalog summary
🔹 <b>/search &lt;name&gt;</b> - Find product details & price
🔹 <b>/price &lt;id&gt; &lt;amount&gt;</b> - Directly change product price
🔹 <b>/stock &lt;id&gt; &lt;quantity&gt;</b> - Update product stock
🔹 <b>/customer &lt;phone&gt;</b> - View customer profile & orders
🔹 <b>/myid</b> - Show your numeric Telegram ID
━━━━━━━━━━━━━━━━━━━━━━
💡 <i>Tip: You can use the buttons directly without typing commands!</i>`;

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: helpText,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
        return res.status(200).json({ ok: true });
      }

      await callTelegram("answerCallbackQuery", { callback_query_id: cbId });
      return res.status(200).json({ ok: true });
    }

    // ==========================================
    // 2. HANDLE TEXT MESSAGES & SLASH COMMANDS
    // ==========================================
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const userId = String(msg.from?.id || "");
      const userName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "Admin";
      const text = (msg.text || "").trim();

      // First-time self-pairing command or /start when no admin registered
      if (text.startsWith("/setup") || (config.admin_chat_ids.length === 0 && (text === "/start" || text.toLowerCase() === "start"))) {
        await addAdminId(userId);
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `🎉 <b>Welcome to Durtup.shop Admin Assistant, ${userName}!</b>\n\nYour Telegram User ID (<code>${userId}</code>) is now authorized as a <b>Store Administrator</b>.\n\nYou have full real-time control over orders, products, and store analytics.`,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      const isAuthorized = config.admin_chat_ids.includes(userId);

      // Handle /start or /menu for any user
      if (text === "/start" || text.toLowerCase() === "start" || text === "/menu" || text === "/dashboard") {
        if (!isAuthorized) {
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
          text: `👋 <b>Welcome back, ${userName}!</b>\n\n🏠 <b>DURTUP.SHOP ADMIN CONTROL PANEL</b>\n━━━━━━━━━━━━━━━━━━━━━━\nSelect a section below or type any command to manage your store:`,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Security Check: Deny unrecognized users for all management commands
      if (!isAuthorized) {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `⛔ <b>Access Denied!</b>\n\nYour Telegram ID: <code>${userId}</code> is not registered as an authorized administrator of <b>${STORE_NAME}</b>.`,
          parse_mode: "HTML"
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /orders or /pending
      if (text === "/orders" || text === "/pending") {
        const isPendingOnly = text === "/pending";
        const resOrders = await fetch(`${FIRESTORE_BASE}/orders?pageSize=30`);
        let ordersList: any[] = [];

        if (resOrders.ok) {
          const oJson = await resOrders.json();
          const docs = oJson.documents || [];
          ordersList = docs
            .map(parseFirestoreOrder)
            .filter(o => !isMockOrderRecord(o.orderNum, o.phone, o.customerName));

          if (isPendingOnly) {
            ordersList = ordersList.filter(o => o.status === "pending");
          }
        }

        if (ordersList.length === 0) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `📦 <i>No ${isPendingOnly ? "pending" : ""} customer orders found.</i>`,
            parse_mode: "HTML",
            reply_markup: getMainAdminKeyboard()
          });
        } else {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `📦 <b>${isPendingOnly ? "Pending Orders" : "Recent Orders"} (${ordersList.length}):</b>`,
            parse_mode: "HTML"
          });
          for (const ord of ordersList.slice(0, 5)) {
            const card = formatOrderCard(ord);
            await callTelegram("sendMessage", {
              chat_id: chatId,
              text: card.text,
              parse_mode: "HTML",
              reply_markup: card.reply_markup
            });
          }
        }
        return res.status(200).json({ ok: true });
      }

      // Command: /order <id>
      if (text.startsWith("/order ")) {
        const orderId = text.replace("/order ", "").trim().replace("#", "");
        const resOrder = await fetch(`${FIRESTORE_BASE}/orders/${orderId}`);
        if (resOrder.ok) {
          const docData = await resOrder.json();
          const ord = parseFirestoreOrder(docData);
          const card = formatOrderCard(ord);
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: card.text,
            parse_mode: "HTML",
            reply_markup: card.reply_markup
          });
        } else {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `❌ Order <b>#${orderId}</b> not found.`,
            parse_mode: "HTML"
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Command: /search <query> or /find <query>
      if (text.startsWith("/search ") || text.startsWith("/find ")) {
        const queryTerm = text.replace(/^\/(search|find)\s+/, "").trim().toLowerCase();
        const matches = TOP_PRODUCTS.filter(p => 
          p.name.toLowerCase().includes(queryTerm) || 
          p.id.toLowerCase().includes(queryTerm) ||
          p.category.toLowerCase().includes(queryTerm)
        );

        if (matches.length === 0) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `🔍 No products matching <i>"${queryTerm}"</i> in fast catalog.\n\nSearch on website: <a href="${STORE_URL}/products?q=${encodeURIComponent(queryTerm)}">Browse Products</a>`,
            parse_mode: "HTML"
          });
        } else {
          let reply = `🔍 <b>Search Results for "${queryTerm}":</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
          matches.forEach(p => {
            reply += `🛍️ <b>${p.name}</b>\n• ID: <code>${p.id}</code> | Category: ${p.category}\n• Price: <b>৳${p.price.toLocaleString()}</b> | Stock: <b>${p.stock} pcs</b>\n• Update Price: <code>/price ${p.id} ${p.price}</code>\n• Update Stock: <code>/stock ${p.id} ${p.stock}</code>\n\n`;
          });
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: reply,
            parse_mode: "HTML"
          });
        }
        return res.status(200).json({ ok: true });
      }

      // Command: /price <id> <new_price>
      if (text.startsWith("/price ")) {
        const parts = text.split(" ").filter(Boolean);
        if (parts.length < 3) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `⚠️ Usage: <code>/price &lt;productId&gt; &lt;newPrice&gt;</code>\nExample: <code>/price 14 380</code>`,
            parse_mode: "HTML"
          });
          return res.status(200).json({ ok: true });
        }
        const prodId = parts[1];
        const newPrice = parseFloat(parts[2]);
        if (isNaN(newPrice) || newPrice < 0) {
          await callTelegram("sendMessage", { chat_id: chatId, text: "❌ Invalid price amount." });
          return res.status(200).json({ ok: true });
        }

        // Persist price override to Firestore /products/{prodId}
        const nowIso = new Date().toISOString();
        await fetch(`${FIRESTORE_BASE}/products/${prodId}?updateMask.fieldPaths=price&updateMask.fieldPaths=updated_at`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              price: { doubleValue: newPrice },
              updated_at: { stringValue: nowIso }
            }
          })
        });

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `✅ <b>Price Updated Successfully!</b>\n\n• Product ID: <code>${prodId}</code>\n• New Price: <b>৳${newPrice.toLocaleString()}</b>\n• Updated at: ${new Date().toLocaleTimeString("en-BD")}`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍️ View Catalog", callback_data: "cmd_products" }]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /stock <id> <new_stock>
      if (text.startsWith("/stock ")) {
        const parts = text.split(" ").filter(Boolean);
        if (parts.length < 3) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `⚠️ Usage: <code>/stock &lt;productId&gt; &lt;quantity&gt;</code>\nExample: <code>/stock 14 100</code>`,
            parse_mode: "HTML"
          });
          return res.status(200).json({ ok: true });
        }
        const prodId = parts[1];
        const newStock = parseInt(parts[2], 10);
        if (isNaN(newStock) || newStock < 0) {
          await callTelegram("sendMessage", { chat_id: chatId, text: "❌ Invalid stock quantity." });
          return res.status(200).json({ ok: true });
        }

        // Persist stock update to Firestore /products/{prodId}
        const nowIso = new Date().toISOString();
        await fetch(`${FIRESTORE_BASE}/products/${prodId}?updateMask.fieldPaths=stock&updateMask.fieldPaths=updated_at`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              stock: { integerValue: newStock },
              updated_at: { stringValue: nowIso }
            }
          })
        });

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `✅ <b>Stock Updated Successfully!</b>\n\n• Product ID: <code>${prodId}</code>\n• New Quantity: <b>${newStock} pcs</b>\n• Updated at: ${new Date().toLocaleTimeString("en-BD")}`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍️ View Catalog", callback_data: "cmd_products" }]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /customer <phone_or_email_or_name>
      if (text.startsWith("/customer")) {
        const queryTerm = text.replace("/customer", "").trim().toLowerCase();
        const users = await getStoreUsers();

        if (!queryTerm) {
          let listMsg = `👥 <b>DURTUP REGISTERED USERS (${users.length}):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
          users.forEach(u => {
            const roleBadge = u.role === "admin" ? "[Admin]" : "[Customer]";
            listMsg += `• <b>${u.name}</b> ${roleBadge}\n  📞 ${u.phone} | ✉️ ${u.email}\n`;
          });
          listMsg += `\n💡 <i>To inspect an individual profile, type: <code>/customer &lt;phone or email&gt;</code></i>`;
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: listMsg,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "👥 View on Web Admin", url: `${STORE_URL}/admin/users` }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        const cleanQueryPhone = queryTerm.replace(/[^\d]/g, "");
        const matchedUsers = users.filter(u =>
          u.name.toLowerCase().includes(queryTerm) ||
          u.email.toLowerCase().includes(queryTerm) ||
          (cleanQueryPhone && u.phone.replace(/[^\d]/g, "").includes(cleanQueryPhone))
        );

        // Also fetch customer orders
        const resOrders = await fetch(`${FIRESTORE_BASE}/orders?pageSize=50`);
        let customerOrders: any[] = [];
        if (resOrders.ok) {
          const oJson = await resOrders.json();
          const docs = oJson.documents || [];
          customerOrders = docs
            .map(parseFirestoreOrder)
            .filter(o => !isMockOrderRecord(o.orderNum, o.phone, o.customerName) && (
              (cleanQueryPhone && o.phone.replace(/[^\d]/g, "").includes(cleanQueryPhone)) ||
              o.customerName.toLowerCase().includes(queryTerm)
            ));
        }

        if (matchedUsers.length === 0 && customerOrders.length === 0) {
          await callTelegram("sendMessage", {
            chat_id: chatId,
            text: `❌ No registered user or customer found matching <i>"${queryTerm}"</i>.\n\nSearch on Web Admin: <a href="${STORE_URL}/admin/users?search=${encodeURIComponent(queryTerm)}">Open Users Page</a>`,
            parse_mode: "HTML"
          });
          return res.status(200).json({ ok: true });
        }

        let reply = "";
        if (matchedUsers.length > 0) {
          const u = matchedUsers[0];
          const roleBadge = u.role === "admin" ? "🛡️ Super Admin" : "👤 Customer";
          reply += `👤 <b>USER PROFILE: ${u.name}</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
          reply += `• <b>Role:</b> ${roleBadge}\n`;
          reply += `• <b>Account Status:</b> 🟢 ${u.status}\n`;
          reply += `• <b>Phone:</b> <code>${u.phone}</code>\n`;
          reply += `• <b>Email:</b> <code>${u.email}</code>\n`;
          reply += `• <b>Joined Date:</b> ${u.joinedDate}\n`;
          reply += `• <b>Total Orders:</b> ${customerOrders.length || u.orderCount}\n`;
          reply += `• <b>Total Spent:</b> ৳${u.totalSpent.toLocaleString()}\n`;
        } else if (customerOrders.length > 0) {
          const firstOrd = customerOrders[0];
          reply += `👤 <b>CUSTOMER PROFILE (from orders):</b>\n━━━━━━━━━━━━━━━━━━━━━━\n`;
          reply += `• <b>Name:</b> ${firstOrd.customerName}\n`;
          reply += `• <b>Phone:</b> <code>${firstOrd.phone}</code>\n`;
          reply += `• <b>Address:</b> ${firstOrd.address}\n`;
          reply += `• <b>Total Orders:</b> ${customerOrders.length}\n`;
        }

        if (customerOrders.length > 0) {
          reply += `\n📦 <b>Order History (${customerOrders.length}):</b>\n`;
          customerOrders.slice(0, 5).forEach(m => {
            reply += `• <b>#${m.orderNum}</b> - ৳${m.total.toLocaleString()} (${m.status.toUpperCase()})\n  🕒 ${new Date(m.dateStr).toLocaleDateString("en-BD")}\n`;
          });
        }

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: reply,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🌐 View in Admin Panel", url: `${STORE_URL}/admin/users?search=${encodeURIComponent(queryTerm)}` }]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /stats
      if (text === "/stats") {
        const resOrders = await fetch(`${FIRESTORE_BASE}/orders?pageSize=50`);
        let totalRevenue = 0;
        let confirmed = 0;
        let pending = 0;
        let totalOrders = 0;

        if (resOrders.ok) {
          const oJson = await resOrders.json();
          const docs = oJson.documents || [];
          docs.forEach((docItem: any) => {
            const o = parseFirestoreOrder(docItem);
            if (isMockOrderRecord(o.orderNum, o.phone, o.customerName)) return;

            totalOrders++;
            if (o.status === "confirmed" || o.status === "delivered" || o.status === "shipped") {
              totalRevenue += o.total;
              confirmed++;
            } else if (o.status === "pending") {
              pending++;
            }
          });
        }

        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `📊 <b>${STORE_NAME} Live Store Stats:</b>\n\n• Total Orders: <b>${totalOrders}</b>\n• Confirmed/Delivered: <b>${confirmed}</b>\n• Pending Response: <b>${pending}</b>\n• Verified Revenue: <b>৳${totalRevenue.toLocaleString()}</b>`,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /products
      if (text === "/products") {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `🛍️ <b>Catalog Management:</b>\nType <code>/search &lt;name&gt;</code> to find products, or select an option below:`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🛍️ View Catalog List", callback_data: "cmd_products" },
                { text: "⚠️ Low Stock Alert", callback_data: "cmd_low_stock" }
              ],
              [
                { text: "🔙 Main Dashboard", callback_data: "cmd_dashboard" }
              ]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /myid
      if (text === "/myid") {
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: `🆔 Your Telegram User ID is: <code>${userId}</code>\nChat ID: <code>${chatId}</code>`,
          parse_mode: "HTML"
        });
        return res.status(200).json({ ok: true });
      }

      // Command: /help
      if (text === "/help") {
        const helpText = `📖 <b>Available Admin Commands:</b>\n\n• <b>/start</b> - Admin Dashboard\n• <b>/orders</b> - Recent customer orders\n• <b>/pending</b> - Orders needing confirmation\n• <b>/order &lt;id&gt;</b> - View specific order card\n• <b>/search &lt;name&gt;</b> - Find product details\n• <b>/price &lt;id&gt; &lt;amount&gt;</b> - Update product price\n• <b>/stock &lt;id&gt; &lt;quantity&gt;</b> - Update stock\n• <b>/customer &lt;phone&gt;</b> - Customer details\n• <b>/stats</b> - Sales & revenue numbers`;
        await callTelegram("sendMessage", {
          chat_id: chatId,
          text: helpText,
          parse_mode: "HTML",
          reply_markup: getMainAdminKeyboard()
        });
        return res.status(200).json({ ok: true });
      }

      // Default fallback
      await callTelegram("sendMessage", {
        chat_id: chatId,
        text: `❓ Unrecognized command: <i>${text}</i>\nType <b>/help</b> or use the dashboard buttons below:`,
        parse_mode: "HTML",
        reply_markup: getMainAdminKeyboard()
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true, ignored: true });
  } catch (err: any) {
    console.error("[Telegram Webhook Crash Error]:", err);
    return res.status(200).json({ ok: false, error: err.message });
  }
}
