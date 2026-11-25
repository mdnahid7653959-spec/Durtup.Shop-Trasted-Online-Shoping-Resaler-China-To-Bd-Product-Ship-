import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Package, 
  ChevronRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Trash2, 
  MapPin, 
  ExternalLink, 
  CreditCard, 
  ShoppingBag, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/firebaseAdapter";
import { auth, db } from "@/integrations/firebase/client";
import { collection, getDocs, getDoc, onSnapshot, doc, deleteDoc, query, where, orderBy, limit } from "firebase/firestore";
import { isMockOrder, purgeMockOrdersFromStorage } from "@/utils/orderValidation";

export interface OrderItem {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  title?: string;
  image?: string;
  product_image?: string;
  productImage?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
  variant_name?: string;
  selected_variants?: any;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  discount_amount?: number;
  created_at: string;
  payment_status: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: any;
  items?: OrderItem[];
  order_items?: OrderItem[];
  product_image?: string;
  product_name?: string;
  tracking_number?: string;
  courier_name?: string;
  total_items?: number;
}

const statusConfig: Record<string, { label: string; badgeClass: string; dotClass: string; icon: any }> = {
  pending: { 
    label: "Pending", 
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60", 
    dotClass: "bg-amber-500",
    icon: Clock 
  },
  confirmed: { 
    label: "Confirmed", 
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60", 
    dotClass: "bg-blue-500",
    icon: Package 
  },
  processing: { 
    label: "Processing", 
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/60", 
    dotClass: "bg-blue-500",
    icon: Package 
  },
  shipped: { 
    label: "Shipped", 
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-800/60", 
    dotClass: "bg-indigo-500",
    icon: Truck 
  },
  delivered: { 
    label: "Delivered", 
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60", 
    dotClass: "bg-emerald-500",
    icon: CheckCircle2 
  },
  cancelled: { 
    label: "Cancelled", 
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60", 
    dotClass: "bg-rose-500",
    icon: XCircle 
  },
};

const formatOrderDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently placed";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "Recently placed";
  }
};

