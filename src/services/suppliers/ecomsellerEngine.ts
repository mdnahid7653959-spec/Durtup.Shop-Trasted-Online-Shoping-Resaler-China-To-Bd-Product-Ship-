import DOMPurify from "dompurify";
import { supabase } from "@/lib/firebaseAdapter";
import { 
  EcomsellerRawProduct, 
  EcomsellerRawCategory, 
  EcomsellerRawBrand, 
  EcomsellerProductDetail,
  SupplierSyncLog,
  TieredMarginRule,
  SupplierPricingConfig
} from "./supplierTypes";
import { CategoryMappingService } from "./categoryMappingService";

// TSS / Seroval Deserializer for TanStack Router Server Functions
export function parseTssResponse(data: any): any {
  const refs = new Map<number, any>();

  function walk(node: any): any {
    if (node === null || node === undefined) return node;
    if (typeof node !== "object") return node;

    if (node.t === 10) { // Object
      const obj: Record<string, any> = {};
      if (node.i !== undefined) refs.set(node.i, obj);
      const keys = node.p?.k || [];
      const values = node.p?.v || [];
      for (let idx = 0; idx < keys.length; idx++) {
        obj[keys[idx]] = walk(values[idx]);
      }
      return obj;
    }

    if (node.t === 9) { // Array
      const arr: any[] = [];
      if (node.i !== undefined) refs.set(node.i, arr);
      for (const item of (node.a || [])) {
        arr.push(walk(item));
      }
      return arr;
    }

    if (node.t === 1) return String(node.s ?? "");
    if (node.t === 2 || node.t === 0) {
      if (node.s !== undefined) return Number(node.s) || 0;
      if (node.n !== undefined) return Number(node.n) || 0;
      if (node.i !== undefined && refs.has(node.i)) return refs.get(node.i);
      return 0;
    }
    if (node.t === 3) return Boolean(node.b ?? node.s);
    if (node.t === 4) return null;
    if (node.t === 5) return undefined;

    if (node.s !== undefined) return node.s;
    if (node.n !== undefined) return node.n;
    if (node.b !== undefined) return node.b;

    return node;
  }

  return walk(data);
}

// Seroval Serializer for Query Payloads
export function serializeToSeroval(val: any): any {
  let id = 0;
  function walk(v: any): any {
    if (v === null) return { t: 4 };
    if (v === undefined) return { t: 5 };
    if (typeof v === "boolean") return { t: 3, b: v };
    if (typeof v === "number") return { t: 2, n: v };
    if (typeof v === "string") return { t: 1, s: v };
    if (Array.isArray(v)) {
      const curId = id++;
      const items = v.map(walk);
      return { t: 9, i: curId, a: items, o: 0 };
    }
    if (typeof v === "object") {
      const curId = id++;
      const keys = Object.keys(v);
      const values = keys.map(k => walk(v[k]));
      return { t: 10, i: curId, p: { k: keys, v: values }, o: 0 };
    }
    return { t: 5 };
  }

  const rootNode = walk(val);
  return {
    t: rootNode,
    f: 0,
    m: []
  };
}

const CATEGORIES_SERVER_FN = "53f6e25532eda7e5a30d487296c48d6be16a40d02ebf430aab2a0edea81fa0d2";
const PRODUCTS_SERVER_FN = "5a01c59194865d30180a7f68b4912eb37e699345f2bbe311a9d2d8c38e2e897b";
const DETAIL_SERVER_FN = "007261ee9d86e87592cfcd5491f56565cca84574c79db98974ab1951a1437f9d";
const ECOMSELLER_BASE = "https://ecomsellerbd.com";

const CACHE_KEY_CATALOG = "ecomseller_catalog_cache_v7";
const CACHE_KEY_PRICING = "durtup_supplier_pricing_config_v2";

export class EcomsellerEngine {
  public static SUPPLIER_ID = "ecomseller_bd";
  public static SUPPLIER_NAME = "Ecomseller BD";
  public static CATALOG_URL = "https://ecomsellerbd.com/catalog";

