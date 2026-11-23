import { db, getFirebaseMessaging } from "@/integrations/firebase/client";
import { collection, doc, setDoc, query, orderBy, limit as fsLimit, getDocs, onSnapshot } from "firebase/firestore";
import { playNewOrderSound, unlockAudio } from "@/hooks/useAdminOrderNotifications";
import { getToken } from "firebase/messaging";

export type NotificationCategory =
  | "offer"
  | "flash_sale"
  | "order"
  | "cashback"
  | "loyalty"
  | "back_in_stock"
  | "price_drop"
  | "system";

export interface PushNotificationPayload {
  id?: string;
  category: NotificationCategory;
  title: string;
  body: string;
  image?: string;
  url: string;
  userId?: string;
  userEmail?: string;
  targetType?: "all" | "android" | "ios" | "web" | "user";
  tag?: string;
  data?: Record<string, any>;
  createdAt?: string;
}

export interface OrderPushPayload {
  orderNumber: string;
  customerName: string;
  productName: string;
  productImage?: string;
  totalAmount: number;
  paymentMethod?: string;
  orderId?: string;
  userId?: string;
}

// -------------------------------------------------------------
// Request Notification Permission (Polite & Standardized)
// -------------------------------------------------------------
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("[NotificationService] Permission request error:", err);
    return "denied";
  }
}

