import type { Product } from "@/components/products/ProductCard";
import { getCachedMohasagorProducts, getInMemoryProducts } from "./mohasagorCache";

export interface MatchedProductItem {
  product: Product;
  matchScore: number;
  matchedReasons: string[];
  categorySlug?: string;
  matchTier?: "best" | "similar";
}

export interface DetectedCategoryTab {
  id: string;
  name: string;
  count: number;
}

export interface VisualColorProfile {
  name: string;
  hex: string;
  secondaryName?: string;
  secondaryHex?: string;
  hsv: [number, number, number];
  brightness: number;
  isWarm: boolean;
  isMonochrome: boolean;
  colorVariance: number;
}

export interface ImageAnalysisResult {
  previewUrl: string;
  sessionKey?: string;
  detectedKeywords: string[];
  primaryKeyword: string;
  categorySlug: string;
  categoryHint: string;
  colorName?: string;
  colorHex?: string;
  confidence: number;
  isLowConfidence?: boolean;
  exactMatchProduct?: Product;
  bestMatchProduct?: Product;
  bestMatches?: MatchedProductItem[];
  similarProducts?: MatchedProductItem[];
  matchedProducts: MatchedProductItem[];
  availableCategories: DetectedCategoryTab[];
  relatedProducts: Product[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore?: boolean;
  aiPowered?: boolean;
  aiAnalysis?: any;
}

export interface VisualSearchSessionData {
  previewUrl: string;
  sessionKey?: string;
  matchedProducts: MatchedProductItem[];
  bestMatches?: MatchedProductItem[];
  similarProducts?: MatchedProductItem[];
  products?: Product[];
  confidence: number;
  keyword: string;
  total?: number;
  page?: number;
  hasMore?: boolean;
  aiAnalysis?: any;
}

// In-Memory Visual Search Store
let currentVisualSearchResults: VisualSearchSessionData | null = null;

export const GENERIC_FILE_STOP_WORDS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "ico",
  "img", "image", "images", "photo", "photos", "picture", "pictures", "pic", "pics",
  "product", "products", "item", "items", "file", "files",
  "download", "downloads", "upload", "uploads", "capture", "screenshot", "screenshots", "screen",
  "camera", "unnamed", "asset", "assets", "media",
  "storage", "public", "mohasagor", "ecomseller", "durtup",
  "http", "https", "www", "com", "net", "org", "bd",
  "whatsapp", "telegram", "facebook", "messenger", "temp", "copy"
]);

export function extractImageFileName(url?: string): string {
  if (!url) return "";
  try {
    const clean = url.split("?")[0].split("#")[0];
    return (clean.split("/").pop() || "").toLowerCase().replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return "";
  }
}

export function wordMatches(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const kw = keyword.trim().toLowerCase();
  const tx = text.toLowerCase();
  if (kw.length <= 6) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    return regex.test(tx);
  }
  return tx.includes(kw);
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    if (max === r) h = (60 * ((g - b) / diff) + 360) % 360;
    else if (max === g) h = (60 * ((b - r) / diff) + 120) % 360;
    else h = (60 * ((r - g) / diff) + 240) % 360;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(v * 100)];
}

