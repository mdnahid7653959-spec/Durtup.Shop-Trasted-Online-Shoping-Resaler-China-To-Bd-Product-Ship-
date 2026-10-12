/**
 * Durtup.shop - Central Knowledge Base & Admin FAQ Service
 * Single Source of Truth for verified store policies, Q&A flows, and dynamic data binding.
 */

import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

export interface FAQCategory {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: string;
  descriptionBn: string;
  priority: number;
}

export interface FAQItem {
  id: string;
  category: string;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn?: string;
  answerType: "text" | "dynamic" | "guided_flow" | "card";
  sourceType: "static" | "shipping_config" | "site_contact" | "active_coupons" | "user_orders" | "user_wallet" | "return_policy" | "reseller_policy" | "product_finder" | "product_compare";
  sourceKey?: string;
  priority: number;
  isActive: boolean;
  requiresAuth?: boolean;
  relatedQuestionIds: string[];
  actionButtons?: Array<{
    label: string;
    type: "link" | "intent" | "open_modal";
    payload: string;
    variant?: "default" | "outline" | "secondary" | "glow";
  }>;
  clickCount?: number;
  lastUpdated?: string;
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  { id: "popular", nameBn: "🔥 সর্বাধিক জিজ্ঞাসিত", nameEn: "Popular", icon: "🔥", descriptionBn: "সবার জন্য প্রয়োজনীয় সাধারণ তথ্যাদি", priority: 1 },
  { id: "shopping", nameBn: "🛍️ কেনাকাটা ও অর্ডার", nameEn: "Shopping & Orders", icon: "🛍️", descriptionBn: "অর্ডার করার নিয়ম, ভ্যারিয়েন্ট নির্বাচন ও পণ্য খোঁজা", priority: 2 },
  { id: "delivery", nameBn: "🚚 ডেলিভারি ও চার্জ", nameEn: "Delivery & Shipping", icon: "🚚", descriptionBn: "ডেলিভারি সময়, চার্জ ও ট্র্যাকিং নিয়ম", priority: 3 },
  { id: "payment", nameBn: "💳 পেমেন্ট ও ক্যাশ অন ডেলিভারি", nameEn: "Payment & COD", icon: "💳", descriptionBn: "ক্যাশ অন ডেলিভারি, বিকাশ ও পেমেন্ট মাধ্যম", priority: 4 },
  { id: "returns", nameBn: "🔄 রিটার্ন ও ওয়ারেন্টি", nameEn: "Returns & Warranty", icon: "🔄", descriptionBn: "৭ দিন রিটার্ন ও পার্সেল চেকিং পলিসি", priority: 5 },
  { id: "account", nameBn: "👤 অ্যাকাউন্ট ও অর্ডার স্ট্যাটাস", nameEn: "Account & Profile", icon: "👤", descriptionBn: "আমার অর্ডার, পাসওয়ার্ড ও প্রোফাইল", priority: 6 },
  { id: "reseller", nameBn: "💼 রিসেলার প্রোগ্রাম", nameEn: "Reseller Program", icon: "💼", descriptionBn: "জিরো ইনভেস্টে রিসেলিং ও ইনকাম নিয়ম", priority: 7 },
  { id: "seller", nameBn: "🏪 সেলার ও ভেন্ডর", nameEn: "Seller / Vendor", icon: "🏪", descriptionBn: "দোকান খোলা ও প্রোডাক্ট লিস্টিং", priority: 8 },
  { id: "offers", nameBn: "🎁 অফার ও কুপন কোড", nameEn: "Offers & Coupons", icon: "🎁", descriptionBn: "চলতি ডিসকাউন্ট ও স্পেশাল প্রোমো", priority: 9 },
  { id: "technical", nameBn: "🛠️ হেল্পলাইন ও সাপোর্ট", nameEn: "Technical Help", icon: "🛠️", descriptionBn: "সরাসরি কাস্টমার কেয়ার সাপোর্ট", priority: 10 },
];

