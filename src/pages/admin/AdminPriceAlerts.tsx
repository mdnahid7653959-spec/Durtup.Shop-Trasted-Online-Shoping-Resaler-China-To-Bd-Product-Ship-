import React, { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  TrendingDown,
  Bell,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Trash2,
  Sparkles,
  DollarSign,
  Users,
  Layers,
  History,
  Mail,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  getPriceDropAnalytics,
  getLocalPriceAlertSubscriptions,
  saveLocalPriceAlertSubscriptions,
  triggerPriceDropNotifications,
  cancelPriceAlert,
  deletePriceAlert,
  getPriceAlertSettings,
  savePriceAlertSettings,
  PRICE_DROP_EVENT,
  type PriceAlertSubscription,
  type PriceAlertAnalytics,
  type PriceAlertSettings,
  type PriceHistoryRecord,
  type PriceAlertNotificationLog,
} from "@/services/priceDropService";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AdminPriceAlerts() {
  const [analytics, setAnalytics] = useState<PriceAlertAnalytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<PriceAlertSubscription[]>([]);
  const [settings, setSettings] = useState<PriceAlertSettings>(getPriceAlertSettings);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<"subscriptions" | "demand" | "history" | "logs" | "settings">("subscriptions");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "triggered" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Simulation Modal state
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simProduct, setSimProduct] = useState<{ id: string; name: string; currentPrice: number; variantLabel?: string } | null>(null);
  const [simNewPrice, setSimNewPrice] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getPriceDropAnalytics();
      setAnalytics(data);
      setSubscriptions(getLocalPriceAlertSubscriptions());
    } catch (err) {
      console.warn("Failed to load price drop analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener(PRICE_DROP_EVENT, refreshData);
    return () => window.removeEventListener(PRICE_DROP_EVENT, refreshData);
  }, []);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.productName.toLowerCase().includes(q) ||
        s.customerEmail.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.variantLabel && s.variantLabel.toLowerCase().includes(q))
      );
    });
  }, [subscriptions, statusFilter, searchQuery]);

  // Open simulation modal for a specific product
  const handleOpenSimulate = (productId: string, productName: string, currentPrice: number, variantLabel?: string) => {
    setSimProduct({ id: productId, name: productName, currentPrice, variantLabel });
    setSimNewPrice(Math.round(currentPrice * 0.9)); // default 10% lower
    setSimModalOpen(true);
  };

  // Execute price drop simulation
  const handleExecutePriceDrop = async () => {
    if (!simProduct) return;
    if (simNewPrice >= simProduct.currentPrice) {
      toast.error(`নতুন মূল্য অবশ্যই বর্তমান মূল্য (৳${simProduct.currentPrice.toLocaleString()}) এর চেয়ে কম হতে হবে`);
      return;
    }

    setIsSimulating(true);
    try {
      const result = await triggerPriceDropNotifications(
        simProduct.id,
        simNewPrice,
        simProduct.currentPrice,
        simProduct.name,
        simProduct.variantLabel,
        "manual_simulation"
      );

      if (result.triggeredCount > 0) {
        toast.success(
          `সফল হয়েছে! ${result.triggeredCount} জন ক্রেতার টার্গেট মূল্য পূরণ হওয়ায় তাৎক্ষণিক নোটিফিকেশন পাঠানো হয়েছে।`
        );
      } else {
        toast.info(
          `মূল্য ৳${simNewPrice.toLocaleString()}-এ নামানো রেকর্ড করা হয়েছে। কোনো ক্রেতার টার্গেট মূল্যের সমান বা নিচে না থাকায় নোটিফিকেশন ট্রিপ করেনি।`
        );
      }
      setSimModalOpen(false);
      refreshData();
    } catch {
      toast.error("নোটিফিকেশন ট্রিগার করতে সমস্যা হয়েছে।");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCancelSub = async (subId: string) => {
    try {
      await cancelPriceAlert(subId);
      toast.success("অ্যালার্ট বাতিল করা হয়েছে");
      refreshData();
    } catch {
      toast.error("বাতিল করা যায়নি");
    }
  };

  const handleDeleteSub = async (subId: string) => {
    try {
      await deletePriceAlert(subId);
      toast.success("অ্যালার্ট সম্পূর্ণ মুছে ফেলা হয়েছে");
      refreshData();
    } catch {
      toast.error("মুছতে সমস্যা হয়েছে");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    savePriceAlertSettings(settings);
    toast.success("সেটিংস সফলভাবে আপডেট করা হয়েছে");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <span>Price Drop Alert Intelligence</span>
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60">
                    Automated
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ক্রেতাদের টার্গেট মূল্যের উপর ভিত্তি করে স্বয়ংক্রিয় নোটিফিকেশন ও স্মার্ট প্রাইসিং অ্যানালিটিক্স
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3.5 py-2 bg-card hover:bg-muted border border-border/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className="px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>কনফিগারেশন</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">মোট অ্যালার্ট রিকোয়েস্ট</span>
              <TrendingDown className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-foreground">
              {analytics?.totalAlerts || 0}
            </div>
            <p className="text-[11px] text-muted-foreground">লাইফটাইম সাবস্ক্রিপশন সংখ্যা</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">অ্যাক্টিভ ক্রেতা (Waiting)</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {analytics?.activeAlerts || 0}
            </div>
            <p className="text-[11px] text-muted-foreground">দাম কমার অপেক্ষায় থাকা গ্রাহক</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">সফল নোটিফিকেশন (Triggered)</span>
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {analytics?.triggeredAlerts || 0}
            </div>
            <p className="text-[11px] text-muted-foreground">টার্গেট পূরণ হওয়া অ্যালার্ট</p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">সম্ভাব্য চাহিদা রেভিনিউ</span>
              <DollarSign className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              ৳{(analytics?.totalPotentialRevenue || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">অ্যাক্টিভ গ্রাহকদের টার্গেট ভ্যালু</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === "subscriptions"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>অ্যালার্ট সাবস্ক্রিপশনসমূহ ({subscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("demand")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === "demand"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>প্রাইস ড্রপ ডিমান্ড অ্যানালাইটিক্স</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>মূল্য পরিবর্তনের ইতিহাস ({analytics?.priceHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === "logs"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>নোটিফিকেশন লগ ({analytics?.recentLogs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>সেটিংস</span>
          </button>
        </div>

        {/* TAB 1: Subscriptions Table */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    statusFilter === "all"
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  সব ({subscriptions.length})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    statusFilter === "active"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  অ্যাক্টিভ ({subscriptions.filter((s) => s.status === "active").length})
                </button>
                <button
                  onClick={() => setStatusFilter("triggered")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    statusFilter === "triggered"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ট্রিগার হয়েছে ({subscriptions.filter((s) => s.status === "triggered").length})
                </button>
                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    statusFilter === "cancelled"
                      ? "bg-slate-600 text-white shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  বাতিল ({subscriptions.filter((s) => s.status === "cancelled").length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="গ্রাহকের নাম, ইমেইল বা পণ্য খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border font-bold">
                    <tr>
                      <th className="p-3.5">পণ্য (Product)</th>
                      <th className="p-3.5">গ্রাহক (Customer)</th>
                      <th className="p-3.5">টার্গেট মূল্য (Target Price)</th>
                      <th className="p-3.5">বর্তমান মূল্য (Current)</th>
                      <th className="p-3.5">চ্যানেল</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground">
                          কোনো প্রাইস ড্রপ অ্যালার্ট পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map((sub) => {
                        const savings = Math.max(0, sub.currentPrice - sub.targetPrice);
                        const discountPercent =
                          sub.currentPrice > 0 ? Math.round((savings / sub.currentPrice) * 100) : 0;

                        return (
                          <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-lg bg-muted p-1 shrink-0 overflow-hidden border">
                                  <img
                                    src={sub.productImage || "/durtup-logo.png"}
                                    alt={sub.productName}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 max-w-[200px]">
                                  <Link
                                    to={`/product/${sub.productSlug || sub.productId}`}
                                    className="font-bold text-foreground hover:text-primary transition line-clamp-1"
                                  >
                                    {sub.productName}
                                  </Link>
                                  {sub.variantLabel && (
                                    <span className="text-[10px] text-orange-600 font-semibold block">
                                      {sub.variantLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-foreground">{sub.customerName}</div>
                              <div className="text-[11px] text-muted-foreground">{sub.customerEmail}</div>
                              {sub.customerPhone && (
                                <div className="text-[10px] text-muted-foreground">{sub.customerPhone}</div>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span className="font-black text-orange-600 text-sm">
                                ৳{sub.targetPrice.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                                -{discountPercent}% (৳{savings.toLocaleString()})
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-foreground">
                              ৳{sub.currentPrice.toLocaleString()}
                            </td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted px-2 py-0.5 rounded-md">
                                {sub.channel === "push" ? (
                                  <Smartphone className="w-3 h-3 text-blue-500" />
                                ) : sub.channel === "email" ? (
                                  <Mail className="w-3 h-3 text-amber-500" />
                                ) : (
                                  <>
                                    <Smartphone className="w-3 h-3 text-blue-500" />
                                    <Mail className="w-3 h-3 text-amber-500" />
                                  </>
                                )}
                                <span className="capitalize">{sub.channel}</span>
                              </span>
                            </td>
                            <td className="p-3.5">
                              {sub.status === "active" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <Clock className="w-3 h-3" />
                                  অ্যাক্টিভ
                                </span>
                              ) : sub.status === "triggered" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  ট্রিগার হয়েছে
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200">
                                  <XCircle className="w-3 h-3" />
                                  বাতিল
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-[11px] text-muted-foreground">
                              {new Date(sub.createdAt).toLocaleDateString("bn-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {sub.status === "active" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleOpenSimulate(
                                          sub.productId,
                                          sub.productName,
                                          sub.currentPrice,
                                          sub.variantLabel
                                        )
                                      }
                                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition"
                                      title="প্রাইস ড্রপ টেস্ট ট্রিগার করুন"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleCancelSub(sub.id)}
                                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition"
                                      title="অ্যালার্ট বাতিল করুন"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteSub(sub.id)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Demand Intelligence */}
        {activeTab === "demand" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-blue-950 dark:text-blue-100">
                    Smart Demand Intelligence (স্মার্ট প্রাইসিং অন্তর্দৃষ্টি)
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed mt-0.5">
                    নিচের পণ্যগুলোর জন্য সবচেয়ে বেশি গ্রাহক দাম কমার অপেক্ষায় রয়েছেন। পণ্যের মূল্য এই টার্গেট প্রাইসে নামালে সাথে সাথে গ্রাহকদের কাছে স্বয়ংক্রিয় নোটিফিকেশন পৌঁছাবে এবং তাৎক্ষণিক সেলস বুস্ট হবে।
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics?.topDemandedProducts?.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground border rounded-2xl bg-card">
                  কোনো ডিমান্ড ডেটা নেই। গ্রাহকরা অ্যালার্ট সেট করলে এখানে স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হবে।
                </div>
              ) : (
                analytics?.topDemandedProducts.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="w-14 h-14 rounded-xl bg-muted p-1 shrink-0 overflow-hidden border">
                        <img
                          src={item.productImage || "/durtup-logo.png"}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/product/${item.productSlug || item.productId}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-muted-foreground">
                            বর্তমান মূল্য: ৳{item.currentPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">অপেক্ষমাণ গ্রাহক</span>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                          {item.alertCount} জন
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">গড় টার্গেট মূল্য</span>
                        <span className="text-sm font-black text-orange-600">
                          ৳{item.avgTargetPrice.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">প্রস্তাবিত ছাড়</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          -{item.potentialDiscount}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleOpenSimulate(item.productId, item.productName, item.currentPrice)
                      }
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>মূল্য কমিয়ে অ্যালার্ট নোটিফিকেশন পাঠান</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Price History */}
        {activeTab === "history" && (
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">মূল্য পরিবর্তনের ইতিহাস (Price History)</h3>
                <p className="text-xs text-muted-foreground">পণ্যভিত্তিক পূর্ববর্তী মূল্য কমানোর সমস্ত লগ ও ছাড়ের হিসাব</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border font-bold">
                  <tr>
                    <th className="p-3.5">পণ্য (Product)</th>
                    <th className="p-3.5">পূর্বমূল্য (Old)</th>
                    <th className="p-3.5">নতুন মূল্য (New)</th>
                    <th className="p-3.5">ছাড় (Discount)</th>
                    <th className="p-3.5">কারণ (Reason)</th>
                    <th className="p-3.5">তারিখ ও সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(!analytics?.priceHistory || analytics.priceHistory.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        কোনো প্রাইস হিস্টোরি রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    analytics.priceHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{item.productName}</td>
                        <td className="p-3.5 text-muted-foreground line-through font-semibold">
                          ৳{item.oldPrice.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-black text-orange-600 text-sm">
                          ৳{item.newPrice.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                            -৳{item.discountAmount.toLocaleString()} (-{item.discountPercent}%)
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {item.reason}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {new Date(item.changedAt).toLocaleString("bn-BD")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Notification Logs */}
        {activeTab === "logs" && (
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">নোটিফিকেশন প্রেরণ লগ (Dispatch Logs)</h3>
                <p className="text-xs text-muted-foreground">গ্রাহকদের কাছে পাঠানো প্রতিটি পুশ ও ইমেইল অ্যালার্টের রেকর্ড</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border font-bold">
                  <tr>
                    <th className="p-3.5">পণ্য</th>
                    <th className="p-3.5">গ্রাহক</th>
                    <th className="p-3.5">টার্গেট মূল্য</th>
                    <th className="p-3.5">নতুন ট্রিগার মূল্য</th>
                    <th className="p-3.5">চ্যানেল</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5">প্রেরণের সময়</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(!analytics?.recentLogs || analytics.recentLogs.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        এখনো কোনো নোটিফিকেশন লগ পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    analytics.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{log.productName}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">{log.customerName}</div>
                          <div className="text-[11px] text-muted-foreground">{log.customerEmail}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-muted-foreground">
                          ৳{log.targetPrice.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-black text-orange-600">
                          ৳{log.newPrice.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className="capitalize text-[11px] font-semibold bg-muted px-2 py-0.5 rounded">
                            {log.channel}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                            Delivered
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString("bn-BD")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Settings */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveSettings} className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-5 max-w-2xl shadow-xs">
            <div>
              <h3 className="text-base font-bold text-foreground">প্রাইস ড্রপ অ্যালার্ট কনফিগারেশন</h3>
              <p className="text-xs text-muted-foreground">সিস্টেম পলিসি এবং স্বয়ংক্রিয় নোটিফিকেশন বার্তা নিয়ন্ত্রণ করুন</p>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-foreground">Price Drop Alert ফিচার সক্রিয় রাখুন</div>
                  <div className="text-[11px] text-muted-foreground">গ্রাহকরা প্রোডাক্ট পেজে অ্যালার্ট বাটন দেখতে পারবেন</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-foreground">লগইন ছাড়া গেস্ট গ্রাহকদের সাবস্ক্রিপশন অনুমতি দিন</div>
                  <div className="text-[11px] text-muted-foreground">গেস্ট গ্রাহকরা শুধু ইমেইল দিয়ে অ্যালার্ট সেট করতে পারবে</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowGuestSubscriptions}
                  onChange={(e) => setSettings({ ...settings, allowGuestSubscriptions: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30 cursor-pointer">
                <div>
                  <div className="font-bold text-xs text-foreground">মূল্য কমলে স্বয়ংক্রিয় নোটিফিকেশন ট্রিগার</div>
                  <div className="text-[11px] text-muted-foreground">ইনভেন্টরি বা প্রাইসিং মডিউলে দাম কমলেই সাথে সাথে নোটিফিকেশন যাবে</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoTriggerOnPriceDrop}
                  onChange={(e) => setSettings({ ...settings, autoTriggerOnPriceDrop: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
              </label>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-foreground">Push Notification শিরোনাম টেমপ্লেট:</label>
                <input
                  type="text"
                  value={settings.pushTitleTemplate}
                  onChange={(e) => setSettings({ ...settings, pushTitleTemplate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Push Notification বডি টেমপ্লেট:</label>
                <textarea
                  rows={2}
                  value={settings.pushBodyTemplate}
                  onChange={(e) => setSettings({ ...settings, pushBodyTemplate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Email Subject টেমপ্লেট:</label>
                <input
                  type="text"
                  value={settings.emailSubjectTemplate}
                  onChange={(e) => setSettings({ ...settings, emailSubjectTemplate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
              >
                সেটিংস সংরক্ষণ করুন
              </button>
            </div>
          </form>
        )}

        {/* Price Drop Simulator Modal */}
        {simModalOpen && simProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-foreground">প্রাইস ড্রপ নোটিফিকেশন ট্রিগার</h3>
                </div>
                <button
                  onClick={() => setSimModalOpen(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-muted/40 border">
                  <div className="text-xs font-bold text-foreground line-clamp-1">{simProduct.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    বর্তমান মূল্য: <strong className="text-foreground">৳{simProduct.currentPrice.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">নতুন কমানো মূল্য (New Lower Price):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">৳</span>
                    <input
                      type="number"
                      value={simNewPrice}
                      onChange={(e) => setSimNewPrice(parseInt(e.target.value) || 0)}
                      max={simProduct.currentPrice - 1}
                      min={1}
                      className="w-full pl-8 pr-3 py-2 text-sm font-black rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {simNewPrice < simProduct.currentPrice && (
                    <span className="text-[11px] font-bold text-emerald-600 block">
                      ছাড়: ৳{(simProduct.currentPrice - simNewPrice).toLocaleString()} (-{Math.round(((simProduct.currentPrice - simNewPrice) / simProduct.currentPrice) * 100)}%)
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                  এই মূল্য কার্যকর করলে যেসব গ্রাহকের টার্গেট প্রাইস ৳{simNewPrice.toLocaleString()} বা তার বেশি ছিল, তাদের সবার কাছে স্বয়ংক্রিয়ভাবে পুশ ও ইমেইল নোটিফিকেশন চলে যাবে।
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => setSimModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleExecutePriceDrop}
                  disabled={isSimulating || simNewPrice >= simProduct.currentPrice}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  {isSimulating ? "প্রেরণ হচ্ছে..." : "এখনই নোটিফিকেশন পাঠান"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
