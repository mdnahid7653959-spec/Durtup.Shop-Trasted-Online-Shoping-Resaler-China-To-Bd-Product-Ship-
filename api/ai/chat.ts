import type { IncomingMessage, ServerResponse } from "http";
import { handleSigmaChatRequest, executeConfirmOrder } from "../../src/server/sigmaServerEngine";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const url = req.url || "";
    const body = req.body || {};

    if (url.includes("/confirm")) {
      const result = executeConfirmOrder(body);
      return res.status(200).json(result);
    }

    const aiResponse = await handleSigmaChatRequest(body);
    return res.status(200).json(aiResponse);
  } catch (error: any) {
    console.error("[Sigma API Error]:", error);
    return res.status(500).json({
      text: "দুঃখিত, এই মুহূর্তে তথ্যটি আনতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।"
    });
  }
}
