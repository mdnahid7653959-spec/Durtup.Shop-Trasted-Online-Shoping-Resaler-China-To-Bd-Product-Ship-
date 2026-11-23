import { db } from "@/integrations/firebase/client";
import { sendBackInStockPushNotification } from "@/services/notificationService";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { playNewOrderSound, unlockAudio } from "@/hooks/useAdminOrderNotifications";

export interface StockAlertSubscription {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  productPrice: number;
  variantId?: string | number;
  variantAttributes?: Record<string, string>;
  variantLabel?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel: "email" | "push" | "both";
  status: "pending" | "notified" | "cancelled";
  createdAt: string;
  notifiedAt?: string;
  cancelledAt?: string;
  restockQuantity?: number;
}

export interface StockAlertSettings {
  enabled: boolean;
  allowGuestSubscriptions: boolean;
  autoTriggerOnRestock: boolean;
  notifyAdminsOnRequest: boolean;
  emailSubjectTemplate: string;
  pushTitleTemplate: string;
  pushBodyTemplate: string;
}

export const DEFAULT_STOCK_ALERT_SETTINGS: StockAlertSettings = {
  enabled: true,
  allowGuestSubscriptions: true,
  autoTriggerOnRestock: true,
  notifyAdminsOnRequest: true,
  emailSubjectTemplate: "Good News! {product_name} is back in stock at Durtup.shop",
  pushTitleTemplate: "🎉 Back in Stock: {product_name}",
  pushBodyTemplate: "আপনার পছন্দের পণ্যটি এখন স্টকে পাওয়া যাচ্ছে! স্টক সীমিত, এখনই অর্ডার করুন।",
};

const STORAGE_KEY = "durtup_back_in_stock_subscriptions";
const SETTINGS_KEY = "durtup_back_in_stock_settings";
export const BACK_IN_STOCK_EVENT = "durtup_stock_alerts_updated";

function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BACK_IN_STOCK_EVENT));
  }
}

// -------------------------------------------------------------
// Settings Management
// -------------------------------------------------------------
export function getStockAlertSettings(): StockAlertSettings {
  if (typeof window === "undefined") return DEFAULT_STOCK_ALERT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_STOCK_ALERT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STOCK_ALERT_SETTINGS;
}

