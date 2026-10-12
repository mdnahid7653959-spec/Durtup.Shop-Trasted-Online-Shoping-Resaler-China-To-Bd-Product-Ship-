import { CATEGORIES_DATA, findCategoryOrSubcategory, MainCategoryItem } from "@/data/categoriesData";

export interface NormalizedCategoryInfo {
  slug: string;
  name: string;
  bangla: string;
  isSubcategory: boolean;
  parentSlug?: string;
  keywords: string[];
}

/**
 * Normalizes any category string (from URL query, route param, or product field)
 * safely handling URI encoding (%27, %20), case, whitespace, hyphens, underscores,
 * apostrophes (Women's -> womens), and common aliases.
 */
export function normalizeCategory(raw?: string | null): NormalizedCategoryInfo | null {
  if (!raw || typeof raw !== "string") return null;

  // Safely decode URI encoded string (e.g. "Women%27s%20Fashion" -> "Women's Fashion")
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
    if (decoded.includes("%")) {
      try { decoded = decodeURIComponent(decoded); } catch {}
    }
  } catch {}

  const cleaned = decoded.trim().replace(/^[-_/\s]+|[-_/\s]+$/g, "");
  if (!cleaned || cleaned.toLowerCase() === "all") return null;

  // 1. Check with existing findCategoryOrSubcategory
  const lookup = findCategoryOrSubcategory(cleaned);
  if (lookup.type === "category" && lookup.category) {
    return {
      slug: lookup.category.slug,
      name: lookup.category.name,
      bangla: lookup.category.bangla || "",
      isSubcategory: false,
      keywords: lookup.category.subcategories?.flatMap(s => s.keywords || []) || []
    };
  }

  if (lookup.type === "subcategory" && lookup.subcategory && lookup.category) {
    return {
      slug: lookup.subcategory.slug,
      name: lookup.subcategory.name,
      bangla: lookup.subcategory.bangla || "",
      isSubcategory: true,
      parentSlug: lookup.category.slug,
      keywords: lookup.keywords || lookup.subcategory.keywords || []
    };
  }

  // 2. Direct lookup in CATEGORIES_DATA by normalized slug or name
  // Stripping apostrophes so "Women's" -> "womens", "Men's" -> "mens"
  const cleanKey = cleaned.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // Priority alias mappings
  if (cleanKey === "women" || cleanKey === "womens" || cleanKey === "women-s" || cleanKey === "womens-fashion" || cleanKey === "women-s-fashion" || cleanKey.includes("women")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "womens-fashion")!;
    if (cat) {
      return {
        slug: cat.slug,
        name: cat.name,
        bangla: cat.bangla || "",
        isSubcategory: false,
        keywords: cat.subcategories?.flatMap(s => s.keywords || []) || []
      };
    }
  }

  if (cleanKey === "men" || cleanKey === "mens" || cleanKey === "men-s" || cleanKey === "mens-fashion" || cleanKey === "men-s-fashion" || (cleanKey.includes("men") && !cleanKey.includes("women"))) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "mens-fashion")!;
    if (cat) {
      return {
        slug: cat.slug,
        name: cat.name,
        bangla: cat.bangla || "",
        isSubcategory: false,
        keywords: cat.subcategories?.flatMap(s => s.keywords || []) || []
      };
    }
  }

  for (const cat of CATEGORIES_DATA) {
    const catSlugNorm = cat.slug.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const catNameNorm = cat.name.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (catSlugNorm === cleanKey || catNameNorm === cleanKey || cat.id.toLowerCase() === cleanKey) {
      return {
        slug: cat.slug,
        name: cat.name,
        bangla: cat.bangla || "",
        isSubcategory: false,
        keywords: cat.subcategories?.flatMap(s => s.keywords || []) || []
      };
    }

    for (const sub of cat.subcategories) {
      const subSlugNorm = sub.slug.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const subNameNorm = sub.name.toLowerCase().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      if (subSlugNorm === cleanKey || subNameNorm === cleanKey || sub.id.toLowerCase() === cleanKey) {
        return {
          slug: sub.slug,
          name: sub.name,
          bangla: sub.bangla || "",
          isSubcategory: true,
          parentSlug: cat.slug,
          keywords: sub.keywords || []
        };
      }
    }
  }

  // 3. Fallback normalized representation
  const fallbackSlug = cleanKey;
  const fallbackName = cleaned.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  return {
    slug: fallbackSlug,
    name: fallbackName,
    bangla: "",
    isSubcategory: false,
    keywords: [cleaned.toLowerCase()]
  };
}

