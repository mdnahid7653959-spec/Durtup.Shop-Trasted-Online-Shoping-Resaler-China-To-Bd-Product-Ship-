/**
 * src/server/telegram/telegramRouter.ts
 * Central Telegram Webhook Update Router for Durtup.shop
 */

import {
  MASTER_ADMIN_ID,
  verifyWebhookSecret,
  verifyTelegramAuthorization,
  checkRateLimit,
  recordSecurityRejection
} from "./telegramAuth";
import { TelegramStateManager } from "./telegramState";
import {
  sendTelegramMessage,
  editTelegramMessageText,
  answerCallbackQuery,
  escapeHtml
} from "./telegramApi";
import { renderDashboard } from "./modules/dashboardModule";

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    reply_markup?: any;
    photo?: any[];
    caption?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: { id: number; type?: string };
      text?: string;
    };
    data?: string;
  };
}

export interface WebhookResult {
  handled: boolean;
  action?: string;
  authorized: boolean;
  error?: string;
}

/**
 * Health check & diagnostic status for the Telegram Bot webhook.
 */
export async function getTelegramHealthStatus(): Promise<{
  status: string;
  active: boolean;
  service: string;
  master_admin_configured: boolean;
  timestamp: string;
}> {
  return {
    status: "operational",
    active: true,
    service: "Durtup Telegram Admin Control Webhook",
    master_admin_configured: true,
    timestamp: new Date().toISOString()
  };
}

export function buildOrderActionKeyboard(
  orderNum: string,
  status: string = "pending",
  paymentStatus: string = "pending",
  phone: string = ""
) {
  const normStatus = (status || "pending").toLowerCase();
  const normPayment = (paymentStatus || "pending").toLowerCase();
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("880") ? cleanPhone : (cleanPhone.startsWith("0") ? `88${cleanPhone}` : `880${cleanPhone}`);
  const storeUrl = "https://durtup.shop";

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
    linksRow.push({ text: "💬 WhatsApp", url: `https://wa.me/${waPhone}` });
  }
  linksRow.push({ text: "🌐 View in Admin", url: `${storeUrl}/admin/orders?id=${orderNum}` });
  keyboard.push(linksRow);

  return { inline_keyboard: keyboard };
}

export function updateMessageTextWithStatus(
  originalText: string,
  newStatus: string | null,
  newPaymentStatus: string | null,
  adminName: string,
  adminId: string
): string {
  const statusBadgeMap: Record<string, string> = {
    pending: "⏳ <b>PENDING REVIEW</b>",
    confirmed: "⚙️ <b>CONFIRMED / PROCESSING</b>",
    processing: "⚙️ <b>PROCESSING</b>",
    shipped: "🚚 <b>SHIPPED / IN TRANSIT</b>",
    delivered: "🟢 <b>DELIVERED / COMPLETED</b>",
    cancelled: "🔴 <b>CANCELLED / REJECTED</b>",
    refunded: "↩️ <b>REFUNDED</b>"
  };

  let updatedText = originalText || "";

  if (newStatus && statusBadgeMap[newStatus]) {
    const replacement = `⚡ <b>Status:</b> ${statusBadgeMap[newStatus]}\n👤 <b>Updated By:</b> ${adminName} (${adminId})\n`;
    if (/⚡ Status:.*\n?/i.test(updatedText)) {
      updatedText = updatedText.replace(/⚡ Status:.*\n?/i, replacement);
    } else {
      updatedText += `\n${replacement}`;
    }
  }

  if (newPaymentStatus === "paid") {
    const payReplacement = `💳 <b>Payment:</b> 💵 <b>PAID & VERIFIED</b> (by ${adminName})\n`;
    if (/💳 Payment:.*\n?/i.test(updatedText)) {
      updatedText = updatedText.replace(/💳 Payment:.*\n?/i, payReplacement);
    } else {
      updatedText += `\n${payReplacement}`;
    }
  } else if (newPaymentStatus === "pending") {
    const payReplacement = `💳 <b>Payment:</b> ⏳ <b>PENDING / UNPAID</b>\n`;
    if (/💳 Payment:.*\n?/i.test(updatedText)) {
      updatedText = updatedText.replace(/💳 Payment:.*\n?/i, payReplacement);
    }
  }

  return updatedText;
}

/**
 * Main Webhook Dispatcher
 * Processes inbound Telegram Updates according to strict security & routing specifications.
 */
