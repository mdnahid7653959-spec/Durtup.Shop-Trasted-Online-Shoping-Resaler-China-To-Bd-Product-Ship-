import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  product_name?: string;
  product_image?: string;
  image_url?: string;
  total_items?: number;
  order_id?: string;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  total_amount?: number;
  payment_method?: string;
  read: boolean;
  created_at: string;
}

// Shared AudioContext instance unlocked upon first user interaction
let globalAudioCtx: AudioContext | null = null;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }
  } catch {}
}

if (typeof window !== "undefined") {
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
}

// Play loud, pleasant cash register / chime sound on new orders (works on phone & PC)
export function playNewOrderSound() {
  try {
    // 1. Device vibration for mobile phones
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([400, 150, 400, 150, 400, 150, 800]);
    }

    // 2. High fidelity Web Audio synthesizer (Cash register "Ka-Ching" + 4-note chord)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!globalAudioCtx || globalAudioCtx.state === "closed") {
      globalAudioCtx = new AudioContextClass();
    }
    const ctx = globalAudioCtx;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Part 1: Cash register metallic ring (987Hz & 1318Hz)
    [987.77, 1318.51].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    });

    // Part 2: Upbeat 4-note chime sequence: C5, E5, G5, C6
    const melody = [523.25, 659.25, 783.99, 1046.50];
    melody.forEach((freq, idx) => {
      const startTime = now + 0.10 + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch (e) {
    console.warn("[OrderAudio] Audio chime error:", e);
  }
}

// Trigger real Mobile/OS native push notification with Product Image & Vibration
export async function sendBrowserNotification(
  title: string,
  options?: NotificationOptions & { product_image?: string; order_id?: string; data?: any }
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  let currentPerm = Notification.permission;
  if (currentPerm === "default") {
    try {
      currentPerm = await Notification.requestPermission();
    } catch (e) {}
  }

  if (currentPerm !== "granted") {
    return;
  }

  const img = options?.product_image || (options as any)?.image || "/durtup-logo.png";
  const targetUrl = (options as any)?.data?.url || (options?.order_id ? "/admin/orders" : "/");

  const notificationOpts: NotificationOptions = {
    body: options?.body || (options?.order_id ? "New order received on Durtup.shop" : "New update from Durtup.shop"),
    icon: img,
    badge: "/favicon-32x32.png",
    image: img, // Displays large product preview in Android notification shade
    vibrate: [400, 150, 400, 150, 400, 150, 800],
    tag: (options as any)?.tag || (options?.order_id ? `durtup-order-${Date.now()}` : `durtup-notif-${Date.now()}`),
    requireInteraction: true,
    silent: false,
    data: {
      url: targetUrl,
      order_id: options?.order_id,
      ...options?.data,
    },
    ...options,
  };

  // 1. Try ServiceWorkerRegistration (Required for Android / Mobile Notification shade)
  if ("serviceWorker" in navigator) {
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
      }

      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOpts);

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            payload: {
              title,
              body: notificationOpts.body,
              image: img,
              tag: notificationOpts.tag,
              data: notificationOpts.data,
            }
          });
        }
        return;
      }
    } catch (swErr) {
      console.warn("ServiceWorker showNotification warning:", swErr);
    }
  }

  // 2. Fallback to Window Notification (Desktop / macOS browsers)
  try {
    if (typeof Notification !== "undefined") {
      const notif = new Notification(title, notificationOpts);
      notif.onclick = () => {
        window.focus();
        window.location.href = targetUrl;
      };
    }
  } catch (err) {
    console.warn("Window Notification fallback notice (normal on mobile):", err);
  }
}

