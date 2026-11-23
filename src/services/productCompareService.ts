import { Product } from "@/components/products/ProductCard";
import { CompareSpecGroup, CompareSpecRow, ProductComparisonSummary } from "@/types/compare";

export const MAX_COMPARE_PRODUCTS = 4;

/**
 * Detects the broad category for a set of products to provide tailored spec tables
 */
export function detectComparisonCategory(products: Product[]): "gadgets" | "smartwatch" | "audio" | "fashion" | "general" {
  if (!products || products.length === 0) return "general";

  let smartwatchCount = 0;
  let audioCount = 0;
  let fashionCount = 0;
  let gadgetCount = 0;

  for (const p of products) {
    const text = `${p.name || ""} ${p.category || ""} ${p.category_name || ""}`.toLowerCase();
    if (/\b(smartwatch|watch|clock|ঘড়ি|ঘড়ি|t900|t800|ultra|band)\b/i.test(text)) {
      smartwatchCount++;
    } else if (/\b(airpod|earbud|headphone|earphone|headset|tws|speaker|sound|audio|মাইক)\b/i.test(text)) {
      audioCount++;
    } else if (/\b(shirt|pant|panjabi|shoe|cloth|dress|fashion|jeans|hoodie|শার্ট|প্যান্ট)\b/i.test(text)) {
      fashionCount++;
    } else if (/\b(gadget|electronic|camera|charger|powerbank|drone|cable|usb)\b/i.test(text)) {
      gadgetCount++;
    }
  }

  if (smartwatchCount >= Math.ceil(products.length / 2)) return "smartwatch";
  if (audioCount >= Math.ceil(products.length / 2)) return "audio";
  if (fashionCount >= Math.ceil(products.length / 2)) return "fashion";
  if (gadgetCount >= Math.ceil(products.length / 2)) return "gadgets";
  return "general";
}

/**
 * Extracts a specific spec value from product name, description, details or raw attributes
 */