// Client-side image preprocessor & canvas compressor
export async function compressImageForUpload(
  file: File,
  maxDimension = 1024,
  quality = 0.85
): Promise<{
  base64: string;
  mimeType: string;
  previewUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please select a valid image file (JPG, PNG, WEBP)."));
    }
    if (file.size > 20 * 1024 * 1024) {
      return reject(new Error("Image file size cannot exceed 20MB."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image data."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Failed to initialize canvas context."));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG for high visual fidelity and lightweight payload
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = compressedDataUrl.replace(/^data:image\/[a-z]+;base64,/, "");

        resolve({
          base64,
          mimeType: "image/jpeg",
          previewUrl: compressedDataUrl,
          width,
          height
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// Simple color extractor for preview / fallback
export function extractVisualColorProfile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): VisualColorProfile {
  try {
    const data = ctx.getImageData(0, 0, width, height).data;
    const colorBins: Record<string, number> = {};
    let fgR = 0, fgG = 0, fgB = 0, fgCount = 0;

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 128) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          fgR += r; fgG += g; fgB += b; fgCount++;

          const [h, s, v] = rgbToHsv(r, g, b);
          let bin = "Black";
          if (v < 20) bin = "Black";
          else if (v > 85 && s < 15) bin = "White";
          else if (s < 15) bin = "Silver / Grey";
          else if (h >= 15 && h < 40 && s > 25 && v < 55) bin = "Brown";
          else if (h >= 15 && h < 42 && s > 25) bin = "Orange";
          else if (h >= 42 && h < 68 && s > 25) bin = "Gold";
          else if (h >= 68 && h < 165 && s > 20) bin = "Green";
          else if (h >= 165 && h < 255 && s > 20) bin = "Blue";
          else if (h >= 255 && h < 290 && s > 20) bin = "Purple";
          else if (h >= 290 && h < 345 && s > 20) bin = "Pink";
          else if ((h >= 345 || h < 15) && s > 25) bin = "Red";

          colorBins[bin] = (colorBins[bin] || 0) + 1;
        }
      }
    }

    if (fgCount === 0) {
      return {
        name: "Black",
        hex: "#18181b",
        hsv: [0, 0, 10],
        brightness: 20,
        isWarm: false,
        isMonochrome: true,
        colorVariance: 1
      };
    }

    const avgR = Math.round(fgR / fgCount);
    const avgG = Math.round(fgG / fgCount);
    const avgB = Math.round(fgB / fgCount);
    const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;
    const [h, s, v] = rgbToHsv(avgR, avgG, avgB);

    const sortedBins = Object.entries(colorBins).sort((a, b) => b[1] - a[1]);
    const dominant = sortedBins[0]?.[0] || "Black";

    return {
      name: dominant,
      hex,
      hsv: [h, s, v],
      brightness: Math.round((avgR * 299 + avgG * 587 + avgB * 114) / 1000),
      isWarm: avgR > avgB + 20,
      isMonochrome: Object.keys(colorBins).length <= 2,
      colorVariance: Object.keys(colorBins).length
    };
  } catch {
    return {
      name: "Black",
      hex: "#18181b",
      hsv: [0, 0, 10],
      brightness: 20,
      isWarm: false,
      isMonochrome: true,
      colorVariance: 1
    };
  }
}

// Preprocess and normalize image (for local thumbnail/preview)
export async function preprocessImage(
  file: File,
  maxDimension = 480
): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  previewUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Please upload a valid image file."));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into canvas."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          canvas,
          ctx,
          previewUrl: e.target?.result as string,
          width,
          height
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Local Cached Visual Index for offline/fallback mode
let visualIndexCache: any[] | null = null;
async function getVisualCatalog(): Promise<any[]> {
  if (visualIndexCache && visualIndexCache.length > 0) {
    return visualIndexCache;
  }
  try {
    const res = await fetch("/visual_index.json?v=20261013_cat_v2");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        visualIndexCache = data;
        return data;
      }
    }
  } catch (e) {
    console.warn("Could not load /visual_index.json for fallback:", e);
  }
  return (await getCachedMohasagorProducts()) || [];
}

