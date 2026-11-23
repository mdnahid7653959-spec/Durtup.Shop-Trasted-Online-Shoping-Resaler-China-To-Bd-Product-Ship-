/**
 * Durtup.shop - Telegram Webhook Serverless Endpoint
 * 
 * Vercel Serverless Function: POST /api/telegram or POST /api/telegram-webhook
 * Receives updates from Telegram Bot API and executes admin commands,
 * order approvals, order rejections, and inventory updates.
 */

import { handleTelegramWebhookUpdate } from "../src/server/telegramAdminEngine";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Telegram-Bot-Api-Secret-Token");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Telegram Webhook verification / health check via GET
  if (req.method === "GET") {
    return res.status(200).json({
      status: "active",
      service: "Durtup Telegram Admin Control Webhook",
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST for webhook updates." });
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
      return res.status(400).json({ error: "Invalid Telegram update payload" });
    }

    // Process update asynchronously without blocking Telegram's webhook timeout
    const result = await handleTelegramWebhookUpdate(update);

    // Telegram requires a 200 OK response to acknowledge receipt
    return res.status(200).json({ ok: true, handled: result.handled });
  } catch (err: any) {
    console.error("[Telegram Webhook Handler Error]:", err);
    // Still return 200 so Telegram does not repeatedly resend a crashing update
    return res.status(200).json({ ok: false, error: err.message });
  }
}