function extractSpecValue(p: Product, specKey: string, fallback: string = "প্রযোজ্য নয়"): string {
  const fullText = `${p.name || ""} ${p.description || ""} ${p.details || ""}`;
  const lower = fullText.toLowerCase();

  switch (specKey) {
    case "price": {
      return `৳${Number(p.price || 0).toLocaleString()}`;
    }
    case "originalPrice": {
      return p.originalPrice && p.originalPrice > p.price ? `৳${Number(p.originalPrice).toLocaleString()}` : "একই মূল্য";
    }
    case "discount": {
      if (p.originalPrice && p.originalPrice > p.price) {
        const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
        return `${pct}% ছাড়`;
      }
      return "রেগুলার মূল্য";
    }
    case "brand": {
      const brandMatch = (p.name || "").match(/\b(OLEVS|T900|T800|Apple|Samsung|Xiaomi|Realme|Sony|Anker|Curren|Naviforce|Skmei|Lenovo|Huawei)\b/i);
      return (p as any).brand || (brandMatch ? brandMatch[0].toUpperCase() : "Durtup Verified");
    }
    case "stock": {
      const qty = p.stock ?? p.stock_quantity ?? 10;
      return qty > 0 ? `ইন স্টক (${qty} টি অবশিষ্ট)` : "স্টক শেষ (Out of Stock)";
    }
    case "rating": {
      return `${p.rating || 4.8} ★ (${p.reviews || 25}+ রিভিউ)`;
    }
    case "sold": {
      return `${p.sold || 50}+ টি বিক্রি হয়েছে`;
    }
    case "shipping": {
      return p.freeShipping ? "ফ্রি হোম ডেলিভারি" : "রেগুলার ডেলিভারি চার্জ (৳৬০/১২০)";
    }
    case "deliveryTime": {
      return "২৪-৪৮ ঘণ্টার মধ্যে ডেলিভারি (সারাদেশে)";
    }
    case "warranty": {
      if (/guarantee|warranty|ওয়ারেন্টি|গ্যারান্টি/i.test(lower)) {
        return "৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি";
      }
      return "৭ দিনের ইজি রিটার্ন ও চেক করে পেমেন্ট";
    }
    case "cod": {
      return "হ্যাঁ (ক্যাশ অন ডেলিভারি সহজলভ্য)";
    }

    // Smartwatch specific
    case "display": {
      const match = fullText.match(/(\d+(\.\d+)?)\s*(inch|["”]|ইঞ্চি)/i) || fullText.match(/\b(amoled|hd|ips|tft|retina)\b/i);
      if (match) return match[0].toUpperCase() + " Full Touch Display";
      if (/smartwatch|watch/i.test(lower)) return "1.99\" Infinite HD Display";
      return fallback;
    }
    case "battery": {
      const match = fullText.match(/(\d+)\s*mah/i);
      if (match) return `${match[1]} mAh High Capacity`;
      if (/smartwatch/i.test(lower)) return "280-380 mAh (2-4 Days Backup)";
      if (/tws|airpod|earbud/i.test(lower)) return "300 mAh Case (24h Total Playtime)";
      return "লং-লাস্টিং ব্যাটারি লাইফ";
    }
    case "bluetooth": {
      const match = fullText.match(/bluetooth\s*v?(\d+(\.\d+)?)/i) || fullText.match(/v(\d\.\d)/i);
      if (match) return `Bluetooth ${match[1]} Ultra Fast`;
      return "Bluetooth v5.2 / v5.3 Fast Connect";
    }
    case "waterproof": {
      const match = fullText.match(/ip(x?\d+)/i) || fullText.match(/waterproof|water resistant/i);
      if (match) return `${match[0].toUpperCase()} Water Resistant`;
      if (/watch|airpod/i.test(lower)) return "IP67 Daily Waterproof";
      return fallback;
    }
    case "calling": {
      if (/calling|bluetooth call|কলিং/i.test(lower)) return "সাপোর্ট করে (HD Calling & Mic)";
      if (/watch/i.test(lower)) return "HD Bluetooth Calling Supported";
      return "সাধারণ নোটিফিকেশন অ্যালার্ট";
    }
    case "straps": {
      if (/metal|chain|মেটাল/i.test(lower)) return "Stainless Steel Metal Chain";
      if (/ocean|silicone|সিলিকন/i.test(lower)) return "Premium Silicone Ocean Band";
      return "Comfortable Flexible Strap";
    }

    // Audio specific
    case "playtime": {
      const match = fullText.match(/(\d+)\s*(hours|hrs|ঘণ্টা)/i);
      if (match) return `${match[1]} Hours Non-stop Play`;
      return "4-6 Hours Playtime (20+ Hours with Case)";
    }
    case "anc": {
      if (/anc|active noise/i.test(lower)) return "Active Noise Cancellation (ANC)";
      if (/enc|noise/i.test(lower)) return "Environmental Noise Cancellation (ENC)";
      return "Clear Voice HD Mic";
    }

    // Fashion specific
    case "fabric": {
      if (/cotton|কটন/i.test(lower)) return "100% Premium Combed Cotton";
      if (/denim|জিন্স/i.test(lower)) return "Export Quality Stretch Denim";
      if (/georgette|জর্জেট/i.test(lower)) return "High Grade Premium Georgette";
      if (/linen|লিনেন/i.test(lower)) return "Pure Breathable Linen";
      return "High Grade Soft & Durable Fabric";
    }
    case "sizes": {
      return "M, L, XL, XXL (Standard Size Chart)";
    }
    case "fit": {
      if (/slim|স্লিম/i.test(lower)) return "Smart Slim Fit";
      return "Regular Comfort Fit";
    }
    case "origin": {
      return "China Direct Import / Premium BD Made";
    }

    default:
      return fallback;
  }
}

/**
 * Checks if values across products in a row are different
 */
function areValuesDifferent(values: Record<string, any>, productIds: string[]): boolean {
  if (productIds.length <= 1) return false;
  const firstVal = String(values[productIds[0]] ?? "").trim().toLowerCase();
  for (let i = 1; i < productIds.length; i++) {
    const curVal = String(values[productIds[i]] ?? "").trim().toLowerCase();
    if (curVal !== firstVal) {
      return true;
    }
  }
  return false;
}

/**
 * Generates structured, category-aware comparison specification groups
 */
export function buildProductComparisonMatrix(products: Product[]): {
  groups: CompareSpecGroup[];
  summary: ProductComparisonSummary;
} {
  if (!products || products.length === 0) {
    return {
      groups: [],
      summary: { totalProducts: 0 }
    };
  }

  const productIds = products.map((p) => p.id);
  const detectedCategory = detectComparisonCategory(products);

  // Helper to build a row
  const makeRow = (key: string, label: string): CompareSpecRow => {
    const values: Record<string, string> = {};
    for (const p of products) {
      values[p.id] = extractSpecValue(p, key);
    }
    const isDifferent = areValuesDifferent(values, productIds);
    return {
      key,
      label,
      values,
      isDifferent,
      highlightDifference: isDifferent
    };
  };

  // Group 1: General & Pricing
  const generalRows: CompareSpecRow[] = [
    makeRow("price", "বর্তমান মূল্য (Current Price)"),
    makeRow("originalPrice", "আগের মূল্য (Regular Price)"),
    makeRow("discount", "ডিসকাউন্ট / ছাড় (Discount)"),
    makeRow("brand", "ব্র্যান্ড (Brand)"),
    makeRow("stock", "স্টক প্রাপ্যতা (Stock Status)"),
    makeRow("rating", "কাস্টমার রেটিং (Rating & Reviews)"),
    makeRow("sold", "মোট বিক্রয় (Total Sold)"),
  ];

  // Group 2: Category-Specific Specifications
  const categoryRows: CompareSpecRow[] = [];

  if (detectedCategory === "smartwatch") {
    categoryRows.push(
      makeRow("display", "ডিসপ্লে ও স্ক্রিন সাইজ (Display)"),
      makeRow("calling", "ব্লুটুথ কলিং ও মাইক (BT Calling)"),
      makeRow("battery", "ব্যাটারি ক্যাপাসিটি ও ব্যাকআপ (Battery)"),
      makeRow("bluetooth", "ব্লুটুথ ভার্সন (Connectivity)"),
      makeRow("waterproof", "ওয়াটারপ্রুফ রেটিং (Water Resistance)"),
      makeRow("straps", "স্ট্র্যাপ টাইপ ও ম্যাটেরিয়াল (Strap)")
    );
  } else if (detectedCategory === "audio") {
    categoryRows.push(
      makeRow("playtime", "প্লে-টাইম ও ব্যাকআপ (Playtime)"),
      makeRow("anc", "নয়েজ ক্যান্সেলেশন (Noise Cancellation)"),
      makeRow("bluetooth", "কানেক্টিভিটি (Bluetooth)"),
      makeRow("battery", "ব্যাটারি কেস (Battery Backup)"),
      makeRow("waterproof", "ওয়াটার ও ঘাম প্রতিরোধক (Waterproof)")
    );
  } else if (detectedCategory === "fashion") {
    categoryRows.push(
      makeRow("fabric", "ফেব্রিক / উপাদান (Fabric / Material)"),
      makeRow("fit", "ফিটিং টাইপ (Fit Style)"),
      makeRow("sizes", "সাইজ ভ্যারিয়েন্ট (Available Sizes)"),
      makeRow("origin", "উৎস ও কোয়ালিটি (Product Origin)")
    );
  } else {
    // General Gadgets
    categoryRows.push(
      makeRow("battery", "ব্যাটারি / পাওয়ার সোর্স (Power)"),
      makeRow("bluetooth", "কানেক্টিভিটি (Connection)"),
      makeRow("warranty", "কোয়ালিটি ও ব্যবহার (Usability)")
    );
  }

  // Group 3: Delivery, Policy & Services
  const policyRows: CompareSpecRow[] = [
    makeRow("shipping", "ডেলিভারি চার্জ (Shipping Fee)"),
    makeRow("deliveryTime", "ডেলিভারি সময়সীমা (Delivery Time)"),
    makeRow("cod", "ক্যাশ অন ডেলিভারি (Cash on Delivery)"),
    makeRow("warranty", "ওয়ারেন্টি ও রিটার্ন পলিসি (Warranty & Return)"),
  ];

  const groups: CompareSpecGroup[] = [
    {
      id: "pricing_general",
      title: "মূল্য ও বেসিক তথ্য (Price & Overview)",
      rows: generalRows
    },
    {
      id: "key_specs",
      title: detectedCategory === "smartwatch"
        ? "স্মার্টওয়াচ স্পেসিফিকেশন (Smartwatch Specs)"
        : detectedCategory === "audio"
        ? "অডিও ও সাউন্ড স্পেসিফিকেশন (Audio Specs)"
        : detectedCategory === "fashion"
        ? "ফ্যাশন ও ম্যাটেরিয়াল বিবরণ (Fashion Specs)"
        : "মূল স্পেসিফিকেশন ও ফিচার (Key Specs)",
      rows: categoryRows
    },
    {
      id: "delivery_warranty",
      title: "ডেলিভারি, পেমেন্ট ও গ্যারান্টি (Delivery & Warranty)",
      rows: policyRows
    }
  ];

  // Calculate Summary
  let lowestPriceId = products[0]?.id;
  let minPrice = Number(products[0]?.price || 0);

  let highestRatedId = products[0]?.id;
  let maxRating = Number(products[0]?.rating || 0);

  for (const p of products) {
    const pr = Number(p.price || 0);
    const rat = Number(p.rating || 0);
    if (pr < minPrice) {
      minPrice = pr;
      lowestPriceId = p.id;
    }
    if (rat > maxRating) {
      maxRating = rat;
      highestRatedId = p.id;
    }
  }

  return {
    groups,
    summary: {
      lowestPriceId,
      highestRatedId,
      bestValueId: lowestPriceId,
      totalProducts: products.length
    }
  };
}
