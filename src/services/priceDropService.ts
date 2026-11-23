import { db } from "@/integrations/firebase/client";
import { sendPriceDropPushNotification } from "@/services/notificationService";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { playNewOrderSound, unlockAudio } from "@/hooks/useAdminOrderNotifications";

export interface PriceAlertSubscription {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  originalProductPrice: number;
  currentPrice: number;
  targetPrice: number;
  variantId?: string | number;
  variantAttributes?: Record<string, string>;
  variantLabel?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel: "email" | "push" | "both";
  status: "active" | "triggered" | "cancelled";
  createdAt: string;
  triggeredAt?: string;
  triggeredPrice?: number;
  cancelledAt?: string;
}

export interface PriceHistoryRecord {
  id: string;
  productId: string;
  productName: string;
  variantLabel?: string;
  oldPrice: number;
  newPrice: number;
  discountAmount: number;
  discountPercent: number;
  changedAt: string;
  reason: "admin_adjustment" | "supplier_sync" | "flash_sale" | "manual_simulation";
}

export interface PriceAlertNotificationLog {
  id: string;
  alertId: string;
  productId: string;
  productName: string;
  customerEmail: string;
  customerName: string;
  channel: "email" | "push" | "both";
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
  sentAt: string;
  status: "sent" | "delivered" | "failed";
}

export interface PriceAlertSettings {
  enabled: boolean;
  allowGuestSubscriptions: boolean;
  autoTriggerOnPriceDrop: boolean;
  minDiscountPercent: number;
  emailSubjectTemplate: string;
  pushTitleTemplate: string;
  pushBodyTemplate: string;
}

export const DEFAULT_PRICE_ALERT_SETTINGS: PriceAlertSettings = {
  enabled: true,
  allowGuestSubscriptions: true,
  autoTriggerOnPriceDrop: true,
  minDiscountPercent: 1,
  emailSubjectTemplate: "🔥 Price Drop Alert: {product_name} is now ৳{new_price}!",
  pushTitleTemplate: "📉 দাম কমেছে: {product_name}",
  pushBodyTemplate: "আপনার টার্গেট প্রাইস ৳{target_price} এর নিচে নেমে এখন মাত্র ৳{new_price}! স্টক সীমিত, এখনই অর্ডার করুন।",
};

const STORAGE_SUBSCRIPTIONS_KEY = "durtup_price_drop_subscriptions";
const STORAGE_SETTINGS_KEY = "durtup_price_drop_settings";
const STORAGE_HISTORY_KEY = "durtup_price_drop_history";
const STORAGE_LOGS_KEY = "durtup_price_drop_notification_logs";
export const PRICE_DROP_EVENT = "durtup_price_drop_updated";

function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRICE_DROP_EVENT));
  }
}

// -------------------------------------------------------------
// Settings Management
// -------------------------------------------------------------
export function getPriceAlertSettings(): PriceAlertSettings {
  if (typeof window === "undefined") return DEFAULT_PRICE_ALERT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_PRICE_ALERT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PRICE_ALERT_SETTINGS;
}

export function savePriceAlertSettings(settings: Partial<PriceAlertSettings>): PriceAlertSettings {
  const current = getPriceAlertSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      notifyUpdate();
    } catch {}
  }
  return updated;
}

// -------------------------------------------------------------
// Local Storage Read & Write
// -------------------------------------------------------------
export function getLocalPriceAlertSubscriptions(): PriceAlertSubscription[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalPriceAlertSubscriptions(subs: PriceAlertSubscription[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SUBSCRIPTIONS_KEY, JSON.stringify(subs));
    notifyUpdate();
  } catch {}
}

export function getLocalPriceHistory(): PriceHistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalPriceHistory(history: PriceHistoryRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch {}
}

export function getLocalPriceAlertLogs(): PriceAlertNotificationLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalPriceAlertLogs(logs: PriceAlertNotificationLog[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 150)));
  } catch {}
}

