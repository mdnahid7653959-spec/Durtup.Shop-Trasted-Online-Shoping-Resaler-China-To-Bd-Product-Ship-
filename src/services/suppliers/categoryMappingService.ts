import { supabase } from "@/lib/firebaseAdapter";
import { CategoryMappingRule } from "./supplierTypes";

export interface DurtupMasterCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const DURTUP_MASTER_CATEGORIES: DurtupMasterCategory[] = [
  { id: "gadgets-electronics", name: "Gadgets & Electronics", slug: "gadgets-electronics", description: "Mobiles, Laptops, Earbuds, Accessories" },
  { id: "mens-fashion", name: "Men's Fashion", slug: "mens-fashion", description: "Panjabi, T-Shirts, Shirts, Pants, Trousers" },
  { id: "womens-fashion", name: "Women's Fashion", slug: "womens-fashion", description: "Sarees, Kurtis, Abaya, Hijab, Jewelry" },
  { id: "home-lifestyle", name: "Home & Lifestyle", slug: "home-lifestyle", description: "Kitchenware, Home Decor, Appliances, Bedding" },
  { id: "health-beauty", name: "Health & Beauty", slug: "health-beauty", description: "Skincare, Haircare, Wellness, Perfumes" },
  { id: "watch", name: "Watch", slug: "watch", description: "Smartwatches, Quartz, Men & Women Watches, Clocks" },
  { id: "kids-zone", name: "Kids Zone", slug: "kids-zone", description: "Toys, Baby products & Clothing, Games" },
  { id: "foods", name: "Foods", slug: "foods", description: "Pure Honey, Nuts, Ghee, Supplements, Organic" },
  { id: "winter", name: "Winter", slug: "winter", description: "Winter Hoodies, Jackets, Sweaters" },
];

export const DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS: Record<string, { durtupId: string; durtupName: string; durtupSlug: string }> = {
  // Jewellery & Watches
  "jewellery": { durtupId: "watch", durtupName: "Watch", durtupSlug: "watch" },
  "jewelry": { durtupId: "watch", durtupName: "Watch", durtupSlug: "watch" },

  // Electronics & Gadgets
  "mobile-accessories": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "earbuds": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "neckband": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "speaker-microphone": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "camera": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "rechargeable-fan": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "rechargeable-light": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "outdoor-gadgets": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "safety-and-security": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },

  // Home & Kitchen / Lifestyle
  "kitchen-gadget": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "home-essentials": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "home-kitchen-accessories": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "cleaning-tool": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "bathroom-accessories": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "tools-hardware": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "stationery": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "islamic-products": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "car-accessories": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },
  "fishing-bit": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },

  // Fashion & Clothing
  "fashion-accessories": { durtupId: "mens-fashion", durtupName: "Men's Fashion", durtupSlug: "mens-fashion" },
  "men-s-fashion": { durtupId: "mens-fashion", durtupName: "Men's Fashion", durtupSlug: "mens-fashion" },
  "women-s-fashion": { durtupId: "womens-fashion", durtupName: "Women's Fashion", durtupSlug: "womens-fashion" },
  "travel-accessories": { durtupId: "home-lifestyle", durtupName: "Home & Lifestyle", durtupSlug: "home-lifestyle" },

  // Health & Beauty
  "skin-care": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "hair-care": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "beauty-gadgets": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "trimmer": { durtupId: "gadgets-electronics", durtupName: "Gadgets & Electronics", durtupSlug: "gadgets-electronics" },
  "health-care": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "health-care-devices": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "brush-toothpaste": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "foot-care": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "food-supplement": { durtupId: "foods", durtupName: "Foods", durtupSlug: "foods" },
  "medical-accessories": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },
  "fitness-equipment": { durtupId: "health-beauty", durtupName: "Health & Beauty", durtupSlug: "health-beauty" },

  // Toys & Baby Care
  "toys-games": { durtupId: "kids-zone", durtupName: "Kids Zone", durtupSlug: "kids-zone" },
  "baby-product": { durtupId: "kids-zone", durtupName: "Kids Zone", durtupSlug: "kids-zone" }
};