export const SEED_FAQ_ITEMS: FAQItem[] = [
  {
    id: "pop_what_is_durtup",
    category: "popular",
    questionBn: "Durtup.shop কী?",
    questionEn: "What is Durtup.shop?",
    answerBn: "Durtup.shop হলো বাংলাদেশের একটি প্রিমিয়াম অনলাইন ই-কমার্স শপিং প্ল্যাটফর্ম। এখানে গ্যাজেটস, ইলেকট্রনিক্স, ফ্যাশন এবং লাইফস্টাইল পণ্য সাশ্রয়ী মূল্যে ১০০% ক্যাশ অন ডেলিভারি সুবিধায় হোম ডেলিভারি দেওয়া হয়।",
    answerType: "text",
    sourceType: "static",
    priority: 1,
    isActive: true,
    relatedQuestionIds: ["pop_how_to_order", "del_charge_time", "pay_cod_available"],
    actionButtons: [
      { label: "🛍️ পণ্য কালেকশন দেখুন", type: "link", payload: "/products", variant: "default" },
      { label: "🔥 হট ডিলস দেখুন", type: "link", payload: "/products?filter=deals", variant: "outline" },
    ],
  },
  {
    id: "pop_how_to_order",
    category: "shopping",
    questionBn: "কীভাবে সহজে অর্ডার করবো?",
    questionEn: "How do I place an order?",
    answerBn: "অর্ডার করার ৩টি সহজ ধাপ:\n১. আপনার পছন্দের পণ্যে গিয়ে **Buy Now** অথবা **Add to Cart** বাটনে ক্লিক করুন।\n২. আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা পূরণ করুন।\n৩. **Confirm Order** বাটনে ক্লিক করলেই আপনার অর্ডার সম্পন্ন হবে।\n\nকোনো অগ্রিম পেমেন্ট ছাড়া পণ্য হাতে পেয়ে মূল্য পরিশোধ (Cash on Delivery) করতে পারবেন।",
    answerType: "text",
    sourceType: "static",
    priority: 2,
    isActive: true,
    relatedQuestionIds: ["del_charge_time", "pay_cod_available", "acc_track_order"],
    actionButtons: [
      { label: "🛒 কার্ট দেখুন", type: "link", payload: "/cart", variant: "default" },
      { label: "🛍️ পণ্য ব্রাউজ করুন", type: "link", payload: "/products", variant: "outline" },
    ],
  },
  {
    id: "del_charge_time",
    category: "delivery",
    questionBn: "ডেলিভারি চার্জ কত এবং কতদিন সময় লাগে?",
    questionEn: "What is the delivery fee and timeframe?",
    answerBn: "🚚 **অফিসিয়াল ডেলিভারি তথ্য ও চার্জ:**\n\n• **সারাদেশে ডেলিভারি চার্জ:** মাত্র **৳৬০** (সারা বাংলাদেশ মাত্র ৬০ টাকা)\n• **ঢাকার ভিতরে ডেলিভারি সময়:** ১ - ২ কার্যদিবস\n• **ঢাকার বাইরে ডেলিভারি সময়:** ২ - ৩ কার্যদিবস\n\nআমাদের ডেলিভারি পার্টনার: Steadfast Courier & RedX। পার্সেল পাঠানোর পর সরাসরি এসএমএস ও ট্র্যাকিং লিংক প্রদান করা হয়।",
    answerType: "dynamic",
    sourceType: "shipping_config",
    priority: 3,
    isActive: true,
    relatedQuestionIds: ["pay_cod_available", "ret_policy_check", "acc_track_order"],
    actionButtons: [
      { label: "📦 অর্ডার ট্র্যাক করুন", type: "link", payload: "/track", variant: "default" },
    ],
  },
  {
    id: "pay_cod_available",
    category: "payment",
    questionBn: "ক্যাশ অন ডেলিভারি (Cash on Delivery) আছে কি?",
    questionEn: "Is Cash on Delivery available?",
    answerBn: "হ্যাঁ, Durtup.shop-এ **১০০% ক্যাশ অন ডেলিভারি (COD)** সুবিধা রয়েছে। পণ্য ডেলিভারিম্যানের কাছ থেকে বুঝে পেয়ে মূল্য পরিশোধ করতে পারবেন। এছাড়া বিকাশ, নগদ, রকেট অথবা কার্ডের মাধ্যমেও পেমেন্ট করা যায়।",
    answerType: "text",
    sourceType: "static",
    priority: 4,
    isActive: true,
    relatedQuestionIds: ["del_charge_time", "ret_policy_check"],
    actionButtons: [
      { label: "🛍️ শপিং শুরু করুন", type: "link", payload: "/products", variant: "default" },
    ],
  },
  {
    id: "ret_policy_check",
    category: "returns",
    questionBn: "রিটার্ন ও ওয়ারেন্টি পলিসি কী?",
    questionEn: "What is the Return & Refund Policy?",
    answerBn: "🛡️ **৭ দিনের চেক ও রিটার্ন নিশ্চয়তা:**\n\n• ডেলিভারিম্যানের সামনে পার্সেল চেক করে দেখে নিতে পারবেন।\n• পণ্যটি ডিফেক্টিভ বা অমিল থাকলে ডেলিভারিম্যানের কাছে সাথে সাথে রিটার্ন করতে পারবেন।\n• ডেলিভারির পরেও ৭ দিনের মধ্যে আনবক্সিং ভিডিও সহ যোগাযোগ করলে দ্রুত পরিবর্তন বা রিফান্ড প্রদান করা হয়।",
    answerType: "dynamic",
    sourceType: "return_policy",
    priority: 5,
    isActive: true,
    relatedQuestionIds: ["tech_support_contact", "del_charge_time"],
    actionButtons: [
      { label: "📄 পূর্ণাঙ্গ রিটার্ন পলিসি", type: "link", payload: "/returns", variant: "outline" },
      { label: "📞 কাস্টমার কেয়ার", type: "link", payload: "/contact", variant: "default" },
    ],
  },
  {
    id: "acc_my_latest_order",
    category: "account",
    questionBn: "আমার সর্বশেষ অর্ডার কোথায় ও কী অবস্থায় আছে?",
    questionEn: "Where is my latest order?",
    answerBn: "আপনার সর্বশেষ অর্ডারের লাইভ ট্র্যাকিং স্ট্যাটাস নিচে প্রদর্শিত হচ্ছে:",
    answerType: "dynamic",
    sourceType: "user_orders",
    requiresAuth: true,
    priority: 6,
    isActive: true,
    relatedQuestionIds: ["del_charge_time", "tech_support_contact"],
    actionButtons: [
      { label: "📦 সকল অর্ডার দেখুন", type: "link", payload: "/orders", variant: "default" },
    ],
  },
  {
    id: "prod_recommend_guided",
    category: "shopping",
    questionBn: "আমি একটা প্রোডাক্ট কিনতে চাই (বাজেট ও ক্যাটাগরি অনুযায়ী সাজেস্ট করো)",
    questionEn: "Help me choose a product based on budget & category",
    answerBn: "অবশ্যই! আপনি কোন ধরনের প্রোডাক্ট খুঁজছেন? নিচে থেকে নির্বাচন করুন:",
    answerType: "guided_flow",
    sourceType: "product_finder",
    priority: 7,
    isActive: true,
    relatedQuestionIds: ["pop_what_is_durtup", "del_charge_time"],
  },
  {
    id: "reseller_join_guide",
    category: "reseller",
    questionBn: "Durtup Reseller প্রোগ্রামে কীভাবে যুক্ত হবো এবং আয় করবো?",
    questionEn: "How to join the Reseller program and earn?",
    answerBn: "💼 **Durtup.shop রিসেলার প্রোগ্রাম:**\n\n১. সম্পূর্ণ বিনামূল্যে কোনো ইনভেস্ট ছাড়াই রিসেলার অ্যাকাউন্ট তৈরি করুন।\n২. আমাদের পাইকারি মূল্যের প্রোডাক্ট আপনার ফেসবুক পেজ, গ্রুপ বা পরিচিতদের কাছে নিজের প্রফিট মার্জিন যোগ করে শেয়ার করুন।\n৩. কাস্টমারের নাম-ঠিকানা দিয়ে অর্ডার সাবমিট করুন। আমরা পণ্য কাস্টমারের কাছে পৌঁছে দেবো এবং আপনার লাভ ওয়ালেটে জমা হবে।",
    answerType: "text",
    sourceType: "reseller_policy",
    priority: 8,
    isActive: true,
    relatedQuestionIds: ["pop_what_is_durtup", "tech_support_contact"],
    actionButtons: [
      { label: "💼 রিসেলার রেজিস্ট্রেশন", type: "link", payload: "/affiliate", variant: "default" },
    ],
  },
  {
    id: "off_active_coupons",
    category: "offers",
    questionBn: "বর্তমানে কী কী স্পেশাল অফার ও কুপন কোড চলছে?",
    questionEn: "What are the active discount coupons and deals?",
    answerBn: "🎁 **লাইভ চলমান ডিসকাউন্ট অফারসমূহ:**\n\n• স্পেশাল প্রোমো কোড: **DURTUP2026** (সকল অর্ডারে বিশেষ ২০% ছাড়!)\n• ক্যাশ অন ডেলিভারি সর্বত্র প্রযোজ্য। চেকআউটের সময় প্রোমো কোড বক্সে কোডটি লিখুন।",
    answerType: "dynamic",
    sourceType: "active_coupons",
    priority: 9,
    isActive: true,
    relatedQuestionIds: ["pop_how_to_order", "del_charge_time"],
    actionButtons: [
      { label: "🛍️ অফার প্রোডাক্ট দেখুন", type: "link", payload: "/products?filter=deals", variant: "default" },
    ],
  },
  {
    id: "tech_support_contact",
    category: "technical",
    questionBn: "কোনো সমস্যা হলে কাস্টমার সাপোর্টে কীভাবে যোগাযোগ করবো?",
    questionEn: "How do I contact customer support?",
    answerBn: "📞 **Durtup.shop হেল্পলাইন ও কাস্টমার সাপোর্ট:**\n\n• **হটলাইন / হোয়াটসঅ্যাপ:** 01885985097\n• **ইমেইল:** support@durtup.shop\n• **অফিস ঠিকানা:** Dhanmondi, Dhaka - 1209, Bangladesh\n• **সাপোর্ট সময়:** প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত।",
    answerType: "dynamic",
    sourceType: "site_contact",
    priority: 10,
    isActive: true,
    relatedQuestionIds: ["ret_policy_check", "acc_my_latest_order"],
    actionButtons: [
      { label: "💬 WhatsApp (01885985097)", type: "link", payload: "https://wa.me/8801885985097", variant: "default" },
      { label: "📞 সরাসরি কল করুন (01885985097)", type: "link", payload: "tel:01885985097", variant: "outline" },
      { label: "💬 লাইভ সাপোর্ট পেজ", type: "link", payload: "/contact", variant: "outline" },
    ],
  },
];

