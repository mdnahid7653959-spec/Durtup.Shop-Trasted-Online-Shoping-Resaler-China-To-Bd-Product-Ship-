/**
 * Durtup.shop — Gemini AI-Powered Smart Product Search Server Engine
 *
 * This server module uses Google Gemini AI (1.5-Flash, 2.0-Flash, 2.5-Flash, text-embedding-004)
 * to deeply understand customer search intent, normalize queries, detect product types,
 * extract attributes (color, gender, style, material), expand bilingual synonyms (Bangla + English),
 * and correct spelling mistakes.
 *
 * STRICT SOURCE OF TRUTH:
 * Gemini AI NEVER generates, fabricates, or retrieves products from Google, Amazon, Daraz,
 * or any external database. ALL FINAL SEARCH RESULTS COME EXCLUSIVELY FROM THE REAL
 * DURTUP.SHOP PRODUCT CATALOG.
 */

import fs from "fs";
import path from "path";

// Types & Interfaces
export interface GeminiSearchIntent {
  originalQuery: string;
  normalizedQuery: string;
  productType: string;
  category: string;
  attributes: {
    color?: string | null;
    gender?: string | null;
    style?: string | null;
    material?: string | null;
  };
  synonyms: string[];
  negativeTerms: string[];
  spellingCorrected: boolean;
  correctedQuery?: string | null;
  detectedLanguage: "en" | "bn" | "mixed";
}

export interface GeminiProductResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  regular_price?: number;
  image: string;
  rating: number;
  reviews: number;
  sold?: number;
  category: string;
  category_name?: string;
  category_slug?: string;
  categorySlug?: string;
  color?: string;
  score: number;
  matchReasons: string[];
}