// Client Fallback Visual Search (Active only when network/backend endpoint is unavailable)
// CRITICAL: NEVER gates on filename or MobileNet failure!
async function localFallbackVisualSearch(
  file: File,
  previewUrl: string,
  userQuery?: string
): Promise<ImageAnalysisResult> {
  const catalog = await getVisualCatalog();
  const rawFileName = (file.name || "").toLowerCase().trim();
  const fileBaseName = rawFileName.replace(/\.[a-z0-9]+$/i, "");
  const isGenericName = GENERIC_FILE_STOP_WORDS.has(fileBaseName) || /^(image|photo|img|screenshot|capture|durtup)[\s\d_()-]*$/i.test(fileBaseName);

  const queryTokens = (userQuery || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const nameTokens = !isGenericName
    ? fileBaseName.replace(/[^a-z0-9]/g, " ").split(/\s+/).filter((t) => t.length >= 2 && !GENERIC_FILE_STOP_WORDS.has(t))
    : [];

  const scored: MatchedProductItem[] = [];

  for (const item of catalog) {
    let score = 0;
    const reasons: string[] = [];
    const rawName = item.name || "";
    const pName = rawName
      .replace(/\([^)]*\)/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\bwith\s+(?:gift\s*box|box|pouch|bag|case|cover|charger|cable|strap|battery)\b.*$/i, " ")
      .toLowerCase();
    const pCat = (item.category || item.category_name || item.categorySlug || "").toLowerCase();

    // Isolate jewelry so it never leaks into generic searches
    const isJewelryProduct = pCat.includes("jewel") || pCat.includes("ornament") || /\b(nose\s*pin|necklace|earring|bangle|pendant|ring)\b/i.test(pName);
    const isQueryJewelry = queryTokens.some(t => /\b(jewel|ornament|nose|pin|ring|necklace|earring|gold)\b/i.test(t)) || nameTokens.some(t => /\b(jewel|ornament|nose|pin|ring|necklace|earring|gold)\b/i.test(t));
    if (isJewelryProduct && !isQueryJewelry) {
      continue;
    }

    // Check direct image slug match
    const pImageBase = extractImageFileName(item.image);
    if (!isGenericName && fileBaseName.length >= 4 && (pImageBase.includes(fileBaseName) || (item.slug && item.slug.includes(fileBaseName)))) {
      score += 2500;
      reasons.push("Exact Image Match");
    }

    // Check user query tokens
    for (const qt of queryTokens) {
      if (pName.includes(qt) || pCat.includes(qt)) {
        score += 800;
        reasons.push(`Matched "${qt}"`);
      }
    }

    // Check optional filename tokens (only if present and non-generic)
    for (const nt of nameTokens) {
      if (pName.includes(nt) || pCat.includes(nt)) {
        score += 400;
        reasons.push(`Keyword: ${nt}`);
      }
    }

    if (score > 0) {
      scored.push({
        product: {
          id: String(item.id),
          name: item.name,
          slug: item.slug || `product-${item.id}`,
          price: Number(item.price) || 0,
          originalPrice: item.regular_price || item.originalPrice,
          image: item.image,
          category: item.category || item.category_name || "General",
          category_name: item.category_name || item.category,
          category_slug: item.category_slug || item.categorySlug,
          rating: Number(item.rating) || 4.8,
          reviews: Number(item.reviews) || 12,
          sold: Number(item.sold) || 30
        },
        matchScore: Math.min(99, Math.round(score / 30)),
        matchedReasons: reasons.length > 0 ? reasons : ["Visual Match"],
        categorySlug: item.category_slug || item.categorySlug,
        matchTier: score >= 2000 ? "best" : "similar"
      });
    }
  }

  const hadDirectMatches = scored.length > 0;

  // Guarantee products are always returned so visual search never presents a dead-end
  if (!hadDirectMatches && catalog && catalog.length > 0) {
    catalog.slice(0, 24).forEach((item) => {
      scored.push({
        product: {
          id: String(item.id),
          name: item.name,
          slug: item.slug || `product-${item.id}`,
          price: Number(item.price) || 0,
          originalPrice: item.regular_price || item.originalPrice,
          image: item.image,
          category: item.category || item.category_name || "General",
          category_name: item.category_name || item.category,
          category_slug: item.category_slug || item.categorySlug,
          rating: Number(item.rating) || 4.8,
          reviews: Number(item.reviews) || 12,
          sold: Number(item.sold) || 30
        },
        matchScore: 0,
        matchedReasons: ["জনপ্রিয় ট্রেন্ডিং পণ্য"],
        categorySlug: item.category_slug || item.categorySlug,
        matchTier: "similar"
      });
    });
  }

  scored.sort((a, b) => b.matchScore - a.matchScore);
  const bestMatches = scored.filter((s) => s.matchTier === "best");
  const similarProducts = scored.filter((s) => s.matchTier === "similar");

  const result: ImageAnalysisResult = {
    previewUrl,
    detectedKeywords: userQuery ? [userQuery] : ["Catalog Match"],
    primaryKeyword: userQuery || (hadDirectMatches ? scored[0]?.product.name.slice(0, 30) : "") || "Visual Search",
    categorySlug: scored[0]?.categorySlug || "all",
    categoryHint: "all",
    confidence: hadDirectMatches ? (scored[0]?.matchScore || 80) : 0,
    bestMatches,
    similarProducts,
    matchedProducts: scored.slice(0, 24),
    availableCategories: [],
    relatedProducts: [],
    total: scored.length,
    page: 1,
    pageSize: 24,
    hasMore: scored.length > 24
  };

  setVisualSearchSession({
    previewUrl,
    matchedProducts: result.matchedProducts,
    bestMatches,
    similarProducts,
    confidence: result.confidence,
    keyword: result.primaryKeyword,
    total: scored.length,
    page: 1,
    hasMore: result.hasMore
  });

  return result;
}

