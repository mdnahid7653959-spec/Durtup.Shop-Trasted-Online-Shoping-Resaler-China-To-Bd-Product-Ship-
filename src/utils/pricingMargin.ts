import { supabase } from "@/lib/firebaseAdapter";

export interface PricingMarginConfig {
  enabled: boolean;
  type: 'percentage' | 'fixed'; // 'percentage' (e.g. +20%) or 'fixed' (e.g. +৳160)
  marginValue: number; // e.g. 15 for 15% or 160 for ৳160
  regularPriceMarkupPercent: number; // e.g. 35% above selling price for crossed-out price
  roundTo99: boolean;
}

export const DEFAULT_PRICING_MARGIN_CONFIG: PricingMarginConfig = {
  enabled: false, // Margin disabled by default (direct API prices)
  type: 'fixed', // Fixed amount ৳
  marginValue: 0, // ৳0 profit margin added (exact API price)
  regularPriceMarkupPercent: 0,
  roundTo99: false,
};

const STORAGE_KEY = "darzo_pricing_margin_config_v4";

export function getPricingMarginConfig(): PricingMarginConfig {
  if (typeof window === "undefined") return DEFAULT_PRICING_MARGIN_CONFIG;
  try {
    // Clear legacy cache keys with old 160 margin if any
    localStorage.removeItem("darzo_pricing_margin_config_v3");
    localStorage.removeItem("darzo_pricing_margin_config_v2");
    localStorage.removeItem("darzo_pricing_margin_config_v1");

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        enabled: Boolean(parsed.enabled),
        type: parsed.type === 'percentage' ? 'percentage' : 'fixed',
        marginValue: Number(parsed.marginValue) !== undefined && !isNaN(Number(parsed.marginValue)) ? Number(parsed.marginValue) : 0,
        regularPriceMarkupPercent: Number(parsed.regularPriceMarkupPercent) || 0,
        roundTo99: Boolean(parsed.roundTo99),
      };
    }
  } catch (e) {
    console.warn("Failed to read pricing margin config from localStorage:", e);
  }
  return DEFAULT_PRICING_MARGIN_CONFIG;
}

export function calculateProductPrice(
  baseSupplierPrice: number,
  config?: PricingMarginConfig,
  rawRegularPrice?: number
): { price: number; originalPrice: number; regularPrice: number; discountPrice: number | null } {
  const cfg = config || getPricingMarginConfig();
  const base = Math.max(0, Number(baseSupplierPrice) || 0);

  if (base === 0) {
    return { price: 0, originalPrice: 0, regularPrice: 0, discountPrice: null };
  }

  let finalPrice = base;

  // Apply margin if enabled and value > 0
  if (cfg.enabled && cfg.marginValue > 0) {
    if (cfg.type === 'percentage') {
      finalPrice = Math.round(base * (1 + cfg.marginValue / 100));
    } else {
      finalPrice = Math.round(base + cfg.marginValue);
    }
  }

  if (cfg.roundTo99 && finalPrice > 100) {
    finalPrice = Math.floor(finalPrice / 10) * 10 + 9;
  }

  // Calculate strikethrough regular price
  let regPrice = 0;
  if (rawRegularPrice && rawRegularPrice > finalPrice) {
    regPrice = Math.round(rawRegularPrice);
  } else if (cfg.regularPriceMarkupPercent > 0) {
    regPrice = Math.round(finalPrice * (1 + cfg.regularPriceMarkupPercent / 100));
  } else {
    regPrice = finalPrice;
  }

  return {
    price: finalPrice,
    originalPrice: regPrice > finalPrice ? regPrice : finalPrice,
    regularPrice: regPrice > finalPrice ? regPrice : finalPrice,
    discountPrice: regPrice > finalPrice ? finalPrice : null,
  };
}

export async function savePricingMarginConfig(newConfig: PricingMarginConfig): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      // Invalidate existing caches so prices recalculate everywhere
      localStorage.removeItem("mohasagor_products_master_cache_v11");
      localStorage.removeItem("mohasagor_products_master_cache_v12");
      localStorage.removeItem("mohasagor_products_master_cache_v13");
      localStorage.removeItem("mohasagor_cached_home_products_v5");
      localStorage.removeItem("mohasagor_cached_home_products_v11");
      localStorage.removeItem("mohasagor_cached_home_products_v12");
      window.dispatchEvent(new CustomEvent("pricing_margin_updated", { detail: newConfig }));
    }

    // Persist to database site_settings
    await supabase.from("site_settings").upsert({
      key: "product_pricing_margin",
      value: newConfig,
      updated_at: new Date().toISOString()
    }, { onConflict: "key" });

    return true;
  } catch (err) {
    console.error("Failed to save pricing margin config:", err);
    return false;
  }
}

export async function syncPricingMarginFromDb(): Promise<PricingMarginConfig> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "product_pricing_margin")
      .maybeSingle();

    if (data && data.value) {
      const cfg: PricingMarginConfig = {
        enabled: Boolean(data.value.enabled),
        type: data.value.type === 'percentage' ? 'percentage' : 'fixed',
        marginValue: Number(data.value.marginValue) || 0,
        regularPriceMarkupPercent: Number(data.value.regularPriceMarkupPercent) || 0,
        roundTo99: Boolean(data.value.roundTo99),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      }
      return cfg;
    }
  } catch (err) {
    console.warn("Failed to sync pricing margin from DB:", err);
  }
  return getPricingMarginConfig();
}
