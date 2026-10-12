import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile, ResellerProduct, ResellerOrder } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerDashboard() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [orders, setOrders] = useState<ResellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    const loadData = async () => {
      try {
        const [profData, prodsData, ordersData] = await Promise.all([
          ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "New Partner"),
          ResellerService.getProducts(),
          ResellerService.getOrders(uid)
        ]);
        setProfile(profData);
        setProducts(prodsData.slice(0, 6));
        setOrders(ordersData.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, authProfile]);

  const handleCopyCaption = (product: ResellerProduct) => {
    navigator.clipboard.writeText(product.banglaDescription);
    setCopiedId(product.id);
    toast({
      title: "ক্যাপশন কপি হয়েছে",
      description: "ফেসবুক পেজে পোস্ট করার জন্য বাংলা ক্যাপশন কপি করা হয়েছে।",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <ResellerLayout>
      <SEOHead title="রিসেলার ড্যাশবোর্ড - Durtup.shop" />

      <div className="space-y-5">
        
        {/* 1. Smooth Executive Hero Banner (No Emojis, No Cluttered Icons) */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              রিসেলার ড্যাশবোর্ড
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {profile?.shopName || "আপনার রিসেলার শপ"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
              কোনো ইনভেস্টমেন্ট ছাড়াই পণ্য বিক্রি করুন এবং প্রতিটি অর্ডারে ২০০-২,০০০৳ পর্যন্ত নিশ্চিত প্রফিট সরাসরি ওয়ালেটে গ্রহণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <Button
              asChild
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs h-9.5 px-4 transition-colors"
            >
              <Link to="/reseller/orders/new">
                নতুন কাস্টমার অর্ডার
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-200 dark:border-slate-700 font-bold rounded-lg text-xs h-9.5 px-4 hover:bg-slate-50"
            >
              <Link to="/reseller/products">
                হোলসেল ক্যাটালগ
              </Link>
            </Button>
          </div>
        </div>

        {/* 2. Stat Metric Cards (Clean, minimalist, no icon squares) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Available Wallet Balance */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              উইথড্রল ব্যালেন্স
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              ৳{profile?.walletBalance?.toLocaleString("en-IN") || 0}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">টুলার জন্য প্রস্তুত</span>
              <Link to="/reseller/wallet" className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">
                উইথড্র ↗
              </Link>
            </div>
          </div>

          {/* Pending Profit Margin */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              পেন্ডিং প্রফিট
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              ৳{profile?.pendingBalance?.toLocaleString("en-IN") || 0}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">ডেলিভারির পর যোগ হবে</span>
            </div>
          </div>

          {/* Total Customer Orders */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              মোট অর্ডার
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {Math.max(profile?.totalOrders || 0, orders.length)}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                ডেলিভারি: {profile?.deliveredOrders || orders.filter((o) => o.orderStatus === "delivered").length}
              </span>
              <Link to="/reseller/orders" className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">
                লিস্ট ↗
              </Link>
            </div>
          </div>

          {/* Lifetime Earnings */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              লাইফটাইম আর্নিং
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              ৳{((profile?.walletBalance || 0) + (profile?.pendingBalance || 0))?.toLocaleString("en-IN") || 0}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">লেভেল: {profile?.level || "Bronze"} Partner</span>
            </div>
          </div>

        </div>

        {/* 3. Quick Action Cards (Clean minimal boxes without icon blocks) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">১. কাস্টমার অর্ডার দিন</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ফেসবুকে কাস্টমার পেলে তাদের নাম-ঠিকানা ও নির্ধারিত লাভে সরাসরি ড্রপশিপ অর্ডার প্লেস করুন।
              </p>
            </div>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg mt-3 w-full text-xs">
              <Link to="/reseller/orders/new">অর্ডার ফর্ম খুলুন</Link>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">২. হোলসেল ক্যাটালগ</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                গ্যাজেট ও ট্রেন্ডিং পণ্যগুলোর হোলসেল প্রাইস ও লাভ মার্জিন দেখে পণ্য নির্বাচন করুন।
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-slate-200 text-slate-700 font-semibold rounded-lg mt-3 w-full text-xs hover:bg-slate-50">
              <Link to="/reseller/products">ক্যাটালগ দেখুন</Link>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">৩. ছবি ও কনটেন্ট সাপোর্ট</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                পণ্য প্রমোশনের হাই-রেজুলেশন ছবি ও ভিডিও কনটেন্টের জন্য এডমিনের সাথে যোগাযোগ করুন।
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-slate-200 text-slate-700 font-semibold rounded-lg mt-3 w-full text-xs hover:bg-slate-50">
              <Link to="/reseller/marketing">কনটেন্ট ও সাপোর্ট</Link>
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">৪. API ও অটোমেশন</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                আপনার WooCommerce বা নিজস্ব ওয়েবসাইট ইন্টিগ্রেশন করে অটোমেটিক অর্ডার সেল করুন।
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-slate-200 text-slate-700 font-semibold rounded-lg mt-3 w-full text-xs hover:bg-slate-50">
              <Link to="/reseller/api">API সেটিংস</Link>
            </Button>
          </div>

        </div>

        {/* 4. Hot Reselling Products (Clean 2-column mobile grid, text-only buttons) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              সর্বোচ্চ প্রফিটের ট্রেন্ডিং প্রোডাক্টসমূহ
            </h2>
            <Link to="/reseller/products" className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline">
              সব প্রোডাক্ট দেখুন ↗
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {products.map((product) => (
              <div 
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      লাভ: ৳{product.suggestedProfit.toLocaleString("en-IN")}
                    </div>
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-md">
                      স্টক: {product.stock}+
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {product.banglaName || product.name}
                    </h3>

                    {/* Price comparison box */}
                    <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1 text-xs border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">পাইকারি:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">৳{product.wholesalePrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>MRP:</span>
                        <span className="line-through font-medium">৳{product.mrp.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span>সম্ভাব্য লাভ:</span>
                        <span>+৳{product.suggestedProfit.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 pt-0 space-y-1.5">
                  <Button
                    onClick={() => handleCopyCaption(product)}
                    variant="outline"
                    size="sm"
                    className="w-full text-[11px] font-semibold rounded-lg h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  >
                    {copiedId === product.id ? "কপি হয়েছে" : "ক্যাপশন কপি"}
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg h-8 text-xs transition-colors"
                  >
                    <Link to={`/reseller/orders/new?product=${product.id}`}>
                      অর্ডার করুন
                    </Link>
                  </Button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* 5. Recent Customer Orders Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              আমার সাম্প্রতিক কাস্টমার অর্ডারসমূহ
            </h2>
            <Link to="/reseller/orders" className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline">
              সকল অর্ডার দেখুন ↗
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">এখনো কোনো কাস্টমার অর্ডার নেই</p>
              <p className="text-xs text-slate-500 mt-1">ক্যাটালগ থেকে প্রোডাক্ট শেয়ার করে প্রথম অর্ডার তৈরি করুন।</p>
              <Button asChild size="sm" className="mt-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold">
                <Link to="/reseller/products">হোলসেল ক্যাটালগ দেখুন</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">#{order.orderNumber}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{order.productName} ({order.quantity}টি)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 block">+৳{order.profit?.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </ResellerLayout>
  );
}