export function useAdminOrderNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const { toast } = useToast();
  const navigate = useNavigate();
  const isFirstLoad = useRef(true);
  const notifiedOrderIds = useRef<Set<string>>(new Set());

  // Trigger alert UI & sound with deduplication
  const triggerOrderAlert = useCallback((data: Partial<AdminNotification> & { id: string }) => {
    const orderId = data.id || data.order_id || "";
    if (orderId && notifiedOrderIds.current.has(orderId)) return;
    if (orderId) notifiedOrderIds.current.add(orderId);

    const orderNum = data.order_number || orderId.slice(0, 8) || "NEW";
    const customerName = data.customer_name || "Customer";
    const prodName = data.product_name || "Product";
    const amount = Number(data.total_amount || 0);
    const prodImg = data.product_image || data.image_url || "/durtup-logo.png";
    const payMethod = data.payment_method ? data.payment_method.toUpperCase() : "COD";

    // 1. Play audio chime & phone vibration
    playNewOrderSound();

    // 2. Trigger real mobile push notification with product image
    sendBrowserNotification(data.title || `🛍️ New Order #${orderNum}! (৳${amount.toLocaleString()})`, {
      body: data.message || `Customer: ${customerName} • "${prodName}" • ${payMethod}`,
      product_image: prodImg,
      data: { url: "/admin/orders", order_id: orderId }
    });

    // 3. Trigger in-app toast
    toast({
      title: data.title || `🛍️ New Order #${orderNum}!`,
      description: `${customerName} ordered ${prodName} (৳${amount.toLocaleString()})`,
    });
  }, [toast]);

  // Request browser / mobile push notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser does not support web push notifications.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        unlockAudio();
        toast({
          title: "Phone Push Alerts Enabled! 🔔",
          description: "You will receive instant push notifications with product photos for new orders."
        });
        
        // Play welcome chime
        playNewOrderSound();

        // Send confirmation push notification
        sendBrowserNotification("🔔 Durtup Order Alerts Active!", {
          body: "Direct push alerts enabled on your device with live product photos & sound!",
          product_image: "/durtup-logo.png",
          data: { url: "/admin/orders" }
        });
        return true;
      } else {
        toast({
          title: "Permission denied",
          description: "Please allow notifications in your browser settings to receive order alerts.",
          variant: "destructive"
        });
        return false;
      }
    } catch (e) {
      console.error("Notification permission error:", e);
      return false;
    }
  }, [toast]);

  // Send a test push notification with product photo and sound to verify phone integration
  const testPushNotification = useCallback(async () => {
    unlockAudio();
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    playNewOrderSound();
    
    sendBrowserNotification("🛍️ New Order #ORD-TEST-992! (৳2,450)", {
      body: "Customer: Md Nahid • Product: Premium Wireless Earbuds Pro • Cash on Delivery",
      product_image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=300&fit=crop",
      data: { url: "/admin/orders" }
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("durtup_new_order", {
        detail: {
          id: `test-order-${Date.now()}`,
          order_number: "ORD-TEST-992",
          customer_name: "Md Nahid",
          customer_phone: "01700000000",
          product_name: "Premium Wireless Earbuds Pro",
          product_image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=300&fit=crop",
          total_amount: 2450,
          payment_method: "Cash on Delivery",
          created_at: new Date().toISOString()
        }
      }));
    }

    toast({
      title: "📱 Messenger Push Notification Sent!",
      description: "Order notification with product photo, floating heads-up banner, and sound triggered.",
    });
  }, [permission, requestPermission, toast]);

  // 1. Cross-tab real-time listener (BroadcastChannel + CustomEvents + Storage Event)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("durtup_admin_order_notifications");
        bc.onmessage = (evt) => {
          if (evt.data?.type === "new_order" && evt.data?.order) {
            const ord = evt.data.order;
            triggerOrderAlert(ord);
            setNotifications((prev) => {
              if (prev.some((n) => n.id === ord.id)) return prev;
              return [ord, ...prev];
            });
          }
        };
      } catch {}
    }

    const handleCustomOrder = (e: any) => {
      if (e.detail) {
        triggerOrderAlert(e.detail);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === e.detail.id)) return prev;
          return [e.detail, ...prev];
        });
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "durtup_last_order_event" && e.newValue) {
        try {
          const ord = JSON.parse(e.newValue);
          if (ord?.id && Date.now() - (ord.timestamp || 0) < 30000) {
            triggerOrderAlert(ord);
            setNotifications((prev) => {
              if (prev.some((n) => n.id === ord.id)) return prev;
              return [ord, ...prev];
            });
          }
        } catch {}
      }
    };

    window.addEventListener("durtup_new_order", handleCustomOrder as EventListener);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("durtup_new_order", handleCustomOrder as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [triggerOrderAlert]);

  // 2. Real-time Firestore listener on `admin_notifications`
  useEffect(() => {
    try {
      const notifRef = collection(db, "admin_notifications");
      const q = query(notifRef, orderBy("created_at", "desc"), limit(50));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: AdminNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        // Detect newly added order docs (after initial load)
        if (!isFirstLoad.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = { id: change.doc.id, ...(change.doc.data() as any) };
              triggerOrderAlert(data);
            }
          });
        } else {
          // Pre-populate existing docs so they don't trigger sound on initial mount
          snapshot.forEach((docSnap) => notifiedOrderIds.current.add(docSnap.id));
        }

        isFirstLoad.current = false;
        setNotifications(list);
      }, (err) => {
        console.warn("admin_notifications listener error:", err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Failed to attach admin notification listener:", e);
    }
  }, [triggerOrderAlert]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "admin_notifications", id), { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.warn("Error marking notification read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => updateDoc(doc(db, "admin_notifications", n.id), { read: true })));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn("Error marking all read:", e);
    }
  };

  return {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    testPushNotification,
    markAsRead,
    markAllAsRead,
    playNewOrderSound,
    triggerOrderAlert
  };
}