// In-Memory cache with fallback
let cachedFAQs: FAQItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function fetchAllFAQs(): Promise<FAQItem[]> {
  const now = Date.now();
  if (cachedFAQs && now - lastFetchTime < CACHE_TTL) {
    return cachedFAQs;
  }

  try {
    const snap = await getDocs(collection(db, "knowledge_base"));
    if (!snap.empty) {
      const dbList: FAQItem[] = [];
      snap.forEach((d) => {
        const data = d.data();
        dbList.push({
          id: d.id,
          category: data.category || "popular",
          questionBn: data.questionBn || data.question || "",
          questionEn: data.questionEn || "",
          answerBn: data.answerBn || data.answer || "",
          answerEn: data.answerEn || "",
          answerType: data.answerType || "text",
          sourceType: data.sourceType || "static",
          sourceKey: data.sourceKey || "",
          priority: data.priority ?? 10,
          isActive: data.isActive !== false,
          requiresAuth: Boolean(data.requiresAuth),
          relatedQuestionIds: Array.isArray(data.relatedQuestionIds) ? data.relatedQuestionIds : [],
          actionButtons: Array.isArray(data.actionButtons) ? data.actionButtons : [],
          clickCount: data.clickCount || 0,
          lastUpdated: data.lastUpdated || "",
        });
      });

      if (dbList.length > 0) {
        // Merge seed items with DB items (DB takes precedence if exists)
        const map = new Map<string, FAQItem>();
        SEED_FAQ_ITEMS.forEach((item) => map.set(item.id, item));
        dbList.forEach((item) => map.set(item.id, item));

        cachedFAQs = Array.from(map.values()).sort((a, b) => a.priority - b.priority);
        lastFetchTime = now;
        return cachedFAQs;
      }
    }
  } catch (err) {
    console.warn("[KnowledgeBase] Error fetching custom FAQs from Firestore:", err);
  }

  cachedFAQs = [...SEED_FAQ_ITEMS].sort((a, b) => a.priority - b.priority);
  lastFetchTime = now;
  return cachedFAQs;
}