/**
 * Checks whether a product matches a target category query string.
 * Safely inspects:
 * - product.category
 * - product.category_name
 * - product.category_slug
 * - product.category_id / product.categoryId
 * - product.categories (relation object)
 * - product name keywords
 * - inferred category from name
 */
export function productMatchesCategory(product: any, categoryQuery?: string | null): boolean {
  if (!categoryQuery || categoryQuery.toLowerCase() === "all") return true;
  if (!product) return false;

  const target = normalizeCategory(categoryQuery);
  if (!target) return true;

  const targetSlug = target.slug.toLowerCase();
  const targetParentSlug = target.parentSlug?.toLowerCase();
  const targetName = target.name.toLowerCase();
  const targetKeywords = (target.keywords || []).map(k => k.toLowerCase());

  // Extract all possible category values from product
  const pCat = String(product.category || "").toLowerCase().trim();
  const pCatName = String(product.category_name || product.categoryName || (product.categories && product.categories.name) || "").toLowerCase().trim();
  const pCatSlug = String(product.category_slug || product.categorySlug || (product.categories && product.categories.slug) || "").toLowerCase().trim();
  const pCatId = String(product.category_id || product.categoryId || "").toLowerCase().trim();
  const pName = String(product.name || product.title || "").toLowerCase();

  // Clean strings without punctuation/apostrophes for robust cross-format matching
  const cleanCat = (s: string) => s.toLowerCase().trim().replace(/['’"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const pCatClean = cleanCat(pCat);
  const pCatNameClean = cleanCat(pCatName);
  const pCatSlugClean = cleanCat(pCatSlug);
  const targetSlugClean = cleanCat(targetSlug);
  const targetParentClean = targetParentSlug ? cleanCat(targetParentSlug) : "";

  // 1. Direct Slug or Name exact matches (raw and cleaned)
  if (pCatSlug && (pCatSlug === targetSlug || pCatSlug === targetParentSlug)) return true;
  if (pCatSlugClean && (pCatSlugClean === targetSlugClean || (targetParentClean && pCatSlugClean === targetParentClean))) return true;

  if (pCat && (pCat === targetSlug || pCat === targetName || pCat.includes(targetSlug) || targetName.includes(pCat))) return true;
  if (pCatClean && (pCatClean === targetSlugClean || (targetParentClean && pCatClean === targetParentClean))) return true;

  if (pCatName && (pCatName === targetSlug || pCatName === targetName || pCatName.includes(targetSlug))) return true;
  if (pCatNameClean && (pCatNameClean === targetSlugClean || (targetParentClean && pCatNameClean === targetParentClean))) return true;

  if (pCatId && (pCatId === targetSlug || pCatId === targetParentSlug || cleanCat(pCatId) === targetSlugClean)) return true;

  // 2. Women's Fashion Comprehensive Match
  if (targetSlug === "womens-fashion" || targetSlugClean === "womens-fashion") {
    if (
      pCat.includes("women") ||
      pCatClean.includes("women") ||
      pCatSlug.includes("women") ||
      pCatName.includes("women") ||
      pName.includes("saree") ||
      pName.includes("sari") ||
      pName.includes("sharee") ||
      pName.includes("kurti") ||
      pName.includes("lehenga") ||
      pName.includes("salwar") ||
      pName.includes("kameez") ||
      pName.includes("kamiz") ||
      pName.includes("tunic") ||
      pName.includes("palazzo") ||
      pName.includes("two piece") ||
      pName.includes("three piece") ||
      pName.includes("hijab") ||
      pName.includes("abaya") ||
      pName.includes("borkha") ||
      pName.includes("burqa") ||
      pName.includes("khimar") ||
      pName.includes("niqab") ||
      pName.includes("jewelry") ||
      pName.includes("jewellery") ||
      pName.includes("ring") ||
      pName.includes("necklace") ||
      pName.includes("earring") ||
      pName.includes("bracelet") ||
      pName.includes("bangle") ||
      pName.includes("bra") ||
      pName.includes("lingerie") ||
      pName.includes("nighty") ||
      pName.includes("মহিলা") ||
      pName.includes("লেহেঙ্গা") ||
      pName.includes("বোরকা") ||
      pName.includes("হিজাব") ||
      pName.includes("শাড়ি")
    ) {
      if (!pName.includes("panjabi") && !pName.includes("boxer") && !pName.includes("lungi")) {
        return true;
      }
    }
  }

  // 3. Men's Fashion Comprehensive Match
  if (targetSlug === "mens-fashion" || targetSlugClean === "mens-fashion") {
    const isMenCat = (pCat.includes("men") || pCatClean.includes("men") || pCatSlug.includes("men")) && !pCat.includes("women") && !pCatClean.includes("women");
    const isMenKeyword = 
      pName.includes("panjabi") ||
      pName.includes("punjabi") ||
      pName.includes("pajama") ||
      pName.includes("payjama") ||
      pName.includes("kabli") ||
      pName.includes("kurta") ||
      pName.includes("polo") ||
      pName.includes("boxer") ||
      pName.includes("boxers") ||
      pName.includes("brief") ||
      pName.includes("lungi") ||
      pName.includes("fatua") ||
      pName.includes("পাঞ্জাবি") ||
      pName.includes("পায়জামা") ||
      ((pName.includes("shirt") || pName.includes("pant") || pName.includes("t-shirt") || pName.includes("tshirt") || pName.includes("trouser") || pName.includes("jogger")) && !pName.includes("women") && !pName.includes("lady") && !pName.includes("ladies") && !pName.includes("ring") && !pName.includes("jewelry"));
    
    if (isMenCat || isMenKeyword) {
      if (!pName.includes("women") && !pName.includes("lady") && !pName.includes("ladies") && !pName.includes("saree") && !pName.includes("kurti") && !pName.includes("ring")) {
        return true;
      }
    }
  }

  // 4. Special Category Identifiers (e.g. "watch", "smartwatch", "clock", "ঘড়ি")
  if (targetSlug === "watch" || targetSlug === "watches" || targetSlug.includes("watch")) {
    const isWatch = 
      pCat.includes("watch") ||
      pCatSlug === "watch" ||
      pName.includes("watch") ||
      pName.includes("smartwatch") ||
      pName.includes("smart watch") ||
      pName.includes("wrist watch") ||
      pName.includes("quartz") ||
      pName.includes("chronograph") ||
      pName.includes("olevs") ||
      pName.includes("curren") ||
      pName.includes("naviforce") ||
      pName.includes("skmei") ||
      pName.includes("poedagar") ||
      pName.includes("rolex") ||
      pName.includes("ঘড়ি") ||
      pName.includes("wall clock") ||
      pName.includes("table clock");
    if (isWatch) return true;
  }

  // 5. Gadgets & Electronics / Mobile Accessories
  if (targetSlug === "gadgets-electronics" || targetSlug === "mobile-accessories" || targetSlug === "electronics" || targetSlug === "mobile") {
    if (targetSlug === "mobile-accessories" || targetSlug === "mobile") {
      const isMobileAcc = 
        pName.match(/\b(mobile|phone|charger|cable|cover|power bank|otg|adapter|battery|type-c|casing|protector|holder|stand)\b/i) ||
        pCat.includes("mobile") ||
        pCatSlug.includes("mobile");
      if (isMobileAcc) return true;
    }

    if (targetSlug === "gadgets-electronics" || targetSlug === "electronics") {
      if (pCatSlug === "gadgets-electronics" || pCat.includes("gadget") || pCat.includes("electronic")) {
        if (!pName.includes("watch") && !pName.includes("smartwatch") && !pName.includes("ঘড়ি")) {
          return true;
        }
      }
    }
  }

  // 6. Foods & Nutrition
  if (targetSlug === "foods" || targetSlug === "food" || targetSlug.includes("food")) {
    const isFood =
      pCat.includes("food") ||
      pCatSlug === "foods" ||
      pName.includes("food") ||
      pName.includes("milk shake") ||
      pName.includes("milkshake") ||
      pName.includes("supplement") ||
      pName.includes("honey") ||
      pName.includes("ghee") ||
      pName.includes("khejur") ||
      pName.includes("dates") ||
      pName.includes("chia seed") ||
      pName.includes("oats") ||
      pName.includes("mustard oil") ||
      pName.includes("মধু") ||
      pName.includes("ঘি") ||
      pName.includes("খাদ্য");
    if (isFood && !pName.includes("tray") && !pName.includes("dispenser") && !pName.includes("holder")) return true;
  }

  // 7. Health & Beauty
  if (targetSlug === "health-beauty" || targetSlug === "beauty" || targetSlug.includes("beauty") || targetSlug.includes("health")) {
    const isBeauty =
      pCat.includes("beauty") ||
      pCat.includes("health") ||
      pCat.includes("skin") ||
      pCatSlug === "health-beauty" ||
      pName.includes("serum") ||
      pName.includes("cream") ||
      pName.includes("skin") ||
      pName.includes("beauty") ||
      pName.includes("hair") ||
      pName.includes("shampoo") ||
      pName.includes("conditioner") ||
      pName.includes("lotion") ||
      pName.includes("face wash") ||
      pName.includes("facewash") ||
      pName.includes("whitening") ||
      pName.includes("lipstick") ||
      pName.includes("makeup") ||
      pName.includes("cosmetic") ||
      pName.includes("derma") ||
      pName.includes("massager") ||
      pName.includes("massage") ||
      pName.includes("nail") ||
      pName.includes("cramp");
    if (isBeauty) return true;
  }

  // 8. Kids Zone
  if (targetSlug === "kids-zone" || targetSlug === "kids" || targetSlug.includes("kid") || targetSlug.includes("baby")) {
    const isKids =
      pCat.includes("kid") ||
      pCat.includes("baby") ||
      pCatSlug === "kids-zone" ||
      pName.includes("toy") ||
      pName.includes("baby") ||
      pName.includes("kid") ||
      pName.includes("doll") ||
      pName.includes("puzzle") ||
      pName.includes("feeder") ||
      pName.includes("diaper") ||
      pName.includes("stroller") ||
      pName.includes("walker") ||
      pName.includes("খেলনা");
    if (isKids) return true;
  }

  // 9. Home & Lifestyle
  if (targetSlug === "home-lifestyle" || targetSlug === "home" || targetSlug.includes("home") || targetSlug.includes("kitchen")) {
    const isHome =
      pCat.includes("home") ||
      pCat.includes("kitchen") ||
      pCatSlug === "home-lifestyle" ||
      pName.includes("kitchen") ||
      pName.includes("knife") ||
      pName.includes("blender") ||
      pName.includes("cooker") ||
      pName.includes("pot") ||
      pName.includes("pan") ||
      pName.includes("kettle") ||
      pName.includes("bottle") ||
      pName.includes("lamp") ||
      pName.includes("light") ||
      pName.includes("mop") ||
      pName.includes("cleaner") ||
      pName.includes("storage") ||
      pName.includes("organizer") ||
      pName.includes("rack") ||
      pName.includes("shelf") ||
      pName.includes("bed sheet") ||
      pName.includes("pillow") ||
      pName.includes("blanket") ||
      pName.includes("iron") ||
      pName.includes("steamer");
    if (isHome) return true;
  }

  // 10. Winter
  if (targetSlug === "winter") {
    const isWinter =
      pCat.includes("winter") ||
      pCatSlug === "winter" ||
      pName.includes("hoodie") ||
      pName.includes("jacket") ||
      pName.includes("sweater") ||
      pName.includes("sweatshirt") ||
      pName.includes("windbreaker") ||
      pName.includes("winter") ||
      pName.includes("হুডি");
    if (isWinter) return true;
  }

  // 11. Customize & Gift
  if (targetSlug === "customize-gift" || targetSlug.includes("gift") || targetSlug.includes("custom")) {
    const isGift =
      pCat.includes("gift") ||
      pCat.includes("custom") ||
      pCatSlug === "customize-gift" ||
      pName.includes("gift") ||
      pName.includes("custom") ||
      pName.includes("mug") ||
      pName.includes("keychain") ||
      pName.includes("showpiece") ||
      pName.includes("frame") ||
      pName.includes("wood photo") ||
      pName.includes("crest") ||
      pName.includes("print") ||
      pName.includes("box") ||
      pName.includes("উপহার");
    if (isGift) return true;
  }

  // 12. Offer & Combos
  if (targetSlug === "offer" || targetSlug.includes("offer") || targetSlug.includes("deal")) {
    const isOffer =
      pCat.includes("offer") ||
      pCatSlug === "offer" ||
      pName.includes("combo") ||
      pName.includes("offer") ||
      pName.includes("deal") ||
      pName.includes("discount") ||
      pName.includes("buy 1") ||
      pName.includes("pack of") ||
      pName.includes("অফার");
    if (isOffer) return true;
  }

  // 13. Other's
  if (targetSlug === "others" || targetSlug.includes("other")) {
    const isOther =
      pCat.includes("other") ||
      pCatSlug === "others" ||
      pName.includes("daily essential") ||
      pName.includes("novelty");
    if (isOther) return true;
  }

  // Subcategory keyword match
  if (target.isSubcategory && targetKeywords.length > 0) {
    const matchesKeyword = targetKeywords.some(kw => kw.length >= 3 && (pName.includes(kw) || pCat.includes(kw)));
    if (matchesKeyword) {
      if (targetParentSlug) {
        if (pCatSlug && pCatSlug !== targetParentSlug && pCatSlug !== targetSlug) {
          if (pCatSlug === "general" || !pCatSlug) return true;
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  // Inferred category match from product name
  try {
    const inferred = inferProductCategory(pName, pCat);
    if (inferred === targetSlug || cleanCat(inferred) === targetSlugClean || (targetParentSlug && inferred === targetParentSlug)) {
      return true;
    }
  } catch {}

  return false;
}

// Lightweight category inference fallback
function inferProductCategory(name: string, category?: string): string {
  const n = (name || "").toLowerCase().trim();
  const c = (category || "").toLowerCase().trim();

  if (
    n.includes("watch") || n.includes("smartwatch") || n.includes("quartz") ||
    n.includes("chronograph") || n.includes("olevs") || n.includes("curren") ||
    n.includes("naviforce") || n.includes("skmei") || n.includes("ঘড়ি") ||
    n.includes("wall clock") || n.includes("table clock") || c === "watch" || c === "watches"
  ) {
    return "watch";
  }
  if (n.includes("milk shake") || n.includes("honey") || n.includes("ghee") || n.includes("supplement") || c === "foods" || c.includes("food")) return "foods";
  if (n.includes("hoodie") || n.includes("winter") || n.includes("jacket") || c === "winter") return "winter";
  if (n.includes("panjabi") || n.includes("kabli") || n.includes("shirt") || n.includes("pant") || c === "mens-fashion") return "mens-fashion";
  if (n.includes("saree") || n.includes("kurti") || n.includes("hijab") || n.includes("borkha") || n.includes("jewelry") || c === "womens-fashion" || c.includes("women")) return "womens-fashion";
  if (n.includes("pot") || n.includes("pan") || n.includes("blender") || n.includes("kitchen") || n.includes("light") || c === "home-lifestyle" || c.includes("home")) return "home-lifestyle";
  if (n.includes("serum") || n.includes("cream") || n.includes("hair") || n.includes("skin") || n.includes("beauty") || c === "health-beauty" || c.includes("beauty") || c.includes("health")) return "health-beauty";
  if (n.includes("toy") || n.includes("baby") || n.includes("kid") || c === "kids-zone" || c.includes("kid")) return "kids-zone";
  if (n.includes("gift") || n.includes("custom") || n.includes("mug") || n.includes("crest") || c === "customize-gift" || c.includes("gift")) return "customize-gift";
  if (n.includes("combo") || n.includes("offer") || n.includes("deal") || c === "offer" || c.includes("offer")) return "offer";
  if (c.includes("other")) return "others";
  return "gadgets-electronics";
}


