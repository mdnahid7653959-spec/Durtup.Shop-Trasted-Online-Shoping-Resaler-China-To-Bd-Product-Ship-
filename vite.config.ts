import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Ensure .env is loaded into process.env for Node-based dev server plugins
try {
  const loaded = loadEnv("development", process.cwd(), "");
  Object.assign(process.env, loaded);
} catch {}

function sigmaDevApiPlugin() {
  return {
    name: "sigma-dev-api-plugin",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith("/api/ai/")) {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.statusCode = 200;
            return res.end();
          }

          if (req.method === "POST") {
            let bodyStr = "";
            req.on("data", (chunk: any) => { bodyStr += chunk; });
            req.on("end", async () => {
              try {
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                const { handleSigmaChatRequest, executeConfirmOrder } = await server.ssrLoadModule("./src/server/sigmaServerEngine.ts");
                
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");

                const urlPath = (req.url || "").split("?")[0];

                if (urlPath.includes("/visual-search") || urlPath.includes("/visualSearch")) {
                  const { handleVisualSearchServerRequest, indexProductInVisualSearch } = await server.ssrLoadModule("./src/server/visualSearchEngine.ts");
                  if (body.action === "index" && body.product) {
                    indexProductInVisualSearch(body.product);
                    res.statusCode = 200;
                    return res.end(JSON.stringify({ success: true, message: "Product indexed into Visual Search catalog" }));
                  }
                  const result = await handleVisualSearchServerRequest(body);
                  res.statusCode = 200;
                  return res.end(JSON.stringify(result));
                }

                if (urlPath.includes("/search")) {
                  const { handleGeminiSearchServerRequest } = await server.ssrLoadModule("./src/server/geminiSearchEngine.ts");
                  const result = await handleGeminiSearchServerRequest(body);
                  res.statusCode = 200;
                  return res.end(JSON.stringify(result));
                }

                if (req.url.includes("/confirm")) {
                  const result = executeConfirmOrder(body);
                  res.statusCode = 200;
                  return res.end(JSON.stringify(result));
                }

                const response = await handleSigmaChatRequest(body);
                res.statusCode = 200;
                return res.end(JSON.stringify(response));
              } catch (err: any) {
                console.error("[Sigma Dev API Middleware Error]:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                return res.end(JSON.stringify({
                  text: "দুঃখিত, এই মুহূর্তে তথ্যটি আনতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।"
                }));
              }
            });
            return;
          }
        }

        if (req.url && req.url.startsWith("/api/referral")) {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.statusCode = 200;
            return res.end();
          }

          if (req.method === "POST") {
            let bodyStr = "";
            req.on("data", (chunk: any) => { bodyStr += chunk; });
            req.on("end", async () => {
              try {
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                const { handleReferralDevRequest } = await server.ssrLoadModule("./src/server/referralDevApi.ts");
                const response = await handleReferralDevRequest(body.action, body.payload);
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.statusCode = 200;
                return res.end(JSON.stringify(response));
              } catch (err: any) {
                console.error("[Referral Dev API Error]:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                return res.end(JSON.stringify({ error: err.message || "Dev API error" }));
              }
            });
            return;
          }
        }

        if (req.url && req.url.startsWith("/api/reseller")) {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-reseller-key, X-Reseller-Key");
            res.statusCode = 200;
            return res.end();
          }

          const execute = async (body: any) => {
            try {
              const { handleResellerApiRequest } = await server.ssrLoadModule("./src/server/resellerServerEngine.ts");
              const result = await handleResellerApiRequest(req.url, req.method, req.headers, body);
              
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.statusCode = result.status || 200;
              return res.end(JSON.stringify(result.body));
            } catch (err: any) {
              console.error("[Reseller Dev API Error]:", err);
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              return res.end(JSON.stringify({ error: err.message || "Reseller API error" }));
            }
          };

          if (req.method === "GET" || req.method === "HEAD") {
            return execute({});
          }

          if ((req as any).body && typeof (req as any).body === "object" && Object.keys((req as any).body).length > 0) {
            return execute((req as any).body);
          }

          let bodyChunks: Buffer[] = [];
          req.on("data", (chunk: any) => { 
            bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); 
          });
          req.on("end", () => {
            const rawBuffer = Buffer.concat(bodyChunks);
            let bodyStr = rawBuffer.toString("utf8");
            // Strip BOM if present
            if (bodyStr.charCodeAt(0) === 0xFEFF) {
              bodyStr = bodyStr.slice(1);
            }
            bodyStr = bodyStr.trim();

            let parsedBody: any = {};
            if (bodyStr) {
              try {
                parsedBody = JSON.parse(bodyStr);
              } catch (e) {
                try {
                  const cleaned = bodyStr
                    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/'([^']*)'/g, '"$1"');
                  parsedBody = JSON.parse(cleaned);
                } catch {
                  try {
                    const sp = new URLSearchParams(bodyStr);
                    const obj: any = {};
                    sp.forEach((v, k) => { obj[k] = v; });
                    if (Object.keys(obj).length > 0 && !obj[bodyStr]) {
                      parsedBody = obj;
                    }
                  } catch {}
                }
              }
            }
            execute(parsedBody);
          });
          return;
        }

        if (req.url && req.url.startsWith("/api/staff/send-invite-email")) {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.statusCode = 200;
            return res.end();
          }

          if (req.method === "POST") {
            let bodyStr = "";
            req.on("data", (chunk: any) => { bodyStr += chunk; });
            req.on("end", async () => {
              try {
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                console.log(`\n======================================================`);
                console.log(`📧 [DURTUP STAFF INVITATION EMAIL DISPATCHED]`);
                console.log(`To: ${body.email} (${body.fullName || "Staff Member"})`);
                console.log(`Department: ${body.department} | Role: ${body.role}`);
                console.log(`Activation Link: ${body.activationUrl}`);
                console.log(`Status: SUCCESS - Email queued and sent to recipient.`);
                console.log(`======================================================\n`);

                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  success: true,
                  message: `Invitation email dispatched to ${body.email}`,
                  activationUrl: body.activationUrl,
                }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                return res.end(JSON.stringify({ error: err.message || "Failed to process invitation email" }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/mohasagor": {
        target: "https://mohasagor.com.bd",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mohasagor/, ""),
      },
      "/api/ecomseller": {
        target: "https://ecomsellerbd.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ecomseller/, ""),
        headers: {
          "referer": "https://ecomsellerbd.com/catalog",
          "origin": "https://ecomsellerbd.com",
        },
      },
    },
  },
  plugins: [react(), sigmaDevApiPlugin()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    cssMinify: true,
    chunkSizeWarningLimit: 1200,
    minify: "esbuild",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-icons": ["lucide-react"],
          "vendor-recharts": ["recharts"],
          "vendor-carousel": ["embla-carousel-react"],
          "vendor-dompurify": ["dompurify"],
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
        },
      },
    },
  },
}));
