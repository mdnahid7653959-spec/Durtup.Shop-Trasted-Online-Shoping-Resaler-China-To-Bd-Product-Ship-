import { playNewOrderSound, unlockAudio } from "@/hooks/useAdminOrderNotifications";

export interface CustomerOrderPushData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  productImage?: string;
  totalAmount: number;
  paymentMethod?: string;
}

/**
 * Triggers a real, native Mobile/OS Push Notification on customer's phone/browser
 * when they place an order on Durtup.shop.
 */
export async function triggerCustomerOrderPhoneNotification(data: CustomerOrderPushData) {
  if (typeof window === "undefined") return;

  try {
    // 1. Unlock Audio & Play pleasant order confirmation chime with vibration
    unlockAudio();
    playNewOrderSound();

    // 2. Check or request Notification Permission
    let permission: NotificationPermission = "Notification" in window ? Notification.permission : "denied";
    if (permission === "default" && "Notification" in window) {
      try {
        permission = await Notification.requestPermission();
      } catch {}
    }

    if (permission !== "granted") {
      return;
    }

    const title = `🛍️ অর্ডার সফল হয়েছে! #${data.orderNumber}`;
    const name = data.customerName || "Customer";
    const amount = Number(data.totalAmount || 0).toLocaleString();
    const body = `ধন্যবাদ ${name}! আপনার "${data.productName}" (৳${amount}) অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।`;
    const image = data.productImage || "/durtup-logo.png";
    const targetUrl = `/orders/${data.orderId}`;

    const notificationOptions: NotificationOptions = {
      body,
      icon: "/icon-192.png",
      badge: "/favicon-32x32.png",
      image: image, // Shows full-width product image in Android phone notification tray
      vibrate: [400, 150, 400, 150, 400, 150, 800],
      tag: `durtup-customer-order-${data.orderId}`,
      requireInteraction: true,
      silent: false,
      data: {
        url: targetUrl,
        order_id: data.orderId,
        order_number: data.orderNumber
      }
    };

    // A. Service Worker Native Display (Android / Mobile Notification Tray)
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
                tag: notificationOptions.tag,
                data: notificationOptions.data
              }
            });
          }
          return;
        }
      } catch (swErr) {
        console.warn("[CustomerPush] Service worker notification notice:", swErr);
      }
    }

    // B. Window Notification Fallback (Desktop / Windows / Mac)
    if (typeof Notification !== "undefined") {
      const notif = new Notification(title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        window.location.href = targetUrl;
      };
    }
  } catch (err) {
    console.error("[CustomerPush] Error sending order phone notification:", err);
  }
}
