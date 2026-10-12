import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Eye, 
  MoreHorizontal, 
  Package, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  RefreshCw, 
  Calendar, 
  CreditCard,
  Printer,
  PackageCheck,
  Tag,
  Save,
  CheckCircle2,
  ExternalLink,
  Edit,
  Trash2,
  Layers
} from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { adminDb } from "@/lib/adminDb";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SupplierManager } from "@/services/suppliers/supplierManager";
import { SupplierFulfillmentGroup } from "@/services/suppliers/supplierTypes";
import { EcomsellerEngine } from "@/services/suppliers/ecomsellerEngine";
import { isMockOrder, purgeMockOrdersFromStorage } from "@/utils/orderValidation";
import { processOrderReferralReward } from "@/services/referralService";
import { logAdminActivity } from "@/services/auditLogger";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAdminCacheInvalidation } from "@/hooks/useRealtimeSync";

import { PrintableInvoiceModal } from "@/components/admin/PrintableInvoiceModal";
import { PrintablePackingSlipModal } from "@/components/admin/PrintablePackingSlipModal";
import { PrintableShippingLabelModal } from "@/components/admin/PrintableShippingLabelModal";
import { OrderTimelineAudit } from "@/components/admin/OrderTimelineAudit";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  shipping_cost: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  total: number;
  notes: string | null;
  shipping_address: any;
  billing_address: any;
  courier_name?: string | null;
  tracking_number?: string | null;
  created_at: string;
  updated_at: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items?: any[];
  product_name?: string;
  product_image?: string;
  total_items?: number;
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  total: number;
  product_id: string | null;
  product_image?: string;
  product_category?: string;
  sku?: string | null;
}

interface CustomerInfo {
  email: string;
  full_name: string | null;
  phone: string | null;
}

interface LinkedConsignment {
  id: string;
  consignment_number: string | null;
  courier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  processing: "bg-blue-500 text-white",
  shipped: "bg-purple-500 text-white",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  refunded: "bg-muted text-muted-foreground",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  paid: "bg-success text-success-foreground",
  failed: "bg-destructive text-destructive-foreground",
  refunded: "bg-muted text-muted-foreground",
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { invalidateOrders } = useAdminCacheInvalidation();
  const { admin } = useAdminAuth();

  // Order Details Dialog State
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [linkedConsignment, setLinkedConsignment] = useState<LinkedConsignment | null>(null);

  // Courier & Tracking edit state
  const [courierInput, setCourierInput] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [savingCourier, setSavingCourier] = useState(false);

  // Printable Modals State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [packingSlipOpen, setPackingSlipOpen] = useState(false);
  const [shippingLabelOpen, setShippingLabelOpen] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Ecomseller BD & Multi-Supplier Fulfillment State
  const [ecomsellerModalOpen, setEcomsellerModalOpen] = useState(false);
  const [selectedFulfillmentGroup, setSelectedFulfillmentGroup] = useState<SupplierFulfillmentGroup | null>(null);
  const [supplierStatus, setSupplierStatus] = useState<string>("pending_supplier");

