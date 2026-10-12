import { collection, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { supabase } from "@/lib/firebaseAdapter";
import {
  ISearchEngineAdapter,
  SearchOptions,
  SearchResult,
  SearchSuggestions,
  SearchProductResult
} from "../ISearchEngineAdapter";
import { synonymManager } from "../SynonymManager";
import { fuzzyMatchToken, tokenizeText, normalizeText, getEditDistance } from "../FuzzySearchEngine";
import { searchAnalytics } from "../SearchAnalyticsService";
import { getCachedMohasagorProducts, getInMemoryProducts, fetchSlimCatalog, FALLBACK_SUPPLIER_PRODUCTS, inferCategory } from "@/utils/mohasagorCache";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { productMatchesCategory, normalizeCategory } from "@/utils/categoryHelper";

const defaultImages = [
  "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop"
];

export function normalizeCategorySlug(raw: string): string {
  const str = (raw || "").toLowerCase().trim();
  if (str === "watch" || str === "watches" || str.includes("watch") || str.includes("quartz")) return "watch";
  if (str.includes("food") || str.includes("supplement") || str.includes("honey")) return "foods";
  if (str.includes("beauty") || str.includes("health") || str.includes("skin") || str.includes("care") || str.includes("cosmetic")) return "health-beauty";
  if (str.includes("toy") || str.includes("kid") || str.includes("baby") || str.includes("child")) return "kids-zone";
  if (str.includes("winter") || str.includes("hoodie")) return "winter";
  if (str.includes("women") || str.includes("saree") || str.includes("kurti") || str.includes("borkha") || str.includes("jewelry")) return "womens-fashion";
  if (str.includes("men") || str.includes("panjabi") || str.includes("shirt") || str.includes("pant") || str.includes("fashion") || str.includes("cloth")) return "mens-fashion";
  if (str.includes("home") || str.includes("kitchen") || str.includes("lifestyle") || str.includes("living") || str.includes("appliance")) return "home-lifestyle";
  if (str.includes("electronic") || str.includes("gadget") || str.includes("mobile") || str.includes("phone") || str.includes("tech") || str.includes("audio")) return "gadgets-electronics";
  if (str.includes("gift") || str.includes("custom")) return "customize-gift";
  if (str.includes("offer") || str.includes("deal") || str.includes("combo")) return "offer";
  if (str.includes("other")) return "others";
  return str;
}

export function inferProductCategory(name: string, currentCategory?: string): string {
  return inferCategory(name, currentCategory);
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

function getSessionSeed(): number {
  if (typeof window === "undefined") return 12345;
  let seedStr = sessionStorage.getItem("durtup_user_feed_seed");
  if (!seedStr) {
    seedStr = Math.floor(Math.random() * 1000000).toString();
    sessionStorage.setItem("durtup_user_feed_seed", seedStr);
  }
  // Change time bucket every 5 minutes (5 * 60 * 1000 = 300000ms)
  const timeBucket = Math.floor(Date.now() / 300000);
  return parseInt(seedStr, 10) + timeBucket * 9973;
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let m = arr.length, t, i;
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  while (m) {
    i = Math.floor(pseudoRandom() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

export class FirestoreSearchAdapter implements ISearchEngineAdapter {
  private indexedProducts: any[] = [];
  private indexedCategories: { id: string; name: string; slug: string }[] = [];
  private indexedBrands: { id: string; name: string; slug: string }[] = [];
  private indexedSellers: { id: string; name: string }[] = [];
  private isLoaded = false;
  private lastFetchTime = 0;
  private CACHE_TTL = 1 * 60 * 1000; // 1 minute cache for real-time reactivity
  private ongoingBuildPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const handleInvalidate = () => {
        this.invalidateIndex();
        this.buildIndex().catch(() => {});
      };
      window.addEventListener("admin_products_updated", handleInvalidate);
      window.addEventListener("mohasagor_products_updated", handleInvalidate);
      window.addEventListener("ecomseller_products_updated", handleInvalidate);
      window.addEventListener("durtup_products_updated", handleInvalidate);
    }

    setTimeout(() => {
      this.buildIndex().catch(() => {});
    }, 100);
  }

  public invalidateIndex(): void {
    this.isLoaded = false;
    this.lastFetchTime = 0;
  }

  public getIndexedCategories(): { id: string; name: string; slug: string }[] {
    return this.indexedCategories;
  }

  public async buildIndex(products?: any[]): Promise<void> {
    const now = Date.now();
    if (this.isLoaded && this.indexedProducts.length > 0 && now - this.lastFetchTime < this.CACHE_TTL && !products) {
      return;
    }
    if (this.ongoingBuildPromise && !products) {
      return this.ongoingBuildPromise;
    }

    this.ongoingBuildPromise = (async () => {
      await synonymManager.init();

      try {
        if (products && products.length > 0) {
          this.indexedProducts = products;
        } else {
          const productMap = new Map<string, any>();

          const addProductToMap = (p: any, idx: number = 0, defaultSource: string = "mohasagor") => {
            if (!p || !p.id) return;
            const pid = String(p.id);
            if (productMap.has(pid)) return;

            let categoryName = p.category_name || p.category || p.categoryName;
            if (!categoryName || categoryName === "General" || categoryName === "none" || categoryName === "Gadgets, Mouse & Cameras") {
              categoryName = p.name ? inferProductCategory(p.name) : "General";
            }
            let categorySlug = p.category_slug || p.categorySlug || normalizeCategorySlug(categoryName);
            if (categorySlug === "gadgets" && categoryName !== "Gadgets & Electronics" && categoryName !== "Gadgets, Mouse & Cameras") {
              categorySlug = normalizeCategorySlug(categoryName);
            }

            productMap.set(pid, {
              id: pid,
              name: p.name || p.title || "Product",
              slug: p.slug || `product-${pid}`,
              regular_price: Number(p.originalPrice || p.regular_price || p.price || 0),
              discount_price: p.originalPrice && p.originalPrice > p.price ? Number(p.price) : (p.discount_price ? Number(p.discount_price) : null),
              price: Number(p.price || 0),
              category: categoryName,
              category_name: categoryName,
              category_slug: categorySlug,
              category_id: p.category_id || categorySlug,
              brand: p.brand || p.brand_name || "Generic",
              seller_name: p.seller_name || p.supplier_name || "Durtup Marketplace",
              supplier_id: p.supplier_id || defaultSource,
              supplier_name: p.supplier_name || (defaultSource === "ecomseller_bd" ? "Ecomseller BD" : "Durtup Marketplace"),
              sku: p.product_code || p.sku || `SKU-${pid}`,
              product_code: p.product_code || pid,
              supplier_sku: p.supplier_sku || p.product_code || p.sku,
              image: p.image || defaultImages[idx % defaultImages.length],
              product_images: Array.isArray(p.images) ? p.images.map((u: string) => ({ image_url: u })) : [{ image_url: p.image || defaultImages[idx % defaultImages.length] }],
              rating_average: Number(p.rating || p.rating_average || 4.8),
              rating_count: Number(p.reviews || p.rating_count || 15),
              sold_count: Number(p.sold || p.sold_count || 45),
              in_stock: p.in_stock !== false && p.stock !== 0,
              status: "active",
              description: p.details || p.description || ""
            });
          };

          // 1. Fetch visual_index.json immediately (3,092 products pre-indexed with tokens, images, pricing)
          try {
            const url = typeof window !== "undefined"
              ? "/visual_index.json?v=20261013_cat_v2"
              : "http://localhost:8080/visual_index.json?v=20261013_cat_v2";
            const res = await fetch(url);
            if (res.ok) {
              const visualData = await res.json();
              if (Array.isArray(visualData) && visualData.length > 0) {
                visualData.forEach((p: any, idx: number) => addProductToMap(p, idx, "mohasagor"));
                this.indexedProducts = Array.from(productMap.values());
              }
            }
          } catch (e) {
            console.warn("[FirestoreSearchAdapter] visual_index load error:", e);
          }

          // 2. Fetch Ecomseller Catalog (274 products from local JSON)
          try {
            const { EcomsellerEngine } = await import("@/services/suppliers/ecomsellerEngine");
            const ecomList = await EcomsellerEngine.getCachedEcomsellerProducts();
            if (ecomList && ecomList.length > 0) {
              ecomList.forEach((p: any, idx: number) => addProductToMap(p, idx, "ecomseller_bd"));
              this.indexedProducts = Array.from(productMap.values());
            }
          } catch (e) {
            console.warn("[FirestoreSearchAdapter] Ecomseller load error:", e);
          }

          // 3. Fallback to Slim Catalog or In-Memory catalog if productMap is still small
          if (productMap.size < 500) {
            try {
              const memCatalog = getInMemoryProducts();
              if (memCatalog && memCatalog.length > 0) {
                memCatalog.forEach((p: any, idx: number) => addProductToMap(p, idx));
              }
              const cached = await fetchSlimCatalog();
              if (cached && cached.length > 0) {
                cached.forEach((p: any, idx: number) => addProductToMap(p, idx));
              }
            } catch (e) {}
            FALLBACK_SUPPLIER_PRODUCTS.forEach((p: any, idx: number) => addProductToMap(p, idx));
            this.indexedProducts = Array.from(productMap.values());
          }

          // 4. Fetch Local Storage Admin Products
          if (typeof window !== "undefined") {
            try {
              const rawLocal = localStorage.getItem("enterprise_admin_products") || localStorage.getItem("local_products");
              if (rawLocal) {
                const localList = JSON.parse(rawLocal);
                if (Array.isArray(localList)) {
                  localList.forEach((p: any, idx: number) => addProductToMap(p, idx, "admin"));
                }
              }
            } catch (e) {}
          }

          // 5. Fetch Supabase / Firestore products with 1500ms safety timeout
          try {
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
            const dbPromise = (async () => {
              try {
                const { data: dbProducts } = await supabase.from("products").select(`*, product_images(*)`);
                if (dbProducts && dbProducts.length > 0) {
                  dbProducts.forEach((p: any, idx: number) => addProductToMap(p, idx, "database"));
                }
              } catch {}
              try {
                const snap = await getDocs(collection(db, "products"));
                if (!snap.empty) {
                  snap.docs.forEach((d, idx) => addProductToMap({ id: d.id, ...d.data() }, idx, "firestore"));
                }
              } catch {}
            })();
            await Promise.race([dbPromise, timeoutPromise]);
          } catch (e) {}

          this.indexedProducts = Array.from(productMap.values());
        }

      // Build categories & brands facets index
      const categorySet = new Map<string, { id: string; name: string; slug: string }>();
      const brandSet = new Map<string, { id: string; name: string; slug: string }>();
      const sellerSet = new Map<string, { id: string; name: string }>();

      this.indexedProducts.forEach((p) => {
        if (p.category) {
          const cName = p.category;
          const cSlug = cName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          categorySet.set(cName, { id: cSlug, name: cName, slug: cSlug });
        }
        if (p.brand) {
          const bName = p.brand;
          const bSlug = bName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          brandSet.set(bName, { id: bSlug, name: bName, slug: bSlug });
        }
        if (p.seller_name) {
          sellerSet.set(p.seller_name, { id: p.seller_id || p.seller_name, name: p.seller_name });
        }
      });

      this.indexedCategories = Array.from(categorySet.values());
      this.indexedBrands = Array.from(brandSet.values());
      this.indexedSellers = Array.from(sellerSet.values());

      this.isLoaded = true;
      this.lastFetchTime = now;
    } catch (err) {
      console.warn("[FirestoreSearchAdapter] Build index warning:", err);
    } finally {
      this.ongoingBuildPromise = null;
    }
  })();

  return this.ongoingBuildPromise;
}

  public async indexProduct(product: any): Promise<void> {
    const existingIdx = this.indexedProducts.findIndex((p) => p.id === product.id);
    if (existingIdx >= 0) {
      this.indexedProducts[existingIdx] = product;
    } else {
      this.indexedProducts.unshift(product);
    }
  }

  public async removeProduct(id: string): Promise<void> {
    this.indexedProducts = this.indexedProducts.filter((p) => p.id !== id);
  }

  public async getSuggestions(rawQuery: string): Promise<SearchSuggestions> {
    await this.buildIndex();
    const queryStr = rawQuery.toLowerCase().trim();

    if (!queryStr) {
      return {
        products: [],
        categories: this.indexedCategories.slice(0, 4),
        brands: this.indexedBrands.slice(0, 4),
        sellers: this.indexedSellers.slice(0, 4),
        trending: ["Wireless earbuds", "Smart watch", "Mobile phone", "Laptop", "Gaming mouse"],
        recent: searchAnalytics.getRecentSearches()
      };
    }

    const searchResult = await this.search(queryStr, { limit: 8 });

    const suggestedProducts = searchResult.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: p.price,
      originalPrice: p.originalPrice,
      regular_price: p.originalPrice || p.price,
      discount_price: p.originalPrice && p.originalPrice > p.price ? p.price : null,
      rating_average: p.rating,
      rating_count: p.reviews,
      category: p.category
    }));

    const suggestedCategories = this.indexedCategories.filter(
      (c) => c.name.toLowerCase().includes(queryStr) || queryStr.includes(c.name.toLowerCase())
    ).slice(0, 3);

    const suggestedBrands = this.indexedBrands.filter(
      (b) => b.name.toLowerCase().includes(queryStr) || queryStr.includes(b.name.toLowerCase())
    ).slice(0, 3);

    const suggestedSellers = this.indexedSellers.filter(
      (s) => s.name.toLowerCase().includes(queryStr) || queryStr.includes(s.name.toLowerCase())
    ).slice(0, 3);

    return {
      products: suggestedProducts,
      categories: suggestedCategories,
      brands: suggestedBrands,
      sellers: suggestedSellers,
      trending: ["Wireless earbuds", "Smart watch", "Mobile phone", "Laptop"],
      recent: searchAnalytics.getRecentSearches()
    };
  }

  public async search(rawQuery: string, options: SearchOptions = {}): Promise<SearchResult> {
    await this.buildIndex();
    const queryRaw = (rawQuery || "").trim();
    const queryStr = queryRaw.toLowerCase();
    const queryNorm = normalizeText(queryRaw);

    // 1. Expand query with bilingual synonym engine
    const { expandedTerms, matchedRules } = synonymManager.expandQuery(queryRaw);
    const queryTokens = queryNorm ? tokenizeText(queryNorm, true).filter(t => t.length >= 2 && !SEARCH_STOP_WORDS.has(t)) : [];

    // 2. Score and rank products
    const scoredProducts: SearchProductResult[] = [];

    for (const p of this.indexedProducts) {
      let score = 0;
      let matchType: SearchProductResult["matchType"] = "partial";

      const pName = p.name || "";
      const pNameNorm = normalizeText(pName);
      const pDescNorm = normalizeText(p.description || p.short_description || "");
      const pCatNorm = normalizeText(p.category || "");
      const pBrandNorm = normalizeText(p.brand || "");
      const pSkuNorm = normalizeText(p.sku || p.product_code || p.supplier_sku || "");
      const pId = String(p.id || "").toLowerCase().trim();

      // If no search query, give all products a base score so they appear when browsing/filtering
      if (!queryNorm) {
        score = 10;
        matchType = "partial";
      } else {
        const pWords = pNameNorm.split(/\s+/).filter(Boolean);

        // A. Exact SKU / ID Match (e.g. "297705", "3002", "882741")
        const isSkuExact = pSkuNorm === queryNorm || pId === queryNorm || (queryNorm.length >= 3 && (pSkuNorm.includes(queryNorm) || pId.includes(queryNorm)));
        if (isSkuExact) {
          score += 3000;
          matchType = "sku";
        }

        // B. Full Phrase Matches / Prefix / Substring on Normalized Name
        if (pNameNorm === queryNorm) {
          score += 2500;
          matchType = "exact";
        } else if (wordBoundaryMatch(pNameNorm, queryNorm)) {
          score += 2000;
          matchType = "exact";
        } else if (pNameNorm.startsWith(queryNorm)) {
          score += 1800;
          matchType = "exact";
        } else if (pWords.some((w: string) => w.startsWith(queryNorm))) {
          score += 1500;
          matchType = "exact";
        } else if (pNameNorm.includes(queryNorm)) {
          score += 1000;
          matchType = "partial";
        }

        // C. Expanded Terms & Synonyms Match
        for (const term of expandedTerms) {
          if (!term) continue;
          if (wordBoundaryMatch(pNameNorm, term)) {
            score += 1500;
            if (matchType !== "exact" && matchType !== "sku") matchType = "synonym";
            break;
          } else if (pWords.some((w: string) => w.startsWith(term))) {
            score += 1200;
            if (matchType !== "exact" && matchType !== "sku") matchType = "synonym";
            break;
          } else if (pNameNorm.includes(term)) {
            score += 800;
            if (matchType !== "exact" && matchType !== "sku") matchType = "synonym";
            break;
          }
        }

        // D. Token Coverage (all or high percentage of tokens matching)
        let matchedTokens = 0;
        for (const t of queryTokens) {
          if (
            wordBoundaryMatch(pNameNorm, t) ||
            pWords.some((w: string) => w.startsWith(t)) ||
            pNameNorm.includes(t)
          ) {
            matchedTokens++;
          }
        }
        if (queryTokens.length > 0 && matchedTokens === queryTokens.length) {
          score += 1000;
          if (matchType !== "exact" && matchType !== "sku") matchType = "exact";
        } else if (matchedTokens >= 3 || (queryTokens.length > 1 && matchedTokens / queryTokens.length >= 0.45)) {
          score += Math.round(500 * (matchedTokens / Math.max(1, queryTokens.length))) + 400;
        }

        // E. Category match boost
        for (const term of expandedTerms) {
          if (term && (wordBoundaryMatch(pCatNorm, term) || pCatNorm.includes(term))) {
            score += 150;
            break;
          }
        }
      }

      // Minimum score threshold to prevent noise - unrelated products NEVER pass
      const minScoreThreshold = queryNorm ? 500 : 1;

      if (score >= minScoreThreshold) {
        // Small tie-breaker bonuses for authentic quality metrics
        if (p.rating_average) score += Number(p.rating_average);
        if (p.sold_count) score += Math.min(10, Number(p.sold_count) * 0.05);
        if (p.is_featured) score += 5;
        if (p.is_best_seller) score += 5;

        // Map primary image with smart resolver
        const primaryImage = p.product_images?.find((i: any) => i.is_primary)?.image_url;
        const firstImage = p.product_images?.[0]?.image_url;
        const rawImage = p.image || primaryImage || firstImage || defaultImages[0];
        const image = getSmartProductImage(p.name, rawImage);

        const hasExplicitDiscount = p.discount_price && Number(p.regular_price) > Number(p.discount_price);
        const origP = hasExplicitDiscount
          ? parseFloat(p.regular_price)
          : p.originalPrice
          ? parseFloat(p.originalPrice)
          : undefined;

        scoredProducts.push({
          id: p.id,
          name: p.name,
          slug: p.slug || `product-${p.id}`,
          image,
          price: parseFloat(p.discount_price || p.regular_price || p.price) || 0,
          originalPrice: origP,
          rating: Number(p.rating_average) || 4.8,
          reviews: p.rating_count || 15,
          sold: p.sold_count || 40,
          category: p.category,
          category_name: p.category_name || p.category,
          category_slug: p.category_slug,
          category_id: p.category_id,
          brand: p.brand,
          sellerId: p.seller_id,
          sellerName: p.seller_name,
          supplier_id: p.supplier_id || p.seller_id,
          supplier_name: p.supplier_name || p.seller_name,
          sku: p.sku,
          isNew: Boolean(p.is_new_arrival ?? p.isNew ?? false),
          isBestSeller: Boolean(p.is_best_seller ?? p.isBestSeller ?? false),
          isFeatured: Boolean(p.is_featured ?? p.isFeatured ?? false),
          isFlashSale: Boolean(p.is_flash_sale ?? p.isFlashSale ?? false),
          inStock: p.in_stock !== false,
          score,
          matchType
        });
      }
    }

    // 3. Filter results based on options
    let filtered = scoredProducts;

    if (options.category && options.category !== "all") {
      filtered = filtered.filter((p) => productMatchesCategory(p, options.category));
    }
    if (options.brand && options.brand !== "all") {
      const b = options.brand.toLowerCase();
      filtered = filtered.filter((p) => p.brand?.toLowerCase().includes(b));
    }
    if (options.sellerId) {
      filtered = filtered.filter((p) => p.sellerId === options.sellerId || p.sellerName === options.sellerId);
    }
    if (options.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= options.minPrice!);
    }
    if (options.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= options.maxPrice!);
    }
    if (options.minRating !== undefined) {
      filtered = filtered.filter((p) => p.rating >= options.minRating!);
    }
    if (options.inStockOnly) {
      filtered = filtered.filter((p) => p.inStock !== false);
    }
    if (options.hasDiscount) {
      filtered = filtered.filter((p) => p.originalPrice !== undefined && p.originalPrice > p.price);
    }

    // 4. Sort results & apply 5-minute user session feed rotation
    const sortBy = options.sortBy || "relevance";
    if (sortBy === "relevance" && !queryStr) {
      const seed = getSessionSeed();
      filtered = seededShuffle(filtered, seed);
    } else {
      filtered.sort((a, b) => {
        if (sortBy === "relevance") return b.score - a.score;
        if (sortBy === "popularity") return (b.sold || 0) - (a.sold || 0);
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "newest") {
          if (queryNorm) {
            const scoreDiff = b.score - a.score;
            if (Math.abs(scoreDiff) > 80) return scoreDiff;
          }
          const idA = parseInt(a.id) || 0;
          const idB = parseInt(b.id) || 0;
          if (idA && idB) return idB - idA;
          return b.isNew ? 1 : -1;
        }
        return b.score - a.score;
      });
    }

    // Log analytics asynchronously
    if (queryStr) {
      searchAnalytics.logSearch(queryStr, filtered.length);
    }

    // 5. Pagination (Default 1000 items to show all catalog products)
    const page = options.page || 1;
    const limit = options.limit || 1000;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(filtered.length / limit) || 1;

    // 6. Build Facets
    const categoryFacetMap: Record<string, number> = {};
    const brandFacetMap: Record<string, number> = {};
    const sellerFacetMap: Record<string, { id: string; name: string; count: number }> = {};
    let minP = Infinity;
    let maxP = 0;

    scoredProducts.forEach((p) => {
      if (p.category) categoryFacetMap[p.category] = (categoryFacetMap[p.category] || 0) + 1;
      if (p.brand) brandFacetMap[p.brand] = (brandFacetMap[p.brand] || 0) + 1;
      if (p.sellerName) {
        if (!sellerFacetMap[p.sellerName]) {
          sellerFacetMap[p.sellerName] = { id: p.sellerId || p.sellerName, name: p.sellerName, count: 0 };
        }
        sellerFacetMap[p.sellerName].count += 1;
      }
      if (p.price < minP) minP = p.price;
      if (p.price > maxP) maxP = p.price;
    });

    return {
      products: paginatedProducts,
      total: filtered.length,
      page,
      totalPages,
      appliedSynonyms: matchedRules,
      facets: {
        categories: Object.entries(categoryFacetMap).map(([name, count]) => ({ name, count })),
        brands: Object.entries(brandFacetMap).map(([name, count]) => ({ name, count })),
        sellers: Object.values(sellerFacetMap),
        priceRange: { min: isFinite(minP) ? minP : 0, max: maxP || 1000 }
      }
    };
  }
}

export const firestoreSearchAdapter = new FirestoreSearchAdapter();
