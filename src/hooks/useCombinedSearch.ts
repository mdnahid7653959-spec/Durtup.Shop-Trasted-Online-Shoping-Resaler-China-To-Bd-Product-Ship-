import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Product } from "@/components/products/ProductCard";
import { useCJSettings, calculateCJPrice } from "./useCJSettings";
import { smartSearchService } from "@/services/search/SmartSearchService";
import { geminiSearchClient } from "@/services/search/GeminiSearchClient";
import type { GeminiSearchIntent } from "@/server/geminiSearchEngine";
import { getCachedMohasagorProducts, filterProductsByCategory } from "@/utils/mohasagorCache";

interface SearchParams {
  search?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  filter?: string;
  includeCJ?: boolean;
  page?: number;
}

interface CJProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
}

// Combined product type with source indicator
export interface CombinedProduct extends Product {
  source: "local" | "cj";
  cjProductId?: string;
  matchType?: string;
  supplier_id?: string;
  supplier_name?: string;
  matchTier?: "best" | "similar";
  matchScore?: number;
  matchedReasons?: string[];
}

interface LocalSearchResult {
  products: CombinedProduct[];
  intent?: GeminiSearchIntent;
}

async function getDirectCatalogMatches(term: string): Promise<CombinedProduct[]> {
  const termClean = (term || "").trim().toLowerCase();
  if (!termClean) return [];
  try {
    const { getCachedMohasagorProducts, getInMemoryProducts, FAST_SEED_PRODUCTS } = await import("@/utils/mohasagorCache");
    const { normalizeText } = await import("@/services/search/FuzzySearchEngine");

    let allCatalog: any[] = [];
    try {
      const res = await fetch("/visual_index.json?v=20261013_cat_v2");
      if (res.ok) allCatalog = await res.json();
    } catch {}
    if (!allCatalog || allCatalog.length === 0) {
      allCatalog = getInMemoryProducts();
    }
    if (!allCatalog || allCatalog.length === 0) {
      allCatalog = await getCachedMohasagorProducts().catch(() => FAST_SEED_PRODUCTS);
    }

    const tNorm = normalizeText(termClean);
    const tTokens = tNorm.split(/\s+/).filter(Boolean);

    const scored: { product: any; score: number }[] = [];

    for (const p of (allCatalog || [])) {
      const pName = p.name || "";
      const pNameNorm = normalizeText(pName);
      const pSku = normalizeText(p.product_code || p.sku || p.id || "");
      const pWords = pNameNorm.split(/\s+/).filter(Boolean);

      let score = 0;
      if (pSku === tNorm || (tNorm.length >= 3 && pSku.includes(tNorm))) {
        score = 5000;
      } else if (pNameNorm === tNorm) {
        score = 4500;
      } else if (pNameNorm.startsWith(tNorm)) {
        score = 4000;
      } else if (pWords.some((w: string) => w.startsWith(tNorm))) {
        score = 3500;
      } else if (pNameNorm.includes(tNorm)) {
        score = 3000;
      } else if (tTokens.length > 1 && tTokens.every((t: string) => pNameNorm.includes(t))) {
        score = 2500;
      } else if (tTokens.length > 1 && tTokens.some((t: string) => pNameNorm.includes(t))) {
        const matches = tTokens.filter((t: string) => pNameNorm.includes(t)).length;
        score = 1000 + (matches / tTokens.length) * 1000;
      }

      if (score >= 1000) {
        scored.push({ product: p, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.map(({ product: p }) => ({
      id: String(p.id),
      name: p.name,
      slug: p.slug || `product-${p.id}`,
      image: p.image || (Array.isArray(p.images) ? p.images[0] : "") || "",
      images: p.images || (p as any).product_images,
      product_images: (p as any).product_images,
      price: Number(p.price) || 0,
      originalPrice: p.originalPrice || (p as any).regular_price,
      rating: Number(p.rating) || 4.8,
      reviews: Number(p.reviews) || 15,
      sold: Number(p.sold) || 45,
      category: p.category || (p as any).category_name || "General",
      category_name: (p as any).category_name || p.category || "General",
      category_slug: (p as any).category_slug,
      freeShipping: true,
      isNew: false,
      isBestSeller: false,
      source: "local" as const,
      matchType: "Catalog Match",
      supplier_name: (p as any).supplier_name || "Durtup Marketplace"
    }));
  } catch (err) {
    console.warn("[useCombinedSearch] getDirectCatalogMatches error:", err);
    return [];
  }
}

async function searchLocalProducts(params: SearchParams): Promise<LocalSearchResult> {
  try {
    // If a search query is present, query both Gemini AI and direct catalog (same as SmartSearchBar)
    if (params.search && params.search.trim()) {
      const qTrim = params.search.trim();
      const [geminiRes, directMatches] = await Promise.all([
        geminiSearchClient.search(qTrim, {
          categoryHint: params.category,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          limit: 1000
        }).catch(() => null),
        getDirectCatalogMatches(qTrim)
      ]);

      const seenIds = new Set<string>();
      let combinedList: CombinedProduct[] = [];

      // 1. First prioritize direct text matches from the catalog (ensures what is shown in suggestions is #1 on page!)
      for (const p of directMatches) {
        const sid = String(p.id);
        if (!seenIds.has(sid)) {
          seenIds.add(sid);
          combinedList.push(p);
        }
      }

      // 2. Then append Gemini AI products (semantic matches, synonyms, category expansion)
      if (geminiRes && Array.isArray(geminiRes.products)) {
        for (const p of geminiRes.products) {
          const sid = String(p.id);
          if (!seenIds.has(sid)) {
            seenIds.add(sid);
            combinedList.push({
              id: sid,
              name: p.name,
              slug: p.slug,
              image: p.image,
              images: p.images || (p as any).product_images,
              product_images: (p as any).product_images,
              price: p.price,
              originalPrice: p.originalPrice || (p as any).regular_price,
              rating: p.rating || 4.8,
              reviews: p.reviews || 15,
              sold: p.sold || 45,
              category: p.category,
              category_name: (p as any).category_name || p.category,
              category_slug: (p as any).category_slug,
              freeShipping: true,
              isNew: false,
              isBestSeller: false,
              source: "local" as const,
              matchType: p.matchReasons?.join(", ") || "Gemini AI Search",
              supplier_name: (p as any).supplier_name || "Durtup Marketplace"
            });
          }
        }
      }

      if (combinedList.length > 0) {
        let mapped = combinedList;

        // Filter by supplier if specified
        if (params.supplier && params.supplier !== "all") {
          const supTarget = params.supplier.toLowerCase();
          mapped = mapped.filter((p: any) => {
            const sid = String(p.supplier_id || p.seller_id || "").toLowerCase();
            const sname = String(p.supplier_name || p.seller_name || "").toLowerCase();
            const pid = String(p.id || "").toLowerCase();
            if (supTarget.includes("ecom")) {
              return sid.includes("ecom") || sname.includes("ecom") || pid.startsWith("ecom-");
            }
            if (supTarget.includes("mohasagor")) {
              return sid.includes("mohasagor") || sname.includes("mohasagor") || (!pid.startsWith("ecom-") && !sid.includes("ecom"));
            }
            return sid.includes(supTarget) || sname.includes(supTarget);
          });
        }

        // Post-sort if non-relevance sort selected
        if (params.sort === "price-low" || params.sort === "price_asc") {
          mapped.sort((a, b) => a.price - b.price);
        } else if (params.sort === "price-high" || params.sort === "price_desc") {
          mapped.sort((a, b) => b.price - a.price);
        } else if (params.sort === "rating") {
          mapped.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (params.sort === "trending" || params.sort === "popular" || params.sort === "popularity") {
          mapped.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        }

        return {
          products: mapped,
          intent: geminiRes?.intent
        };
      }
    }

    const searchOptions = {
      category: params.category,
      brand: params.brand,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      sortBy: (params.sort === "relevance"
        ? "relevance"
        : params.sort === "price-low" || params.sort === "price_asc"
        ? "price_asc"
        : params.sort === "price-high" || params.sort === "price_desc"
        ? "price_desc"
        : params.sort === "rating"
        ? "rating"
        : params.sort === "newest"
        ? "newest"
        : params.sort === "trending" || params.sort === "popular" || params.sort === "popularity"
        ? "popularity"
        : params.search ? "relevance" : "newest") as any,
      page: params.page || 1,
      limit: 1000
    };

    const searchRes = await smartSearchService.search(params.search || "", searchOptions);

    let mapped: CombinedProduct[] = searchRes.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      images: (p as any).images || (p as any).product_images,
      product_images: (p as any).product_images,
      price: p.price,
      originalPrice: p.originalPrice,
      rating: p.rating,
      reviews: p.reviews,
      sold: p.sold,
      category: p.category,
      category_name: (p as any).category_name || p.category,
      category_slug: (p as any).category_slug,
      freeShipping: true,
      isNew: p.isNew || false,
      isBestSeller: p.isBestSeller || false,
      source: "local" as const,
      matchType: p.matchType,
      supplier_id: (p as any).supplier_id,
      supplier_name: (p as any).supplier_name || (p as any).seller_name
    }));

    // Fallback: If catalog browsing (WITHOUT a search query) returned empty, load master supplier catalogs
    if (mapped.length === 0 && !params.search) {
      const { getCachedMohasagorProducts, filterProductsByCategory, interleaveCatalogs, FAST_SEED_PRODUCTS, fetchSlimCatalog, getInMemoryProducts } = await import("@/utils/mohasagorCache");
      const { EcomsellerEngine } = await import("@/services/suppliers/ecomsellerEngine");
      const { productMatchesCategory } = await import("@/utils/categoryHelper");
      
      let allMohasagor = await getCachedMohasagorProducts().catch(() => []);
      if (!allMohasagor || allMohasagor.length < 100) {
        allMohasagor = await fetchSlimCatalog().catch(() => []);
      }
      const inMem = getInMemoryProducts();
      const allEcom = await EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []);
      const combinedAll = interleaveCatalogs(allMohasagor.length > 0 ? allMohasagor : inMem, allEcom);
      const allPool = [...combinedAll, ...inMem, ...FAST_SEED_PRODUCTS];

      let fallbackList = allPool;
      if (params.category && params.category !== "all") {
        fallbackList = allPool.filter((p: any) => productMatchesCategory(p, params.category));
      }

      if (fallbackList && fallbackList.length > 0) {
        mapped = fallbackList.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          price: p.price,
          originalPrice: p.originalPrice,
          rating: p.rating || 4.8,
          reviews: p.reviews || 15,
          sold: p.sold || 45,
          category: p.category,
          category_name: (p as any).category_name || p.category,
          category_slug: (p as any).category_slug,
          freeShipping: true,
          isNew: p.isNew || false,
          isBestSeller: p.isBestSeller || false,
          source: "local" as const,
          matchType: "fallback",
          supplier_id: (p as any).supplier_id,
          supplier_name: (p as any).supplier_name || (p as any).seller_name
        }));
      }
    }

    // Fallback: If search WITH query returned empty, query directly from visual_index / catalog
    if (mapped.length === 0 && params.search) {
      const { getCachedMohasagorProducts, getInMemoryProducts, FAST_SEED_PRODUCTS } = await import("@/utils/mohasagorCache");
      const { normalizeText } = await import("@/services/search/FuzzySearchEngine");
      let allCatalog: any[] = [];
      try {
        const res = await fetch("/visual_index.json?v=20261013_cat_v2");
        if (res.ok) allCatalog = await res.json();
      } catch {}
      if (!allCatalog || allCatalog.length === 0) {
        allCatalog = getInMemoryProducts();
      }
      if (!allCatalog || allCatalog.length === 0) {
        allCatalog = await getCachedMohasagorProducts().catch(() => FAST_SEED_PRODUCTS);
      }
      const termNorm = normalizeText(params.search);
      const termTokens = termNorm.split(/\s+/).filter(Boolean);
      const fallbackMatches = (allCatalog || []).filter((p: any) => {
        const pNorm = normalizeText(p.name || "");
        const pSku = normalizeText(p.product_code || p.sku || p.id || "");
        const pWords = pNorm.split(/\s+/).filter(Boolean);
        if (pSku.includes(termNorm) || pNorm.includes(termNorm)) return true;
        if (pWords.some((w: string) => w.startsWith(termNorm))) return true;
        if (termTokens.length > 0 && termTokens.every((t: string) => pNorm.includes(t))) return true;
        if (termTokens.length > 1 && termTokens.some((t: string) => pNorm.includes(t))) return true;
        return false;
      });
      if (fallbackMatches && fallbackMatches.length > 0) {
        mapped = fallbackMatches.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          slug: p.slug || `product-${p.id}`,
          image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || "",
          price: Number(p.price || 0),
          originalPrice: p.originalPrice || p.regular_price,
          rating: Number(p.rating || 4.8),
          reviews: Number(p.reviews || 15),
          sold: Number(p.sold || 45),
          category: p.category || p.category_name || "General",
          category_name: p.category_name || p.category || "General",
          category_slug: p.category_slug,
          freeShipping: true,
          isNew: false,
          isBestSeller: false,
          source: "local" as const,
          matchType: "fallback",
          supplier_id: p.supplier_id,
          supplier_name: p.supplier_name || "Durtup Marketplace"
        }));
      }
    }

    // Filter by Supplier if explicitly specified
    if (params.supplier && params.supplier !== "all") {
      const supTarget = params.supplier.toLowerCase();
      mapped = mapped.filter((p: any) => {
        const sid = String(p.supplier_id || p.seller_id || "").toLowerCase();
        const sname = String(p.supplier_name || p.seller_name || "").toLowerCase();
        const pid = String(p.id || "").toLowerCase();
        if (supTarget.includes("ecom")) {
          return sid.includes("ecom") || sname.includes("ecom") || pid.startsWith("ecom-");
        }
        if (supTarget.includes("mohasagor")) {
          return sid.includes("mohasagor") || sname.includes("mohasagor") || (!pid.startsWith("ecom-") && !sid.includes("ecom"));
        }
        return sid.includes(supTarget) || sname.includes(supTarget);
      });
    }

    // Post-filter by Special Filter Type
    if (params.filter && params.filter !== "all") {
      if (params.filter === "flash-sale") {
        // 1. Filter products that are explicitly flash sale, have discounts, or are top sellers
        let flashMatches = mapped.filter(
          (p) =>
            Boolean((p as any).isFlashSale) ||
            Boolean(p.originalPrice && p.originalPrice > p.price) ||
            Boolean(p.isBestSeller)
        );

        // 2. If fewer than 30 products match, populate with top items so the deals page is full and exciting
        if (flashMatches.length < 30) {
          const existingIds = new Set(flashMatches.map((p) => p.id));
          const additions = mapped.filter((p) => !existingIds.has(p.id));
          flashMatches = [...flashMatches, ...additions];
        }

        // 3. Guarantee that every product on Flash Sale has a realistic originalPrice so discount badge & strikethrough price display
        mapped = flashMatches.map((p, idx) => {
          const discountPct = 0.20 + ((idx % 6) * 0.05); // 20%, 25%, 30%, 35%, 40%, 45%
          const calculatedOrig = Math.round((p.price / (1 - discountPct)) / 10) * 10;
          const orig = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : calculatedOrig;
          return {
            ...p,
            isFlashSale: true,
            originalPrice: orig,
            freeShipping: true,
          };
        });
      } else if (params.filter === "featured" || params.filter === "on-sale") {
        let featMatches = mapped.filter((p) => (p.originalPrice && p.originalPrice > p.price) || p.isBestSeller || (p as any).isFeatured);
        if (featMatches.length < 12) {
          featMatches = mapped.slice(0, 36);
        }
        mapped = featMatches;
      } else if (params.filter === "new") {
        let newMatches = mapped.filter((p) => p.isNew);
        if (newMatches.length < 12) {
          newMatches = mapped.slice(0, 36).map((p) => ({ ...p, isNew: true }));
        }
        mapped = newMatches;
      } else if (params.filter === "free-shipping") {
        mapped = mapped.filter((p) => p.freeShipping !== false);
      } else if (params.filter === "in-stock") {
        mapped = mapped.filter((p) => (p as any).stock !== 0);
      }
    }

    // Price Bounds
    if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
      mapped = mapped.filter((p) => p.price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
      mapped = mapped.filter((p) => p.price <= params.maxPrice!);
    }

    // Post-sort guarantee
    if (params.sort === "price-low" || params.sort === "price_asc") {
      mapped.sort((a, b) => a.price - b.price);
    } else if (params.sort === "price-high" || params.sort === "price_desc") {
      mapped.sort((a, b) => b.price - a.price);
    } else if (params.sort === "rating") {
      mapped.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (params.sort === "trending" || params.sort === "popular" || params.sort === "popularity") {
      mapped.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    } else if (params.sort === "newest") {
      mapped.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    }

    return {
      products: mapped,
      intent: undefined
    };
  } catch (err) {
    console.error("[useCombinedSearch] Search execution error:", err);
    return { products: [], intent: undefined };
  }
}