  const fetchOrders = async () => {
    setLoading(true);
    
    // Fetch all profiles to map users to orders
    try {
      const pSnap = await getDocs(collection(db, "profiles"));
      const pMap: Record<string, any> = {};
      pSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const uId = docSnap.id || data.id || data.user_id;
        const prof = {
          id: uId,
          user_id: data.user_id || uId,
          full_name: data.full_name || data.name || "Customer",
          email: data.email || null,
          phone: data.phone || null,
          avatar_url: data.avatar_url || data.photoURL || null,
          role: data.role || "customer",
        };
        if (uId) pMap[uId] = prof;
        if (data.email) pMap[data.email.toLowerCase()] = prof;
        if (data.phone) pMap[data.phone] = prof;
      });
      setProfilesMap(pMap);
    } catch (e) {
      console.warn("Profiles map fetch error:", e);
    }

    // Purge mock orders from local caches if present
    purgeMockOrdersFromStorage();

    const ordersMap = new Map<string, Order>();

    // 1. Direct Firestore collection fetch
    try {
      const snap = await getDocs(collection(db, "orders"));
      snap.forEach((d) => {
        const data = d.data();
        if (!isMockOrder(data) && !isMockOrder({ id: d.id, ...data })) {
          const item: Order = {
            id: d.id,
            order_number: data.order_number || data.orderNumber || d.id,
            user_id: data.user_id || data.userId || "guest",
            status: (data.status || "pending").toLowerCase(),
            payment_status: (data.payment_status || data.paymentStatus || "pending").toLowerCase(),
            payment_method: data.payment_method || data.paymentMethod || "cod",
            subtotal: Number(data.subtotal || 0),
            shipping_cost: Number(data.shipping_cost || data.shippingCost || 0),
            discount_amount: Number(data.discount_amount || data.discountAmount || 0),
            tax_amount: Number(data.tax_amount || 0),
            total: Number(data.total || data.totalAmount || 0),
            notes: data.notes || null,
            shipping_address: data.shipping_address || data.shippingAddress || {},
            billing_address: data.billing_address || data.billingAddress || {},
            courier_name: data.courier_name || null,
            tracking_number: data.tracking_number || null,
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
            updated_at: data.updated_at || data.updatedAt || null,
            customer_name: data.shipping_address?.firstName
              ? `${data.shipping_address.firstName} ${data.shipping_address.lastName || ""}`.trim()
              : data.shipping_address?.name || data.customer_name || undefined,
            customer_phone: data.shipping_address?.phone || data.customer_phone || undefined,
            customer_email: data.shipping_address?.email || data.customer_email || undefined,
            items: data.items || [],
            product_name: data.product_name,
            product_image: data.product_image,
            total_items: data.total_items,
          };
          const key = item.order_number || item.id;
          ordersMap.set(key, item);
        }
      });
    } catch (fsErr) {
      console.warn("Firestore orders fetch warning:", fsErr);
    }

    // 2. Direct DB query from Supabase
    try {
      const { data: dbOrders, error: dbErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!dbErr && dbOrders && dbOrders.length > 0) {
        (dbOrders as any[]).forEach((o) => {
          if (!isMockOrder(o)) {
            const key = o.order_number || o.id;
            const existing = ordersMap.get(key);
            const item: Order = {
              id: o.id,
              order_number: o.order_number || o.id,
              user_id: o.user_id || "guest",
              status: (o.status || existing?.status || "pending").toLowerCase(),
              payment_status: (o.payment_status || existing?.payment_status || "pending").toLowerCase(),
              payment_method: o.payment_method || existing?.payment_method || "cod",
              subtotal: Number(o.subtotal || existing?.subtotal || 0),
              shipping_cost: Number(o.shipping_cost || existing?.shipping_cost || 0),
              discount_amount: Number(o.discount_amount || existing?.discount_amount || 0),
              tax_amount: Number(o.tax_amount || 0),
              total: Number(o.total || existing?.total || 0),
              notes: o.notes || existing?.notes || null,
              shipping_address: o.shipping_address || existing?.shipping_address || {},
              billing_address: o.billing_address || existing?.billing_address || {},
              courier_name: o.courier_name || existing?.courier_name || null,
              tracking_number: o.tracking_number || existing?.tracking_number || null,
              created_at: o.created_at || existing?.created_at || new Date().toISOString(),
              updated_at: o.updated_at || existing?.updated_at || null,
              customer_name: existing?.customer_name || o.customer_name || (o.shipping_address?.firstName ? `${o.shipping_address.firstName} ${o.shipping_address.lastName || ""}`.trim() : o.shipping_address?.name),
              customer_phone: existing?.customer_phone || o.customer_phone || o.shipping_address?.phone,
              customer_email: existing?.customer_email || o.customer_email || o.shipping_address?.email,
              items: existing?.items || o.items || [],
              product_name: existing?.product_name || o.product_name,
              product_image: existing?.product_image || o.product_image,
              total_items: existing?.total_items || o.total_items,
            };
            ordersMap.set(key, item);
          }
        });
      }
    } catch (dbErr) {
      console.warn("Direct fetch orders error:", dbErr);
    }

    // 3. Fallback: LocalStorage Cache
    try {
      const raw = localStorage.getItem("enterprise_admin_orders") || localStorage.getItem("local_orders");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((o: any) => {
            if (!isMockOrder(o)) {
              const key = o.order_number || o.id;
              if (!ordersMap.has(key)) {
                ordersMap.set(key, o);
              }
            }
          });
        }
      }
    } catch (lsErr) {
      console.warn("Local storage orders fetch warning:", lsErr);
    }

    const mergedOrders = Array.from(ordersMap.values()).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime() || 0;
      const dateB = new Date(b.created_at).getTime() || 0;
      return dateB - dateA;
    });

    try {
      localStorage.setItem("enterprise_admin_orders", JSON.stringify(mergedOrders));
      localStorage.setItem("local_orders", JSON.stringify(mergedOrders));
    } catch {}

    setOrders(mergedOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // 1. Real-time Firestore onSnapshot listener
    const unsubFirestore = onSnapshot(
      collection(db, "orders"),
      () => {
        fetchOrders();
      },
      (err) => {
        console.warn("Admin orders Firestore realtime listener error:", err);
      }
    );

    // 2. Real-time Supabase postgres_changes
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // 3. Cross-tab and BroadcastChannel listeners for instant sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("durtup_admin_order_notifications");
        bc.onmessage = () => {
          fetchOrders();
        };
      }
    } catch {}

    const onSync = () => fetchOrders();
    window.addEventListener("durtup_new_order", onSync);
    window.addEventListener("storage", onSync);
    window.addEventListener("focus", onSync);
    document.addEventListener("visibilitychange", onSync);

    return () => {
      unsubFirestore();
      supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener("durtup_new_order", onSync);
      window.removeEventListener("storage", onSync);
      window.removeEventListener("focus", onSync);
      document.removeEventListener("visibilitychange", onSync);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    invalidateOrders();
    toast({ title: "Orders synced" });
    setRefreshing(false);
  };

  const handleSaveAllOrders = async () => {
    setSavingAll(true);
    const nowIso = new Date().toISOString();
    try {
      // 1. Save to LocalStorage
      localStorage.setItem("enterprise_admin_orders", JSON.stringify(orders));
      localStorage.setItem("local_orders", JSON.stringify(orders));

      // 2. Batch update to Firestore
      for (const order of orders) {
        try {
          await setDoc(doc(db, "orders", order.id), {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            total: order.total,
            totalAmount: order.total,
            courier_name: order.courier_name || null,
            tracking_number: order.tracking_number || null,
            user_id: order.user_id || undefined,
            customer_name: order.customer_name || undefined,
            customer_phone: order.customer_phone || undefined,
            updated_at: nowIso
          }, { merge: true });
        } catch (err) {
          console.warn(`Firestore save error for order ${order.id}:`, err);
        }

        // 3. Update Supabase
        try {
          await supabase.from("orders").update({
            status: order.status,
            payment_status: order.payment_status,
            courier_name: order.courier_name || null,
            tracking_number: order.tracking_number || null,
            updated_at: nowIso
          }).eq("id", order.id);
        } catch (sbErr) {
          console.warn(`Supabase save error for order ${order.id}:`, sbErr);
        }
      }

      // 4. Dispatch storage event for instant cross-tab sync
      window.dispatchEvent(new Event("storage"));
      invalidateOrders();

      toast({
        title: "Saved Successfully! 🎉",
        description: "All order statuses and changes have been saved & synced to user panel."
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "Failed to save orders"
      });
    } finally {
      setSavingAll(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const nowIso = new Date().toISOString();
      const targetOrder = orders.find((o) => o.id === id || o.order_number === id);

      // Optimistically update React state and LocalStorage immediately
      setOrders((prevOrders) => {
        const updated = prevOrders.map((o) => (o.id === id || o.order_number === id ? { ...o, status: newStatus, updated_at: nowIso } : o));
        try {
          localStorage.setItem("enterprise_admin_orders", JSON.stringify(updated));
          localStorage.setItem("local_orders", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (selectedOrder && (selectedOrder.id === id || selectedOrder.order_number === id)) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      // 1. Direct Firestore update across id and order_number
      try {
        await setDoc(doc(db, "orders", id), { status: newStatus, updated_at: nowIso }, { merge: true });
        if (targetOrder?.id && targetOrder.id !== id) {
          await setDoc(doc(db, "orders", targetOrder.id), { status: newStatus, updated_at: nowIso }, { merge: true });
        }
        if (targetOrder?.order_number && targetOrder.order_number !== id) {
          await setDoc(doc(db, "orders", targetOrder.order_number), { status: newStatus, updated_at: nowIso }, { merge: true });
        }
      } catch (e) {
        console.warn("Firestore direct setDoc error:", e);
      }

      // 2. Direct Supabase update across id and order_number
      try {
        await supabase.from("orders").update({ status: newStatus, updated_at: nowIso }).eq("id", id);
        await supabase.from("orders").update({ status: newStatus, updated_at: nowIso }).eq("order_number", id);
        if (targetOrder?.id) {
          await supabase.from("orders").update({ status: newStatus, updated_at: nowIso }).eq("id", targetOrder.id);
        }
        if (targetOrder?.order_number) {
          await supabase.from("orders").update({ status: newStatus, updated_at: nowIso }).eq("order_number", targetOrder.order_number);
        }
      } catch (sbErr) {
        console.warn("Supabase update error:", sbErr);
      }

      // 3. Fallback adminDb & Edge Function
      try {
        await adminDb.update("orders", { status: newStatus, updated_at: nowIso }, { id });
      } catch {}

      if (admin?.id) {
        supabase.functions.invoke("admin-orders", {
          body: { action: "update-status", adminId: admin.id, orderId: id, data: { status: newStatus } }
        }).catch(() => {});
      }

      // 4. Record transition in order_timelines
      const timelineRecord = {
        order_id: id,
        status: newStatus,
        notes: `Order status changed to ${newStatus}`,
        changed_by: admin?.displayName || admin?.username || "Admin",
        created_at: nowIso,
      };

      try {
        await supabase.from("order_timelines" as any).insert(timelineRecord);
      } catch {
        await adminDb.insert("order_timelines", timelineRecord).catch(() => {});
      }

      // 5. Trigger trusted server-side referral reward evaluation
      processOrderReferralReward(targetOrder?.id || id, newStatus).then((res) => {
        if (res?.rewardIssued) {
          toast({
            title: "🎉 Referral Reward Issued",
            description: `৳${res.rewardAmount} credited to referrer wallet.`
          });
        }
      }).catch((e) => {
        console.warn("Referral reward execution notice:", e);
      });

      toast({ title: "Order status updated", description: `Changed status to ${newStatus}` });
      invalidateOrders();

      logAdminActivity({
        action: "UPDATE_ORDER_STATUS",
        entity_type: "order",
        entity_id: targetOrder?.order_number || id,
        entity_name: `Order #${targetOrder?.order_number || id}`,
        old_value: targetOrder?.status,
        new_value: newStatus,
        details: `Order status updated to ${newStatus}`,
      }).catch(() => {});
    } catch (err: any) {
      console.error("Status update error:", err);
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update status" });
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: string) => {
    try {
      const nowIso = new Date().toISOString();
      const targetOrder = orders.find((o) => o.id === id || o.order_number === id);

      setOrders((prevOrders) => {
        const updated = prevOrders.map((o) => (o.id === id || o.order_number === id ? { ...o, payment_status, updated_at: nowIso } : o));
        try {
          localStorage.setItem("enterprise_admin_orders", JSON.stringify(updated));
          localStorage.setItem("local_orders", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (selectedOrder && (selectedOrder.id === id || selectedOrder.order_number === id)) {
        setSelectedOrder({ ...selectedOrder, payment_status });
      }

      // Direct Firestore update
      try {
        await setDoc(doc(db, "orders", id), { payment_status, updated_at: nowIso }, { merge: true });
        if (targetOrder?.id && targetOrder.id !== id) {
          await setDoc(doc(db, "orders", targetOrder.id), { payment_status, updated_at: nowIso }, { merge: true });
        }
        if (targetOrder?.order_number && targetOrder.order_number !== id) {
          await setDoc(doc(db, "orders", targetOrder.order_number), { payment_status, updated_at: nowIso }, { merge: true });
        }
      } catch (e) {
        console.warn("Firestore direct setDoc error:", e);
      }

      // Direct Supabase update
      try {
        await supabase.from("orders").update({ payment_status, updated_at: nowIso }).eq("id", id);
        await supabase.from("orders").update({ payment_status, updated_at: nowIso }).eq("order_number", id);
        if (targetOrder?.id) {
          await supabase.from("orders").update({ payment_status, updated_at: nowIso }).eq("id", targetOrder.id);
        }
        if (targetOrder?.order_number) {
          await supabase.from("orders").update({ payment_status, updated_at: nowIso }).eq("order_number", targetOrder.order_number);
        }
      } catch (sbErr) {
        console.warn("Supabase payment update warning:", sbErr);
      }

      try {
        await adminDb.update("orders", { payment_status, updated_at: nowIso }, { id });
      } catch {}

      if (admin?.id) {
        supabase.functions.invoke("admin-orders", {
          body: { action: "update-payment", adminId: admin.id, orderId: id, data: { payment_status } }
        }).catch(() => {});
      }

      toast({ title: "Payment status updated", description: `Payment status changed to ${payment_status}` });

      logAdminActivity({
        action: "UPDATE_PAYMENT_STATUS",
        entity_type: "order",
        entity_id: targetOrder?.order_number || id,
        entity_name: `Order #${targetOrder?.order_number || id}`,
        old_value: targetOrder?.payment_status,
        new_value: payment_status,
        details: `Payment status updated to ${payment_status}`,
      }).catch(() => {});
    } catch (err: any) {
      console.error("Payment status update error:", err);
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update payment status" });
    }
  };

  const handleDeleteOrder = async (id: string, order_number: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete order #${order_number || id}?`)) {
      return;
    }
    try {
      logAdminActivity({
        action: "DELETE_ORDER",
        entity_type: "order",
        entity_id: order_number || id,
        entity_name: `Order #${order_number || id}`,
        details: `Order #${order_number || id} was deleted by admin`,
      }).catch(() => {});
      setOrders(prev => prev.filter(o => o.id !== id && o.order_number !== order_number));
      try {
        await deleteDoc(doc(db, "orders", id));
        if (order_number && order_number !== id) {
          await deleteDoc(doc(db, "orders", order_number));
        }
      } catch {}
      try {
        await supabase.from("orders").delete().eq("id", id);
        if (order_number) {
          await supabase.from("orders").delete().eq("order_number", order_number);
        }
      } catch {}
      try {
        const removeMatching = (storageKey: string) => {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const filtered = list.filter((o: any) => o.id !== id && o.order_number !== order_number && o.order_number !== id);
              localStorage.setItem(storageKey, JSON.stringify(filtered));
            }
          }
        };
        removeMatching("enterprise_admin_orders");
        removeMatching("local_orders");
      } catch {}
      toast({ title: "Order deleted", description: `Order #${order_number} has been removed` });
      invalidateOrders();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete order" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedOrderIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedOrderIds.size} selected order(s)?`)) {
      return;
    }

    const toDelete = Array.from(selectedOrderIds);
    setOrders(prev => prev.filter(o => !selectedOrderIds.has(o.id)));
    setSelectedOrderIds(new Set());

    for (const id of toDelete) {
      try {
        await deleteDoc(doc(db, "orders", id));
        await supabase.from("orders").delete().eq("id", id);
      } catch {}
    }

    try {
      const removeMatching = (storageKey: string) => {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter((o: any) => !toDelete.includes(o.id) && !toDelete.includes(o.order_number));
            localStorage.setItem(storageKey, JSON.stringify(filtered));
          }
        }
      };
      removeMatching("enterprise_admin_orders");
      removeMatching("local_orders");
    } catch {}

    toast({ title: "Orders deleted", description: `${toDelete.length} order(s) removed successfully` });
    invalidateOrders();
  };

  const handleClearAllTestOrders = async () => {
    if (!window.confirm("Are you sure you want to clear all fake/test orders? This will immediately purge test orders from the database and cache.")) {
      return;
    }

    try {
      // 1. Delete all mock orders from Firestore and Supabase
      const mockOrdersToDelete = orders.filter((o) => isMockOrder(o));
      for (const o of mockOrdersToDelete) {
        try {
          if (o.id) {
            await deleteDoc(doc(db, "orders", o.id));
            await supabase.from("orders").delete().eq("id", o.id);
          }
          if (o.order_number && o.order_number !== o.id) {
            await deleteDoc(doc(db, "orders", o.order_number));
            await supabase.from("orders").delete().eq("order_number", o.order_number);
          }
        } catch (err) {
          console.warn("Delete mock order error:", err);
        }
      }

      // 2. Remove all storage caches and purge
      localStorage.removeItem("enterprise_admin_orders");
      localStorage.removeItem("local_orders");
      localStorage.removeItem("durtup_admin_orders");
      localStorage.removeItem("admin_orders");
      purgeMockOrdersFromStorage();

      setOrders(prev => prev.filter(o => !isMockOrder(o)));
      setSelectedOrderIds(new Set());
      toast({ title: "Fake Orders Cleared", description: "All test and demo orders have been purged successfully" });
      invalidateOrders();
      await fetchOrders();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to clear fake orders" });
    }
  };

  const handleSaveCourierTracking = async () => {
    if (!selectedOrder) return;
    setSavingCourier(true);
    try {
      const nowIso = new Date().toISOString();
      const updates = {
        courier_name: courierInput.trim() || null,
        tracking_number: trackingInput.trim() || null,
        updated_at: nowIso,
      };

      await supabase.from("orders").update(updates).eq("id", selectedOrder.id);
      await adminDb.update("orders", updates, { id: selectedOrder.id });

      // Audit note
      const timelineRecord = {
        order_id: selectedOrder.id,
        status: selectedOrder.status,
        notes: `Assigned Courier: ${courierInput || 'None'}, Tracking #: ${trackingInput || 'None'}`,
        changed_by: admin?.displayName || admin?.username || "Admin",
        created_at: nowIso,
      };
      try {
        await supabase.from("order_timelines" as any).insert(timelineRecord);
      } catch {}

      setSelectedOrder({
        ...selectedOrder,
        courier_name: courierInput.trim(),
        tracking_number: trackingInput.trim(),
      });

      toast({ title: "Courier info saved", description: "Updated tracking parameters" });
      fetchOrders();
    } catch (err: any) {
      console.error("Courier save error:", err);
      toast({ variant: "destructive", title: "Failed to save", description: err.message });
    } finally {
      setSavingCourier(false);
    }
  };

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setCourierInput(order.courier_name || "");
    setTrackingInput(order.tracking_number || "");
    setDetailsOpen(true);
    setLoadingDetails(true);

    try {
      let fetchedOrderDetails = false;

      if (admin?.id) {
        try {
          const { data, error } = await supabase.functions.invoke("admin-orders", {
            body: { action: "get", adminId: admin.id, orderId: order.id }
          });

          if (!error && data?.order) {
            const fetchedOrder = data.order;
            const items = fetchedOrder.order_items || [];
            const itemsWithDetails = await Promise.all(
              items.map(async (item: any) => {
                let product_image = null;
                let product_category = null;

                if (item.product_id) {
                  const { data: images } = await supabase
                    .from("product_images")
                    .select("image_url, is_primary")
                    .eq("product_id", item.product_id);

                  if (images && images.length > 0) {
                    const primaryImage = images.find((img: any) => img.is_primary);
                    product_image = primaryImage?.image_url || images[0]?.image_url || null;
                  }

                  const { data: product } = await supabase
                    .from("products_public")
                    .select("category_id")
                    .eq("id", item.product_id)
                    .single();

                  if (product?.category_id) {
                    const { data: category } = await supabase
                      .from("categories")
                      .select("name")
                      .eq("id", product.category_id)
                      .single();
                    product_category = category?.name || null;
                  }
                }

                return { ...item, product_image, product_category };
              })
            );
            setOrderItems(itemsWithDetails);

            if (fetchedOrder.customer) {
              setCustomerInfo(fetchedOrder.customer);
            }
            fetchedOrderDetails = true;
          }
        } catch (efErr) {
          console.warn("admin-orders get edge function error:", efErr);
        }
      }

      if (!fetchedOrderDetails || orderItems.length === 0) {
        // Direct query fallback for items
        const { data: directItems } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id);
        
        let items = (directItems && directItems.length > 0) ? directItems : [];

        // Fallback: check order.items or fetch directly from Firestore doc
        if (items.length === 0) {
          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            items = order.items;
          } else {
            try {
              const fsDoc = await getDoc(doc(db, "orders", order.id));
              if (fsDoc.exists() && fsDoc.data()?.items && Array.isArray(fsDoc.data()?.items)) {
                items = fsDoc.data()!.items;
              }
            } catch {}
          }
        }
        
        const itemsWithDetails = await Promise.all(
          items.map(async (item: any) => {
            let product_image = item.product_image || item.image || null;
            let product_category = item.product_category || item.category || null;

            if (!product_image && item.product_id) {
              const { data: images } = await supabase
                .from("product_images")
                .select("image_url, is_primary")
                .eq("product_id", item.product_id);

              if (images && images.length > 0) {
                const primaryImage = images.find((img: any) => img.is_primary);
                product_image = primaryImage?.image_url || images[0]?.image_url || null;
              }
            }

            if (item.product_id && !product_category) {
              try {
                const { data: product } = await supabase
                  .from("products_public")
                  .select("category_id")
                  .eq("id", item.product_id)
                  .single();

                if (product?.category_id) {
                  const { data: category } = await supabase
                    .from("categories")
                    .select("name")
                    .eq("id", product.category_id)
                    .single();
                  product_category = category?.name || null;
                }
              } catch {}
            }

            return {
              id: item.id || String(Math.random()),
              product_name: item.product_name || item.name || item.title || "Product",
              variant_name: item.variant_name || item.variant || null,
              quantity: Number(item.quantity || 1),
              price: Number(item.price || 0),
              total: Number(item.total || (Number(item.price || 0) * Number(item.quantity || 1))),
              product_id: item.product_id || null,
              product_image: product_image || "/durtup-logo.png",
              product_category,
              sku: item.sku || null
            };
          })
        );
        setOrderItems(itemsWithDetails);
      }

      // Fetch linked consignment from consignments table
      const { data: consData } = await supabase
        .from("consignments")
        .select("id, consignment_number, courier, tracking_number, status, shipped_at, delivered_at")
        .eq("order_id", order.id)
        .maybeSingle();
      
      if (consData) {
        setLinkedConsignment(consData as LinkedConsignment);
      } else {
        setLinkedConsignment(null);
      }

    } catch (err) {
      console.error("Error fetching order details:", err);
    }

    setLoadingDetails(false);
  };

  const formatAddress = (address: any) => {
    if (!address) return "No address provided";
    if (typeof address === "string") return address;
    const parts = [
      address.name || address.fullName || (address.firstName ? `${address.firstName} ${address.lastName || ''}`.trim() : null),
      address.street || address.address || address.address_line1,
      address.city,
      address.state,
      address.zip || address.postal_code || address.zipCode,
      address.country,
    ].filter(Boolean);
    const addressText = parts.join(", ") || "No address provided";
    const phone = address.phone;
    return phone ? `${addressText}\n📞 ${phone}` : addressText;
  };

  const resolveCustomer = (order: Order) => {
    const fallbackName = order.shipping_address?.full_name || 
      order.shipping_address?.name || 
      order.shipping_address?.fullName ||
      (order.shipping_address?.firstName ? `${order.shipping_address.firstName} ${order.shipping_address.lastName || ''}`.trim() : null) || 
      order.customer_name || 
      "Customer";

    // 1. Try match by user_id
    if (order.user_id && profilesMap[order.user_id]) {
      const p = profilesMap[order.user_id];
      return {
        id: p.id || order.user_id,
        user_id: p.user_id || order.user_id,
        name: p.full_name || fallbackName,
        phone: p.phone || order.shipping_address?.phone || order.customer_phone || null,
        email: p.email || order.shipping_address?.email || order.customer_email || null,
        avatar_url: p.avatar_url || null,
        role: p.role || "customer",
        isRegistered: true,
      };
    }

    // 2. Try match by email
    const email = order.shipping_address?.email || order.customer_email;
    if (email && profilesMap[email.toLowerCase()]) {
      const p = profilesMap[email.toLowerCase()];
      return {
        id: p.id || order.user_id || "guest",
        user_id: p.user_id || order.user_id || "guest",
        name: p.full_name || fallbackName,
        phone: p.phone || order.shipping_address?.phone || order.customer_phone || null,
        email: p.email || email,
        avatar_url: p.avatar_url || null,
        role: p.role || "customer",
        isRegistered: true,
      };
    }

    // 3. Try match by phone
    const phone = order.shipping_address?.phone || order.customer_phone;
    if (phone && profilesMap[phone]) {
      const p = profilesMap[phone];
      return {
        id: p.id || order.user_id || "guest",
        user_id: p.user_id || order.user_id || "guest",
        name: p.full_name || fallbackName,
        phone: p.phone || phone,
        email: p.email || email || null,
        avatar_url: p.avatar_url || null,
        role: p.role || "customer",
        isRegistered: true,
      };
    }

    // 4. Default from shipping address / order details
    return {
      id: order.user_id || "guest",
      user_id: order.user_id || "guest",
      name: fallbackName,
      phone: phone || null,
      email: email || null,
      avatar_url: null,
      role: order.user_id && order.user_id !== "guest" ? "customer" : "guest",
      isRegistered: !!(order.user_id && order.user_id !== "guest"),
    };
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const cust = resolveCustomer(order);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.order_number.toLowerCase().includes(q) ||
      (order.tracking_number && order.tracking_number.toLowerCase().includes(q)) ||
      (cust.name && cust.name.toLowerCase().includes(q)) ||
      (cust.phone && cust.phone.toLowerCase().includes(q)) ||
      (cust.email && cust.email.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const totalRevenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <AdminLayout title="Orders">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders & Fulfillment</h1>
            <p className="text-muted-foreground">Manage customer orders, status timelines, dynamic invoices & courier shipping</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {selectedOrderIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteSelected}
                className="font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedOrderIds.size})
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAllTestOrders}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/50 flex items-center gap-1.5 font-medium"
              title="Purge all fake & test orders from the database and cache"
            >
              <Trash2 className="h-4 w-4" />
              Clear Fake Orders
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Sync Orders
            </Button>
            <Button 
              onClick={handleSaveAllOrders} 
              disabled={savingAll}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md flex items-center gap-2"
            >
              {savingAll ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              {savingAll ? "Saving to Store..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-500">{processingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shipped</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-500">{shippedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">{deliveredCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">৳{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search order #, customer, or tracking #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    aria-label="Select all orders"
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status Transition</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[70px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading orders...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const cust = resolveCustomer(order);
                  const searchTarget = cust.phone || cust.email || (cust.user_id && cust.user_id !== "guest" ? cust.user_id : "") || cust.name;
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="w-10">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                          aria-label={`Select order ${order.order_number}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium font-mono text-foreground">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method || 'COD'}
                          </p>
                          {order.tracking_number && (
                            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1 mt-0.5">
                              <Truck className="h-3 w-3" />
                              {order.tracking_number}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Customer / Buyer Column with direct link to user profile page */}
                      <TableCell>
                        <div className="flex items-start gap-2.5 max-w-[210px]">
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200 dark:border-orange-800 overflow-hidden mt-0.5">
                            {cust.avatar_url ? (
                              <img src={cust.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (cust.name?.charAt(0) || "U").toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="font-semibold text-xs text-foreground truncate" title={cust.name}>
                              {cust.name}
                            </p>
                            {cust.phone && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0 opacity-70" />
                                <span className="truncate">{cust.phone}</span>
                              </p>
                            )}
                            {cust.email && !cust.phone && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3 shrink-0 opacity-70" />
                                <span className="truncate">{cust.email}</span>
                              </p>
                            )}
                            <Link
                              to={`/admin/users?search=${encodeURIComponent(searchTarget || "")}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline pt-0.5"
                              onClick={(e) => e.stopPropagation()}
                              title="View this user profile in Admin Users"
                            >
                              <User className="h-3 w-3" />
                              <span>User Profile</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(order.created_at).toLocaleDateString('en-BD')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(v) => updateStatus(order.id, v)}
                        >
                          <SelectTrigger className="w-32 h-8 p-0 border-0 bg-transparent">
                            <Badge className={statusColors[order.status] || "bg-muted"}>{order.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={order.payment_status}
                          onValueChange={(v) => updatePaymentStatus(order.id, v)}
                        >
                          <SelectTrigger className="w-24 h-8 p-0 border-0 bg-transparent">
                            <Badge className={paymentStatusColors[order.payment_status] || "bg-muted"}>
                              {order.payment_status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="font-bold text-foreground">৳{order.total.toFixed(0)}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details & Timelines
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                navigate(`/admin/users?search=${encodeURIComponent(searchTarget || "")}`);
                              }}
                              className="cursor-pointer font-medium text-orange-600 dark:text-orange-400"
                            >
                              <User className="h-4 w-4 mr-2" />
                              View Customer in Users Page
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrder(order);
                              setInvoiceModalOpen(true);
                            }}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrder(order);
                              setPackingSlipOpen(true);
                            }}>
                              <PackageCheck className="h-4 w-4 mr-2" />
                              Print Packing Slip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedOrder(order);
                              setShippingLabelOpen(true);
                            }}>
                              <Tag className="h-4 w-4 mr-2" />
                              Print Shipping Label
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteOrder(order.id, order.order_number)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Details & Audit Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Order #{selectedOrder?.order_number}</span>
              </div>

              {/* Printable Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setInvoiceModalOpen(true)}>
                  <Printer className="h-4 w-4 mr-1" />
                  Invoice
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPackingSlipOpen(true)}>
                  <PackageCheck className="h-4 w-4 mr-1" />
                  Packing Slip
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShippingLabelOpen(true)}>
                  <Tag className="h-4 w-4 mr-1" />
                  Shipping Label
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder && new Date(selectedOrder.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Row & Transition Select */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColors[selectedOrder?.status || "pending"]}>
                    Status: {selectedOrder?.status}
                  </Badge>
                  <Badge className={paymentStatusColors[selectedOrder?.payment_status || "pending"]}>
                    Payment: {selectedOrder?.payment_status}
                  </Badge>
                  {selectedOrder?.payment_method && (
                    <Badge variant="outline">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {selectedOrder.payment_method}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Change Status:</span>
                  <Select
                    value={selectedOrder?.status}
                    onValueChange={(v) => selectedOrder && updateStatus(selectedOrder.id, v)}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Courier & Shipping Tracking Section */}
              <Card className="border-purple-500/20 bg-purple-50/10 dark:bg-purple-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-600" />
                      <span>Courier Shipping & Consignment Tracking</span>
                    </div>
                    {linkedConsignment && (
                      <Badge className="bg-purple-600 text-white font-mono text-xs">
                        Consignment: #{linkedConsignment.consignment_number || linkedConsignment.id.slice(0, 8)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="courier-name" className="text-xs">Courier Service Provider</Label>
                      <Select value={courierInput} onValueChange={setCourierInput}>
                        <SelectTrigger id="courier-name" className="h-9 text-xs">
                          <SelectValue placeholder="Select Courier Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pathao Courier">Pathao Courier</SelectItem>
                          <SelectItem value="Steadfast Courier">Steadfast Courier</SelectItem>
                          <SelectItem value="RedX Logistics">RedX Logistics</SelectItem>
                          <SelectItem value="Paperfly">Paperfly</SelectItem>
                          <SelectItem value="Sundarban Courier">Sundarban Courier</SelectItem>
                          <SelectItem value="eCourier">eCourier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="tracking-no" className="text-xs">Consignment / Tracking Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tracking-no"
                          placeholder="e.g. PTH-98402910"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveCourierTracking}
                          disabled={savingCourier}
                          className="h-9 px-3"
                        >
                          {savingCourier ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>

                  {linkedConsignment && (
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-purple-900 dark:text-purple-200">Linked Consignment Status: </span>
                        <span className="capitalize font-bold text-purple-700 dark:text-purple-300">{linkedConsignment.status}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Courier: {linkedConsignment.courier || courierInput || "Assigned"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Timeline Audit Component */}
              {selectedOrder && (
                <OrderTimelineAudit
                  orderId={selectedOrder.id}
                  orderNumber={selectedOrder.order_number}
                  currentStatus={selectedOrder.status}
                />
              )}

              {/* Customer Info */}
              {(() => {
                const cust = selectedOrder ? resolveCustomer(selectedOrder) : null;
                const activeCust = {
                  name: customerInfo?.full_name || cust?.name || "Customer",
                  email: customerInfo?.email || cust?.email || "No email",
                  phone: customerInfo?.phone || cust?.phone || null,
                  userId: selectedOrder?.user_id || cust?.user_id || "guest",
                  avatar: cust?.avatar_url || null,
                  role: cust?.role || "customer"
                };
                const searchTarget = activeCust.phone || activeCust.email || (activeCust.userId !== "guest" ? activeCust.userId : "") || activeCust.name;

                return (
                  <Card className="border-orange-500/20 bg-orange-50/5 dark:bg-orange-950/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-orange-500" />
                          <span>Customer & Account Profile</span>
                        </div>
                        <Badge variant="outline" className="text-xs uppercase bg-background">
                          {activeCust.role}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{activeCust.name}</span>
                          </div>
                          {activeCust.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{activeCust.email}</span>
                            </div>
                          )}
                          {activeCust.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{activeCust.phone}</span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDetailsOpen(false);
                            navigate(`/admin/users?search=${encodeURIComponent(searchTarget || "")}`);
                          }}
                          className="font-semibold text-xs gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300"
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>Open in Users Page</span>
                          <ExternalLink className="h-3 w-3 ml-0.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Addresses */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm whitespace-pre-line">
                    {formatAddress(selectedOrder?.shipping_address)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm whitespace-pre-line">
                    {formatAddress(selectedOrder?.billing_address || selectedOrder?.shipping_address)}
                  </CardContent>
                </Card>
              </div>

              {/* Multi-Supplier Fulfillment Groups Section */}
              {(() => {
                const fulfillmentGroups = SupplierManager.groupOrderItemsBySupplier(orderItems);
                if (fulfillmentGroups.length === 0) return null;

                return (
                  <Card className="border-orange-500/30 bg-orange-50/5 dark:bg-orange-950/10">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Layers className="h-4 w-4 text-orange-600" />
                          <span>Supplier Fulfillment Groups ({fulfillmentGroups.length})</span>
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          Auto-Routed
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        Order items grouped automatically by supplier for segregated fulfillment and dropshipping.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {fulfillmentGroups.map((grp, idx) => {
                        const isEcomseller = grp.supplierId === EcomsellerEngine.SUPPLIER_ID;
                        const isDropshipping = grp.supplierId === "dropshipping_bd" || grp.supplierId === "mohasagor";
                        
                        return (
                          <div 
                            key={grp.supplierId} 
                            className={`p-4 rounded-xl border space-y-3 ${
                              isEcomseller 
                                ? "bg-orange-500/10 border-orange-500/30 dark:bg-orange-950/20" 
                                : isDropshipping 
                                  ? "bg-blue-500/10 border-blue-500/30 dark:bg-blue-950/20" 
                                  : "bg-muted/40 border-border/60"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs font-bold ${
                                  isEcomseller 
                                    ? "bg-orange-600 text-white" 
                                    : isDropshipping 
                                      ? "bg-blue-600 text-white" 
                                      : "bg-muted text-foreground"
                                }`}>
                                  Group #{idx + 1}
                                </Badge>
                                <span className="font-bold text-sm text-foreground">{grp.supplierName}</span>
                                <span className="text-[11px] text-muted-foreground">({grp.items.length} item{grp.items.length > 1 ? "s" : ""})</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isEcomseller && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFulfillmentGroup(grp);
                                      setEcomsellerModalOpen(true);
                                    }}
                                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold h-7 gap-1.5"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Prepare Ecomseller Order
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Group Items */}
                            <div className="space-y-2">
                              {grp.items.map(it => (
                                <div key={it.id} className="flex items-center justify-between gap-3 text-xs bg-card/70 p-2 rounded-lg border">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded border overflow-hidden bg-muted flex-shrink-0">
                                      {it.product_image ? (
                                        <img src={it.product_image} alt={it.product_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package className="h-4 w-4 m-auto text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold truncate">{it.product_name}</p>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        {it.sku && <span className="font-mono bg-muted px-1 rounded">SKU: {it.sku}</span>}
                                        <span>Qty: {it.quantity}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="font-bold">৳{it.price * it.quantity}</div>
                                    {it.wholesale_price ? (
                                      <div className="text-[10px] text-muted-foreground">
                                        Cost: ৳{it.wholesale_price * it.quantity}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Economics summary for group */}
                            <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-muted-foreground">
                              <span>Total Items: <strong>{grp.totalQuantity}</strong></span>
                              <span>Retail Total: <strong>৳{grp.totalRetailAmount}</strong></span>
                              <span>Wholesale Cost: <strong>৳{grp.totalWholesaleCost}</strong></span>
                              <span className="text-emerald-600 font-bold">Est. Profit: +৳{grp.estimatedProfit}</span>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    All Order Items ({orderItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderItems.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No items found</p>
                    ) : (
                      orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.product_image ? (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground line-clamp-1">{item.product_name}</p>
                            {item.product_category && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {item.product_category}
                              </Badge>
                            )}
                            {item.product_id && (
                              <p className="text-[10px] text-muted-foreground font-mono mt-1 select-all">
                                ID: {item.product_id}
                              </p>
                            )}
                            {(() => {
                              const vText = item.variant_name || 
                                item.variant || 
                                (item.selected_variants ? Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(", ") : null) ||
                                (item.size ? `Size: ${item.size}${item.color ? ` | Color: ${item.color}` : ""}` : (item.color ? `Color: ${item.color}` : null));
                              if (!vText) return null;
                              return (
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30">
                                    {vText}
                                  </Badge>
                                </div>
                              );
                            })()}
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <span className="text-muted-foreground">৳{item.price.toFixed(0)}</span>
                              <span className="text-muted-foreground">×</span>
                              <span className="font-medium">{item.quantity}</span>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary">৳{item.total.toFixed(0)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Order Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{selectedOrder?.subtotal.toFixed(0)}</span>
                    </div>
                    {(selectedOrder?.shipping_cost ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>৳{selectedOrder?.shipping_cost?.toFixed(0)}</span>
                      </div>
                    )}
                    {(selectedOrder?.tax_amount ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>৳{selectedOrder?.tax_amount?.toFixed(0)}</span>
                      </div>
                    )}
                    {(selectedOrder?.discount_amount ?? 0) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount</span>
                        <span>-৳{selectedOrder?.discount_amount?.toFixed(0)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span className="text-primary">৳{selectedOrder?.total.toFixed(0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder?.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">{selectedOrder.notes}</CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Modals */}
      {selectedOrder && (
        <>
          <PrintableInvoiceModal
            open={invoiceModalOpen}
            onOpenChange={setInvoiceModalOpen}
            order={selectedOrder}
            orderItems={orderItems}
            customerInfo={customerInfo}
          />

          <PrintablePackingSlipModal
            open={packingSlipOpen}
            onOpenChange={setPackingSlipOpen}
            order={selectedOrder}
            orderItems={orderItems}
          />

          <PrintableShippingLabelModal
            open={shippingLabelOpen}
            onOpenChange={setShippingLabelOpen}
            order={selectedOrder}
            courierName={courierInput || selectedOrder.courier_name}
            trackingNumber={trackingInput || selectedOrder.tracking_number}
          />
        </>
      )}

      {/* Ecomseller BD Fulfillment Modal */}
      <Dialog open={ecomsellerModalOpen} onOpenChange={setEcomsellerModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600 text-white font-mono text-[10px]">
                Ecomseller BD Fulfillment
              </Badge>
              <span className="text-xs text-muted-foreground font-semibold">
                Order #{selectedOrder?.order_number}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold mt-1">
              Prepare Order for Ecomseller BD Manual Placement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ecomseller BD requires manual order placement on their portal. Copy the pre-formatted order details below to place the order quickly.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && selectedFulfillmentGroup && (
            <div className="space-y-4 text-xs">
              
              {/* Customer Delivery Details */}
              <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
                <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Customer Shipping Information</span>
                  <Badge variant="outline" className="text-[10px]">Recipient</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-foreground">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Recipient Name:</span>
                    <strong className="text-sm">{selectedOrder.customer_name || customerInfo?.full_name || "Customer"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Contact Phone:</span>
                    <strong className="text-sm font-mono text-orange-600">{selectedOrder.customer_phone || customerInfo?.phone || "N/A"}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Delivery Address:</span>
                    <p className="whitespace-pre-line font-medium">{formatAddress(selectedOrder.shipping_address)}</p>
                  </div>
                </div>
              </div>

              {/* Items to Order from Ecomseller */}
              <div className="space-y-2">
                <div className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
                  Products to Order ({selectedFulfillmentGroup.items.length} items)
                </div>
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Product</TableHead>
                        <TableHead>SKU / Code</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Wholesale Cost</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFulfillmentGroup.items.map(it => (
                        <TableRow key={it.id}>
                          <TableCell className="font-semibold">{it.product_name}</TableCell>
                          <TableCell className="font-mono text-orange-600 font-bold">{it.sku || "N/A"}</TableCell>
                          <TableCell className="text-center font-bold">{it.quantity}</TableCell>
                          <TableCell className="text-right font-mono">৳{it.wholesale_price || it.price}</TableCell>
                          <TableCell className="text-right font-mono font-bold">৳{(it.wholesale_price || it.price) * it.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Status Update */}
              <div className="p-3 rounded-xl border bg-card space-y-2">
                <Label className="text-xs font-semibold">Supplier Order Status</Label>
                <Select value={supplierStatus} onValueChange={setSupplierStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_supplier">Pending Supplier Placement</SelectItem>
                    <SelectItem value="order_placed">Supplier Order Placed (Ecomseller BD)</SelectItem>
                    <SelectItem value="processing">Supplier Processing</SelectItem>
                    <SelectItem value="shipped">Shipped by Supplier</SelectItem>
                    <SelectItem value="delivered">Delivered to Customer</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `ORDER #${selectedOrder.order_number}\n\nCustomer:\nName: ${selectedOrder.customer_name || customerInfo?.full_name || "Customer"}\nPhone: ${selectedOrder.customer_phone || customerInfo?.phone || ""}\nAddress: ${formatAddress(selectedOrder.shipping_address)}\n\nItems to order from Ecomseller BD:\n${selectedFulfillmentGroup.items.map(it => `- ${it.product_name} | Code: ${it.sku || "N/A"} | Qty: ${it.quantity} | Cost: ৳${it.wholesale_price || it.price}`).join("\n")}\n\nTotal Wholesale Cost: ৳${selectedFulfillmentGroup.totalWholesaleCost}`;
                    navigator.clipboard.writeText(text);
                    toast({
                      title: "Order Details Copied!",
                      description: "Ecomseller order sheet copied to clipboard."
                    });
                  }}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Copy Order Sheet
                </Button>

                <div className="flex items-center gap-2">
                  <a 
                    href={EcomsellerEngine.CATALOG_URL} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Open Ecomseller BD <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await supabase.from("orders").update({
                          supplier_status: supplierStatus,
                          supplier_name: "Ecomseller BD",
                          updated_at: new Date().toISOString()
                        }).eq("id", selectedOrder.id);

                        toast({
                          title: "Status Updated!",
                          description: `Ecomseller order status set to "${supplierStatus}".`
                        });
                        setEcomsellerModalOpen(false);
                        fetchOrders();
                      } catch (e: any) {
                        toast({ variant: "destructive", title: "Error", description: e.message });
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                  >
                    Save Supplier Status
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
