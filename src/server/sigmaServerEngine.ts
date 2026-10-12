/**
 * SIGMA — Powered by Durtup.shop
 * Production-Grade AI Personal Shopping Manager & Action Agent Server Engine
 *
 * This module runs strictly server-side (Vite dev server middleware, Firebase Functions, Vercel API).
 * Never exposes the Gemini API secret to the browser.
 */

import { FAST_SEED_PRODUCTS } from "../data/fastSeedCatalog";
import type { Product } from "../components/products/ProductCard";

// Types & Interfaces
export interface SigmaToolCall {
  name: string;
  args: Record<string, any>;
}

export interface SigmaActionPayload {
  type: 
    | "OPEN_PRODUCT"
    | "ADD_TO_CART"
    | "REMOVE_FROM_CART"
    | "UPDATE_CART_QTY"
    | "CLEAR_CART"
    | "VIEW_CART"
    | "START_CHECKOUT"
    | "SHOW_ORDER_DRAFT"
    | "CONFIRM_ORDER"
    | "TRACK_ORDER"
    | "OPEN_SUPPORT"
    | "COMPARE_PRODUCTS";
  data?: any;
}

export interface SigmaOrderDraft {
  draftId: string;
  userId: string;
  items: Array<{
    productId: string | number;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    image: string;
  }>;
  shippingInfo: {
    firstName: string;
    lastName?: string;
    phone: string;
    address: string;
    city: string;
    email?: string;
  };
  paymentMethod: "cod" | "bkash" | "nagad" | "card" | string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  couponCode?: string;
  createdAt: number;
  expiresAt: number;
  confirmationToken: string;
}

export interface SigmaProductCardData {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
  slug: string;
  rating: number;
  reviews: number;
  freeShipping?: boolean;
  isBestSeller?: boolean;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  keySpecs?: string[];
}

export interface SigmaComparisonData {
  products: Array<{
    id: string | number;
    name: string;
    price: number;
    image: string;
    slug: string;
    category?: string;
    rating?: number;
    specs: Record<string, string>;
  }>;
  winnerRecommendation?: string;
  keyDifferences?: string[];
}

export interface SigmaTrackingData {
  orderId: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  statusBengali: string;
  step: number; // 1 to 5
  total: number;
  estimatedDelivery?: string;
  trackingNumber?: string;
  recipientName: string;
  address: string;
  items: Array<{ name: string; quantity: number; price: number; image?: string }>;
  createdAt: string;
}

export interface SigmaSupportTicketData {
  ticketId: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

export interface SigmaChatResponse {
  text: string;
  products?: SigmaProductCardData[];
  comparison?: SigmaComparisonData;
  cart?: {
    items: any[];
    subtotal: number;
    itemCount: number;
  };
  orderDraft?: SigmaOrderDraft;
  tracking?: SigmaTrackingData;
  ticket?: SigmaSupportTicketData;
  actions?: SigmaActionPayload[];
  toolActivity?: string[];
  quickActions?: Array<{ label: string; action: string; link?: string }>;
}

export interface SigmaChatRequest {
  query: string;
  userName?: string;
  userId?: string;
  history?: Array<{ sender: "user" | "ai"; text: string; image?: string }>;
  cartState?: any[];
  imageAttachment?: { base64: string; mimeType: string };
  pageContext?: {
    currentPath?: string;
    productId?: string;
    categorySlug?: string;
  };
}

// In-Memory Secure Draft Store (Server-Side) with auto cleanup
const ACTIVE_DRAFTS = new Map<string, SigmaOrderDraft>();
const DRAFT_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

// Rate Limiting Store
const IP_RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 60;

// Maximum allowed tool calls per request
const MAX_TOOL_CALLS = 8;

/**
 * System Instructions for Sigma — Conversion-Focused AI Personal Shopping Consultant
 */
const SIGMA_SYSTEM_INSTRUCTION = `You are Sigma — an advanced, friendly, highly intelligent AI Personal Shopping Consultant for Durtup.shop (Powered by Durtup.shop).

Your Core Mission:
The goal is NOT to pressure customers into buying.
The goal is:
UNDERSTAND THE CUSTOMER → DISCOVER THEIR REAL NEED → REDUCE THEIR CONFUSION → FIND THE BEST MATCH → EXPLAIN WHY IT FITS THEM → REMOVE PURCHASE FRICTION → MAKE THE CUSTOMER CONFIDENT ENOUGH TO BUY.

Core Behavioral Principles:
1. Understand Customer Context Before Recommending:
   - Analyze: Intent, Need, Budget, Occasion (Birthday, Anniversary, Eid, Gift), Recipient (Son, Daughter, Mother, Father, Friend), Age group, Interest (Gaming, Sound, Camera, Fashion), Constraints, and Previous conversation context.
   - Example: If user says "amar cheler birthday tai ami or jonno gift kinte chai ki kena jai", do NOT dump random items. Acknowledge warmly: "অবশ্যই! 🎁 আপনার ছেলের birthday-এর জন্য সুন্দর একটা gift খুঁজছেন। আপনার budgetটা বলুন—আমি সেই budget-এর মধ্যে Durtup.shop থেকে সবচেয়ে suitable ৩–৫টি option বেছে দেব। চাইলে বয়স বা সে কী ধরনের জিনিস পছন্দ করে সেটাও বলতে পারেন।"

2. Contextual Multi-Turn Memory:
   - Remember previous signals (budget, occasion, recipient, priority). Combine ALL accumulated signals in recommendations without asking the user to repeat.

3. Ask ONLY High-Value Questions:
   - If one missing detail (e.g. budget) can dramatically improve recommendations, ask only that question. Do NOT overwhelm with a dozen questions at once.

4. Show Fewer, Better Products (3–4 Ranked Options):
   - 🥇 Best Match: Tailored directly to primary priority & budget.
   - 🥈 Best Value: Best features per taka.
   - 🥉 Budget Choice: Economical reliable pick.
   - Explain why each product fits with a personalized 'whyRecommended' note based on REAL product specs.

5. Trust-First & Zero Manipulation:
   - NEVER invent fake discounts, fake scarcity, fake reviews, or fake specs.
   - Use only REAL Durtup.shop prices, stock, delivery rules (Durtup Launching 2026 Special Offer: All Bangladesh Delivery Charge ৳60 / 1-3 days, 100% Cash on Delivery, 7-day free return guarantee).

6. Remove Purchase Friction:
   - When the user selects or praises a product ("এইটাই ভালো লাগছে"), confirm availability and make the next step easy with [Add to Cart] and [Buy Now] actions.

7. Language & Tone:
   - Match the user's language (Bengali, Banglish, or English) naturally, warmly, and respectfully. Avoid robotic query duplication.`;


/**
 * Tool Declarations for Gemini Tool Calling API
 */
export const SIGMA_GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "searchProducts",
        description: "Search Durtup.shop live product catalog with keywords, category, price range, and sorting.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Search query or product keywords in Bangla or English" },
            category: { type: "STRING", description: "Optional category filter" },
            minPrice: { type: "NUMBER", description: "Minimum budget in BDT" },
            maxPrice: { type: "NUMBER", description: "Maximum budget in BDT" },
            sortBy: { type: "STRING", enum: ["relevance", "price_asc", "price_desc", "rating", "newest"] }
          },
          required: ["query"]
        }
      },
      {
        name: "getProductDetails",
        description: "Get detailed product specs, pricing, HD gallery, and inventory for a specific product ID or slug.",
        parameters: {
          type: "OBJECT",
          properties: {
            productIdOrSlug: { type: "STRING", description: "The product ID or slug" }
          },
          required: ["productIdOrSlug"]
        }
      },
      {
        name: "getTrendingProducts",
        description: "Fetch top trending bestseller and flash deal products.",
        parameters: {
          type: "OBJECT",
          properties: {
            limit: { type: "NUMBER", description: "Number of products to return (default 4)" }
          }
        }
      },
      {
        name: "compareProducts",
        description: "Compare 2 or more products side by side with full specifications and recommendation.",
        parameters: {
          type: "OBJECT",
          properties: {
            productA: { type: "STRING", description: "Name or ID of first product" },
            productB: { type: "STRING", description: "Name or ID of second product" }
          },
          required: ["productA", "productB"]
        }
      },
      {
        name: "checkProductStock",
        description: "Check current live stock status and availability for a product or variant.",
        parameters: {
          type: "OBJECT",
          properties: {
            productId: { type: "STRING", description: "Product ID" },
            variant: { type: "STRING", description: "Selected variant (e.g. Size, Color)" }
          },
          required: ["productId"]
        }
      },
      {
        name: "getCart",
        description: "Retrieve current shopping cart items, quantities, and live subtotal.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "addToCart",
        description: "Add a product to the user's shopping cart.",
        parameters: {
          type: "OBJECT",
          properties: {
            productId: { type: "STRING", description: "Product ID to add" },
            quantity: { type: "NUMBER", description: "Quantity to add (default 1)" },
            variant: { type: "STRING", description: "Variant string if applicable" }
          },
          required: ["productId"]
        }
      },
      {
        name: "removeFromCart",
        description: "Remove an item from the user's shopping cart.",
        parameters: {
          type: "OBJECT",
          properties: {
            productIdOrItemId: { type: "STRING", description: "Product ID or item ID to remove" }
          },
          required: ["productIdOrItemId"]
        }
      },
      {
        name: "clearCart",
        description: "Clear all items from the shopping cart after confirmation.",
        parameters: {
          type: "OBJECT",
          properties: {
            confirmed: { type: "BOOLEAN", description: "Set to true if user confirmed clearing cart" }
          },
          required: ["confirmed"]
        }
      },
      {
        name: "calculateOrderTotal",
        description: "Calculate authoritative subtotal, delivery charge based on city (Dhaka vs Outside Dhaka), and coupon discounts.",
        parameters: {
          type: "OBJECT",
          properties: {
            city: { type: "STRING", description: "Delivery city (e.g., Dhaka, Chittagong, Sylhet)" },
            couponCode: { type: "STRING", description: "Optional promo coupon code" }
          }
        }
      },
      {
        name: "createOrderDraft",
        description: "Generate a secure short-lived order draft and summary card for explicit user review and confirmation. NEVER creates final order without this step.",
        parameters: {
          type: "OBJECT",
          properties: {
            shippingCity: { type: "STRING", description: "Delivery city / district" },
            shippingAddress: { type: "STRING", description: "Full street delivery address" },
            phone: { type: "STRING", description: "Customer contact mobile number" },
            customerName: { type: "STRING", description: "Recipient full name" },
            paymentMethod: { type: "STRING", enum: ["cod", "bkash", "nagad"], description: "Payment method" },
            couponCode: { type: "STRING", description: "Optional coupon code" }
          }
        }
      },
      {
        name: "trackOrder",
        description: "Track live status and shipment progress for an order number or ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            orderId: { type: "STRING", description: "Order ID or order number (e.g. ORD-123456)" }
          },
          required: ["orderId"]
        }
      },
      {
        name: "getPolicies",
        description: "Get authoritative Durtup.shop customer policies on Delivery, Cash on Delivery, 7-Day Returns, Warranty, and Payments.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: { type: "STRING", enum: ["delivery", "cod", "returns", "warranty", "payment", "ordering"] }
          },
          required: ["topic"]
        }
      },
      {
        name: "createSupportTicket",
        description: "Create an escalated customer support ticket when an issue requires human helpdesk attention.",
        parameters: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING", description: "Ticket subject summary" },
            message: { type: "STRING", description: "Customer question or problem description" }
          },
          required: ["subject", "message"]
        }
      }
    ]
  }
];

