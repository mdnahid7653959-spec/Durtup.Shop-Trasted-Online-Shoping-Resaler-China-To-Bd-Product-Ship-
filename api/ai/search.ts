import { handleGeminiSearchServerRequest } from "../../src/server/geminiSearchEngine";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = req.body || {};
    const result = await handleGeminiSearchServerRequest(body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[Gemini Search API Error]:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during search"
    });
  }
}
