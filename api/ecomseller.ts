export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-tsr-serverfn");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const rawUrl = req.url || "";
    // Extract target path after /api/ecomseller
    const targetPath = rawUrl.replace(/^\/api\/ecomseller\/?/, "").replace(/^\/+/, "");
    const targetUrl = `https://ecomsellerbd.com/${targetPath}`;

    const headers: Record<string, string> = {
      "Accept": "application/json, text/plain, */*",
      "x-tsr-serverfn": "true",
      "Origin": "https://ecomsellerbd.com",
      "Referer": "https://ecomsellerbd.com/catalog",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const fetchOpts: RequestInit = {
      method: req.method || "GET",
      headers
    };

    if (req.method === "POST" && req.body) {
      fetchOpts.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOpts);
    const contentType = response.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);

    const data = await response.text();
    return res.status(response.status).send(data);
  } catch (err: any) {
    console.error("[api/ecomseller] Proxy error:", err);
    return res.status(500).json({ error: "Failed to proxy request to Ecomseller BD", message: err.message });
  }
}
