import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerOrder } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ResellerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<ResellerOrder | null>(null);

  const fetchOrderList = () => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    ResellerService.getOrders(uid)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrderList();

    // Listen to real-time order creation events from any screen (API or New Order form)
    const handleOrderCreated = (e: any) => {
      if (e.detail) {
        setOrders((prev) => [e.detail, ...prev.filter((o) => o.id !== e.detail.id)]);
      } else {
        fetchOrderList();
      }
    };

    window.addEventListener("reseller_order_created", handleOrderCreated);
    return () => {
      window.removeEventListener("reseller_order_created", handleOrderCreated);
    };
  }, [user]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      processing: orders.filter((o) => o.orderStatus === "processing").length,
      shipped: orders.filter((o) => o.orderStatus === "shipped").length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
      returned: orders.filter((o) => o.orderStatus === "returned").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const copyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "ট্র্যাকিং কোড কপি হয়েছে", description: code });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            ডেলিভারি সম্পন্ন
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            কুরিয়ারে পথে আছে
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            প্যাকেজিং হচ্ছে
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            রিটার্ন
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <ResellerLayout>
      <SEOHead title="আমার কাস্টমার অর্ডারসমূহ - Durtup Reseller" />

      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              আমার কাস্টমার অর্ডারসমূহ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              আপনার সাবমিট করা কাস্টমার পার্সেল, লাইভ কুরিয়ার ট্র্যাকিং ও প্রফিট রিপোর্ট।
            </p>
          </div>

          <Button asChild className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold rounded-xl text-xs h-10 px-4">
            <Link to="/reseller/orders/new">
              নতুন কাস্টমার অর্ডার দিন
            </Link>
          </Button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          
          {/* Search bar */}
          <div>
            <Input
              placeholder="অর্ডার আইডি, কাস্টমার নাম, মোবাইল নম্বর বা ট্র্যাকিং কোড দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-10 bg-slate-50 dark:bg-slate-800/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: "all", label: `সকল অর্ডার (${counts.all})` },
              { id: "processing", label: `প্যাকেজিং হচ্ছে (${counts.processing})` },
              { id: "shipped", label: `কুরিয়ারে পথে আছে (${counts.shipped})` },
              { id: "delivered", label: `ডেলিভারি সম্পন্ন (${counts.delivered})` },
              { id: "returned", label: `রিটার্ন (${counts.returned})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Orders Container */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              কোনো কাস্টমার অর্ডার পাওয়া যায়নি
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ক্যাটালগ থেকে পণ্য সিলেক্ট করে সরাসরি নতুন ড্রপশিপ অর্ডার প্লেস করুন।
            </p>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs mt-2">
              <Link to="/reseller/orders/new">নতুন অর্ডার করুন</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Desktop Table View (hidden on small mobile) */}
            <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold">
                      <th className="p-3.5">অর্ডার নম্বর ও তারিখ</th>
                      <th className="p-3.5">কাস্টমার তথ্য</th>
                      <th className="p-3.5">পণ্য</th>
                      <th className="p-3.5">কাস্টমার বিল</th>
                      <th className="p-3.5">আপনার প্রফিট</th>
                      <th className="p-3.5">কুরিয়ার ও ট্র্যাকিং</th>
                      <th className="p-3.5 text-right">রসিদ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        
                        {/* Order ID & Date */}
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">{order.orderNumber}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                        </td>

                        {/* Customer Info */}
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{order.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{order.customerPhone}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{order.customerCity}</p>
                        </td>

                        {/* Product */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={order.productImage}
                              alt={order.productName}
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[160px]">
                                {order.productName}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">পরিমাণ: {order.quantity} টি</span>
                            </div>
                          </div>
                        </td>

                        {/* Total Customer Bill */}
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900 dark:text-white">৳{order.totalCustomerBill}</p>
                          <span className="text-[10px] text-slate-400">ক্যাশ অন ডেলিভারি</span>
                        </td>

                        {/* Profit Margin */}
                        <td className="p-3.5">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">+৳{order.netProfit}</p>
                          <span className={`inline-block text-[9px] font-medium px-1.5 py-0.2 rounded mt-0.5 ${
                            order.profitStatus === "available"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                          }`}>
                            {order.profitStatus === "available" ? "ওয়ালেটে যোগ হয়েছে" : "পেন্ডিং (ডেলিভারি পর)"}
                          </span>
                        </td>

                        {/* Courier Tracking & Status */}
                        <td className="p-3.5">
                          <div>
                            {getStatusBadge(order.orderStatus)}
                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                              <span className="font-mono text-slate-500">{order.trackingCode}</span>
                              <button
                                onClick={() => copyTracking(order.trackingCode)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] underline"
                              >
                                কপি
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Action View */}
                        <td className="p-3.5 text-right">
                          <Button
                            onClick={() => setSelectedOrder(order)}
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-7 px-2.5 border-slate-200 dark:border-slate-700"
                          >
                            রসিদ
                          </Button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (optimized for phones) */}
            <div className="block sm:hidden space-y-3">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {getStatusBadge(order.orderStatus)}
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-slate-900 dark:text-white truncate">{order.productName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{order.customerName} • {order.customerPhone}</p>
                      <p className="text-[10px] text-slate-400 truncate">{order.customerCity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">কাস্টমার বিল:</span>
                      <span className="font-bold text-slate-900 dark:text-white">৳{order.totalCustomerBill}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">আপনার প্রফিট:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+৳{order.netProfit}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-mono text-slate-500 text-[10px]">{order.trackingCode}</span>
                      <button
                        onClick={() => copyTracking(order.trackingCode)}
                        className="text-slate-400 hover:text-slate-600 text-[10px] underline"
                      >
                        কপি
                      </button>
                    </div>

                    <Button
                      onClick={() => setSelectedOrder(order)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs h-7 px-3 border-slate-200 dark:border-slate-700"
                    >
                      রসিদ দেখুন
                    </Button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* Order Invoice / Receipt Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span>কাস্টমার মেমো ও চালান</span>
              {selectedOrder && (
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {selectedOrder.orderNumber}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-xs pt-1">
              
              {/* Reseller Branding Header */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">প্রেরক শপ:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.resellerShopName}</p>
                  {selectedOrder.resellerPhone && <p className="text-slate-500 text-[11px]">{selectedOrder.resellerPhone}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">কুরিয়ার ট্র্যাকিং:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.courierName}</p>
                  <p className="font-mono text-[10px] text-slate-500">{selectedOrder.trackingCode}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">প্রাপক / কাস্টমার:</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customerName}</p>
                <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">ফোন: {selectedOrder.customerPhone} {selectedOrder.customerAltPhone ? `| ${selectedOrder.customerAltPhone}` : ""}</p>
                <p className="text-slate-600 dark:text-slate-400">ঠিকানা: {selectedOrder.customerAddress}, {selectedOrder.customerCity}</p>
              </div>

              {/* Product details */}
              <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <img src={selectedOrder.productImage} alt={selectedOrder.productName} className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedOrder.productName}</p>
                    <p className="text-slate-500 text-[11px]">পরিমাণ: {selectedOrder.quantity} টি</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>পণ্যের মূল্য:</span>
                    <span>৳{selectedOrder.customerSellingPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ:</span>
                    <span>৳{selectedOrder.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span>মোট কাস্টমার বিল (COD):</span>
                    <span>৳{selectedOrder.totalCustomerBill}</span>
                  </div>
                </div>
              </div>

              {/* Profit banner */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium block">আপনার নির্ধারিত প্রফিট:</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+৳{selectedOrder.netProfit}</span>
                </div>
                <div>
                  {selectedOrder.profitStatus === "available" ? (
                    <span className="text-[11px] font-semibold bg-emerald-600 text-white px-2.5 py-1 rounded-md">
                      ওয়ালেটে জমা হয়েছে
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold bg-amber-500 text-white px-2.5 py-1 rounded-md">
                      ডেলিভারি পেন্ডিং
                    </span>
                  )}
                </div>
              </div>

              {/* Print button */}
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs h-8 px-4"
                >
                  প্রিন্ট / সেভ করুন
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </ResellerLayout>
  );
}