// -------------------------------------------------------------
// Duplicate Check
// -------------------------------------------------------------
export async function checkCustomerPriceAlert(
  productId: string,
  variantLabel?: string,
  emailOrUserId?: string
): Promise<{ isSubscribed: boolean; subscription?: PriceAlertSubscription }> {
  if (!productId || !emailOrUserId) return { isSubscribed: false };
  const target = emailOrUserId.trim().toLowerCase();
  const cleanVariant = (variantLabel || "").trim().toLowerCase();

  // 1. Check local storage
  const local = getLocalPriceAlertSubscriptions();
  const found = local.find(
    (s) =>
      s.productId === productId &&
      s.status === "active" &&
      ((variantLabel && (s.variantLabel || "").toLowerCase() === cleanVariant) || (!variantLabel && !s.variantLabel)) &&
      (s.customerEmail.toLowerCase() === target || (s.userId && s.userId.toLowerCase() === target))
  );

  if (found) {
    return { isSubscribed: true, subscription: found };
  }

  // 2. Check Firestore
  try {
    const q = query(
      collection(db, "price_drop_subscriptions"),
      where("productId", "==", productId),
      where("status", "==", "active")
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as PriceAlertSubscription;
      const matchTarget =
        (data.customerEmail && data.customerEmail.toLowerCase() === target) ||
        (data.userId && data.userId.toLowerCase() === target);
      const matchVariant =
        (!variantLabel && !data.variantLabel) ||
        ((data.variantLabel || "").toLowerCase() === cleanVariant);
      if (matchTarget && matchVariant) {
        return { isSubscribed: true, subscription: { ...data, id: d.id } };
      }
    }
  } catch {}

  return { isSubscribed: false };
}

// -------------------------------------------------------------
// Subscribe Customer to Price Drop Alert
// -------------------------------------------------------------
export interface SubscribePriceDropParams {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  currentPrice: number;
  targetPrice: number;
  variantId?: string | number;
  variantAttributes?: Record<string, string>;
  variantLabel?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  channel?: "email" | "push" | "both";
}