export async function saveOrUpdateFAQ(faq: Partial<FAQItem> & { id: string }): Promise<boolean> {
  try {
    const docRef = doc(db, "knowledge_base", faq.id);
    const dataToSave = {
      ...faq,
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });

    // Invalidate cache
    cachedFAQs = null;
    lastFetchTime = 0;
    return true;
  } catch (error) {
    console.error("[KnowledgeBase] Error saving FAQ:", error);
    return false;
  }
}

export async function deleteFAQ(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "knowledge_base", id));
    cachedFAQs = null;
    lastFetchTime = 0;
    return true;
  } catch (error) {
    console.error("[KnowledgeBase] Error deleting FAQ:", error);
    return false;
  }
}

export async function trackQuestionClick(id: string) {
  try {
    const docRef = doc(db, "knowledge_base", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data().clickCount || 0;
      await updateDoc(docRef, { clickCount: current + 1 });
    }
  } catch {}
}

export interface CustomerReport {
  id: string;
  name: string;
  phone: string;
  category: string;
  details: string;
  orderNumber?: string;
  status: "pending" | "investigating" | "resolved";
  createdAt: string;
  userId?: string;
}

export async function submitCustomerReport(
  report: Omit<CustomerReport, "id" | "createdAt" | "status">
): Promise<{ success: boolean; reportId?: string }> {
  try {
    const reportId = `REP-${Date.now().toString().slice(-6)}`;
    const docRef = doc(db, "customer_reports", reportId);
    const data: CustomerReport = {
      ...report,
      id: reportId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await setDoc(docRef, data);
    return { success: true, reportId };
  } catch (err) {
    console.error("[KnowledgeBase] Error submitting customer report:", err);
    return { success: false };
  }
}

export async function fetchCustomerReports(): Promise<CustomerReport[]> {
  try {
    const snap = await getDocs(collection(db, "customer_reports"));
    const list: CustomerReport[] = [];
    snap.forEach((d) => {
      const data = d.data() as CustomerReport;
      list.push({ ...data, id: d.id });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.error("[KnowledgeBase] Error fetching customer reports:", err);
    return [];
  }
}

export async function updateReportStatus(
  reportId: string,
  status: "pending" | "investigating" | "resolved"
): Promise<boolean> {
  try {
    const docRef = doc(db, "customer_reports", reportId);
    await updateDoc(docRef, { status });
    return true;
  } catch (err) {
    console.error("[KnowledgeBase] Error updating report status:", err);
    return false;
  }
}

export async function deleteCustomerReport(reportId: string): Promise<boolean> {
  try {
    const docRef = doc(db, "customer_reports", reportId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error("[KnowledgeBase] Error deleting customer report:", err);
    return false;
  }
}