export default function Orders() {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Resolve User Identities
  const userEmail = (user?.email || profile?.email || "").toLowerCase().trim();
  const userUid = user?.id || (user as any)?.uid || auth?.currentUser?.uid || "";

  // Extract phone number from all possible sources (including phone auth email e.g. 01622530550@durtup.shop)
  const phoneFromEmail = userEmail.includes("@durtup.shop") 
    ? userEmail.split("@durtup.shop")[0].replace(/\D/g, "") 
    : (userEmail.match(/^01\d{9}/) ? userEmail.match(/^01\d{9}/)![0] : "");

  let savedAddressPhone = "";
  try {
    const rawSaved = typeof window !== "undefined" ? localStorage.getItem("durtup_saved_address") : null;
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (parsed?.phone) savedAddressPhone = String(parsed.phone).replace(/\D/g, "");
    }
  } catch {}

  const rawPhone = 
    profile?.phone || 
    (user as any)?.phoneNumber || 
    (user as any)?.phone ||
    phoneFromEmail || 
    savedAddressPhone ||
    (typeof window !== "undefined" ? (
      localStorage.getItem("durtup_customer_phone") ||
      localStorage.getItem("customer_phone") ||
      localStorage.getItem("durtup_user_phone") ||
      localStorage.getItem("phone")
    ) : "") || 
    "";

  const userPhone = rawPhone.replace(/\D/g, "");

  // Build variants for phone lookups (01622530550, +8801622530550, 8801622530550, 1622530550)
  const phoneVariants = useMemo(() => {
    const variants = new Set<string>();
    if (userPhone) {
      const core10 = userPhone.length === 11 && userPhone.startsWith("0") 
        ? userPhone.slice(1) 
        : (userPhone.length === 13 && userPhone.startsWith("880") ? userPhone.slice(3) : userPhone);
      const standard11 = `0${core10}`;
      const with88 = `880${core10}`;
      const withPlus88 = `+880${core10}`;

      variants.add(standard11);
      variants.add(with88);
      variants.add(withPlus88);
      variants.add(core10);
      variants.add(userPhone);
    }
    return Array.from(variants);
  }, [userPhone]);

  useEffect(() => {
    const hasRecentLocalOrders = Boolean(
      typeof window !== "undefined" &&
      (localStorage.getItem("durtup_recent_placed_orders") || 
       localStorage.getItem("durtup_last_placed_order_id") || 
       localStorage.getItem("durtup_customer_phone"))
    );
    if (!loading && !user && !auth?.currentUser && !hasRecentLocalOrders) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchOrders();

    const unsubscribers: Array<() => void> = [];

    if (userUid) {
      try {
        const userOrdersQuery = query(collection(db, "orders"), where("user_id", "==", userUid));
        const unsub = onSnapshot(userOrdersQuery, () => {
          fetchOrders();
        }, (err) => {
          console.warn("Scoped orders Firestore listener notice:", err);
        });
        unsubscribers.push(unsub);
      } catch {}
    }

    if (userPhone) {
      try {
        const phoneOrdersQuery = query(collection(db, "orders"), where("customer_phone", "==", userPhone));
        const unsubPhone = onSnapshot(phoneOrdersQuery, () => {
          fetchOrders();
        }, (err) => {
          console.warn("Phone orders Firestore listener notice:", err);
        });
        unsubscribers.push(unsubPhone);
      } catch {}
    }

    if (user) {
      // Realtime listener for Supabase orders
      try {
        const sbChannel = supabase
          .channel(`public:orders:${user.id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
            fetchOrders();
          })
          .subscribe();
        unsubscribers.push(() => {
          supabase.removeChannel(sbChannel);
        });
      } catch {}
    }

    // Cross-tab and window focus listeners
    const onSync = () => fetchOrders();
    window.addEventListener("focus", onSync);
    document.addEventListener("visibilitychange", onSync);
    window.addEventListener("storage", onSync);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      window.removeEventListener("focus", onSync);
      document.removeEventListener("visibilitychange", onSync);
      window.removeEventListener("storage", onSync);
    };
  }, [userUid, userPhone, userEmail]);

  const formatOrderObject = (data: any, fallbackId?: string): Order => {
    const id = String(data.id || data.order_id || fallbackId || `ord_${Date.now()}`);
    const orderNumber = String(data.order_number || data.orderNumber || (id.startsWith("ORD-") ? id : id.slice(0, 10)));
    
    // Extract items
    const rawItems = Array.isArray(data.items) ? data.items : (Array.isArray(data.order_items) ? data.order_items : []);
    const formattedItems: OrderItem[] = rawItems.map((it: any, idx: number) => {
      const itImg = it.image || it.product_image || it.productImage || it.product?.image_url || it.product?.image || null;
      const itName = it.product_name || it.productName || it.name || it.title || it.product?.name || "Product";
      const itPrice = Number(it.price || it.unit_price || it.unitPrice || 0);
      const itQty = Number(it.quantity || 1);
      const itVariant = it.variant_name || (it.selected_variants ? Object.values(it.selected_variants).join(" / ") : null);
      return {
        id: it.id || `item_${idx}`,
        product_id: it.product_id || it.productId || null,
        product_name: itName,
        name: itName,
        image: itImg,
        product_image: itImg,
        price: itPrice,
        unit_price: itPrice,
        quantity: itQty,
        variant_name: itVariant
      };
    });

    // Extract primary image and primary product name
    let primaryImage = data.product_image || data.productImage || null;
    let primaryName = data.product_name || data.productName || null;

    if (!primaryImage && formattedItems.length > 0 && formattedItems[0].image) {
      primaryImage = formattedItems[0].image;
    }
    if (!primaryName && formattedItems.length > 0 && formattedItems[0].product_name) {
      primaryName = formattedItems[0].product_name;
    }

    const total = Number(data.total || data.totalAmount || data.price || 0);
    const subtotal = Number(data.subtotal || total);
    const shippingCost = Number(data.shipping_cost || data.shippingCost || 0);
    const discountAmount = Number(data.discount_amount || data.discountAmount || 0);

    const customerName = data.customer_name || data.customerName || (data.shipping_address?.firstName ? `${data.shipping_address.firstName} ${data.shipping_address.lastName || ""}`.trim() : data.shipping_address?.name) || "";
    const customerPhone = data.customer_phone || data.phone || data.shipping_address?.phone || "";
    const customerEmail = data.customer_email || data.email || data.shipping_address?.email || "";

    const totalItems = Number(data.total_items || formattedItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || 1);

    return {
      id,
      order_number: orderNumber,
      status: (data.status || "pending").toLowerCase(),
      payment_status: (data.payment_status || data.paymentStatus || "pending").toLowerCase(),
      payment_method: data.payment_method || data.paymentMethod || "cod",
      total,
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      created_at: data.created_at || data.createdAt || new Date().toISOString(),
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      shipping_address: data.shipping_address || {},
      items: formattedItems,
      order_items: formattedItems,
      product_image: primaryImage,
      product_name: primaryName,
      tracking_number: data.tracking_number || data.trackingNumber,
      courier_name: data.courier_name || data.courierName,
      total_items: totalItems
    };
  };

  const isOrderForUser = (data: any): boolean => {
    if (!data) return false;
    
    const uid = String(data.user_id || data.userId || "").trim();
    const orderEmail = String(data.customer_email || data.email || data.shipping_address?.email || "").toLowerCase().trim();
    const orderPhone = String(data.customer_phone || data.phone || data.shipping_address?.phone || "").replace(/\D/g, "");

    // 1. UID Match
    if (userUid && (uid === userUid || uid === `guest_${userUid}`)) return true;

    // 2. Email Match
    if (userEmail && (orderEmail === userEmail || uid === userEmail)) return true;

    // 3. Extracted Phone from Email Match
    if (phoneFromEmail && (orderPhone.includes(phoneFromEmail) || uid.includes(phoneFromEmail))) return true;

    // 4. Phone Match against all variants
    if (userPhone && orderPhone) {
      if (orderPhone.includes(userPhone) || userPhone.includes(orderPhone)) return true;
    }
    for (const pv of phoneVariants) {
      const cleanPv = pv.replace(/\D/g, "");
      if (cleanPv && orderPhone && (orderPhone === cleanPv || orderPhone.endsWith(cleanPv) || cleanPv.endsWith(orderPhone))) {
        return true;
      }
      if (uid && (uid === `guest_${pv}` || uid === pv || uid.includes(cleanPv))) {
        return true;
      }
    }

    // 5. Check if matches last placed order stored in this browser session
    const lastId = typeof window !== "undefined" ? localStorage.getItem("durtup_last_placed_order_id") : null;
    const lastNum = typeof window !== "undefined" ? localStorage.getItem("durtup_last_placed_order_number") : null;
    if ((lastId && (data.id === lastId || data.order_id === lastId)) || 
        (lastNum && (data.order_number === lastNum || data.orderNumber === lastNum))) {
      return true;
    }

    // 6. If user is Admin / Shop Owner, allow displaying placed orders
    if (isAdmin || profile?.role === "admin" || userEmail === "mdnahid7653959@gmail.com") {
      return true;
    }

    return false;
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const orderMap = new Map<string, Order>();

    const addOrMergeOrder = (rawOrder: any) => {
      if (!rawOrder || isMockOrder(rawOrder)) return;
      const formatted = formatOrderObject(rawOrder);
      if (formatted.total <= 0 && (!formatted.items || formatted.items.length === 0)) return;

      const key = formatted.order_number || formatted.id;
      if (!orderMap.has(key)) {
        orderMap.set(key, formatted);
      } else {
        const existing = orderMap.get(key)!;
        if (existing.status === "confirmed" && formatted.status === "pending") {
          // Keep higher status
        } else if (formatted.status) {
          existing.status = formatted.status;
        }
        if (formatted.payment_status) existing.payment_status = formatted.payment_status;
        if (formatted.total > 0) existing.total = formatted.total;
        if (formatted.items && formatted.items.length > 0 && (!existing.items || existing.items.length === 0)) {
          existing.items = formatted.items;
          existing.order_items = formatted.items;
        }
        if (formatted.product_image && !existing.product_image) {
          existing.product_image = formatted.product_image;
        }
        if (formatted.product_name && !existing.product_name) {
          existing.product_name = formatted.product_name;
        }
        if (formatted.shipping_address && Object.keys(formatted.shipping_address).length > 0) {
          existing.shipping_address = formatted.shipping_address;
        }
      }
    };

    // 0. Load recent locally placed orders first (0ms instantaneous display)
    try {
      // A. Scan durtup_recent_placed_orders
      const recentPlacedRaw = localStorage.getItem("durtup_recent_placed_orders");
      if (recentPlacedRaw) {
        const recentOrders = JSON.parse(recentPlacedRaw);
        if (Array.isArray(recentOrders)) {
          recentOrders.forEach((ro: any) => {
            if (isOrderForUser(ro)) {
              addOrMergeOrder(ro);
            }
          });
        }
      }

      // B. Scan all localStorage keys starting with durtup_recent_order_
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("durtup_recent_order_")) {
          try {
            const rawVal = localStorage.getItem(k);
            if (rawVal) {
              const ro = JSON.parse(rawVal);
              if (isOrderForUser(ro)) {
                addOrMergeOrder(ro);
              }
            }
          } catch {}
        }
      }

      // C. Scan enterprise_admin_orders and local_orders
      ["enterprise_admin_orders", "local_orders"].forEach((storageKey) => {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach((ao: any) => {
                if (isOrderForUser(ao)) {
                  addOrMergeOrder(ao);
                }
              });
            }
          }
        } catch {}
      });

      // D. Check last placed order id specifically
      const lastPlacedId = localStorage.getItem("durtup_last_placed_order_id");
      const lastPlacedNum = localStorage.getItem("durtup_last_placed_order_number");
      if (lastPlacedId && !orderMap.has(lastPlacedId)) {
        try {
          const snap = await getDoc(doc(db, "orders", lastPlacedId));
          if (snap.exists()) {
            addOrMergeOrder({ id: snap.id, ...snap.data() });
          }
        } catch {}
      }
      if (lastPlacedNum && !orderMap.has(lastPlacedNum)) {
        try {
          const snap = await getDoc(doc(db, "orders", lastPlacedNum));
          if (snap.exists()) {
            addOrMergeOrder({ id: snap.id, ...snap.data() });
          }
        } catch {}
      }
    } catch (localErr) {
      console.warn("LocalStorage order scan notice:", localErr);
    }

    // 1. Query Supabase DB
    if (user) {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          data.forEach((o: any) => {
            addOrMergeOrder(o);
          });
        }
      } catch (error) {
        console.warn("Error fetching Supabase orders:", error);
      }
    }

    // 2. Query Firestore DB for user orders & merge newest statuses
    try {
      const ordersCol = collection(db, "orders");
      const firestoreQueries: any[] = [];

      if (userUid) {
        firestoreQueries.push(query(ordersCol, where("user_id", "==", userUid)));
        firestoreQueries.push(query(ordersCol, where("userId", "==", userUid)));
      }
      if (userEmail) {
        firestoreQueries.push(query(ordersCol, where("customer_email", "==", userEmail)));
      }
      for (const pv of phoneVariants) {
        firestoreQueries.push(query(ordersCol, where("customer_phone", "==", pv)));
        firestoreQueries.push(query(ordersCol, where("phone", "==", pv)));
        firestoreQueries.push(query(ordersCol, where("user_id", "==", `guest_${pv}`)));
      }

      // If user is Admin, query recent orders collection directly
      if (isAdmin || profile?.role === "admin" || userEmail === "mdnahid7653959@gmail.com") {
        try {
          firestoreQueries.push(query(ordersCol, orderBy("created_at", "desc"), limit(50)));
        } catch {}
      }

      // Also refresh documents already found in orderMap
      for (const [k] of orderMap.entries()) {
        try {
          const directSnap = await getDoc(doc(db, "orders", k));
          if (directSnap.exists()) {
            addOrMergeOrder({ id: directSnap.id, ...directSnap.data() });
          }
        } catch {}
      }

      const querySnapshots = await Promise.allSettled(firestoreQueries.map(q => getDocs(q)));

      querySnapshots.forEach((result) => {
        if (result.status === "fulfilled" && result.value && !result.value.empty) {
          result.value.forEach((d) => {
            const data = d.data();
            if (isOrderForUser(data) || isOrderForUser({ id: d.id, ...data })) {
              addOrMergeOrder({ id: d.id, ...data });
            }
          });
        }
      });
    } catch (fsErr) {
      console.warn("Error fetching Firestore orders:", fsErr);
    }

    // 3. Purge invalid mock records from localStorage
    purgeMockOrdersFromStorage();

    // 4. Filter and sort by date descending
    const list = Array.from(orderMap.values())
      .filter((o) => (o.total > 0 || o.id) && !isMockOrder(o))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setOrders(list);
    setLoadingOrders(false);
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    try {
      // 1. Optimistically remove from state
      setOrders(prev => prev.filter(o => o.id !== orderId && o.order_number !== orderNumber));

      // 2. Delete from Firestore
      try {
        await deleteDoc(doc(db, "orders", orderId));
        if (orderNumber && orderNumber !== orderId) {
          await deleteDoc(doc(db, "orders", orderNumber));
        }
      } catch (e) {
        console.warn("Firestore delete order error:", e);
      }

      // 3. Delete from Supabase
      try {
        await supabase.from("orders").delete().eq("id", orderId);
        if (orderNumber) {
          await supabase.from("orders").delete().eq("order_number", orderNumber);
        }
      } catch (e) {
        console.warn("Supabase delete order error:", e);
      }

      // 4. Delete from localStorage
      try {
        const removeMatching = (storageKey: string) => {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const filtered = list.filter((o: any) => o.id !== orderId && o.order_number !== orderNumber && o.order_number !== orderId);
              localStorage.setItem(storageKey, JSON.stringify(filtered));
            }
          }
        };
        removeMatching("enterprise_admin_orders");
        removeMatching("local_orders");
        removeMatching("durtup_recent_placed_orders");
        localStorage.removeItem("durtup_recent_order_" + orderId);
        localStorage.removeItem("durtup_recent_order_" + orderNumber);
      } catch {}
    } catch (err) {
      console.error("Delete order failed:", err);
    }
  };

  const handleCopyOrderNumber = (e: React.MouseEvent, num: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Comprehensive Search filtering
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(order => {
      const matchesNum = (order.order_number || "").toLowerCase().includes(q);
      const matchesId = (order.id || "").toLowerCase().includes(q);
      const matchesProd = (order.product_name || "").toLowerCase().includes(q);
      const matchesItem = (order.items || []).some(it => (it.product_name || it.name || "").toLowerCase().includes(q));
      const matchesCust = (order.customer_name || "").toLowerCase().includes(q);
      const matchesPhone = (order.customer_phone || "").includes(q);
      const matchesStatus = (order.status || "").toLowerCase().includes(q);
      return matchesNum || matchesId || matchesProd || matchesItem || matchesCust || matchesPhone || matchesStatus;
    });
  }, [orders, searchQuery]);

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    orders.forEach(o => {
      const s = (o.status || "pending").toLowerCase();
      if (s === "pending") counts.pending++;
      else if (s === "processing" || s === "confirmed") counts.processing++;
      else if (s === "shipped") counts.shipped++;
      else if (s === "delivered") counts.delivered++;
      else if (s === "cancelled") counts.cancelled++;
    });
    return counts;
  }, [orders]);

  const renderOrderCard = (order: Order) => {
    const statusInfo = getStatusInfo(order.status || "pending");
    const StatusIcon = statusInfo.icon;
    const items = order.items && order.items.length > 0 ? order.items : [];
    const displayItems = items.slice(0, 2);
    const remainingCount = items.length - displayItems.length;

    // Delivery destination preview
    const address = order.shipping_address || {};
    const recipientName = order.customer_name || `${address.firstName || ""} ${address.lastName || ""}`.trim() || "Customer";
    const recipientPhone = order.customer_phone || address.phone || "";
    const cityState = [address.city, address.state, address.address].filter(Boolean).join(", ");

    const isCopied = copiedId === order.order_number;

    return (
      <Card 
        key={order.id} 
        className="overflow-hidden border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-200 bg-card rounded-2xl"
      >
        <CardContent className="p-0">
          {/* 1. Header Bar: Order #, Date, Status & Payment Badge, Actions */}
          <div className="p-4 sm:p-5 bg-muted/30 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm sm:text-base text-foreground tracking-tight">
                  #{order.order_number}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopyOrderNumber(e, order.order_number)}
                  title="Copy Order Number"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <span className="text-muted-foreground/40 hidden sm:inline">•</span>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>{formatOrderDate(order.created_at)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {/* Payment Method & Status Badge */}
              <Badge variant="outline" className="text-[11px] font-medium bg-background text-muted-foreground border-border/80 px-2 py-0.5 rounded-full capitalize flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-muted-foreground/70" />
                <span>{order.payment_method === "cod" ? "Cash on Delivery" : (order.payment_method || "Online Pay")}</span>
              </Badge>

              {/* Order Status Badge */}
              <Badge className={`${statusInfo.badgeClass} text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-none`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.label}</span>
              </Badge>

              {/* Delete Button with Confirmation Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-1"
                    title="Delete order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Order #{order.order_number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete this order record? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteOrder(order.id, order.order_number)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                    >
                      Delete Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* 2. Products / Items Showcase */}
          <div className="p-4 sm:p-5 space-y-3.5">
            {displayItems.length > 0 ? (
              <div className="space-y-3">
                {displayItems.map((item, idx) => {
                  const itemImg = item.image || item.product_image || order.product_image || "/durtup-logo.png";
                  const itemPrice = item.unit_price || item.price || 0;
                  const itemTotal = itemPrice * (item.quantity || 1);

                  return (
                    <div key={item.id || idx} className="flex items-center gap-3.5 group">
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-muted/50 border border-border/80 shrink-0 flex items-center justify-center">
                        <img 
                          src={itemImg} 
                          alt={item.product_name || "Product"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/durtup-logo.png";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <Link 
                          to={`/orders/${order.id}`}
                          className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                        >
                          {item.product_name || "Product"}
                        </Link>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          {item.variant_name && (
                            <span className="bg-muted px-2 py-0.5 rounded-md font-medium text-[11px] text-foreground/80">
                              {item.variant_name}
                            </span>
                          )}
                          <span>Qty: <strong className="text-foreground">{item.quantity || 1}</strong></span>
                          <span>•</span>
                          <span>৳{itemPrice.toLocaleString("en-BD")} each</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm sm:text-base text-foreground">
                          ৳{itemTotal.toLocaleString("en-BD")}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {remainingCount > 0 && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                      + {remainingCount} more item{remainingCount > 1 ? "s" : ""} in this order
                    </span>
                    <Link to={`/orders/${order.id}`} className="text-xs font-bold text-primary hover:underline">
                      View all items →
                    </Link>
                  </div>
                )}
              </div>
            ) : order.product_name ? (
              <div className="flex items-center gap-3.5 group">
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-muted/50 border border-border/80 shrink-0 flex items-center justify-center">
                  <img 
                    src={order.product_image || "/durtup-logo.png"} 
                    alt={order.product_name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/durtup-logo.png";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Link 
                    to={`/orders/${order.id}`}
                    className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {order.product_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Total: <strong className="text-foreground">৳{order.total.toLocaleString("en-BD")}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Order items ({order.total_items || 1} item)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confirmed order ready for fulfillment
                  </p>
                </div>
              </div>
            )}

            {/* Delivery destination preview & Tracking */}
            <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  Deliver to: <strong className="text-foreground font-semibold">{recipientName}</strong>
                  {recipientPhone ? ` (${recipientPhone})` : ""}
                  {cityState ? ` • ${cityState}` : ""}
                </span>
              </div>

              {order.tracking_number && (
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Tracking: #{order.tracking_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Footer Bar: Total Price & Quick Action Buttons */}
          <div className="p-4 sm:p-5 bg-muted/20 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                Order Total
              </p>
              <div className="flex items-baseline gap-2">
                <p className="font-black text-lg sm:text-xl text-foreground">
                  ৳{order.total.toLocaleString("en-BD", { minimumFractionDigits: 0 })}
                </p>
                {order.shipping_cost ? (
                  <span className="text-[11px] text-muted-foreground">
                    (incl. ৳{order.shipping_cost} delivery)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="rounded-xl font-semibold text-xs sm:text-sm h-9 px-3.5 border-border hover:bg-muted/80 text-foreground"
              >
                <Link to={`/orders/${order.id}`}>
                  View Details <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>

              <Button 
                size="sm" 
                asChild 
                className="rounded-xl font-semibold text-xs sm:text-sm h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                <Link to={`/orders/${order.id}`}>
                  Track Order <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const matchesTab = (orderStatus: string, tabValue: string) => {
    if (tabValue === "all") return true;
    const s = (orderStatus || "pending").toLowerCase();
    if (tabValue === "processing") {
      return s === "processing" || s === "confirmed";
    }
    return s === tabValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Package className="w-8 h-8 animate-bounce text-primary" />
            <span className="font-semibold text-sm">Loading your orders...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8 sm:py-10">
        <div className="container max-w-4xl px-3 sm:px-4">
          {/* Page Heading & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <Package className="w-7 h-7 text-primary" />
                My Orders
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Track your active shipments, view invoices, and manage order history
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, product, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl h-10 border-border/80 bg-background text-xs sm:text-sm shadow-xs focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Orders Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
              <TabsList className="w-max min-w-full sm:w-auto p-1 bg-muted/60 rounded-xl border border-border/60">
                <TabsTrigger value="all" className="text-xs sm:text-sm font-semibold rounded-lg gap-1.5 px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <span>All Orders</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-foreground/80">
                    {tabCounts.all}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm font-semibold rounded-lg gap-1.5 px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <span>Pending</span>
                  {tabCounts.pending > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                      {tabCounts.pending}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="processing" className="text-xs sm:text-sm font-semibold rounded-lg gap-1.5 px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <span>Processing</span>
                  {tabCounts.processing > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400">
                      {tabCounts.processing}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="shipped" className="text-xs sm:text-sm font-semibold rounded-lg gap-1.5 px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <span>Shipped</span>
                  {tabCounts.shipped > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-400">
                      {tabCounts.shipped}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs sm:text-sm font-semibold rounded-lg gap-1.5 px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">
                  <span>Delivered</span>
                  {tabCounts.delivered > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      {tabCounts.delivered}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="text-xs sm:text-sm font-semibold rounded-lg gap-1.5 px-3 py-1.5 text-muted-foreground data-[state=active]:text-destructive data-[state=active]:bg-background data-[state=active]:shadow-xs">
                  <span>Cancelled</span>
                  {tabCounts.cancelled > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400">
                      {tabCounts.cancelled}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* All Orders Tab */}
            <TabsContent value="all" className="space-y-4">
              {loadingOrders ? (
                <div className="py-16 text-center space-y-3">
                  <Package className="w-10 h-10 animate-spin mx-auto text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Loading your orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-2">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {searchQuery ? "No matching orders found" : "No orders yet"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      {searchQuery 
                        ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different order number or product name.`
                        : "When you place orders on Durtup.shop, they will appear here with live tracking, invoices, and delivery updates."}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {searchQuery ? (
                        <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl font-semibold">
                          Clear Search
                        </Button>
                      ) : !user ? (
                        <Button variant="outline" asChild className="rounded-xl font-semibold">
                          <Link to="/login">Sign In</Link>
                        </Button>
                      ) : null}
                      <Button asChild className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link to="/products">Start Shopping</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(renderOrderCard)}
                </div>
              )}
            </TabsContent>

            {/* Categorized Tabs */}
            {["pending", "processing", "shipped", "delivered", "cancelled"].map((status) => {
              const tabOrders = filteredOrders.filter(o => matchesTab(o.status, status));
              return (
                <TabsContent key={status} value={status} className="space-y-4">
                  {loadingOrders ? (
                    <div className="py-16 text-center space-y-3">
                      <Package className="w-10 h-10 animate-spin mx-auto text-primary" />
                      <p className="text-sm font-medium text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : tabOrders.length === 0 ? (
                    <Card className="rounded-2xl border-dashed border-2">
                      <CardContent className="py-16 text-center">
                        <p className="text-sm font-semibold text-muted-foreground capitalize">
                          No {status} orders found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Orders with {status} status will be listed here.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {tabOrders.map(renderOrderCard)}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
