import { db } from "@/integrations/firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { CartItem } from "@/contexts/CartContext";

export interface AbandonedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string | null;
}

export interface AbandonedCart {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: AbandonedCartItem[];
  itemCount: number;
  subtotal: number;
  status: "active" | "abandoned" | "recovered" | "expired";
  createdAt: string;
  updatedAt: string;
  abandonedAt?: string;
  recoveredAt?: string;
  recoveredOrderId?: string;
  recoveredRevenue?: number;
  remindersSent: {
    stage1?: { sentAt: string; channel: string };
    stage2?: { sentAt: string; channel: string };
    stage3?: { sentAt: string; channel: string };
  };
  lastReminderSentAt?: string;
  nextReminderDueAt?: string;
  incentiveCouponCode?: string;
  checkoutUrl: string;
  notificationConsent?: boolean;
}

export interface AbandonedCartSettings {
  enabled: boolean;
  stage1Hours: number; // default: 1 hour
  stage2Hours: number; // default: 24 hours
  stage3Hours: number; // default: 48 hours
  channels: {
    pushNotification: boolean;
    inAppNotification: boolean;
    email: boolean;
    telegramAlert: boolean;
  };
  incentives: {
    enableStage3Discount: boolean;
    couponCode: string;
    discountPercent: number;
  };
  templates: {
    stage1Title: string;
    stage1Body: string;
    stage2Title: string;
    stage2Body: string;
    stage3Title: string;
    stage3Body: string;
  };
}

export interface CartRecoveryAnalytics {
  totalAbandonedCarts: number;
  totalRecoveredCarts: number;
  recoveryRate: number; // percentage
  totalRecoveredRevenue: number;
  potentialRevenueLost: number;
  stage1SentCount: number;
  stage2SentCount: number;
  stage3SentCount: number;
}

export const DEFAULT_ABANDONED_CART_SETTINGS: AbandonedCartSettings = {
  enabled: true,
  stage1Hours: 1,
  stage2Hours: 24,
  stage3Hours: 48,
  channels: {
    pushNotification: true,
    inAppNotification: true,
    email: true,
    telegramAlert: true,
  },
  incentives: {
    enableStage3Discount: true,
    couponCode: "SAVE5NOW",
    discountPercent: 5,
  },
  templates: {
    stage1Title: "🛍️ আপনার কার্টের পণ্যগুলো অপেক্ষা করছে!",
    stage1Body: "আপনি Durtup-এ পছন্দের পণ্য কার্টে রেখে গেছেন। এখনই অর্ডার সম্পন্ন করে দ্রুত ডেলিভারি নিশ্চিত করুন।",
    stage2Title: "⚡ স্টক শেষ হওয়ার আগে অর্ডার সম্পন্ন করুন!",
    stage2Body: "আপনার কার্টের পণ্যটির চাহিদা অনেক বেশি! এখনই অর্ডারটি চূড়ান্ত করুন।",
    stage3Title: "🎁 শেষ সুযোগ! আপনার জন্য বিশেষ উপহার!",
    stage3Body: "আপনার কার্টের পণ্যগুলোতে ৫% বিশেষ ছাড় দেওয়া হয়েছে। কোড: {COUPON} ব্যবহার করে এখনি অর্ডার করুন।",
  },
};

const SETTINGS_STORAGE_KEY = "durtup_abandoned_cart_settings";
const ABANDONED_COLLECTION = "abandoned_carts";

// ----------------------------------------------------------------------
// Settings Management
// ----------------------------------------------------------------------
let cachedSettings: AbandonedCartSettings | null = (() => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
})();

export async function getAbandonedCartSettings(forceRefresh = false): Promise<AbandonedCartSettings> {
  if (!forceRefresh && cachedSettings) {
    return cachedSettings;
  }

  try {
    const sDoc = await getDoc(doc(db, "settings", "abandoned_carts"));
    if (sDoc.exists()) {
      const data = sDoc.data() as Partial<AbandonedCartSettings>;
      cachedSettings = {
        ...DEFAULT_ABANDONED_CART_SETTINGS,
        ...data,
        channels: { ...DEFAULT_ABANDONED_CART_SETTINGS.channels, ...(data.channels || {}) },
        incentives: { ...DEFAULT_ABANDONED_CART_SETTINGS.incentives, ...(data.incentives || {}) },
        templates: { ...DEFAULT_ABANDONED_CART_SETTINGS.templates, ...(data.templates || {}) },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cachedSettings));
        } catch {}
      }
      return cachedSettings;
    }
  } catch (err) {
    console.warn("[AbandonedCartService] Settings fetch notice:", err);
  }

  cachedSettings = cachedSettings || { ...DEFAULT_ABANDONED_CART_SETTINGS };
  return cachedSettings;
}