async function searchCJProducts(
  params: SearchParams,
  cjSettings: any
): Promise<CombinedProduct[]> {
  if (!cjSettings?.is_enabled || !cjSettings?.show_in_search || !params.search) {
    return [];
  }

  try {
    const mockCjResponse = { products: [] };
    const products = mockCjResponse.products || [];

    return products.map((p: CJProduct): CombinedProduct => ({
      id: `cj-${p.id}`,
      name: p.name,
      slug: `cj/${p.id}`,
      image: p.image || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
      price: calculateCJPrice(p.price, cjSettings),
      originalPrice: p.originalPrice ? calculateCJPrice(p.originalPrice, cjSettings) : undefined,
      rating: 4.5,
      reviews: 100,
      sold: 500,
      freeShipping: true,
      isNew: false,
      isBestSeller: false,
      source: "cj",
      cjProductId: p.id,
    }));
  } catch (error) {
    console.error("CJ search error:", error);
    return [];
  }
}

export function useCombinedSearch(params: SearchParams) {
  const { data: cjSettings } = useCJSettings();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["combined-search"] });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mohasagor_products_updated", handleUpdate);
      window.addEventListener("ecomseller_products_updated", handleUpdate);
      window.addEventListener("admin_products_updated", handleUpdate);
      return () => {
        window.removeEventListener("mohasagor_products_updated", handleUpdate);
        window.removeEventListener("ecomseller_products_updated", handleUpdate);
        window.removeEventListener("admin_products_updated", handleUpdate);
      };
    }
  }, [queryClient]);

  return useQuery({
    queryKey: ["combined-search", params, cjSettings?.is_enabled],
    queryFn: async () => {
      try {
        const includeCJ = params.includeCJ !== false && cjSettings?.is_enabled && cjSettings?.show_in_search;
        
        const [localRes, cjProducts] = await Promise.all([
          searchLocalProducts(params),
          includeCJ && params.search ? searchCJProducts(params, cjSettings) : Promise.resolve([]),
        ]);

        return {
          local: localRes?.products || [],
          cj: cjProducts || [],
          combined: [...(localRes?.products || []), ...(cjProducts || [])],
          intent: localRes?.intent,
        };
      } catch (err) {
        console.error("Error in useCombinedSearch queryFn:", err);
        return { local: [], cj: [], combined: [], intent: undefined };
      }
    },
    staleTime: 15 * 1000,
    enabled: true,
  });
}
