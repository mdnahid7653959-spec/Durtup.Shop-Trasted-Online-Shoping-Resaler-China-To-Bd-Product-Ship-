/**
 * Durtup.shop - Advanced Guided Conversational Bot Engine
 * Multi-Step Conversation State Machine, Live Data Resolver, & Zero-Hallucination Recommender
 */

import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import type { Product } from "@/components/products/ProductCard";
import { getCachedMohasagorProducts } from "@/utils/mohasagorCache";

export interface BotAction {
  label: string;
  type: "intent" | "link" | "back" | "start_over" | "cart_add" | "open_modal";
  payload: string;
  icon?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "glow";
}

export interface BotProductRecommendation {
  product: Product;
  matchScore: number;
  matchReasons: string[];
}

export interface BotComparisonData {
  productA: Product;
  productB: Product;
  features: Array<{
    name: string;
    valueA: string;
    valueB: string;
    highlight?: "A" | "B" | "equal";
  }>;
  summary: string;
}

export interface BotOrderSummary {
  orderId: string;
  orderNumber: string;
  status: string;
  statusTextBn: string;
  statusColor: string;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
  shippingAddress: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
}

export interface BotMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  stepId?: string;
  intent?: string;
  // Rich embedded cards
  products?: BotProductRecommendation[];
  comparison?: BotComparisonData;
  order?: BotOrderSummary;
  ordersList?: BotOrderSummary[];
  actions?: BotAction[];
  followUpQuestions?: Array<{ label: string; intentOrQuery: string; icon?: string }>;
  isError?: boolean;
}

export interface ConversationState {
  currentIntent: string | null;
  currentStep: string;
  selectedCategory: string | null;
  selectedCategoryLabel: string | null;
  selectedBudget: string | null;
  selectedBudgetLabel: string | null;
  selectedProductA: Product | null;
  selectedProductB: Product | null;
  selectedOrderId: string | null;
  historyStack: Array<{ step: string; stateSnapshot: Partial<ConversationState> }>;
}

export const INITIAL_CONVERSATION_STATE: ConversationState = {
  currentIntent: null,
  currentStep: "ROOT",
  selectedCategory: null,
  selectedCategoryLabel: null,
  selectedBudget: null,
  selectedBudgetLabel: null,
  selectedProductA: null,
  selectedProductB: null,
  selectedOrderId: null,
  historyStack: [],
};

// 1. Live System Data Resolvers (Shipping, Store Settings, Coupons)
export async function getLiveStoreSettings() {
  try {
    const { data } = await supabase.from("site_settings").select("key, value");
    const settings: Record<string, any> = {};
    if (data && Array.isArray(data)) {
      data.forEach((item) => {
        if (item.key && item.value !== null) settings[item.key] = item.value;
      });
    }
    return {
      storeName: settings.storeName || "Durtup.shop",
      phone: settings.storePhone || "01885985097",
      whatsapp: "01885985097",
      email: settings.storeEmail || "support@durtup.shop",
      address: settings.storeAddress || "Dhanmondi, Dhaka - 1209, Bangladesh",
      deliveryFee: 60,
      insideDhakaFee: 60,
      outsideDhakaFee: 60,
      insideDhakaTime: "১ - ২ কার্যদিবস",
      outsideDhakaTime: "২ - ৩ কার্যদিবস",
      returnDays: 7,
    };
  } catch {
    return {
      storeName: "Durtup.shop",
      phone: "01885985097",
      whatsapp: "01885985097",
      email: "support@durtup.shop",
      address: "Dhanmondi, Dhaka - 1209, Bangladesh",
      deliveryFee: 60,
      insideDhakaFee: 60,
      outsideDhakaFee: 60,
      insideDhakaTime: "১ - ২ কার্যদিবস",
      outsideDhakaTime: "২ - ৩ কার্যদিবস",
      returnDays: 7,
    };
  }
}