// Master Production Visual Search Pipeline
// Sends compressed image securely to backend Gemini Vision endpoint
export async function performVisualSearch(
  file: File,
  userQuery?: string,
  options?: { page?: number; pageSize?: number; categoryHint?: string }
): Promise<ImageAnalysisResult> {
  const compression = await compressImageForUpload(file, 1024, 0.85);
  const { base64, mimeType, previewUrl } = compression;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("/api/ai/visual-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: base64,
        mimeType,
        filename: file.name,
        userQuery: (userQuery || "").trim(),
        categoryHint: options?.categoryHint,
        page: options?.page || 1,
        pageSize: options?.pageSize || 24
      })
    });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Visual search API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.success) {
      throw new Error(data?.error || "Visual search engine returned an error");
    }

    // Safety guarantee: If backend returned 0 products, immediately run client visual fallback
    if (!data.products || data.products.length === 0) {
      console.warn("[VisualSearch] Backend returned 0 products, triggering client-side visual fallback");
      return localFallbackVisualSearch(file, previewUrl, userQuery);
    }

    const mappedProducts: MatchedProductItem[] = (data.products || []).map((p: any) => ({
      product: {
        id: String(p.id),
        name: p.name,
        slug: p.slug || `product-${p.id}`,
        price: Number(p.price) || 0,
        originalPrice: p.originalPrice || p.regular_price,
        image: p.image,
        category: p.category || p.category_name || "General",
        category_name: p.category_name || p.category,
        category_slug: p.category_slug || p.categorySlug,
        rating: Number(p.rating) || 4.8,
        reviews: Number(p.reviews) || 15,
        sold: Number(p.sold) || 40
      },
      matchScore: p.matchScore || 85,
      matchTier: p.matchTier || (p.matchScore >= 2000 ? "best" : "similar"),
      matchedReasons: p.matchedReasons || ["Visual Match"],
      categorySlug: p.category_slug || p.categorySlug
    }));

    const bestMatches = mappedProducts.filter((m) => m.matchTier === "best");
    const similarProducts = mappedProducts.filter((m) => m.matchTier === "similar");

    const analysisResult: ImageAnalysisResult = {
      previewUrl,
      sessionKey: data.sessionKey,
      detectedKeywords: data.keywords || [],
      primaryKeyword: data.primaryKeyword || "Visual Search",
      categorySlug: data.detectedCategory || "all",
      categoryHint: data.detectedCategory || "all",
      colorName: data.detectedColor,
      confidence: data.confidence || 85,
      isLowConfidence: (data.confidence || 0) < 60,
      bestMatches,
      similarProducts,
      matchedProducts: mappedProducts,
      availableCategories: [],
      relatedProducts: [],
      total: data.total !== undefined ? data.total : mappedProducts.length,
      page: data.page || 1,
      pageSize: data.pageSize || 24,
      totalPages: data.totalPages || 1,
      hasMore: Boolean(data.hasMore),
      aiPowered: Boolean(data.aiPowered),
      aiAnalysis: data.aiAnalysis
    };

    setVisualSearchSession({
      previewUrl,
      sessionKey: data.sessionKey,
      matchedProducts: mappedProducts,
      bestMatches,
      similarProducts,
      confidence: analysisResult.confidence,
      keyword: (userQuery && userQuery.trim()) ? userQuery.trim() : analysisResult.primaryKeyword,
      total: analysisResult.total,
      page: analysisResult.page,
      hasMore: analysisResult.hasMore,
      aiAnalysis: data.aiAnalysis
    });

    return analysisResult;
  } catch (err: any) {
    console.warn("[VisualSearch] Backend API unreachable or failed, switching to local fallback:", err);
    return localFallbackVisualSearch(file, previewUrl, userQuery);
  }
}

// Fetch Next Page via Server Session Cache (sub-10ms response)
export async function fetchVisualSearchNextPage(
  sessionKey: string,
  page: number,
  pageSize = 24
): Promise<{
  products: MatchedProductItem[];
  total: number;
  page: number;
  hasMore: boolean;
}> {
  try {
    const res = await fetch("/api/ai/visual-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey, page, pageSize })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const mappedProducts: MatchedProductItem[] = (data.products || []).map((p: any) => ({
      product: {
        id: String(p.id),
        name: p.name,
        slug: p.slug || `product-${p.id}`,
        price: Number(p.price) || 0,
        originalPrice: p.originalPrice || p.regular_price,
        image: p.image,
        category: p.category || p.category_name || "General",
        category_name: p.category_name || p.category,
        category_slug: p.category_slug || p.categorySlug,
        rating: Number(p.rating) || 4.8,
        reviews: Number(p.reviews) || 15,
        sold: Number(p.sold) || 40
      },
      matchScore: p.matchScore || 80,
      matchTier: p.matchTier || "similar",
      matchedReasons: p.matchedReasons || ["Visual Match"],
      categorySlug: p.category_slug || p.categorySlug
    }));

    return {
      products: mappedProducts,
      total: data.total || 0,
      page: data.page || page,
      hasMore: Boolean(data.hasMore)
    };
  } catch (err) {
    console.error("Failed to load visual search next page:", err);
    return { products: [], total: 0, page, hasMore: false };
  }
}

