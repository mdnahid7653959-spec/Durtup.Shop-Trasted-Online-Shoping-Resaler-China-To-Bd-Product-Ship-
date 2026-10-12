import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInMemoryProducts, getCachedMohasagorProducts, FAST_SEED_PRODUCTS } from "@/utils/mohasagorCache";
import { CATEGORIES_DATA } from "@/data/categoriesData";
import { normalizeText } from "@/services/search/FuzzySearchEngine";

export interface SuggestProduct {
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  discount_price: number | null;
  stock_quantity: number;
  rating_average: number;
  rating_count: number;
  image: string | null;
}

export interface SuggestCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SuggestBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface SuggestResult {
  products: SuggestProduct[];
  categories: SuggestCategory[];
  brands: SuggestBrand[];
  sellers: { id: string; name: string }[];
  trending: string[];
  recent: string[];
}

/** Debounce any value */
export function useDebounced<T>(value: T, delay = 40): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

let cachedSuggestCatalog: any[] | null = null;

async function getSuggestCatalog(): Promise<any[]> {
  if (cachedSuggestCatalog && cachedSuggestCatalog.length > 0) {
    return cachedSuggestCatalog;
  }
  try {
    const res = await fetch("/visual_index.json?v=20261013_cat_v2");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedSuggestCatalog = data;
        return data;
      }
    }
  } catch {}

  const inMem = getInMemoryProducts();
  if (inMem && inMem.length > 0) {
    cachedSuggestCatalog = inMem;
    return inMem;
  }

  const cached = await getCachedMohasagorProducts().catch(() => FAST_SEED_PRODUCTS);
  cachedSuggestCatalog = cached;
  return cached;
}

async function fetchSuggestions(q: string): Promise<SuggestResult> {
  const term = q.trim();
  if (!term) {
    return {
      products: [],
      categories: [],
      brands: [],
      sellers: [],
      trending: ["T-Shirt", "Wireless earbuds", "Smart watch", "Mobile phone", "Trimmer", "Sneakers"],
      recent: getRecentSearches()
    };
  }

  // 1. Get complete real catalog from pre-indexed visual catalog
  const allCatalog = await getSuggestCatalog();

  const termNorm = normalizeText(term);
  const termWords = termNorm.split(/\s+/).filter(Boolean);

  const scored: { p: any; score: number }[] = [];

  for (const p of allCatalog) {
    const pName = p.name || "";
    const pNameNorm = normalizeText(pName);
    const pSku = normalizeText(p.product_code || p.sku || p.id || "");
    const pWords = pNameNorm.split(/\s+/).filter(Boolean);

    let score = 0;
    if (pSku === termNorm || (termNorm.length >= 3 && pSku.includes(termNorm))) {
      score = 5000;
    } else if (pNameNorm === termNorm) {
      score = 4000;
    } else if (pNameNorm.startsWith(termNorm)) {
      score = 3000;
    } else if (pWords.some(w => w.startsWith(termNorm))) {
      score = 2000;
    } else if (pNameNorm.includes(termNorm)) {
      score = 1000;
    } else if (termWords.length > 1 && termWords.every(tw => pNameNorm.includes(tw))) {
      score = 800;
    } else if (termWords.length > 1 && termWords.some(tw => pNameNorm.includes(tw))) {
      const matchCount = termWords.filter(tw => pNameNorm.includes(tw)).length;
      if (matchCount / termWords.length >= 0.5) {
        score = 400 + matchCount * 100;
      }
    }

    if (score > 0) {
      scored.push({ p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.p.name.length - b.p.name.length);

  const products: SuggestProduct[] = scored.slice(0, 8).map(({ p }) => ({
    id: String(p.id),
    name: p.name,
    slug: p.slug || `product-${p.id}`,
    regular_price: Number(p.originalPrice || p.regular_price || p.price || 0),
    discount_price: p.originalPrice && p.originalPrice > p.price ? Number(p.price) : (p.discount_price ? Number(p.discount_price) : null),
    stock_quantity: p.stock_quantity ?? (p.stock !== undefined ? p.stock : 10),
    rating_average: Number(p.rating_average || p.rating || 4.8),
    rating_count: Number(p.rating_count || p.reviews || 15),
    image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || (Array.isArray(p.product_images) ? p.product_images[0]?.image_url : null) || null,
  }));

  const categories: SuggestCategory[] = CATEGORIES_DATA
    .filter(c => {
      const cNorm = normalizeText(c.name);
      return cNorm.includes(termNorm) || termNorm.includes(cNorm);
    })
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.id,
    }));

  return {
    products,
    categories,
    brands: [],
    sellers: [],
    trending: ["Hoodie", "Wireless earbuds", "Smart watch", "Hot Pot", "Battery Charger"],
    recent: getRecentSearches(),
  };
}

export function useSearchSuggestions(rawQuery: string) {
  const query = useDebounced(rawQuery, 40);
  return useQuery({
    queryKey: ["smart-search-suggest", query],
    queryFn: () => fetchSuggestions(query),
    enabled: true,
    staleTime: 30_000,
  });
}

/* Recent searches (localStorage) */
const RECENT_KEY = "durtup_recent_searches";
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : ["Wireless earbuds", "Smart watch", "Mobile phone"];
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string) {
  const t = term.trim();
  if (!t) return;
  try {
    const list = getRecentSearches().filter((x) => x.toLowerCase() !== t.toLowerCase());
    list.unshift(t);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

export function removeRecentSearch(term: string) {
  try {
    const t = term.trim().toLowerCase();
    const list = getRecentSearches().filter((x) => x.toLowerCase() !== t);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
