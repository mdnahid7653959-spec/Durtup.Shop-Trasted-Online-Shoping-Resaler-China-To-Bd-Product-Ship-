// Smart Product Image Matcher & Resolver Utility
// Ensures every product displays a real, relevant image matching its name & category with ultra-fast Edge WebP CDN caching.

export const CATEGORY_IMAGES = {
  jewelry: [
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop", // Crystal / Diamond Ring
    "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop", // Emerald / Gemstone Ring
    "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=600&h=600&fit=crop", // Gold / Silver Ring
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop", // Luxury Jewelry
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop", // Necklace & Pendant
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop", // Earrings
  ],
  powerbank: [
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", // Power Bank
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop", // Fast Charger
    "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&h=600&fit=crop", // Type-C Cable
  ],
  speaker: [
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop", // Bluetooth Speaker
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop", // Portable Speaker
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=600&fit=crop", // Sound System
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop", // Multifunction Chopper / Kitchen
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=600&fit=crop", // Blender / Grinder
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&h=600&fit=crop", // Cooker / Kitchen Tool
  ],
  fan: [
    "https://mohasagor.com.bd/public/storage/images/products/DiVI7xC20llbGtU3bSB5gCkLE0JhJB4sht75WsBn.png", // Rechargeable Silent Desktop Fan
    "https://mohasagor.com.bd/public/storage/images/products/NZW44TuG5js4dslxyabIASlulq5a5K1FZu9yviZE.webp", // Humidifier Double Spray Fan
    "https://mohasagor.com.bd/public/storage/images/products/al3tSpwjGscb5je1SlxtmTPSIHqnC0uoofkSMqM6.webp", // Portable Spray Mist Fan
    "https://mohasagor.com.bd/public/storage/images/products/SiKrl3qzKJCDfsqGSZxOXl5HAl3VKvPU8kdZWeHF.png", // Strong Wind Compact Fan
  ],
  bags: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", // Backpack
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop", // Women's Handbag
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop", // Fashion Handbag
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop", // Leather Bag
  ],
  watch: [
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&h=600&fit=crop", // Stainless Steel Watch
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop", // Men's Luxury Watch
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", // Classic Watch
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&h=600&fit=crop", // Black Chronograph Watch
  ],
  smartwatch: [
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop",
  ],
  shoes: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop",
  ],
  panjabi: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
  ],
  pajama: [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop",
  ],
  shirt: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&h=600&fit=crop", // Men's T-Shirt Ash/Grey
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=600&fit=crop", // Polo T-Shirt
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&h=600&fit=crop", // Casual Shirt
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop",
  ],
  women_fashion: [
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
  ],
  saree: [
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=600&fit=crop",
  ],
  kurti: [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop",
  ],
  borka: [
    "https://mohasagor.com.bd/public/storage/images/products/LlOkqTA7TAs6jL7NIw6V1VV3Neyc5SGINPoxE3XR.png",
    "https://mohasagor.com.bd/public/storage/images/products/soMg5idM194wOP68KoH5NcFZ1XunJtjYh75F1Kyl.png",
    "https://mohasagor.com.bd/public/storage/images/products/1UJlzioi5Rkfze2fKMel5xJ3jYi72hbNAY4hSiF2.png",
  ],
  trimmer: [
    "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop",
  ],
  earbuds: [
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
  ],
  keyboard: [
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&h=600&fit=crop",
  ],
  mouse: [
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop", // Sleek wireless optical mouse
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop", // Wireless ergonomic mouse
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=600&fit=crop", // Wireless optical mouse minimalist
    "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=600&fit=crop", // Modern ergonomic mouse
  ],
  home: [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop", // Salon styling & hair straightener
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop", // Hair & beauty care
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=600&fit=crop", // Hair styling
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop", // Hair brush & comb
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop", // Cosmetics
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop", // Hair care
  ],
  pure_foods: [
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop", // Honey
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=600&fit=crop", // Organic Food
  ],
  kids: [
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=600&fit=crop", // Kids Toys
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=600&fit=crop", // Baby Toys
  ],
  tools: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&h=600&fit=crop",
  ],
  jersey: [
    "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1580087433295-ab2600c1030e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop",
  ],
  cctv: [
    "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
    "https://img.drz.lazcdn.com/g/kf/Sec2b1daa39534496942b05d978d99040g.jpg_720x720q80.jpg",
    "https://img.drz.lazcdn.com/static/bd/p/4154d27d204df90add314e4f05b378ac.jpg_720x720q80.jpg",
    "https://img.drz.lazcdn.com/static/bd/p/022277b51ad6d2516a503a08ca032d5c.jpg_720x720q80.jpg",
    "https://img.drz.lazcdn.com/static/bd/p/56b97b289e2d1eca33cab53fd40582db.png_720x720q80.png",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop",
  ],
  sunglasses: [
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&h=600&fit=crop",
  ],
};