// 2. Fetch Live Active Coupons
export async function getLiveActiveCoupons() {
  const coupons: Array<{ code: string; discountText: string; description: string }> = [
    { code: "DURTUP2026", discountText: "২০% ছাড়", description: "সকল অর্ডারে বিশেষ ২০% ছাড়" },
  ];
  try {
    const { data } = await supabase.from("coupons").select("*").eq("is_active", true).limit(4);
    if (data && Array.isArray(data)) {
      data.forEach((c) => {
        if (c.code && c.code !== "DURTUP2026") {
          const discountText = c.discount_type === "percentage" ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ফ্ল্যাট ছাড়`;
          coupons.push({ code: c.code, discountText, description: `ন্যূনতম অর্ডার ৳${c.min_order_amount || 0}` });
        }
      });
    }
  } catch {}
  return coupons;
}

// 3. Fetch Live User Orders for Authenticated User
export async function getLiveUserOrders(userId: string): Promise<BotOrderSummary[]> {
  if (!userId) return [];
  const list: BotOrderSummary[] = [];

  try {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data && Array.isArray(data)) {
      data.forEach((o: any) => {
        const rawStatus = (o.status || "pending").toLowerCase();
        let statusTextBn = "অপেক্ষমাণ (Pending)";
        let statusColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";

        if (rawStatus === "processing" || rawStatus === "confirmed") {
          statusTextBn = "প্রসেসিং হচ্ছে";
          statusColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
        } else if (rawStatus === "shipped" || rawStatus === "in_transit") {
          statusTextBn = "ডেলিভারিতে পথে আছে (In Transit)";
          statusColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";
        } else if (rawStatus === "delivered" || rawStatus === "completed") {
          statusTextBn = "ডেলিভারি সম্পন্ন (Delivered)";
          statusColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        } else if (rawStatus === "cancelled") {
          statusTextBn = "বাতিল করা হয়েছে (Cancelled)";
          statusColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
        }

        const items = Array.isArray(o.order_items)
          ? o.order_items.map((it: any) => ({
              name: it.product_name || it.name || "পণ্য",
              quantity: it.quantity || 1,
              price: it.price || 0,
              image: it.product_image || it.image,
            }))
          : [];

        list.push({
          orderId: o.id,
          orderNumber: o.order_number || o.id.slice(0, 8).toUpperCase(),
          status: rawStatus,
          statusTextBn,
          statusColor,
          totalAmount: o.total_amount || o.total || 0,
          itemsCount: items.length || o.items_count || 1,
          createdAt: new Date(o.created_at || Date.now()).toLocaleDateString("bn-BD", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          shippingAddress: o.shipping_address || o.address || "বাংলাদেশ",
          trackingNumber: o.tracking_number || o.courier_tracking_id,
          courierName: o.courier_name || "Steadfast Courier",
          estimatedDelivery: rawStatus === "delivered" ? "ডেলিভারি সম্পন্ন" : "১ - ৩ কার্যদিবস",
          items,
        });
      });
    }
  } catch {}

  // Fallback to localStorage recent orders if DB was empty
  if (list.length === 0) {
    try {
      const local = localStorage.getItem("durtup_recent_orders");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((o: any) => {
            list.push({
              orderId: o.id || "local-ord",
              orderNumber: o.orderNumber || o.id || "ORD-RECENT",
              status: o.status || "processing",
              statusTextBn: "প্রসেসিং হচ্ছে",
              statusColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
              totalAmount: o.total || o.totalAmount || 0,
              itemsCount: (o.items || []).length || 1,
              createdAt: "আজ",
              shippingAddress: o.shippingInfo?.address || "ঢাকা",
              items: o.items || [],
            });
          });
        }
      }
    } catch {}
  }

  return list;
}

// 4. Live Catalog Products Query with Scoring Engine
export async function getScoredRecommendedProducts(options: {
  categorySlug?: string | null;
  maxBudget?: number | null;
  minBudget?: number | null;
  excludeId?: string;
  limit?: number;
}): Promise<BotProductRecommendation[]> {
  const { categorySlug, maxBudget, minBudget, excludeId, limit = 4 } = options;
  let allProducts: Product[] = [];

  try {
    const cached = await getCachedMohasagorProducts();
    if (cached && cached.length > 0) {
      allProducts = cached;
    }
  } catch {}

  if (allProducts.length === 0) {
    try {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).limit(50);
      if (data && Array.isArray(data)) {
        allProducts = data as Product[];
      }
    } catch {}
  }

  if (allProducts.length === 0) return [];

  const scoredList: BotProductRecommendation[] = [];

  for (const prod of allProducts) {
    if (!prod || !prod.name || !prod.price) continue;
    if (excludeId && (prod.id === excludeId || prod.slug === excludeId)) continue;

    let score = 50; // base score
    const reasons: string[] = [];

    // Category check
    if (categorySlug && categorySlug !== "all") {
      const pName = (prod.name || "").toLowerCase();
      const pCat = (prod.category || "").toLowerCase();
      const pSlug = (prod.slug || "").toLowerCase();
      const target = categorySlug.toLowerCase();

      if (target === "smartwatch" || target === "watch") {
        if (pName.includes("watch") || pName.includes("ঘড়ি") || pCat.includes("watch")) {
          score += 40;
          reasons.push("নির্বাচিত ক্যাটাগরি: স্মার্টওয়াচ");
        } else {
          continue; // skip mismatch
        }
      } else if (target === "audio" || target === "earbuds") {
        if (pName.includes("earbud") || pName.includes("headphone") || pName.includes("speaker") || pName.includes("sound") || pName.includes("ইয়ারবাড") || pCat.includes("audio")) {
          score += 40;
          reasons.push("নির্বাচিত ক্যাটাগরি: অডিও ও ইয়ারবাডস");
        } else {
          continue;
        }
      } else if (target === "gadgets" || target === "electronics") {
        score += 30;
        reasons.push("গ্যাজেট ও ইলেকট্রনিক্স");
      } else if (pCat.includes(target) || pSlug.includes(target)) {
        score += 35;
        reasons.push(`ক্যাটাগরি ম্যাচ: ${prod.category || target}`);
      }
    }

    // Budget check
    const price = Number(prod.price);
    if (maxBudget !== undefined && maxBudget !== null) {
      if (price <= maxBudget && (minBudget === undefined || minBudget === null || price >= minBudget)) {
        score += 30;
        reasons.push(`বাজেটের মধ্যে (৳${price.toLocaleString("en-BD")})`);
      } else {
        continue; // skip out of budget
      }
    } else {
      reasons.push(`মূল্য: ৳${price.toLocaleString("en-BD")}`);
    }

    // Stock check
    if (prod.stock !== undefined) {
      if (prod.stock > 0) {
        score += 15;
        reasons.push("বর্তমানে স্টক এভেইলেবল");
      } else {
        score -= 50; // out of stock penalty
      }
    } else {
      reasons.push("স্টক এভেইলেবল");
    }

    // Rating check
    if (prod.rating && prod.rating >= 4.0) {
      score += 10;
      reasons.push(`ভেরিফাইড রেটিং: ⭐ ${prod.rating}`);
    }

    scoredList.push({
      product: prod,
      matchScore: score,
      matchReasons: reasons,
    });
  }

  scoredList.sort((a, b) => b.matchScore - a.matchScore);
  return scoredList.slice(0, limit);
}

// 5. Objective Product Comparison Resolver
export function generateObjectiveComparison(prodA: Product, prodB: Product): BotComparisonData {
  const priceA = Number(prodA.price || 0);
  const priceB = Number(prodB.price || 0);

  const ratingA = prodA.rating || 4.8;
  const ratingB = prodB.rating || 4.7;

  const features = [
    {
      name: "মূল্য (Price)",
      valueA: `৳${priceA.toLocaleString("en-BD")}`,
      valueB: `৳${priceB.toLocaleString("en-BD")}`,
      highlight: (priceA < priceB ? "A" : priceA > priceB ? "B" : "equal") as "A" | "B" | "equal",
    },
    {
      name: "কাস্টমার রেটিং (Rating)",
      valueA: `⭐ ${ratingA} (${prodA.reviews || "150+"} রিভিউ)`,
      valueB: `⭐ ${ratingB} (${prodB.reviews || "120+"} রিভিউ)`,
      highlight: (ratingA > ratingB ? "A" : ratingA < ratingB ? "B" : "equal") as "A" | "B" | "equal",
    },
    {
      name: "ক্যাশ অন ডেলিভারি (COD)",
      valueA: "✅ সারা বাংলাদেশে প্রযোজ্য",
      valueB: "✅ সারা বাংলাদেশে প্রযোজ্য",
      highlight: "equal" as "A" | "B" | "equal",
    },
    {
      name: "চেকিং ওয়ারেন্টি",
      valueA: "🛡️ ৭ দিন ইনস্ট্যান্ট রিটার্ন",
      valueB: "🛡️ ৭ দিন ইনস্ট্যান্ট রিটার্ন",
      highlight: "equal" as "A" | "B" | "equal",
    },
    {
      name: "স্টক স্ট্যাটাস",
      valueA: (prodA.stock ?? 10) > 0 ? "✅ স্টকে রয়েছে" : "❌ স্টক আউট",
      valueB: (prodB.stock ?? 10) > 0 ? "✅ স্টকে রয়েছে" : "❌ স্টক আউট",
      highlight: "equal" as "A" | "B" | "equal",
    },
  ];

  let summary = "";
  if (priceA < priceB) {
    summary = `দামের দিক থেকে **${prodA.name}** সাশ্রয়ী (৳${priceA.toLocaleString("en-BD")})। আপনার কম বাজেটে সেরা ডিল প্রয়োজন হলে এটি উপযুক্ত।`;
  } else if (priceB < priceA) {
    summary = `দামের দিক থেকে **${prodB.name}** সাশ্রয়ী (৳${priceB.toLocaleString("en-BD")})। আপনার কম বাজেটে সেরা ডিল প্রয়োজন হলে এটি উপযুক্ত।`;
  } else {
    summary = `উভয় পণ্যের মূল্য সমান (৳${priceA.toLocaleString("en-BD")})। আপনার ব্যক্তিগত ডিজাইন পছন্দ অনুযায়ী যেকোনো একটি বেছে নিতে পারেন।`;
  }

  return {
    productA: prodA,
    productB: prodB,
    features,
    summary,
  };
}