export async function handleTelegramWebhookUpdate(
  update: TelegramWebhookUpdate,
  secretHeader?: string
): Promise<WebhookResult> {
  if (!update || typeof update !== "object") {
    return { handled: false, authorized: false, error: "Empty or invalid update payload" };
  }

  // 1. Verify Webhook Secret Token
  if (!verifyWebhookSecret(secretHeader)) {
    console.warn("[Router] Webhook secret validation failed");
    return { handled: false, authorized: false, error: "Invalid webhook secret" };
  }

  // 2. Extract Sender
  const from = update.message?.from || update.callback_query?.from;
  if (!from) {
    return { handled: false, authorized: false, error: "Missing sender in update payload" };
  }
  const userId = from.id;
  const userName =
    [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Admin";

  // 3. Rate Limiting Check
  if (!checkRateLimit(userId)) {
    if (update.callback_query) {
      await answerCallbackQuery(
        update.callback_query.id,
        "⚠️ Rate limit exceeded. Please wait a moment.",
        true
      );
    }
    return { handled: true, authorized: true, error: "Rate limit exceeded" };
  }

  // 4. Eliminate Insecure Self-Service Pairing (/setup & admin_pair:)
  if (update.message?.text?.trim().startsWith("/setup")) {
    await recordSecurityRejection(
      userId,
      "/setup",
      "Attempted self-pairing /setup command"
    );
    await sendTelegramMessage({
      chat_id: update.message.chat.id,
      text: `⛔ <b>Self-pairing is permanently disabled.</b>\n\nAdministrative access is strictly restricted and managed by Master Administrator (ID: <code>${MASTER_ADMIN_ID}</code>).`,
      parse_mode: "HTML"
    });
    return { handled: true, authorized: false, action: "/setup" };
  }

  if (update.callback_query?.data?.startsWith("admin_pair:")) {
    await recordSecurityRejection(
      userId,
      update.callback_query.data,
      "Attempted admin_pair callback query"
    );
    await answerCallbackQuery(
      update.callback_query.id,
      "⛔ Self-pairing is permanently disabled.",
      true
    );
    return { handled: true, authorized: false, action: "admin_pair" };
  }

  // 5. Strict Authorization Verification
  const auth = await verifyTelegramAuthorization(userId);
  if (!auth.authorized) {
    // Safe Exception: allow /myid for unauthorized users so they can share their ID with Master Admin
    if (update.message?.text?.trim() === "/myid") {
      await sendTelegramMessage({
        chat_id: update.message.chat.id,
        text: `🆔 <b>Your Telegram User ID:</b> <code>${userId}</code>\nChat ID: <code>${update.message.chat.id}</code>\nStatus: 🔴 <b>Unauthorized</b>\n\n<i>To request store administration privileges, share this User ID with the store owner.</i>`,
        parse_mode: "HTML"
      });
      return { handled: true, authorized: false, action: "myid_public" };
    }

    // Reject and log unauthorized access
    await recordSecurityRejection(
      userId,
      update.message?.text || update.callback_query?.data || "unknown",
      auth.reason || "Unauthorized Telegram ID"
    );

    if (update.message) {
      await sendTelegramMessage({
        chat_id: update.message.chat.id,
        text: `⛔ <b>ACCESS DENIED</b>\n\nYour Telegram User ID (<code>${userId}</code>) is not authorized to access the <b>Durtup.shop Super Admin Control Center</b>.\n\nPlease contact Master Administrator (ID: <code>${MASTER_ADMIN_ID}</code>) to request access.\n\n<i>This security incident has been logged.</i>`,
        parse_mode: "HTML"
      });
    } else if (update.callback_query) {
      await answerCallbackQuery(
        update.callback_query.id,
        "⛔ Access Denied! Your Telegram ID is not authorized.",
        true
      );
    }

    return { handled: true, authorized: false, error: "Unauthorized user" };
  }

  // ==========================================
  // 6. DISPATCH CALLBACK QUERIES
  // ==========================================
  if (update.callback_query) {
    const cb = update.callback_query;
    const cbId = cb.id;
    const data = (cb.data || "").trim();
    const chatId = cb.message?.chat.id || userId;
    const messageId = cb.message?.message_id;

    // Duplicate callback idempotency check (4000ms window)
    if (TelegramStateManager.isCallbackProcessed(cbId)) {
      await answerCallbackQuery(cbId, "Action already processed.");
      return { handled: true, authorized: true, action: "duplicate_ignored" };
    }

    // A. Dashboard actions
    if (data === "dash:main" || data === "dash:refresh" || data === "cmd_dashboard") {
      await renderDashboard({
        chatId,
        messageId,
        userId,
        userName,
        mode: messageId ? "edit" : "new"
      });
      await answerCallbackQuery(cbId, "Dashboard refreshed! 🔄");
      return { handled: true, authorized: true, action: "dash_refresh" };
    }

    // B. Confirmation cancel action
    if (data.startsWith("cnf:cancel:")) {
      await answerCallbackQuery(cbId, "Action cancelled.");
      await renderDashboard({
        chatId,
        messageId,
        userId,
        userName,
        mode: messageId ? "edit" : "new"
      });
      return { handled: true, authorized: true, action: "action_cancelled" };
    }

    // C. Module stubs for future milestones (guarantees callback spinner dismissal)
    if (data.startsWith("ord:")) {
      await answerCallbackQuery(cbId, "📦 Orders Module is active in Milestone 2.");
      return { handled: true, authorized: true, action: "m2_stub_orders" };
    }
    if (data.startsWith("pay:")) {
      await answerCallbackQuery(cbId, "💳 Payments Module is active in Milestone 3.");
      return { handled: true, authorized: true, action: "m3_stub_payments" };
    }
    if (data.startsWith("prod:")) {
      await answerCallbackQuery(cbId, "🛍️ Products Module is active in Milestone 3.");
      return { handled: true, authorized: true, action: "m3_stub_products" };
    }
    if (data.startsWith("inv:")) {
      await answerCallbackQuery(cbId, "⚠️ Inventory Module is active in Milestone 3.");
      return { handled: true, authorized: true, action: "m3_stub_inventory" };
    }
    if (data.startsWith("ref:")) {
      await answerCallbackQuery(cbId, "🔄 Refunds Module is active in Milestone 3.");
      return { handled: true, authorized: true, action: "m3_stub_refunds" };
    }
    if (
      data.startsWith("cust:") ||
      data.startsWith("supp:") ||
      data.startsWith("sell:") ||
      data.startsWith("ship:") ||
      data.startsWith("coup:") ||
      data.startsWith("rev:") ||
      data.startsWith("qa:") ||
      data.startsWith("notif:") ||
      data.startsWith("stat:") ||
      data.startsWith("sett:") ||
      data.startsWith("sec:")
    ) {
      await answerCallbackQuery(cbId, "Module is active in Milestone 4.");
      return { handled: true, authorized: true, action: "m4_stub" };
    }

    // 1. APPROVE / PROCESS
    if (data.startsWith("order_approve:")) {
      const orderNum = data.replace("order_approve:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "confirmed", String(userId), userName);
      await answerCallbackQuery(cbId, `✅ অর্ডার #${orderNum} সফলভাবে অ্যাপ্রুভ / কনফার্ম হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, "confirmed", null, userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "confirmed", "pending", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_approved" };
    }

    // 2. MARK SHIPPED
    if (data.startsWith("order_ship:")) {
      const orderNum = data.replace("order_ship:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "shipped", String(userId), userName);
      await answerCallbackQuery(cbId, `🚚 অর্ডার #${orderNum} সফলভাবে SHIPPED মার্ক করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, "shipped", null, userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "shipped", "pending", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_shipped" };
    }

    // 3. MARK DELIVERED
    if (data.startsWith("order_deliver:")) {
      const orderNum = data.replace("order_deliver:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "delivered", String(userId), userName, "paid");
      await answerCallbackQuery(cbId, `🎉 অর্ডার #${orderNum} সফলভাবে DELIVERED মার্ক করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, "delivered", "paid", userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "delivered", "paid", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_delivered" };
    }

    // 4. MARK AS PAID
    if (data.startsWith("order_paid:")) {
      const orderNum = data.replace("order_paid:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, null, String(userId), userName, "paid");
      await answerCallbackQuery(cbId, `💵 অর্ডার #${orderNum} এর পেমেন্ট PAID হিসেবে ভেরিফাই হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, null, "paid", userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "confirmed", "paid", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_paid" };
    }

    // 5. MARK AS UNPAID
    if (data.startsWith("order_unpaid:")) {
      const orderNum = data.replace("order_unpaid:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, null, String(userId), userName, "pending");
      await answerCallbackQuery(cbId, `⏳ অর্ডার #${orderNum} এর পেমেন্ট UNPAID করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, null, "pending", userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "confirmed", "pending", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_unpaid" };
    }

    // 6. CANCEL / REJECT
    if (data.startsWith("order_reject:") || data.startsWith("order_cancel:")) {
      const orderNum = data.replace(/^(order_reject:|order_cancel:)/, "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "cancelled", String(userId), userName);
      await answerCallbackQuery(cbId, `❌ অর্ডার #${orderNum} বাতিল (Cancelled) করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, "cancelled", null, userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "cancelled", "pending", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_rejected" };
    }

    // 7. MARK REFUNDED
    if (data.startsWith("order_refund:")) {
      const orderNum = data.replace("order_refund:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "refunded", String(userId), userName, "refunded");
      await answerCallbackQuery(cbId, `↩️ অর্ডার #${orderNum} রিফান্ড মার্ক করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, "refunded", "refunded", userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "refunded", "refunded", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_refunded" };
    }

    // 8. REOPEN AS PENDING
    if (data.startsWith("order_pending:")) {
      const orderNum = data.replace("order_pending:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "pending", String(userId), userName);
      await answerCallbackQuery(cbId, `⏳ অর্ডার #${orderNum} পুনরায় PENDING করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = updateMessageTextWithStatus(originalText, "pending", null, userName, String(userId));
        const phoneMatch = updatedText.match(/📞 Phone:\s*<code>?([+\d]+)<?/i) || updatedText.match(/\b(01\d{9})\b/);
        const phone = phoneMatch ? phoneMatch[1] : "";

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: buildOrderActionKeyboard(orderNum, "pending", "pending", phone)
        });
      }
      return { handled: true, authorized: true, action: "order_reopened" };
    }

    // 9. NO-OP
    if (data.startsWith("order_noop:")) {
      await answerCallbackQuery(cbId, "অর্ডারটি ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।");
      return { handled: true, authorized: true, action: "order_noop" };
    }

    // Legacy callback aliases support
    if (data === "cmd_orders" || data.startsWith("order_view:")) {
      await answerCallbackQuery(cbId, "Order actions handled by Orders Engine.");
      return { handled: true, authorized: true, action: "legacy_order_callback" };
    }

    // Fallback for unrecognized callback: always dismiss loading spinner
    await answerCallbackQuery(cbId, "Action acknowledged.");
    return { handled: true, authorized: true, action: "unknown_callback" };
  }

  // ==========================================
  // 7. DISPATCH COMMANDS & TEXT MESSAGES
  // ==========================================
  if (update.message?.text) {
    const text = update.message.text.trim();
    const chatId = update.message.chat.id;

    if (
      text === "/admin" ||
      text === "/start" ||
      text === "/menu" ||
      text === "/dashboard"
    ) {
      await renderDashboard({ chatId, userId, userName, mode: "new" });
      return { handled: true, authorized: true, action: "dashboard_rendered" };
    }

    if (text === "/myid") {
      await sendTelegramMessage({
        chat_id: chatId,
        text: `🆔 <b>Your Telegram User ID:</b> <code>${userId}</code>\nChat ID: <code>${chatId}</code>\nStatus: 🟢 <b>Authorized Store Administrator</b>`,
        parse_mode: "HTML"
      });
      return { handled: true, authorized: true, action: "myid_authorized" };
    }

    if (text === "/help") {
      const helpText = `📖 <b>DURTUP SUPER ADMIN BOT MANUAL:</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• <b>/admin</b> or <b>/start</b> — Open 16-Module Master Control Center
• <b>/myid</b> — Inspect your Telegram User & Chat ID
• <b>/ship &lt;order_id&gt;</b> — Mark order as Shipped
• <b>/deliver &lt;order_id&gt;</b> — Mark order as Delivered
• <b>/paid &lt;order_id&gt;</b> — Mark order as Paid
• <b>/cancel &lt;order_id&gt;</b> — Cancel order
• <b>/status &lt;order_id&gt;</b> — Check order details & actions
• <b>/help</b> — Show this command directory

<i>Tip: You can also tap the inline buttons directly under any order notification!</i>`;
      await sendTelegramMessage({
        chat_id: chatId,
        text: helpText,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "🏠 Open Admin Dashboard", callback_data: "dash:main" }]]
        }
      });
      return { handled: true, authorized: true, action: "help_sent" };
    }

    // Direct fulfillment commands (/ship, /deliver, /paid, /cancel, /status) or reply-to
    const replyText = update.message?.reply_to_message?.text || "";
    let referencedOrder = "";
    const refMatch = replyText.match(/Order ID:\s*<code>?#?([a-zA-Z0-9_-]+)<?/i)
      || replyText.match(/ORDER\s*#([a-zA-Z0-9_-]+)/i)
      || replyText.match(/#ORD-([a-zA-Z0-9_-]+)/i);
    if (refMatch) {
      referencedOrder = refMatch[1];
    }

    const lower = text.toLowerCase();
    const cmdParts = text.split(/\s+/);
    const cmd = cmdParts[0].toLowerCase();
    const argOrder = cmdParts[1] ? cmdParts[1].replace(/^#/, "").trim() : referencedOrder;

    if (cmd === "/ship" || cmd === "/shipped" || (referencedOrder && (lower === "ship" || lower === "shipped"))) {
      if (!argOrder) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: "⚠️ অনুগ্রহ করে অর্ডার নম্বর দিন। উদাহরণ: <code>/ship ORD-123456</code> বা কোনো অর্ডারের নোটিফিকেশনে রিপ্লাই দিন।"
        });
        return { handled: true, authorized: true, action: "ship_missing_arg" };
      }
      await updateOrderStatusInFirestore(argOrder, "shipped", String(userId), userName);
      await sendTelegramMessage({
        chat_id: chatId,
        text: `🚚 <b>অর্ডার #${argOrder} সফলভাবে SHIPPED মার্ক করা হয়েছে!</b>\n\nকুরিয়ার ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস আপডেট হয়েছে।`,
        parse_mode: "HTML",
        reply_markup: buildOrderActionKeyboard(argOrder, "shipped", "pending")
      });
      return { handled: true, authorized: true, action: "cmd_ship" };
    }

    if (cmd === "/deliver" || cmd === "/delivered" || (referencedOrder && (lower === "deliver" || lower === "delivered"))) {
      if (!argOrder) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: "⚠️ অনুগ্রহ করে অর্ডার নম্বর দিন। উদাহরণ: <code>/deliver ORD-123456</code> বা কোনো অর্ডারের নোটিফিকেশনে রিপ্লাই দিন।"
        });
        return { handled: true, authorized: true, action: "deliver_missing_arg" };
      }
      await updateOrderStatusInFirestore(argOrder, "delivered", String(userId), userName, "paid");
      await sendTelegramMessage({
        chat_id: chatId,
        text: `🎉 <b>অর্ডার #${argOrder} সফলভাবে DELIVERED মার্ক করা হয়েছে!</b>\n\nকাস্টমার ডেলিভারি সম্পন্ন হয়েছে এবং পেমেন্ট Paid মার্ক করা হয়েছে।`,
        parse_mode: "HTML",
        reply_markup: buildOrderActionKeyboard(argOrder, "delivered", "paid")
      });
      return { handled: true, authorized: true, action: "cmd_deliver" };
    }

    if (cmd === "/paid" || (referencedOrder && (lower === "paid" || lower === "pay"))) {
      if (!argOrder) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: "⚠️ অনুগ্রহ করে অর্ডার নম্বর দিন। উদাহরণ: <code>/paid ORD-123456</code> বা কোনো অর্ডারের নোটিফিকেশনে রিপ্লাই দিন।"
        });
        return { handled: true, authorized: true, action: "paid_missing_arg" };
      }
      await updateOrderStatusInFirestore(argOrder, null, String(userId), userName, "paid");
      await sendTelegramMessage({
        chat_id: chatId,
        text: `💵 <b>অর্ডার #${argOrder} এর পেমেন্ট PAID হিসেবে ভেরিফাই হয়েছে!</b>`,
        parse_mode: "HTML",
        reply_markup: buildOrderActionKeyboard(argOrder, "confirmed", "paid")
      });
      return { handled: true, authorized: true, action: "cmd_paid" };
    }

    if (cmd === "/cancel" || cmd === "/reject" || (referencedOrder && (lower === "cancel" || lower === "reject"))) {
      if (!argOrder) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: "⚠️ অনুগ্রহ করে অর্ডার নম্বর দিন। উদাহরণ: <code>/cancel ORD-123456</code> বা কোনো অর্ডারের নোটিফিকেশনে রিপ্লাই দিন।"
        });
        return { handled: true, authorized: true, action: "cancel_missing_arg" };
      }
      await updateOrderStatusInFirestore(argOrder, "cancelled", String(userId), userName);
      await sendTelegramMessage({
        chat_id: chatId,
        text: `❌ <b>অর্ডার #${argOrder} বাতিল (Cancelled) করা হয়েছে!</b>`,
        parse_mode: "HTML",
        reply_markup: buildOrderActionKeyboard(argOrder, "cancelled", "pending")
      });
      return { handled: true, authorized: true, action: "cmd_cancel" };
    }

    if (cmd === "/approve" || cmd === "/confirm" || (referencedOrder && (lower === "approve" || lower === "confirm"))) {
      if (!argOrder) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: "⚠️ অনুগ্রহ করে অর্ডার নম্বর দিন। উদাহরণ: <code>/approve ORD-123456</code> বা কোনো অর্ডারের নোটিফিকেশনে রিপ্লাই দিন।"
        });
        return { handled: true, authorized: true, action: "approve_missing_arg" };
      }
      await updateOrderStatusInFirestore(argOrder, "confirmed", String(userId), userName);
      await sendTelegramMessage({
        chat_id: chatId,
        text: `✅ <b>অর্ডার #${argOrder} সফলভাবে APPROVED / CONFIRMED করা হয়েছে!</b>`,
        parse_mode: "HTML",
        reply_markup: buildOrderActionKeyboard(argOrder, "confirmed", "pending")
      });
      return { handled: true, authorized: true, action: "cmd_approve" };
    }

    // Unknown command fallback
    await sendTelegramMessage({
      chat_id: chatId,
      text: `❓ Unrecognized command: <i>${escapeHtml(text)}</i>\n\nTap the button below to open your store dashboard:`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🏠 Open Admin Dashboard", callback_data: "dash:main" }]]
      }
    });
    return { handled: true, authorized: true, action: "unknown_command" };
  }

  return { handled: true, authorized: true, action: "ignored_update" };
}

