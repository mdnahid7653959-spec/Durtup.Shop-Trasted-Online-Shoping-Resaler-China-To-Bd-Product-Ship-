export interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  bangla?: string;
  keywords: string[];
  image?: string;
}

export interface MainCategoryItem {
  id: string;
  name: string;
  slug: string;
  bangla: string;
  tag?: string;
  badgeColor?: string;
  image: string;
  iconName: string;
  subcategories: SubcategoryItem[];
}

export const CATEGORIES_DATA: MainCategoryItem[] = [
  {
    id: "gadgets-electronics",
    name: "Gadgets & Electronics",
    slug: "gadgets-electronics",
    bangla: "গ্যাজেটস ও ইলেকট্রনিক্স",
    tag: "⚡ TECH",
    badgeColor: "bg-blue-600 text-white",
    image: "/category-gadgets.webp",
    iconName: "Smartphone",
    subcategories: [
      {
        id: "mobile-accessories",
        name: "Mobile Accessories",
        slug: "mobile-accessories",
        bangla: "মোবাইল এক্সেসরিজ",
        keywords: ["charger", "cable", "cover", "holder", "stand", "power bank", "otg", "adapter", "separator", "battery", "type-c", "lightning", "casing", "protector"]
      },
      {
        id: "audio-speakers",
        name: "Audio & Speaker",
        slug: "audio-speakers",
        bangla: "স্পিকার ও অডিও",
        keywords: ["earbud", "headphone", "earphone", "headset", "tws", "speaker", "soundbar", "bluetooth receiver", "mp3", "sound"]
      },
      {
        id: "shaver-trimmer",
        name: "Shaver & Trimmer",
        slug: "shaver-trimmer",
        bangla: "শেভার ও ট্রিমার",
        keywords: ["shaver", "trimmer", "clipper", "hair clipper", "grooming", "razor", "nose hair"]
      },
      {
        id: "fan-coolers",
        name: "Fan & Coolers",
        slug: "fan-coolers",
        bangla: "ফ্যান ও কুলার",
        keywords: ["fan", "cooler", "portable fan", "mini fan", "rechargeable fan", "air cooler"]
      },
      {
        id: "computer-gaming",
        name: "Computer & Gaming",
        slug: "computer-gaming",
        bangla: "কম্পিউটার ও গেমিং",
        keywords: ["mouse", "keyboard", "router", "monitor", "usb", "hub", "wifi", "gamepad", "controller", "laptop", "ethernet"]
      },
      {
        id: "content-tools-camera",
        name: "Content Tools & Camera",
        slug: "content-tools-camera",
        bangla: "ক্যামেরা ও কন্টেন্ট টুলস",
        keywords: ["camera", "lens", "tripod", "gimbal", "ring light", "content tool", "vlog", "action cam", "mic", "microphone"]
      },
      {
        id: "smart-gadgets",
        name: "Smart Gadgets",
        slug: "smart-gadgets",
        bangla: "স্মার্ট গ্যাজেটস",
        keywords: ["projector", "smart plug", "dispenser pump", "water dispenser", "alarm", "sensor", "led", "timer", "purifier"]
      }
    ]
  },
  {
    id: "mens-fashion",
    name: "Men's Fashion",
    slug: "mens-fashion",
    bangla: "পুরুষদের ফ্যাশন",
    tag: "🔥 TRENDING",
    badgeColor: "bg-amber-600 text-white",
    image: "/category-mens.webp",
    iconName: "Shirt",
    subcategories: [
      {
        id: "panjabi-pajama",
        name: "Panjabi & Pajama",
        slug: "panjabi-pajama",
        bangla: "পাঞ্জাবি ও পায়জামা",
        keywords: ["panjabi", "punjabi", "pajama", "pyjama", "kabli", "kurta", "katua"]
      },
      {
        id: "t-shirts-polos",
        name: "T-Shirts & Polos",
        slug: "t-shirts-polos",
        bangla: "টি-শার্ট ও পোলো",
        keywords: ["t-shirt", "tshirt", "polo", "drop shoulder", "oversized", "jersey"]
      },
      {
        id: "shirts",
        name: "Casual & Formal Shirts",
        slug: "shirts",
        bangla: "শার্ট কালেকশন",
        keywords: ["shirt", "casual shirt", "formal shirt", "denim shirt", "cotton shirt", "ban color"]
      },
      {
        id: "pants-trousers",
        name: "Pants & Gabardine",
        slug: "pants-trousers",
        bangla: "প্যান্ট ও গ্যাবার্ডিন",
        keywords: ["pant", "pants", "gabardine", "jeans", "trouser", "sweatpant", "joggers", "cargo"]
      },
      {
        id: "winter-jackets",
        name: "Winter Hoodies & Jackets",
        slug: "winter-jackets",
        bangla: "হুডি ও জ্যাকেট",
        keywords: ["hoodie", "jacket", "sweatshirt", "sweater", "windbreaker", "blazer", "coat"]
      },
      {
        id: "innerwear",
        name: "Innerwear & Boxers",
        slug: "innerwear",
        bangla: "ইনারওয়্যার ও বক্সার",
        keywords: ["boxer", "underwear", "brief", "vest", "inner"]
      }
    ]
  },
  {
    id: "womens-fashion",
    name: "Women's Fashion",
    slug: "womens-fashion",
    bangla: "মহিলাদের ফ্যাশন",
    tag: "✨ ELEGANT",
    badgeColor: "bg-pink-600 text-white",
    image: "/category-womens.webp",
    iconName: "Sparkles",
    subcategories: [
      {
        id: "sarees-lehengas",
        name: "Sarees & Lehengas",
        slug: "sarees-lehengas",
        bangla: "শাড়ি ও লেহেঙ্গা",
        keywords: ["saree", "sari", "sharee", "lehenga", "silk", "jamdani", "georgette"]
      },
      {
        id: "salwar-kurtis",
        name: "Salwar, Kurti & Two-Piece",
        slug: "salwar-kurtis",
        bangla: "সালোয়ার ও কুর্তি",
        keywords: ["kurti", "salwar", "kameez", "tunic", "palazzo", "two piece", "three piece"]
      },
      {
        id: "hijab-abaya",
        name: "Hijab, Abaya & Borkha",
        slug: "hijab-abaya",
        bangla: "হিজাব ও বোরকা",
        keywords: ["hijab", "abaya", "borkha", "burqa", "khimar", "scarf", "niqab", "borka"]
      },
      {
        id: "jewelry-ornaments",
        name: "Jewelry & Rings",
        slug: "jewelry-ornaments",
        bangla: "জুয়েলারি ও গহনা",
        keywords: ["ring", "necklace", "earring", "chain", "pendant", "bangle", "bracelet", "jewel", "diamond", "stone"]
      },
      {
        id: "western-dresses",
        name: "Western Tops & Dresses",
        slug: "western-dresses",
        bangla: "ওয়েস্টার্ন ও ড্রেস",
        keywords: ["dress", "top", "gown", "skirt", "jumpsuit", "womens"]
      }
    ]
  },
  {
    id: "home-lifestyle",
    name: "Home & Lifestyle",
    slug: "home-lifestyle",
    bangla: "হোম ও লাইফস্টাইল",
    tag: "🏡 LIVING",
    badgeColor: "bg-emerald-600 text-white",
    image: "/category-home.webp",
    iconName: "Home",
    subcategories: [
      {
        id: "kitchen-dining",
        name: "Kitchen & Dining",
        slug: "kitchen-dining",
        bangla: "কিচেন ও ডাইনিং",
        keywords: ["knife", "chopper", "blender", "grinder", "cooker", "pot", "pan", "bottle", "cup", "mug", "dispenser", "scale", "lunch box", "flask", "thermos", "sealer"]
      },
      {
        id: "home-decor",
        name: "Home Decor & Lighting",
        slug: "home-decor",
        bangla: "হোম ডেকর ও লাইটিং",
        keywords: ["lamp", "light", "night light", "crystal ball", "curtain", "showpiece", "decor", "clock", "wall", "globe", "3d crystal"]
      },
      {
        id: "bedding-bath",
        name: "Bedding & Bath",
        slug: "bedding-bath",
        bangla: "বেডিং ও বাথ",
        keywords: ["bed sheet", "bedsheet", "pillow", "cushion", "blanket", "towel", "mosquito net"]
      },
      {
        id: "cleaning-storage",
        name: "Cleaning & Storage",
        slug: "cleaning-storage",
        bangla: "ক্লিনিং ও স্টোরেজ",
        keywords: ["mop", "cleaner", "vacuum", "rack", "shelf", "organizer", "storage", "hanger", "steamer", "iron", "bag"]
      },
      {
        id: "home-appliances",
        name: "Home Appliances",
        slug: "home-appliances",
        bangla: "হোম অ্যাপ্লায়েন্স",
        keywords: ["fan", "cooler", "humidifier", "diffuser", "heater", "purifier", "pump", "water purifier"]
      }
    ]
  },
  {
    id: "health-beauty",
    name: "Health & Beauty",
    slug: "health-beauty",
    bangla: "হেলথ ও বিউটি",
    tag: "💄 BEAUTY",
    badgeColor: "bg-rose-600 text-white",
    image: "/category-beauty.webp",
    iconName: "Sparkles",
    subcategories: [
      {
        id: "skin-care",
        name: "Skin & Personal Care",
        slug: "skin-care",
        bangla: "স্কিন ও পার্সোনাল কেয়ার",
        keywords: ["skin", "serum", "cream", "lotion", "face wash", "facewash", "scrub", "mask", "fungus", "nail", "foot care", "whitening", "derma roller", "soap"]
      },
      {
        id: "hair-care",
        name: "Hair Care & Styling",
        slug: "hair-care",
        bangla: "হেয়ার কেয়ার ও ড্রায়ার",
        keywords: ["hair", "hair oil", "shampoo", "conditioner", "dryer", "hair dryer", "straightener", "curler"]
      },
      {
        id: "health-wellness",
        name: "Health & Wellness Devices",
        slug: "health-wellness",
        bangla: "হেলথ ও বডি কেয়ার",
        keywords: ["cramp", "menstrual", "period", "massager", "slimming", "belt", "pain relief", "support", "posture corrector", "health care"]
      },
      {
        id: "perfume-fragrance",
        name: "Perfume & Fragrance",
        slug: "perfume-fragrance",
        bangla: "পারফিউম ও সুগন্ধি",
        keywords: ["perfume", "attar", "fragrance", "body spray", "solid perfume"]
      }
    ]
  },
  {
    id: "kids-zone",
    name: "Kids Zone",
    slug: "kids-zone",
    bangla: "বাচ্চাদের জোন",
    tag: "🧸 KIDS",
    badgeColor: "bg-purple-600 text-white",
    image: "/category-kids.webp",
    iconName: "Baby",
    subcategories: [
      {
        id: "toys-games",
        name: "Toys & RC Games",
        slug: "toys-games",
        bangla: "খেলনা ও রোবট",
        keywords: ["toy", "robot", "puzzle", "chess", "doll", "rc car", "remote control", "helicopter", "lego", "dancing robot", "game"]
      },
      {
        id: "educational-toys",
        name: "Educational & Drawing Kits",
        slug: "educational-toys",
        bangla: "শিক্ষণীয় খেলনা ও আর্ট",
        keywords: ["talking book", "intelligence book", "drawing", "art set", "coloring", "learning", "pencil", "paint"]
      },
      {
        id: "baby-care",
        name: "Baby Care & Essentials",
        slug: "baby-care",
        bangla: "শিশুর যত্ন ও ফিডার",
        keywords: ["feeder", "bottle", "teether", "rattle", "diaper", "walker", "stroller", "baby"]
      },
      {
        id: "kids-fashion",
        name: "Kids Fashion",
        slug: "kids-fashion",
        bangla: "বাচ্চাদের পোশাক",
        keywords: ["jersey", "raincoat", "dress", "shoe", "clothing", "kids"]
      }
    ]
  },
  {
    id: "foods",
    name: "Foods",
    slug: "foods",
    bangla: "খাদ্য ও অর্গানিক",
    tag: "🌿 PURE",
    badgeColor: "bg-green-600 text-white",
    image: "/category-foods.webp",
    iconName: "ShoppingBag",
    subcategories: [
      {
        id: "honey-nuts",
        name: "Pure Honey & Honey Nuts",
        slug: "honey-nuts",
        bangla: "খাঁটি মধু ও হানি নাটস",
        keywords: ["honey", "nuts", "honey nuts", "khejur", "modhu"]
      },
      {
        id: "oil-ghee",
        name: "Mustard Oil & Pure Ghee",
        slug: "oil-ghee",
        bangla: "সরিষার তেল ও গাওয়া ঘি",
        keywords: ["mustard oil", "mustard", "ghee", "oil", "tel", "sorisha"]
      },
      {
        id: "dry-fruits",
        name: "Dry Fruits & Dates",
        slug: "dry-fruits",
        bangla: "ড্রাই ফ্রুটস ও খেজুর",
        keywords: ["dry fruits", "khejur", "dates", "almond", "cashew"]
      },
      {
        id: "organic-combos",
        name: "Organic Combos",
        slug: "organic-combos",
        bangla: "অর্গানিক কম্বো অফার",
        keywords: ["combo", "gift set", "oats", "healthy"]
      }
    ]
  },
  {
    id: "winter",
    name: "Winter",
    slug: "winter",
    bangla: "উইন্টার কালেকশন",
    tag: "❄️ WINTER",
    badgeColor: "bg-sky-600 text-white",
    image: "/category-winter.webp",
    iconName: "Shirt",
    subcategories: [
      {
        id: "winter-hoodies",
        name: "Winter Hoodies",
        slug: "winter-hoodies",
        bangla: "উইন্টার হুডি",
        keywords: ["hoodie", "zipper", "hoodies"]
      },
      {
        id: "jackets",
        name: "Jackets & Windbreakers",
        slug: "jackets",
        bangla: "জ্যাকেট ও উইন্ডব্রেকার",
        keywords: ["jacket", "windbreaker"]
      },
      {
        id: "sweatshirts",
        name: "Sweatshirts & Sweaters",
        slug: "sweatshirts",
        bangla: "সোয়েটশার্ট ও সোয়েটার",
        keywords: ["sweatshirt", "sweater"]
      },
      {
        id: "tracksuits",
        name: "Full Sets & Tracksuits",
        slug: "tracksuits",
        bangla: "ট্র্যাকস্যুট ফুল সেট",
        keywords: ["full set", "trouser set", "suit", "trouser"]
      }
    ]
  },
  {
    id: "watch",
    name: "Watch",
    slug: "watch",
    bangla: "ঘড়ি ও ওয়াচ",
    tag: "⌚ WATCHES",
    badgeColor: "bg-indigo-600 text-white",
    image: "/category-watch.webp",
    iconName: "Watch",
    subcategories: [
      {
        id: "smart-watches",
        name: "Smart Watches",
        slug: "smart-watches",
        bangla: "স্মার্ট ওয়াচ",
        keywords: ["smartwatch", "smart watch", "sim supported", "bluetooth call"]
      },
      {
        id: "mens-watches",
        name: "Men Quartz Watches",
        slug: "mens-watches",
        bangla: "পুরুষদের ঘড়ি",
        keywords: ["olevs", "curren", "naviforce", "skmei", "rolex", "analog", "quartz", "luxury", "men"]
      },
      {
        id: "womens-watches",
        name: "Women Fashion Watches",
        slug: "womens-watches",
        bangla: "মহিলাদের ফ্যাশন ঘড়ি",
        keywords: ["women", "fashion watch", "ladies"]
      },
      {
        id: "digital-clocks",
        name: "Digital & Table Clocks",
        slug: "digital-clocks",
        bangla: "টেবিল ও ডিজিটাল ক্লক",
        keywords: ["alarm clock", "digital lcd clock", "table clock", "clock"]
      }
    ]
  },
  {
    id: "customize-gift",
    name: "Customize & Gift",
    slug: "customize-gift",
    bangla: "কাস্টমাইজ ও গিফট",
    tag: "🎁 GIFTS",
    badgeColor: "bg-rose-600 text-white",
    image: "/category-gift.webp",
    iconName: "Gift",
    subcategories: [
      {
        id: "custom-mugs",
        name: "Customized Mugs & Gifts",
        slug: "custom-mugs",
        bangla: "কাস্টমাইজড মগ",
        keywords: ["mug", "photo", "magic mug", "personalise", "custom"]
      },
      {
        id: "showpieces-decor",
        name: "Showpieces & Decor",
        slug: "showpieces-decor",
        bangla: "শো-পিস ও ডেকোরেশন",
        keywords: ["world map", "eiffel tower", "rotating globe", "showpiece"]
      },
      {
        id: "custom-apparel",
        name: "Custom Apparel & Print",
        slug: "custom-apparel",
        bangla: "কাস্টম টি-শার্ট ও প্রিন্ট",
        keywords: ["t-shirt", "custom t-shirt", "id card", "print"]
      },
      {
        id: "mystery-boxes",
        name: "Surprise Boxes",
        slug: "mystery-boxes",
        bangla: "মিস্ট্রি ও সারপ্রাইজ বক্স",
        keywords: ["mystery box", "magic box", "gift set"]
      }
    ]
  },
  {
    id: "offer",
    name: "Offer",
    slug: "offer",
    bangla: "অফার ও ডিল",
    tag: "🏷️ OFFERS",
    badgeColor: "bg-red-600 text-white",
    image: "/category-offer.webp",
    iconName: "Tag",
    subcategories: [
      {
        id: "mystery-deals",
        name: "Mystery Gift Boxes",
        slug: "mystery-deals",
        bangla: "মিস্ট্রি গিফট বক্স",
        keywords: ["mystery", "magic box", "special"]
      },
      {
        id: "flash-combos",
        name: "Combo Deals & Discounts",
        slug: "flash-combos",
        bangla: "কম্বো ডিল ও ছাড়",
        keywords: ["combo", "offer", "deal", "discount"]
      }
    ]
  },
  {
    id: "others",
    name: "Other's",
    slug: "others",
    bangla: "অন্যান্য সামগ্রী",
    tag: "📦 MORE",
    badgeColor: "bg-slate-600 text-white",
    image: "/category-others.webp",
    iconName: "Package",
    subcategories: [
      {
        id: "daily-essentials",
        name: "Novelty & Daily Essentials",
        slug: "daily-essentials",
        bangla: "নিত্যপ্রয়োজনীয় গ্যাজেট",
        keywords: ["light", "decor", "glove", "box", "tool"]
      },
      {
        id: "crystal-lights",
        name: "3D Crystal & Night Lights",
        slug: "crystal-lights",
        bangla: "থ্রিডি ক্রিস্টাল লাইট",
        keywords: ["crystal", "night light", "projector"]
      }
    ]
  }
];

