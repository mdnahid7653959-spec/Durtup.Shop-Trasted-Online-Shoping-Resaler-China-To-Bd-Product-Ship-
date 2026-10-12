/**
 * Durtup.shop — Production Visual Product Search Server Engine
 *
 * Architecture:
 * Layer A — AI Multimodal Vision (Gemini 2.5-Flash / 2.0-Flash / 1.5-Flash)
 * Layer B — Complete Durtup Catalog Search (visual_index.json + ecomseller + dynamic products)
 * Layer C — Visual Similarity (Perceptual Color Histogram + Aspect Ratio + Image Fingerprint)
 * Layer D — Hybrid Ranking (Exact Match vs Similar Products with High Recall -> Precision)
 * Layer E — In-Memory Multi-Tier Caching (SHA-256 Image Hash & Session Pagination)
 *
 * Security: Server-side only. Zero client exposure of API keys.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parseIntentLocally } from "./geminiSearchEngine";

export interface VisualProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  regular_price?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  sold?: number;
  category: string;
  category_name?: string;
  category_slug?: string;
  categorySlug?: string;
  color?: string;
  colorHex?: string;
  matchScore: number;
  matchTier?: "best" | "similar";
  matchedReasons?: string[];
}

export interface GeminiVisualAnalysis {
  product_type: string;
  category: string;
  subcategory?: string | null;
  brand?: string | null;
  model?: string | null;
  primary_color: string;
  secondary_colors: string[];
  material?: string | null;
  shape?: string | null;
  style?: string | null;
  gender?: string | null;
  use_case?: string | null;
  visual_attributes: string[];
  visible_text: string[];
  keywords_en: string[];
  keywords_bn: string[];
  search_query: string;
  confidence: number;
}

export interface VisualSearchServerRequest {
  imageBase64?: string;
  imageHash?: string;
  sessionKey?: string;
  filename?: string;
  userQuery?: string;
  categoryHint?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  maxResults?: number; // legacy alias
}

export interface VisualSearchServerResponse {
  success: boolean;
  sessionKey?: string;
  primaryKeyword?: string;
  confidence?: number;
  detectedCategory?: string;
  detectedColor?: string;
  keywords?: string[];
  matchedProductIds?: string[];
  bestMatches?: VisualProductItem[];
  similarProducts?: VisualProductItem[];
  products?: VisualProductItem[]; // current page sliced items
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore?: boolean;
  aiPowered?: boolean;
  aiAnalysis?: GeminiVisualAnalysis;
  latencyMs?: {
    gemini?: number;
    retrieval?: number;
    ranking?: number;
    total?: number;
  };
  error?: string;
}

// Memory Caches with TTL
interface CachedSession {
  rankedItems: ScoredItemInternal[];
  analysis: GeminiVisualAnalysis;
  timestamp: number;
}

const SESSION_CACHE = new Map<string, CachedSession>();
const IMAGE_HASH_CACHE = new Map<string, { analysis: GeminiVisualAnalysis; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Clean expired cache items periodically
function cleanExpiredCaches() {
  const now = Date.now();
  for (const [k, v] of SESSION_CACHE.entries()) {
    if (now - v.timestamp > CACHE_TTL_MS) SESSION_CACHE.delete(k);
  }
  for (const [k, v] of IMAGE_HASH_CACHE.entries()) {
    if (now - v.timestamp > CACHE_TTL_MS) IMAGE_HASH_CACHE.delete(k);
  }
}

// Catalog Data Model
interface IndexedProductInternal {
  id: string;
  slug: string;
  name: string;
  price: number;
  regular_price: number;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  sold: number;
  categorySlug: string;
  categoryName: string;
  categoryBangla?: string;
  color: string;
  colorHex: string;
  aspect: "square" | "portrait" | "landscape";
  tokens: string[];
  nameNorm: string;
  pWords: string[];
  imageBasenames: Set<string>;
}

interface ScoredItemInternal {
  product: IndexedProductInternal;
  score: number;
  tier: "best" | "similar";
  reasons: string[];
}

let cachedMasterCatalog: IndexedProductInternal[] | null = null;
let catalogLastLoaded = 0;

// Text & Word Utilities
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
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

export function extractImageFileBasename(urlOrName?: string): string {
  if (!urlOrName) return "";
  try {
    const clean = urlOrName.split("?")[0].split("#")[0];
    const filename = clean.split("/").pop() || "";
    return filename.toLowerCase().replace(/\.[a-z0-9]+$/i, "").trim();
  } catch {
    return "";
  }
}

// Stop words specifically for camera/random photos so they never break searches
const CAMERA_STOP_WORDS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "heic",
  "img", "image", "images", "photo", "photos", "pic", "pics", "picture", "pictures",
  "camera", "capture", "screenshot", "screenshots", "screen", "unnamed",
  "download", "downloads", "upload", "uploads", "dcim", "snapseed", "lightroom",
  "whatsapp", "telegram", "messenger", "facebook", "temp", "copy",
  "file", "files", "item", "items", "product", "products", "asset", "assets"
]);

// 12-Bin Color Map for Visual Similarity
const COLOR_PALETTE_BINS: Record<string, { hex: string; keywords: string[] }> = {
  Black: { hex: "#18181b", keywords: ["black", "dark", "কালো", "noir", "jet black"] },
  White: { hex: "#f8fafc", keywords: ["white", "সাদা", "ivory", "pearl white", "clear"] },
  "Silver / Grey": { hex: "#94a3b8", keywords: ["silver", "grey", "gray", "সিলভার", "ash", "metallic", "chrome", "titanium"] },
  Gold: { hex: "#eab308", keywords: ["gold", "golden", "সোনালী", "yellow", "হলুদ", "brass", "bronze", "kundan"] },
  Blue: { hex: "#3b82f6", keywords: ["blue", "নীল", "navy", "নেভি", "sky blue", "royal blue", "cyan", "dark blue"] },
  Red: { hex: "#ef4444", keywords: ["red", "লাল", "maroon", "মেরুন", "burgundy", "crimson"] },
  Green: { hex: "#22c55e", keywords: ["green", "সবুজ", "olive", "emerald", "mint"] },
  Pink: { hex: "#ec4899", keywords: ["pink", "গোলাপি", "rose", "magenta", "baby pink"] },
  Purple: { hex: "#a855f7", keywords: ["purple", "বেগুনী", "violet", "lavender"] },
  Orange: { hex: "#f97316", keywords: ["orange", "কমলা", "amber", "peach"] },
  Brown: { hex: "#78350f", keywords: ["brown", "বাদামী", "tan", "coffee", "chocolate", "khaki"] },
  "Multi-color": { hex: "#6366f1", keywords: ["multi", "multicolor", "colorful", "রঙিন"] }
};

// Full Master Catalog Loader
export function getDurtupMasterCatalog(): IndexedProductInternal[] {
  const now = Date.now();
  if (cachedMasterCatalog && cachedMasterCatalog.length > 0 && now - catalogLastLoaded < 5 * 60 * 1000) {
    return cachedMasterCatalog;
  }

  const catalogMap = new Map<string, IndexedProductInternal>();

  // 1. Load visual_index.json (3,092 products)
  try {
    const visualPath = path.join(process.cwd(), "public", "visual_index.json");
    if (fs.existsSync(visualPath)) {
      const visualData: any[] = JSON.parse(fs.readFileSync(visualPath, "utf8"));
      visualData.forEach((p) => {
        if (!p || !p.id) return;
        const pid = String(p.id);
        const name = p.name || "Product";
        const nameNorm = normalizeText(name);
        const pWords = nameNorm.split(/\s+/).filter(Boolean);
        const imageList = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
        const imageBasenames = new Set<string>();
        imageList.forEach((img: string) => {
          const b = extractImageFileBasename(img);
          if (b && b.length >= 4) imageBasenames.add(b);
        });

        catalogMap.set(pid, {
          id: pid,
          slug: p.slug || pid,
          name,
          price: Number(p.price) || 0,
          regular_price: Number(p.regular_price || p.originalPrice) || Number(p.price) || 0,
          image: p.image || imageList[0] || "",
          images: imageList,
          rating: Number(p.rating) || 4.8,
          reviews: Number(p.reviews) || 15,
          sold: Number(p.sold) || 45,
          categorySlug: p.categorySlug || p.category_slug || "general",
          categoryName: p.categoryName || p.category || "General",
          categoryBangla: p.categoryBangla,
          color: p.color || "Multi-color",
          colorHex: p.colorHex || "#6366f1",
          aspect: p.aspect || "square",
          tokens: (p.tokens || []).map((t: any) => normalizeText(String(t))),
          nameNorm,
          pWords,
          imageBasenames
        });
      });
    }
  } catch (err) {
    console.warn("[VisualSearchEngine] Failed to load visual_index.json:", err);
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
        if (!p || !p.id) return;
        const pid = String(p.id);
        if (catalogMap.has(pid)) return;

        const name = p.name || p.title || "Product";
        const nameNorm = normalizeText(name);
        const pWords = nameNorm.split(/\s+/).filter(Boolean);
        const imageList = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
        const imageBasenames = new Set<string>();
        imageList.forEach((img: string) => {
          const b = extractImageFileBasename(img);
          if (b && b.length >= 4) imageBasenames.add(b);
        });

        catalogMap.set(pid, {
          id: pid,
          slug: p.slug || pid,
          name,
          price: Number(p.price) || 0,
          regular_price: Number(p.regular_price || p.originalPrice) || Number(p.price) || 0,
          image: p.image || imageList[0] || "",
          images: imageList,
          rating: Number(p.rating) || 4.7,
          reviews: Number(p.reviews) || 12,
          sold: Number(p.sold) || 30,
          categorySlug: p.categorySlug || p.category_slug || "general",
          categoryName: p.categoryName || p.category || "General",
          color: "Multi-color",
          colorHex: "#6366f1",
          aspect: "square",
          tokens: pWords.slice(0, 10),
          nameNorm,
          pWords,
          imageBasenames
        });
      });
    }
  } catch (err) {
    console.warn("[VisualSearchEngine] Failed to load ecomseller_catalog.json:", err);
  }

  cachedMasterCatalog = Array.from(catalogMap.values());
  catalogLastLoaded = now;
  return cachedMasterCatalog;
}

// Allow dynamic product insertion when new products are created
export function indexProductInVisualSearch(product: any): void {
  if (!product || !product.id) return;
  const catalog = getDurtupMasterCatalog();
  const pid = String(product.id);
  const name = product.name || product.title || "Product";
  const nameNorm = normalizeText(name);
  const pWords = nameNorm.split(/\s+/).filter(Boolean);
  const imageList = Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []);
  const imageBasenames = new Set<string>();
  imageList.forEach((img: string) => {
    const b = extractImageFileBasename(img);
    if (b && b.length >= 4) imageBasenames.add(b);
  });

  const entry: IndexedProductInternal = {
    id: pid,
    slug: product.slug || pid,
    name,
    price: Number(product.price) || 0,
    regular_price: Number(product.regular_price || product.originalPrice) || Number(product.price) || 0,
    image: product.image || imageList[0] || "",
    images: imageList,
    rating: Number(product.rating) || 4.8,
    reviews: Number(product.reviews) || 15,
    sold: Number(product.sold) || 45,
    categorySlug: product.categorySlug || product.category_slug || "general",
    categoryName: product.categoryName || product.category || "General",
    color: product.color || "Multi-color",
    colorHex: product.colorHex || "#6366f1",
    aspect: product.aspect || "square",
    tokens: (product.tokens || pWords).map((t: any) => normalizeText(String(t))),
    nameNorm,
    pWords,
    imageBasenames
  };

  const existingIdx = catalog.findIndex((p) => p.id === pid);
  if (existingIdx >= 0) {
    catalog[existingIdx] = entry;
  } else {
    catalog.unshift(entry);
  }
}

export function removeProductFromVisualSearch(id: string): void {
  if (!id || !cachedMasterCatalog) return;
  cachedMasterCatalog = cachedMasterCatalog.filter((p) => p.id !== String(id));
}

// Perceptual Image Features Extraction using Sharp
export async function extractPerceptualImageFeatures(buffer: Buffer) {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 500;
    const height = metadata.height || 500;
    const aspect = width / height;

    // Resize to 32x32 to get color distribution
    const { data } = await sharp(buffer)
      .resize(32, 32, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let rSum = 0, gSum = 0, bSum = 0;
    const pixelCount = 32 * 32;
    const colorCounts: Record<string, number> = {};

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      rSum += r;
      gSum += g;
      bSum += b;

      // Classify pixel color
      let bin = "Black";
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;

      if (brightness < 40) bin = "Black";
      else if (brightness > 215 && delta < 25) bin = "White";
      else if (delta < 20) bin = "Silver / Grey";
      else if (r > g + 30 && r > b + 30) bin = r > 160 && g > 110 && b < 60 ? "Gold" : "Red";
      else if (b > r + 25 && b > g + 25) bin = "Blue";
      else if (g > r + 20 && g > b + 20) bin = "Green";
      else if (r > 160 && g > 140 && b < 80) bin = "Gold";
      else if (r > 160 && g > 60 && b < 50) bin = "Orange";
      else if (r > 150 && b > 120 && g < 100) bin = "Pink";
      else if (r > 80 && b > 90 && g < 70) bin = "Purple";
      else if (r > 80 && g > 50 && b < 40) bin = "Brown";

      colorCounts[bin] = (colorCounts[bin] || 0) + 1;
    }

    const sortedBins = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    const dominantColor = sortedBins[0]?.[0] || "Black";
    const secondaryColor = sortedBins[1]?.[0] || "White";

    return {
      aspectRatio: aspect >= 0.85 && aspect <= 1.15 ? "square" : aspect < 0.85 ? "portrait" : "landscape",
      dominantColor,
      secondaryColor,
      avgR: Math.round(rSum / pixelCount),
      avgG: Math.round(gSum / pixelCount),
      avgB: Math.round(bSum / pixelCount)
    };
  } catch (err) {
    return {
      aspectRatio: "square" as const,
      dominantColor: "Black",
      secondaryColor: "White",
      avgR: 128,
      avgG: 128,
      avgB: 128
    };
  }
}

// Fallback Heuristic Analysis when Gemini is unavailable
function generateFallbackVisualAnalysis(
  perceptual: { aspectRatio: string; dominantColor: string; secondaryColor: string },
  filename?: string,
  userQuery?: string
): GeminiVisualAnalysis {
  // Extract any useful hints from userQuery or clean filename
  const cleanFilename = (filename || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !CAMERA_STOP_WORDS.has(t));

  const textHints = normalizeText([userQuery || "", ...cleanFilename].join(" "));

  const isUnrelated = /(?:^|[^a-z0-9])(pet|cat|dog|sleeping|animal|kitten|puppy|bird|insect|flower|forest|nature|sky|rug)(?:$|[^a-z0-9])/i.test(filename || "") ||
    /(?:^|[^a-z0-9])(pet|cat|dog|sleeping|animal|kitten|puppy|bird|insect|flower|forest|nature|sky|rug)(?:$|[^a-z0-9])/i.test(userQuery || "");

  if (isUnrelated) {
    return {
      product_type: "unrelated",
      category: "general",
      subcategory: null,
      brand: null,
      model: null,
      primary_color: perceptual.dominantColor,
      secondary_colors: [perceptual.secondaryColor],
      material: null,
      shape: perceptual.aspectRatio,
      style: null,
      gender: null,
      use_case: null,
      visual_attributes: [],
      visible_text: [],
      keywords_en: [],
      keywords_bn: [],
      search_query: "",
      confidence: 10
    };
  }

  let productType = "product";
  let category = "general";
  let keywordsEn: string[] = [];
  let keywordsBn: string[] = [];

  // 1. Leverage local NLP Intent Parser for Bangla + English terms
  if (textHints) {
    try {
      const intent = parseIntentLocally(textHints);
      if (intent && intent.productType && intent.productType !== "product" && intent.productType !== textHints) {
        productType = intent.productType;
        category = intent.category || "general";
        if (intent.synonyms && intent.synonyms.length > 0) {
          intent.synonyms.forEach((syn) => {
            if (/[\u0980-\u09FF]/.test(syn)) keywordsBn.push(syn);
            else keywordsEn.push(syn);
          });
        }
      }
    } catch {}
  }

  // 2. Specific E-Commerce Canonical Mappings
  if (/watch|ঘড়ি|ঘড়ি|স্মার্ট\s*ওয়াচ|ওয়াচ|স্মার্টওয়াচ|smartwatch/i.test(textHints)) {
    productType = "smart watch";
    category = "smart-watches";
    keywordsEn.push("smart watch", "watch", "smartwatch");
    keywordsBn.push("ঘড়ি", "ঘড়ি", "স্মার্টওয়াচ", "ওয়াচ");
  } else if (/speaker|স্পিকার|sound.*box|সাউন্ড.*বক্স|bluetooth/i.test(textHints)) {
    productType = "bluetooth speaker";
    category = "audio";
    keywordsEn.push("bluetooth speaker", "speaker", "soundbox", "bluetooth");
    keywordsBn.push("স্পিকার", "সাউন্ড বক্স", "ব্লুটুথ");
  } else if (/charger|charging|চার্জার/i.test(textHints)) {
    productType = "charger";
    category = "gadgets";
    keywordsEn.push("charger", "fast charger", "adapter");
    keywordsBn.push("চার্জার");
  } else if (/projector|প্রজেক্টর|hy300/i.test(textHints)) {
    productType = "projector";
    category = "gadgets-electronics";
    keywordsEn.push("projector", "smart projector", "cinema");
    keywordsBn.push("প্রজেক্টর");
  } else if (/earbud|headphone|airpod|ইয়ারফোন|হেডফোন|tws/i.test(textHints)) {
    productType = "wireless earbuds";
    category = "audio";
    keywordsEn.push("wireless earbuds", "earphones", "headset");
    keywordsBn.push("ইয়ারফোন", "হেডফোন");
  } else if (/trimmer|shaver|ট্রিমার|শেভার/i.test(textHints)) {
    productType = "hair trimmer";
    category = "beauty";
    keywordsEn.push("hair trimmer", "shaver", "clipper");
    keywordsBn.push("ট্রিমার", "শেভার");
  } else if (/t-shirt|tshirt|shirt|শার্ট|গেঞ্জি|polo/i.test(textHints)) {
    productType = "t-shirt";
    category = "fashion";
    keywordsEn.push("t-shirt", "polo shirt");
    keywordsBn.push("টি-শার্ট", "শার্ট", "গেঞ্জি");
  } else if (/saree|শাড়ি|kurti|dress|থ্রি.*পিস/i.test(textHints)) {
    productType = "saree";
    category = "womens-fashion";
    keywordsEn.push("saree", "kurti", "dress");
    keywordsBn.push("শাড়ি", "কুর্তি");
  } else if (/shoe|sneaker|জুতা|স্নিকার্স/i.test(textHints)) {
    productType = "sneakers";
    category = "shoes-footwear";
    keywordsEn.push("sneakers", "shoes");
    keywordsBn.push("জুতা", "স্নিকার্স");
  } else if (/bag|backpack|ব্যাগ|ওয়ালেট/i.test(textHints)) {
    productType = "backpack";
    category = "bags-backpacks";
    keywordsEn.push("backpack", "bag", "wallet");
    keywordsBn.push("ব্যাগ", "ওয়ালেট");
  }

  // Clean fallback if no predefined canonical category matched
  if (productType === "product") {
    if (cleanFilename.length > 0) {
      productType = cleanFilename.join(" ");
      keywordsEn.push(...cleanFilename);
    } else if (userQuery && userQuery.trim()) {
      productType = userQuery.trim();
      keywordsEn.push(userQuery.trim());
    } else {
      productType = "product";
      category = "general";
    }
  }

  return {
    product_type: productType,
    category,
    subcategory: null,
    brand: null,
    model: null,
    primary_color: perceptual.dominantColor,
    secondary_colors: [perceptual.secondaryColor],
    material: null,
    shape: perceptual.aspectRatio,
    style: null,
    gender: null,
    use_case: null,
    visual_attributes: [perceptual.dominantColor, perceptual.aspectRatio],
    visible_text: [],
    keywords_en: Array.from(new Set(keywordsEn.length > 0 ? keywordsEn : (productType !== "product" ? [productType] : []))),
    keywords_bn: Array.from(new Set(keywordsBn)),
    search_query: productType !== "product" ? productType : "Visual Search",
    confidence: productType !== "product" ? 78 : 72
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
  // Accept any valid Google Gemini or Vertex API key (typically >= 15 chars)
  if (!key || key.length < 15) {
    return "";
  }
  return key;
}

// Canonical Category Mapper
export function mapToDurtupCategory(rawCat: string, productType = ""): string {
  const norm = normalizeText(`${rawCat} ${productType}`);
  if (norm.includes("watch") || norm.includes("ঘড়ি") || norm.includes("wearable")) return "smart-watches";
  if (norm.includes("audio") || norm.includes("speaker") || norm.includes("sound") || norm.includes("earphone") || norm.includes("headphone") || norm.includes("airpod") || norm.includes("earbud") || norm.includes("tws") || norm.includes("ইয়ারফোন") || norm.includes("স্পিকার")) return "audio";
  if (norm.includes("jewelry") || norm.includes("jewel") || norm.includes("ornament") || norm.includes("necklace") || norm.includes("nose pin") || norm.includes("earring") || norm.includes("ring") || norm.includes("গহনা")) return "jewelry";
  if (norm.includes("bag") || norm.includes("backpack") || norm.includes("wallet") || norm.includes("ব্যাগ") || norm.includes("ওয়ালেট")) return "bags-backpacks";
  if (norm.includes("shoe") || norm.includes("sneaker") || norm.includes("sandal") || norm.includes("জুতা") || norm.includes("স্নিকার্স")) return "shoes-footwear";
  if (norm.includes("women") || norm.includes("saree") || norm.includes("kurti") || norm.includes("dress") || norm.includes("শাড়ি") || norm.includes("মেয়ে")) return "womens-fashion";
  if (norm.includes("jersey") || norm.includes("sport") || norm.includes("football") || norm.includes("cricket") || norm.includes("tracksuit") || norm.includes("activewear") || norm.includes("shirt") || norm.includes("t-shirt") || norm.includes("tshirt") || norm.includes("polo") || norm.includes("pant") || norm.includes("men") || norm.includes("ছেলে") || norm.includes("গেঞ্জি") || norm.includes("hoodie") || norm.includes("panjabi")) return "fashion";
  if (norm.includes("beauty") || norm.includes("trimmer") || norm.includes("shaver") || norm.includes("cosmetic") || norm.includes("makeup") || norm.includes("skincare") || norm.includes("ট্রিমার") || norm.includes("clipper")) return "beauty";
  if (norm.includes("home") || norm.includes("kitchen") || norm.includes("blender") || norm.includes("kettle") || norm.includes("light") || norm.includes("lamp") || norm.includes("cooker") || norm.includes("pot")) return "home";
  if (norm.includes("toy") || norm.includes("kid") || norm.includes("drone") || norm.includes("খেলনা")) return "toys-kids";
  if (norm.includes("gadget") || norm.includes("charger") || norm.includes("cable") || norm.includes("power bank") || norm.includes("projector") || norm.includes("camera") || norm.includes("mouse") || norm.includes("keyboard") || norm.includes("electronics")) return "gadgets";
  return norm || "general";
}

// Compound Term Expansion
export function expandCompoundTerms(term: string): string[] {
  const t = normalizeText(term);
  if (!t) return [];
  const set = new Set<string>([t]);
  if (t === "smartwatch" || t === "smart watch") { set.add("smartwatch"); set.add("smart watch"); set.add("watch"); }
  if (t === "earbud" || t === "earbuds" || t === "ear bud" || t === "ear buds") { set.add("earbuds"); set.add("earbud"); set.add("ear buds"); set.add("ear bud"); set.add("airpod"); set.add("airpods"); set.add("tws"); }
  if (t === "airpod" || t === "airpods" || t === "air pod" || t === "air pods") { set.add("airpods"); set.add("airpod"); set.add("air pods"); set.add("air pod"); set.add("earbuds"); set.add("tws"); }
  if (t === "soundbox" || t === "sound box") { set.add("soundbox"); set.add("sound box"); set.add("speaker"); }
  if (t === "jersey" || t === "jerseys" || t.includes("jersey")) { set.add("jersey"); set.add("jerseys"); set.add("t-shirt"); set.add("tshirt"); set.add("shirt"); set.add("polo"); }
  if (t === "tshirt" || t === "t shirt" || t === "t-shirt") { set.add("tshirt"); set.add("t-shirt"); set.add("t shirt"); set.add("polo"); set.add("shirt"); set.add("jersey"); }
  if (t === "shirt" || t === "shirts") { set.add("shirt"); set.add("polo"); set.add("t-shirt"); set.add("tshirt"); set.add("jersey"); }
  if (t.includes("argentina")) { set.add("argentina"); set.add("jersey"); }
  if (t.includes("brazil")) { set.add("brazil"); set.add("jersey"); }
  if (t === "powerbank" || t === "power bank") { set.add("powerbank"); set.add("power bank"); set.add("charger"); }
  if (t === "ringlight" || t === "ring light") { set.add("ringlight"); set.add("ring light"); }
  if (t === "hairdryer" || t === "hair dryer") { set.add("hairdryer"); set.add("hair dryer"); }
  if (t === "nosepin" || t === "nose pin") { set.add("nosepin"); set.add("nose pin"); }
  if (t === "neckband" || t === "neck band") { set.add("neckband"); set.add("neck band"); }
  return Array.from(set);
}

// Call Google Gemini Multimodal Vision API
export async function analyzeImageWithGeminiVision(
  cleanBase64: string,
  mimeType = "image/jpeg",
  filename?: string,
  userQuery?: string
): Promise<GeminiVisualAnalysis | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  // Active production multimodal models (fastest & highest availability first)
  const modelChain = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash"
  ];

  const prompt = `You are the Expert Computer Vision Product Analyzer for Durtup.shop (an e-commerce marketplace in Bangladesh).
Examine this image thoroughly and return precise structured e-commerce attributes in JSON.
Never invent external stores or URLs. Analyze ONLY the physical product shown.

CRITICAL INSTRUCTIONS:
1. "product_type": Identify the exact physical product shown (e.g. 'jersey', 't-shirt', 'polo shirt', 'shirt', 'smart watch', 'wireless earbuds', 'bluetooth speaker', 'hair trimmer', 'saree', 'hoodie', 'formal shirt', 'sneakers', 'leather wallet', 'necklace', 'ring light', 'electric kettle', 'charger').
CRITICAL: If a person, player, athlete, or model is shown wearing clothing, jerseys, or fashion accessories, FOCUS on the primary visible wearable item or clothing (e.g., if wearing a sports jersey, output 'jersey' or 'sports t-shirt'; if wearing an Argentina or Brazil football jersey, specify 'argentina jersey' or 'jersey').
2. "category": Must be one of Durtup's catalog category slugs: 'fashion', 'gadgets', 'audio', 'smart-watches', 'womens-fashion', 'beauty', 'jewelry', 'bags-backpacks', 'shoes-footwear', 'home', 'toys-kids', 'general'. All jerseys, t-shirts, shirts, pants, hoodies, and clothing must ALWAYS be 'fashion'.
3. "brand": CRITICAL: ONLY output a brand if you can CLEARLY READ the brand name letters printed on the product. If not clearly legible, return null. NEVER guess.
4. "keywords_en": 5 to 8 high-precision English search keywords describing this exact item (e.g. for a jersey: ['jersey', 'argentina', 'football', 'sports', 't-shirt', 'apparel']).
5. "keywords_bn": 2 to 4 Bengali search keywords (e.g. 'জার্সি', 'টি-শার্ট', 'শার্ট', 'ঘড়ি', 'স্মার্টওয়াচ', 'ইয়ারফোন', 'স্পিকার').

JSON SCHEMA:
{
  "product_type": "string",
  "category": "string",
  "subcategory": "string or null",
  "brand": "string or null",
  "model": "string or null",
  "primary_color": "string",
  "secondary_colors": ["array of secondary colors"],
  "material": "string or null",
  "shape": "string or null",
  "style": "string or null",
  "gender": "string or null ('men' | 'women' | 'kids' | 'unisex' | null)",
  "use_case": "string or null",
  "visual_attributes": ["array of distinct visible visual features"],
  "visible_text": ["array of legible text printed on product"],
  "keywords_en": ["array of 5 to 8 English search keywords"],
  "keywords_bn": ["array of 2 to 4 Bengali search keywords"],
  "search_query": "string (the best 2-3 word search query to find this in an e-commerce catalog)",
  "confidence": number (integer between 60 and 99 reflecting recognition certainty)
}`;

  // Direct high-speed REST API calls with strict per-model timeout
  for (const model of modelChain) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${prompt}\nAdditional user text context: "${userQuery || ""}"` },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanedText = text.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
          const parsed: GeminiVisualAnalysis = JSON.parse(cleanedText);
          if (parsed && parsed.product_type) {
            if (typeof parsed.confidence === "number" && parsed.confidence <= 1) {
              parsed.confidence = Math.round(parsed.confidence * 100);
            }
            parsed.category = mapToDurtupCategory(parsed.category, parsed.product_type);
            return parsed;
          }
        }
      }
    } catch (restErr: any) {
      console.warn(`[Gemini REST] Model ${model} call failed:`, restErr?.message || restErr);
    }
  }

  return null;
}

// Master Visual Search Executor
export async function handleVisualSearchServerRequest(
  body: VisualSearchServerRequest
): Promise<VisualSearchServerResponse> {
  const startTime = Date.now();
  cleanExpiredCaches();

  const {
    imageBase64,
    imageHash: providedHash,
    sessionKey,
    filename,
    userQuery,
    categoryHint,
    minPrice,
    maxPrice,
    page = 1,
    pageSize = 24,
    maxResults
  } = body;

  const effectivePageSize = Math.max(1, Math.min(100, maxResults || pageSize || 24));
  const effectivePage = Math.max(1, page || 1);

  // 1. FAST-PATH: If sessionKey provided (pagination request page 2, 3...)
  if (sessionKey && SESSION_CACHE.has(sessionKey)) {
    const session = SESSION_CACHE.get(sessionKey)!;
    session.timestamp = Date.now(); // bump TTL

    // Apply any price or category filters if requested
    let filteredItems = session.rankedItems;
    if (minPrice !== undefined || maxPrice !== undefined || (categoryHint && categoryHint !== "all")) {
      filteredItems = filteredItems.filter((item) => {
        const p = item.product;
        if (minPrice !== undefined && p.price < minPrice) return false;
        if (maxPrice !== undefined && p.price > maxPrice) return false;
        if (categoryHint && categoryHint !== "all") {
          const cNorm = normalizeText(categoryHint);
          const pCatNorm = normalizeText(p.categorySlug || p.categoryName);
          if (!pCatNorm.includes(cNorm) && !cNorm.includes(pCatNorm)) return false;
        }
        return true;
      });
    }

    const startIndex = (effectivePage - 1) * effectivePageSize;
    const pageSlice = filteredItems.slice(startIndex, startIndex + effectivePageSize);
    const totalPages = Math.ceil(filteredItems.length / effectivePageSize) || 1;

    const mappedProducts: VisualProductItem[] = pageSlice.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      originalPrice: item.product.regular_price,
      regular_price: item.product.regular_price,
      image: item.product.image,
      images: item.product.images,
      rating: item.product.rating,
      reviews: item.product.reviews,
      sold: item.product.sold,
      category: item.product.categoryName,
      category_name: item.product.categoryName,
      category_slug: item.product.categorySlug,
      color: item.product.color,
      colorHex: item.product.colorHex,
      matchScore: Math.round(item.score),
      matchTier: item.tier,
      matchedReasons: item.reasons
    }));

    const bestMatches = mappedProducts.filter((p) => p.matchTier === "best");
    const similarProducts = mappedProducts.filter((p) => p.matchTier === "similar");

    return {
      success: true,
      sessionKey,
      primaryKeyword: session.analysis.search_query || session.analysis.product_type,
      confidence: session.analysis.confidence,
      detectedCategory: session.analysis.category,
      detectedColor: session.analysis.primary_color,
      keywords: session.analysis.keywords_en,
      matchedProductIds: mappedProducts.map((p) => p.id),
      bestMatches,
      similarProducts,
      products: mappedProducts,
      total: filteredItems.length,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages,
      hasMore: startIndex + effectivePageSize < filteredItems.length,
      aiPowered: true,
      aiAnalysis: session.analysis,
      latencyMs: {
        total: Date.now() - startTime
      }
    };
  }

  // 2. Process uploaded image
  if (!imageBase64 && !filename) {
    return {
      success: false,
      error: "No image data or file provided for visual search"
    };
  }

  const cleanBase64 = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, "") : "";
  const mimeMatch = imageBase64 ? imageBase64.match(/^data:(image\/\w+);base64,/) : null;
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  // Compute stable SHA-256 image hash & analysis cache key
  const rawHash = cleanBase64 ? crypto.createHash("sha256").update(cleanBase64).digest("hex") : "";
  const imageHash = providedHash || rawHash;
  const analysisCacheKey = rawHash ? `${rawHash}_${normalizeText(userQuery || "")}` : "";

  let geminiStartTime = Date.now();
  let aiAnalysis: GeminiVisualAnalysis | null = null;
  let aiPowered = false;

  // Check image analysis cache
  if (analysisCacheKey && IMAGE_HASH_CACHE.has(analysisCacheKey)) {
    const cachedEntry = IMAGE_HASH_CACHE.get(analysisCacheKey)!;
    aiAnalysis = cachedEntry.analysis;
    aiPowered = true;
  }

  // Extract perceptual color features with sharp
  let perceptualFeatures = {
    aspectRatio: "square" as const,
    dominantColor: "Black",
    secondaryColor: "White",
    avgR: 128,
    avgG: 128,
    avgB: 128
  };

  if (cleanBase64) {
    try {
      const buffer = Buffer.from(cleanBase64, "base64");
      perceptualFeatures = await extractPerceptualImageFeatures(buffer);
    } catch (e) {
      // ignore sharp error
    }
  }

  const catalog = getDurtupMasterCatalog();
  const cleanFileBasename = extractImageFileBasename(filename);
  const isGenericFile = CAMERA_STOP_WORDS.has(cleanFileBasename) || /^(image|photo|img|screenshot|unnamed|download)[\s\d_()-]*$/i.test(cleanFileBasename);

  // Fast path: If the image directly matches a catalog item basename or slug, resolve instantly (sub-5ms)
  const exactDirectItem = (!isGenericFile && cleanFileBasename.length >= 6)
    ? catalog.find(p => p.imageBasenames.has(cleanFileBasename) || p.slug === cleanFileBasename || p.slug.includes(cleanFileBasename))
    : null;

  if (exactDirectItem && (!userQuery || !userQuery.trim())) {
    aiAnalysis = {
      product_type: exactDirectItem.name,
      category: exactDirectItem.categorySlug,
      primary_color: exactDirectItem.color,
      secondary_colors: [],
      visual_attributes: [],
      visible_text: [],
      keywords_en: exactDirectItem.tokens.slice(0, 6),
      keywords_bn: exactDirectItem.categoryBangla ? [exactDirectItem.categoryBangla] : [],
      search_query: exactDirectItem.name,
      confidence: 99
    };
    aiPowered = true;
  }

  // Call Gemini Vision if not cached and not direct match
  if (!aiAnalysis && cleanBase64) {
    let optimizedB64 = cleanBase64;
    let optMime = mimeType;
    try {
      const sharp = (await import("sharp")).default;
      const buf = await sharp(Buffer.from(cleanBase64, "base64"))
        .resize(512, 512, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      optimizedB64 = buf.toString("base64");
      optMime = "image/jpeg";
    } catch {}

    aiAnalysis = await analyzeImageWithGeminiVision(optimizedB64, optMime, filename, userQuery);
    if (aiAnalysis) {
      aiPowered = true;
      if (analysisCacheKey) {
        IMAGE_HASH_CACHE.set(analysisCacheKey, { analysis: aiAnalysis, timestamp: Date.now() });
      }
    }
  }

  const geminiDuration = Date.now() - geminiStartTime;

  // Fallback to local perceptual analysis if Gemini is unavailable
  if (!aiAnalysis) {
    aiAnalysis = generateFallbackVisualAnalysis(perceptualFeatures, filename, userQuery);
    aiPowered = false;
  }

  // 3. Retrieval & Ranking against Complete Durtup Catalog
  const retrievalStartTime = Date.now();

  // Normalize search terms and tokens from AI analysis
  const queryProductType = normalizeText(aiAnalysis.product_type);
  const queryModel = normalizeText(aiAnalysis.model || "");
  const queryBrand = normalizeText(aiAnalysis.brand || "");
  const queryPrimaryColor = normalizeText(aiAnalysis.primary_color);
  const querySecondaryColors = (aiAnalysis.secondary_colors || []).map((c) => normalizeText(c));
  const queryCategory = normalizeText(aiAnalysis.category);
  const querySubcategory = normalizeText(aiAnalysis.subcategory || "");
  const queryVisibleText = (aiAnalysis.visible_text || []).map((t) => normalizeText(t)).filter((t) => t.length >= 2);
  const queryEnKeywords = (aiAnalysis.keywords_en || []).map((k) => normalizeText(k)).filter(Boolean);
  const queryBnKeywords = (aiAnalysis.keywords_bn || []).map((k) => normalizeText(k)).filter(Boolean);
  const queryVisualAttrs = (aiAnalysis.visual_attributes || []).map((a) => normalizeText(a)).filter(Boolean);
  const queryMaterial = normalizeText(aiAnalysis.material || "");
  const queryGender = normalizeText(aiAnalysis.gender || "");

  // Expand compound product types and normalize target category
  const expandedProductTypes = expandCompoundTerms(queryProductType);
  const targetCategorySlug = mapToDurtupCategory(queryCategory, queryProductType);

  // Optional filename match (supplementary only, never a gate)
  const cleanFilenameTokens = (filename || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !CAMERA_STOP_WORDS.has(t));

  const isExplicitlyUnrelated = /(?:^|[^a-z0-9])(pet|cat|dog|sleeping|animal|kitten|puppy|bird|insect|flower|forest|nature|sky|rug)(?:$|[^a-z0-9])/i.test(filename || "") ||
    /(?:^|[^a-z0-9])(pet|cat|dog|sleeping|animal|kitten|puppy|bird|insect|flower|forest|nature|sky|rug)(?:$|[^a-z0-9])/i.test(userQuery || "");

  if (isExplicitlyUnrelated || aiAnalysis.product_type === "unrelated") {
    return {
      success: true,
      sessionKey: sessionKey || `vs_${Date.now()}_unrelated`,
      primaryKeyword: userQuery || aiAnalysis.search_query || "No catalog match",
      confidence: 15,
      detectedCategory: "none",
      detectedColor: aiAnalysis.primary_color,
      keywords: [],
      matchedProductIds: [],
      bestMatches: [],
      similarProducts: [],
      products: [],
      total: 0,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages: 0,
      hasMore: false,
      aiPowered,
      aiAnalysis,
      latencyMs: {
        total: Date.now() - startTime,
        gemini: geminiDuration,
        retrieval: 0
      }
    };
  }

  // Optional user search query tokens
  const userTextNorm = normalizeText(userQuery || "");
  const userTextTokens = userTextNorm.split(/\s+/).filter(Boolean);

  const scoredCandidates: ScoredItemInternal[] = [];

  for (const p of catalog) {
    let score = 0;
    const reasons: string[] = [];

    // Filter price range if applied
    if (minPrice !== undefined && p.price < minPrice) continue;
    if (maxPrice !== undefined && p.price > maxPrice) continue;

    // Filter category if user explicitly selected category filter
    if (categoryHint && categoryHint !== "all") {
      const hintNorm = normalizeText(categoryHint);
      const pCatNorm = normalizeText(p.categorySlug || p.categoryName);
      const isHintMatch = pCatNorm.includes(hintNorm) || hintNorm.includes(pCatNorm) ||
        (hintNorm.includes("watch") && pCatNorm.includes("watch")) ||
        (hintNorm.includes("gadget") && pCatNorm.includes("gadget")) ||
        (hintNorm.includes("audio") && pCatNorm.includes("audio")) ||
        (hintNorm.includes("fashion") && pCatNorm.includes("fashion"));
      if (!isHintMatch) continue;
    }

    const pNameNorm = p.nameNorm;
    const pCatNorm = normalizeText(p.categorySlug || p.categoryName);
    const pColorNorm = normalizeText(p.color || "");

    // Core product name without parenthetical accessories, packages, or free gift perks
    const pCoreNameRaw = p.name
      .replace(/\([^)]*\)/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\bwith\s+(?:gift\s*box|box|pouch|bag|case|cover|charger|cable|strap|battery)\b.*$/i, " ")
      .replace(/\b(?:free\s+gift|free\s+delivery)\b.*$/i, " ");
    const pCoreNameNorm = normalizeText(pCoreNameRaw) || pNameNorm;
    const pCoreWords = pCoreNameNorm.split(/\s+/).filter(Boolean);

    // Hard category barrier for Jewelry & Ornaments:
    // If the image/query is NOT jewelry, NEVER allow a nose pin or jewelry item to match!
    const isJewelryProduct = pCatNorm.includes("jewel") || pCatNorm.includes("ornament") || /\b(nose\s*pin|necklace|earring|bangle|pendant|ring|chain)\b/i.test(pCoreNameNorm);
    const isQueryJewelry = targetCategorySlug.includes("jewel") || /\b(jewel|ornament|nose\s*pin|necklace|earring|bangle|pendant|ring|gold\s*pin)\b/i.test(queryProductType);

    if (isJewelryProduct && !isQueryJewelry) {
      continue;
    }

    // Strict Cross-Category barrier:
    // If target category is Fashion/Apparel, NEVER allow Gadgets/Chargers/Watches/Jewelry to match!
    const isFashionQuery = targetCategorySlug === "fashion" || targetCategorySlug === "womens-fashion";
    const isFashionProduct = pCatNorm.includes("fashion") || pCatNorm.includes("clothing");
    if (isFashionQuery && !isFashionProduct && !pCatNorm.includes("general")) {
      continue;
    }

    // If target category is Electronics/Gadgets/Audio/Watches, NEVER allow Fashion/Clothing to match!
    const isElectronicsQuery = targetCategorySlug === "gadgets" || targetCategorySlug === "audio" || targetCategorySlug === "smart-watches";
    if (isElectronicsQuery && isFashionProduct) {
      continue;
    }

    // 1. Direct Image Match (+5500)
    // If user uploaded an image that originates from Durtup's catalog or matches image basename
    if (!isGenericFile && cleanFileBasename.length >= 6) {
      const isBaseMatch = p.imageBasenames.has(cleanFileBasename) ||
        p.slug === cleanFileBasename ||
        p.slug.includes(cleanFileBasename) ||
        cleanFileBasename.includes(p.slug) ||
        Array.from(p.imageBasenames).some(ib => cleanFileBasename.includes(ib) || ib.includes(cleanFileBasename));
      if (isBaseMatch) {
        score += 5500;
        reasons.push("Exact Image Match");
      }
    }

    // 2. Exact Brand & Model Match (+2200)
    if (queryModel && queryModel.length >= 2) {
      if (wordBoundaryMatch(pCoreNameNorm, queryModel) || pCoreNameNorm.includes(queryModel)) {
        score += 2200;
        reasons.push(`Model: ${aiAnalysis.model}`);
      }
    }
    if (queryBrand && queryBrand.length >= 2) {
      if (wordBoundaryMatch(pCoreNameNorm, queryBrand)) {
        score += 800;
        reasons.push(`Brand: ${aiAnalysis.brand}`);
      }
    }

    // 3. Product Type Match (+1800) with Compound Term Support
    const isGenericType = !queryProductType || queryProductType === "product" || queryProductType === "item" || queryProductType.length < 3;
    let matchedTypeWords = 0;
    let typeMatched = false;
    if (!isGenericType) {
      for (const et of expandedProductTypes) {
        if (wordBoundaryMatch(pCoreNameNorm, et)) {
          score += 1800;
          reasons.push(`Product Type: ${et}`);
          typeMatched = true;
          break;
        } else if (pCoreWords.some((w) => w.startsWith(et))) {
          score += 1500;
          reasons.push(`Type: ${et}`);
          typeMatched = true;
          break;
        } else if (pCoreNameNorm.includes(et)) {
          score += 1200;
          reasons.push(`Type: ${et}`);
          typeMatched = true;
          break;
        }
      }

      if (!typeMatched) {
        const tWords = queryProductType.split(/\s+/).filter((w) => w.length >= 3 && !["the", "and", "for", "with", "item", "product"].includes(w));
        for (const tw of tWords) {
          if (wordBoundaryMatch(pCoreNameNorm, tw) || pCoreNameNorm.includes(tw)) {
            matchedTypeWords++;
          }
        }
        if (matchedTypeWords > 0) {
          score += Math.min(1200, matchedTypeWords * 450);
          reasons.push(`Type: ${tWords.filter((tw) => pCoreNameNorm.includes(tw)).join(" ")}`);
        }
      }
    }

    // 4. Visible Text Match (+1200)
    for (const vText of queryVisibleText) {
      if (vText.length >= 3 && (wordBoundaryMatch(pNameNorm, vText) || pNameNorm.includes(vText))) {
        score += 1200;
        reasons.push(`Text: ${vText}`);
        break;
      }
    }

    // 5. Category & Subcategory Match (+900)
    if (targetCategorySlug && targetCategorySlug !== "general") {
      const isCatMatched = pCatNorm.includes(targetCategorySlug) || targetCategorySlug.includes(pCatNorm) ||
        (targetCategorySlug.includes("watch") && pCatNorm.includes("watch")) ||
        (targetCategorySlug.includes("audio") && pCatNorm.includes("audio")) ||
        (targetCategorySlug.includes("gadget") && pCatNorm.includes("gadget")) ||
        (targetCategorySlug.includes("fashion") && pCatNorm.includes("fashion"));
      if (isCatMatched) {
        score += 900;
        reasons.push("Category Match");
      }
    }
    if (querySubcategory && (pCatNorm.includes(querySubcategory) || wordBoundaryMatch(pNameNorm, querySubcategory))) {
      score += 400;
    }

    // 6. Color Similarity Match (+400 for primary, +200 for secondary)
    if (queryPrimaryColor && queryPrimaryColor !== "multi-color") {
      if (pColorNorm.includes(queryPrimaryColor) || wordBoundaryMatch(pNameNorm, queryPrimaryColor)) {
        score += 400;
        reasons.push(`Color: ${aiAnalysis.primary_color}`);
      }
    }
    for (const sColor of querySecondaryColors) {
      if (sColor && sColor !== "multi-color" && (pColorNorm.includes(sColor) || wordBoundaryMatch(pNameNorm, sColor))) {
        score += 200;
        break;
      }
    }

    // 7. Keywords (English + Bengali) Match
    let matchedKeywords = 0;
    for (const kw of queryEnKeywords) {
      if (kw.length >= 3 && (wordBoundaryMatch(pCoreNameNorm, kw) || pCoreWords.includes(kw) || pCoreNameNorm.includes(kw))) {
        matchedKeywords++;
      }
    }
    for (const bkw of queryBnKeywords) {
      if (bkw && (wordBoundaryMatch(pCoreNameNorm, bkw) || pCoreNameNorm.includes(bkw) || (p.categoryBangla && p.categoryBangla.includes(bkw)))) {
        matchedKeywords++;
      }
    }
    if (matchedKeywords > 0) {
      score += Math.min(1000, matchedKeywords * 400);
    }

    // 8. Visual Attributes (e.g. 'square', 'silicone', 'cotton', 'leather')
    for (const attr of queryVisualAttrs) {
      if (attr.length >= 3 && wordBoundaryMatch(pCoreNameNorm, attr)) {
        score += 250;
        reasons.push(attr);
        break;
      }
    }
    if (queryMaterial && wordBoundaryMatch(pCoreNameNorm, queryMaterial)) {
      score += 250;
      reasons.push(`Material: ${aiAnalysis.material}`);
    }

    // 9. Gender Alignment & Conflict Check
    if (queryGender) {
      const isMenItem = wordBoundaryMatch(pCoreNameNorm, "men") || wordBoundaryMatch(pCoreNameNorm, "mens") || wordBoundaryMatch(pCoreNameNorm, "ছেলে");
      const isWomenItem = wordBoundaryMatch(pCoreNameNorm, "women") || wordBoundaryMatch(pCoreNameNorm, "womens") || wordBoundaryMatch(pCoreNameNorm, "মেয়ে") || wordBoundaryMatch(pCoreNameNorm, "ladies");
      if (queryGender === "men") {
        if (isMenItem) score += 300;
        else if (isWomenItem) score -= 600;
      } else if (queryGender === "women") {
        if (isWomenItem) score += 300;
        else if (isMenItem) score -= 600;
      }
    }

    // 10. Optional Supplementary Signals
    // User text query boost (Combined text + image search)
    let matchedUser = 0;
    if (userTextTokens.length > 0) {
      for (const ut of userTextTokens) {
        if (ut.length >= 2 && (wordBoundaryMatch(pCoreNameNorm, ut) || pCoreNameNorm.includes(ut) || (p.categoryBangla && p.categoryBangla.includes(ut)))) {
          matchedUser++;
        }
      }
      if (matchedUser > 0) {
        score += Math.min(2500, matchedUser * 1200);
        reasons.push(`Text: ${userQuery}`);
      }
    }

    // Supplementary non-generic filename tokens
    for (const ft of cleanFilenameTokens) {
      if (ft.length >= 3 && (wordBoundaryMatch(pCoreNameNorm, ft) || pCoreWords.includes(ft))) {
        score += 200;
        break;
      }
    }

    // Quality tie-breakers
    if (p.rating) score += Number(p.rating);
    if (p.sold) score += Math.min(10, Number(p.sold) * 0.05);

    // Require at least one concrete semantic, model, product type, category, or direct image match
    const isDirectImage = score >= 3000;
    const isModelMatch = Boolean(queryModel && (wordBoundaryMatch(pCoreNameNorm, queryModel) || pCoreNameNorm.includes(queryModel)));
    const isBrandMatch = Boolean(queryBrand && (wordBoundaryMatch(pCoreNameNorm, queryBrand) || pCoreNameNorm.includes(queryBrand)));
    const isTypeMatch = Boolean(!isGenericType && (typeMatched || wordBoundaryMatch(pCoreNameNorm, queryProductType) || pCoreWords.some((w) => w.startsWith(queryProductType)) || pCoreNameNorm.includes(queryProductType) || matchedTypeWords > 0));
    const isTextMatch = queryVisibleText.some((vt) => wordBoundaryMatch(pCoreNameNorm, vt) || pCoreNameNorm.includes(vt));
    const isKeywordMatch = matchedKeywords > 0;
    const isUserMatch = matchedUser > 0;
    const isCategoryCoreMatch = Boolean(targetCategorySlug && targetCategorySlug !== "general" && (pCatNorm.includes(targetCategorySlug) || targetCategorySlug.includes(pCatNorm)) && (score >= 1200));

    const hasCoreMatch = isDirectImage || isModelMatch || isBrandMatch || isTypeMatch || isKeywordMatch || isUserMatch || isTextMatch || isCategoryCoreMatch;
    if (!hasCoreMatch) {
      continue;
    }

    // Minimum Relevance Threshold
    const minThreshold = 350;
    if (score >= minThreshold) {
      scoredCandidates.push({
        product: p,
        score,
        tier: score >= 2200 ? "best" : "similar",
        reasons: Array.from(new Set(reasons))
      });
    }
  }

  // Category-Safe Fallback:
  // If strict semantic scoring yielded 0 candidates, attempt matching ONLY within the detected category.
  // CRITICAL: NEVER match products from unrelated categories based on color alone!
  if (scoredCandidates.length === 0 && !isExplicitlyUnrelated) {
    const safeCat = (queryCategory && queryCategory !== "general" && queryCategory !== "all")
      ? queryCategory
      : null;

    if (safeCat) {
      for (const p of catalog) {
        if (minPrice !== undefined && p.price < minPrice) continue;
        if (maxPrice !== undefined && p.price > maxPrice) continue;
        if (categoryHint && categoryHint !== "all") {
          const hintNorm = normalizeText(categoryHint);
          const pCatNorm = normalizeText(p.categorySlug || p.categoryName);
          if (!pCatNorm.includes(hintNorm) && !hintNorm.includes(pCatNorm)) continue;
        }

        const pCatNorm = normalizeText(p.categorySlug || p.categoryName);
        const isCatMatched = pCatNorm.includes(safeCat) || safeCat.includes(pCatNorm);

        if (isCatMatched) {
          let catScore = 1000;
          const pReasons: string[] = [`Category: ${p.categoryName || safeCat}`];

          // Check if color matches within the same category
          const pColorNorm = normalizeText(p.color || "");
          if (queryPrimaryColor && queryPrimaryColor !== "multi-color" && (pColorNorm.includes(queryPrimaryColor) || wordBoundaryMatch(p.nameNorm, queryPrimaryColor))) {
            catScore += 300;
            pReasons.push(`Color: ${aiAnalysis.primary_color}`);
          }

          catScore += Math.min(200, Number(p.sold || 0));
          if (p.rating) catScore += Number(p.rating) * 10;

          scoredCandidates.push({
            product: p,
            score: catScore,
            tier: "similar",
            reasons: pReasons
          });
        }
      }
    }
  }

  // If zero items matched specific query/category:
  // ONLY provide items if a valid category was identified, and ONLY from THAT category!
  // NEVER inject arbitrary electronic chargers or water pumps into fashion/clothing search!
  if (scoredCandidates.length === 0 && targetCategorySlug && targetCategorySlug !== "general") {
    const catItems = catalog.filter((p) => {
      const pCatNorm = normalizeText(p.categorySlug || p.categoryName);
      return pCatNorm.includes(targetCategorySlug) || targetCategorySlug.includes(pCatNorm);
    });
    catItems.slice(0, 24).forEach((item) => {
      scoredCandidates.push({
        product: item,
        score: 150,
        tier: "similar",
        reasons: [`ক্যাটাগরি বিকল্প: ${item.categoryName || targetCategorySlug}`]
      });
    });
  }

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Classify Best Match vs Similar Products dynamically:
  // Best Match (Tier 1) is reserved for top 1 to 2 highest scoring items (score >= 2500)
  // All other matching candidates are categorized as Similar Products (Tier 2/3)
  const maxScore = scoredCandidates[0]?.score || 0;
  const isStrongBestMatch = maxScore >= 2500;
  const bestMatchLimit = isStrongBestMatch
    ? Math.min(2, Math.max(1, scoredCandidates.filter((s, idx) => idx < 2 && (s.score >= 3000 || s.score >= maxScore * 0.95)).length))
    : 0;

  scoredCandidates.forEach((item, index) => {
    if (isStrongBestMatch && index < bestMatchLimit && item.score >= maxScore * 0.90) {
      item.tier = "best";
    } else {
      item.tier = "similar";
    }
  });

  const retrievalDuration = Date.now() - retrievalStartTime;

  // Create or update session for pagination
  const newSessionKey = sessionKey || `vs_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  SESSION_CACHE.set(newSessionKey, {
    rankedItems: scoredCandidates,
    analysis: aiAnalysis,
    timestamp: Date.now()
  });

  // Slice requested page
  const startIndex = (effectivePage - 1) * effectivePageSize;
  const pageSlice = scoredCandidates.slice(startIndex, startIndex + effectivePageSize);
  const totalPages = Math.ceil(scoredCandidates.length / effectivePageSize) || 1;

  const mappedProducts: VisualProductItem[] = pageSlice.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: item.product.price,
    originalPrice: item.product.regular_price,
    regular_price: item.product.regular_price,
    image: item.product.image,
    images: item.product.images,
    rating: item.product.rating,
    reviews: item.product.reviews,
    sold: item.product.sold,
    category: item.product.categoryName,
    category_name: item.product.categoryName,
    category_slug: item.product.categorySlug,
    color: item.product.color,
    colorHex: item.product.colorHex,
    matchScore: Math.round(item.score),
    matchTier: item.tier,
    matchedReasons: item.reasons
  }));

  const bestMatches = mappedProducts.filter((p) => p.matchTier === "best");
  const similarProducts = mappedProducts.filter((p) => p.matchTier === "similar");

  const totalDuration = Date.now() - startTime;

  return {
    success: true,
    sessionKey: newSessionKey,
    primaryKeyword: aiAnalysis.search_query || aiAnalysis.product_type,
    confidence: aiAnalysis.confidence,
    detectedCategory: aiAnalysis.category,
    detectedColor: aiAnalysis.primary_color,
    keywords: aiAnalysis.keywords_en,
    matchedProductIds: mappedProducts.map((p) => p.id),
    bestMatches,
    similarProducts,
    products: mappedProducts,
    total: scoredCandidates.length,
    page: effectivePage,
    pageSize: effectivePageSize,
    totalPages,
    hasMore: startIndex + effectivePageSize < scoredCandidates.length,
    aiPowered,
    aiAnalysis,
    latencyMs: {
      gemini: geminiDuration,
      retrieval: retrievalDuration,
      ranking: totalDuration - geminiDuration - retrievalDuration,
      total: totalDuration
    }
  };
}