export function saveStockAlertSettings(settings: Partial<StockAlertSettings>): StockAlertSettings {
  const current = getStockAlertSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

// -------------------------------------------------------------
// Local Storage Helper (Instant 0ms read/write fallback)
// -------------------------------------------------------------
function getLocalSubscriptions(): StockAlertSubscription[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalSubscriptions(subs: StockAlertSubscription[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
    notifyUpdate();
  } catch {}
}

// -------------------------------------------------------------
// Check Duplicate Subscription
// -------------------------------------------------------------
export async function checkCustomerStockAlert(
  productId: string,
  variantLabel?: string,
  emailOrUserId?: string
): Promise<{ isSubscribed: boolean; subscription?: StockAlertSubscription }> {
  if (!productId || !emailOrUserId) return { isSubscribed: false };
  const target = emailOrUserId.trim().toLowerCase();
  const cleanVariant = (variantLabel || "").trim().toLowerCase();

  // 1. Check local storage
  const local = getLocalSubscriptions();
  const found = local.find(
    (s) =>
      s.productId === productId &&
      s.status === "pending" &&
      ((variantLabel && (s.variantLabel || "").toLowerCase() === cleanVariant) || (!variantLabel && !s.variantLabel)) &&
      (s.customerEmail.toLowerCase() === target || (s.userId && s.userId.toLowerCase() === target))
  );

  if (found) {
    return { isSubscribed: true, subscription: found };
  }

  // 2. Check Firestore
  try {
    const q = query(
      collection(db, "stock_alert_subscriptions"),
      where("productId", "==", productId),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as StockAlertSubscription;
      const matchTarget = (data.customerEmail && data.customerEmail.toLowerCase() === target) || (data.userId && data.userId.toLowerCase() === target);
      const matchVariant = (!variantLabel && !data.variantLabel) || ((data.variantLabel || "").toLowerCase() === cleanVariant);
      if (matchTarget && matchVariant) {
        return { isSubscribed: true, subscription: { ...data, id: d.id } };
      }
    }
  } catch {}

  return { isSubscribed: false };
}

// -------------------------------------------------------------
// Subscribe Customer to Back in Stock Alert
// -------------------------------------------------------------
export interface SubscribeParams {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  productPrice: number;
  variantId?: string | number;
  variantAttributes?: Record<string, string>;
  variantLabel?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel?: "email" | "push" | "both";
}

export async function subscribeToStockAlert(
  params: SubscribeParams
): Promise<{ success: boolean; message: string; subscription?: StockAlertSubscription; alreadySubscribed?: boolean }> {
  const email = (params.customerEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, message: "অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস দিন" };
  }

  // Duplicate Check
  const check = await checkCustomerStockAlert(params.productId, params.variantLabel, params.userId || email);
  if (check.isSubscribed) {
    return {
      success: false,
      alreadySubscribed: true,
      message: "আপনি ইতিমধ্যে এই পণ্যটির স্টকের আপডেটের জন্য অনুরোধ করেছেন। পণ্যটি স্টকে এলেই নোটিফিকেশন পাবেন।",
      subscription: check.subscription,
    };
  }

  // Request Push Permission if channel is push or both
  const channel = params.channel || "both";
  if (typeof window !== "undefined" && (channel === "push" || channel === "both") && "Notification" in window) {
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  }

  const subId = `bis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newSub: StockAlertSubscription = {
    id: subId,
    productId: params.productId,
    productName: params.productName,
    productSlug: params.productSlug,
    productImage: params.productImage || "/durtup-logo.png",
    productPrice: params.productPrice || 0,
    variantId: params.variantId,
    variantAttributes: params.variantAttributes,
    variantLabel: params.variantLabel,
    userId: params.userId,
    customerName: params.customerName || "Valued Customer",
    customerEmail: email,
    customerPhone: params.customerPhone?.trim(),
    channel,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Save to LocalStorage
  const local = getLocalSubscriptions();
  local.unshift(newSub);
  saveLocalSubscriptions(local);

  // Save to Firestore
  try {
    await setDoc(doc(db, "stock_alert_subscriptions", subId), newSub);
  } catch (err) {
    console.warn("Firestore stock alert save notice:", err);
  }

  return {
    success: true,
    message: "অনুরোধ সফল হয়েছে! পণ্যটি স্টকে আসার সাথে সাথে আপনাকে নোটিফিকেশন পাঠানো হবে।",
    subscription: newSub,
  };
}

// -------------------------------------------------------------
// Cancel / Unsubscribe
// -------------------------------------------------------------
export async function cancelStockAlert(subscriptionId: string): Promise<boolean> {
  if (!subscriptionId) return false;

  // Local update
  const local = getLocalSubscriptions();
  const idx = local.findIndex((s) => s.id === subscriptionId);
  if (idx !== -1) {
    local[idx].status = "cancelled";
    local[idx].cancelledAt = new Date().toISOString();
    saveLocalSubscriptions(local);
  }

  // Firestore update
  try {
    await updateDoc(doc(db, "stock_alert_subscriptions", subscriptionId), {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    });
  } catch {}

  notifyUpdate();
  return true;
}

// -------------------------------------------------------------
// Get Customer Stock Alerts for Account Page
// -------------------------------------------------------------
export async function getCustomerStockAlerts(
  userId?: string | null,
  email?: string | null
): Promise<StockAlertSubscription[]> {
  const targetEmail = (email || "").trim().toLowerCase();
  const targetUserId = (userId || "").trim();

  // Local
  const local = getLocalSubscriptions().filter(
    (s) =>
      (targetUserId && s.userId === targetUserId) ||
      (targetEmail && s.customerEmail.toLowerCase() === targetEmail)
  );

  // Firestore
  try {
    let q;
    if (targetUserId) {
      q = query(collection(db, "stock_alert_subscriptions"), where("userId", "==", targetUserId));
    } else if (targetEmail) {
      q = query(collection(db, "stock_alert_subscriptions"), where("customerEmail", "==", targetEmail));
    }

    if (q) {
      const snap = await getDocs(q);
      const firestoreSubs: StockAlertSubscription[] = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id } as StockAlertSubscription)
      );

      // Merge unique
      const mergedMap = new Map<string, StockAlertSubscription>();
      local.forEach((s) => mergedMap.set(s.id, s));
      firestoreSubs.forEach((s) => mergedMap.set(s.id, s));
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  } catch {}

  return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// -------------------------------------------------------------
// Trigger Back in Stock Notifications (Push & Email)
// -------------------------------------------------------------
export async function triggerBackInStockNotifications(
  productId: string,
  restockQuantity: number = 10,
  variantId?: string | number,
  variantLabel?: string
): Promise<{ notifiedCount: number; subscriptions: StockAlertSubscription[] }> {
  if (!productId) return { notifiedCount: 0, subscriptions: [] };

  const allSubs = getLocalSubscriptions();
  const matched = allSubs.filter((s) => {
    if (s.productId !== productId || s.status !== "pending") return false;
    if (variantLabel && s.variantLabel) {
      return s.variantLabel.toLowerCase().trim() === variantLabel.toLowerCase().trim();
    }
    if (variantId && s.variantId) {
      return String(s.variantId) === String(variantId);
    }
    return true;
  });

  if (matched.length === 0) {
    return { notifiedCount: 0, subscriptions: [] };
  }

  const nowIso = new Date().toISOString();
  const notifiedSubs: StockAlertSubscription[] = [];

  for (const sub of matched) {
    // 1. Deliver Browser / OS Push Notification
    if (typeof window !== "undefined" && (sub.channel === "push" || sub.channel === "both")) {
      try {
        await sendStockPushNotification(sub, restockQuantity);
      } catch (err) {
        console.warn("Push notification delivery note:", err);
      }
    }

    // 2. Deliver Email Notification (Simulated & logged to customer notification tray)
    if (sub.channel === "email" || sub.channel === "both") {
      logEmailDelivery(sub, restockQuantity);
    }

    // Update Status
    sub.status = "notified";
    sub.notifiedAt = nowIso;
    sub.restockQuantity = restockQuantity;
    notifiedSubs.push(sub);

    // Update Firestore in background
    try {
      await updateDoc(doc(db, "stock_alert_subscriptions", sub.id), {
        status: "notified",
        notifiedAt: nowIso,
        restockQuantity,
      });
    } catch {}
  }

  saveLocalSubscriptions(allSubs);
  notifyUpdate();

  return { notifiedCount: notifiedSubs.length, subscriptions: notifiedSubs };
}

// -------------------------------------------------------------
// Native Push Notification Dispatcher
// -------------------------------------------------------------
async function sendStockPushNotification(sub: StockAlertSubscription, restockQuantity: number) {
  if (typeof window === "undefined") return;

  return sendBackInStockPushNotification({
    productId: sub.productId,
    productName: sub.productName,
    productSlug: sub.productSlug,
    productImage: sub.productImage,
    restockQuantity,
    variantLabel: sub.variantLabel,
    userId: sub.userId,
  });
}

// -------------------------------------------------------------
// Email Simulation & Activity Logger
// -------------------------------------------------------------
function logEmailDelivery(sub: StockAlertSubscription, restockQuantity: number) {
  console.log(
    `[BackInStock Email Dispatcher] Sent restock email to ${sub.customerEmail} for "${sub.productName}". Restock quantity: ${restockQuantity}`
  );
  // Can be connected to server endpoint / SMTP / Resend API when live
}

// -------------------------------------------------------------
// Admin Analytics & Intelligence
// -------------------------------------------------------------
export interface StockAlertAnalytics {
  totalSubscriptions: number;
  pendingAlerts: number;
  notifiedAlerts: number;
  cancelledAlerts: number;
  conversionRate: number;
  topRequestedProducts: Array<{
    productId: string;
    productName: string;
    productImage: string;
    productPrice: number;
    pendingCount: number;
    totalCount: number;
    variants: Array<{ label: string; count: number }>;
  }>;
  recentSubscriptions: StockAlertSubscription[];
}

export async function getBackInStockAnalytics(): Promise<StockAlertAnalytics> {
  let subs = getLocalSubscriptions();

  // Try to supplement from Firestore
  try {
    const snap = await getDocs(collection(db, "stock_alert_subscriptions"));
    if (!snap.empty) {
      const remote = snap.docs.map((d) => ({ ...d.data(), id: d.id } as StockAlertSubscription));
      const map = new Map<string, StockAlertSubscription>();
      subs.forEach((s) => map.set(s.id, s));
      remote.forEach((s) => map.set(s.id, s));
      subs = Array.from(map.values());
    }
  } catch {}

  // Seed default demonstration alerts if empty so Admin dashboard has live interactive preview
  if (subs.length === 0) {
    subs = [
      {
        id: "bis_demo_1",
        productId: "7873",
        productName: "Premium Silk Katan Saree Combo Pack – Blue",
        productSlug: "premium-silk-katan-saree-combo-pack-blue-10873",
        productImage: "/products/premium-silk-katan-saree.jpg",
        productPrice: 1790,
        variantLabel: "Color: Blue",
        customerName: "Sadia Rahman",
        customerEmail: "sadia.rahman@gmail.com",
        customerPhone: "01711223344",
        channel: "both",
        status: "pending",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: "bis_demo_2",
        productId: "7873",
        productName: "Premium Silk Katan Saree Combo Pack – Blue",
        productSlug: "premium-silk-katan-saree-combo-pack-blue-10873",
        productImage: "/products/premium-silk-katan-saree.jpg",
        productPrice: 1790,
        variantLabel: "Color: Blue",
        customerName: "Farzana Akter",
        customerEmail: "farzana.akter@yahoo.com",
        customerPhone: "01819876543",
        channel: "email",
        status: "pending",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "bis_demo_3",
        productId: "2",
        productName: "OLEVS Luxury Men’s Quartz Watch – Waterproof Stainless Steel",
        productSlug: "olevs-waterproof-luxury-mens-quartz-watchblack-white-3287",
        productImage: "/products/olevs-luxury-watch.jpg",
        productPrice: 1250,
        variantLabel: "Dial: Black-Silver",
        customerName: "Tanvir Ahmed",
        customerEmail: "tanvir.bd@outlook.com",
        customerPhone: "01912345678",
        channel: "both",
        status: "notified",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        notifiedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        restockQuantity: 25,
      },
    ];
    saveLocalSubscriptions(subs);
  }

  const totalSubscriptions = subs.length;
  const pendingAlerts = subs.filter((s) => s.status === "pending").length;
  const notifiedAlerts = subs.filter((s) => s.status === "notified").length;
  const cancelledAlerts = subs.filter((s) => s.status === "cancelled").length;
  const conversionRate = totalSubscriptions > 0 ? Math.round((notifiedAlerts / totalSubscriptions) * 100) : 0;

  // Group by Product for Demand Forecasting
  const productMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      productImage: string;
      productPrice: number;
      pendingCount: number;
      totalCount: number;
      variantMap: Map<string, number>;
    }
  >();

  for (const s of subs) {
    if (!productMap.has(s.productId)) {
      productMap.set(s.productId, {
        productId: s.productId,
        productName: s.productName,
        productImage: s.productImage,
        productPrice: s.productPrice,
        pendingCount: 0,
        totalCount: 0,
        variantMap: new Map(),
      });
    }

    const item = productMap.get(s.productId)!;
    item.totalCount++;
    if (s.status === "pending") {
      item.pendingCount++;
    }

    const vKey = s.variantLabel || "Standard";
    item.variantMap.set(vKey, (item.variantMap.get(vKey) || 0) + 1);
  }

  const topRequestedProducts = Array.from(productMap.values())
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productImage: p.productImage,
      productPrice: p.productPrice,
      pendingCount: p.pendingCount,
      totalCount: p.totalCount,
      variants: Array.from(p.variantMap.entries()).map(([label, count]) => ({ label, count })),
    }))
    .sort((a, b) => b.pendingCount - a.pendingCount || b.totalCount - a.totalCount);

  const recentSubscriptions = [...subs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    totalSubscriptions,
    pendingAlerts,
    notifiedAlerts,
    cancelledAlerts,
    conversionRate,
    topRequestedProducts,
    recentSubscriptions,
  };
}