// -------------------------------------------------------------
// Get or Generate FCM Token & Sync to Database
// -------------------------------------------------------------
export async function getOrGenerateFCMToken(userId?: string, userEmail?: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    let deviceId = localStorage.getItem("durtup_device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem("durtup_device_id", deviceId);
    }

    const ua = navigator.userAgent;
    let platform: "android" | "ios" | "web" = "web";
    if (/android/i.test(ua)) platform = "android";
    else if (/iphone|ipad|ipod/i.test(ua)) platform = "ios";

    let fcmToken: string | null = localStorage.getItem("durtup_fcm_token");

    // Attempt real FCM token if supported and service worker is available
    if ("serviceWorker" in navigator) {
      try {
        let swReg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
        if (!swReg) {
          swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => undefined);
        }

        const messaging = await getFirebaseMessaging();
        if (messaging && swReg) {
          const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || undefined;
          const token = await getToken(messaging, {
            serviceWorkerRegistration: swReg,
            vapidKey: vapidKey,
          }).catch((err) => {
            console.warn("[FCM] Token generation notice:", err);
            return null;
          });

          if (token) {
            fcmToken = token;
            localStorage.setItem("durtup_fcm_token", token);
          }
        }
      } catch (swErr) {
        console.warn("[FCM] Service worker registration notice:", swErr);
      }
    }

    const effectiveToken = fcmToken || deviceId;
    const permission = "Notification" in window ? Notification.permission : "unsupported";

    // Store in Firestore `push_tokens`
    try {
      const tokenDocRef = doc(db, "push_tokens", deviceId);
      await setDoc(
        tokenDocRef,
        {
          id: deviceId,
          token: effectiveToken,
          fcm_token: fcmToken || null,
          token_type: fcmToken ? "fcm" : "device_id",
          platform,
          is_active: true,
          permission,
          user_id: userId || null,
          user_email: userEmail || null,
          user_agent: ua,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (dbErr) {
      console.warn("[NotificationService] Firestore push_tokens sync notice:", dbErr);
    }

    return effectiveToken;
  } catch (err) {
    console.error("[NotificationService] Token retrieval error:", err);
    return null;
  }
}

// -------------------------------------------------------------
// Core Push Notification Dispatcher (SW Native + Window Fallback)
// -------------------------------------------------------------
export async function dispatchNativePushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    unlockAudio();
    playNewOrderSound();

    let perm: NotificationPermission = "Notification" in window ? Notification.permission : "denied";
    if (perm === "default") {
      perm = await requestNotificationPermission();
    }

    if (perm !== "granted") {
      console.log("[NotificationService] Permission not granted, skipping OS shade display.");
      return false;
    }

    const title = payload.title;
    const body = payload.body;
    const icon = "/icon-192.png";
    const badge = "/favicon-32x32.png";
    const image = payload.image || "/durtup-logo.png";
    const targetUrl = payload.url || "/";
    const tag = payload.tag || `durtup-${payload.category}-${Date.now()}`;

    const notificationOptions: NotificationOptions = {
      body,
      icon,
      badge,
      image,
      vibrate: [400, 150, 400, 150, 400, 150, 800],
      tag,
      requireInteraction: true,
      silent: false,
      data: {
        url: targetUrl,
        category: payload.category,
        timestamp: Date.now(),
        ...payload.data,
      },
    };

    // 1. Try Service Worker (Android Notification Shade & Modern Desktop Browser)
    if ("serviceWorker" in navigator) {
      try {
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
        }

        if (reg && reg.showNotification) {
          await reg.showNotification(title, notificationOptions);

          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "SHOW_NOTIFICATION",
              payload: {
                title,
                body,
                image,
                tag,
                data: notificationOptions.data,
              },
            });
          }
          return true;
        }
      } catch (swErr) {
        console.warn("[NotificationService] SW notification display notice:", swErr);
      }
    }

    // 2. Desktop Window Notification Fallback
    if (typeof Notification !== "undefined") {
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        window.location.href = targetUrl;
      };
      return true;
    }

    return false;
  } catch (err) {
    console.error("[NotificationService] Push delivery error:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 1. New Offers & Promotions Notification
// -------------------------------------------------------------
export async function sendOfferPushNotification(data: {
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  targetType?: "all" | "android" | "ios" | "web";
}) {
  const notifId = `offer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const payload: PushNotificationPayload = {
    id: notifId,
    category: "offer",
    title: data.title || "🎁 ধামাকা অফার! Durtup.shop",
    body: data.message || "আমাদের স্টোরে যোগ হয়েছে দারুণ সব ডিসকাউন্ট অফার। দেখে নিন এখনই!",
    image: data.imageUrl || "/banner-trust-delivery.webp",
    url: data.actionUrl || "/products?filter=offers",
    targetType: data.targetType || "all",
    tag: `offer-${notifId}`,
    createdAt: new Date().toISOString(),
  };

  // Broadcast to Firestore
  try {
    await setDoc(doc(db, "broadcast_notifications", notifId), {
      ...payload,
      sent_count: 1,
      status: "sent",
      timestamp: Date.now(),
    });
  } catch { }

  return dispatchNativePushNotification(payload);
}

// -------------------------------------------------------------
// 2. Flash Sale Notification
// -------------------------------------------------------------
export async function sendFlashSalePushNotification(data: {
  title?: string;
  message?: string;
  campaignId?: string;
  discountPercent?: number;
  imageUrl?: string;
  actionUrl?: string;
}) {
  const notifId = `fs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const discountText = data.discountPercent ? ` (${data.discountPercent}% ছাড়!)` : "";
  const payload: PushNotificationPayload = {
    id: notifId,
    category: "flash_sale",
    title: data.title || `⚡ মেগা ফ্ল্যাশ সেল শুরু হয়েছে!${discountText}`,
    body:
      data.message ||
      "আজকের ফ্ল্যাশ সেলের স্টক সীমিত! দ্রুত আপনার পছন্দের প্রোডাক্টটি বিশেষ ছাড়ে অর্ডার করুন।",
    image: data.imageUrl || "/banner-flash-deals.webp",
    url: data.actionUrl || "/products?filter=flash-sale",
    targetType: "all",
    tag: `flash-sale-${data.campaignId || notifId}`,
    createdAt: new Date().toISOString(),
    data: { campaignId: data.campaignId, discountPercent: data.discountPercent },
  };

  try {
    await setDoc(doc(db, "broadcast_notifications", notifId), {
      ...payload,
      sent_count: 1,
      status: "sent",
      timestamp: Date.now(),
    });
  } catch { }

  return dispatchNativePushNotification(payload);
}

// -------------------------------------------------------------
// 3. Order Updates Notification (Placed, Confirmed, Shipped, Delivered)
// -------------------------------------------------------------
export async function sendOrderUpdatePushNotification(data: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: "placed" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  productName?: string;
  productImage?: string;
  totalAmount?: number;
  userId?: string;
}) {
  const statusLabels: Record<string, { title: string; body: string }> = {
    placed: {
      title: `🛍️ অর্ডার সফল হয়েছে! #${data.orderNumber}`,
      body: `ধন্যবাদ ${data.customerName}! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।`,
    },
    confirmed: {
      title: `✅ অর্ডার কনফার্ম হয়েছে! #${data.orderNumber}`,
      body: `আপনার অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে এবং প্যাকেজিং প্রক্রিয়া শুরু হয়েছে।`,
    },
    processing: {
      title: `📦 অর্ডার প্রসেসিং হচ্ছে! #${data.orderNumber}`,
      body: `আপনার পণ্যটি প্রস্তুত করা হচ্ছে। শীঘ্রই কুরিয়ারে হস্তান্তর করা হবে।`,
    },
    shipped: {
      title: `🚚 অর্ডার ডেলিভারিতে বের হয়েছে! #${data.orderNumber}`,
      body: `আপনার পার্সেলটি কুরিয়ারে দেওয়া হয়েছে। খুব দ্রুত আপনার ঠিকানায় পৌঁছাবে।`,
    },
    delivered: {
      title: `🎉 অর্ডার ডেলিভার সম্পন্ন! #${data.orderNumber}`,
      body: `আপনার পণ্যটি সফলভাবে ডেলিভারি হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ!`,
    },
    cancelled: {
      title: `⚠️ অর্ডার বাতিল হয়েছে! #${data.orderNumber}`,
      body: `আপনার অর্ডারটি বাতিল করা হয়েছে। কোনো তথ্যের জন্য সাপোর্টে যোগাযোগ করুন।`,
    },
  };

  const info = statusLabels[data.status] || {
    title: `📦 অর্ডার আপডেট #${data.orderNumber}`,
    body: `আপনার অর্ডারের বর্তমান অবস্থা: ${data.status}`,
  };

  const payload: PushNotificationPayload = {
    category: "order",
    title: info.title,
    body: data.productName ? `${info.body} (${data.productName})` : info.body,
    image: data.productImage || "/icon-192.png",
    url: `/orders/${data.orderId || data.orderNumber}`,
    userId: data.userId,
    tag: `order-${data.orderNumber}-${data.status}`,
    createdAt: new Date().toISOString(),
    data: { orderId: data.orderId, orderNumber: data.orderNumber, status: data.status },
  };

  // Sync to Firestore user notifications if targeted
  if (data.userId) {
    try {
      const userNotifId = `un_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, "notifications", userNotifId), {
        id: userNotifId,
        user_id: data.userId,
        title: payload.title,
        message: payload.body,
        type: "order",
        is_read: false,
        action_url: payload.url,
        created_at: new Date().toISOString(),
      });
    } catch { }
  }

  return dispatchNativePushNotification(payload);
}

// -------------------------------------------------------------
// Legacy Alias for Customer Order Confirmation
// -------------------------------------------------------------
export async function sendOrderSuccessPushNotification(payload: OrderPushPayload) {
  return sendOrderUpdatePushNotification({
    orderId: payload.orderId || payload.orderNumber,
    orderNumber: payload.orderNumber,
    customerName: payload.customerName,
    status: "placed",
    productName: payload.productName,
    productImage: payload.productImage,
    totalAmount: payload.totalAmount,
    userId: payload.userId,
  });
}

// -------------------------------------------------------------
// 4. Cashback Rewards Notification
// -------------------------------------------------------------
export async function sendCashbackAwardNotification(data: {
  userId?: string;
  orderNumber: string;
  amount: number;
  balance?: number;
  customerName?: string;
}) {
  const amountStr = Number(data.amount || 0).toLocaleString();
  const balanceStr = data.balance !== undefined ? ` বর্তমান ব্যালেন্স: ৳${Number(data.balance).toLocaleString()}।` : "";

  const payload: PushNotificationPayload = {
    category: "cashback",
    title: `💰 ক্যাশব্যাক জমা হয়েছে! +৳${amountStr}`,
    body: `অভিনন্দন! অর্ডার #${data.orderNumber}-এর জন্য আপনার ওয়ালেটে ৳${amountStr} ক্যাশব্যাক জমা হয়েছে।${balanceStr}`,
    image: "/favicon-96x96.png",
    url: "/wallet",
    userId: data.userId,
    tag: `cashback-${data.orderNumber}`,
    createdAt: new Date().toISOString(),
    data: { amount: data.amount, orderNumber: data.orderNumber },
  };

  if (data.userId) {
    try {
      const userNotifId = `cb_notif_${Date.now()}`;
      await setDoc(doc(db, "notifications", userNotifId), {
        id: userNotifId,
        user_id: data.userId,
        title: payload.title,
        message: payload.body,
        type: "promo",
        is_read: false,
        action_url: payload.url,
        created_at: new Date().toISOString(),
      });
    } catch { }
  }

  return dispatchNativePushNotification(payload);
}

// -------------------------------------------------------------
// 5. Loyalty Points Notification
// -------------------------------------------------------------
export async function sendLoyaltyEarnedNotification(data: {
  userId?: string;
  orderNumber: string;
  pointsEarned: number;
  totalPoints?: number;
  tier?: string;
  customerName?: string;
}) {
  const pointsStr = Number(data.pointsEarned || 0).toLocaleString();
  const totalStr = data.totalPoints !== undefined ? ` আপনার মোট পয়েন্ট: ${Number(data.totalPoints).toLocaleString()}।` : "";
  const tierStr = data.tier ? ` (টিয়ার: ${data.tier.toUpperCase()})` : "";

  const payload: PushNotificationPayload = {
    category: "loyalty",
    title: `⭐ লয়ালটি পয়েন্ট যোগ হয়েছে! +${pointsStr} Points`,
    body: `অর্ডার #${data.orderNumber} সম্পন্ন করার জন্য ${pointsStr} লয়ালটি পয়েন্ট পেয়েছেন!${totalStr}${tierStr} পরবর্তী অর্ডারে ডিসকাউন্ট নিন।`,
    image: "/favicon-96x96.png",
    url: "/account?tab=loyalty",
    userId: data.userId,
    tag: `loyalty-${data.orderNumber}`,
    createdAt: new Date().toISOString(),
    data: { pointsEarned: data.pointsEarned, totalPoints: data.totalPoints, tier: data.tier },
  };

  if (data.userId) {
    try {
      const userNotifId = `ly_notif_${Date.now()}`;
      await setDoc(doc(db, "notifications", userNotifId), {
        id: userNotifId,
        user_id: data.userId,
        title: payload.title,
        message: payload.body,
        type: "voucher",
        is_read: false,
        action_url: payload.url,
        created_at: new Date().toISOString(),
      });
    } catch { }
  }

  return dispatchNativePushNotification(payload);
}

// -------------------------------------------------------------
// 6. Back in Stock Alert Notification
// -------------------------------------------------------------
export async function sendBackInStockPushNotification(data: {
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string;
  restockQuantity: number;
  variantLabel?: string;
  userId?: string;
}) {
  const variantText = data.variantLabel ? ` (${data.variantLabel})` : "";
  const shortName = data.productName.length > 30 ? data.productName.slice(0, 30) + "..." : data.productName;

  const payload: PushNotificationPayload = {
    category: "back_in_stock",
    title: `🎉 স্টক ফিরে এসেছে! ${shortName}`,
    body: `আপনার পছন্দের "${data.productName}"${variantText} এখন আবার স্টকে পাওয়া যাচ্ছে! নতুন ${data.restockQuantity}টি স্টক যোগ হয়েছে। স্টক সীমিত, এখনই অর্ডার করুন।`,
    image: data.productImage || "/durtup-logo.png",
    url: `/product/${data.productSlug || data.productId}`,
    userId: data.userId,
    tag: `back-in-stock-${data.productId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    data: { productId: data.productId, restockQuantity: data.restockQuantity },
  };

  return dispatchNativePushNotification(payload);
}

// -------------------------------------------------------------
// 7. Price Drop Alert Notification
// -------------------------------------------------------------
export async function sendPriceDropPushNotification(data: {
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string;
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
  variantLabel?: string;
  userId?: string;
}) {
  const dropAmount = Math.max(0, data.oldPrice - data.newPrice);
  const shortName = data.productName.length > 30 ? data.productName.slice(0, 30) + "..." : data.productName;
  const variantText = data.variantLabel ? ` [${data.variantLabel}]` : "";

  const payload: PushNotificationPayload = {
    category: "price_drop",
    title: `🏷️ দাম কমেছে! ${shortName}`,
    body: `দারুণ খবর! "${data.productName}"${variantText}-এর দাম ৳${data.oldPrice.toLocaleString()} থেকে কমে এখন মাত্র ৳${data.newPrice.toLocaleString()}! (৳${dropAmount.toLocaleString()} সাশ্রয়)। এখনই কিনুন!`,
    image: data.productImage || "/durtup-logo.png",
    url: `/product/${data.productSlug || data.productId}`,
    userId: data.userId,
    tag: `price-drop-${data.productId}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    data: {
      productId: data.productId,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      targetPrice: data.targetPrice,
    },
  };

  return dispatchNativePushNotification(payload);
}
