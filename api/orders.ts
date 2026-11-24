export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ status: "healthy", service: "Durtup Orders API" });
  }

  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { handleOrderServerRequest } = await import("../src/server/orderServerEngine");

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

    const result = await handleOrderServerRequest(
      req.url || "/api/orders",
      req.method || "POST",
      req.headers || {},
      body
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(result.status || 200).json(result.body);
  } catch (err: any) {
    console.error("[Vercel Orders API Error]:", err);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(500).json({ success: false, error: err.message || "Internal server error" });
  }
}