export async function saveAbandonedCartSettings(settings: Partial<AbandonedCartSettings>): Promise<AbandonedCartSettings> {
  const current = await getAbandonedCartSettings(true);
  const updated: AbandonedCartSettings = {
    ...current,
    ...settings,
    channels: { ...current.channels, ...(settings.channels || {}) },
    incentives: { ...current.incentives, ...(settings.incentives || {}) },
    templates: { ...current.templates, ...(settings.templates || {}) },
  };

  await setDoc(doc(db, "settings", "abandoned_carts"), updated, { merge: true });
  cachedSettings = updated;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

// ----------------------------------------------------------------------
// Cart Synchronization & Tracking
// ----------------------------------------------------------------------

/**
 * Records or updates the customer's cart state for abandoned cart tracking.
 * Called whenever items are added or modified in the shopping cart.
 */
export async function recordOrUpdateCartState(
  userId: string,
  items: CartItem[],
  customerInfo?: { name?: string; email?: string; phone?: string; notificationConsent?: boolean }
): Promise<void> {
  if (!userId) return;

  const cartId = `cart_${userId}`;
  const nowIso = new Date().toISOString();

  // If cart is empty, mark as cleared or delete tracking
  if (!items || items.length === 0) {
    try {
      const cRef = doc(db, ABANDONED_COLLECTION, cartId);
      const snap = await getDoc(cRef);
      if (snap.exists() && snap.data().status === "active") {
        await updateDoc(cRef, {
          status: "expired",
          updatedAt: nowIso,
          items: [],
          itemCount: 0,
          subtotal: 0
        });
      }
    } catch {}
    return;
  }

  const mappedItems: AbandonedCartItem[] = items.map((item) => ({
    productId: item.product_id || item.product?.id || item.id,
    name: item.product?.name || "Product",
    price: Number(item.product?.discount_price || item.product?.regular_price || 0),
    quantity: Number(item.quantity || 1),
    image: item.image || (item as any).product?.image || "",
    variantName: item.variant_name || null,
  }));

  const subtotal = mappedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = mappedItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartDocRef = doc(db, ABANDONED_COLLECTION, cartId);
  try {
    const snap = await getDoc(cartDocRef);
    const existing = snap.exists() ? (snap.data() as AbandonedCart) : null;

    // Do not overwrite if already recovered
    if (existing && existing.status === "recovered") {
      return;
    }

    const payload: Partial<AbandonedCart> = {
      id: cartId,
      userId,
      customerName: customerInfo?.name || existing?.customerName || "Customer",
      customerEmail: customerInfo?.email || existing?.customerEmail || "",
      customerPhone: customerInfo?.phone || existing?.customerPhone || "",
      items: mappedItems,
      itemCount,
      subtotal,
      status: "active",
      updatedAt: nowIso,
      checkoutUrl: "/checkout",
      notificationConsent: customerInfo?.notificationConsent ?? existing?.notificationConsent ?? true,
    };

    if (!existing) {
      payload.createdAt = nowIso;
      payload.remindersSent = {};
    }

    await setDoc(cartDocRef, payload, { merge: true });
  } catch (err) {
    console.warn("[AbandonedCartService] Record cart state warning:", err);
  }
}

/**
 * Automatically marks an abandoned cart as RECOVERED upon successful checkout!
 * Immediately terminates all scheduled reminders.
 */
export async function markCartAsRecovered(
  userId: string,
  orderId: string,
  orderTotal?: number
): Promise<void> {
  if (!userId) return;

  const cartId = `cart_${userId}`;
  const nowIso = new Date().toISOString();

  try {
    const cartRef = doc(db, ABANDONED_COLLECTION, cartId);
    const snap = await getDoc(cartRef);

    if (snap.exists()) {
      const data = snap.data() as AbandonedCart;
      await updateDoc(cartRef, {
        status: "recovered",
        recoveredAt: nowIso,
        recoveredOrderId: orderId,
        recoveredRevenue: Number(orderTotal || data.subtotal || 0),
        updatedAt: nowIso,
      });

      // Also record into recovery ledger for analytics
      const recoveryLedgerRef = doc(collection(db, "cart_recovery_ledger"));
      await setDoc(recoveryLedgerRef, {
        id: recoveryLedgerRef.id,
        cartId,
        userId,
        orderId,
        revenue: Number(orderTotal || data.subtotal || 0),
        itemCount: data.itemCount || 0,
        recoveredAt: nowIso,
        createdAt: nowIso,
      });
    }
  } catch (err) {
    console.error("[AbandonedCartService] Failed to mark cart as recovered:", err);
  }
}

// ----------------------------------------------------------------------
// Automated Reminder Dispatch Engine
// ----------------------------------------------------------------------

/**
 * Evaluates all carts and dispatches automated Stage 1 (1h), Stage 2 (24h), and Stage 3 (48h) reminders.
 */
export async function processDueAbandonedCartReminders(): Promise<{
  processed: number;
  stage1Sent: number;
  stage2Sent: number;
  stage3Sent: number;
}> {
  const settings = await getAbandonedCartSettings();
  if (!settings.enabled) {
    return { processed: 0, stage1Sent: 0, stage2Sent: 0, stage3Sent: 0 };
  }

  let stage1Sent = 0;
  let stage2Sent = 0;
  let stage3Sent = 0;
  let processed = 0;

  try {
    const q = query(
      collection(db, ABANDONED_COLLECTION),
      where("status", "in", ["active", "abandoned"]),
      limit(100)
    );
    const snap = await getDocs(q);
    const now = Date.now();

    for (const d of snap.docs) {
      processed++;
      const cart = d.data() as AbandonedCart;
      if (!cart.items || cart.items.length === 0) continue;

      const lastActivityTime = new Date(cart.updatedAt || cart.createdAt).getTime();
      const hoursSinceActivity = (now - lastActivityTime) / (1000 * 60 * 60);

      const reminders = cart.remindersSent || {};
      let updatedReminders = { ...reminders };
      let reminderToSend: { stage: 1 | 2 | 3; title: string; body: string } | null = null;

      // Check Stage 3 (48h)
      if (hoursSinceActivity >= settings.stage3Hours && !reminders.stage3 && reminders.stage2) {
        let body = settings.templates.stage3Body;
        if (settings.incentives.enableStage3Discount) {
          body = body.replace("{COUPON}", settings.incentives.couponCode);
        }
        reminderToSend = {
          stage: 3,
          title: settings.templates.stage3Title,
          body,
        };
      }
      // Check Stage 2 (24h)
      else if (hoursSinceActivity >= settings.stage2Hours && !reminders.stage2 && reminders.stage1) {
        reminderToSend = {
          stage: 2,
          title: settings.templates.stage2Title,
          body: settings.templates.stage2Body,
        };
      }
      // Check Stage 1 (1h)
      else if (hoursSinceActivity >= settings.stage1Hours && !reminders.stage1) {
        reminderToSend = {
          stage: 1,
          title: settings.templates.stage1Title,
          body: settings.templates.stage1Body,
        };
      }

      if (reminderToSend) {
        const sentOk = await dispatchCartReminder(cart, reminderToSend, settings);
        if (sentOk) {
          const sentTime = new Date().toISOString();
          const channelName = "push_and_inapp";

          if (reminderToSend.stage === 1) {
            updatedReminders.stage1 = { sentAt: sentTime, channel: channelName };
            stage1Sent++;
          } else if (reminderToSend.stage === 2) {
            updatedReminders.stage2 = { sentAt: sentTime, channel: channelName };
            stage2Sent++;
          } else if (reminderToSend.stage === 3) {
            updatedReminders.stage3 = { sentAt: sentTime, channel: channelName };
            stage3Sent++;
          }

          await updateDoc(doc(db, ABANDONED_COLLECTION, cart.id), {
            status: "abandoned",
            abandonedAt: cart.abandonedAt || sentTime,
            remindersSent: updatedReminders,
            lastReminderSentAt: sentTime,
            updatedAt: sentTime,
          });
        }
      }
    }
  } catch (err) {
    console.error("[AbandonedCartService] Error processing due reminders:", err);
  }

  return { processed, stage1Sent, stage2Sent, stage3Sent };
}

/**
 * Dispatches a reminder across enabled channels (Web/Mobile Push, In-App Notifications, Telegram, etc.)
 */
export async function dispatchCartReminder(
  cart: AbandonedCart,
  reminder: { stage: 1 | 2 | 3; title: string; body: string },
  settings: AbandonedCartSettings
): Promise<boolean> {
  const firstItem = cart.items[0];
  const targetUrl = "/checkout";

  // 1. In-App Notification (Customer inbox)
  if (settings.channels.inAppNotification && cart.userId) {
    try {
      const notifRef = doc(collection(db, "customer_notifications"));
      await setDoc(notifRef, {
        id: notifRef.id,
        userId: cart.userId,
        title: reminder.title,
        message: reminder.body,
        type: "abandoned_cart_reminder",
        stage: reminder.stage,
        targetUrl,
        productImage: firstItem?.image || "/icon-192.png",
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch {}
  }

  // 2. Native Push Notification (Browser / Mobile)
  if (settings.channels.pushNotification && typeof window !== "undefined") {
    try {
      const { sendBrowserNotification } = await import("@/hooks/useAdminOrderNotifications");
      if ("Notification" in window && Notification.permission === "granted") {
        sendBrowserNotification(reminder.title, {
          body: reminder.body,
          product_image: firstItem?.image || "/icon-192.png",
          data: {
            url: targetUrl,
            stage: reminder.stage,
            cartId: cart.id,
          },
        });
      }
    } catch (e) {
      console.warn("[AbandonedCartService] Native push trigger note:", e);
    }
  }

  return true;
}

/**
 * Manually send a reminder from the Admin panel
 */
export async function sendManualCartReminder(cartId: string, stage: 1 | 2 | 3): Promise<boolean> {
  const settings = await getAbandonedCartSettings();
  const cRef = doc(db, ABANDONED_COLLECTION, cartId);
  const snap = await getDoc(cRef);
  if (!snap.exists()) return false;

  const cart = snap.data() as AbandonedCart;
  let title = settings.templates.stage1Title;
  let body = settings.templates.stage1Body;

  if (stage === 2) {
    title = settings.templates.stage2Title;
    body = settings.templates.stage2Body;
  } else if (stage === 3) {
    title = settings.templates.stage3Title;
    body = settings.templates.stage3Body.replace("{COUPON}", settings.incentives.couponCode);
  }

  const ok = await dispatchCartReminder(cart, { stage, title, body }, settings);
  if (ok) {
    const nowIso = new Date().toISOString();
    const updated = { ...(cart.remindersSent || {}) };
    const key = `stage${stage}` as "stage1" | "stage2" | "stage3";
    updated[key] = { sentAt: nowIso, channel: "manual_admin" };

    await updateDoc(cRef, {
      status: "abandoned",
      remindersSent: updated,
      lastReminderSentAt: nowIso,
      updatedAt: nowIso,
    });
  }
  return ok;
}

// ----------------------------------------------------------------------
// Analytics & Queries
// ----------------------------------------------------------------------

export async function getAbandonedCarts(filterStatus: "all" | "active" | "abandoned" | "recovered" = "all"): Promise<AbandonedCart[]> {
  try {
    let q;
    if (filterStatus === "all") {
      q = query(collection(db, ABANDONED_COLLECTION), orderBy("updatedAt", "desc"), limit(100));
    } else {
      q = query(
        collection(db, ABANDONED_COLLECTION),
        where("status", "==", filterStatus),
        orderBy("updatedAt", "desc"),
        limit(100)
      );
    }

    const snap = await getDocs(q);
    const list: AbandonedCart[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AbandonedCart);
    });
    return list;
  } catch (err) {
    console.warn("[AbandonedCartService] Get carts fallback query:", err);
    // Fallback without composite index if necessary
    const rawSnap = await getDocs(collection(db, ABANDONED_COLLECTION));
    const items: AbandonedCart[] = [];
    rawSnap.forEach((d) => {
      const data = d.data() as AbandonedCart;
      if (filterStatus === "all" || data.status === filterStatus) {
        items.push(data);
      }
    });
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return items;
  }
}

export async function getRecoveryAnalytics(): Promise<CartRecoveryAnalytics> {
  try {
    const cartsSnap = await getDocs(collection(db, ABANDONED_COLLECTION));
    let totalAbandoned = 0;
    let totalRecovered = 0;
    let recoveredRevenue = 0;
    let potentialLost = 0;
    let s1 = 0;
    let s2 = 0;
    let s3 = 0;

    cartsSnap.forEach((d) => {
      const c = d.data() as AbandonedCart;
      if (c.status === "abandoned" || c.status === "recovered") {
        totalAbandoned++;
      }
      if (c.status === "recovered") {
        totalRecovered++;
        recoveredRevenue += Number(c.recoveredRevenue || c.subtotal || 0);
      } else if (c.status === "abandoned") {
        potentialLost += Number(c.subtotal || 0);
      }

      if (c.remindersSent?.stage1) s1++;
      if (c.remindersSent?.stage2) s2++;
      if (c.remindersSent?.stage3) s3++;
    });

    const recoveryRate = totalAbandoned > 0 ? Math.round((totalRecovered / totalAbandoned) * 100) : 0;

    return {
      totalAbandonedCarts: totalAbandoned,
      totalRecoveredCarts: totalRecovered,
      recoveryRate,
      totalRecoveredRevenue: recoveredRevenue,
      potentialRevenueLost: potentialLost,
      stage1SentCount: s1,
      stage2SentCount: s2,
      stage3SentCount: s3,
    };
  } catch (e) {
    console.warn("[AbandonedCartService] Analytics calculation error:", e);
    return {
      totalAbandonedCarts: 0,
      totalRecoveredCarts: 0,
      recoveryRate: 0,
      totalRecoveredRevenue: 0,
      potentialRevenueLost: 0,
      stage1SentCount: 0,
      stage2SentCount: 0,
      stage3SentCount: 0,
    };
  }
}
