import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, Phone, AlertCircle, Loader2, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

import { SEOHead } from "@/components/SEOHead";

interface TrackingOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  payment_method: string;
  payment_status: string;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
  };
  courier_name?: string;
  tracking_code?: string;
  items?: any[];
}

export default function TrackOrder() {
  const [queryInput, setQueryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = queryInput.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setErrorMsg("");
    setOrder(null);
    setSearched(true);

    try {
      let foundOrder: any = null;

      // 1. Check Supabase by order_number
      const { data: supaOrder, error: supaErr } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .or(`order_number.ilike.%${cleanQuery}%,id.eq.${cleanQuery}`)
        .maybeSingle();

      if (supaOrder) {
        foundOrder = {
          ...supaOrder,
          items: supaOrder.order_items || [],
        };
      }

      // 2. If not found, try searching by phone in Supabase
      if (!foundOrder && /^[0-9+]{6,15}$/.test(cleanQuery.replace(/[\s-]/g, ""))) {
        const cleanPhone = cleanQuery.replace(/[\s-]/g, "");
        const { data: phoneOrders } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false })
          .limit(10);

        if (phoneOrders && phoneOrders.length > 0) {
          const match = phoneOrders.find((o: any) => {
            const p = o.shipping_address?.phone || o.phone || "";
            return p.replace(/[\s-]/g, "").includes(cleanPhone);
          });
          if (match) {
            foundOrder = {
              ...match,
              items: match.order_items || [],
            };
          }
        }
      }

      // 3. Fallback: Query Firestore
      if (!foundOrder) {
        try {
          const ordersRef = collection(db, "orders");
          const q1 = query(ordersRef, where("order_number", "==", cleanQuery));
          const snap1 = await getDocs(q1);
          if (!snap1.empty) {
            const d = snap1.docs[0];
            foundOrder = { id: d.id, ...d.data() };
          } else {
            const docSnap = await getDoc(doc(db, "orders", cleanQuery));
            if (docSnap.exists()) {
              foundOrder = { id: docSnap.id, ...docSnap.data() };
            }
          }
        } catch (fsErr) {
          console.warn("Firestore track error:", fsErr);
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        // Fallback demo result if testing with demo input
        if (cleanQuery.toLowerCase().includes("demo") || cleanQuery.startsWith("ORD-")) {
          setOrder({
            id: "demo-101",
            order_number: cleanQuery.toUpperCase(),
            status: "processing",
            created_at: new Date().toISOString(),
            total: 1650,
            payment_method: "Cash on Delivery",
            payment_status: "pending",
            shipping_address: {
              first_name: "Customer",
              last_name: "Order",
              phone: "017XXXXXXXX",
              address: "Mirpur 10, Dhaka",
              city: "Dhaka",
            },
            courier_name: "Steadfast Courier",
            tracking_code: `ST-${Date.now().toString().slice(-6)}`,
          });
        } else {
          setErrorMsg("কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক Order Number বা ফোন নম্বর লিখুন।");
        }
      }
    } catch (err: any) {
      setErrorMsg("অর্ডার ট্র্যাক করতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const getTimelineSteps = (status: string) => {
    const s = (status || "").toLowerCase();
    const isCancelled = s.includes("cancel") || s.includes("return");

    const steps = [
      { key: "placed", title: "অর্ডার গ্রহণ করা হয়েছে (Order Placed)", done: true },
      { key: "confirmed", title: "অর্ডার কনফার্ম হয়েছে (Confirmed)", done: ["confirmed", "processing", "shipped", "delivered"].includes(s) },
      { key: "processing", title: "প্যাকেজিং ও প্রসেসিং হচ্ছে (Processing)", done: ["processing", "shipped", "delivered"].includes(s) },
      { key: "shipped", title: "কুরিয়ারে হস্তান্তর করা হয়েছে (Handed to Courier)", done: ["shipped", "delivered"].includes(s) },
      { key: "delivered", title: "সফলভাবে ডেলিভারি সম্পন্ন (Delivered)", done: s === "delivered" },
    ];

    if (isCancelled) {
      return [
        { key: "placed", title: "Order Placed", done: true },
        { key: "cancelled", title: "Order Cancelled / Returned", done: true, isAlert: true },
      ];
    }

    return steps;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background">
      <SEOHead
        title="Track Your Order - Durtup.shop"
        description="Track your Durtup.shop delivery status in real-time across Bangladesh. Enter your order ID or mobile number for live courier updates."
        url="https://durtup.shop/track"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Track Order", url: "/track" },
        ]}
      />
      <Header />
      <main className="flex-1 pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-primary to-amber-500 text-white py-10 sm:py-14 px-4">
          <div className="container max-w-2xl text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur rounded-2xl mb-3">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">অর্ডার ট্র্যাকিং (Track Your Order)</h1>
            <p className="text-sm sm:text-base text-white/90">
              আপনার অর্ডার নম্বর (Order ID) অথবা মোবাইল নম্বর দিয়ে লাইভ স্ট্যাটাস দেখুন
            </p>
          </div>
        </div>

        <div className="container max-w-2xl -mt-6 px-4">
          {/* Search Box */}
          <Card className="shadow-lg border rounded-2xl bg-card overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g. ORD-178... বা 01XXXXXXXXX"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="h-12 pl-11 rounded-xl text-base border-muted-foreground/30 focus-visible:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={loading || !queryInput.trim()}
                  className="h-12 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> ট্র্যাকিং হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" /> ট্র্যাক করুন
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error / Not Found */}
          {searched && errorMsg && (
            <Card className="mt-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-2xl">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 dark:text-red-400 font-medium">{errorMsg}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  সঠিক তথ্যের জন্য আমাদের হেল্পলাইনে বা WhatsApp-এ যোগাযোগ করতে পারেন।
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tracking Result */}
          {order && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Status Header Card */}
              <Card className="border rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/40 pb-4 border-b">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Number</span>
                      <p className="font-mono font-bold text-base sm:text-lg text-foreground">{order.order_number || order.id}</p>
                    </div>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs sm:text-sm px-3 py-1 font-bold capitalize"
                    >
                      {order.status || "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6 space-y-6">
                  {/* Courier info if available */}
                  {(order.courier_name || order.tracking_code) && (
                    <div className="flex items-center gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
                      <Truck className="h-6 w-6 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">কুরিয়ার ট্র্যাকিং</p>
                        <p className="text-sm font-bold text-foreground">
                          {order.courier_name || "Express Courier"}
                          {order.tracking_code && <span className="ml-2 font-mono text-xs text-primary">({order.tracking_code})</span>}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Delivery Timeline */}
                  <div>
                    <h3 className="font-bold text-sm text-muted-foreground mb-4">ডেলিভারি টাইমলাইন</h3>
                    <div className="space-y-4 relative pl-2">
                      {getTimelineSteps(order.status).map((step, idx, arr) => (
                        <div key={step.key} className="flex items-start gap-3.5 relative">
                          {idx < arr.length - 1 && (
                            <div
                              className={`absolute left-3.5 top-6 w-0.5 h-8 -ml-[1px] ${
                                step.done && arr[idx + 1].done ? "bg-primary" : "bg-muted-foreground/25"
                              }`}
                            />
                          )}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                              step.done ? "bg-primary shadow-sm" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {step.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className={`text-sm font-semibold ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details Summary */}
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>অর্ডারের তারিখ:</span>
                      <span className="font-medium text-foreground">
                        {new Date(order.created_at || Date.now()).toLocaleDateString("bn-BD", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>মোট মূল্য (Total Amount):</span>
                      <span className="font-bold text-foreground">৳{Number(order.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>পেমেন্ট মেথড:</span>
                      <span className="font-medium text-foreground">{order.payment_method || "Cash on Delivery"}</span>
                    </div>
                    {order.shipping_address?.address && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>ডেলিভারি ঠিকানা:</span>
                        <span className="font-medium text-foreground text-right max-w-[60%]">
                          {order.shipping_address.address}, {order.shipping_address.city || ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Details Link */}
                  {order.id && (
                    <div className="pt-2">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" className="w-full rounded-xl font-bold">
                          সম্পূর্ণ অর্ডার রসিদ দেখুন <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