const STORAGE_KEY = "durtup_category_mappings_cache_v1";

export class CategoryMappingService {
  private static DB_TABLE = "supplier_category_mappings";

  /**
   * Suggest a Durtup category based on raw category name or slug
   */
  public static suggestDurtupCategory(rawSlugOrName: string): DurtupMasterCategory {
    const clean = (rawSlugOrName || "").toLowerCase().trim().replace(/\s+/g, '-');
    
    // Exact mapping check
    if (DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[clean]) {
      const match = DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[clean];
      return { id: match.durtupId, name: match.durtupName, slug: match.durtupSlug };
    }

    // Heuristics with canonical category slugs
    if (clean.includes("watch") || clean.includes("clock") || clean.includes("quartz") || clean.includes("smartwatch")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "watch") || DURTUP_MASTER_CATEGORIES[5];
    }
    if (clean.includes("food") || clean.includes("honey") || clean.includes("supplement") || clean.includes("shake") || clean.includes("ghee") || clean.includes("organic")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "foods") || DURTUP_MASTER_CATEGORIES[7];
    }
    if (clean.includes("beauty") || clean.includes("skin") || clean.includes("hair") || clean.includes("cramp") || clean.includes("massage") || clean.includes("perfume") || clean.includes("care") || clean.includes("health")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "health-beauty") || DURTUP_MASTER_CATEGORIES[4];
    }
    if (clean.includes("toy") || clean.includes("baby") || clean.includes("kid") || clean.includes("game")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "kids-zone") || DURTUP_MASTER_CATEGORIES[6];
    }
    if (clean.includes("winter") || clean.includes("hoodie")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "winter") || DURTUP_MASTER_CATEGORIES[8];
    }
    if (clean.includes("women") || clean.includes("saree") || clean.includes("kurti") || clean.includes("borkha") || clean.includes("hijab") || clean.includes("jewel") || clean.includes("ring")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "womens-fashion") || DURTUP_MASTER_CATEGORIES[2];
    }
    if (clean.includes("men") || clean.includes("panjabi") || clean.includes("shirt") || clean.includes("pant") || clean.includes("trouser") || clean.includes("boxer") || clean.includes("polo")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "mens-fashion") || DURTUP_MASTER_CATEGORIES[1];
    }
    if (clean.includes("kitchen") || clean.includes("home") || clean.includes("clean") || clean.includes("tool") || clean.includes("bath") || clean.includes("bed") || clean.includes("decor")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "home-lifestyle") || DURTUP_MASTER_CATEGORIES[3];
    }
    if (clean.includes("gadget") || clean.includes("mobile") || clean.includes("phone") || clean.includes("ear") || clean.includes("speaker") || clean.includes("audio") || clean.includes("tech") || clean.includes("electr")) {
      return DURTUP_MASTER_CATEGORIES.find(c => c.slug === "gadgets-electronics") || DURTUP_MASTER_CATEGORIES[0];
    }

    return DURTUP_MASTER_CATEGORIES[0];
  }

  /**
   * Get all active category mappings for a supplier
   */
  public static async getSupplierMappings(supplierId = "ecomseller_bd"): Promise<CategoryMappingRule[]> {
    try {
      const { data } = await supabase
        .from(this.DB_TABLE)
        .select("*")
        .eq("supplierId", supplierId);

      if (data && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(`${STORAGE_KEY}_${supplierId}`, JSON.stringify(data));
        }
        return data as CategoryMappingRule[];
      }
    } catch (e) {
      console.warn("Category mappings DB fetch fallback:", e);
    }

    // Check localStorage cache
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(`${STORAGE_KEY}_${supplierId}`);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {}
      }
    }

    return [];
  }

  /**
   * Save or update multiple category mappings
   */
  public static async saveMappings(mappings: CategoryMappingRule[], supplierId = "ecomseller_bd"): Promise<boolean> {
    try {
      for (const m of mappings) {
        const payload = {
          ...m,
          supplierId,
          updatedAt: new Date().toISOString()
        };
        await supabase.from(this.DB_TABLE).upsert(payload, { onConflict: "supplierCategorySlug" });
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`${STORAGE_KEY}_${supplierId}`, JSON.stringify(mappings));
        window.dispatchEvent(new CustomEvent("supplier_category_mappings_updated", { detail: { supplierId, mappings } }));
      }
      return true;
    } catch (err) {
      console.error("Failed to save category mappings:", err);
      return false;
    }
  }

  /**
   * Resolve Durtup Category for a supplier category slug or name
   */
  public static resolveCategory(
    supplierCatSlug: string, 
    supplierCatName: string, 
    customMappings: CategoryMappingRule[] = []
  ): DurtupMasterCategory {
    const cleanSlug = (supplierCatSlug || "").toLowerCase().trim();
    
    // 1. Check custom saved mappings
    const custom = customMappings.find(m => 
      m.supplierCategorySlug?.toLowerCase() === cleanSlug ||
      m.supplierCategoryName?.toLowerCase() === (supplierCatName || "").toLowerCase().trim()
    );
    if (custom && custom.durtupCategorySlug) {
      const found = DURTUP_MASTER_CATEGORIES.find(c => c.slug === custom.durtupCategorySlug);
      if (found) return found;
      return {
        id: custom.durtupCategoryId || `cat-${custom.durtupCategorySlug}`,
        name: custom.durtupCategoryName,
        slug: custom.durtupCategorySlug
      };
    }

    // 2. Check defaults
    if (DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[cleanSlug]) {
      const def = DEFAULT_ECOMSELLER_CATEGORY_MAPPINGS[cleanSlug];
      return { id: def.durtupId, name: def.durtupName, slug: def.durtupSlug };
    }

    // 3. Heuristic suggestion fallback
    return this.suggestDurtupCategory(supplierCatSlug || supplierCatName);
  }

  /**
   * Resolve Durtup Category taking product name into consideration to avoid misclassification
   */
  public static resolveProductCategory(
    productName: string,
    supplierCatSlug: string,
    supplierCatName: string,
    customMappings: CategoryMappingRule[] = []
  ): DurtupMasterCategory {
    const pName = (productName || "").toLowerCase();

    // 1. WATCH takes precedence over supplier category (e.g. BINBOND watch miscategorized as Men's Fashion)
    if (
      pName.includes("watch") ||
      pName.includes("wristband") ||
      pName.includes("smartwatch") ||
      pName.includes("quartz") ||
      pName.includes("chronograph") ||
      pName.includes("clock") ||
      pName.includes("binbond") ||
      pName.includes("curren") ||
      pName.includes("naviforce") ||
      pName.includes("skmei") ||
      pName.includes("poedagar") ||
      pName.includes("olevs") ||
      pName.includes("rolex")
    ) {
      const found = DURTUP_MASTER_CATEGORIES.find(c => c.slug === "watch");
      if (found) return found;
    }

    // 2. FOODS & SUPPLEMENTS take precedence
    if (
      pName.includes("milk shake") ||
      pName.includes("milkshake") ||
      pName.includes("supplement") ||
      pName.includes("weight gain") ||
      pName.includes("chia seed") ||
      pName.includes("honey nuts") ||
      /\bhoney\b/i.test(pName) ||
      pName.includes("ghee")
    ) {
      const found = DURTUP_MASTER_CATEGORIES.find(c => c.slug === "foods");
      if (found) return found;
    }

    // 3. HEALTH & BEAUTY (cramp relief, fungus treatment, face wash, serum)
    if (
      pName.includes("fungus") ||
      pName.includes("cramp") ||
      pName.includes("menstrual") ||
      pName.includes("heating pad") ||
      pName.includes("massager") ||
      pName.includes("massage") ||
      pName.includes("pain relief") ||
      pName.includes("serum") ||
      pName.includes("whitening") ||
      pName.includes("derma") ||
      pName.includes("perfume")
    ) {
      const found = DURTUP_MASTER_CATEGORIES.find(c => c.slug === "health-beauty");
      if (found) return found;
    }

    // Fall back to category-based resolution
    return this.resolveCategory(supplierCatSlug, supplierCatName, customMappings);
  }
}