export async function subscribeToPriceAlert(
  params: SubscribePriceDropParams
): Promise<{ success: boolean; message: string; subscription?: PriceAlertSubscription; alreadySubscribed?: boolean }> {
  const email = (params.customerEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, message: "অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস দিন" };
  }

  const currentPrice = Math.max(0, Number(params.currentPrice) || 0);
  const targetPrice = Math.max(0, Number(params.targetPrice) || 0);

  if (targetPrice <= 0) {
    return { success: false, message: "টার্গেট প্রাইস অবশ্যই ০ টাকার বেশি হতে হবে" };
  }

  if (targetPrice >= currentPrice) {
    return {
      success: false,
      message: `টার্গেট প্রাইস অবশ্যই বর্তমান মূল্য (৳${currentPrice.toLocaleString()}) এর চেয়ে কম হতে হবে`,
    };
  }

  // Duplicate Check
  const check = await checkCustomerPriceAlert(params.productId, params.variantLabel, params.userId || email);
  if (check.isSubscribed) {
    return {
      success: false,
      alreadySubscribed: true,
      message: "আপনি ইতিমধ্যে এই পণ্যটির জন্য দাম কমার অ্যালার্ট তৈরি করেছেন।",
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

  const subId = `pda_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newSub: PriceAlertSubscription = {
    id: subId,
    productId: params.productId,
    productName: params.productName,
    productSlug: params.productSlug,
    productImage: params.productImage || "/durtup-logo.png",
    originalProductPrice: currentPrice,
    currentPrice: currentPrice,
    targetPrice: targetPrice,
    variantId: params.variantId,
    variantAttributes: params.variantAttributes,
    variantLabel: params.variantLabel,
    userId: params.userId,
    customerName: params.customerName || "Valued Customer",
    customerEmail: email,
    customerPhone: params.customerPhone?.trim(),
    channel,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  // 1. Save to LocalStorage
  const local = getLocalPriceAlertSubscriptions();
  local.unshift(newSub);
  saveLocalPriceAlertSubscriptions(local);

  // 2. Sync to Firestore in background
  try {
    setDoc(doc(db, "price_drop_subscriptions", subId), newSub).catch(() => {});
  } catch {}

  return {
    success: true,
    message: `দাম কমার অ্যালার্ট সফলভাবে সেট করা হয়েছে! দাম ৳${targetPrice.toLocaleString()}-এ নামলেই আপনি সাথে সাথে নোটিফিকেশন পাবেন।`,
    subscription: newSub,
  };
}

// -------------------------------------------------------------
// Cancel / Delete Alert
// -------------------------------------------------------------
export async function cancelPriceAlert(
  subscriptionId: string,
  emailOrUserId?: string
): Promise<{ success: boolean; message: string }> {
  const local = getLocalPriceAlertSubscriptions();
  const idx = local.findIndex((s) => s.id === subscriptionId);

  if (idx !== -1) {
    const sub = local[idx];
    if (emailOrUserId) {
      const target = emailOrUserId.trim().toLowerCase();
      const match =
        sub.customerEmail.toLowerCase() === target ||
        (sub.userId && sub.userId.toLowerCase() === target);
      if (!match) {
        return { success: false, message: "অ্যালার্ট বাতিল করার অনুমতি নেই" };
      }
    }

    local[idx] = {
      ...sub,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    };
    saveLocalPriceAlertSubscriptions(local);
  }

  // Firestore update
  try {
    updateDoc(doc(db, "price_drop_subscriptions", subscriptionId), {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    }).catch(() => {});
  } catch {}

  return { success: true, message: "প্রাইস ড্রপ অ্যালার্ট সফলভাবে বাতিল করা হয়েছে।" };
}

export async function deletePriceAlert(
  subscriptionId: string
): Promise<{ success: boolean; message: string }> {
  const local = getLocalPriceAlertSubscriptions();
  const filtered = local.filter((s) => s.id !== subscriptionId);
  saveLocalPriceAlertSubscriptions(filtered);

  try {
    deleteDoc(doc(db, "price_drop_subscriptions", subscriptionId)).catch(() => {});
  } catch {}

  return { success: true, message: "অ্যালার্ট মুছে ফেলা হয়েছে।" };
}

// -------------------------------------------------------------
// Customer Active & History Alerts
// -------------------------------------------------------------
export async function getCustomerPriceAlerts(
  emailOrUserId?: string
): Promise<PriceAlertSubscription[]> {
  if (!emailOrUserId) return [];
  const target = emailOrUserId.trim().toLowerCase();

  // 1. Read local storage
  const local = getLocalPriceAlertSubscriptions();
  const localCustomer = local.filter(
    (s) =>
      s.customerEmail.toLowerCase() === target ||
      (s.userId && s.userId.toLowerCase() === target)
  );

  // 2. Fetch from Firestore to merge remote alerts
  try {
    const qEmail = query(
      collection(db, "price_drop_subscriptions"),
      where("customerEmail", "==", target)
    );
    const snap = await getDocs(qEmail);
    const remoteList: PriceAlertSubscription[] = [];
    snap.forEach((d) => remoteList.push({ ...(d.data() as PriceAlertSubscription), id: d.id }));

    // Merge deduplicated by ID
    const map = new Map<string, PriceAlertSubscription>();
    localCustomer.forEach((s) => map.set(s.id, s));
    remoteList.forEach((s) => map.set(s.id, s));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return localCustomer.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// -------------------------------------------------------------
// Record Price Change in History
// -------------------------------------------------------------
export function recordPriceChange(
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
  variantLabel?: string,
  reason: "admin_adjustment" | "supplier_sync" | "flash_sale" | "manual_simulation" = "admin_adjustment"
): PriceHistoryRecord {
  const discountAmount = Math.max(0, oldPrice - newPrice);
  const discountPercent = oldPrice > 0 ? Math.round((discountAmount / oldPrice) * 100) : 0;

  const record: PriceHistoryRecord = {
    id: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    productId,
    productName,
    variantLabel,
    oldPrice,
    newPrice,
    discountAmount,
    discountPercent,
    changedAt: new Date().toISOString(),
    reason,
  };

  const history = getLocalPriceHistory();
  history.unshift(record);
  saveLocalPriceHistory(history);

  // Firestore sync in background
  try {
    setDoc(doc(db, "price_drop_history", record.id), record).catch(() => {});
  } catch {}

  return record;
}

// -------------------------------------------------------------
// Trigger Notifications on Price Drop
// -------------------------------------------------------------
export interface TriggerPriceDropResult {
  triggeredCount: number;
  totalSubscribers: number;
  notifiedEmails: string[];
  notificationsSent: number;
  priceHistoryRecord: PriceHistoryRecord;
}

export async function triggerPriceDropNotifications(
  productId: string,
  newPrice: number,
  oldPrice: number,
  productTitle?: string,
  variantLabel?: string,
  reason: "admin_adjustment" | "supplier_sync" | "flash_sale" | "manual_simulation" = "admin_adjustment"
): Promise<TriggerPriceDropResult> {
  const settings = getPriceAlertSettings();
  if (!settings.enabled) {
    return {
      triggeredCount: 0,
      totalSubscribers: 0,
      notifiedEmails: [],
      notificationsSent: 0,
      priceHistoryRecord: recordPriceChange(productId, productTitle || "Product", oldPrice, newPrice, variantLabel, reason),
    };
  }

  // 1. Record the price history
  const priceRecord = recordPriceChange(
    productId,
    productTitle || "Product",
    oldPrice,
    newPrice,
    variantLabel,
    reason
  );

  // Only proceed to trigger alerts if price actually dropped
  if (newPrice >= oldPrice) {
    return {
      triggeredCount: 0,
      totalSubscribers: 0,
      notifiedEmails: [],
      notificationsSent: 0,
      priceHistoryRecord: priceRecord,
    };
  }

  const cleanVariant = (variantLabel || "").trim().toLowerCase();

  // 2. Fetch all active subscriptions for this product
  let allSubs: PriceAlertSubscription[] = [];

  // Local storage read
  const local = getLocalPriceAlertSubscriptions();
  const localMatching = local.filter((s) => s.productId === productId);
  allSubs = [...localMatching];

  // Remote Firestore read
  try {
    const q = query(
      collection(db, "price_drop_subscriptions"),
      where("productId", "==", productId),
      where("status", "==", "active")
    );
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as PriceAlertSubscription;
      if (!allSubs.some((s) => s.id === d.id)) {
        allSubs.push({ ...data, id: d.id });
      }
    });
  } catch {}

  // Filter for matching active subscriptions where:
  // - status is "active" (Prevents duplicate notifications)
  // - newPrice <= targetPrice (Target price condition is met!)
  // - variant matches if specified
  const eligibleSubs = allSubs.filter((s) => {
    if (s.status !== "active") return false;
    if (newPrice > s.targetPrice) return false;
    if (variantLabel && s.variantLabel) {
      return (s.variantLabel || "").trim().toLowerCase() === cleanVariant;
    }
    return true;
  });

  const notifiedEmails: string[] = [];
  const logsToAdd: PriceAlertNotificationLog[] = [];
  const now = new Date().toISOString();

  // Play audio chime and trigger notifications
  if (typeof window !== "undefined" && eligibleSubs.length > 0) {
    try {
      unlockAudio();
      playNewOrderSound();
    } catch {}
  }

  for (const sub of eligibleSubs) {
    const productName = sub.productName || productTitle || "পণ্য";
    const title = settings.pushTitleTemplate.replace("{product_name}", productName);
    const body = settings.pushBodyTemplate
      .replace("{product_name}", productName)
      .replace("{target_price}", sub.targetPrice.toLocaleString())
      .replace("{new_price}", newPrice.toLocaleString());

    // Send Push Notification via Unified Notification Service (SW Native + Audio + Deep Link)
    if (sub.channel === "push" || sub.channel === "both") {
      sendPriceDropPushNotification({
        productId: sub.productId,
        productName,
        productSlug: sub.productSlug,
        productImage: sub.productImage,
        oldPrice,
        newPrice,
        targetPrice: sub.targetPrice,
        variantLabel: sub.variantLabel,
        userId: sub.userId,
      }).catch(() => {});
    }

    // Log notification
    logsToAdd.push({
      id: `pdl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      alertId: sub.id,
      productId: sub.productId,
      productName: sub.productName,
      customerEmail: sub.customerEmail,
      customerName: sub.customerName,
      channel: sub.channel,
      oldPrice,
      newPrice,
      targetPrice: sub.targetPrice,
      sentAt: now,
      status: "sent",
    });

    notifiedEmails.push(sub.customerEmail);

    // Update in Local Storage: set status to 'triggered' with timestamp & trigger price (prevents duplicate triggers)
    const localIdx = local.findIndex((s) => s.id === sub.id);
    if (localIdx !== -1) {
      local[localIdx] = {
        ...local[localIdx],
        status: "triggered",
        currentPrice: newPrice,
        triggeredAt: now,
        triggeredPrice: newPrice,
      };
    }

    // Sync to Firestore
    try {
      updateDoc(doc(db, "price_drop_subscriptions", sub.id), {
        status: "triggered",
        currentPrice: newPrice,
        triggeredAt: now,
        triggeredPrice: newPrice,
      }).catch(() => {});
    } catch {}
  }

  saveLocalPriceAlertSubscriptions(local);

  // Save notification logs
  if (logsToAdd.length > 0) {
    const existingLogs = getLocalPriceAlertLogs();
    saveLocalPriceAlertLogs([...logsToAdd, ...existingLogs]);

    logsToAdd.forEach((log) => {
      try {
        setDoc(doc(db, "price_drop_logs", log.id), log).catch(() => {});
      } catch {}
    });
  }

  notifyUpdate();

  return {
    triggeredCount: eligibleSubs.length,
    totalSubscribers: allSubs.filter((s) => s.status === "active").length,
    notifiedEmails,
    notificationsSent: eligibleSubs.length,
    priceHistoryRecord: priceRecord,
  };
}

