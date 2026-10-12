import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { playNewOrderSound, sendBrowserNotification, unlockAudio } from "@/hooks/useAdminOrderNotifications";
import { useToast } from "@/hooks/use-toast";
import { AdminMessengerOrderBanner } from "@/components/admin/AdminMessengerOrderBanner";
import { Capacitor } from "@capacitor/core";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStaff } from "@/contexts/StaffContext";

/**
 * GlobalAdminNotificationListener
 * Background listener strictly for Admin / Staff panel.
 * Only sounds chime, vibrates phone, and shows Messenger-style floating pop-up
 * for authenticated Admin / Staff users or when on /admin /staff routes.
 */
export const GlobalAdminNotificationListener: React.FC = () => {
  const location = useLocation();
  const adminAuth = useAdminAuth();
  const auth = useAuth();
  const staffCtx = useStaff();
  const { toast } = useToast();
  const processedDocIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const path = location.pathname.toLowerCase();
  const isEligibleAdmin = path.startsWith("/admin") || path.startsWith("/staff");

  // 1. Initialize Native High Priority Channel & Audio unlock
  useEffect(() => {
    if (typeof window === "undefined" || !isEligibleAdmin) return;

    // Load previously notified orders from session storage
    try {
      const saved = sessionStorage.getItem("durtup_notified_orders");
      if (saved) {
        JSON.parse(saved).forEach((id: string) => processedDocIds.current.add(id));
      }
    } catch {}

    // 1. Auto-initialize Native Channel & Request Permission immediately on app launch
    const autoInit = async () => {
      unlockAudio();
      
      // If running inside Capacitor Android native app, create urgent heads-up notification channel
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("PushNotifications")) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          await PushNotifications.createChannel({
            id: "durtup_urgent_orders",
            name: "Urgent Order Alerts (Messenger Style)",
            description: "High priority heads-up popup banner alerts for new customer orders",
            importance: 5, // High / Max priority (Heads-up banner)
            visibility: 1, // Public on lock screen
            sound: "default",
            vibration: true,
            lights: true,
            lightColor: "#FF5500"
          });
          const perm = await PushNotifications.requestPermissions();
          if (perm.receive === "granted") {
            await PushNotifications.register();
          }
        } catch (capErr) {
          console.warn("[GlobalAdminNotificationListener] Capacitor channel setup warning:", capErr);
        }
      }

      // Web Push Permission auto-request on load
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            playNewOrderSound();
            sendBrowserNotification("🔔 Durtup Order Alerts Active!", {
              body: "Real-time order push notifications enabled like Facebook Messenger!",
              product_image: "/durtup-logo.png",
              data: { url: "/admin/orders" }
            });
          }
        } catch (e) {
          console.warn("[Admin Notification] Permission error:", e);
        }
      }
    };

    autoInit();

    // 2. Also unlock audio on first touch/tap
    const handleFirstTouch = () => {
      unlockAudio();
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
    };

    window.addEventListener("click", handleFirstTouch, { once: true });
    window.addEventListener("touchstart", handleFirstTouch, { once: true });

    // WakeLock to prevent phone sleep while admin panel is open
    let wakeLock: any = null;
    if ("wakeLock" in navigator) {
      try {
        (navigator as any).wakeLock.request("screen").then((lock: any) => {
          wakeLock = lock;
        }).catch(() => {});
      } catch {}
    }

    return () => {
      window.removeEventListener("click", handleFirstTouch);
      window.removeEventListener("touchstart", handleFirstTouch);
      if (wakeLock) {
        try { wakeLock.release(); } catch {}
      }
    };
  }, []);

  const handleIncomingOrder = (data: any, source: string) => {
    const orderId = data.id || data.order_id || "";
    if (!orderId) return;

    if (processedDocIds.current.has(orderId)) return;
    processedDocIds.current.add(orderId);

    try {
      sessionStorage.setItem("durtup_notified_orders", JSON.stringify(Array.from(processedDocIds.current).slice(-60)));
    } catch {}

    const orderNum = data.order_number || orderId.slice(0, 8) || "NEW";
    const customerName = data.customer_name || data.shipping_address?.firstName || "Customer";
    const prodName = data.product_name || (Array.isArray(data.items) && data.items[0]?.name) || "Item";
    const amount = Number(data.total_amount || data.total || 0);
    const prodImg = data.product_image || data.image_url || (Array.isArray(data.items) && data.items[0]?.image) || "/durtup-logo.png";
    const payMethod = data.payment_method ? data.payment_method.toUpperCase() : "COD";

    // 🔊 1. Sound & Vibration
    playNewOrderSound();

    // 📱 2. Android Notification Tray Push
    sendBrowserNotification(`🛍️ New Order #${orderNum}! (৳${amount.toLocaleString()})`, {
      body: `${customerName} ordered "${prodName}" • ${payMethod}`,
      product_image: prodImg,
      tag: `admin-order-${orderId}`,
      data: {
        url: "/admin/orders",
        order_id: orderId,
        order_number: orderNum
      }
    });

    // 🍞 3. In-App Toast
    toast({
      title: `🛍️ New Order #${orderNum}!`,
      description: `${customerName} ordered ${prodName} (৳${amount.toLocaleString()})`,
    });

    // 💬 4. Dispatch custom event so the Messenger Floating Heads-Up Banner pops up
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("durtup_new_order", {
        detail: {
          id: orderId,
          order_number: orderNum,
          customer_name: customerName,
          customer_phone: data.customer_phone || data.shipping_address?.phone || "",
          customer_email: data.customer_email || "",
          product_name: prodName,
          product_image: prodImg,
          total_amount: amount,
          payment_method: payMethod,
          created_at: data.created_at || new Date().toISOString()
        }
      }));
    }
  };

  // 2. Real-time Firestore listener on `admin_notifications`
  useEffect(() => {
    if (typeof window === "undefined" || !isEligibleAdmin) return;

    try {
      const notifRef = collection(db, "admin_notifications");
      const q = query(notifRef, orderBy("created_at", "desc"), limit(25));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isFirstLoad.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              handleIncomingOrder({ id: change.doc.id, ...change.doc.data() }, "firestore_admin_notif");
            }
          });
        } else {
          snapshot.forEach((d) => processedDocIds.current.add(d.id));
          isFirstLoad.current = false;
        }
      }, (err) => {
        console.warn("[GlobalAdminNotificationListener] Firestore realtime listener warning:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("[GlobalAdminNotificationListener] Error:", e);
    }
  }, [isEligibleAdmin, toast]);

  // 3. Cross-tab Broadcast Channel & Custom Event listener
  useEffect(() => {
    if (typeof window === "undefined" || !isEligibleAdmin) return;

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("durtup_admin_order_notifications");
        bc.onmessage = (evt) => {
          if (evt.data?.type === "new_order" && evt.data?.order) {
            handleIncomingOrder(evt.data.order, "broadcast_channel");
          }
        };
      } catch {}
    }

    return () => {
      if (bc) bc.close();
    };
  }, [isEligibleAdmin, toast]);

  if (!isEligibleAdmin) {
    return null;
  }

  return (
    <>
      {/* Floating Messenger-Style Heads-Up Banner */}
      <AdminMessengerOrderBanner />
    </>
  );
};

export default GlobalAdminNotificationListener;
