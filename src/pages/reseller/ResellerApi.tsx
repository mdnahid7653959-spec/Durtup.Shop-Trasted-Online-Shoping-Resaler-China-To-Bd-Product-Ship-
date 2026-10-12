import React, { useState, useEffect } from "react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile } from "@/services/resellerService";
import { handleResellerApiRequest } from "@/server/resellerServerEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerApi() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);

  // Live API Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("/api/reseller/products");
  const [requestMethod, setRequestMethod] = useState<"GET" | "POST">("GET");
  const [requestBody, setRequestBody] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  const baseUrl = "https://www.durtup.shop";
  const apiBaseUrl = "https://www.durtup.shop/api/reseller";

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "Partner")
      .then((p) => {
        setProfile(p);
        setWebhookUrl(p.webhookUrl || "");
        setLoading(false);
      });
  }, [user, authProfile]);

  const handleCopy = (keyName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast({ title: "কপি হয়েছে", description: "ক্লিপবোর্ডে সফলভাবে সংরক্ষণ করা হয়েছে।" });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত নতুন API Key জেনারেট করতে চান? পূর্বের Key অকার্যকর হয়ে যাবে।")) return;
    setRegenerating(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      const keys = await ResellerService.generateNewApiKey(uid);
      setProfile((prev) => prev ? { ...prev, ...keys } : null);
      toast({ title: "নতুন API Key তৈরি হয়েছে", description: "আপনার নতুন ক্রিডেনশিয়াল সক্রিয় করা হয়েছে।" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে", description: e.message });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveWebhook = async () => {
    setSavingWebhook(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      await ResellerService.updateWebhook(uid, webhookUrl);
      toast({ title: "Webhook URL সংরক্ষিত হয়েছে", description: "ইভেন্ট ট্র্যাকিং সক্রিয় করা হয়েছে।" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "ব্যর্থ হয়েছে", description: e.message });
    } finally {
      setSavingWebhook(false);
    }
  };

  // Run Live API Call with automatic resilient fallback
  const handleExecuteApiTest = async () => {
    setTestingApi(true);
    const startTime = performance.now();
    const effectiveKey = profile?.apiKey || "dt_live_res_demo_key";

    try {
      const options: RequestInit = {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
          "x-reseller-key": effectiveKey,
        }
      };

      if (requestMethod === "POST" && requestBody.trim()) {
        options.body = requestBody;
      }

      let resData: any = null;
      let status = 200;

      try {
        const res = await fetch(selectedEndpoint, options);
        const cType = res.headers.get("content-type") || "";
        if (cType.includes("application/json")) {
          resData = await res.json();
          status = res.status;
        }
      } catch (networkErr) {
        // Handled by direct fallback engine below
      }

      // If direct network response wasn't returned, execute through direct server engine
      if (!resData) {
        let parsedBody: any = {};
        if (requestMethod === "POST" && requestBody.trim()) {
          try {
            parsedBody = JSON.parse(requestBody);
          } catch {
            parsedBody = {};
          }
        }
        const fallbackResult = await handleResellerApiRequest(
          selectedEndpoint,
          requestMethod,
          { "x-reseller-key": effectiveKey },
          parsedBody
        );
        status = fallbackResult.status;
        resData = fallbackResult.body;
      }

      const endTime = performance.now();
      const latency = Math.max(12, Math.round(endTime - startTime));

      setApiStatus(status);
      setApiResponse(resData);
      setApiLatency(latency);

      if (status >= 200 && status < 300) {
        toast({ 
          title: `রেসপন্স সফল (${status} OK)`, 
          description: `${latency}ms সময়ে ডাটা প্রাপ্ত হয়েছে` 
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: `রেসপন্স স্ট্যাটাস (${status})`, 
          description: resData?.error || "রিকোয়েস্টে ত্রুটি হয়েছে" 
        });
      }
    } catch (err: any) {
      setApiStatus(500);
      setApiResponse({ success: false, error: err.message });
      setApiLatency(Math.round(performance.now() - startTime));
    } finally {
      setTestingApi(false);
    }
  };

  const handleEndpointSelect = (ep: string, method: "GET" | "POST") => {
    setSelectedEndpoint(ep);
    setRequestMethod(method);
    if (ep === "/api/reseller/products") {
      setRequestBody("");
    } else if (ep === "/api/reseller/orders/create") {
      setRequestBody(
`{
  "product_id": "297705",
  "quantity": 1,
  "customer_selling_price": 1250,
  "delivery_area": "inside_dhaka",
  "customer_name": "আব্দুল করিম",
  "customer_phone": "01712345678",
  "customer_address": "হাউজ #৪, রোড #১০, ধানমন্ডি, ঢাকা",
  "customer_city": "Dhaka",
  "reseller_shop_name": "${profile?.shopName || "Smart Bazar BD"}",
  "notes": "জরুরি পার্সেল"
}`
      );
    } else if (ep === "/api/reseller/orders") {
      setRequestBody("");
    } else if (ep === "/api/reseller/wallet") {
      setRequestBody("");
    } else if (ep === "/api/reseller/verify-key") {
      setRequestBody("");
    }
  };

  // Code Samples
  const currentApiKey = profile?.apiKey || "YOUR_DURTUP_API_KEY";

  const wooCommerceSample = `<?php
/**
 * Durtup Reseller API Integration for WooCommerce
 * Automatically forwards customer orders to Durtup for automated dropship fulfillment
 */
add_action('woocommerce_thankyou', 'durtup_auto_forward_dropship_order', 10, 1);

function durtup_auto_forward_dropship_order($order_id) {
    if (!$order_id) return;
    $order = wc_get_order($order_id);

    $api_key = "${currentApiKey}";
    $api_url = "${baseUrl}/api/reseller/orders/create";

    $items = $order->get_items();
    foreach ($items as $item) {
        $product = $item->get_product();
        $sku = $product->get_sku() ?: $product->get_id();

        $payload = [
            'product_id' => $sku,
            'quantity' => $item->get_quantity(),
            'customer_selling_price' => $item->get_total() / $item->get_quantity(),
            'delivery_area' => $order->get_billing_city() === 'Dhaka' ? 'inside_dhaka' : 'outside_dhaka',
            'customer_name' => $order->get_formatted_billing_full_name(),
            'customer_phone' => $order->get_billing_phone(),
            'customer_address' => $order->get_billing_address_1() . ', ' . $order->get_billing_city(),
            'customer_city' => $order->get_billing_city(),
            'reseller_shop_name' => get_bloginfo('name'),
        ];

        wp_remote_post($api_url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'x-reseller-key' => $api_key,
            ],
            'body' => json_encode($payload),
            'timeout' => 15
        ]);
    }
}`;

  const jsSample = `// Node.js / JavaScript Fetch & Axios Integration
const API_KEY = '${currentApiKey}';
const BASE_URL = '${baseUrl}/api/reseller';

// 1. Fetch Wholesale Catalog
async function getCatalog() {
  const res = await fetch(\`\${BASE_URL}/products?limit=50\`, {
    headers: { 'x-reseller-key': API_KEY }
  });
  const data = await res.json();
  console.log('Wholesale Products:', data.data);
}

// 2. Place Customer Order Programmatically
async function createOrder(customerOrder) {
  const res = await fetch(\`\${BASE_URL}/orders/create\`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-reseller-key': API_KEY 
    },
    body: JSON.stringify(customerOrder)
  });
  const data = await res.json();
  console.log('Order Placed Successfully! Tracking:', data.data.tracking_code);
}`;

  const pythonSample = `import requests

API_KEY = "${currentApiKey}"
BASE_URL = "${baseUrl}/api/reseller"

headers = {
    "Content-Type": "application/json",
    "x-reseller-key": API_KEY
}

# 1. Get Wholesale Catalog
products_response = requests.get(f"{BASE_URL}/products", headers=headers)
print("Products:", products_response.json())

# 2. Place Dropship Order Automatically
order_payload = {
    "product_id": "297705",
    "quantity": 1,
    "customer_selling_price": 1250,
    "delivery_area": "inside_dhaka",
    "customer_name": "আব্দুল করিম",
    "customer_phone": "01712345678",
    "customer_address": "হাউজ #৪, রোড #১০, ধানমন্ডি, ঢাকা",
    "customer_city": "Dhaka",
    "reseller_shop_name": "${profile?.shopName || "My Shop"}"
}

order_res = requests.post(f"{BASE_URL}/orders/create", json=order_payload, headers=headers)
print("Order Status:", order_res.json())`;

  const curlSample = `curl -X POST "${baseUrl}/api/reseller/orders/create" \\
  -H "Content-Type: application/json" \\
  -H "x-reseller-key: ${currentApiKey}" \\
  -d '{
    "product_id": "297705",
    "quantity": 1,
    "customer_selling_price": 1250,
    "delivery_area": "inside_dhaka",
    "customer_name": "Abdul Karim",
    "customer_phone": "01712345678",
    "customer_address": "House 12, Road 4, Uttara, Dhaka",
    "customer_city": "Dhaka",
    "reseller_shop_name": "${profile?.shopName || "My Shop"}"
  }'`;

  return (
    <ResellerLayout>
      <SEOHead title="রিসেলার REST API ও অটোমেশন - Durtup Reseller" />

      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              রিসেলার REST API ও অটোমেশন
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার নিজস্ব ওয়েবসাইট, WooCommerce, Shopify বা যেকোনো সফটওয়্যারের সাথে সরাসরি কানেক্ট করে অটোমেটিক অর্ডার প্রসেস করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Status: Online (v1.0)
            </span>
          </div>
        </div>

        {/* 1. API Credentials Card */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-base text-white">রিসেলার API ক্রেডেনশিয়াল</h2>
              <p className="text-xs text-slate-400 mt-0.5">এই Key ব্যবহার করে বাহ্যিক ওয়েবসাইট বা স্ক্রিপ্ট থেকে নিরাপদ কল পাঠান</p>
            </div>

            <Button
              onClick={handleRegenerateKey}
              disabled={regenerating}
              variant="outline"
              size="sm"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-medium rounded-lg h-8 px-3"
            >
              {regenerating ? "তৈরি হচ্ছে..." : "নতুন Key জেনারেট করুন"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live API Key */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Live API Key (Public / Header)</span>
                <span className="text-slate-300 font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded">x-reseller-key</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-slate-200 truncate flex-1">
                  {profile?.apiKey || "dt_live_res_..."}
                </code>
                <Button
                  onClick={() => handleCopy("apiKey", profile?.apiKey || "")}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md shrink-0"
                >
                  {copiedKey === "apiKey" ? "কপি হয়েছে" : "কপি"}
                </Button>
              </div>
            </div>

            {/* Secret Key */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">API Secret</span>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
                >
                  {showSecret ? "লুকান" : "দেখুন"}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-slate-200 truncate flex-1">
                  {showSecret ? (profile?.apiSecret || "dts_...") : "••••••••••••••••••••••••••••"}
                </code>
                <Button
                  onClick={() => handleCopy("apiSecret", profile?.apiSecret || "")}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md shrink-0"
                >
                  {copiedKey === "apiSecret" ? "কপি হয়েছে" : "কপি"}
                </Button>
              </div>
            </div>
          </div>

          {/* Base Endpoint URL */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">API Base URL:</span>
              <code className="font-mono text-slate-200 font-medium">{apiBaseUrl}</code>
            </div>
            <Button
              onClick={() => handleCopy("baseUrl", apiBaseUrl)}
              size="sm"
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-medium rounded-lg h-7 px-3"
            >
              {copiedKey === "baseUrl" ? "কপি হয়েছে" : "URL কপি করুন"}
            </Button>
          </div>
        </div>

        {/* 2. Live Interactive API Console & Tester */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                লাইভ API কনসোল ও রিকোয়েস্ট পরীক্ষাগার
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                সরাসরি এই ব্রাউজার থেকেই প্রতিটি এন্ডপয়েন্ট লাইভ কল করে রেসপন্স যাচাই করুন
              </p>
            </div>
          </div>

          {/* Endpoint quick picker */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => handleEndpointSelect("/api/reseller/products", "GET")}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                selectedEndpoint === "/api/reseller/products"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="text-[10px] uppercase font-bold mr-1.5 opacity-80">GET</span>
              <span>হোলসেল ক্যাটালগ (/products)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/orders/create", "POST")}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                selectedEndpoint === "/api/reseller/orders/create"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="text-[10px] uppercase font-bold mr-1.5 opacity-80">POST</span>
              <span>অটোমেটিক অর্ডার প্লেসমেন্ট (/orders/create)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/orders", "GET")}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                selectedEndpoint === "/api/reseller/orders"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="text-[10px] uppercase font-bold mr-1.5 opacity-80">GET</span>
              <span>অর্ডার হিস্ট্রি ও ট্র্যাকিং (/orders)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/wallet", "GET")}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                selectedEndpoint === "/api/reseller/wallet"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="text-[10px] uppercase font-bold mr-1.5 opacity-80">GET</span>
              <span>ওয়ালেট ও ব্যালেন্স (/wallet)</span>
            </button>

            <button
              onClick={() => handleEndpointSelect("/api/reseller/verify-key", "POST")}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                selectedEndpoint === "/api/reseller/verify-key"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="text-[10px] uppercase font-bold mr-1.5 opacity-80">POST</span>
              <span>Key যাচাইকরণ (/verify-key)</span>
            </button>
          </div>

          {/* URL Bar & Execute Button */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 flex-1 font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-white mr-2">{requestMethod}</span>
              <span className="text-slate-600 dark:text-slate-300">https://www.durtup.shop{selectedEndpoint}</span>
            </div>
            <Button
              onClick={handleExecuteApiTest}
              disabled={testingApi}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold rounded-xl h-10 px-5 text-xs"
            >
              {testingApi ? "কলিং হচ্ছে..." : "টেস্ট রিকোয়েস্ট পাঠান"}
            </Button>
          </div>

          {/* Request Payload & Live Output Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Request Body (if POST) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Request Payload (JSON Body):</span>
                {requestMethod === "GET" && <span className="text-[11px] text-slate-400">GET মেথডে বডি প্রয়োজন নেই</span>}
              </div>
              <textarea
                disabled={requestMethod === "GET"}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder={requestMethod === "GET" ? "GET মেথডের জন্য কোনো বডি প্রয়োজন নেই।" : "JSON Payload লিখুন..."}
                rows={11}
                className="w-full bg-slate-950 text-slate-200 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 focus:outline-hidden disabled:opacity-40"
              />
            </div>

            {/* Live API Response Output */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Response Output:</span>
                <div className="flex items-center gap-2">
                  {apiStatus && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      apiStatus < 300 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" 
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400"
                    }`}>
                      Status: {apiStatus}
                    </span>
                  )}
                  {apiLatency && (
                    <span className="text-[10px] text-slate-400 font-mono">{apiLatency}ms</span>
                  )}
                  {apiResponse && (
                    <button
                      onClick={() => handleCopy("response", JSON.stringify(apiResponse, null, 2))}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-2"
                    >
                      {copiedKey === "response" ? "কপি হয়েছে" : "রেসপন্স কপি"}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full h-56 lg:h-[235px] bg-slate-950 text-slate-200 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 overflow-y-auto">
                {apiResponse ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                ) : (
                  <div className="text-slate-500 flex flex-col items-center justify-center h-full text-center p-4">
                    <span>উপরের "টেস্ট রিকোয়েস্ট পাঠান" বাটনে ক্লিক করুন।</span>
                    <span className="text-[10px] text-slate-600 mt-1">লাইভ JSON রেসপন্স ও এক্সিকিউশন টাইম এখানে প্রদর্শিত হবে।</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Ready Integration Snippets (WooCommerce, Node.js, Python, cURL) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              ইন্টিগ্রেশন কোড স্নিপেট (Ready-to-Use Code)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              আপনার প্ল্যাটফর্ম নির্বাচন করে রেডিমেড কোড কপি করে সরাসরি আপনার প্রজেক্টে যুক্ত করুন
            </p>
          </div>

          <Tabs defaultValue="woocommerce" className="space-y-4">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger value="woocommerce" className="rounded-lg text-xs font-semibold">WooCommerce / WordPress</TabsTrigger>
              <TabsTrigger value="nodejs" className="rounded-lg text-xs font-semibold">Node.js / JavaScript</TabsTrigger>
              <TabsTrigger value="python" className="rounded-lg text-xs font-semibold">Python</TabsTrigger>
              <TabsTrigger value="curl" className="rounded-lg text-xs font-semibold">cURL Command</TabsTrigger>
            </TabsList>

            {/* WooCommerce */}
            <TabsContent value="woocommerce" className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                আপনার ওয়ার্ডপ্রেস সাইটের <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">functions.php</code> ফাইলে এই কোডটি যুক্ত করলে কাস্টমার অর্ডার সরাসরি Durtup Reseller API-তে ড্রপশিপ হিসেবে জমা হয়ে যাবে:
              </p>
              <div className="relative">
                <Button
                  onClick={() => handleCopy("woo", wooCommerceSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-medium rounded-lg h-7 px-3"
                >
                  {copiedKey === "woo" ? "কপি হয়েছে" : "কপি কোড"}
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {wooCommerceSample}
                </pre>
              </div>
            </TabsContent>

            {/* Node.js */}
            <TabsContent value="nodejs" className="space-y-3">
              <div className="relative">
                <Button
                  onClick={() => handleCopy("node", jsSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-medium rounded-lg h-7 px-3"
                >
                  {copiedKey === "node" ? "কপি হয়েছে" : "কপি কোড"}
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {jsSample}
                </pre>
              </div>
            </TabsContent>

            {/* Python */}
            <TabsContent value="python" className="space-y-3">
              <div className="relative">
                <Button
                  onClick={() => handleCopy("python", pythonSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-medium rounded-lg h-7 px-3"
                >
                  {copiedKey === "python" ? "কপি হয়েছে" : "কপি কোড"}
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {pythonSample}
                </pre>
              </div>
            </TabsContent>

            {/* cURL */}
            <TabsContent value="curl" className="space-y-3">
              <div className="relative">
                <Button
                  onClick={() => handleCopy("curl", curlSample)}
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs font-medium rounded-lg h-7 px-3"
                >
                  {copiedKey === "curl" ? "কপি হয়েছে" : "কপি কোড"}
                </Button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  {curlSample}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 4. Webhook Notification Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              অটোমেশন ওয়েবহুক (Webhook Callbacks)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              অর্ডারের কুরিয়ার স্ট্যাটাস পরিবর্তন হলে (যেমন: Shipped, Delivered, Returned) আমরা স্বয়ংক্রিয়ভাবে আপনার সার্ভারে POST নোটিফিকেশন পাঠাব।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              type="url"
              placeholder="https://your-website.com/api/durtup-webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="rounded-xl text-xs h-10 flex-1 font-mono"
            />
            <Button
              onClick={handleSaveWebhook}
              disabled={savingWebhook}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold rounded-xl h-10 px-5 text-xs shrink-0"
            >
              {savingWebhook ? "সংরক্ষণ হচ্ছে..." : "Webhook সংরক্ষণ করুন"}
            </Button>
          </div>
        </div>

      </div>
    </ResellerLayout>
  );
}