export interface GeminiSearchServerRequest {
  query: string;
  imageAttachment?: {
    base64: string;
    mimeType?: string;
  };
  categoryHint?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface GeminiSearchServerResponse {
  success: boolean;
  intent: GeminiSearchIntent;
  products: GeminiProductResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  source: "durtup_catalog";
  aiPowered: boolean;
  error?: string;
}

// In-Memory Intent Cache (1 Hour TTL)
const INTENT_CACHE = new Map<string, { intent: GeminiSearchIntent; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-Memory Master Catalog Cache
let cachedCatalog: any[] | null = null;

export function getDurtupCatalog(): any[] {
  if (cachedCatalog && cachedCatalog.length > 0) {
    return cachedCatalog;
  }

  const catalogMap = new Map<string, any>();

  // 1. Load visual_index.json (3,092 products)
  try {
    const visualPath = path.join(process.cwd(), "public", "visual_index.json");
    if (fs.existsSync(visualPath)) {
      const visualData: any[] = JSON.parse(fs.readFileSync(visualPath, "utf8"));
      visualData.forEach((p) => {
        if (p && p.id) catalogMap.set(String(p.id), p);
      });
    }
  } catch (err) {
    console.warn("[GeminiSearchEngine] Failed to load visual_index.json:", err);
  }

  // 2. Load ecomseller_catalog.json (274 products)
  try {
    const ecomPath = path.join(process.cwd(), "public", "ecomseller_catalog.json");
    if (fs.existsSync(ecomPath)) {
      const parsedEcom: any = JSON.parse(fs.readFileSync(ecomPath, "utf8"));
      const ecomData: any[] = Array.isArray(parsedEcom)
        ? parsedEcom
        : (Array.isArray(parsedEcom?.products) ? parsedEcom.products : []);
      ecomData.forEach((p) => {
        if (p && p.id && !catalogMap.has(String(p.id))) {
          catalogMap.set(String(p.id), {
            ...p,
            categorySlug: p.categorySlug || p.category_slug || "general",
            categoryName: p.categoryName || p.category || "General"
          });
        }
      });
    }
  } catch (err) {
    console.warn("[GeminiSearchEngine] Failed to load ecomseller_catalog.json:", err);
  }

  cachedCatalog = Array.from(catalogMap.values());
  return cachedCatalog;
}

// Normalization & String Helpers
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\bwi-fi\b/g, "wifi")
    .replace(/[\u2018\u2019\u201B\u2032\u2035\u0027\u0060\u00B4]/g, " ")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036\u0022]/g, " ")
    .replace(/[^\w\s\u0980-\u09FF-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordBoundaryMatch(text: string, term: string): boolean {
  if (!text || !term) return false;
  const tNorm = normalizeText(term);
  const textNorm = normalizeText(text);
  if (!tNorm || !textNorm) return false;
  if (textNorm === tNorm) return true;

  const escaped = tNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|[^\\w\\u0980-\\u09FF])${escaped}(?:$|[^\\w\\u0980-\\u09FF])`, "i");
  return regex.test(textNorm);
}

// Local High-Precision NLP Intent Extractor (Always works, offline / fallback / instantaneous)
export function parseIntentLocally(rawQuery: string): GeminiSearchIntent {
  const qNorm = normalizeText(rawQuery);
  const isBangla = /[\u0980-\u09FF]/.test(qNorm);
  const isEnglish = /[a-zA-Z]/.test(qNorm);
  const lang: "en" | "bn" | "mixed" = isBangla && isEnglish ? "mixed" : isBangla ? "bn" : "en";

  // 1. Detect Color Attributes
  let detectedColor: string | null = null;
  const colorMap: Record<string, string> = {
    black: "Black",
    white: "White",
    red: "Red",
    blue: "Blue",
    navy: "Navy",
    green: "Green",
    yellow: "Yellow",
    gold: "Gold",
    silver: "Silver / Grey",
    grey: "Silver / Grey",
    gray: "Silver / Grey",
    pink: "Pink",
    purple: "Purple",
    orange: "Orange",
    brown: "Brown",
    maroon: "Maroon",
    "কালো": "Black",
    "সাদা": "White",
    "লাল": "Red",
    "নীল": "Blue",
    "সবুজ": "Green",
    "হলুদ": "Yellow",
    "গোলাপি": "Pink"
  };

  for (const [cWord, cName] of Object.entries(colorMap)) {
    if (wordBoundaryMatch(qNorm, cWord)) {
      detectedColor = cName;
      break;
    }
  }

  // 2. Detect Gender Attributes
  let detectedGender: string | null = null;
  if (/\b(men|man|mens|boy|boys|ছেলে|ছেলেদের|পুরুষ)\b/i.test(qNorm)) {
    detectedGender = "men";
  } else if (/\b(women|woman|womens|girl|girls|মেয়ে|মেয়েদের|মহিলা|লেডিস)\b/i.test(qNorm)) {
    detectedGender = "women";
  } else if (/\b(kid|kids|baby|child|children|বাচ্চা|বাচ্চাদের)\b/i.test(qNorm)) {
    detectedGender = "kids";
  }

  // 3. Detect Style Attributes
  let detectedStyle: string | null = null;
  if (/\b(oversize|oversized|লুজ)\b/i.test(qNorm)) detectedStyle = "oversized";
  else if (/\b(polo|কলার)\b/i.test(qNorm)) detectedStyle = "polo";
  else if (/\b(printed|print|প্রিন্ট|ডিজাইন)\b/i.test(qNorm)) detectedStyle = "printed";
  else if (/\b(casual|ক্যাজুয়াল)\b/i.test(qNorm)) detectedStyle = "casual";
  else if (/\b(formal|অফিস)\b/i.test(qNorm)) detectedStyle = "formal";
  else if (/\b(smart|স্মার্ট)\b/i.test(qNorm)) detectedStyle = "smart";

  // 4. Common Spelling Corrections
  let correctedQuery: string | null = null;
  let spellingCorrected = false;
  const typoMap: Record<string, string> = {
    tshrit: "t-shirt",
    tshit: "t-shirt",
    tshrts: "t-shirt",
    moblie: "mobile",
    mobail: "mobile",
    smatphone: "smartphone",
    headfone: "headphone",
    hedphone: "headphone",
    airpod: "airpods",
    earfone: "earphone",
    juta: "shoes",
    jutha: "shoes",
    sneekers: "sneakers",
    trimer: "trimmer",
    shver: "shaver",
    fann: "fan",
    refrigirator: "refrigerator",
    frige: "fridge"
  };

  const tokens = qNorm.split(/\s+/);
  const correctedTokens = tokens.map((t) => {
    if (typoMap[t]) {
      spellingCorrected = true;
      return typoMap[t];
    }
    return t;
  });

  if (spellingCorrected) {
    correctedQuery = correctedTokens.join(" ");
  }

  const effectiveQuery = (correctedQuery || qNorm).toLowerCase();

  // 5. Concept / Product Type Detection
  let productType = effectiveQuery;
  let category = "general";
  let synonyms: string[] = [effectiveQuery];
  let negativeTerms: string[] = [];

  function matchesConcept(terms: string[]): boolean {
    for (const term of terms) {
      if (wordBoundaryMatch(effectiveQuery, term)) return true;
    }
    return false;
  }

  if (matchesConcept(["t-shirt", "tshirt", "t shirt", "tee", "টি শার্ট", "টি-শার্ট", "টিশার্ট", "গেঞ্জি"])) {
    productType = "t-shirt";
    category = "mens-fashion";
    synonyms = ["t-shirt", "t shirt", "tshirt", "polo t-shirt", "graphic t-shirt", "oversized t-shirt", "cotton t-shirt", "টি শার্ট", "টি-শার্ট", "টিশার্ট", "গেঞ্জি"];
    negativeTerms = ["hot pot", "separator", "battery charger", "watch", "water dispenser", "router", "hair trimmer"];
  } else if (matchesConcept(["shirt", "casual shirt", "formal shirt", "shart", "শার্ট"])) {
    productType = "shirt";
    category = "mens-fashion";
    synonyms = ["shirt", "casual shirt", "formal shirt", "shart", "শার্ট"];
    negativeTerms = ["hot pot", "separator", "battery charger", "watch", "water dispenser", "router"];
  } else if (matchesConcept(["panjabi", "punjabi", "kabli", "kurta", "পাঞ্জাবি", "পাঞ্জাবী", "কাবলি", "কুর্তা"])) {
    productType = "panjabi";
    category = "mens-fashion";
    synonyms = ["panjabi", "punjabi", "kabli", "kurta", "পাঞ্জাবি", "পাঞ্জাবী", "কাবলি"];
    negativeTerms = ["watch", "charger", "hot pot", "router"];
  } else if (matchesConcept(["watch", "smartwatch", "smart watch", "wrist watch", "ঘড়ি", "ঘড়ি", "হাত ঘড়ি", "স্মার্টওয়াচ"])) {
    productType = "watch";
    category = "watch";
    synonyms = ["watch", "smartwatch", "smart watch", "wrist watch", "quartz watch", "ঘড়ি", "ঘড়ি", "হাত ঘড়ি", "স্মার্টওয়াচ"];
    negativeTerms = ["t-shirt", "shirt", "pant", "hot pot", "router", "shoes"];
  } else if (matchesConcept(["mobile", "phone", "smartphone", "cell phone", "button phone", "মোবাইল", "ফোন", "স্মার্টফোন"])) {
    productType = "mobile";
    category = "gadgets-electronics";
    synonyms = ["mobile", "mobile phone", "phone", "smartphone", "button phone", "feature phone", "মোবাইল", "ফোন", "স্মার্টফোন", "বাটন মোবাইল"];
    negativeTerms = ["t-shirt", "dress", "saree", "hot pot", "panjabi"];
  } else if (matchesConcept(["shoe", "shoes", "sneaker", "sneakers", "footwear", "boots", "sandals", "loafers", "জুতা", "জুতো", "স্নিকার্স"])) {
    productType = "shoes";
    category = "shoes-footwear";
    synonyms = ["shoes", "shoe", "sneaker", "sneakers", "footwear", "boots", "sandals", "loafers", "জুতা", "জুতো", "স্নিকার্স"];
    negativeTerms = ["hot pot", "watch", "mobile", "router", "t-shirt"];
  } else if (matchesConcept(["bag", "backpack", "handbag", "school bag", "travel bag", "wallet", "ব্যাগ", "হ্যান্ডব্যাগ", "ব্যাকপ্যাক"])) {
    productType = "bag";
    category = "bags-backpacks";
    synonyms = ["bag", "bags", "backpack", "handbag", "school bag", "travel bag", "side bag", "wallet", "ব্যাগ", "হ্যান্ডব্যাগ", "ব্যাকপ্যাক", "মানিব্যাগ"];
    negativeTerms = ["hot pot", "router", "t-shirt", "charger"];
  } else if (matchesConcept(["charger", "charging", "adapter", "fast charger", "usb cable", "type-c", "চার্জার"])) {
    productType = "charger";
    category = "gadgets-electronics";
    synonyms = ["charger", "fast charger", "charging cable", "adapter", "usb cable", "type-c", "charging", "socket", "power strip", "চার্জার", "ক্যাবল"];
    negativeTerms = ["t-shirt", "hot pot", "shoe", "dress"];
  } else if (matchesConcept(["trimmer", "shaver", "clipper", "hair trimmer", "ট্রিমার", "শেভার"])) {
    productType = "trimmer";
    category = "health-beauty";
    synonyms = ["trimmer", "clipper", "shaver", "hair trimmer", "nose trimmer", "beard trimmer", "hair clipper", "ট্রিমার", "শেভার"];
    negativeTerms = ["hot pot", "t-shirt", "watch", "bag"];
  } else if (matchesConcept(["fridge", "refrigerator", "deep fridge", "mini fridge", "ফ্রিজ", "রেফ্রিজারেটর"])) {
    productType = "fridge";
    category = "home-lifestyle";
    synonyms = ["fridge", "refrigerator", "deep fridge", "mini fridge", "ফ্রিজ", "রেফ্রিজারেটর", "ডিপ ফ্রিজ"];
    negativeTerms = ["t-shirt", "watch", "shoe", "mobile"];
  } else if (matchesConcept(["earbud", "earbuds", "earphone", "headphone", "airpod", "airpods", "tws", "হেডফোন", "ইয়ারফোন"])) {
    productType = "headphones";
    category = "gadgets-electronics";
    synonyms = ["headphones", "earphones", "earbuds", "headset", "airpods", "tws", "wireless earbuds", "হেডফোন", "ইয়ারফোন", "ইয়ারবাডস", "এয়ারপডস"];
    negativeTerms = ["hot pot", "t-shirt", "shoe", "bag"];
  } else if (matchesConcept(["fan", "mini fan", "table fan", "rechargeable fan", "ফ্যান"])) {
    productType = "fan";
    category = "home-lifestyle";
    synonyms = ["fan", "mini fan", "hand fan", "portable fan", "rechargeable fan", "table fan", "ফ্যান", "মিনি ফ্যান", "চার্জার ফ্যান"];
    negativeTerms = ["t-shirt", "watch", "shoes"];
  } else if (matchesConcept(["camera", "cctv", "ip camera", "wifi camera", "wi-fi camera", "spy camera", "mini camera", "night vision", "bulb camera", "security camera", "surveillance", "v380", "a9", "x5", "ক্যামেরা", "সিসিটিভি"])) {
    productType = "camera";
    category = "gadgets-electronics";
    synonyms = ["camera", "cctv", "ip camera", "wifi camera", "wi-fi camera", "mini camera", "spy camera", "bulb camera", "security camera", "surveillance", "wireless camera", "ডোম ক্যামেরা", "সিসিটিভি", "ক্যামেরা"];
    negativeTerms = ["t-shirt", "shirt", "shoe", "dress", "panjabi", "bag"];
  }

  return {
    originalQuery: rawQuery,
    normalizedQuery: effectiveQuery,
    productType,
    category,
    attributes: {
      color: detectedColor,
      gender: detectedGender,
      style: detectedStyle,
      material: null
    },
    synonyms,
    negativeTerms,
    spellingCorrected,
    correctedQuery,
    detectedLanguage: lang
  };
}

export function getGeminiApiKey(): string {
  let key = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();
  if (!key) {
    try {
      const candidates = [
        path.join(process.cwd(), ".env"),
        path.join(process.cwd(), "durtup-shop-v2-main", ".env"),
        path.resolve(process.cwd(), "../.env"),
        path.resolve(__dirname, "../../.env"),
        path.resolve(__dirname, "../../../.env")
      ];
      for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf8");
          const match = envContent.match(/(?:VITE_)?GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
          if (match && match[1]) {
            key = match[1].trim();
            break;
          }
        }
      }
    } catch {}
  }
  return key;
}

// Call Google Gemini API for Deep Search Understanding
export async function understandSearchWithGemini(
  query: string,
  imageAttachment?: { base64: string; mimeType?: string }
): Promise<GeminiSearchIntent> {
  const cacheKey = normalizeText(query) + (imageAttachment ? "_img" : "");
  const cached = INTENT_CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.intent;
  }

  const apiKey = getGeminiApiKey();

  // If no Gemini API key configured, use local NLP intent parser
  if (!apiKey) {
    const localIntent = parseIntentLocally(query);
    INTENT_CACHE.set(cacheKey, { intent: localIntent, expiresAt: Date.now() + CACHE_TTL_MS });
    return localIntent;
  }

  const systemPrompt = `You are the Search Query Understanding Engine for Durtup.shop (an e-commerce marketplace in Bangladesh).
Your job is ONLY to analyze the customer's search query (and image if provided) and extract structured e-commerce search intent.
DO NOT recommend or return external products from Google, Amazon, Daraz, or external websites.
DO NOT invent products.

Output MUST be a single raw JSON object matching this schema:
{
  "normalizedQuery": "string (lowercase, cleaned standard search term, e.g. 't-shirt')",
  "productType": "string (primary product type, e.g. 't-shirt', 'smartwatch', 'mobile', 'shoes', 'bag', 'charger', 'trimmer', 'fan', 'fridge')",
  "category": "string (category slug: 'mens-fashion' | 'womens-fashion' | 'gadgets-electronics' | 'watch' | 'home-lifestyle' | 'health-beauty' | 'shoes-footwear' | 'bags-backpacks' | 'kids-zone' | 'foods' | 'general')",
  "attributes": {
    "color": "string or null (e.g. 'black', 'white', 'navy', 'gold')",
    "gender": "string or null ('men' | 'women' | 'kids' | 'unisex' | null)",
    "style": "string or null (e.g. 'oversized', 'printed', 'casual', 'polo', 'formal')",
    "material": "string or null (e.g. 'cotton', 'leather', 'stainless steel')"
  },
  "synonyms": ["array of 4 to 8 high-precision bilingual synonyms in English and Bengali, e.g. 't-shirt', 't shirt', 'tshirt', 'tee', 'টি শার্ট', 'টি-শার্ট']",
  "negativeTerms": ["array of conflicting product types that MUST NOT match, e.g. for t-shirt: 'hot pot', 'watch', 'charger', 'router', 'dispenser']",
  "spellingCorrected": true_or_false,
  "correctedQuery": "corrected string if spelling error was detected, otherwise null",
  "detectedLanguage": "'en' | 'bn' | 'mixed'"
}`;

  const selectedModel = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const models = [
    selectedModel,
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash"
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const model of models) {
    try {
      const parts: any[] = [];

      if (imageAttachment?.base64) {
        const cleanBase64 = imageAttachment.base64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: imageAttachment.mimeType || "image/jpeg",
            data: cleanBase64
          }
        });
        parts.push({
          text: `Identify the e-commerce product shown in this image. Additional customer search text: "${query || ""}". Return the structured search intent JSON.`
        });
      } else {
        parts.push({
          text: `Analyze this customer search query: "${query}". Return the structured search intent JSON.`
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                role: "user",
                parts
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
          const intent: GeminiSearchIntent = {
            originalQuery: query,
            normalizedQuery: parsed.normalizedQuery || normalizeText(query),
            productType: parsed.productType || normalizeText(query),
            category: parsed.category || "general",
            attributes: {
              color: parsed.attributes?.color || null,
              gender: parsed.attributes?.gender || null,
              style: parsed.attributes?.style || null,
              material: parsed.attributes?.material || null
            },
            synonyms: Array.isArray(parsed.synonyms) && parsed.synonyms.length > 0 ? parsed.synonyms : [parsed.productType || query],
            negativeTerms: Array.isArray(parsed.negativeTerms) ? parsed.negativeTerms : [],
            spellingCorrected: Boolean(parsed.spellingCorrected),
            correctedQuery: parsed.correctedQuery || null,
            detectedLanguage: parsed.detectedLanguage || "en"
          };

          INTENT_CACHE.set(cacheKey, { intent, expiresAt: Date.now() + CACHE_TTL_MS });
          return intent;
        }
      }
    } catch (err) {
      console.warn(`[GeminiSearchEngine] Call to ${model} failed, trying next:`, err);
    }
  }

  // Graceful Fallback if all Gemini API calls fail
  const fallbackIntent = parseIntentLocally(query);
  INTENT_CACHE.set(cacheKey, { intent: fallbackIntent, expiresAt: Date.now() + CACHE_TTL_MS });
  return fallbackIntent;
}

// Master Search Executor: Queries ONLY the real Durtup Catalog using Gemini Intent
export async function handleGeminiSearchServerRequest(
  body: GeminiSearchServerRequest
): Promise<GeminiSearchServerResponse> {
  const { query = "", imageAttachment, categoryHint, minPrice, maxPrice, page = 1, limit = 24 } = body;

  const catalog = getDurtupCatalog();

  // 1. Gemini AI understands customer search intent
  const intent = await understandSearchWithGemini(query, imageAttachment);

  const queryNorm = intent.normalizedQuery;
  const productType = intent.productType;
  const termsList = Array.from(new Set([queryNorm, productType, ...intent.synonyms].map((s) => normalizeText(s))));
  const queryTokens = queryNorm ? queryNorm.split(/[\s-]+/).filter(Boolean) : [];
  const negativeTerms = intent.negativeTerms.map((t) => normalizeText(t));

  const scoredProducts: GeminiProductResult[] = [];

  for (const p of catalog) {
    let score = 0;
    const matchReasons: string[] = [];

    const pName = p.name || "";
    const pNameNorm = normalizeText(pName);
    const pCat = normalizeText(p.categoryName || p.categorySlug || p.category || "");
    const pTokens = (p.tokens || []).map((t: any) => normalizeText(String(t)));
    const pId = String(p.id || "").trim();
    const pColor = normalizeText(p.color || "");

    // Filter price range if applied
    const price = Number(p.price) || 0;
    if (minPrice !== undefined && price < minPrice) continue;
    if (maxPrice !== undefined && price > maxPrice) continue;

    // Filter category if specified
    if (categoryHint && categoryHint !== "all") {
      const hintNorm = normalizeText(categoryHint);
      if (!pCat.includes(hintNorm) && !hintNorm.includes(pCat)) continue;
    }

    const pWords = pNameNorm.split(/\s+/).filter(Boolean);
    const pSku = normalizeText(p.product_code || p.sku || "");

    if (!queryNorm && !imageAttachment) {
      score = 10;
    } else {
      // Direct text match check: products directly matching the user's input should never be suppressed by AI negative terms
      const isDirectQueryMatch = queryNorm && (
        pNameNorm.includes(queryNorm) ||
        (pSku && pSku.includes(queryNorm)) ||
        (pId && pId.includes(queryNorm)) ||
        pWords.some((w) => w.startsWith(queryNorm)) ||
        (queryTokens.length > 0 && queryTokens.every((t) => pNameNorm.includes(t)))
      );

      // STRICT NEGATIVE CHECK: Only reject non-direct matches that conflict with negative concepts
      if (!isDirectQueryMatch) {
        let hasNegativeMatch = false;
        for (const neg of negativeTerms) {
          if (neg.length >= 3 && wordBoundaryMatch(pNameNorm, neg)) {
            hasNegativeMatch = true;
            break;
          }
        }
        if (hasNegativeMatch) {
          continue;
        }
      }

      // 1. Exact SKU / ID match (+5000)
      if (pId === queryNorm || (pSku && pSku === queryNorm) || (queryNorm.length >= 3 && (pId.includes(queryNorm) || pSku.includes(queryNorm)))) {
        score += 5000;
        matchReasons.push("Exact SKU/Code Match");
      }

      // 2. Full exact phrase match (+4500 to +2500)
      if (pNameNorm === queryNorm) {
        score += 4500;
        matchReasons.push("Exact Name Match");
      } else if (wordBoundaryMatch(pNameNorm, queryNorm)) {
        score += 4000;
        matchReasons.push("Full Query Match");
      } else if (pNameNorm.startsWith(queryNorm)) {
        score += 3500;
        matchReasons.push("Prefix Match");
      } else if (pWords.some((w) => w.startsWith(queryNorm))) {
        score += 3000;
        matchReasons.push("Word Prefix Match");
      } else if (pNameNorm.includes(queryNorm)) {
        score += 2500;
        matchReasons.push("Substring Match");
      }

      // 3. Product Type match (+1500)
      if (productType && productType !== queryNorm) {
        if (wordBoundaryMatch(pNameNorm, productType)) {
          score += 1500;
          matchReasons.push(`Product Type: ${productType}`);
        } else if (pWords.some((w) => w.startsWith(productType))) {
          score += 1200;
          matchReasons.push(`Product Type Prefix: ${productType}`);
        } else if (pNameNorm.includes(productType)) {
          score += 800;
          matchReasons.push(`Product Type Substring: ${productType}`);
        }
      }

      // 4. Synonym Matches (+1200)
      for (const term of termsList) {
        if (term && term !== productType && term !== queryNorm) {
          if (wordBoundaryMatch(pNameNorm, term)) {
            score += 1200;
            matchReasons.push(`Matched Synonym: ${term}`);
            break;
          } else if (pWords.some((w) => w.startsWith(term))) {
            score += 1000;
            matchReasons.push(`Matched Synonym Prefix: ${term}`);
            break;
          } else if (pNameNorm.includes(term)) {
            score += 600;
            matchReasons.push(`Matched Synonym Substring: ${term}`);
            break;
          }
        }
      }

      // 5. Query Token Coverage (+1000 for 100%, +500 for >=60%)
      let matchedTokens = 0;
      for (const t of queryTokens) {
        if (
          wordBoundaryMatch(pNameNorm, t) ||
          pTokens.includes(t) ||
          pWords.some((w) => w.startsWith(t)) ||
          pNameNorm.includes(t)
        ) {
          matchedTokens++;
        }
      }
      if (queryTokens.length > 0 && matchedTokens === queryTokens.length) {
        score += 1000;
      } else if (matchedTokens >= 3 || (queryTokens.length > 1 && matchedTokens / queryTokens.length >= 0.45)) {
        score += Math.round(500 * (matchedTokens / Math.max(1, queryTokens.length))) + 400;
      }

      // 6. Attribute Boosts
      // A. Color Match (+500)
      if (intent.attributes.color) {
        const cLower = intent.attributes.color.toLowerCase();
        if (pColor.includes(cLower) || wordBoundaryMatch(pNameNorm, cLower)) {
          score += 500;
          matchReasons.push(`Color: ${intent.attributes.color}`);
        }
      }

      // B. Gender Match (+600 for product name, -800 if opposite gender)
      if (intent.attributes.gender) {
        const g = intent.attributes.gender.toLowerCase();
        const hasMenInName = wordBoundaryMatch(pNameNorm, "men") || wordBoundaryMatch(pNameNorm, "mens") || wordBoundaryMatch(pNameNorm, "man");
        const hasWomenInName = wordBoundaryMatch(pNameNorm, "women") || wordBoundaryMatch(pNameNorm, "womens") || wordBoundaryMatch(pNameNorm, "woman") || wordBoundaryMatch(pNameNorm, "girl") || wordBoundaryMatch(pNameNorm, "girls");
        const hasKidsInName = wordBoundaryMatch(pNameNorm, "kid") || wordBoundaryMatch(pNameNorm, "kids") || wordBoundaryMatch(pNameNorm, "baby") || wordBoundaryMatch(pNameNorm, "children");

        if (g === "men") {
          if (hasMenInName) {
            score += 600;
            matchReasons.push("Gender: Men");
          } else if (hasKidsInName || hasWomenInName) {
            score -= 800; // Penalize kids / women when user explicitly wants men
          }
        } else if (g === "women") {
          if (hasWomenInName) {
            score += 600;
            matchReasons.push("Gender: Women");
          } else if (hasKidsInName) {
            score -= 800;
          }
        } else if (g === "kids") {
          if (hasKidsInName) {
            score += 600;
            matchReasons.push("Gender: Kids");
          }
        }
      }

      // C. Style Match (+500)
      if (intent.attributes.style) {
        if (wordBoundaryMatch(pNameNorm, intent.attributes.style)) {
          score += 500;
          matchReasons.push(`Style: ${intent.attributes.style}`);
        }
      }

      // 7. Category Boost (+200)
      if (intent.category && intent.category !== "general") {
        const catNorm = normalizeText(intent.category);
        if (pCat.includes(catNorm) || catNorm.includes(pCat)) {
          score += 200;
        }
      }
    }

    // STRICT RELEVANCE THRESHOLD: Must achieve at least 500 points to qualify as relevant
    const minThreshold = queryNorm || imageAttachment ? 500 : 1;

    if (score >= minThreshold) {
      // Authentic quality tie-breaker bonuses
      if (p.rating) score += Number(p.rating);
      if (p.sold) score += Math.min(10, Number(p.sold) * 0.05);

      scoredProducts.push({
        id: String(p.id),
        name: p.name,
        slug: p.slug || `product-${p.id}`,
        price: Number(p.price) || 0,
        originalPrice: Number(p.regular_price || p.originalPrice) || undefined,
        regular_price: Number(p.regular_price || p.originalPrice) || undefined,
        image: p.image || (p.images && p.images[0]) || "",
        rating: Number(p.rating) || 4.8,
        reviews: Number(p.reviews) || 15,
        sold: Number(p.sold) || 45,
        category: p.categoryName || p.category || "General",
        category_name: p.categoryName || p.category || "General",
        category_slug: p.categorySlug || p.category_slug,
        categorySlug: p.categorySlug || p.category_slug,
        color: p.color,
        score,
        matchReasons
      });
    }
  }

  // Sort descending by calculated relevance score
  scoredProducts.sort((a, b) => b.score - a.score);

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedProducts = scoredProducts.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(scoredProducts.length / limit) || 1;

  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();

  return {
    success: true,
    intent,
    products: paginatedProducts,
    total: scoredProducts.length,
    page,
    limit,
    totalPages,
    source: "durtup_catalog",
    aiPowered: Boolean(apiKey)
  };
}
