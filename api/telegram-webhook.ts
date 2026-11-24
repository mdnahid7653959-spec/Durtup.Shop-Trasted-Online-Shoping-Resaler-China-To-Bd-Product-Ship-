/**
 * api/telegram-webhook.ts
 * Unified Vercel Serverless Webhook Handler for Durtup Telegram Super Admin
 */

import { handleTelegramWebhookUpdate, getTelegramHealthStatus } from "../src/server/telegram/telegramRouter";
import { verifyWebhookSecret } from "../src/server/telegram/telegramAuth";

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Bot-Api-Secret-Token, x-telegram-bot-api-secret-token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET Health Check & Diagnostics
  if (req.method === "GET") {
    const health = await getTelegramHealthStatus();
    return res.status(200).json(health);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Normalize header extraction for string | string[] | undefined
  const rawHeader =
    req.headers?.["x-telegram-bot-api-secret-token"] ??
    req.headers?.["X-Telegram-Bot-Api-Secret-Token"];
  const secretHeader = Array.isArray(rawHeader)
    ? rawHeader[0]
    : (typeof rawHeader === "string" ? rawHeader : undefined);

  // Enforce Webhook Secret: returns 403 immediately if secret is missing or invalid
  if (!verifyWebhookSecret(secretHeader)) {
    return res.status(403).json({ ok: false, handled: false, error: "Unauthorized webhook secret" });
  }

  try {
    let update = req.body;
    if (typeof update === "string") {
      try {
        update = JSON.parse(update);
      } catch {
        return res.status(400).json({ error: "Invalid JSON update payload" });
      }
    }

    const result = await handleTelegramWebhookUpdate(update, secretHeader);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[Telegram Webhook Exception]:", err);
    // Return 200 to acknowledge receipt to Telegram Bot API, preventing repeated retry storms
    return res.status(200).json({ ok: false, error: err?.message || "Unknown error" });
  }
}
