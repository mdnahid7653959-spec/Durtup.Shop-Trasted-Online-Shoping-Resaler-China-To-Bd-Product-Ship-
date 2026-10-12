import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ShoppingCart, 
  X, 
  ArrowRight, 
  Phone, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playNewOrderSound, unlockAudio } from "@/hooks/useAdminOrderNotifications";

export interface MessengerOrderPayload {
  id: string;
  order_number?: string;
  orderNumber?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  product_name?: string;
  variant_name?: string | null;
  product_image?: string;
  image_url?: string;
  total_amount?: number;
  total?: number;
  payment_method?: string;
  total_items?: number;
  created_at?: string;
}

export const AdminMessengerOrderBanner: React.FC = () => {
  const [currentOrder, setCurrentOrder] = useState<MessengerOrderPayload | null>(null);
  const [orderQueue, setOrderQueue] = useState<MessengerOrderPayload[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff");

  // Listen to order alert custom events and BroadcastChannel only if on admin/staff route
  useEffect(() => {
    if (!isAdminRoute) return;

    const handleNewOrder = (order: MessengerOrderPayload) => {
      if (!order || !order.id) return;
      if (!window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/staff")) return;

      // Play sound immediately unless muted
      if (!isMuted) {
        unlockAudio();
        playNewOrderSound();
      }

      setOrderQueue((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [...prev, order];
      });
    };

    const customEventListener = (e: any) => {
      if (e.detail) {
        handleNewOrder(e.detail);
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("durtup_admin_order_notifications");
        bc.onmessage = (evt) => {
          if (evt.data?.type === "new_order" && evt.data?.order) {
            handleNewOrder(evt.data.order);
          }
        };
      } catch {}
    }

    window.addEventListener("durtup_new_order", customEventListener as EventListener);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("durtup_new_order", customEventListener as EventListener);
    };
  }, [isMuted]);

  // Process order queue
  useEffect(() => {
    if (!currentOrder && orderQueue.length > 0) {
      const next = orderQueue[0];
      setCurrentOrder(next);
      setOrderQueue((prev) => prev.slice(1));
      setIsVisible(true);

      // Auto dismiss after 14 seconds if not interacted with
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, 14000);
    }
  }, [currentOrder, orderQueue]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => {
      setCurrentOrder(null);
    }, 300);
  };

  const handleOpenOrder = () => {
    if (!currentOrder) return;
    const orderId = currentOrder.id;
    handleDismiss();
    navigate(`/admin/orders`);
  };

  const handleCallCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentOrder?.customer_phone) {
      window.location.href = `tel:${currentOrder.customer_phone}`;
    }
  };

  if (!isAdminRoute || !currentOrder) return null;

  const orderNum = currentOrder.order_number || currentOrder.orderNumber || currentOrder.id.slice(0, 8);
  const customerName = currentOrder.customer_name || "New Customer";
  const productName = currentOrder.product_name || "Product Item";
  const amount = Number(currentOrder.total_amount || currentOrder.total || 0);
  const productImage = currentOrder.product_image || currentOrder.image_url || "/durtup-logo.png";
  const paymentMethod = (currentOrder.payment_method || "COD").toUpperCase();

  return (
    <div className={`fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[99999] w-[94vw] max-w-lg transition-all duration-500 transform ${
      isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95 pointer-events-none"
    }`}>
      {/* Messenger Heads-Up Floating Card */}
      <div 
        onClick={handleOpenOrder}
        className="relative bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-orange-500/80 p-3.5 sm:p-4 cursor-pointer overflow-hidden group hover:border-orange-400 transition-all duration-300"
      >
        {/* Animated Glow Border Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 animate-pulse" />

        {/* Top Header Tag */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
              ⚡ LIVE NEW ORDER ALERT
            </span>
            <Badge variant="outline" className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px] h-5 font-mono font-bold px-1.5">
              #{orderNum}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (isMuted) playNewOrderSound();
              }}
              title={isMuted ? "Unmute Alerts" : "Mute Alerts"}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />}
            </button>
            <button
              onClick={handleDismiss}
              title="Dismiss Banner"
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex items-center gap-3">
          {/* Product Thumbnail */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-inner">
            <img
              src={productImage}
              alt="Ordered product"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] font-bold text-center py-0.5 text-white">
              {paymentMethod}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <h4 className="text-sm sm:text-base font-bold text-white truncate">
                {customerName}
              </h4>
              <span className="text-sm sm:text-base font-black text-amber-400 shrink-0">
                ৳{amount.toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
              📦 {productName} {currentOrder.variant_name ? `(${currentOrder.variant_name})` : ""}
            </p>

            {currentOrder.customer_phone && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                📞 {currentOrder.customer_phone}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
          {currentOrder.customer_phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCallCustomer}
              className="h-8 px-3 text-xs font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300 shrink-0"
            >
              <Phone className="h-3.5 w-3.5 mr-1" /> Call
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleOpenOrder}
            className="flex-1 h-8 text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-600/30"
          >
            <span>Open Order Details</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>

          {orderQueue.length > 0 && (
            <Badge className="bg-rose-500 text-white text-[10px] font-bold h-7 px-2">
              +{orderQueue.length} more
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessengerOrderBanner;