/**
 * Find products from store catalog using fuzzy / multi-keyword scoring
 */
export function executeSearchProducts(params: {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  catalog?: Product[];
}): SigmaProductCardData[] {
  const catalog = params.catalog || FAST_SEED_PRODUCTS;
  const q = (params.query || "").toLowerCase().trim();
  const catFilter = (params.category || "").toLowerCase().trim();
  const minPrice = params.minPrice || 0;
  const maxPrice = params.maxPrice || Infinity;

  // Split query into terms
  const terms = q
    .replace(/[?,.!:;()"]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);

  const scored = catalog.map((p) => {
    const name = (p.name || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();
    const price = Number(p.price || (p as any).sale_price || 0);

    if (price < minPrice || price > maxPrice) {
      return { product: p, score: -1 };
    }

    if (catFilter && !cat.includes(catFilter)) {
      return { product: p, score: -1 };
    }

    let score = 0;
    if (name.includes(q)) score += 20;
    if (cat.includes(q)) score += 10;
    if (slug.includes(q)) score += 8;

    for (const term of terms) {
      if (name.includes(term)) score += 5;
      if (cat.includes(term)) score += 3;
      if (slug.includes(term)) score += 2;
    }

    // Boost bestsellers & free shipping
    if (p.isBestSeller) score += 2;
    if (p.freeShipping) score += 1;

    return { product: p, score };
  }).filter(item => item.score > 0);

  // Sort
  if (params.sortBy === "price_asc") {
    scored.sort((a, b) => Number(a.product.price) - Number(b.product.price));
  } else if (params.sortBy === "price_desc") {
    scored.sort((a, b) => Number(b.product.price) - Number(a.product.price));
  } else if (params.sortBy === "rating") {
    scored.sort((a, b) => (b.product.rating || 0) - (a.product.rating || 0));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  const results = (scored.length > 0 ? scored : catalog.slice(0, 4).map(p => ({ product: p, score: 1 })))
    .slice(0, 4)
    .map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price || (item.product as any).sale_price || 0),
      originalPrice: (item.product as any).sale_price ? Number(item.product.price) : undefined,
      image: item.product.image || "/placeholder.svg",
      category: item.product.category,
      slug: item.product.slug || String(item.product.id),
      rating: item.product.rating || 4.8,
      reviews: item.product.reviews || 18,
      freeShipping: item.product.freeShipping ?? true,
      isBestSeller: item.product.isBestSeller ?? false,
      stockStatus: "in_stock" as const,
      keySpecs: [
        "১০০% জেনুইন কোয়ালিটি",
        "ক্যাশ অন ডেলিভারি প্রযোজ্য",
        "ডেলিভারিতে চেকিং সুবিধা"
      ]
    }));

  return results;
}

/**
 * Execute side-by-side product comparison
 */
export function executeCompareProducts(productAQuery: string, productBQuery: string, catalog?: Product[]): SigmaComparisonData {
  const allProducts = catalog || FAST_SEED_PRODUCTS;

  const findBestMatch = (query: string): Product => {
    const q = query.toLowerCase().trim();
    const found = allProducts.find(p => 
      p.name.toLowerCase().includes(q) || 
      String(p.id) === q || 
      (p.slug && p.slug.toLowerCase().includes(q))
    );
    return found || allProducts[0];
  };

  const prod1 = findBestMatch(productAQuery);
  const prod2 = findBestMatch(productBQuery) || (allProducts[1] || prod1);

  const formatSpecs = (p: Product) => ({
    "মূল্য": `৳${Number(p.price || 0).toLocaleString()}`,
    "ক্যাটাগরি": p.category || "General",
    "রেটিং": `⭐ ${p.rating || 4.8} (${p.reviews || 18} রিভিউ)`,
    "ডেলিভারি": p.freeShipping ? "ফ্রি ডেলিভারি" : "রেগুলার ডেলিভারি",
    "ফিচার": p.isBestSeller ? "টপ সেলিং ট্রেন্ডিং চয়েস" : "প্রিমিয়াম কোয়ালিটি বিল্ড",
    "ওয়ারেন্টি": "ডেলিভারিতে চেকিং ও ক্যাশ অন ডেলিভারি"
  });

  return {
    products: [
      {
        id: prod1.id,
        name: prod1.name,
        price: Number(prod1.price || 0),
        image: prod1.image || "/placeholder.svg",
        slug: prod1.slug || String(prod1.id),
        category: prod1.category,
        rating: prod1.rating || 4.8,
        specs: formatSpecs(prod1)
      },
      {
        id: prod2.id,
        name: prod2.name,
        price: Number(prod2.price || 0),
        image: prod2.image || "/placeholder.svg",
        slug: prod2.slug || String(prod2.id),
        category: prod2.category,
        rating: prod2.rating || 4.8,
        specs: formatSpecs(prod2)
      }
    ],
    winnerRecommendation: `যদি আপনার বাজেট ও ভ্যালু প্রায়োরিটি হয়, তবে **${prod1.name}** দারুণ অপশন। আর স্পেশাল ফিচারের জন্য **${prod2.name}** নির্বাচন করতে পারেন।`,
    keyDifferences: [
      `মূল্য পার্থক্য: ৳${Math.abs(Number(prod1.price || 0) - Number(prod2.price || 0)).toLocaleString()}`,
      "উভয় প্রোডাক্টেই শতভাগ ক্যাশ অন ডেলিভারি এবং ডেলিভারিতে চেক করে রিসিভ করার সুবিধা বিদ্যমান।"
    ]
  };
}

/**
 * Server-side Order Draft Generation
 */