// Known Unsplash generic fallback patterns that were previously assigned in random places
const GENERIC_GADGET_FALLBACKS = [
  "photo-1590658268037",
  "photo-1546868871",
  "photo-1609091839311",
  "photo-1618384887929",
  "photo-1585386959984",
  "photo-1560472355",
  "photo-1523275335684",
  "photo-1507582020474",
  "photo-1596755094514",
];

/**
 * Converts heavy raw supplier images to ultra-fast, edge-cached WebP CDN images via Cloudflare/wsrv.nl
 * Supabase storage images and Unsplash images are already on fast CDNs and are delivered directly.
 */
export function optimizeImageUrl(
  url?: string,
  width: number = 400,
  quality: number = 78,
  format: "webp" | "avif" = "webp"
): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.includes(".svg")) {
    return trimmed;
  }

  // Cloudinary images already have CDN acceleration
  if (trimmed.includes("res.cloudinary.com")) {
    return trimmed;
  }

  // If already a wsrv.nl proxy URL, extract raw origin to re-apply target width/format cleanly
  if (trimmed.includes("wsrv.nl/?url=") || trimmed.includes("wsrv.nl?url=")) {
    const rawDirect = getDirectImageUrl(trimmed);
    if (rawDirect && rawDirect !== trimmed) {
      trimmed = rawDirect;
      if (trimmed.includes("res.cloudinary.com")) {
        return trimmed;
      }
      if (trimmed.includes("mohasagor.com.bd") || trimmed.includes("ecomsellerbd.com") || trimmed.includes("supabase.co/storage")) {
        return optimizeImageUrl(trimmed, width, quality, format);
      }
    }
  }

  // Unsplash images - use native high-speed dynamic CDN parameters
  if (trimmed.includes("images.unsplash.com")) {
    const clean = trimmed.split("?")[0];
    return `${clean}?w=${width}&q=${quality}&auto=format&fit=crop`;
  }

  let full = trimmed;
  if (full.startsWith("//")) {
    full = `https:${full}`;
  }

  // Convert raw supplier images to ultra-lightweight WebP via Cloudflare Edge Cache (wsrv.nl)
  if (full.startsWith("http://") || full.startsWith("https://")) {
    const cleanSource = full.split("#")[0];
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanSource)}&w=${width}&output=${format}&q=${quality}&we=0&fit=cover`;
  }

  return trimmed;
}

/**
 * Returns raw unproxied URL (direct supplier origin link)
 */
export function getDirectImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (trimmed.includes("wsrv.nl/?url=") || trimmed.includes("wsrv.nl?url=")) {
    try {
      const parsed = new URL(trimmed);
      const raw = parsed.searchParams.get("url");
      if (raw) return raw;
    } catch {}

    try {
      const match = trimmed.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {}
  }
  return trimmed;
}

/**
 * Generates responsive srcset string for any image URL
 */
export function getResponsiveImageSrcSet(
  url?: string,
  widths: number[] = [240, 360, 480, 640],
  quality: number = 75,
  format: "webp" | "avif" = "webp"
): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (
    !trimmed || 
    trimmed.startsWith("data:") || 
    trimmed.startsWith("blob:") || 
    trimmed.includes(".svg") ||
    trimmed.includes("supabase.co")
  ) {
    return "";
  }
  if (trimmed.includes("images.unsplash.com")) {
    const clean = trimmed.split("?")[0];
    return widths
      .map((w) => `${clean}?w=${w}&q=${quality}&auto=format&fit=crop ${w}w`)
      .join(", ");
  }
  return widths
    .map((w) => `${optimizeImageUrl(trimmed, w, quality, format)} ${w}w`)
    .join(", ");
}

export const PRODUCT_CARD_SIZES = "(max-width: 640px) 48vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 240px";
export const MINI_CARD_SIZES = "(max-width: 640px) 140px, (max-width: 1024px) 160px, 185px";
export const PRODUCT_DETAIL_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px";

export function detectCategoryKey(name: string = "", category: string = ""): keyof typeof CATEGORY_IMAGES | null {
  // Normalize mathematical alphanumeric symbols, accented glyphs & unicode fonts to plain ASCII
  const normName = (name || "").normalize("NFKD");
  const normCat = (category || "").normalize("NFKD");
  const nameText = normName.toLowerCase();
  const catText = normCat.toLowerCase();
  // Strip noisy multi-word categories like "mouse & cameras" so they don't corrupt product matching
  const safeCat = catText.replace(/mouse\s*(&|and)?\s*cameras?/gi, "gadgets");
  const combined = `${nameText} ${safeCat}`;

  // 1. Sunglasses, Eyeglasses, Spectacles, Clear glass frames (Must check product name first!)
  if (nameText.match(/sunglass|eyeglass|spectacle|clear.*glass|frame.*glass|reading.*glass|glasses|sunglasses|eyewear|goggles|goggle|shades|chasma|চশমা|সানগ্লাস/i)) {
    return "sunglasses";
  }

  // 2. Jewelry, rings, necklace, crystal ring, gemstones, zircon, ornaments
  // Exclude ring light, key ring, phone ring, etc.
  if (!nameText.match(/ring.*light|key.*ring|phone.*ring|holder.*ring|curtain.*ring|rubber.*ring/i) &&
      combined.match(/ring|jewelry|jewel|necklace|chain|pendant|bracelet|bangle|earring|zircon|crystal.*ring|gemstone|diamond|emerald|eternity.*ring|stone.*ring|gold|silver|ornament|আংটি|জুয়েলারি|নেকলেস|চেইন|দুল|গহনা|চুড়ি|ব্রেসলেট/i)) {
    return "jewelry";
  }

  // 2.5 CCTV, Security Cameras, IP Cameras, Bulb Cameras, Spy Cameras (Must check before earbuds/keyboard!)
  if (combined.match(/cctv|ip\s*camera|security\s*camera|bulb\s*camera|night\s*vision.*camera|v380|a9\s*wi-?fi|ptz|surveillance|nanny\s*cam|spy\s*cam|spy.*camera|ডোম\s*ক্যামেরা|সিসিটিভি|সিকিউরিটি\s*ক্যামেরা/i) ||
      (nameText.match(/camera|cam\b|ক্যামেরা/i) && !nameText.match(/stand|holder|tripod|mount|strap|bag|case/i))) {
    return "cctv";
  }

  // 3. Earbuds, headphones, airpods, headsets, wireless audio (must exclude cameras, speakers & mic)
  if (!nameText.match(/cctv|camera|cam\b|ক্যামেরা|speaker|স্পিকার|mic\b|microphone|মাইক্রোফোন|bulb/i) &&
      combined.match(/earbud|airpod|headphone|earphone|headset|wireless.*ear|bluetooth.*ear|neckband|tws|pro.*4|m10|f9|anc.*ear|হেডফোন|ইয়ারবাড|ইয়ারফোন/i)) {
    return "earbuds";
  }

  // 4. Power bank, fast charging, chargers, cables
  if (combined.match(/power.*bank|powerbank|charger|fast.*charg|cable|type-c|adapter|pd\s*\d+|10000mah|20000mah|পাওয়ার.*ব্যাংক|চার্জার|ক্যাবল/i) && !combined.match(/earbud|airpod|tws|headphone|earphone/i)) {
    return "powerbank";
  }

  // 5. Speakers, Bluetooth audio, FM radio, sound system, soundbar
  if (combined.match(/speaker|sound.*system|soundbar|fm.*radio|bluetooth.*speaker|audio.*bass|extra.*bass|hi-fi|স্পিকার|সাউন্ড/i)) {
    return "speaker";
  }

  // 6. Kitchen, cooking, chopper, vegetable cutter, blender, grinder, mixer, hot pot, air fryer, cleaver knife, spice box, dish rack
  if (combined.match(/cook|kitchen|chopper|cutter|slicer|blender|grinder|hot.*pot|fryer|kettle|knife|cleaver|steamer|spice.*box|dish.*rack|food.*storage|fridge.*box|seasoning|oil.*bottle|oil.*dispenser|রান্না|ব্লেন্ডার|কুকার|চপার|ছুরি/i)) {
    return "kitchen";
  }

  // 7. Fan, air pump, pump, compressor, cooling, humidifier, spray fan, mist fan
  if (combined.match(/fan|humidifier|diffuser|spray.*fan|mist.*fan|air.*pump|pump|dispenser.*pump|water.*dispenser|cooling|wind|cooler|ফ্যান|পাম্প|হিউমিডিফায়ার/i)) {
    return "fan";
  }

  // 8. Bags, backpack, handbag, travel bag, wallet, purse
  if (combined.match(/bag|backpack|wallet|purse|handbag|travel.*bag|crossbody|ব্যাগ|মানিব্যাগ|পার্স|ব্যাকপ্যাক/i)) {
    return "bags";
  }

  // 9. Shoes, sneakers, loafers, boots, footwear, sandals
  if (combined.match(/shoe|sneaker|footwear|sandal|boot|loafer|slipper|জুতা|স্যান্ডেল|স্নিকার্স/i)) {
    return "shoes";
  }

  // 10. Smartwatch, fitness tracker, smart band
  if (combined.match(/smart.*watch|fitness.*watch|apple.*watch|ultra.*watch|t800|t900|d20|hw8|hw9|fitness.*band|smart.*band|স্মার্ট.*ওয়াচ|স্মার্ট.*ঘড়ি/i)) {
    return "smartwatch";
  }

  // 11. Watches (analog, quartz, luxury, stainless steel wrist watch)
  if (combined.match(/watch|clock|wrist|oliya|olevs|skmei|binbond|curren|naviforce|casio|quartz|chronograph|dial|stainless.*steel.*watch|analog|ঘড়ি|হাতঘড়ি/i)) {
    return "watch";
  }

  // 12. Trimmers, shavers, clippers, grooming
  if (combined.match(/trimmer|clipper|shaver|grooming|hair.*beard|beard|at-1210|htc|vintage.*t9|kemei|vgr|nova|shaving|hair.*cut|ট্রিমার|শেভার|দাড়ি/i)) {
    return "trimmer";
  }

  // 13. Jersey, sports, fitness wear
  if (combined.match(/jersey|football|soccer|cricket|sports|athlete|gym|workout|brazil|argentina|messi|neymar|ronaldo|জার্সি|ফুটবল|ক্রিকেট/i)) {
    return "jersey";
  }

  // 14. Panjabi, kabli, kurta
  if (combined.match(/panjabi|punjabi|katua|kabli|kurta|পাঞ্জাবি|পাঞ্জাবী|কাবলি/i)) {
    return "panjabi";
  }

  // 15. Pajama, trousers, pants
  if (combined.match(/pajama|pyjama|trouser|pant|salwar|পায়জামা|পাজামা|প্যান্ট/i)) {
    return "pajama";
  }

  // 16. Saree, lehenga
  if (combined.match(/saree|sharee|lehenga|georgette|শাড়ি|লেহেঙ্গা|জর্জেট/i)) {
    return "saree";
  }

  // 17. Abaya, Borka, Burqa, Hijab, Khimar (Modest Islamic Wear)
  if (combined.match(/abaya|borkha|borka|burqa|khimar|hijab|বোরকা|বোরখা|আবায়া|হিজাব|খিমার/i)) {
    return "borka";
  }

  // 18. Kurti, kameez, three piece
  if (combined.match(/kurti|kameez|three.*piece|ladies|কামিজ|কটি|কুর্তি|থ্রি.*পিস/i)) {
    return "kurti";
  }

  // 18. Shirts, t-shirts, polo, jackets, hoodies
  if (combined.match(/shirt|t-shirt|tshirt|polo|jacket|suit|cloth|men's|mens|wear|sleeve|combo.*shirt|denim|jeans|hoodie|টি-শার্ট|টি\s*শার্ট|শার্ট|পোলো|পোশাক/i)) {
    return "shirt";
  }

  // 19. Beauty, hair straightener, hair comb, hair dryer, curler, hair brush, perfume, cosmetics, skincare
  if (nameText.match(/comb\b|straightener|straight.*hair|hair.*straight|hair.*comb|hair.*brush|curler|hair.*dryer|hair.*iron|hair.*styler|চিরুনি|স্ট্রেইটনার/i) ||
      combined.match(/perfume|attar|body.*spray|fragrance|lotion|cream|serum|shampoo|face.*wash|skin.*care|lipstick|makeup|shaper|belt.*body|corset|আতর|পারফিউম|লোশন|ক্রিম|লিপস্টিক|মেকআপ|তেল/i)) {
    return "beauty";
  }

  // 20. Pure foods, organic, honey, ghee, tea
  if (combined.match(/honey|ghee|oil|tea|chia|organic|mustard|pure.*food|food|মধু|ঘি|তেল|চা|খাবার/i)) {
    return "pure_foods";
  }

  // 21. Kids toys, baby items
  if (combined.match(/toy|kid|baby|doll|car.*toy|child|খেলনা|বাচ্চা/i)) {
    return "kids";
  }

  // 22. Mouse (specific check before keyboard/general tech)
  if (nameText.match(/\bmouse\b|gaming.*mouse|wireless.*mouse|optical.*mouse|মাউস/i) && !nameText.match(/trap|pad|mouse\s*pad/i)) {
    return "mouse";
  }

  // 23. Keyboard, computer, tech
  // CRITICAL: Must be in product NAME (not from "Gadgets, Mouse & Cameras" category!)
  if (nameText.match(/\bkeyboard\b|\bkeypad\b|কিবোর্ড/i)) {
    return "keyboard";
  }
  if (nameText.match(/\b(laptop|desktop|gaming\s*pc)\b|ল্যাপটপ|কম্পিউটার/i) && !nameText.match(/stand|cooler|bag|case/i)) {
    return "keyboard";
  }

  // 24. Tools, hardware, repair
  if (combined.match(/screwdriver|soldering|iron|solder|drill|tool|hardware|wrench|hammer|plier|screw|repair.*kit|machine|saw|socket|ড্রিল|স্ক্রু|টুলস/i)) {
    return "tools";
  }

  // 25. General electronics & gadgets
  if (combined.match(/lens|tripod|ring.*light|mic|microphone|projector|gadget|electronic|মাইক্রোফোন/i)) {
    return "electronics";
  }

  // 26. Home & living
  if (combined.match(/\b(home\s*(decor|appliances?|living|kitchen)?|mug|lamp|dispenser|bottle|flask|pillow|cushion|shelf|rack|mop)\b|লাইট|মগ|বোতল|বালিশ/i)) {
    return "home";
  }

  return null;
}

export function generateProductSvgPlaceholder(name: string = "Product", category: string = ""): string {
  try {
    // Array.from safely splits on unicode code points, never slicing surrogate pairs in half
    const chars = Array.from(name || "Product");
    const safeSnippet = chars.slice(0, 25).join("");
    const safeName = safeSnippet
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="400" height="400" fill="url(#bgGrad)"/><circle cx="200" cy="170" r="54" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><path d="M185 160h30v22h-30z M175 190h50v4h-50z" fill="#94a3b8"/><text x="200" y="260" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="14" font-weight="600" fill="#475569">${safeName}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch {
    const staticSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f8fafc"/><circle cx="200" cy="170" r="54" fill="#ffffff"/><text x="200" y="260" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#475569">Product</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(staticSvg)}`;
  }
}

