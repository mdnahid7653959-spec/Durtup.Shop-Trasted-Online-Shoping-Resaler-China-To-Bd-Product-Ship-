import type { Product } from "@/components/products/ProductCard";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";

export interface RecommendationSettings {
  categoryAffinityWeight: number; // e.g. 0.35
  browsingDecayWeight: number;    // e.g. 0.25
  purchaseAffinityWeight: number;    // e.g. 0.25
  popularityWeight: number;          // e.g. 0.15
  bundleDiscountPercent: number;     // e.g. 5% off bundle
  maxRecommendations: number;        // e.g. 12
  enableColdStartFallback: boolean;
}

export interface UserInteraction {
  productId: string;
  category: string;
  action: "view" | "cart" | "purchase";
  timestamp: number;
}

export interface CustomerAffinityProfile {
  topCategories: Array<{ category: string; score: number }>;
  viewedProductIds: Set<string>;
  purchasedCategories: Set<string>;
  hasHistory: boolean;
}

const SETTINGS_KEY = "durtup_recommendation_settings";
const INTERACTIONS_KEY = "durtup_user_product_interactions";

const DEFAULT_SETTINGS: RecommendationSettings = {
  categoryAffinityWeight: 0.35,
  browsingDecayWeight: 0.25,
  purchaseAffinityWeight: 0.25,
  popularityWeight: 0.15,
  bundleDiscountPercent: 5,
  maxRecommendations: 12,
  enableColdStartFallback: true,
};