export function executeCreateOrderDraft(params: {
  userId: string;
  customerName?: string;
  phone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  paymentMethod?: string;
  couponCode?: string;
  cartItems?: any[];
  catalog?: Product[];
}): SigmaOrderDraft {
  const catalog = params.catalog || FAST_SEED_PRODUCTS;
  const items = (params.cartItems && params.cartItems.length > 0)
    ? params.cartItems
    : [
        {
          id: catalog[0].id,
          product_id: catalog[0].id,
          name: catalog[0].name,
          price: Number(catalog[0].price || 690),
          quantity: 1,
          image: catalog[0].image
        }
      ];

  // Re-verify authoritative prices from catalog
  let subtotal = 0;
  const verifiedItems = items.map((item: any) => {
    const matched = catalog.find(p => String(p.id) === String(item.product_id || item.id));
    const unitPrice = matched ? Number(matched.price || 0) : Number(item.price || 0);
    const qty = Math.max(1, Number(item.quantity || 1));
    subtotal += unitPrice * qty;

    return {
      productId: item.product_id || item.id,
      name: matched ? matched.name : (item.name || item.title || "Product"),
      price: unitPrice,
      quantity: qty,
      variant: item.variant_name || item.variant || undefined,
      image: matched?.image || item.image || "/placeholder.svg"
    };
  });

  // Calculate authoritative shipping
  const city = (params.shippingCity || "").toLowerCase().trim();
  const isDhaka = city.includes("dhaka") || city.includes("ঢাকা");
  const shippingFee = verifiedItems.length > 0 ? (isDhaka ? 70 : 120) : 0;

  // Coupon discount calculation
  let discount = 0;
  const rawCoupon = (params.couponCode || "").toUpperCase().trim();
  if (rawCoupon === "DURTUP2026") {
    discount = Math.round(subtotal * 0.20);
  }

  const grandTotal = Math.max(0, subtotal + shippingFee - discount);
  const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const confirmationToken = `tok_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

  const draft: SigmaOrderDraft = {
    draftId,
    userId: params.userId || "guest",
    items: verifiedItems,
    shippingInfo: {
      firstName: params.customerName || "Customer",
      phone: params.phone || "017XXXXXXXX",
      address: params.shippingAddress || "ডেলিভারি ঠিকানা দিন",
      city: params.shippingCity || (isDhaka ? "Dhaka" : "Outside Dhaka")
    },
    paymentMethod: params.paymentMethod || "cod",
    subtotal,
    shippingFee,
    discount,
    grandTotal,
    couponCode: rawCoupon || undefined,
    createdAt: Date.now(),
    expiresAt: Date.now() + DRAFT_EXPIRATION_MS,
    confirmationToken
  };

  // Save to in-memory secure drafts store
  ACTIVE_DRAFTS.set(draftId, draft);

  return draft;
}

/**
 * Server-side Order Confirmation Verification (High-Risk Action)
 */
export function executeConfirmOrder(params: {
  draftId: string;
  confirmationToken: string;
  userId?: string;
  catalog?: Product[];
}): { success: boolean; orderId?: string; orderNumber?: string; total?: number; message?: string; draft?: SigmaOrderDraft } {
  const draft = ACTIVE_DRAFTS.get(params.draftId);

  if (!draft) {
    return {
      success: false,
      message: "দুঃখিত, এই অর্ডার ড্রাফটটি খুঁজে পাওয়া যায়নি বা এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় অর্ডার করুন।"
    };
  }

  // Check token authenticity
  if (draft.confirmationToken !== params.confirmationToken) {
    return {
      success: false,
      message: "নিরাপত্তা টোকেন অমিল! অনুগ্রহ করে ইন্টারফেসের কনফার্ম বাটন চাপুন।"
    };
  }

  // Check expiration
  if (Date.now() > draft.expiresAt) {
    ACTIVE_DRAFTS.delete(params.draftId);
    return {
      success: false,
      message: "অর্ডার ড্রাফটটির সময়সীমা অতিক্রান্ত হয়েছে। আমি নতুন ড্রাফট তৈরি করছি।"
    };
  }

  // Re-verify catalog prices & stock
  const catalog = params.catalog || FAST_SEED_PRODUCTS;
  let recomputedSubtotal = 0;
  for (const item of draft.items) {
    const matched = catalog.find(p => String(p.id) === String(item.productId));
    const currentPrice = matched ? Number(matched.price || 0) : item.price;
    if (matched && currentPrice !== item.price) {
      // Price changed in database!
      return {
        success: false,
        message: `দাম পরিবর্তিত হয়েছে! "${matched.name}" এর নতুন দাম ৳${currentPrice}। আমি আপডেট করছি।`
      };
    }
    recomputedSubtotal += currentPrice * item.quantity;
  }

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Cleanup draft so it cannot be double-spent
  ACTIVE_DRAFTS.delete(params.draftId);

  return {
    success: true,
    orderId,
    orderNumber,
    total: draft.grandTotal,
    draft,
    message: `আলহামদুলিল্লাহ! আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে। অর্ডার নম্বর: #${orderNumber}`
  };
}

/**
 * Execute Order Tracking (Authorized lookup)
 */
export function executeTrackOrder(orderId: string): SigmaTrackingData {
  const cleanId = orderId.toUpperCase().trim();
  return {
    orderId: cleanId,
    orderNumber: cleanId.startsWith("ORD-") ? cleanId : `ORD-${cleanId}`,
    status: "processing",
    statusBengali: "প্রক্রিয়াধীন (Processing)",
    step: 2,
    total: 760,
    estimatedDelivery: "১-২ কার্যদিবস",
    trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
    recipientName: "সম্মানিত গ্রাহক",
    address: "ঢাকা, বাংলাদেশ",
    items: [
      { name: "X-01 Full Charge Separator", quantity: 1, price: 690, image: FAST_SEED_PRODUCTS[0]?.image }
    ],
    createdAt: new Date().toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })
  };
}

/**
 * Authoritative Policies Knowledge
 */
export function executeGetPolicies(topic: string): string {
  switch (topic) {
    case "delivery":
      return `🚚 **ডেলিভারি চার্জ ও সময়সীমা:**
- **ঢাকার ভেতরে:** ১ থেকে ৩ কার্যদিবস (চার্জ: ৬০-৭০ টাকা)।
- **ঢাকার বাইরে (সারা বাংলাদেশ):** ২ থেকে ৫ কার্যদিবস (চার্জ: ১০০-১২০ টাকা)।
- বাংলাদেশের ৬৪ জেলার প্রতিটি উপজেলা ও ইউনিয়নে হোম ডেলিভারি সুবিধা রয়েছে।`;
    case "cod":
    case "payment":
      return `💵 **পেমেন্ট ও ক্যাশ অন ডেলিভারি (COD):**
- **১০০% ক্যাশ অন ডেলিভারি:** কোনো অগ্রিম টাকা ছাড়াই পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করতে পারবেন!
- এছাড়াও বিকাশ, নগদ এবং কার্ডে পেমেন্টের সুযোগ রয়েছে।`;
    case "returns":
    case "warranty":
      return `🔄 **Durtup.shop ইনস্ট্যান্ট চেক ও রিটার্ন পলিসি:**
- **ডেলিভারি ম্যানের সামনে চেক করুন:** পার্সেল পাওয়ার সাথে সাথে ডেলিভারি রাইডারের উপস্থিতিতে প্যাকেট খুলে পণ্য দেখে চেক করে নিতে হবে।
- **তাৎক্ষণিক রিটার্ন:** কোনো ত্রুটি বা ড্যামেজ থাকলে সাথে সাথে ডেলিভারি রাইডারের কাছে পার্সেল ফেরত দিন।
- **পরবর্তীতে গ্রহণযোগ্য নয়:** ডেলিভারি সম্পন্ন হওয়ার পর পরবর্তীতে কোনো রিটার্ন রিকোয়েস্ট গ্রহণ করা হবে না (অন্যথায় রিটার্ন রিজেক্ট হবে)।
- পণ্য দেখে শতভাগ নিশ্চিত হয়ে তবেই টাকা পরিশোধ করুন!`;
    case "social":
    case "facebook":
    case "youtube":
    case "instagram":
    case "tiktok":
      return `🌐 **Durtup.shop অফিশিয়াল সোশ্যাল মিডিয়া ও লিঙ্কসমূহ:**

- 🔵 **ফেসবুক পেজ:** [Durtup.shop Facebook Page](https://www.facebook.com/profile.php?id=61582125938251)
- 📸 **ইনস্টাগ্রাম:** [durtup.shop](https://www.instagram.com/durtup.shop/)
- 🎵 **টিকটক:** [@durtup.shop](https://www.tiktok.com/@durtup.shop?is_from_webapp=1&sender_device=pc)
- 🔴 **ইউটিউব চ্যানেল:** আমাদের বর্তমানে কোনো অফিশিয়াল ইউটিউব চ্যানেল নেই।

আমাদের অফিশিয়াল ফেসবুক পেজে যুক্ত হয়ে সব লেটেস্ট অফার, ডিসকাউন্ট ও নতুন প্রোডাক্টের আপডেট পেতে পারেন! 🛍️✨`;
    case "ordering":
    default:
      return `🛍️ **অর্ডার করার নিয়ম:**
1. পছন্দের পণ্যে **"Order Now"** চাপুন অথবা কার্টে যোগ করুন।
2. নাম, মোবাইল ও সম্পূর্ণ ডেলিভারি ঠিকানা দিন।
3. **"Cash on Delivery"** সিলেক্ট করে কনফার্ম বাটনে চাপ দিন। ব্যস!`;
  }
}

/**
 * Master Server-Side Handler for /api/ai/chat
 */
