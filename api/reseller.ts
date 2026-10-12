import { handleResellerApiRequest } from "../src/server/resellerServerEngine";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-reseller-key, X-Reseller-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        try {
          const sp = new URLSearchParams(body);
          const obj: any = {};
          sp.forEach((v, k) => { obj[k] = v; });
          if (Object.keys(obj).length > 0) body = obj;
        } catch {}
      }
    }

    const result = await handleResellerApiRequest(
      req.url || "/api/reseller/products",
      req.method || "GET",
      req.headers || {},
      body
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(result.status || 200).json(result.body);
  } catch (err: any) {
    console.error("[Vercel Reseller API Error]:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