export function getCategoryFallbackImage(
  name: string = "",
  category: string = "",
  index: number = 0
): string {
  const key = detectCategoryKey(name, category);
  if (key && CATEGORY_IMAGES[key]) {
    const images = CATEGORY_IMAGES[key];
    return images[Math.abs(index) % images.length];
  }

  const defaultImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", // Watch
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop", // Earbuds
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop", // Smartwatch
    "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop", // Power bank
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", // Backpack
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop", // Ring
  ];
  return defaultImages[Math.abs(index) % defaultImages.length];
}

export function getCategoryFallbackImages(
  name: string = "",
  category: string = "",
  count: number = 2
): string[] {
  const key = detectCategoryKey(name, category);
  const images = (key && CATEGORY_IMAGES[key]) ? CATEGORY_IMAGES[key] : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
  ];
  return Array.from({ length: Math.min(count, images.length) }, (_, i) => images[i % images.length]);
}

export function getSmartProductImage(
  name: string = "",
  currentImageUrl?: string,
  category: string = "",
  index: number = 0
): string {
  // If currentImageUrl is a genuine uploaded/supplier image URL, return the direct clean URL
  if (currentImageUrl && typeof currentImageUrl === "string" && currentImageUrl.trim() !== "") {
    const trimmed = currentImageUrl.trim();
    const isUnsplashGeneric = GENERIC_GADGET_FALLBACKS.some(pattern => trimmed.includes(pattern));

    if (!isUnsplashGeneric) {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//") || trimmed.startsWith("data:")) {
        const direct = getDirectImageUrl(trimmed);
        return direct || trimmed;
      }
    }
  }

  return getCategoryFallbackImage(name, category, index);
}