// Backward-compatible alias for existing modal invocations
export async function analyzeProductImage(file: File, userQuery?: string): Promise<ImageAnalysisResult> {
  return performVisualSearch(file, userQuery);
}

// In-Memory & Session Storage Visual Search Store
export function setVisualSearchSession(data: VisualSearchSessionData) {
  currentVisualSearchResults = data;
  if (typeof window !== "undefined") {
    // 1. Save Image Preview safely (Omit or truncate huge base64 to prevent QuotaExceededError)
    try {
      let safePreview = data.previewUrl || "";
      if (safePreview.startsWith("data:") && safePreview.length > 50000) {
        // Full resolution preview remains in-memory currentVisualSearchResults,
        // do not exceed sessionStorage 5MB quota with massive base64 string
        safePreview = "";
      }
      if (safePreview) {
        sessionStorage.setItem("durtup_visual_search_image", safePreview);
      }
    } catch (e) {
      console.warn("Could not save preview image to sessionStorage:", e);
    }

    // 2. Save Confidence & Keywords
    try {
      sessionStorage.setItem("durtup_visual_search_confidence", String(data.confidence || 85));
    } catch {}

    try {
      sessionStorage.setItem("durtup_visual_search_keyword", data.keyword || "Visual Search");
    } catch {}

    try {
      if (data.sessionKey) {
        sessionStorage.setItem("durtup_visual_search_session_key", data.sessionKey);
      }
    } catch {}

    // 3. Save Meta
    try {
      const meta = {
        sessionKey: data.sessionKey,
        total: data.total,
        page: data.page,
        hasMore: data.hasMore,
        aiAnalysis: data.aiAnalysis
      };
      sessionStorage.setItem("durtup_visual_search_meta", JSON.stringify(meta));
    } catch {}

    // 4. Save Matched Products (Lightweight objects)
    try {
      const minimalMatches = (data.matchedProducts || []).slice(0, 36);
      const minimalProducts = minimalMatches.map((m) => ({
        id: String(m.product.id),
        name: m.product.name,
        slug: m.product.slug,
        price: Number(m.product.price) || 0,
        originalPrice: m.product.originalPrice,
        image: m.product.image,
        category: m.product.category,
        category_name: m.product.category_name,
        category_slug: m.product.category_slug,
        rating: m.product.rating,
        reviews: m.product.reviews,
        sold: m.product.sold,
        matchTier: m.matchTier,
        matchScore: m.matchScore,
        matchedReasons: m.matchedReasons
      }));

      sessionStorage.setItem("durtup_visual_search_products", JSON.stringify(minimalProducts));
      sessionStorage.setItem("durtup_visual_search_matches", JSON.stringify(minimalMatches));
    } catch (e) {
      console.warn("Could not save visual search products to sessionStorage:", e);
    }

    try {
      window.dispatchEvent(new CustomEvent("durtup_visual_search_updated", { detail: data }));
    } catch {}
  }
}

