/**
 * src/server/telegram/telegramApi.ts
 * Resilient Telegram Bot API Client for Durtup.shop
 */

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  chat_id: number | string;
  text: string;
  parse_mode?: "MarkdownV2" | "HTML" | "Markdown";
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}

export interface EditMessageOptions {
  chat_id: number | string;
  message_id: number;
  text: string;
  parse_mode?: "MarkdownV2" | "HTML" | "Markdown";
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}

export const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// Mock transport hook for unit & offline integration tests
let mockTransport: ((method: string, payload: any) => Promise<any>) | null = null;

export function setTelegramTransport(
  transport: ((method: string, payload: any) => Promise<any>) | null
): void {
  mockTransport = transport;
}

export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function validateCallbackBytes(markup?: InlineKeyboardMarkup): void {
  if (!markup?.inline_keyboard) return;
  for (const row of markup.inline_keyboard) {
    if (!Array.isArray(row)) continue;
    for (const btn of row) {
      if (btn?.callback_data) {
        const byteLen = Buffer.byteLength(btn.callback_data, "utf8");
        if (byteLen > 64) {
          console.error(
            `[Telegram API] CRITICAL: callback_data exceeds 64 bytes (${byteLen} bytes): "${btn.callback_data}"`
          );
        }
      }
    }
  }
}

export async function callTelegramApi(
  method: string,
  payload: any,
  tokenOverride?: string
): Promise<any> {
  if (mockTransport) {
    return mockTransport(method, payload);
  }

  let token = (tokenOverride || DEFAULT_BOT_TOKEN).trim();
  if (!token) {
    try {
      const snap = await fetch("https://firestore.googleapis.com/v1/projects/eshop-app-6119d/databases/(default)/documents/settings/telegram");
      if (snap.ok) {
        const json = await snap.json();
        token = json.fields?.bot_token?.stringValue?.trim() || "";
      }
    } catch {}
  }
  if (!token) {
    throw new Error("Telegram Bot Token is not configured.");
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
    console.warn(`[Telegram API] Call to ${method} error: ${err.message}`);
    return { ok: false, description: err.message, network_error: true };
  }
}

export async function sendTelegramMessage(options: SendMessageOptions): Promise<any> {
  validateCallbackBytes(options.reply_markup);
  const payload: any = {
    chat_id: options.chat_id,
    text: options.text,
    parse_mode: options.parse_mode ?? "HTML",
    reply_markup: options.reply_markup,
    disable_web_page_preview: options.disable_web_page_preview ?? true
  };

  const res = await callTelegramApi("sendMessage", payload);

  // Automatic entity parsing fallback: retry without parse_mode if entity syntax error occurs
  if (!res.ok && res.description?.includes("can't parse entities")) {
    console.warn("[Telegram API] HTML parsing error on sendMessage, retrying as plain text");
    payload.parse_mode = undefined;
    return await callTelegramApi("sendMessage", payload);
  }

  return res;
}

export async function editTelegramMessageText(options: EditMessageOptions): Promise<any> {
  validateCallbackBytes(options.reply_markup);
  const payload: any = {
    chat_id: options.chat_id,
    message_id: options.message_id,
    text: options.text,
    parse_mode: options.parse_mode ?? "HTML",
    reply_markup: options.reply_markup,
    disable_web_page_preview: options.disable_web_page_preview ?? true
  };

  const res = await callTelegramApi("editMessageText", payload);

  // Handle Telegram's "message is not modified" error gracefully
  if (!res.ok && res.description?.includes("message is not modified")) {
    return { ok: true, not_modified: true };
  }

  // Automatic entity parsing fallback
  if (!res.ok && res.description?.includes("can't parse entities")) {
    console.warn("[Telegram API] HTML parsing error on editMessageText, retrying as plain text");
    payload.parse_mode = undefined;
    return await callTelegramApi("editMessageText", payload);
  }

  return res;
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<any> {
  const payload: any = {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert
  };
  return await callTelegramApi("answerCallbackQuery", payload);
}

export async function sendTelegramPhoto(
  chatId: number | string,
  photoUrl: string,
  caption?: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<any> {
  validateCallbackBytes(replyMarkup);
  const payload: any = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption ? caption.slice(0, 1024) : undefined,
    parse_mode: "HTML",
    reply_markup: replyMarkup
  };

  const res = await callTelegramApi("sendPhoto", payload);

  // If photo sending fails (e.g. invalid URL, Telegram network error), fallback to standard sendMessage
  if (!res.ok) {
    console.warn(`[Telegram API] sendPhoto failed (${res.description}), falling back to sendMessage`);
    const fallbackText = caption
      ? `${caption}\n\n🖼️ <b>Product Photo:</b> ${photoUrl}`
      : `🖼️ <b>Product Photo:</b> ${photoUrl}`;
    return await sendTelegramMessage({
      chat_id: chatId,
      text: fallbackText,
      reply_markup: replyMarkup
    });
  }

  return res;
}
