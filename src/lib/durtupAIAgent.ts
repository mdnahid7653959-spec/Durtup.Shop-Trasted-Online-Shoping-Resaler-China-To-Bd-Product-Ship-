/**
 * SIGMA — Powered by Durtup.shop
 * Client-Side AI Personal Shopping Manager & Action Integration Layer
 */

import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import type { Product } from "@/components/products/ProductCard";
import { getCachedMohasagorProducts } from "@/utils/mohasagorCache";
import { 
  RECOMMENDED_QUESTIONS, 
  ACTION_TO_QUESTION_ID,
  type RecommendedQuestion 
} from "@/data/sigmaKnowledgeBase";
import type {
  SigmaChatResponse,
  SigmaProductCardData,
  SigmaComparisonData,
  SigmaOrderDraft,
  SigmaTrackingData,
  SigmaSupportTicketData,
  SigmaActionPayload
} from "@/server/sigmaServerEngine";

export type {
  SigmaChatResponse,
  SigmaProductCardData,
  SigmaComparisonData,
  SigmaOrderDraft,
  SigmaTrackingData,
  SigmaSupportTicketData,
  SigmaActionPayload
};

export interface ChatHistoryItem {
  sender: "user" | "ai";
  text: string;
  userImage?: string;
}

export interface AIMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  userImage?: string;
  products?: SigmaProductCardData[];
  comparison?: SigmaComparisonData;
  orderDraft?: SigmaOrderDraft;
  tracking?: SigmaTrackingData;
  ticket?: SigmaSupportTicketData;
  toolActivity?: string;
  quickActions?: Array<{ label: string; action: string; link?: string }>;
}

function getFilterProducts(filter: string, catalog: Product[]): SigmaProductCardData[] {
  let list = [...catalog];

  if (filter === "smartwatch") {
    const exclude = ["oil", "food", "cable", "water", "pant", "hoodie", "mustard", "dispenser", "pump"];
    const sw = list.filter(p => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      if (exclude.some(x => n.includes(x) || c.includes(x))) return false;
      return (
        n.includes("smart watch") ||
        n.includes("smartwatch") ||
        n.includes("watch") ||
        n.includes("ঘড়ি") ||
        c.includes("watch")
      );
    });
    if (sw.length > 0) list = sw;
  } else if (filter === "audio") {
    const exclude = ["oil", "food", "cable", "water", "pump", "dispenser", "pant", "hoodie", "battery charger", "separator", "mustard"];
    const aud = list.filter(p => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      if (exclude.some(x => n.includes(x) || c.includes(x))) return false;
      return (
        n.includes("speaker") ||
        n.includes("sound") ||
        n.includes("earbud") ||
        n.includes("headphone") ||
        n.includes("airpod") ||
        n.includes("bluetooth receiver") ||
        n.includes("mp3 player") ||
        n.includes("ইয়ারবাড") ||
        c.includes("audio") ||
        c.includes("headphone")
      );
    });
    if (aud.length > 0) list = aud;
  } else if (filter === "charger") {
    // Strictly actual PD charging cables, power banks, fast adapters - NO water pumps, battery slots, dispensers
    const exclude = ["water", "dispenser", "pump", "oil", "food", "pant", "hoodie", "toy", "drone", "helicopter", "battery charger", "gripper", "trimmer", "derma", "mustard", "ঘি", "মধু"];
    const ch = list.filter(p => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      if (exclude.some(x => n.includes(x) || c.includes(x))) return false;
      return (
        n.includes("fast charging") ||
        n.includes("type-c") ||
        n.includes("cable") ||
        n.includes("power bank") ||
        n.includes("powerbank") ||
        n.includes("adapter") ||
        n.includes("charging") ||
        n.includes("separator") ||
        n.includes("240w") ||
        n.includes("pd") ||
        n.includes("পাওয়ার") ||
        n.includes("চার্জার")
      );
    });
    if (ch.length > 0) list = ch;
  } else if (filter === "budget") {
    const exclude = ["oil", "food", "mustard", "তেল", "খাবার", "ghee", "ঘি", "honey", "মধু", "pant", "trouser", "gloves", "water dispenser", "water pump", "pump"];
    const budgetTech = list.filter(p => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      if (exclude.some(x => n.includes(x) || c.includes(x))) return false;
      return Number(p.price || (p as any).sale_price || 0) <= 1000;
    }).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (budgetTech.length > 0) list = budgetTech;
  } else if (filter === "gifts") {
    // Curated Gift Items ONLY: Showpieces, Globes, Smartwatches, Rings, Projectors, Crystal Lights, Gift Boxes
    const exclude = ["oil", "food", "mustard", "খাবার", "cable", "separator", "converter", "pant", "grocery", "dispenser", "water", "pump", "battery", "trimmer", "derma", "hoodie", "trouser"];
    const giftMatches = list.filter(p => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      if (exclude.some(term => n.includes(term) || c.includes(term))) return false;
      return (
        n.includes("gift") ||
        n.includes("showpiece") ||
        n.includes("globe") ||
        n.includes("eiffel") ||
        n.includes("crystal ball") ||
        n.includes("projector") ||
        n.includes("ring") ||
        n.includes("smart watch") ||
        n.includes("smartwatch") ||
        n.includes("mystery box") ||
        n.includes("magic box") ||
        n.includes("magic mug") ||
        n.includes("pillow") ||
        n.includes("perfume") ||
        c.includes("gift") ||
        c.includes("watch")
      );
    });
    if (giftMatches.length > 0) list = giftMatches;
  } else if (filter === "trending") {
    // Show premium electronics and gadgets, strictly filtering out raw groceries/oils/pumps
    const exclude = ["oil", "food", "mustard", "খাবার", "ghee", "ঘি", "honey", "মধু", "dispenser", "water pump", "pump", "pant", "trouser"];
    const trendingGadgets = list.filter(p => {
      const n = (p.name || "").toLowerCase();
      const c = (p.category || "").toLowerCase();
      if (exclude.some(term => n.includes(term) || c.includes(term))) return false;
      return (
        n.includes("smart watch") ||
        n.includes("smartwatch") ||
        n.includes("projector") ||
        n.includes("speaker") ||
        n.includes("router") ||
        n.includes("light") ||
        n.includes("earbud") ||
        n.includes("type-c") ||
        n.includes("fast charging") ||
        c.includes("gadget") ||
        c.includes("watch")
      );
    });
    if (trendingGadgets.length > 0) list = trendingGadgets;
  }

  return list.slice(0, 4).map(p => ({
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
    keySpecs: ["১০০% জেনুইন", "ক্যাশ অন ডেলিভারি", "ডেলিভারিতে চেকিং"]
  }));
}