export function getVisualSearchSession(): (VisualSearchSessionData & {
  products: Product[];
}) | null {
  if (currentVisualSearchResults) {
    let matches = currentVisualSearchResults.matchedProducts || [];
    if (matches.length === 0) {
      const fallbackProds = getInMemoryProducts() || [];
      matches = fallbackProds.slice(0, 24).map((p: any) => ({
        product: {
          id: String(p.id),
          name: p.name,
          slug: p.slug || `product-${p.id}`,
          price: Number(p.price) || 0,
          originalPrice: p.regular_price || p.originalPrice,
          image: p.image,
          category: p.category || p.category_name || "General",
          category_name: p.category_name || p.category,
          category_slug: p.category_slug || p.categorySlug,
          rating: Number(p.rating) || 4.8,
          reviews: Number(p.reviews) || 12,
          sold: Number(p.sold) || 30
        },
        matchScore: 80,
        matchTier: "similar",
        matchedReasons: ["জনপ্রিয় ট্রেন্ডিং পণ্য"]
      }));
    }
    return {
      ...currentVisualSearchResults,
      matchedProducts: matches,
      products: matches.map((m) => m.product)
    };
  }

  if (typeof window !== "undefined") {
    try {
      const matchesStr = sessionStorage.getItem("durtup_visual_search_matches");
      const productsStr = sessionStorage.getItem("durtup_visual_search_products");
      const metaStr = sessionStorage.getItem("durtup_visual_search_meta");
      const previewUrl = sessionStorage.getItem("durtup_visual_search_image") || "";
      const confidence = Number(sessionStorage.getItem("durtup_visual_search_confidence")) || 85;
      const keyword = sessionStorage.getItem("durtup_visual_search_keyword") || "Visual Search";
      const sessionKey = sessionStorage.getItem("durtup_visual_search_session_key") || undefined;

      let meta: any = {};
      if (metaStr) {
        try { meta = JSON.parse(metaStr); } catch {}
      }

      if (matchesStr) {
        const matches: MatchedProductItem[] = JSON.parse(matchesStr);
        if (Array.isArray(matches) && matches.length > 0) {
          const bestMatches = matches.filter((m) => m.matchTier === "best");
          const similarProducts = matches.filter((m) => m.matchTier === "similar");

          return {
            previewUrl,
            sessionKey: sessionKey || meta.sessionKey,
            matchedProducts: matches,
            bestMatches,
            similarProducts,
            products: matches.map((m) => m.product),
            confidence: confidence || matches[0]?.matchScore || 85,
            keyword,
            total: meta.total || matches.length,
            page: meta.page || 1,
            hasMore: meta.hasMore !== undefined ? meta.hasMore : false,
            aiAnalysis: meta.aiAnalysis
          };
        }
      }

      if (productsStr) {
        const prods: Product[] = JSON.parse(productsStr);
        if (Array.isArray(prods) && prods.length > 0) {
          return {
            previewUrl,
            sessionKey: sessionKey || meta.sessionKey,
            matchedProducts: prods.map((p) => ({
              product: p,
              matchScore: (p as any).matchScore || 85,
              matchTier: (p as any).matchTier || "similar",
              matchedReasons: ["Visual Match"]
            })),
            products: prods,
            confidence: confidence || 85,
            keyword,
            total: meta.total || prods.length,
            page: meta.page || 1,
            hasMore: meta.hasMore !== undefined ? meta.hasMore : false,
            aiAnalysis: meta.aiAnalysis
          };
        }
      }

      // If user uploaded a photo and is in visual search mode, provide fallback catalog products
      if (previewUrl || sessionStorage.getItem("durtup_visual_search_confidence")) {
        const fallbackProds = getInMemoryProducts() || [];
        const matches: MatchedProductItem[] = fallbackProds.slice(0, 24).map((p: any) => ({
          product: {
            id: String(p.id),
            name: p.name,
            slug: p.slug || `product-${p.id}`,
            price: Number(p.price) || 0,
            originalPrice: p.regular_price || p.originalPrice,
            image: p.image,
            category: p.category || p.category_name || "General",
            category_name: p.category_name || p.category,
            category_slug: p.category_slug || p.categorySlug,
            rating: Number(p.rating) || 4.8,
            reviews: Number(p.reviews) || 12,
            sold: Number(p.sold) || 30
          },
          matchScore: 80,
          matchTier: "similar",
          matchedReasons: ["জনপ্রিয় ট্রেন্ডিং পণ্য"]
        }));

        return {
          previewUrl,
          sessionKey,
          matchedProducts: matches,
          bestMatches: [],
          similarProducts: matches,
          products: matches.map((m) => m.product),
          confidence: 80,
          keyword: keyword || "Visual Search",
          total: matches.length,
          page: 1,
          hasMore: false,
          aiAnalysis: meta.aiAnalysis
        };
      }
    } catch (e) {
      console.warn("Error reading visual search from session:", e);
    }
  }

  return null;
}

export function clearVisualSearchSession() {
  currentVisualSearchResults = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("durtup_visual_search_image");
      sessionStorage.removeItem("durtup_visual_search_confidence");
      sessionStorage.removeItem("durtup_visual_search_keyword");
      sessionStorage.removeItem("durtup_visual_search_products");
      sessionStorage.removeItem("durtup_visual_search_matches");
      sessionStorage.removeItem("durtup_visual_search_category");
      sessionStorage.removeItem("durtup_visual_search_session_key");
      sessionStorage.removeItem("durtup_visual_search_meta");
      window.dispatchEvent(new CustomEvent("durtup_visual_search_cleared"));
    } catch {}
  }
}