// Global in-memory cache of failed image URLs so broken supplier links fail in 0ms without re-trying
export const globalFailedImageUrls = new Set<string>();

/**
 * Returns an array of candidate image URLs in priority order:
 * 1. High-speed Edge WebP CDN URL (Fastest: 100-300ms, 10-20KB, Cloudflare CDN cached)
 * 2. Guaranteed real category-matched product photo (Instant fallback if supplier link is dead)
 * 3. Default clean branded SVG placeholder
 */
export function getProductImageCandidates(product: any, width: number = 400): string[] {
  if (!product) return [];
  const candidates: string[] = [];

  const addCandidate = (url?: string) => {
    if (!url || typeof url !== "string") return;
    const clean = url.trim();
    if (!clean || clean.length < 5) return;
    if (globalFailedImageUrls.has(clean)) return; // Skip known failed URLs across the session
    if (!candidates.includes(clean)) {
      candidates.push(clean);
    }
  };

  // Collect ALL genuine product images from any schema format
  const allRawImages: string[] = [];
  const collect = (u: any) => {
    if (!u) return;
    const str = typeof u === "string" ? u.trim() : (u.image_url || u.url || u.image || u.product_image || u.path || u.src || "").trim();
    if (str && !allRawImages.includes(str)) {
      allRawImages.push(str);
    }
  };
  if (product.image) collect(product.image);
  if (product.image_url) collect(product.image_url);
  if (product.thumbnail) collect(product.thumbnail);
  if (product.thumbnail_img) collect(product.thumbnail_img);
  if (product.featured_image) collect(product.featured_image);
  if (Array.isArray(product.images)) product.images.forEach(collect);
  if (Array.isArray(product.product_images)) product.product_images.forEach(collect);
  if (Array.isArray(product.gallery)) product.gallery.forEach(collect);
  if (Array.isArray(product.photos)) product.photos.forEach(collect);

  // Add CDN optimized and direct URLs for all available genuine photos of this product
  for (const raw of allRawImages) {
    const cdnUrl = optimizeImageUrl(raw, width);
    if (cdnUrl) addCandidate(cdnUrl);
    const directUrl = getDirectImageUrl(raw);
    if (directUrl && directUrl !== cdnUrl) {
      addCandidate(directUrl);
    }
  }

  // 3. Guaranteed real category-matched product photo (instant fallback matching title & category)
  // ONLY if all genuine images failed or none existed
  const categoryFallback = getSmartProductImage(
    product.name || "",
    "",
    product.category || product.category_name || (product as any).category_id || (product as any).categorySlug || "",
    typeof product.id === "number" ? product.id : (parseInt(product.id) || 0)
  );
  if (categoryFallback && !categoryFallback.startsWith("data:")) {
    addCandidate(categoryFallback);
  }

  // 4. Last-resort clean branded SVG placeholder (guaranteed to render)
  const svgPlaceholder = generateProductSvgPlaceholder(
    product.name || "Product",
    product.category || product.category_name || ""
  );
  addCandidate(svgPlaceholder);

  return candidates;
}

// High-Performance Proactive Image Preloader - Warms product images with lightweight WebP CDN URLs
const preloadedUrls = new Set<string>();

export function prefetchProductImages(
  products: Array<{ image?: string; image_url?: string; images?: any[]; name?: string }>,
  maxCount: number = 24
) {
  if (typeof window === "undefined" || !Array.isArray(products) || products.length === 0) return;
  const targetSlice = products.slice(0, Math.min(maxCount, products.length));

  const warmImage = (rawUrl?: string) => {
    if (!rawUrl || typeof rawUrl !== "string") return;
    const finalUrl = optimizeImageUrl(rawUrl, 240);
    if (!finalUrl || preloadedUrls.has(finalUrl) || finalUrl.startsWith("data:")) return;
    preloadedUrls.add(finalUrl);

    const img = new Image();
    img.decoding = "async";
    img.src = finalUrl;
  };

  const runWarm = () => {
    targetSlice.forEach((p) => {
      warmImage(p.image || p.image_url);
    });
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runWarm, { timeout: 1500 });
  } else {
    setTimeout(runWarm, 300);
  }
}