// Helper to look up a category or subcategory by slug or name
export function findCategoryOrSubcategory(queryOrSlug: string): {
  type: "category" | "subcategory" | "all";
  category?: MainCategoryItem;
  subcategory?: SubcategoryItem;
  canonicalCategoryName?: string;
  keywords?: string[];
} {
  const raw = (queryOrSlug || "").trim();
  if (!raw || raw.toLowerCase() === "all") {
    return { type: "all" };
  }

  const cleanStr = (s: string) => s.toLowerCase().trim().replace(/['"’]/g, "");
  const norm = cleanStr(raw);

  // 1. Direct EXACT category match first (slug, name, id, bangla)
  for (const cat of CATEGORIES_DATA) {
    if (
      cleanStr(cat.slug) === norm ||
      cleanStr(cat.name) === norm ||
      cleanStr(cat.id) === norm ||
      (cat.bangla && cleanStr(cat.bangla) === norm)
    ) {
      return {
        type: "category",
        category: cat,
        canonicalCategoryName: cat.name
      };
    }
  }

  // 2. Direct EXACT subcategory match next (slug, name, id, bangla)
  for (const cat of CATEGORIES_DATA) {
    for (const sub of cat.subcategories) {
      if (
        cleanStr(sub.slug) === norm ||
        cleanStr(sub.name) === norm ||
        cleanStr(sub.id) === norm ||
        (sub.bangla && cleanStr(sub.bangla) === norm)
      ) {
        return {
          type: "subcategory",
          category: cat,
          subcategory: sub,
          canonicalCategoryName: cat.name,
          keywords: sub.keywords
        };
      }
    }
  }

  // 3. Common category aliases & safe mappings
  if (norm === "beauty" || norm.includes("health") || norm.includes("skin") || norm.includes("beauty")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "health-beauty") || CATEGORIES_DATA.find(c => c.slug === "home-lifestyle")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (
    norm === "watches" ||
    norm === "watch" ||
    norm.includes("watch") ||
    norm.includes("quartz") ||
    norm.includes("smartwatch") ||
    norm.includes("chronograph") ||
    norm.includes("clock") ||
    norm.includes("ঘড়ি")
  ) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "watch")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm === "electronics" || norm === "gadgets") {
    const cat = CATEGORIES_DATA.find(c => c.slug === "gadgets-electronics")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm === "home" || norm === "kitchen") {
    const cat = CATEGORIES_DATA.find(c => c.slug === "home-lifestyle")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm === "kids" || norm === "baby") {
    const cat = CATEGORIES_DATA.find(c => c.slug === "kids-zone")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm === "food" || norm.includes("honey") || norm.includes("supplement") || norm.includes("milk shake") || norm.includes("milkshake")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "foods")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }

  // 4. Priority disambiguation: Women's Fashion MUST precede Men's Fashion
  if (
    norm.includes("women") ||
    norm.includes("female") ||
    norm.includes("ladies") ||
    norm.includes("মহিলা") ||
    norm.includes("মেয়ে") ||
    norm.includes("নারী")
  ) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "womens-fashion")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }

  // Strict word-boundary matching for Men's Fashion (NEVER substring of treatment, supplement, etc. AND NEVER watches/gadgets)
  const isMenStrict = /\b(men|mens|gents|male)\b/i.test(norm) || norm.includes("men's") || norm.includes("gents'") || norm.includes("পুরুষ") || norm.includes("ছেলে");
  if (isMenStrict && !norm.includes("women") && !norm.includes("ladies") && !norm.includes("watch") && !norm.includes("clock") && !norm.includes("trimmer") && !norm.includes("shaver")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "mens-fashion")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }

  // 4. Safe category substring match (excluding mens-fashion which was handled above)
  for (const cat of CATEGORIES_DATA) {
    if (cat.slug === "mens-fashion") continue;
    const catClean = cleanStr(cat.slug);
    const catNameClean = cleanStr(cat.name);
    if (norm.includes(catClean) || norm.includes(catNameClean)) {
      return {
        type: "category",
        category: cat,
        canonicalCategoryName: cat.name
      };
    }
  }

  // 5. Subcategory substring match
  for (const cat of CATEGORIES_DATA) {
    for (const sub of cat.subcategories) {
      const subClean = cleanStr(sub.slug);
      const subNameClean = cleanStr(sub.name);
      if (norm.includes(subClean) || norm.includes(subNameClean)) {
        return {
          type: "subcategory",
          category: cat,
          subcategory: sub,
          canonicalCategoryName: cat.name,
          keywords: sub.keywords
        };
      }
    }
  }

  // 6. Domain-specific fallbacks
  if (norm.includes("gadget") || norm.includes("electr") || norm.includes("phone") || norm.includes("tech") || norm.includes("গ্যাজেট")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "gadgets-electronics")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("home") || norm.includes("kitchen") || norm.includes("life") || norm.includes("হোম") || norm.includes("কিচেন")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "home-lifestyle")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("kid") || norm.includes("toy") || norm.includes("baby") || norm.includes("বাচ্চা") || norm.includes("খেলনা")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "kids-zone")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("food") || norm.includes("honey") || norm.includes("oil") || norm.includes("খাবার") || norm.includes("মধু")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "foods")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("winter") || norm.includes("hoodie") || norm.includes("শীত")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "winter")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("watch") || norm.includes("ঘড়ি")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "watch")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("gift") || norm.includes("custom") || norm.includes("উপহার")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "customize-gift")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }
  if (norm.includes("offer") || norm.includes("deal") || norm.includes("অফার")) {
    const cat = CATEGORIES_DATA.find(c => c.slug === "offer")!;
    return { type: "category", category: cat, canonicalCategoryName: cat.name };
  }

  return { type: "all" };
}