  private static inMemoryProductsCache: any[] | null = null;
  private static activeCategoriesFn = CATEGORIES_SERVER_FN;
  private static activeProductsFn = PRODUCTS_SERVER_FN;
  private static activeDetailFn = DETAIL_SERVER_FN;

  /**
   * Helper to perform HTTP GET requests with CORS proxies when in browser
   */
  private static async fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  private static async executeFetch(url: string, headers: Record<string, string> = {}): Promise<string> {
    const defaultHeaders = {
      "Accept": "application/json, text/plain, */*",
      "x-tsr-serverfn": "true",
      "Referer": "https://ecomsellerbd.com/catalog",
      ...headers
    };

    // 1. Local Vite or Vercel API Proxy attempt (fastest and handles CORS cleanly)
    if (typeof window !== "undefined" && url.startsWith(ECOMSELLER_BASE)) {
      try {
        const localProxyUrl = url.replace(ECOMSELLER_BASE, "/api/ecomseller");
        const res = await this.fetchWithTimeout(localProxyUrl, { headers: defaultHeaders }, 10000);
        if (res.ok) {
          const text = await res.text();
          if (text && !text.trim().startsWith("<!DOCTYPE") && !text.trim().startsWith("<html")) {
            return text;
          }
        }
      } catch (proxyErr) {
        // Local proxy not available or timed out
      }
    }

    // 2. Direct fetch attempt
    try {
      const res = await this.fetchWithTimeout(url, { headers: defaultHeaders }, 8000);
      if (res.ok) {
        const text = await res.text();
        if (text && !text.trim().startsWith("<!DOCTYPE") && !text.trim().startsWith("<html")) {
          return text;
        }
      }
    } catch (directErr) {
      // CORS or network error
    }

    // 3. Fallback to public seed catalog if requesting catalog endpoint
    if ((url.includes(this.activeProductsFn) || url.includes(this.activeCategoriesFn)) && typeof window !== "undefined") {
      try {
        const seedRes = await this.fetchWithTimeout("/ecomseller_catalog.json", {}, 6000);
        if (seedRes.ok) {
          const text = await seedRes.text();
          if (text && text.length > 50 && !text.trim().startsWith("<!DOCTYPE")) {
            return text;
          }
        }
      } catch {}
    }

    // 4. Secondary proxy fallback (corsproxy.io)
    try {
      const secProxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
      const secRes = await this.fetchWithTimeout(secProxyUrl, { headers: defaultHeaders }, 8000);
      if (secRes.ok) {
        const text = await secRes.text();
        if (text && !text.trim().startsWith("<!DOCTYPE")) {
          return text;
        }
      }
    } catch (secErr) {
      // All fetch attempts failed
    }

    throw new Error(`Failed to fetch data from ${url}. Check your internet connection or proxy availability.`);
  }