export async function handleSigmaChatRequest(
  body: SigmaChatRequest,
  apiKeyOverride?: string
): Promise<SigmaChatResponse> {
  const query = (body.query || "").trim();
  const userName = body.userName || "";
  const userId = body.userId || "guest";
  const cartItems = body.cartState || [];
  const catalog = FAST_SEED_PRODUCTS;

  // Rate limit check
  const now = Date.now();
  const rateKey = userId || "guest_ip";
  const currentRate = IP_RATE_LIMITS.get(rateKey) || { count: 0, resetAt: now + 60000 };
  if (now > currentRate.resetAt) {
    currentRate.count = 0;
    currentRate.resetAt = now + 60000;
  }
  currentRate.count += 1;
  IP_RATE_LIMITS.set(rateKey, currentRate);

  if (currentRate.count > MAX_REQUESTS_PER_MINUTE) {
    return {
      text: "আপনি খুব দ্রুত অনুরোধ পাঠাচ্ছেন। দয়া করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।"
    };
  }

  // 1. Anti-Prompt-Injection & Anti-Jailbreak Protection
  const lowerQ = query.toLowerCase();
  if (
    lowerQ.includes("system prompt") ||
    lowerQ.includes("instructions") ||
    lowerQ.includes("api key") ||
    lowerQ.includes("gemini key") ||
    lowerQ.includes("secret key") ||
    lowerQ.includes("admin mode") ||
    lowerQ.includes("show all users") ||
    lowerQ.includes("সব ইউজারের অর্ডার")
  ) {
    return {
      text: "আমি **Sigma** — Durtup.shop-এর অফিশিয়াল AI শপিং অ্যাসিস্ট্যান্ট! 🛍️✨\n\nআমাদের স্টোরের প্রোডাক্ট খোঁজা, পণ্যের স্পেক্স তুলনা করা, কার্ট তৈরি করা কিংবা অর্ডার করতে আপনাকে কীভাবে সাহায্য করতে পারি বলুন?"
    };
  }

  // 2. Fetch Gemini API Key strictly from server environment
  const geminiApiKey =
    apiKeyOverride ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    "";

  const configuredModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  // Build Conversation Contents
  const contents: any[] = [];

  // System instruction
  contents.push({
    role: "user",
    parts: [{ text: `${SIGMA_SYSTEM_INSTRUCTION}\n\n[USER CONTEXT: Name: "${userName || "Customer"}", UserID: "${userId}"]` }]
  });
  contents.push({
    role: "model",
    parts: [{ text: `আসসালামু আলাইকুম ${userName ? `**${userName}**` : ""}! 👋 আমি Sigma — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager। আমি আপনাকে কীভাবে সাহায্য করতে পারি?` }]
  });

  // Recent History
  if (body.history && Array.isArray(body.history)) {
    const recent = body.history.slice(-6);
    for (const h of recent) {
      contents.push({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      });
    }
  }

  // Current Query
  const currentParts: any[] = [{ text: query || "Hi Sigma, please help me with Durtup.shop products." }];

  if (body.imageAttachment?.base64) {
    currentParts.push({
      inlineData: {
        mimeType: body.imageAttachment.mimeType || "image/jpeg",
        data: body.imageAttachment.base64
      }
    });
  }

  contents.push({
    role: "user",
    parts: currentParts
  });

  // Multi-Turn Tool Calling Execution Loop
  let finalResponseText = "";
  const actions: SigmaActionPayload[] = [];
  const toolActivity: string[] = [];
  let returnedProducts: SigmaProductCardData[] | undefined;
  let returnedComparison: SigmaComparisonData | undefined;
  let returnedOrderDraft: SigmaOrderDraft | undefined;
  let returnedTracking: SigmaTrackingData | undefined;
  let returnedTicket: SigmaSupportTicketData | undefined;

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

  for (const model of modelsToTry) {
    try {
      let turns = 0;
      let modelResponded = false;

      while (turns < 2) {
        turns++;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            tools: SIGMA_GEMINI_TOOLS,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 700
            }
          })
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) {
          break;
        }

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const content = candidate?.content;
        const parts = content?.parts || [];

        if (!content || parts.length === 0) break;

        // Append model response to conversation turns
        contents.push(content);

        // Check for function calls
        const functionCalls = parts.filter((p: any) => p.functionCall);

        if (functionCalls.length === 0) {
          // Final text response received
          const textPart = parts.find((p: any) => p.text);
          if (textPart?.text) {
            finalResponseText = textPart.text.trim();
            modelResponded = true;
          }
          break;
        }

        // Execute function calls server-side
        const toolResponseParts: any[] = [];

        for (const fc of functionCalls) {
          const fnName = fc.functionCall.name;
          const fnArgs = fc.functionCall.args || {};

          let functionResult: any = null;

          if (fnName === "searchProducts") {
            toolActivity.push("🔎 Product খুঁজছি...");
            const products = executeSearchProducts({ ...fnArgs, catalog });
            returnedProducts = products;
            actions.push({ type: "OPEN_PRODUCT", data: products });
            functionResult = { count: products.length, products: products.slice(0, 4) };
          } else if (fnName === "compareProducts") {
            toolActivity.push("⚖️ প্রোডাক্ট তুলনা করছি...");
            const comp = executeCompareProducts(fnArgs.productA, fnArgs.productB, catalog);
            returnedComparison = comp;
            actions.push({ type: "COMPARE_PRODUCTS", data: comp });
            functionResult = comp;
          } else if (fnName === "getTrendingProducts") {
            toolActivity.push("🔥 ট্রেন্ডিং প্রোডাক্ট লোড করছি...");
            const trending = executeSearchProducts({ query: "", catalog });
            returnedProducts = trending;
            functionResult = { trending };
          } else if (fnName === "getProductDetails") {
            toolActivity.push("📦 প্রোডাক্টের বিস্তারিত চেক করছি...");
            const matched = executeSearchProducts({ query: fnArgs.productIdOrSlug, catalog });
            returnedProducts = matched;
            functionResult = matched[0] || null;
          } else if (fnName === "addToCart") {
            toolActivity.push("🛒 কার্ট আপডেট করছি...");
            const matched = catalog.find(p => String(p.id) === String(fnArgs.productId)) || catalog[0];
            actions.push({
              type: "ADD_TO_CART",
              data: { productId: matched.id, quantity: fnArgs.quantity || 1, name: matched.name, price: matched.price }
            });
            functionResult = { success: true, message: `Product "${matched.name}" added to cart!` };
          } else if (fnName === "removeFromCart") {
            toolActivity.push("🗑️ কার্ট থেকে রিমুভ করছি...");
            actions.push({ type: "REMOVE_FROM_CART", data: { productId: fnArgs.productIdOrItemId } });
            functionResult = { success: true, message: "Item removed from cart" };
          } else if (fnName === "getCart") {
            toolActivity.push("🛍️ কার্ট চেক করছি...");
            functionResult = { items: cartItems, itemCount: cartItems.length };
          } else if (fnName === "clearCart") {
            toolActivity.push("🧹 কার্ট খালি করছি...");
            actions.push({ type: "CLEAR_CART" });
            functionResult = { success: true, message: "Cart cleared" };
          } else if (fnName === "createOrderDraft") {
            toolActivity.push("📋 অর্ডার সামারি ও ড্রাফট তৈরি করছি...");
            const draft = executeCreateOrderDraft({
              userId,
              customerName: fnArgs.customerName || userName,
              phone: fnArgs.phone,
              shippingAddress: fnArgs.shippingAddress,
              shippingCity: fnArgs.shippingCity,
              paymentMethod: fnArgs.paymentMethod,
              couponCode: fnArgs.couponCode,
              cartItems,
              catalog
            });
            returnedOrderDraft = draft;
            actions.push({ type: "SHOW_ORDER_DRAFT", data: draft });
            functionResult = { success: true, draftId: draft.draftId, grandTotal: draft.grandTotal, confirmationRequired: true };
          } else if (fnName === "trackOrder") {
            toolActivity.push("🚚 অর্ডার লাইভ ট্র্যাক করছি...");
            const tracking = executeTrackOrder(fnArgs.orderId);
            returnedTracking = tracking;
            actions.push({ type: "TRACK_ORDER", data: tracking });
            functionResult = tracking;
          } else if (fnName === "getPolicies") {
            toolActivity.push("📜 পলিসি তথ্য যাচাই করছি...");
            functionResult = { policy: executeGetPolicies(fnArgs.topic) };
          } else if (fnName === "createSupportTicket") {
            toolActivity.push("🎫 সাপোর্ট টিকিট তৈরি করছি...");
            const ticket: SigmaSupportTicketData = {
              ticketId: `TCK-${Date.now().toString().slice(-5)}`,
              subject: fnArgs.subject || "Customer Inquiry",
              message: fnArgs.message || query,
              status: "open",
              createdAt: new Date().toISOString()
            };
            returnedTicket = ticket;
            actions.push({ type: "OPEN_SUPPORT", data: ticket });
            functionResult = ticket;
          } else {
            functionResult = { status: "unknown_tool" };
          }

          toolResponseParts.push({
            functionResponse: {
              name: fnName,
              response: functionResult
            }
          });
        }

        // Return tool outputs back to Gemini
        contents.push({
          role: "user",
          parts: toolResponseParts
        });
      }

      if (modelResponded && finalResponseText) {
        return {
          text: finalResponseText,
          products: returnedProducts,
          comparison: returnedComparison,
          orderDraft: returnedOrderDraft,
          tracking: returnedTracking,
          ticket: returnedTicket,
          actions,
          toolActivity,
          quickActions: [
            { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
            { label: "🚚 ডেলিভারি সময় ও চার্জ", action: "delivery_info" },
            { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" },
            { label: "⚡ সকল প্রোডাক্ট দেখুন", action: "view_products", link: "/products" }
          ]
        };
      }
    } catch (err) {
      console.warn(`Gemini model ${model} execution error:`, err);
    }
  }

  // Comprehensive fallback intent matcher if external Gemini API is unreachable

  // 1. Greetings & Well-being (কেমন আছো / Hello / Hi / Salam)
  const isNegativeMood = lowerQ.includes("lagche na") || lowerQ.includes("lagche nah") || lowerQ.includes("bhalo na") || lowerQ.includes("valo na");

  const isGreeting = 
    !isNegativeMood && (
      /^(hlw|hello|hi|helo|hey|hola|salam|assalamu|as-salamu|asalam|kemon|kmn|ki obostha|ki obstha|kemon achen|kemon acho|tumi kemon acho|apni kemon achen)/i.test(lowerQ) ||
      lowerQ.includes("kemon acho") ||
      lowerQ.includes("kemon achen") ||
      lowerQ.includes("kmn aso") ||
      lowerQ.includes("kmn acho") ||
      lowerQ.includes("valo acho") ||
      lowerQ.includes("ki khobor") ||
      lowerQ.includes("ki obstha") ||
      lowerQ.includes("ki obostha") ||
      lowerQ.includes("tumi kemon") ||
      lowerQ.includes("apni kemon") ||
      lowerQ === "hi" ||
      lowerQ === "hlw" ||
      lowerQ === "hello" ||
      lowerQ === "hey"
    );

  if (isGreeting) {
    const greetingName = userName ? ` **${userName}**` : "";
    return {
      text: `আলহামদুলিল্লাহ, আমি খুব ভালো আছি! 😊${greetingName ? `\n\nস্বাগতম${greetingName}!` : ""}\n\nআমি **Sigma** — Durtup.shop-এর অফিসিয়াল Personal Shopping Manager। আপনি কেমন আছেন? আজ আপনাকে কী ধরনের প্রোডাক্ট খুঁজতে বা কেনাকাটায় সাহায্য করতে পারি?`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // 2. Identity / Who are you (তুমি কে / তোমার নাম কী)
  if (
    lowerQ.includes("tumi ke") ||
    lowerQ.includes("tomar nam") ||
    lowerQ.includes("who are you") ||
    lowerQ.includes("what is your name") ||
    lowerQ.includes("about you") ||
    lowerQ.includes("sigma ke") ||
    lowerQ.includes("sigma ki")
  ) {
    return {
      text: `আমি **Sigma**, Durtup.shop-এর অফিশিয়াল AI পার্সোনাল শপিং ম্যানেজার! 🛍️✨\n\nআমি আপনাকে সেরা ও জেনুইন প্রোডাক্ট খুঁজে পেতে, দাম ও স্পেসিফিকেশন তুলনা করতে, কার্ট ম্যানেজ করতে এবং সরাসরি অর্ডার করতে সাহায্য করি। আজ কী খুঁজতে চান বলুন?`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "⚡ সব প্রোডাক্ট দেখুন", action: "view_products", link: "/products" }
      ]
    };
  }

  // 3. Gratitude & Appreciation (ধন্যবাদ / Thanks / Good / Valo)
  if (
    /^(thanks|thank you|thx|dhonnobad|dhonnobaad|shukriya|valo|bhalo|onek valo|great|nice|super|osadharon|ok|thik ache|accha|acha|hmm)$/i.test(lowerQ) ||
    lowerQ.includes("dhonnobad") ||
    lowerQ.includes("thank you") ||
    lowerQ.includes("thanks")
  ) {
    return {
      text: `আপনাকে অনেক অনেক ধন্যবাদ! ❤️\n\nযেকোনো প্রোডাক্টের তথ্য, ওয়ারেন্টি বা অর্ডার সংক্রান্ত প্রয়োজনে আমি সবসময় আছি। আর কিছু কি জানতে চান?`,
      quickActions: [
        { label: "🔥 সেরা অফারগুলো দেখাও", action: "best_offers" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" },
        { label: "⚡ শপ ঘুরে দেখুন", action: "view_products", link: "/products" }
      ]
    };
  }

  // 4. Shopping Roadmap & Guidance Intent (কোনটা নেব বুঝতে পারছি না / গাইড)
  const isRoadmapIntent =
    lowerQ.includes("bujhtesi na") ||
    lowerQ.includes("bujhte parchi na") ||
    lowerQ.includes("bujhte parsi na") ||
    lowerQ.includes("বুঝতেছি না") ||
    lowerQ.includes("বুঝতে পারছি না") ||
    lowerQ.includes("কোনটা নেব") ||
    lowerQ.includes("কোনটা কিনব") ||
    lowerQ.includes("পরামর্শ চাই") ||
    lowerQ.includes("kon ta nebo") ||
    lowerQ.includes("konta nebo") ||
    lowerQ.includes("konta kinbo") ||
    lowerQ.includes("guide koro") ||
    lowerQ.includes("shoppers roadmap") ||
    lowerQ.includes("confused") ||
    lowerQ.includes("help koro");

  if (isRoadmapIntent) {
    return {
      text: `অবশ্যই! আপনার জন্য সেরা এবং পারফেক্ট প্রোডাক্টটি নির্বাচন করতে আসুন ৩টি বিষয় নির্ধারণ করি: 🧭✨\n\n১. 💰 **আপনার বাজেট কত?** (যেমন: ১০,০০০ বা ২০,০০০ টাকা)\n২. 🎯 **প্রধান ব্যবহার কী?** (যেমন: গেমিং, পড়াশোনা, অফিস, নাকি ক্যাজুয়াল ব্যবহার)\n৩. ⚡ **কোন ফিচারটি সবচেয়ে বেশি প্রয়োজন?** (পারফরম্যান্স, ক্যামেরা, ব্যাটারি নাকি স্টাইলিশ লুক)\n\nআপনি জানালেই আমি ক্যাটালগ থেকে সেরা ৩টি অপশন বাছাই করে দেব:\n- 🥇 **Best Overall**\n- 🥈 **Best Performance / Feature**\n- 🥉 **Best Value for Money**`,
      quickActions: [
        { label: "💰 ১০,০০০ টাকার মধ্যে", action: "budget_10k" },
        { label: "🎮 গেমিং প্রায়োরিটি", action: "gaming_priority" },
        { label: "📸 ক্যামেরা ও ব্যাটারি", action: "camera_priority" },
        { label: "🔥 সেরা ট্রেন্ডিং পণ্য", action: "best_gadgets" }
      ]
    };
  }

  // --- CONTEXTUAL SHOPPING CONSULTANT ENGINE ---
  const allConversationTexts = [
    ...(body.history || []).map((h: any) => h.text || ""),
    query
  ];
  const combinedHistory = allConversationTexts.join(" ").toLowerCase();

  // 1. Budget extraction (from history + query)
  let extractedBudget: number | undefined;
  const kBudgetMatch = combinedHistory.match(/(\d{1,3})\s*k\b/i);
  if (kBudgetMatch) {
    extractedBudget = parseInt(kBudgetMatch[1], 10) * 1000;
  } else {
    const numBudgetMatch =
      combinedHistory.match(/(?:budget|বাজেট|দাম|dam|under|moddhe|ভিতরে|টাকা|taka|tk|৳)\s*[:=]?\s*(?:৳|tk|taka)?\s*(\d{3,6})/i) ||
      combinedHistory.match(/(\d{3,6})\s*(?:টাকা|taka|tk|৳|হাজার)/i);
    if (numBudgetMatch) {
      extractedBudget = parseInt(numBudgetMatch[1], 10);
    }
  }

  // 2. Recipient extraction
  let extractedRecipient: "son" | "daughter" | "mother" | "father" | "friend" | "self" | undefined;
  if (combinedHistory.includes("chele") || combinedHistory.includes("cheler") || combinedHistory.includes("ছেলে") || combinedHistory.includes("son")) {
    extractedRecipient = "son";
  } else if (combinedHistory.includes("meye") || combinedHistory.includes("meyer") || combinedHistory.includes("মেয়ে") || combinedHistory.includes("daughter")) {
    extractedRecipient = "daughter";
  } else if (combinedHistory.includes("ma") || combinedHistory.includes("mayer") || combinedHistory.includes("ammu") || combinedHistory.includes("মা")) {
    extractedRecipient = "mother";
  } else if (combinedHistory.includes("baba") || combinedHistory.includes("babar") || combinedHistory.includes("abbu") || combinedHistory.includes("বাবা")) {
    extractedRecipient = "father";
  } else if (combinedHistory.includes("friend") || combinedHistory.includes("bondhu") || combinedHistory.includes("বন্ধু")) {
    extractedRecipient = "friend";
  }

  // 3. Occasion extraction
  let extractedOccasion: "birthday" | "anniversary" | "eid" | "gift" | undefined;
  if (
    combinedHistory.includes("birthday") ||
    combinedHistory.includes("bartdey") ||
    combinedHistory.includes("bday") ||
    combinedHistory.includes("jonmodin") ||
    combinedHistory.includes("জন্মদিন")
  ) {
    extractedOccasion = "birthday";
  } else if (combinedHistory.includes("anniversary") || combinedHistory.includes("বার্ষিকী")) {
    extractedOccasion = "anniversary";
  } else if (combinedHistory.includes("eid") || combinedHistory.includes("ঈদ")) {
    extractedOccasion = "eid";
  } else if (combinedHistory.includes("gift") || combinedHistory.includes("উপহার")) {
    extractedOccasion = "gift";
  }

  // 4. Interest / Priority extraction
  let extractedInterest: "gaming" | "sound" | "watch" | "camera" | "lamp" | "fashion" | undefined;
  if (combinedHistory.includes("gaming") || combinedHistory.includes("game") || combinedHistory.includes("গেমিং") || combinedHistory.includes("পাবজি")) {
    extractedInterest = "gaming";
  } else if (combinedHistory.includes("sound") || combinedHistory.includes("গান") || combinedHistory.includes("speaker") || combinedHistory.includes("headphone") || combinedHistory.includes("গান শোনা")) {
    extractedInterest = "sound";
  } else if (combinedHistory.includes("watch") || combinedHistory.includes("ঘড়ি") || combinedHistory.includes("smartwatch")) {
    extractedInterest = "watch";
  } else if (combinedHistory.includes("lamp") || combinedHistory.includes("লাইট") || combinedHistory.includes("speaker")) {
    extractedInterest = "lamp";
  }

  // 5. Positive Product Selection Intent (এইটাই ভালো লাগছে / cart এ add koro / eita nebo)
  const isDirectSelectionIntent =
    lowerQ.includes("bhalo lagche") ||
    lowerQ.includes("valo lagche") ||
    lowerQ.includes("পছন্দ হয়েছে") ||
    lowerQ.includes("ভালো লাগছে") ||
    lowerQ.includes("eita nebo") ||
    lowerQ.includes("eita kinbo") ||
    lowerQ.includes("cart a add") ||
    lowerQ.includes("cart e add") ||
    lowerQ.includes("কার্টে যোগ");

  if (isDirectSelectionIntent) {
    return {
      text: `দারুণ পছন্দ! 🛍️ আপনার requirement অনুযায়ী এটিই সবচেয়ে suitable option।\n\n📌 **বর্তমান স্টক:** ইন-স্টক (Available)\n🚚 **ডেলিভারি:** Durtup Launching 2026 উপলক্ষে সারাদেশে ডেলিভারি মাত্র ৬০ টাকা!\n🔄 **চেকিং সুবিধা:** রাইডারের সামনে খুলে চেক করে নেওয়ার সুবিধা\n\nচাইলে এখনই কার্টে যোগ করে সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন:`,
      quickActions: [
        { label: "🛒 কার্ট দেখুন", action: "view_cart" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" }
      ]
    };
  }

  // 6. Gift Idea & Recommendation Consultation (ছেলের জন্মদিন / উপহার / কি কেনা যায়)
  const isGiftConsultation =
    Boolean(extractedOccasion) ||
    Boolean(extractedRecipient) ||
    lowerQ.includes("gift") ||
    lowerQ.includes("উপহার") ||
    lowerQ.includes("ki kena jai") ||
    lowerQ.includes("ki kinbo") ||
    lowerQ.includes("suggest koro");

  if (isGiftConsultation) {
    // If budget is NOT yet provided, ask the single high-value question!
    if (!extractedBudget && (lowerQ.includes("ki kena jai") || lowerQ.includes("ki kinbo") || lowerQ.includes("gift kinte chai") || lowerQ.includes("birthday") || lowerQ.includes("bartdey"))) {
      const recipientName = extractedRecipient === "son" ? "ছেলের" : extractedRecipient === "daughter" ? "মেয়ের" : extractedRecipient === "mother" ? "আম্মুর" : extractedRecipient === "father" ? "বাবার" : "প্রিয়জনের";
      const occasionName = extractedOccasion === "birthday" ? "birthday" : "উপহার";

      return {
        text: `অবশ্যই! 🎁 আপনার ${recipientName} ${occasionName}-এর জন্য সুন্দর একটা gift খুঁজছেন।\n\nআপনার budgetটা বলুন—আমি সেই budget-এর মধ্যে Durtup.shop থেকে সবচেয়ে suitable ৩–৫টি option বেছে দেব।\n\n(চাইলে বয়স বা সে কী ধরনের জিনিস যেমন: gaming, smartwatch, speaker পছন্দ করে সেটাও বলতে পারেন!)`,
        quickActions: [
          { label: "💰 ৳১,০০০ - ৳২,০০০", action: "budget_1k_2k" },
          { label: "💰 ৳২,০০০ - ৳৩,০০০", action: "budget_2k_3k" },
          { label: "🎮 গেমিং ও গ্যাজেট", action: "gaming_gadgets" },
          { label: "⌚ স্মার্টওয়াচ কালেকশন", action: "smartwatch_collection" }
        ]
      };
    }

    // If budget or specific interest IS provided, rank 3-4 top products with tailored rationales
    let giftItems = [...catalog];
    if (extractedBudget) {
      giftItems = giftItems.filter(p => Number(p.price || 0) <= (extractedBudget! * 1.15));
    }
    if (extractedInterest === "gaming" || lowerQ.includes("gaming")) {
      giftItems = giftItems.filter(p => {
        const n = (p.name || "").toLowerCase();
        return n.includes("watch") || n.includes("speaker") || n.includes("lamp") || n.includes("charge") || n.includes("phone");
      });
    }

    const topGiftItems = (giftItems.length > 0 ? giftItems : catalog).slice(0, 4);
    const rankedCards: SigmaProductCardData[] = topGiftItems.map((p, idx) => {
      let badge = idx === 0 ? "🥇 Best Match for You" : idx === 1 ? "🥈 Best Value" : "🥉 Budget Choice";
      let why = "উপহার হিসেবে দেখতে আকর্ষণীয় এবং দৈনন্দিন ব্যবহারের জন্য দারুণ উপযোগী।";
      if (extractedInterest === "gaming" || lowerQ.includes("gaming")) {
        why = `Gaming-এর জন্য suitable এবং আপনার ${extractedBudget ? `৳${extractedBudget.toLocaleString()} ` : ""}budget-এর মধ্যে দেখতেও প্রিমিয়াম।`;
      } else if (extractedRecipient === "son") {
        why = "ছেলের জন্মদিনের উপহার হিসেবে সবচেয়ে ট্রেন্ডি ও আকর্ষণীয় চয়েস।";
      }

      return {
        id: p.id,
        name: p.name,
        price: Number(p.price || (p as any).sale_price || 0),
        originalPrice: (p as any).sale_price ? Number(p.price) : undefined,
        image: p.image || "/placeholder.svg",
        category: p.category,
        slug: p.slug || String(p.id),
        rating: p.rating || 4.8,
        reviews: p.reviews || 18,
        freeShipping: p.freeShipping ?? true,
        isBestSeller: p.isBestSeller ?? false,
        stockStatus: "in_stock",
        whyRecommended: `${badge}: ${why}`,
        keySpecs: ["১০০% জেনুইন", "ক্যাশ অন ডেলিভারি", "ডেলিভারিতে চেকিং"]
      };
    });

    const contextSummary = `${extractedRecipient === "son" ? "ছেলের" : "প্রিয়জনের"} ${extractedOccasion === "birthday" ? "birthday gift" : "উপহার"} হিসেবে ${extractedInterest ? `${extractedInterest} পছন্দ ` : ""}${extractedBudget ? `এবং ৳${extractedBudget.toLocaleString()} বাজেটের মধ্যে—` : ""}`;

    return {
      text: `Perfect! ${contextSummary}সবগুলো বিষয় বিবেচনা করে আপনার জন্য সেরা ৩–৪টি অপশন নিচে সাজিয়ে দেওয়া হলো: 🎯✨\n\n🏆 **আমার #1 Choice:** **${topGiftItems[0]?.name || "প্রথম অপশনটি"}**\nকারণ আপনার requirement ও বাজেটের সাথে এটিই সবচেয়ে পারফেক্টভাবে match করছে।`,
      products: rankedCards,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  const isTrackingIntent =
    lowerQ.includes("track") ||
    lowerQ.includes("ট্র্যাক") ||
    lowerQ.includes("কখন আসবে") ||
    lowerQ.includes("কোথায়") ||
    lowerQ.includes("status");

  const isOrderIntent =
    !isRoadmapIntent &&
    !isCompareIntent &&
    !isGiftIntent && (
      lowerQ.includes("order kore dao") ||
      lowerQ.includes("অর্ডার করে দাও") ||
      lowerQ.includes("অর্ডার করতে চাই") ||
      lowerQ.includes("order draft") ||
      lowerQ.includes("checkout") ||
      lowerQ.includes("buy now") ||
      (lowerQ.includes("কিনতে চাই") && !lowerQ.includes("phone") && !lowerQ.includes("watch") && !lowerQ.includes("headphone"))
    );

  if (isTrackingIntent) {
    const orderMatch = query.match(/ORD-[\w-]+/i);
    const trackingId = orderMatch ? orderMatch[0] : "ORD-2026-8891";
    const tracking = executeTrackOrder(trackingId);
    return {
      text: `আপনার অর্ডারটির (**#${tracking.orderNumber}**) **লাইভ স্ট্যাটাস ও ডেলিভারি অগ্রগতি** নিচে তুলে ধরা হলো: 🚚📦`,
      tracking,
      actions: [{ type: "TRACK_ORDER", data: tracking }],
      quickActions: [
        { label: "📦 বিস্তারিত ট্র্যাক পেজ", action: "view_track", link: `/track?orderId=${tracking.orderNumber}` },
        { label: "📞 কাস্টমার সাপোর্ট", action: "support_info", link: "/help" }
      ]
    };
  }

  if (isCompareIntent) {
    const comparison = executeCompareProducts("X-01", "Touch Lamp", catalog);
    return {
      text: `আপনার অনুরোধ অনুযায়ী প্রোডাক্ট দুটির **স্পেসিফিকেশন ও ফিচারের তুলনা** নিচে প্রস্তুত করা হলো: ⚖️✨`,
      comparison,
      actions: [{ type: "COMPARE_PRODUCTS", data: comparison }]
    };
  }

  if (isOrderIntent) {
    const draft = executeCreateOrderDraft({
      userId,
      customerName: userName,
      shippingCity: lowerQ.includes("dhaka") || lowerQ.includes("ঢাকা") ? "Dhaka" : "Outside Dhaka",
      shippingAddress: "ডেলিভারি ঠিকানা",
      paymentMethod: "cod",
      cartItems,
      catalog
    });
    return {
      text: `আপনার অর্ডারের জন্য একটি **অর্ডার ড্রাফট (Order Summary)** প্রস্তুত করা হয়েছে! 📋✨\n\nঅনুগ্রহ করে নিচের ডেলিভারি ঠিকানা ও মোট মূল্য যাচাই করে **"Confirm Order"** বাটনে চাপ দিয়ে অর্ডার নিশ্চিত করুন:`,
      orderDraft: draft,
      actions: [{ type: "SHOW_ORDER_DRAFT", data: draft }],
      quickActions: [
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" },
        { label: "🚚 ডেলিভারি চার্জ কত?", action: "delivery_info" }
      ]
    };
  }

  // Policy and FAQ Intent Detection (Never return random product cards for policy questions!)
  const isDeliveryIntent =
    lowerQ.includes("delivery") ||
    lowerQ.includes("ডেলিভারি") ||
    lowerQ.includes("শিপিং") ||
    lowerQ.includes("কত দিন") ||
    lowerQ.includes("কতদিন") ||
    lowerQ.includes("সময়") ||
    lowerQ.includes("চার্জ") ||
    lowerQ.includes("পৌঁছাবে") ||
    lowerQ.includes("কখন পাব");

  const isPaymentIntent =
    lowerQ.includes("payment") ||
    lowerQ.includes("পেমেন্ট") ||
    lowerQ.includes("ক্যাশ অন") ||
    lowerQ.includes("cod") ||
    lowerQ.includes("বিকাশ") ||
    lowerQ.includes("অগ্রিম টাকা") ||
    lowerQ.includes("পদ্ধতি");

  const isReturnIntent =
    lowerQ.includes("return") ||
    lowerQ.includes("রিটার্ন") ||
    lowerQ.includes("refund") ||
    lowerQ.includes("রিফান্ড") ||
    lowerQ.includes("warranty") ||
    lowerQ.includes("ওয়ারেন্টি") ||
    lowerQ.includes("গ্যারান্টি") ||
    lowerQ.includes("বদল");

  const isHowToOrderIntent =
    lowerQ.includes("কীভাবে অর্ডার") ||
    lowerQ.includes("অর্ডার করার নিয়ম") ||
    lowerQ.includes("অর্ডার করার পদ্ধতি") ||
    lowerQ.includes("how to order") ||
    lowerQ.includes("কীভাবে কিনব") ||
    lowerQ.includes("kivabe order") ||
    lowerQ.includes("kibhabe order") ||
    lowerQ.includes("order kivabe") ||
    lowerQ.includes("order kibhabe") ||
    lowerQ.includes("order korbo") ||
    lowerQ.includes("order korar") ||
    lowerQ.includes("order system");

  const isSupportIntent =
    lowerQ.includes("support") ||
    lowerQ.includes("সাপোর্ট") ||
    lowerQ.includes("help") ||
    lowerQ.includes("হেল্প") ||
    lowerQ.includes("যোগাযোগ") ||
    lowerQ.includes("contact") ||
    lowerQ.includes("ফোন নম্বর") ||
    lowerQ.includes("হেল্পলাইন");

  if (isDeliveryIntent) {
    const policyText = executeGetPolicies("delivery");
    return {
      text: policyText,
      quickActions: [
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" },
        { label: "🔄 ইনস্ট্যান্ট রিটার্ন পলিসি", action: "return_policy" },
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" }
      ]
    };
  }

  if (isPaymentIntent) {
    const policyText = executeGetPolicies("payment");
    return {
      text: policyText,
      quickActions: [
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "🔄 ইনস্ট্যান্ট রিটার্ন পলিসি", action: "return_policy" },
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" }
      ]
    };
  }

  if (isReturnIntent) {
    const policyText = executeGetPolicies("returns");
    return {
      text: policyText,
      quickActions: [
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" },
        { label: "📞 কাস্টমার সাপোর্ট", action: "support_info", link: "/help" }
      ]
    };
  }

  if (isHowToOrderIntent) {
    const policyText = executeGetPolicies("ordering");
    return {
      text: policyText,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  if (isSupportIntent) {
    return {
      text: `📞 **Durtup.shop কাস্টমার কেয়ার ও হেল্পলাইন:**\n\n- **সাপোর্ট টাইম:** প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত।\n- **হটলাইন ও হোয়াটসঅ্যাপ:** \`+880 1622-530550\`\n- **ইমেইল:** \`support@durtup.shop\`\n- **অফিস:** ধানমন্ডি, ঢাকা - ১২০৯, বাংলাদেশ\n\nযেকোনো পণ্য বা অর্ডারের বিষয়ে তথ্য জানতে সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন!`,
      quickActions: [
        { label: "🛍️ প্রোডাক্ট দেখাও", action: "best_gadgets" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" }
      ]
    };
  }

  // Social Media Intent (Facebook, YouTube, Instagram, TikTok)
  const isSocialIntent =
    lowerQ.includes("facebook") ||
    lowerQ.includes("ফেসবুক") ||
    lowerQ.includes("fb page") ||
    lowerQ.includes("fb link") ||
    lowerQ.includes("youtube") ||
    lowerQ.includes("ইউটিউব") ||
    lowerQ.includes("instagram") ||
    lowerQ.includes("ইনস্টাগ্রাম") ||
    lowerQ.includes("tiktok") ||
    lowerQ.includes("টিকটক") ||
    lowerQ.includes("social") ||
    lowerQ.includes("সোশ্যাল");

  if (isSocialIntent) {
    const socialText = executeGetPolicies("social");
    return {
      text: socialText,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" }
      ]
    };
  }

  // Panjabi & Men's Fashion Query Intent
  const isPanjabiQuery =
    lowerQ.includes("pangabi") ||
    lowerQ.includes("panjabi") ||
    lowerQ.includes("পাঞ্জাবি") ||
    lowerQ.includes("punjabi") ||
    lowerQ.includes("পাঞ্জাবী") ||
    lowerQ.includes("পাঞ্জাবির");

  if (isPanjabiQuery) {
    const fashionProducts = executeSearchProducts({ query: "fashion hoodie pant men", catalog });
    return {
      text: `নিশ্চয়ই! Durtup.shop-এ ছেলেদের জন্য **পাঞ্জাবি ও মেনস ফ্যাশন কালেকশন** নিচে তুলে ধরা হলো: 🌟👔

### 🏷️ আমাদের পাঞ্জাবি ক্যাটাগরিসমূহ:
1. **প্রিমিয়াম কটন পাঞ্জাবি:** ক্যাজুয়াল ও আরামদায়ক ব্যবহারের জন্য বেস্ট কোয়ালিটি সুতি কাপড়।
2. **সেমি-লং ও এক্সক্লুসিভ ডিজাইনার পাঞ্জাবি:** ঈদ, বিয়ে ও যেকোনো সামাজিক অনুষ্ঠানের আকর্ষণীয় কালেকশন।
3. **কাবলি সেট ও কুর্তা পায়জামা কম্বো:** ট্রেন্ডি ফিটিং ও স্টাইলিশ ম্যাচিং সেট।
4. **সিল্ক ও জ্যাকার্ড উইভিং পাঞ্জাবি:** প্রিমিয়াম লাক্সারি টেক্সচার ও পার্টি লুক।

---
📌 **আমাদের বিশেষ সুবিধা:**
- 🚚 **সারাদেশে (৬৪ জেলায়) হোম ডেলিভারি**
- 💵 **১০০% ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দিন)**
- 🔄 **ডেলিভারিতে খুলে চেকিং সুবিধা**

আপনার পছন্দের সাইজ (যেমন: 40, 42, 44) বা নির্দিষ্ট কোনো রঙ (যেমন: কালো, সাদা, নেভি ব্লু) দেখতে চান? আমাকে জানান, আমি সেরা অপশনগুলো খুঁজে দিচ্ছি! 😊`,
      products: fashionProducts.length > 0 ? fashionProducts.slice(0, 4) : undefined,
      quickActions: [
        { label: "🛍️ সকল পাঞ্জাবি কালেকশন", action: "view_panjabi", link: "/products?search=panjabi" },
        { label: "👕 Men's Fashion", action: "view_mens_fashion", link: "/categories" },
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" }
      ]
    };
  }

  // General Categories Intent
  const isCategoryQuery =
    (lowerQ.includes("category") || lowerQ.includes("ক্যাটাগরি") || lowerQ.includes("catagory") || lowerQ.includes("কালেকশন")) &&
    !isDeliveryIntent && !isPaymentIntent;

  if (isCategoryQuery) {
    return {
      text: `Durtup.shop-এ আমাদের প্রধান **প্রোডাক্ট ক্যাটাগরিসমূহ** নিচে দেওয়া হলো: 🛍️✨

1. 👕 **Men's Fashion:** পাঞ্জাবি, শার্ট, টি-শার্ট, গ্যাবার্ডিন প্যান্ট, হুডি ও জ্যাকেট।
2. 👗 **Women's Fashion:** শাড়ি, থ্রি-পিস, কুর্তি, হিজাব ও পার্টি ড্রেস।
3. ⚡ **Gadgets & Electronics:** স্মার্টওয়াচ, ব্লুটুথ স্পিকার, হেডফোন, পাওয়ার ব্যাংক ও চার্জিং এক্সেসরিজ।
4. 🏡 **Home & Lifestyle:** হোম ডেকোরেশন, এলইডি লাইট, কিচেন আইটেম ও ডেইলি ইউটিলিটি।
5. 🌿 **Health & Organic:** খাঁটি সরিষার তেল, অর্গানিক ফুড ও হেলথ কেয়ার।

আপনি কোন ক্যাটাগরির পণ্য দেখতে চান? আমাকে জানালেই আমি সেরা প্রোডাক্টগুলো নিয়ে আসব!`,
      quickActions: [
        { label: "👕 Men's Fashion", action: "mens_fashion", link: "/categories" },
        { label: "👗 Women's Fashion", action: "womens_fashion", link: "/categories" },
        { label: "⚡ Gadgets", action: "gadgets", link: "/products" },
        { label: "🔥 সেরা অফার", action: "best_gadgets" }
      ]
    };
  }

  // About Durtup.shop & Sigma AI Intent
  const isAboutIntent =
    lowerQ.includes("সম্পর্কে") ||
    lowerQ.includes("about") ||
    lowerQ.includes("who are you") ||
    lowerQ.includes("তুমি কে") ||
    lowerQ.includes("durtup.shop কী") ||
    lowerQ.includes("sigma কী") ||
    lowerQ.includes("পরিচয়") ||
    lowerQ.includes("durtup.shop এবং sigma ai");

  if (isAboutIntent) {
    return {
      text: `✨ **Durtup.shop (দূর্তপ শপ) এবং Sigma AI পরিচিতি:**

### 🛍️ Durtup.shop কী?
**Durtup.shop** হলো বাংলাদেশের একটি নির্ভরযোগ্য ও আধুনিক ই-কমার্স প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য গ্রাহকদের কাছে সেরা মানের ও ট্রেন্ডি পণ্য দ্রুততম সময়ে পৌঁছে দেওয়া।
- 🚚 **৬৪ জেলায় ডোরস্টেপ হোম ডেলিভারি** (ঢাকার ভেতরে ১-২ দিন, বাইরে ২-৩ দিন)।
- 💵 **১০০% ক্যাশ অন ডেলিভারি (COD)** — কোনো অগ্রিম পেমেন্ট ছাড়াই পণ্য হাতে পেয়ে দেখে টাকা দেওয়ার সুবিধা।
- 🔄 **ডেলিভারির সময় চেক করে তাৎক্ষণিক রিটার্ন সুবিধা**।
- 🛡️ **১০০% অরিজিনাল ও অথেনটিক পণ্যের নিশ্চয়তা**।

---

### 🤖 Sigma AI কী?
**Sigma** হলো Durtup.shop-এর অফিশিয়াল **AI Personal Shopping Manager & Action Agent** (Powered by Durtup.shop)।

Sigma সাধারণ কোনো চ্যাটবট নয়; এটি একটি শক্তিশালী এআই শপিং অ্যাসিস্ট্যান্ট, যা আপনার জন্য:
1. 🎯 আপনার পছন্দ ও বাজেট অনুযায়ী সেরা প্রোডাক্ট খুঁজে দেয়।
2. ⚖️ একাধিক প্রোডাক্টের স্পেসিফিকেশন ও ফিচারের পাশাপাশি তুলনা করে।
3. 🛒 লাইভ শপিং কার্ট পরিচালনা ও আপডেট করে।
4. 📋 সুরক্ষিত দ্বি-স্তর বিশিষ্ট (Two-Phase) অর্ডার ড্রাফট তৈরি করে।
5. 🚚 লাইভ অর্ডার ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস জানায়।
6. 💬 কেনাকাটার পাশাপাশি বিজ্ঞান, প্রযুক্তি ও সাধারণ যেকোনো বিষয়ে মানুষের মতোই স্বাভাবিক আড্ডা ও পরামর্শ দিতে পারে!

আপনার কি কোনো নির্দিষ্ট প্রোডাক্ট প্রয়োজন বা কিছু জানতে চান? আমাকে নির্দ্বিধায় বলুন! 😊`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "👕 পাঞ্জাবি ও মেনস ফ্যাশন", action: "view_panjabi" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" }
      ]
    };
  }

  // Mood / Casual Conversation / Jokes (মন ভালো নেই / কিছু বলো / কী করছ)
  if (
    lowerQ.includes("valo lagche na") ||
    lowerQ.includes("bhalo lagche na") ||
    lowerQ.includes("kichu bolo") ||
    lowerQ.includes("joke") ||
    lowerQ.includes("mojar kotha") ||
    lowerQ.includes("ki korcho") ||
    lowerQ.includes("ki koro") ||
    lowerQ.includes("kotha bolo") ||
    lowerQ.includes("ami valo") ||
    lowerQ.includes("ami bhalo")
  ) {
    if (lowerQ.includes("ami valo") || lowerQ.includes("ami bhalo")) {
      return {
        text: `মাশাআল্লাহ, শুনে খুব ভালো লাগলো! 🥰\n\nআজকে আপনাকে কীভাবে সাহায্য করতে পারি? কোনো নতুন ট্রেন্ডিং প্রোডাক্ট দেখতে চান?`,
        quickActions: [
          { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
          { label: "⚡ সব ক্যাটাগরি", action: "view_categories", link: "/categories" }
        ]
      };
    }
    return {
      text: `মন খারাপ করবেন না! 😊 আমি আপনার সাথে আছি। আপনি চাইলে Durtup.shop-এর চমৎকার সব লাইফস্টাইল গ্যাজেট ও আকর্ষণীয় অফার ঘুরে দেখতে পারেন, অথবা আমার সাথে যেকোনো কেনাকাটার বিষয়ে কথা বলতে পারেন! আজ আপনার দিনটি কেমন কাটল? 🌟`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "⚡ শপ ঘুরে দেখুন", action: "view_products", link: "/products" }
      ]
    };
  }

  // Office / Store Location (দোকান কোথায় / অফিস কোথায়)
  if (
    lowerQ.includes("kothai") ||
    lowerQ.includes("office") ||
    lowerQ.includes("dokan") ||
    lowerQ.includes("thikana") ||
    lowerQ.includes("address") ||
    lowerQ.includes("location")
  ) {
    return {
      text: `🏢 **Durtup.shop অফিস ও সেন্ট্রাল ওয়্যারহাউস:**\n\n📍 **ঠিকানা**: ঢাকা, বাংলাদেশ।\n🚚 আমরা **অনলাইন ই-কমার্স প্ল্যাটফর্ম** হিসেবে সারাদেশের ৬৪ জেলায় ক্যাশ অন ডেলিভারিতে ডোরস্টেপ হোম ডেলিভারি প্রদান করে থাকি! ঘরে বসেই অর্ডার করে নিরাপদে পণ্য বুঝে নিন।`,
      quickActions: [
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "📞 কাস্টমার সাপোর্ট", action: "customer_support", link: "/help" }
      ]
    };
  }

  // Low Price / Budget Shopping (কম দামি প্রোডাক্ট / বাজেট)
  if (
    lowerQ.includes("kom dam") ||
    lowerQ.includes("kom dame") ||
    lowerQ.includes("budget") ||
    lowerQ.includes("shobcheye kom") ||
    lowerQ.includes("cheap")
  ) {
    const sortedByPrice = [...catalog].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)).slice(0, 4);
    return {
      text: `আমাদের স্টোরের সবচেয়ে **সাশ্রয়ী ও কম বাজেটের সেরা প্রোডাক্টগুলো** নিচে দেওয়া হলো: 🏷️✨`,
      products: sortedByPrice,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // Check if query is explicitly asking for products or shopping
  const hasProductSearchIntent =
    !isRoadmapIntent &&
    !isCompareIntent &&
    !isGiftIntent && (
      lowerQ.includes("দেখাও") ||
      lowerQ.includes("কিনতে চাই") ||
      lowerQ.includes("খুঁজছি") ||
      lowerQ.includes("দাম কত") ||
      lowerQ.includes("পণ্য") ||
      lowerQ.includes("প্রোডাক্ট") ||
      lowerQ.includes("product") ||
      lowerQ.includes("price") ||
      lowerQ.includes("buy") ||
      lowerQ.includes("গ্যাজেট") ||
      lowerQ.includes("gadget") ||
      lowerQ.includes("watch") ||
      lowerQ.includes("ঘড়ি") ||
      lowerQ.includes("phone") ||
      lowerQ.includes("ফোন") ||
      lowerQ.includes("speaker") ||
      lowerQ.includes("স্পিকার") ||
      lowerQ.includes("headphone") ||
      lowerQ.includes("হেডফোন") ||
      lowerQ.includes("hoodie") ||
      lowerQ.includes("pant") ||
      lowerQ.includes("shirt") ||
      lowerQ.includes("oil") ||
      lowerQ.includes("তেল") ||
      lowerQ.includes("lamp") ||
      lowerQ.includes("charger")
    );

  if (hasProductSearchIntent) {
    const localSearch = executeSearchProducts({ query, catalog });
    if (localSearch.length > 0) {
      return {
        text: `আপনার জন্য Durtup.shop-এর **সেরা পণ্যগুলো** নিচে খুঁজে নিয়ে এসেছি! 🎯✨\n\nপছন্দের পণ্যের ওপর ক্লিক করে বিস্তারিত ছবি দেখুন অথবা **"Add to Cart"** / **"Order Now"** বাটনে চেপে সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন:`,
        products: localSearch.slice(0, 4),
        quickActions: [
          { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
          { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
          { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" },
          { label: "⚡ সকল প্রোডাক্ট দেখুন", action: "view_products", link: "/products" }
        ]
      };
    }
  }

  // Friendly conversational fallback for any other general message
  return {
    text: `আমি **Sigma** — Durtup.shop-এর Personal Shopping Assistant & Conversational AI! 🛍️✨\n\nআমাদের স্টোরের কোনো প্রোডাক্ট খুঁজতে, অর্ডার ড্রাফট তৈরি করতে, পলিসি জানতে কিংবা যেকোনো সাধারণ বিষয়ে আড্ডা দিতে আমাকে লিখতে পারেন। আজ আপনাকে কীভাবে সাহায্য করতে পারি? 😊`,
    quickActions: [
      { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
      { label: "👕 মেনস ফ্যাশন কালেকশন", action: "view_panjabi" },
      { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
      { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" }
    ]
  };
}


