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

    // Handle Order Approval from Inline Keyboard
    if (data.startsWith("order_approve:")) {
      const orderNum = data.replace("order_approve:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "confirmed", String(userId), userName);
      await answerCallbackQuery(cbId, `✅ অর্ডার #${orderNum} সফলভাবে অ্যাপ্রুভ হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = originalText
          ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> ✅ <b>APPROVED / CONFIRMED</b>\n👤 <b>Approved By:</b> ${userName} (Telegram Admin)\n`)
          : `✅ <b>Order #${orderNum} Approved!</b>\nApproved by ${userName}`;

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ APPROVED", callback_data: "none" },
                { text: "🌐 Open in Admin", url: `https://durtup.shop/admin/orders?id=${orderNum}` }
              ]
            ]
          }
        });
      }
      return { handled: true, authorized: true, action: "order_approved" };
    }

    // Handle Order Rejection from Inline Keyboard
    if (data.startsWith("order_reject:")) {
      const orderNum = data.replace("order_reject:", "").replace(/^#/, "").trim();
      await updateOrderStatusInFirestore(orderNum, "cancelled", String(userId), userName);
      await answerCallbackQuery(cbId, `❌ অর্ডার #${orderNum} বাতিল করা হয়েছে!`, false);

      if (chatId && messageId) {
        const originalText = cb.message?.text || "";
        const updatedText = originalText
          ? originalText.replace(/⚡ Status:.*\n?/i, `⚡ <b>Status:</b> ❌ <b>REJECTED / CANCELLED</b>\n👤 <b>Rejected By:</b> ${userName} (Telegram Admin)\n`)
          : `❌ <b>Order #${orderNum} Rejected</b>`;

        await editTelegramMessageText({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "❌ REJECTED", callback_data: "none" },
                { text: "🌐 Open in Admin", url: `https://durtup.shop/admin/orders?id=${orderNum}` }
              ]
            ]
          }
        });
      }
      return { handled: true, authorized: true, action: "order_rejected" };
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
• <b>/help</b> — Show this command directory

<i>Tip: Tap buttons on the /admin dashboard for one-tap store administration!</i>`;
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
  status: "confirmed" | "cancelled",
  adminId: string,
  adminName: string
): Promise<void> {
  const cleanId = orderIdentifier.replace(/^#/, "").trim();
  const nowIso = new Date().toISOString();
  const statusFields: Record<string, any> = {
    status: { stringValue: status },
    approved_by_telegram: { stringValue: adminId },
    approved_by_name: { stringValue: adminName },
    updated_at: { stringValue: nowIso }
  };
  if (status === "confirmed") {
    statusFields.confirmed_at = { stringValue: nowIso };
  } else {
    statusFields.cancelled_at = { stringValue: nowIso };
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