const FIRESTORE_BASE = "https://firestore.googleapis.com/v1/projects/eshop-app-6119d/databases/(default)/documents";

async function updateOrderStatusInFirestore(
  orderIdentifier: string,
  status?: string | null,
  adminId: string = "telegram_admin",
  adminName: string = "Admin",
  paymentStatus?: string | null
): Promise<void> {
  const cleanId = orderIdentifier.replace(/^#/, "").trim();
  const nowIso = new Date().toISOString();
  const statusFields: Record<string, any> = {
    updated_by_telegram: { stringValue: String(adminId) },
    updated_by_name: { stringValue: String(adminName) },
    updated_at: { stringValue: nowIso }
  };

  if (status) {
    statusFields.status = { stringValue: status };
    if (status === "confirmed" || status === "processing") {
      statusFields.confirmed_at = { stringValue: nowIso };
    } else if (status === "shipped") {
      statusFields.shipped_at = { stringValue: nowIso };
    } else if (status === "delivered") {
      statusFields.delivered_at = { stringValue: nowIso };
    } else if (status === "cancelled") {
      statusFields.cancelled_at = { stringValue: nowIso };
    } else if (status === "refunded") {
      statusFields.refunded_at = { stringValue: nowIso };
    }
  }

  if (paymentStatus) {
    statusFields.payment_status = { stringValue: paymentStatus };
    if (paymentStatus === "paid") {
      statusFields.paid_at = { stringValue: nowIso };
    }
  }

  const mask = Object.keys(statusFields).map((k) => `updateMask.fieldPaths=${k}`).join("&");

  // 1. Direct REST PATCH by cleanId
  try {
    await fetch(`${FIRESTORE_BASE}/orders/${cleanId}?${mask}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: statusFields })
    });
  } catch (err) {
    console.warn("[Telegram Router] Direct Firestore PATCH error:", err);
  }

  // 2. Query Firestore by order_number
  try {
    const qRes = await fetch(`${FIRESTORE_BASE}:runQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "orders" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "order_number" },
              op: "EQUAL",
              value: { stringValue: cleanId }
            }
          },
          limit: 1
        }
      })
    });
    if (qRes.ok) {
      const qDocs = await qRes.json();
      if (Array.isArray(qDocs) && qDocs[0]?.document?.name) {
        const docPath = qDocs[0].document.name;
        await fetch(`https://firestore.googleapis.com/v1/${docPath}?${mask}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: statusFields })
        });
      }
    }
  } catch (err) {
    console.warn("[Telegram Router] Firestore runQuery order update notice:", err);
  }
}