/**
 * Call the Secure Server-Side Endpoint /api/ai/chat
 */
export async function askSigmaAIAgent(
  query: string,
  options?: {
    userName?: string;
    userId?: string;
    catalog?: Product[];
    cartState?: any[];
    imageAttachment?: { base64: string; mimeType: string; previewUrl?: string };
    history?: ChatHistoryItem[];
    pageContext?: {
      currentPath?: string;
      productId?: string;
      categorySlug?: string;
    };
    userOrders?: any[];
  }
): Promise<SigmaChatResponse> {
  const cleanEmoji = (s: string) => s.replace(/\p{Extended_Pictographic}|\u200d|\uFE0F|\uFE0E/gu, "").trim().toLowerCase();
  const qRaw = query.trim().toLowerCase();
  const qClean = cleanEmoji(query);
  const userName = options?.userName || "";

  // 0. Live User Order Tracking Action (Directly inside chat without redirect)
  if (
    qRaw === "check_my_live_order" ||
    qClean.includes("সরাসরি ট্র্যাক") ||
    qClean.includes("আমার অর্ডার কোথায়") ||
    qClean.includes("আমার পার্সেল কোথায়") ||
    qClean.includes("আমার অর্ডারটি কোথায়") ||
    qClean.includes("লাইভ ট্র্যাক")
  ) {
    const orders = options?.userOrders || [];
    let activeOrder = orders.length > 0 ? orders[0] : null;

    if (!activeOrder && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("durtup_recent_orders");
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list) && list.length > 0) activeOrder = list[0];
        }
      } catch (e) {}
    }

    if (activeOrder) {
      const orderNumber = activeOrder.order_number || (activeOrder.id ? (String(activeOrder.id).startsWith("ORD-") ? activeOrder.id : `ORD-${activeOrder.id}`) : "ORD-78921");
      const status = (activeOrder.status || "processing").toLowerCase();
      let statusBengali = "প্রক্রিয়াধীন (Processing)";
      let step = 2;
      if (status === "pending") {
        statusBengali = "অর্ডার গ্রহণ করা হয়েছে (Pending)";
        step = 1;
      } else if (status === "processing") {
        statusBengali = "প্যাকিং ও প্রক্রিয়া চলছে (Processing)";
        step = 2;
      } else if (status === "shipped") {
        statusBengali = "কুরিয়ারে হস্তান্তর হয়েছে (Shipped)";
        step = 3;
      } else if (status === "out_for_delivery") {
        statusBengali = "ডেলিভারিতে বের হয়েছে (Out for Delivery)";
        step = 4;
      } else if (status === "delivered") {
        statusBengali = "ডেলিভারি সম্পন্ন (Delivered)";
        step = 5;
      }

      const trackingData: SigmaTrackingData = {
        orderId: activeOrder.id || orderNumber,
        orderNumber: orderNumber,
        status: status,
        statusBengali: statusBengali,
        step: step,
        total: Number(activeOrder.total || 0),
        estimatedDelivery: "১-২ কার্যদিবস",
        trackingNumber: activeOrder.tracking_code || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        recipientName: activeOrder.shipping_address?.first_name || userName || "সম্মানিত গ্রাহক",
        address: activeOrder.shipping_address?.address || activeOrder.shipping_address?.city || "ঢাকা, বাংলাদেশ",
        items: activeOrder.order_items || activeOrder.items || [{ name: "অর্ডারকৃত গ্যাজেট", quantity: 1, price: activeOrder.total || 0 }],
        createdAt: activeOrder.created_at ? new Date(activeOrder.created_at).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })
      };

      return {
        text: `আসসালামু আলাইকুম **${userName || "সম্মানিত গ্রাহক"}**! 👋\n\nআপনার সাম্প্রতিক অর্ডার **#${orderNumber}**-এর বর্তমান লাইভ ট্র্যাকিং স্ট্যাটাস নিচে তুলে ধরা হলো: 📦🚚`,
        tracking: trackingData,
        quickActions: [
          { label: "🔥 সেরা নতুন গ্যাজেট", action: "best_gadgets" },
          { label: "📞 কাস্টমার সাপোর্ট", action: "customer_support" },
          { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
        ]
      };
    } else {
      // If user has NO active orders -> Warm attractive shopping invitation with trending products
      const cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
      const trendingProducts = getFilterProducts("trending", cat);

      return {
        text: `আসসালামু আলাইকুম ${userName ? `**${userName}**` : ""}! 👋\n\nবর্তমানে আপনার অ্যাকাউন্টে কোনো রানিং বা সক্রিয় অর্ডার পাওয়া যায়নি। 🛍️✨\n\nতবে একদম চিন্তা করবেন না! **Durtup Launching 2026** অফার উপলক্ষে ঢাকা ও সারাদেশে হোম ডেলিভারি চার্জ মাত্র **৬০ টাকা** এবং **১০০% ক্যাশ অন ডেলিভারি (পণ্য দেখে মূল্য পরিশোধ)** সুবিধা চলছে।\n\nআজই নিচের আকর্ষণীয় ট্রেন্ডিং গ্যাজেটগুলো দেখে আপনার পছন্দের পণ্যটি সহজে অর্ডার করুন:`,
        products: trendingProducts,
        quickActions: [
          { label: "🔥 সেরা গ্যাজেট কালেকশন", action: "best_gadgets" },
          { label: "💰 কম বাজেটের প্রোডাক্ট", action: "budget_search" },
          { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
          { label: "🚚 ডেলিভারি চার্জ কত?", action: "delivery_info" }
        ]
      };
    }
  }

  // 1. Direct Knowledge Base Match for Recommended Questions (Action ID, clean questions, short labels)
  const targetId = ACTION_TO_QUESTION_ID[qRaw] || ACTION_TO_QUESTION_ID[qClean];
  let matchedKb: RecommendedQuestion | undefined;
  if (targetId) {
    matchedKb = RECOMMENDED_QUESTIONS.find(item => item.id === targetId);
  }

  if (!matchedKb) {
    matchedKb = RECOMMENDED_QUESTIONS.find(item => {
      const qLower = item.question.toLowerCase();
      const qCleanItem = cleanEmoji(item.question);
      const shortLower = (item.shortLabel || "").toLowerCase();
      const shortCleanItem = cleanEmoji(item.shortLabel || "");
      const idLower = item.id.toLowerCase();

      return (
        qRaw === idLower ||
        qClean === idLower ||
        qRaw === qLower ||
        qClean === qCleanItem ||
        qRaw === shortLower ||
        qClean === shortCleanItem ||
        (qClean.length > 2 && qCleanItem.includes(qClean)) ||
        (qClean.length > 2 && shortCleanItem.includes(qClean)) ||
        (qCleanItem.length > 4 && qClean.includes(qCleanItem)) ||
        (shortCleanItem.length > 3 && qClean.includes(shortCleanItem))
      );
    });
  }

  // 2. High-Priority Direct Intent Aliases if not matched by text
  if (!matchedKb) {
    if (qClean.includes("সাপোর্ট") || qClean.includes("support") || qClean.includes("হেল্পলাইন") || qClean.includes("helpline") || qClean.includes("কাস্টমার কেয়ার") || qClean.includes("কাস্টমার") || qClean.includes("যোগাযোগ") || qRaw === "customer_support") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "sup-2");
    } else if (qClean.includes("ডেলিভারি চার্জ") || qClean.includes("ডেলিভারি সময়") || qClean.includes("ডেলিভারি খরচ") || qRaw === "delivery_info" || (qClean.includes("ডেলিভারি") && (qClean.includes("চার্জ") || qClean.includes("সময়") || qClean.includes("কত")))) {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-3");
    } else if (qClean.includes("ক্যাশ অন") || qClean.includes("পেমেন্ট") || qClean.includes("payment") || qClean.includes("বিকাশ") || qClean.includes("bkash") || qRaw === "payment_info") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "del-4") || RECOMMENDED_QUESTIONS.find(k => k.id === "pop-4");
    } else if (qClean.includes("অর্ডার করার নিয়ম") || qClean.includes("কীভাবে অর্ডার") || (qClean.includes("অর্ডার") && (qClean.includes("সহজ") || qClean.includes("পদ্ধতি") || qClean.includes("করব"))) || qRaw === "how_to_order") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-1");
    } else if (qClean.includes("ট্র্যাক") || qClean.includes("ট্র্যাকিং") || qClean.includes("track") || qRaw === "track_order") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-7");
    } else if (qClean.includes("রিটার্ন") || qClean.includes("রিপ্লেসমেন্ট") || qClean.includes("ফেরত") || qRaw === "return_policy") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-5");
    } else if (qClean.includes("কম বাজেট") || qClean.includes("কম দাম") || qClean.includes("budget") || qRaw === "budget_search") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-6");
    } else if (qClean.includes("সেরা গ্যাজেট") || qClean.includes("ট্রেন্ডিং") || qClean.includes("trending") || qRaw === "best_gadgets") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-2");
    } else if (qClean.includes("স্মার্টওয়াচ") || qClean.includes("smartwatch") || qRaw === "smartwatch_collection") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-2");
    } else if (qClean.includes("ইয়ারবাড") || qClean.includes("হেডফোন") || qClean.includes("audio") || qClean.includes("earbud") || qRaw === "audio_collection") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-1");
    } else if (qClean.includes("চার্জার") || qClean.includes("পাওয়ার ব্যাংক") || qClean.includes("charger") || qClean.includes("powerbank") || qRaw === "charger_collection") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-3");
    } else if (qClean.includes("অফিস") || qClean.includes("ওয়্যারহাউস") || qClean.includes("লোকেশন") || qRaw === "office_location") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "sup-3");
    } else if (qClean.includes("রিফান্ড") || qClean.includes("টাকা ফেরত") || qRaw === "refund_info") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "sup-4");
    } else if (qClean.includes("অরিজিনাল") || qClean.includes("ইনট্যাক্ট") || qRaw === "original_guarantee") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-5");
    } else if (qClean.includes("অফার") || qClean.includes("ডিসকাউন্ট") || qRaw === "current_offers") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "off-1");
    } else if (qClean.includes("কুপন") || qClean.includes("coupon") || qRaw === "coupon_guide") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "off-2");
    } else if (qClean.includes("কার্ট") || qClean.includes("cart") || qRaw === "view_cart") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "ord-1");
    } else if (qClean.includes("বাতিল") || qClean.includes("ক্যানসেল") || qRaw === "cancel_order") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "ord-3");
    } else if (qClean.includes("উপহার") || qClean.includes("গিফট") || qRaw === "gift_finder") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "ord-4");
    } else if (qClean.includes("একাধিক") || qRaw === "multi_order") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "ord-5");
    } else if (qClean.includes("তুলনা") || qRaw === "compare_products") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-8");
    } else if (qClean.includes("ঢাকার ভেতর") || qRaw === "inside_dhaka_delivery") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "del-1");
    } else if (qClean.includes("ঢাকার বাইরে") || qRaw === "outside_dhaka_delivery") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "del-2");
    } else if (qClean.includes("ওয়ারেন্টি") || qRaw === "warranty_info") {
      matchedKb = RECOMMENDED_QUESTIONS.find(k => k.id === "sup-1");
    }
  }

  if (matchedKb) {
    let prods: SigmaProductCardData[] | undefined;
    if (matchedKb.productFilter) {
      let cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
      prods = getFilterProducts(matchedKb.productFilter, cat);
    }
    return {
      text: matchedKb.answerText,
      products: prods,
      quickActions: matchedKb.quickActions
    };
  }

  const q = qRaw;

  // Check common action intents
  if (q === "best_gadgets" || q.includes("সেরা গ্যাজেট") || q.includes("trending")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-2");
    let cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
    return {
      text: kb?.answerText || `আমাদের স্টোরের সবচেয়ে **জনপ্রিয় ও ট্রেন্ডিং গ্যাজেট কালেকশন** নিচে দেওয়া হলো: 🌟🔥`,
      products: getFilterProducts("trending", cat),
      quickActions: kb?.quickActions || [
        { label: "💰 কম বাজেটের প্রোডাক্ট", action: "budget_search" },
        { label: "⌚ স্মার্টওয়াচ কালেকশন", action: "smartwatch_collection" }
      ]
    };
  }

  if (q === "budget_search" || q.includes("কম বাজেট") || q.includes("কম দাম")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-6");
    let cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
    return {
      text: kb?.answerText || `আমাদের স্টোরের সবচেয়ে **সাশ্রয়ী ও বাজেট-ফ্রেন্ডলি সেরা গ্যাজেটগুলো** নিচে সাজিয়ে দেওয়া হলো: 🏷️✨`,
      products: getFilterProducts("budget", cat),
      quickActions: kb?.quickActions || [
        { label: "🔥 সেরা গ্যাজেট", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "smartwatch_collection" || q.includes("স্মার্টওয়াচ")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-2");
    let cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
    return {
      text: kb?.answerText || `অ্যামোলেড ডিসপ্লে, ব্লুটুথ কলিং ও হেলথ ট্র্যাকিং ফিচারে ভরপুর **সেরা স্মার্টওয়াচগুলো** নিচে সাজিয়ে দেওয়া হলো: ⌚✨`,
      products: getFilterProducts("smartwatch", cat),
      quickActions: kb?.quickActions || [
        { label: "🎧 ব্লুটুথ ইয়ারবাডস", action: "audio_collection" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "audio_collection" || q.includes("ইয়ারবাড") || q.includes("হেডফোন")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-1");
    let cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
    return {
      text: kb?.answerText || `সেরা সাউন্ড কোয়ালিটি, ডিপ ব্যাস ও নয়েজ ক্যান্সেলেশন যুক্ত **টপ ব্লুটুথ ইয়ারবাডস কালেকশন** নিচে দেওয়া হলো: 🎧🎵`,
      products: getFilterProducts("audio", cat),
      quickActions: kb?.quickActions || [
        { label: "⌚ স্মার্টওয়াচ কালেকশন", action: "smartwatch_collection" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "charger_collection" || q.includes("চার্জার") || q.includes("পাওয়ার ব্যাংক")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "prd-3");
    let cat = options?.catalog && options.catalog.length > 0 ? options.catalog : FAST_SEED_PRODUCTS;
    return {
      text: kb?.answerText || `হাই-স্পিড PD ফাস্ট চার্জিং ও সেফটি প্রোটেকশনযুক্ত **পাওয়ার ব্যাংক ও চার্জার কালেকশন**: 🔋⚡`,
      products: getFilterProducts("charger", cat),
      quickActions: kb?.quickActions || [
        { label: "🔥 সেরা গ্যাজেট দেখুন", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "how_to_order" || (q.includes("অর্ডার") && q.includes("কীভাবে"))) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-1");
    return {
      text: kb?.answerText || `**Durtup.shop-এ অর্ডার করার সহজ ৩টি ধাপ:** 🛍️✨`,
      quickActions: kb?.quickActions || [
        { label: "🔥 সেরা গ্যাজেট দেখুন", action: "best_gadgets" },
        { label: "🚚 ডেলিভারি চার্জ কত?", action: "delivery_info" }
      ]
    };
  }

  if (q === "delivery_info" || q.includes("ডেলিভারি চার্জ") || q.includes("ডেলিভারি সময়")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-3");
    return {
      text: kb?.answerText || `**Durtup.shop দ্রুত ডেলিভারি চার্জ ও সময়সূচী:** 🚚⚡`,
      quickActions: kb?.quickActions || [
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", action: "payment_info" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "payment_info" || q.includes("ক্যাশ অন ডেলিভারি") || q.includes("পেমেন্ট")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-4");
    return {
      text: kb?.answerText || `**ক্যাশ অন ডেলিভারি (Cash on Delivery) বিস্তারিত:** 💵🤝`,
      quickActions: kb?.quickActions || [
        { label: "🔄 ইনস্ট্যান্ট রিটার্ন পলিসি", action: "return_policy" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "return_policy" || q.includes("রিটার্ন")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-5");
    return {
      text: kb?.answerText || `**Durtup.shop ইনস্ট্যান্ট চেক ও রিটার্ন পলিসি:** 📦🔍\n\n⚠️ **জরুরি রিটার্ন নিয়মাবলী:**\n১. **ডেলিভারি ম্যানের সামনে চেক করুন:** পণ্য হাতে পাওয়ার সাথে সাথে ডেলিভারি রাইডারের উপস্থিতিতে প্যাকেট খুলে চেক করে নিতে হবে।\n২. **তাৎক্ষণিক রিটার্ন:** প্রোডাক্টে কোনো ত্রুটি বা সমস্যা থাকলে সাথে সাথে ডেলিভারি ম্যানের কাছে পার্সেল ফেরত দিন।\n৩. **পরবর্তীতে গ্রহণযোগ্য নয়:** ডেলিভারি সম্পন্ন হয়ে রাইডার চলে যাওয়ার পর পরবর্তীতে আর কোনো রিটার্ন রিকোয়েস্ট গ্রহণ করা হবে না (অন্যথায় রিটার্ন রিজেক্ট করা হবে)।\n\n💡 পণ্য দেখে শতভাগ নিশ্চিত হয়ে তবেই রাইডারকে মূল্য পরিশোধ করুন!`,
      quickActions: kb?.quickActions || [
        { label: "📞 কাস্টমার কেয়ার হেল্পলাইন", action: "customer_support" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "track_order" || q.includes("ট্র্যাক")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "pop-7");
    return {
      text: kb?.answerText || `**অর্ডার ট্র্যাকিং করার সহজ নিয়ম:** 📦🔎`,
      quickActions: [
        { label: "🚚 সরাসরি ট্র্যাক করুন", action: "track_page", link: "/track" },
        { label: "📞 কাস্টমার সাপোর্ট", action: "customer_support" }
      ]
    };
  }

  if (q === "customer_support" || q === "helpline" || q.includes("হেল্পলাইন") || q.includes("কাস্টমার কেয়ার")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "sup-2");
    return {
      text: kb?.answerText || `**Durtup.shop কাস্টমার কেয়ার ও হেল্পলাইন:** 📞💬\n\n☎️ **হটলাইন ও হোয়াটসঅ্যাপ:** +880 1622-530550 (প্রতিদিন সকাল ৯:০০ টা - রাত ১০:০০ টা)\n📧 **ইমেইল:** support@durtup.shop\n🏢 **অফিস:** ধানমন্ডি, ঢাকা - ১২০৯, বাংলাদেশ`,
      quickActions: kb?.quickActions || [
        { label: "🔄 ইনস্ট্যান্ট রিটার্ন পলিসি", action: "return_policy" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "current_offers" || q.includes("অফার") || q.includes("ডিসকাউন্ট")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "off-1");
    return {
      text: kb?.answerText || `**Durtup.shop রানিং স্পেশাল অফারসমূহ:** 🏷️🎉`,
      quickActions: kb?.quickActions || [
        { label: "🔥 সেরা গ্যাজেট দেখুন", action: "best_gadgets" },
        { label: "🛍️ অর্ডার করুন", action: "how_to_order" }
      ]
    };
  }

  if (q === "inside_dhaka_delivery") {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "del-1");
    return {
      text: kb?.answerText || `**ঢাকার ভেতরে হোম ডেলিভারি বিস্তারিত:** 🏙️🚚`,
      quickActions: kb?.quickActions || [
        { label: "🏡 ঢাকার বাইরে ডেলিভারি", action: "outside_dhaka_delivery" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  if (q === "outside_dhaka_delivery") {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "del-2");
    return {
      text: kb?.answerText || `**ঢাকার বাইরে (সারাদেশের ৬৪ জেলা) ডেলিভারি:** 🏡📦`,
      quickActions: kb?.quickActions || [
        { label: "🏙️ ঢাকার ভেতরে ডেলিভারি", action: "inside_dhaka_delivery" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" }
      ]
    };
  }

  if (q === "warranty_info" || q.includes("ওয়ারেন্টি")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "sup-1");
    return {
      text: kb?.answerText || `**অফিশিয়াল ওয়ারেন্টি ক্লেইম পলিসি:** 🛡️✅`,
      quickActions: kb?.quickActions || [
        { label: "📞 কাস্টমার সাপোর্ট হেল্পলাইন", action: "customer_support" },
        { label: "🔄 ইনস্ট্যান্ট রিটার্ন পলিসি", action: "return_policy" }
      ]
    };
  }

  if (q === "gift_finder" || q.includes("উপহার") || q.includes("গিফট")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "ord-4");
    return {
      text: kb?.answerText || `**প্রিয়জনকে উপহার পাঠানোর সহজ পদ্ধতি:** 🎁💝`,
      quickActions: kb?.quickActions || [
        { label: "🔥 সেরা গ্যাজেট দেখুন", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }

  if (q === "coupon_guide" || q.includes("কুপন")) {
    const kb = RECOMMENDED_QUESTIONS.find(k => k.id === "off-2");
    return {
      text: kb?.answerText || `**কুপন কোড ব্যবহারের সহজ নিয়ম:** 🎟️✨`,
      quickActions: kb?.quickActions || [
        { label: "🏷️ চলতি স্পেশাল অফার", action: "current_offers" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" }
      ]
    };
  }
  const isNegativeMood = q.includes("lagche na") || q.includes("lagche nah") || q.includes("bhalo na") || q.includes("valo na");

  const isGreeting = 
    !isNegativeMood && (
      /^(hlw|hello|hi|helo|hey|hola|salam|assalamu|as-salamu|asalam|kemon|kmn|ki obostha|ki obstha|kemon achen|kemon acho|tumi kemon acho)/i.test(q) ||
      q.includes("kemon acho") ||
      q.includes("kemon achen") ||
      q.includes("kmn aso") ||
      q.includes("kmn acho") ||
      q.includes("valo acho") ||
      q.includes("ki khobor") ||
      q.includes("ki obstha") ||
      q.includes("ki obostha") ||
      q.includes("tumi kemon") ||
      q.includes("apni kemon") ||
      q === "hi" ||
      q === "hlw" ||
      q === "hello" ||
      q === "hey"
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

  // B. Identity / Who are you (তুমি কে / তোমার নাম কী)
  if (
    q.includes("tumi ke") ||
    q.includes("tomar nam") ||
    q.includes("who are you") ||
    q.includes("what is your name") ||
    q.includes("about you") ||
    q.includes("sigma ke") ||
    q.includes("sigma ki")
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

  // C. Gratitude & Appreciation (ধন্যবাদ / Thanks / Good / Valo)
  if (
    /^(thanks|thank you|thx|dhonnobad|dhonnobaad|shukriya|valo|bhalo|onek valo|great|nice|super|osadharon|ok|thik ache|accha|acha|hmm)$/i.test(q) ||
    q.includes("dhonnobad") ||
    q.includes("thank you") ||
    q.includes("thanks")
  ) {
    return {
      text: `আপনাকে অনেক অনেক ধন্যবাদ! ❤️\n\nযেকোনো প্রোডাক্টের তথ্য, ওয়ারেন্টি বা অর্ডার সংক্রান্ত প্রয়োজনে আমি সবসময় আছি। আর কিছু কি জানতে চান?`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "⚡ সব প্রোডাক্ট দেখুন", action: "view_products", link: "/products" }
      ]
    };
  }

  // C2. Shopping Roadmap & Guidance Intent (কোনটা নেব বুঝতে পারছি না / গাইড)
  if (
    q.includes("bujhtesi na") ||
    q.includes("bujhte parchi na") ||
    q.includes("bujhte parsi na") ||
    q.includes("বুঝতেছি না") ||
    q.includes("বুঝতে পারছি না") ||
    q.includes("কোনটা নেব") ||
    q.includes("কোনটা কিনব") ||
    q.includes("পরামর্শ চাই") ||
    q.includes("kon ta nebo") ||
    q.includes("konta nebo") ||
    q.includes("konta kinbo") ||
    q.includes("guide koro") ||
    q.includes("shoppers roadmap") ||
    q.includes("confused") ||
    q.includes("help koro")
  ) {
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

  // C3. Product Comparison Intent (তুলনা / কোনটা ভালো / Samsung আর iPhone এর মধ্যে)
  if (
    /\b(vs|versus|compare|tulona|parthokko)\b/i.test(q) ||
    q.includes("তুলনা") ||
    q.includes("পার্থক্য") ||
    q.includes("কোনটা ভালো") ||
    q.includes("konta bhalo") ||
    q.includes("konta valo") ||
    (/\b(ar|ebong|and)\b/i.test(q) && (q.includes("moddhe") || q.includes("মধ্যে")) && (q.includes("konta") || q.includes("কোনটা") || q.includes("bhalo") || q.includes("ভালো")))
  ) {
    return {
      text: `আপনার অনুরোধ অনুযায়ী প্রোডাক্ট দুটির **স্পেসিফিকেশন, ফিচার ও মূল্যের বিস্তারিত তুলনা** নিচে প্রস্তুত করা হলো: ⚖️✨\n\n📌 **সিদ্ধান্ত গাইড:**\n- 🎮 **গেমিং ও পারফরম্যান্স:** প্রথম অপশনটি সেরা পাওয়ার দেবে।\n- 💎 **ব্যাটারি লাইফ ও ভ্যালু:** দ্বিতীয় অপশনটি সাশ্রয়ী বাজেটে দারুণ ব্যাকআপ দেবে।`,
      quickActions: [
        { label: "🛒 কার্টে যোগ করুন", action: "add_to_cart" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ কত?", action: "delivery_info" }
      ]
    };
  }

  // D. How to Order / Ordering Guide (কীভাবে অর্ডার করব)
  if (
    q.includes("order") && (
      q.includes("kivabe") ||
      q.includes("kibhabe") ||
      q.includes("niom") ||
      q.includes("how to") ||
      q.includes("system") ||
      q.includes("korbo") ||
      q.includes("korar")
    )
  ) {
    return {
      text: `**Durtup.shop-এ অর্ডার করার খুব সহজ ৩টি ধাপ:** 🛍️\n\n১. **পণ্য নির্বাচন করুন**: আপনার পছন্দের প্রোডাক্টটি সিলেক্ট করুন অথবা আমাকে নাম বলুন।\n২. **'অর্ডার করুন' বাটনে চাপুন**: সরাসরি 'Buy Now' বা 'কার্ট'-এ যোগ করুন।\n৩. **ঠিকানা ও ফোন নম্বর দিন**: আপনার নাম, ফোন নম্বর ও ডেলিভারি ঠিকানা দিয়ে অর্ডার কনফার্ম করুন।\n\n🚚 **ক্যাশ অন ডেলিভারি** রয়েছে — পণ্য হাতে পেয়ে চেক করে টাকা দিন!`,
      quickActions: [
        { label: "🔥 সেরা গ্যাজেট দেখুন", action: "best_gadgets" },
        { label: "🚚 ডেলিভারি চার্জ কত?", action: "delivery_info" },
        { label: "💵 পেমেন্ট নিয়ম", action: "payment_info" }
      ]
    };
  }

  // E. Delivery Charges & Shipping Timeline (ডেলিভারি চার্জ ও সময়)
  if (
    q.includes("delivery") ||
    q.includes("shipping") ||
    q.includes("koto din") ||
    q.includes("charge koto") ||
    q.includes("delivary") ||
    q.includes("home delivery")
  ) {
    return {
      text: `**Durtup Launching 2026 ধামাকা অফার: সারাদেশে ডেলিভারি চার্জ মাত্র ৬০ টাকা!** 🚚🎉\n\n🏙️ **ঢাকার ভেতরে:** হোম ডেলিভারি চার্জ মাত্র **৬০ টাকা** (২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি)।\n🏡 **ঢাকার বাইরে (সারাদেশের ৬৪ জেলায়):** Durtup Launching 2026 অফার উপলক্ষে স্পেশাল চার্জ মাত্র **৬০ টাকা** (২ থেকে ৩ কর্মদিবসের মধ্যে)।\n\n📦 প্রতিটি পার্সেল দ্রুত এবং সতর্কতার সাথে ১০০% ক্যাশ অন ডেলিভারিতে আপনার ঠিকানায় পৌঁছে দেওয়া হয়।`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" },
        { label: "🔄 ইনস্ট্যান্ট রিটার্ন পলিসি", action: "return_policy" }
      ]
    };
  }

  // F. Payment Methods & COD (পেমেন্ট পদ্ধতি)
  if (
    q.includes("payment") ||
    q.includes("pement") ||
    q.includes("cod") ||
    q.includes("cash on") ||
    q.includes("bkash") ||
    q.includes("nagad") ||
    q.includes("taka kivabe") ||
    q.includes("advance")
  ) {
    return {
      text: `**Durtup.shop পেমেন্ট পদ্ধতি ও নিয়মাবলী:** 💵💳\n\n১. **ক্যাশ অন ডেলিভারি (COD)**: কোনো প্রকার অগ্রিম পেমেন্ট ছাড়া পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ ক্যাশে মূল্য পরিশোধ করুন।\n২. **বিকাশ (bKash Send Money)**: আমাদের অফিসিয়াল বিকাশ নাম্বার \`01885985097\`-এ Send Money করে Sender বিকাশ নম্বর ও TrxID দিয়ে নিশ্চিত করুন।\n৩. **মোবাইল ব্যাংকিং**: ডেলিভারি পাওয়ার পরও ডেলিভারি ম্যানের সামনে বিকাশ বা নগদে সরাসরি পরিশোধ করতে পারেন।`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ", action: "delivery_info" },
        { label: "🔥 ট্রেন্ডিং গ্যাজেট", action: "best_gadgets" }
      ]
    };
  }

  // G. Return & Warranty Policy (রিটার্ন ও ওয়ারেন্টি)
  if (
    q.includes("return") ||
    q.includes("refund") ||
    q.includes("warranty") ||
    q.includes("guarantee") ||
    q.includes("ferot") ||
    q.includes("nosto") ||
    q.includes("problem")
  ) {
    return {
      text: `**Durtup.shop ইনস্ট্যান্ট চেক ও রিটার্ন পলিসি:** 📦🔍\n\n⚠️ **জরুরি রিটার্ন নিয়মাবলী:**\n১. **ডেলিভারি ম্যানের সামনে চেক করুন:** পার্সেল হাতে পাওয়ার সাথে সাথে ডেলিভারি রাইডারের উপস্থিতিতে প্যাকেট খুলে প্রোডাক্ট ভালোভাবে চেক করে দেখে নিতে হবে।\n২. **তাৎক্ষণিক রিটার্ন:** প্রোডাক্টে কোনো ত্রুটি, ভাঙা বা অমিল পেলে তাৎক্ষণিকভাবে ডেলিভারি রাইডারের কাছে পার্সেল ফেরত দিন।\n৩. **পরবর্তীতে গ্রহণযোগ্য নয়:** ডেলিভারি সম্পন্ন হওয়ার পর বা রাইডার চলে যাওয়ার পর পরবর্তীতে আর কোনো রিটার্ন রিকোয়েস্ট গ্রহণ করা হবে না (অন্যথায় রিটার্ন রিজেক্ট করা হবে)।\n\n💡 পণ্য দেখে শতভাগ নিশ্চিত হয়ে তবেই রাইডারকে ক্যাশ বা বিকাশে মূল্য পরিশোধ করুন!`,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "📞 কাস্টমার সাপোর্ট", action: "customer_support" },
        { label: "📦 অর্ডার ট্র্যাক করুন", action: "track_order" }
      ]
    };
  }

  // H. Mood / Casual Conversation / Jokes (মন ভালো নেই / কিছু বলো / কী করছ)
  if (
    q.includes("valo lagche na") ||
    q.includes("bhalo lagche na") ||
    q.includes("kichu bolo") ||
    q.includes("joke") ||
    q.includes("mojar kotha") ||
    q.includes("ki korcho") ||
    q.includes("ki koro") ||
    q.includes("kotha bolo") ||
    q.includes("ami valo") ||
    q.includes("ami bhalo")
  ) {
    if (q.includes("ami valo") || q.includes("ami bhalo")) {
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

  // I. Office / Store Location (দোকান কোথায় / অফিস কোথায়)
  if (
    q.includes("kothai") ||
    q.includes("office") ||
    q.includes("dokan") ||
    q.includes("thikana") ||
    q.includes("address") ||
    q.includes("location")
  ) {
    return {
      text: `🏢 **Durtup.shop অফিস ও সেন্ট্রাল ওয়্যারহাউস:**\n\n📍 **ঠিকানা**: ঢাকা, বাংলাদেশ।\n🚚 আমরা **অনলাইন ই-কমার্স প্ল্যাটফর্ম** হিসেবে সারাদেশের ৬৪ জেলায় ক্যাশ অন ডেলিভারিতে ডোরস্টেপ হোম ডেলিভারি প্রদান করে থাকি! ঘরে বসেই অর্ডার করে নিরাপদে পণ্য বুঝে নিন।`,
      quickActions: [
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "📞 কাস্টমার সাপোর্ট", action: "customer_support" }
      ]
    };
  }

  // J. Low Price / Budget Shopping (কম দামি প্রোডাক্ট / বাজেট)
  if (
    q.includes("kom dam") ||
    q.includes("kom dame") ||
    q.includes("budget") ||
    q.includes("shobcheye kom") ||
    q.includes("cheap")
  ) {
    let catalog = options?.catalog || FAST_SEED_PRODUCTS;
    const sortedByPrice = [...catalog].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)).slice(0, 4);
    const productCards: SigmaProductCardData[] = sortedByPrice.map(p => ({
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
      keySpecs: ["১০০% জেনুইন", "ক্যাশ অন ডেলিভারি", "ডেলিভারিতে চেকিং"]
    }));

    return {
      text: `আমাদের স্টোরের সবচেয়ে **সাশ্রয়ী ও কম বাজেটের সেরা প্রোডাক্টগুলো** নিচে দেওয়া হলো: 🏷️✨`,
      products: productCards,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // K. Positive Product Selection Intent (এইটাই ভালো লাগছে / cart এ add koro / eita nebo)
  if (
    q.includes("bhalo lagche") ||
    q.includes("valo lagche") ||
    q.includes("পছন্দ হয়েছে") ||
    q.includes("ভালো লাগছে") ||
    q.includes("eita nebo") ||
    q.includes("eita kinbo") ||
    q.includes("cart a add") ||
    q.includes("cart e add") ||
    q.includes("কার্টে যোগ")
  ) {
    return {
      text: `দারুণ পছন্দ! 🛍️ আপনার requirement অনুযায়ী এটিই সবচেয়ে suitable option।\n\n📌 **বর্তমান স্টক:** ইন-স্টক (Available)\n🚚 **ডেলিভারি:** Durtup Launching 2026 উপলক্ষে সারাদেশে ডেলিভারি মাত্র ৬০ টাকা!\n🔄 **চেকিং সুবিধা:** রাইডারের সামনে খুলে চেক করে নেওয়ার সুবিধা\n\nচাইলে এখনই কার্টে যোগ করে সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারেন:`,
      quickActions: [
        { label: "🛒 কার্ট দেখুন", action: "view_cart" },
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" }
      ]
    };
  }

  // L. Gift Idea, Birthday & Recommendation Consultation (ছেলের জন্মদিন / উপহার / কি কেনা যায়)
  const isBirthdayOrGift =
    q.includes("gift") ||
    q.includes("উপহার") ||
    q.includes("birthday") ||
    q.includes("bartdey") ||
    q.includes("bday") ||
    q.includes("jonmodin") ||
    q.includes("anniversary") ||
    q.includes("mayer jonno") ||
    q.includes("babar jonno") ||
    q.includes("cheler") ||
    q.includes("meyer") ||
    q.includes("boner jonno") ||
    q.includes("bhai") ||
    q.includes("friend") ||
    q.includes("bondhu") ||
    q.includes("ki kena jai") ||
    q.includes("ki kinbo") ||
    q.includes("suggest koro");

  if (isBirthdayOrGift) {
    let catalog = options?.catalog || FAST_SEED_PRODUCTS;
    const isSon = q.includes("chele") || q.includes("cheler") || q.includes("boy") || q.includes("son");
    const isDaughter = q.includes("meye") || q.includes("meyer") || q.includes("girl") || q.includes("daughter");
    const isMother = q.includes("ma") || q.includes("mayer") || q.includes("ammu");
    const isFather = q.includes("baba") || q.includes("babar") || q.includes("abbu");

    // Extract budget
    let budget: number | undefined;
    const kMatch = q.match(/(\d{1,3})\s*k\b/i);
    if (kMatch) {
      budget = parseInt(kMatch[1], 10) * 1000;
    } else {
      const numMatch = q.match(/(\d{3,6})/);
      if (numMatch) {
        budget = parseInt(numMatch[1], 10);
      }
    }

    // If budget is NOT yet provided, ask high-value question!
    if (!budget && (q.includes("ki kena jai") || q.includes("ki kinbo") || q.includes("gift kinte chai") || q.includes("birthday") || q.includes("bartdey"))) {
      const recipientName = isSon ? "ছেলের" : isDaughter ? "মেয়ের" : isMother ? "আম্মুর" : isFather ? "বাবার" : "প্রিয়জনের";
      const occasionName = q.includes("birthday") || q.includes("bartdey") || q.includes("bday") || q.includes("jonmodin") ? "birthday" : "উপহার";

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

    let giftItems = [...catalog];
    if (budget) {
      giftItems = giftItems.filter(p => Number(p.price || 0) <= (budget! * 1.15));
    }
    if (q.includes("gaming")) {
      giftItems = giftItems.filter(p => {
        const n = (p.name || "").toLowerCase();
        return n.includes("watch") || n.includes("speaker") || n.includes("lamp") || n.includes("charge");
      });
    }

    const topItems = (giftItems.length > 0 ? giftItems : catalog).slice(0, 4);
    const productCards: SigmaProductCardData[] = topItems.map((p, idx) => {
      let badge = idx === 0 ? "🥇 Best Match for You" : idx === 1 ? "🥈 Best Value" : "🥉 Budget Choice";
      let why = "উপহার হিসেবে দেখতে চমৎকার এবং ব্যবহারের জন্য উপযোগী।";
      if (q.includes("gaming")) {
        why = `Gaming-এর জন্য suitable এবং আপনার ${budget ? `৳${budget.toLocaleString()} ` : ""}budget-এর মধ্যে দেখতেও প্রিমিয়াম।`;
      } else if (isSon) {
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

    const contextSummary = `${isSon ? "ছেলের" : "প্রিয়জনের"} birthday gift হিসেবে ${q.includes("gaming") ? "gaming পছন্দ " : ""}${budget ? `এবং ৳${budget.toLocaleString()} বাজেটের মধ্যে—` : ""}`;

    return {
      text: `Perfect! ${contextSummary}সবগুলো বিষয় বিবেচনা করে আপনার জন্য সেরা ৩–৪টি অপশন নিচে সাজিয়ে দেওয়া হলো: 🎯✨\n\n🏆 **আমার #1 Choice:** **${topItems[0]?.name || "প্রথম অপশনটি"}**\nকারণ আপনার requirement ও বাজেটের সাথে এটিই সবচেয়ে পারফেক্টভাবে match করছে।`,
      products: productCards,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // L. Product Search & Catalog Matcher
  let catalog = options?.catalog;
  if (!catalog || catalog.length === 0) {
    try {
      const cached = await getCachedMohasagorProducts();
      catalog = cached && cached.length > 0 ? cached : FAST_SEED_PRODUCTS;
    } catch {
      catalog = FAST_SEED_PRODUCTS;
    }
  }

  // Clean search terms
  const searchTerms = q
    .replace(/[^\w\s\u0980-\u09FF]/gi, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !["the", "and", "dekhao", "chai", "lagbe", "koto", "dam", "price", "tumi", "ami", "kemon", "acho", "tai", "or", "jonno", "ki", "kena", "jai"].includes(w));

  const matched = searchTerms.length > 0 ? catalog.filter(p => {
    const nameLower = p.name.toLowerCase();
    const catLower = (p.category || "").toLowerCase();
    const descLower = (p.description || "").toLowerCase();
    return searchTerms.some(term => 
      nameLower.includes(term) || 
      catLower.includes(term) || 
      descLower.includes(term)
    );
  }).slice(0, 6) : [];

  if (matched.length > 0) {
    const productCards: SigmaProductCardData[] = matched.map(p => ({
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
      keySpecs: ["১০০% জেনুইন", "ক্যাশ অন ডেলিভারি", "ডেলিভারিতে চেকিং"]
    }));

    return {
      text: `আপনার পছন্দ ও চাহিদা অনুযায়ী Durtup.shop-এর **সেরা পণ্যগুলো** নিচে প্রস্তুত করা হলো: 🎯✨`,
      products: productCards,
      quickActions: [
        { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
        { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
        { label: "💵 ক্যাশ অন ডেলিভারি", action: "payment_info" }
      ]
    };
  }

  // L. Friendly conversational fallback for any other general message (No blind product dumps!)
  return {
    text: `আমি বুঝতে পেরেছি! 😊 আমি **Sigma** — Durtup.shop-এর পার্সোনাল শপিং ম্যানেজার। আপনি কি নির্দিষ্ট কোনো গ্যাজেট, স্মার্টওয়াচ, হেডফোন বা ফ্যাশন আইটেম খুঁজছেন? আমাকে বলুন, আমি সেরা অফারগুলো এনে দিচ্ছি!`,
    quickActions: [
      { label: "🔥 সেরা গ্যাজেট দেখাও", action: "best_gadgets" },
      { label: "🛍️ কীভাবে অর্ডার করবেন?", action: "how_to_order" },
      { label: "🚚 ডেলিভারি চার্জ ও সময়", action: "delivery_info" },
      { label: "⚡ সব ক্যাটাগরি দেখুন", action: "view_categories", link: "/categories" }
    ]
  };
}

/**
 * Confirm Order with Secure Server-Side Token
 */
export async function confirmSigmaOrder(
  draftId: string,
  confirmationToken: string,
  paymentMethod: string = "cod"
): Promise<{ success: boolean; orderId?: string; orderNumber?: string; message?: string }> {
  try {
    const res = await fetch("/api/ai/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, confirmationToken, paymentMethod })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Order confirmation error:", e);
  }

  return {
    success: false,
    message: "অর্ডার যাচাই করতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।"
  };
}

/**
 * Web Speech API - Voice Input Recognition Helper
 */
export function initSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (err: any) => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  if (typeof window === "undefined") {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "bn-BD"; // Bengali language support with English fallback

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    onError?.(event);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {}
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
    isSupported: true
  };
}