export function getRecommendationSettings(): RecommendationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveRecommendationSettings(settings: Partial<RecommendationSettings>): RecommendationSettings {
  const current = getRecommendationSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

/**
 * Record a customer product interaction (view, cart add, or purchase)
 */
export function recordProductInteraction(
  product: { id?: string | number; category?: string; category_name?: string },
  action: "view" | "cart" | "purchase"
) {
  if (typeof window === "undefined" || !product?.id) return;
  const prodId = String(product.id);
  const category = (product.category || product.category_name || "General").trim();

  try {
    const raw = localStorage.getItem(INTERACTIONS_KEY);
    const interactions: UserInteraction[] = raw ? JSON.parse(raw) : [];

    // Keep rolling log of last 50 interactions
    interactions.unshift({
      productId: prodId,
      category,
      action,
      timestamp: Date.now(),
    });

    // Prune entries older than 30 days or beyond 50 items
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = interactions
      .filter((i) => i.timestamp > thirtyDaysAgo)
      .slice(0, 50);

    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Compute the customer's real-time category & product affinity profile
 */
export function getCustomerAffinityProfile(): CustomerAffinityProfile {
  if (typeof window === "undefined") {
    return {
      topCategories: [],
      viewedProductIds: new Set(),
      purchasedCategories: new Set(),
      hasHistory: false,
    };
  }

  try {
    const raw = localStorage.getItem(INTERACTIONS_KEY);
    const interactions: UserInteraction[] = raw ? JSON.parse(raw) : [];
    if (!interactions.length) {
      return {
        topCategories: [],
        viewedProductIds: new Set(),
        purchasedCategories: new Set(),
        hasHistory: false,
      };
    }

    const categoryScores: Record<string, number> = {};
    const viewedProductIds = new Set<string>();
    const purchasedCategories = new Set<string>();
    const now = Date.now();

    for (const item of interactions) {
      viewedProductIds.add(item.productId);
      if (item.action === "purchase") {
        purchasedCategories.add(item.category.toLowerCase());
      }

      // Time-decay factor: 1.0 for today, decaying to 0.2 after 14 days
      const daysOld = Math.max(0, (now - item.timestamp) / (1000 * 60 * 60 * 24));
      const decay = Math.max(0.2, 1 - daysOld * 0.05);

      // Action multiplier: purchase (5x), cart (3x), view (1x)
      const actionWeight = item.action === "purchase" ? 5 : item.action === "cart" ? 3 : 1;
      const catKey = item.category.toLowerCase();
      categoryScores[catKey] = (categoryScores[catKey] || 0) + actionWeight * decay;
    }

    const topCategories = Object.entries(categoryScores)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);

    return {
      topCategories,
      viewedProductIds,
      purchasedCategories,
      hasHistory: topCategories.length > 0,
    };
  } catch {
    return {
      topCategories: [],
      viewedProductIds: new Set(),
      purchasedCategories: new Set(),
      hasHistory: false,
    };
  }
}

/**
 * Compute personalized product recommendations using multi-factor scoring
 */
export function getPersonalizedRecommendations(
  catalog: Product[] = [],
  limit?: number
): Product[] {
  const settings = getRecommendationSettings();
  const maxItems = limit || settings.maxRecommendations;
  const pool = catalog.length > 0 ? catalog : FAST_SEED_PRODUCTS;

  const profile = getCustomerAffinityProfile();

  // Cold Start: Return top-selling / high-rated popular products
  if (!profile.hasHistory || !settings.enableColdStartFallback) {
    return pool
      .slice()
      .sort((a, b) => (Number(b.sold || 0) + Number(b.rating || 0) * 10) - (Number(a.sold || 0) + Number(a.rating || 0) * 10))
      .slice(0, maxItems);
  }

  // Multi-factor Scoring Algorithm
  const topCatMap = new Map(profile.topCategories.map((c, idx) => [c.category, 1 / (idx + 1)]));

  const scored = pool.map((p) => {
    let score = 0;
    const cat = (p.category || p.category_name || "").toLowerCase();

    // 1. Category Affinity (0 to 1 scale)
    const catAffinity = topCatMap.get(cat) || 0;
    score += catAffinity * settings.categoryAffinityWeight * 100;

    // 2. Previously Purchased Category Synergy boost
    if (profile.purchasedCategories.has(cat)) {
      score += settings.purchaseAffinityWeight * 50;
    }

    // 3. Previously Viewed Product: gentle reminder boost, or soft discount if already seen
    if (profile.viewedProductIds.has(p.id)) {
      score += settings.browsingDecayWeight * 40;
    }

    // 4. Rating & Popularity baseline
    const ratingScore = (Number(p.rating) || 4.5) / 5;
    const soldBonus = Math.min(20, (Number(p.sold) || 0) / 10);
    score += (ratingScore * 50 + soldBonus) * settings.popularityWeight;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxItems).map((item) => item.product);
}

/**
 * Smart Frequently Bought Together Bundle algorithm
 * Pairs current product with 1 or 2 complementary items from synergistic categories
 */
export function getFrequentlyBoughtTogether(
  currentProduct: Product,
  catalog: Product[] = []
): {
  bundleProducts: Product[];
  totalOriginalPrice: number;
  totalBundlePrice: number;
  bundleSavings: number;
  discountPercent: number;
} {
  const pool = catalog.length > 0 ? catalog : FAST_SEED_PRODUCTS;
  const settings = getRecommendationSettings();
  const currentCat = (currentProduct.category || currentProduct.category_name || "").toLowerCase();
  const currentName = (currentProduct.name || "").toLowerCase();

  // Find complementary candidate items excluding current product
  const otherProducts = pool.filter((p) => p.id !== currentProduct.id && p.name !== currentProduct.name);

  // Synergy matching matrix
  const isElectronics = currentCat.includes("gadget") || currentCat.includes("elect") || currentName.includes("earbuds") || currentName.includes("watch") || currentName.includes("phone");
  const isFashion = currentCat.includes("fashion") || currentCat.includes("saree") || currentCat.includes("jewelry") || currentName.includes("saree") || currentName.includes("watch");
  const isKitchen = currentCat.includes("kitchen") || currentCat.includes("home") || currentName.includes("pot") || currentName.includes("cooker");

  const complementary: Product[] = [];

  for (const p of otherProducts) {
    if (complementary.length >= 2) break;
    const pCat = (p.category || p.category_name || "").toLowerCase();
    const pName = (p.name || "").toLowerCase();

    if (isElectronics) {
      if (pName.includes("charger") || pName.includes("power") || pName.includes("cable") || pCat.includes("gadget")) {
        complementary.push(p);
      }
    } else if (isFashion) {
      if (pName.includes("necklace") || pName.includes("ring") || pName.includes("watch") || pCat.includes("jewelry")) {
        complementary.push(p);
      }
    } else if (isKitchen) {
      if (pName.includes("chopper") || pName.includes("sponge") || pName.includes("clean") || pCat.includes("home")) {
        complementary.push(p);
      }
    }
  }

  // Fallback to top other items if specific synergy not met
  if (complementary.length < 2) {
    for (const p of otherProducts) {
      if (complementary.length >= 2) break;
      if (!complementary.some((c) => c.id === p.id)) {
        complementary.push(p);
      }
    }
  }

  const normalizeProduct = (p: any): Product => {
    if (!p) return p;
    const priceVal = p.price ?? p.discount_price ?? p.sale_price ?? p.regular_price ?? 0;
    const priceNum = typeof priceVal === "number" ? priceVal : parseFloat(String(priceVal).replace(/[^0-9.]/g, "")) || 0;
    const origVal = p.originalPrice ?? p.regular_price ?? p.price ?? priceNum;
    const origNum = typeof origVal === "number" ? origVal : parseFloat(String(origVal).replace(/[^0-9.]/g, "")) || priceNum;

    return {
      ...p,
      price: priceNum,
      originalPrice: origNum > priceNum ? origNum : priceNum,
      regular_price: origNum > priceNum ? origNum : priceNum,
    };
  };

  const bundleProducts = [normalizeProduct(currentProduct), ...complementary.slice(0, 2).map(normalizeProduct)];

  const totalOriginalPrice = bundleProducts.reduce((sum, p) => sum + (Number(p.originalPrice || p.price) || 0), 0);
  const basePriceSum = bundleProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const discountPercent = settings.bundleDiscountPercent;
  const bundleDiscountMultiplier = (100 - discountPercent) / 100;
  const totalBundlePrice = Math.round(basePriceSum * bundleDiscountMultiplier);
  const bundleSavings = Math.max(0, totalOriginalPrice - totalBundlePrice);

  return {
    bundleProducts,
    totalOriginalPrice,
    totalBundlePrice,
    bundleSavings,
    discountPercent,
  };
}