  /**
   * Convert raw Ecomseller BD catalog data into unified Durtup store Product format
   */
  public static convertCatalogToUnified(catalog: {
    products?: EcomsellerRawProduct[];
    categories?: EcomsellerRawCategory[];
    brands?: EcomsellerRawBrand[];
  }): any[] {
    const pricingConfig = this.getPricingConfig();
    const rawCategories = catalog.categories || [];
    const catMap = new Map<string, { id: string; name: string; slug: string }>();
    rawCategories.forEach(c => {
      catMap.set(c.id, { id: c.id, name: c.name, slug: c.slug });
    });

    return (catalog.products || []).map((p) => {
      const rawCat = catMap.get(p.categoryId);
      const mappedCategory = CategoryMappingService.resolveProductCategory(p.name, rawCat?.slug || "", rawCat?.name || "");
      const priceInfo = this.calculatePrice(p.price, mappedCategory.slug, p.id, pricingConfig);

      const numId = typeof p.id === "string" ? p.id.split("-")[0].replace(/\D/g, "") || "10" : Number(p.id) || 10;
      const seedNum = parseInt(numId, 10) || 15;
      const regPrice = priceInfo.regularStrikethroughPrice;
      const sellPrice = priceInfo.finalSellingPrice;
      const hasDiscount = regPrice && regPrice > sellPrice;

      const sanitizeImg = (u: any): string => {
        if (!u || typeof u !== "string") return "";
        return u.trim();
      };

      const rawImgs = Array.isArray(p.images) && p.images.length > 0 ? p.images.map(sanitizeImg).filter(Boolean) : (p.image ? [sanitizeImg(p.image)] : []);
      const primaryImg = sanitizeImg(p.image) || rawImgs[0] || "";

      return {
        id: `ecom-${p.id}`,
        name: p.name,
        slug: p.slug || `product-${p.id}`,
        regular_price: regPrice,
        discount_price: sellPrice,
        price: sellPrice,
        originalPrice: hasDiscount ? regPrice : undefined,
        wholesale_price: p.resellerPrice,
        stock_quantity: 25,
        in_stock: true,
        status: "active",
        approval_status: "approved",
        seller_id: "Ecomseller BD",
        seller_name: "Ecomseller BD",
        supplier_id: this.SUPPLIER_ID,
        supplier_name: this.SUPPLIER_NAME,
        supplier_sku: p.code,
        sku: `ECOM-${p.code || p.id}`,
        category: mappedCategory.name,
        category_id: mappedCategory.id,
        category_slug: mappedCategory.slug,
        brand: "Generic",
        description: p.short || p.description || "",
        image: primaryImg,
        images: rawImgs,
        product_images: rawImgs.map((imgUrl: string, idx: number) => ({
          id: `ecom-img-${idx}`,
          image_url: imgUrl,
          is_primary: idx === 0,
          sort_order: idx
        })),
        is_featured: Boolean(p.featured),
        rating: 4.8,
        reviews: 15 + (seedNum % 30),
        sold: 45 + (seedNum % 80),
        freeShipping: true,
        isNew: true,
        isBestSeller: Boolean(p.featured) || (seedNum % 4 === 0),
        created_at: new Date().toISOString()
      };
    });
  }