// -------------------------------------------------------------
// Admin Demand & Analytics
// -------------------------------------------------------------
export interface PriceAlertAnalytics {
  totalAlerts: number;
  activeAlerts: number;
  triggeredAlerts: number;
  cancelledAlerts: number;
  totalPotentialRevenue: number;
  topDemandedProducts: Array<{
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    currentPrice: number;
    alertCount: number;
    avgTargetPrice: number;
    minTargetPrice: number;
    potentialDiscount: number;
  }>;
  recentLogs: PriceAlertNotificationLog[];
  priceHistory: PriceHistoryRecord[];
}

export async function getPriceDropAnalytics(): Promise<PriceAlertAnalytics> {
  const local = getLocalPriceAlertSubscriptions();
  const remote: PriceAlertSubscription[] = [];

  try {
    const snap = await getDocs(collection(db, "price_drop_subscriptions"));
    snap.forEach((d) => remote.push({ ...(d.data() as PriceAlertSubscription), id: d.id }));
  } catch {}

  // Deduplicate
  const map = new Map<string, PriceAlertSubscription>();
  local.forEach((s) => map.set(s.id, s));
  remote.forEach((s) => map.set(s.id, s));
  const all = Array.from(map.values());

  const totalAlerts = all.length;
  const activeAlerts = all.filter((s) => s.status === "active").length;
  const triggeredAlerts = all.filter((s) => s.status === "triggered").length;
  const cancelledAlerts = all.filter((s) => s.status === "cancelled").length;

  // Potential revenue from active alerts
  const totalPotentialRevenue = all
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.targetPrice || 0), 0);

  // Group by product for demand intelligence
  const productDemandMap = new Map<
    string,
    {
      productName: string;
      productSlug: string;
      productImage: string;
      currentPrice: number;
      targetPrices: number[];
    }
  >();

  all
    .filter((s) => s.status === "active")
    .forEach((s) => {
      const existing = productDemandMap.get(s.productId);
      if (existing) {
        existing.targetPrices.push(s.targetPrice);
      } else {
        productDemandMap.set(s.productId, {
          productName: s.productName,
          productSlug: s.productSlug,
          productImage: s.productImage,
          currentPrice: s.currentPrice || s.originalProductPrice,
          targetPrices: [s.targetPrice],
        });
      }
    });

  const topDemandedProducts = Array.from(productDemandMap.entries())
    .map(([productId, data]) => {
      const alertCount = data.targetPrices.length;
      const avgTargetPrice = Math.round(
        data.targetPrices.reduce((a, b) => a + b, 0) / alertCount
      );
      const minTargetPrice = Math.min(...data.targetPrices);
      const potentialDiscount = data.currentPrice > 0
        ? Math.round(((data.currentPrice - avgTargetPrice) / data.currentPrice) * 100)
        : 0;

      return {
        productId,
        productName: data.productName,
        productSlug: data.productSlug,
        productImage: data.productImage,
        currentPrice: data.currentPrice,
        alertCount,
        avgTargetPrice,
        minTargetPrice,
        potentialDiscount,
      };
    })
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, 10);

  const recentLogs = getLocalPriceAlertLogs();
  const priceHistory = getLocalPriceHistory();

  return {
    totalAlerts,
    activeAlerts,
    triggeredAlerts,
    cancelledAlerts,
    totalPotentialRevenue,
    topDemandedProducts,
    recentLogs,
    priceHistory,
  };
}