  /**
   * Helper to fetch a single page of products with perPage = 200
   */
  private static async fetchProductsPage(page = 1, perPage = 200): Promise<{ products: EcomsellerRawProduct[]; total: number }> {
    const payloadTree = {
      t: {
        t: 10,
        i: 0,
        p: {
          k: ["data"],
          v: [
            {
              t: 10,
              i: 1,
              p: {
                k: ["page", "perPage"],
                v: [{ t: 0, s: page }, { t: 0, s: perPage }]
              },
              o: 0
            }
          ]
        },
        o: 0
      },
      f: 127,
      m: []
    };

    const query = "payload=" + encodeURIComponent(JSON.stringify(payloadTree));
    const endpointUrl = `${ECOMSELLER_BASE}/_serverFn/${this.activeProductsFn}?${query}`;
    const rawText = await this.executeFetch(endpointUrl);
    const rawJson = JSON.parse(rawText);

    if (rawJson && Array.isArray(rawJson.products)) {
      return { products: rawJson.products, total: rawJson.total || rawJson.products.length };
    }

    const decoded = parseTssResponse(rawJson);
    const result = decoded?.result || {};
    const rawProducts: any[] = result.products || [];
    const products: EcomsellerRawProduct[] = rawProducts.map((p: any) => ({
      id: p.id,
      name: p.name || "Untitled Product",
      slug: p.slug || `product-${p.id}`,
      code: p.code || p.id,
      short: p.short || "",
      price: Number(p.price) || 0,
      resellerPrice: Number(p.resellerPrice) || 0,
      categoryId: p.categoryId,
      brandId: p.brandId,
      featured: Number(p.featured) || 0,
      image: p.image || (Array.isArray(p.images) ? p.images[0] : ""),
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])
    }));

    return { products, total: Number(result.total) || products.length };
  }

  /**
   * Fetch Live Master Catalog from Ecomseller BD
   */
  public static async fetchLiveCatalog(forceRefresh = false): Promise<{
    products: EcomsellerRawProduct[];
    categories: EcomsellerRawCategory[];
    brands: EcomsellerRawBrand[];
  }> {
    if (!forceRefresh && typeof window !== "undefined") {
      const cached = localStorage.getItem(CACHE_KEY_CATALOG);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.products && parsed.products.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }

    let catalogData: {
      products: EcomsellerRawProduct[];
      categories: EcomsellerRawCategory[];
      brands: EcomsellerRawBrand[];
    } | null = null;

    try {
      // 1. Fetch Categories & Brands
      let categories: EcomsellerRawCategory[] = [];
      let brands: EcomsellerRawBrand[] = [];

      try {
        const catEndpoint = `${ECOMSELLER_BASE}/_serverFn/${this.activeCategoriesFn}`;
        const catRaw = await this.executeFetch(catEndpoint);
        const catJson = JSON.parse(catRaw);
        const catDecoded = parseTssResponse(catJson);
        categories = catDecoded?.result?.categories || [];
        brands = catDecoded?.result?.brands || [];
      } catch (catErr) {
        console.warn("[EcomsellerEngine] Categories fetch warning:", catErr);
      }

      // 2. Fetch Page 1 Products
      const page1 = await this.fetchProductsPage(1, 200);
      let allProducts = [...(page1.products || [])];
      const total = page1.total || allProducts.length;

      // 3. Fetch remaining pages if any
      if (total > allProducts.length) {
        const totalPages = Math.ceil(total / 200);
        for (let p = 2; p <= totalPages; p++) {
          try {
            const nextP = await this.fetchProductsPage(p, 200);
            if (nextP.products && nextP.products.length > 0) {
              allProducts.push(...nextP.products);
            }
          } catch (pErr) {
            console.warn(`[EcomsellerEngine] Page ${p} fetch warning:`, pErr);
          }
        }
      }

      if (allProducts.length > 0) {
        catalogData = { products: allProducts, categories, brands };
      }
    } catch (netErr) {
      console.warn("[EcomsellerEngine] Live catalog fetch failed, loading static seed catalog:", netErr);
    }

    // Fallback to static seed catalog if needed
    if (!catalogData || !catalogData.products || catalogData.products.length === 0) {
      if (typeof window !== "undefined") {
        try {
          const res = await fetch("/ecomseller_catalog.json");
          if (res.ok) {
            catalogData = await res.json();
          }
        } catch (staticErr) {
          console.error("[EcomsellerEngine] Static catalog fallback also failed:", staticErr);
        }
      }
    }

    if (!catalogData) {
      catalogData = { products: [], categories: [], brands: [] };
    }

    if (catalogData.products && catalogData.products.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(CACHE_KEY_CATALOG, JSON.stringify(catalogData));
      } catch (e) {
        console.warn("Catalog storage quota exceeded:", e);
      }
    }

    return catalogData;
  }

  /**
   * Get all Ecomseller BD products converted into unified Durtup store Product format
   * with calculated selling prices and mapped categories (cached for instant 0ms access)
   */
  public static async getCachedEcomsellerProducts(forceRefresh = false): Promise<any[]> {
    if (!forceRefresh && this.inMemoryProductsCache && this.inMemoryProductsCache.length > 0) {
      return this.inMemoryProductsCache;
    }

    try {
      // 1. Check localStorage first
      if (!forceRefresh && typeof window !== "undefined") {
        const cached = localStorage.getItem(CACHE_KEY_CATALOG);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.products && parsed.products.length > 0) {
              const unified = this.convertCatalogToUnified(parsed);
              this.inMemoryProductsCache = unified;
              return unified;
            }
          } catch {}
        }
      }

      // 2. Instant static catalog load from local server (0ms first load)
      if (!forceRefresh && typeof window !== "undefined") {
        try {
          const res = await fetch("/ecomseller_catalog.json");
          if (res.ok) {
            const seed = await res.json();
            if (seed && seed.products && seed.products.length > 0) {
              const unified = this.convertCatalogToUnified(seed);
              this.inMemoryProductsCache = unified;
              try {
                localStorage.setItem(CACHE_KEY_CATALOG, JSON.stringify(seed));
              } catch {}
              return unified;
            }
          }
        } catch (staticErr) {
          console.warn("[EcomsellerEngine] Static seed load failed:", staticErr);
        }
      }

      // 3. Fetch live catalog (or on forceRefresh)
      const catalog = await this.fetchLiveCatalog(forceRefresh);
      if (catalog && catalog.products && catalog.products.length > 0) {
        const unified = this.convertCatalogToUnified(catalog);
        this.inMemoryProductsCache = unified;
        return unified;
      }

      return this.inMemoryProductsCache || [];
    } catch (err) {
      console.warn("[EcomsellerEngine] getCachedEcomsellerProducts error:", err);
      return this.inMemoryProductsCache || [];
    }
  }

  /**
   * Fetch Full Product Details (HTML description, delivery, weight, stock) by Slug
   */
  public static async fetchProductDetail(slug: string): Promise<EcomsellerProductDetail | null> {
    try {
      const payloadObj = { data: { slug } };
      const serovalPayload = JSON.stringify(serializeToSeroval(payloadObj));
      const query = `payload=${encodeURIComponent(serovalPayload)}`;
      const url = `${ECOMSELLER_BASE}/_serverFn/${DETAIL_SERVER_FN}?${query}`;

      const rawText = await this.executeFetch(url);
      const rawJson = JSON.parse(rawText);
      const decoded = parseTssResponse(rawJson);

      const item = decoded?.result;
      if (!item) return null;

      const unescapeHex = (s: string) => (s || "")
        .replace(/\\x3C/gi, "<")
        .replace(/\\x3E/gi, ">")
        .replace(/\\x22/gi, '"')
        .replace(/\\x27/gi, "'")
        .replace(/\\x2F/gi, "/")
        .replace(/\\x26/gi, "&")
        .replace(/\\x0A/gi, "\n")
        .replace(/\\x0D/gi, "\r")
        .replace(/\\"/g, '"');

      return {
        id: item.id || slug,
        name: item.name || "",
        slug: item.slug || slug,
        code: item.code || "",
        short: unescapeHex(item.short || ""),
        description: unescapeHex(item.description || ""),
        price: Number(item.price) || 0,
        resellerPrice: Number(item.resellerPrice) || 0,
        stock: Number(item.stock) || 10,
        weight: Number(item.weight) || 0,
        deliveryMode: item.deliveryMode || "area",
        deliverySource: item.deliverySource || "global",
        deliveryInside: Number(item.deliveryInside) || 70,
        deliverySub: Number(item.deliverySub) || 90,
        deliveryOutside: Number(item.deliveryOutside) || 130,
        deliveryFlat: Number(item.deliveryFlat) || 80,
        category: item.category || "",
        categorySlug: item.categorySlug || "",
        brand: item.brand || "",
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : [])
      };
    } catch (err) {
      console.warn(`[Ecomseller] Failed to fetch product detail for slug ${slug}:`, err);
      return null;
    }
  }

  /**
   * Calculate Durtup Final Selling Price using tiered hierarchy:
   * Product Margin > Category Margin > Supplier Margin > Global Margin
   */
  public static calculatePrice(
    suggestedBasePrice: number,
    durtupCategorySlug?: string,
    productId?: string,
    customConfig?: SupplierPricingConfig
  ): {
    baseSuggestedPrice: number;
    durtupMargin: number;
    finalSellingPrice: number;
    regularStrikethroughPrice: number;
    appliedRuleLevel: 'product' | 'category' | 'supplier' | 'global' | 'none';
  } {
    const base = Math.max(0, Number(suggestedBasePrice) || 0);
    const config = customConfig || this.getPricingConfig();

    let rule: TieredMarginRule | null = null;
    let appliedRuleLevel: 'product' | 'category' | 'supplier' | 'global' | 'none' = 'none';

    // 1. Product specific margin
    if (productId && config.productMargins?.[productId]?.enabled) {
      rule = config.productMargins[productId];
      appliedRuleLevel = 'product';
    }
    // 2. Category margin
    else if (durtupCategorySlug && config.categoryMargins?.[durtupCategorySlug]?.enabled) {
      rule = config.categoryMargins[durtupCategorySlug];
      appliedRuleLevel = 'category';
    }
    // 3. Supplier margin
    else if (config.supplierMargins?.[this.SUPPLIER_ID]?.enabled) {
      rule = config.supplierMargins[this.SUPPLIER_ID];
      appliedRuleLevel = 'supplier';
    }
    // 4. Global margin
    else if (config.globalMargin?.enabled) {
      rule = config.globalMargin;
      appliedRuleLevel = 'global';
    }

    if (!rule || !rule.enabled || rule.marginValue <= 0) {
      return {
        baseSuggestedPrice: base,
        durtupMargin: 0,
        finalSellingPrice: base,
        regularStrikethroughPrice: Math.round(base * 1.2),
        appliedRuleLevel: 'none'
      };
    }

    let profit = 0;
    if (rule.type === 'percentage') {
      profit = (base * rule.marginValue) / 100;
    } else {
      profit = rule.marginValue;
    }

    if (rule.minProfit !== undefined && profit < rule.minProfit) profit = rule.minProfit;
    if (rule.maxProfit !== undefined && profit > rule.maxProfit) profit = rule.maxProfit;

    let finalPrice = base + profit;

    // Psychological .99 rounding
    if (rule.roundTo99 && finalPrice > 100) {
      finalPrice = Math.floor(finalPrice / 10) * 10 + 9;
    } else {
      finalPrice = Math.round(finalPrice);
    }

    return {
      baseSuggestedPrice: base,
      durtupMargin: finalPrice - base,
      finalSellingPrice: finalPrice,
      regularStrikethroughPrice: Math.round(finalPrice * 1.25),
      appliedRuleLevel
    };
  }

  /**
   * Get Pricing Configuration from Cache or Storage
   */
  public static getPricingConfig(): SupplierPricingConfig {
    const defaultConfig: SupplierPricingConfig = {
      globalMargin: { enabled: false, type: 'fixed', marginValue: 0, roundTo99: false },
      supplierMargins: {
        [this.SUPPLIER_ID]: { enabled: false, type: 'fixed', marginValue: 0, roundTo99: false }
      },
      categoryMargins: {},
      productMargins: {}
    };

    if (typeof window === "undefined") return defaultConfig;
    try {
      const saved = localStorage.getItem(CACHE_KEY_PRICING);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If legacy default with 150 exists, reset to exact 0 markup
        if (parsed?.supplierMargins?.[this.SUPPLIER_ID]?.marginValue === 150) {
          parsed.supplierMargins[this.SUPPLIER_ID].enabled = false;
          parsed.supplierMargins[this.SUPPLIER_ID].marginValue = 0;
          localStorage.setItem(CACHE_KEY_PRICING, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {}
    return defaultConfig;
  }

  /**
   * Save Pricing Configuration
   */
  public static async savePricingConfig(config: SupplierPricingConfig): Promise<boolean> {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(CACHE_KEY_PRICING, JSON.stringify(config));
        window.dispatchEvent(new CustomEvent("supplier_pricing_updated", { detail: config }));
      }
      await supabase.from("site_settings").upsert({
        key: "ecomseller_supplier_pricing",
        value: config,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });
      return true;
    } catch (e) {
      console.error("Failed to save pricing config:", e);
      return false;
    }
  }

  /**
   * Import a single Ecomseller product into Durtup's database
   */
  public static async importProduct(
    rawProd: EcomsellerRawProduct,
    options: {
      fetchFullDetail?: boolean;
      customMargin?: TieredMarginRule;
      customCategorySlug?: string;
    } = {}
  ): Promise<{ success: boolean; productDocId?: string; message: string; isUpdate?: boolean }> {
    try {
      // 1. Fetch full details if requested or fallback to raw
      let fullDetail: EcomsellerProductDetail | null = null;
      if (options.fetchFullDetail !== false) {
        fullDetail = await this.fetchProductDetail(rawProd.slug);
      }

      const rawDescription = fullDetail?.description || rawProd.short || "";
      // Sanitize HTML safely
      const cleanDescription = DOMPurify.sanitize(rawDescription, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'span', 'br', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'div'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'title']
      });

      // 2. Resolve Category Mapping
      const mappings = await CategoryMappingService.getSupplierMappings(this.SUPPLIER_ID);
      const mappedCategory = CategoryMappingService.resolveCategory(
        fullDetail?.categorySlug || rawProd.slug,
        fullDetail?.category || rawProd.name,
        mappings
      );

      // 3. Compute Selling Price
      const suggestedPrice = fullDetail?.price || rawProd.price || 0;
      const wholesalePrice = fullDetail?.resellerPrice || rawProd.resellerPrice || 0;
      const supplierProfit = Math.max(0, suggestedPrice - wholesalePrice);

      const priceResult = this.calculatePrice(
        suggestedPrice,
        options.customCategorySlug || mappedCategory.slug,
        rawProd.id
      );

      const finalPrice = priceResult.finalSellingPrice;
      const sku = `ECOM-${rawProd.code}`;

      // 4. Duplicate Check by SKU or supplier_product_id
      const { data: existingList } = await supabase
        .from("products")
        .select("id, sku, supplier_product_id")
        .eq("sku", sku);

      const isUpdate = Boolean(existingList && existingList.length > 0);
      const targetDocId = isUpdate ? existingList[0].id : `prod-ecom-${rawProd.code}`;

      const allImages = fullDetail?.images && fullDetail.images.length > 0 
        ? fullDetail.images 
        : (rawProd.images && rawProd.images.length > 0 ? rawProd.images : [rawProd.image]);

      const productPayload = {
        id: targetDocId,
        name: fullDetail?.name || rawProd.name,
        slug: rawProd.slug || `ecom-${rawProd.code}`,
        sku: sku,
        regular_price: priceResult.regularStrikethroughPrice,
        discount_price: finalPrice,
        price: finalPrice,
        stock_quantity: fullDetail?.stock || 50,
        description: cleanDescription,
        category: mappedCategory.name,
        category_id: mappedCategory.id,
        category_slug: mappedCategory.slug,
        image: allImages[0] || "",
        image_url: allImages[0] || "",
        images: allImages,
        status: "active",
        approval_status: "approved",
        seller_id: this.SUPPLIER_NAME,
        supplier_id: this.SUPPLIER_ID,
        supplier_name: this.SUPPLIER_NAME,
        supplier_product_id: rawProd.id,
        supplier_sku: rawProd.code,
        supplier_source_url: `${this.CATALOG_URL}/${rawProd.slug}`,
        wholesale_price: wholesalePrice,
        suggested_sale_price: suggestedPrice,
        supplier_profit: supplierProfit,
        durtup_margin: priceResult.durtupMargin,
        brand: fullDetail?.brand || "China",
        weight: fullDetail?.weight || 0,
        is_featured: Boolean(rawProd.featured),
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(isUpdate ? {} : { created_at: new Date().toISOString() })
      };

      const { error: upsertErr } = await supabase
        .from("products")
        .upsert(productPayload, { onConflict: "sku" });

      if (upsertErr) {
        throw upsertErr;
      }

      // Invalidate local storage products caches
      if (typeof window !== "undefined") {
        localStorage.removeItem("enterprise_admin_products");
        localStorage.removeItem("local_products");
        window.dispatchEvent(new Event("admin_products_invalidated"));
        window.dispatchEvent(new Event("durtup_products_updated"));
      }

      return {
        success: true,
        productDocId: targetDocId,
        isUpdate,
        message: `${isUpdate ? "Updated" : "Imported"} "${rawProd.name}" (#${rawProd.code}) successfully.`
      };
    } catch (err: any) {
      console.error("[Ecomseller] Import error:", err);
      return {
        success: false,
        message: err.message || "Failed to import product into database."
      };
    }
  }

  /**
   * Bulk Import multiple products with progress callback
   */
  public static async bulkImport(
    products: EcomsellerRawProduct[],
    onProgress?: (current: number, total: number, lastProdName: string) => void
  ): Promise<SupplierSyncLog> {
    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors: any[] = [];

    const total = products.length;

    for (let i = 0; i < total; i++) {
      const prod = products[i];
      if (onProgress) {
        onProgress(i + 1, total, prod.name);
      }

      const res = await this.importProduct(prod, { fetchFullDetail: true });
      if (res.success) {
        if (res.isUpdate) updated++;
        else imported++;
      } else {
        failed++;
        errors.push({ id: prod.id, code: prod.code, name: prod.name, error: res.message });
      }

      // Small throttling pause to avoid browser hang
      if (i % 5 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    const log: SupplierSyncLog = {
      id: `log-${Date.now()}`,
      supplierId: this.SUPPLIER_ID,
      supplierName: this.SUPPLIER_NAME,
      actionType: 'bulk_sync',
      status: failed === 0 ? 'success' : (imported + updated > 0 ? 'warning' : 'failed'),
      importedCount: imported,
      updatedCount: updated,
      failedCount: failed,
      skippedCount: 0,
      message: `Bulk import completed. ${imported} new products imported, ${updated} updated, ${failed} failed.`,
      details: errors.length > 0 ? errors : null,
      createdAt: new Date().toISOString()
    };

    try {
      await supabase.from("supplier_sync_logs").insert(log);
    } catch {}

    return log;
  }

  /**
   * Sync existing imported Ecomseller products in Durtup database with live catalog
   */
  public static async syncImportedProducts(
    onProgress?: (current: number, total: number, lastProdName: string) => void
  ): Promise<SupplierSyncLog> {
    // 1. Fetch live catalog
    const liveCatalog = await this.fetchLiveCatalog(true);
    const liveMap = new Map<string, EcomsellerRawProduct>();
    liveCatalog.products.forEach(p => {
      liveMap.set(p.code, p);
      liveMap.set(p.slug, p);
      liveMap.set(p.id, p);
    });

    // 2. Fetch existing products from Durtup database with supplier_id = ecomseller_bd
    const { data: dbProducts } = await supabase
      .from("products")
      .select("*")
      .eq("supplier_id", this.SUPPLIER_ID);

    const itemsToSync = dbProducts || [];
    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < itemsToSync.length; i++) {
      const p = itemsToSync[i];
      if (onProgress) {
        onProgress(i + 1, itemsToSync.length, p.name);
      }

      const match = liveMap.get(p.supplier_sku) || liveMap.get(p.supplier_product_id) || liveMap.get(p.slug);
      if (match) {
        const res = await this.importProduct(match, { fetchFullDetail: true });
        if (res.success) updatedCount++;
        else {
          failedCount++;
          errors.push({ id: p.id, name: p.name, error: res.message });
        }
      } else {
        skippedCount++;
      }
    }

    const log: SupplierSyncLog = {
      id: `sync-${Date.now()}`,
      supplierId: this.SUPPLIER_ID,
      supplierName: this.SUPPLIER_NAME,
      actionType: 'product_sync',
      status: failedCount === 0 ? 'success' : 'warning',
      importedCount: 0,
      updatedCount,
      failedCount,
      skippedCount,
      message: `Sync completed: ${updatedCount} products updated, ${skippedCount} not in catalog, ${failedCount} errors.`,
      details: errors,
      createdAt: new Date().toISOString()
    };

    try {
      await supabase.from("supplier_sync_logs").insert(log);
    } catch {}

    return log;
  }
}
