import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Send,
  Search,
  Filter,
  Users,
  Package,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Trash2,
  Smartphone,
  Mail,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  getBackInStockAnalytics,
  triggerBackInStockNotifications,
  cancelStockAlert,
  getStockAlertSettings,
  saveStockAlertSettings,
  BACK_IN_STOCK_EVENT,
  type StockAlertSubscription,
  type StockAlertAnalytics,
  type StockAlertSettings,
} from "@/services/backInStockService";
import { SafeProductImage } from "@/components/products/SafeProductImage";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AdminBackInStock() {
  const [analytics, setAnalytics] = useState<StockAlertAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "notified" | "cancelled">("all");
  
  // Trigger Modal
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [selectedProductForTrigger, setSelectedProductForTrigger] = useState<{
    productId: string;
    productName: string;
    productImage: string;
    pendingCount: number;
  } | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(20);
  const [triggering, setTriggering] = useState(false);

  // Settings
  const [settings, setSettings] = useState<StockAlertSettings>(getStockAlertSettings);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBackInStockAnalytics();
      setAnalytics(data);
    } catch {
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener(BACK_IN_STOCK_EVENT, loadData);
    return () => window.removeEventListener(BACK_IN_STOCK_EVENT, loadData);
  }, [loadData]);

  // Handle Trigger Notifications
  const handleTriggerAlerts = async () => {
    if (!selectedProductForTrigger) return;
    setTriggering(true);
    try {
      const res = await triggerBackInStockNotifications(
        selectedProductForTrigger.productId,
        restockQuantity
      );
      toast.success(
        `সফলভাবে ${res.notifiedCount} জন গ্রাহককে রিস্টক নোটিফিকেশন (Push & Email) পাঠানো হয়েছে!`
      );
      setTriggerModalOpen(false);
      loadData();
    } catch {
      toast.error("নোটিফিকেশন পাঠাতে সমস্যা হয়েছে");
    } finally {
      setTriggering(false);
    }
  };

  const handleCancelSub = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই সাবস্ক্রিপশনটি বাতিল করতে চান?")) return;
    const ok = await cancelStockAlert(id);
    if (ok) {
      toast.success("সাবস্ক্রিপশন বাতিল করা হয়েছে");
      loadData();
    }
  };

  const handleSaveSettings = () => {
    saveStockAlertSettings(settings);
    toast.success("সেটিংস সফলভাবে সংরক্ষিত হয়েছে");
  };

  // Filter Subscriptions
  const filteredSubs = (analytics?.recentSubscriptions || []).filter((sub) => {
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesSearch =
      sub.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.customerPhone && sub.customerPhone.includes(searchTerm));
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout title="Back in Stock Alerts">
      <div className="space-y-6 pb-12 select-none">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
              <BellRing className="w-6 h-6 text-orange-600" />
              Back in Stock Notifications & Demand Forecasting
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              আউট-অব-স্টক পণ্যের গ্রাহক চাহিদা বিশ্লেষণ, অ্যালার্ট সাবস্ক্রিপশন ও অটোমেটেড রিস্টক নোটিফিকেশন
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-1.5 text-xs rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </Button>
          </div>
        </div>

        {/* 1. Analytics KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  মোট সাবস্ক্রিপশন
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  {analytics?.totalSubscriptions || 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  অপেক্ষারত ক্রেতা
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-amber-600">
                  {analytics?.pendingAlerts || 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  নোটিফাইড রিস্টক
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600">
                  {analytics?.notifiedAlerts || 0}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  নোটিফিকেশন রেট
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-blue-600">
                  {analytics?.conversionRate || 0}%
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Main Content Tabs */}
        <Tabs defaultValue="demand" className="w-full">
          <TabsList className="grid w-full sm:w-auto grid-cols-3 h-10 p-1">
            <TabsTrigger value="demand" className="text-xs sm:text-sm font-bold gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>ডিমান্ড ফোরকাস্টিং (Top Demand)</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm font-bold gap-1.5">
              <Users className="w-4 h-4" />
              <span>সকল সাবস্ক্রিপশন ({analytics?.totalSubscriptions || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm font-bold gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>অ্যালার্ট সেটিংস</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DEMAND FORECASTING */}
          <TabsContent value="demand" className="space-y-4 pt-3">
            <Card className="border border-border/80">
              <CardHeader className="p-4 sm:p-5 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      সর্বাধিক চাহিদাসম্পন্ন স্টক-আউট পণ্যসমূহ (Priority Restock List)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      যেসব পণ্যের জন্য ক্রেতারা সবচেয়ে বেশি অপেক্ষা করছেন। আগে এই পণ্যগুলো রিস্টক করলে সর্বাধিক বিক্রয় নিশ্চিত হবে।
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-xs">
                        <TableHead className="w-12 text-center">র‍্যাংক</TableHead>
                        <TableHead>পণ্য বিবরণ</TableHead>
                        <TableHead>মূল্য</TableHead>
                        <TableHead className="text-center">অপেক্ষারত ক্রেতা</TableHead>
                        <TableHead>ভ্যারিয়েন্ট চাহিদা</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.topRequestedProducts && analytics.topRequestedProducts.length > 0 ? (
                        analytics.topRequestedProducts.map((p, idx) => (
                          <TableRow key={`demand-${p.productId}-${idx}`} className="text-xs hover:bg-muted/30">
                            <TableCell className="text-center font-bold text-muted-foreground">
                              #{idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted p-1 shrink-0 overflow-hidden border border-border/60">
                                  <img
                                    src={p.productImage || "/durtup-logo.png"}
                                    alt={p.productName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "/durtup-logo.png";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/product/${p.productId}`}
                                    className="font-bold text-foreground hover:text-orange-600 transition line-clamp-1"
                                  >
                                    {p.productName}
                                  </Link>
                                  <span className="text-[10px] text-muted-foreground">
                                    ID: {p.productId}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-foreground">
                              ৳{p.productPrice.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 font-bold px-2.5 py-0.5">
                                {p.pendingCount} জন অপেক্ষমান
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {p.variants.map((v, vIdx) => (
                                  <span
                                    key={vIdx}
                                    className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground"
                                  >
                                    {v.label} ({v.count})
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                disabled={p.pendingCount === 0}
                                onClick={() => {
                                  setSelectedProductForTrigger({
                                    productId: p.productId,
                                    productName: p.productName,
                                    productImage: p.productImage,
                                    pendingCount: p.pendingCount,
                                  });
                                  setTriggerModalOpen(true);
                                }}
                                className="h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg shadow-xs"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                রিস্টক নোটিফাই পাঠান
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            এখনো কোনো আউট-অব-স্টক পণ্যের অনুরোধ পাওয়া যায়নি
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ALL SUBSCRIPTIONS */}
          <TabsContent value="subscriptions" className="space-y-4 pt-3">
            <Card className="border border-border/80">
              <CardHeader className="p-4 sm:p-5 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative w-full">
                      <Input
                        type="text"
                        placeholder="পণ্য, ক্রেতার নাম বা ইমেইল দিয়ে খুঁজুন..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 text-xs pl-8 rounded-xl"
                      />
                      <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(["all", "pending", "notified", "cancelled"] as const).map((st) => (
                      <Button
                        key={st}
                        variant={statusFilter === st ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(st)}
                        className={`h-8 text-xs capitalize rounded-xl ${
                          statusFilter === st ? "bg-orange-600 text-white hover:bg-orange-700" : ""
                        }`}
                      >
                        {st === "all" ? "সকল" : st === "pending" ? "পেন্ডিং" : st === "notified" ? "নোটিফাইড" : "বাতিল"}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 text-xs">
                        <TableHead>পণ্য</TableHead>
                        <TableHead>ভ্যারিয়েন্ট</TableHead>
                        <TableHead>ক্রেতার বিবরণ</TableHead>
                        <TableHead>চ্যানেল</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead>তারিখ</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubs.length > 0 ? (
                        filteredSubs.map((sub) => (
                          <TableRow key={sub.id} className="text-xs hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-2.5 max-w-[220px]">
                                <div className="w-9 h-9 rounded-lg bg-muted p-1 shrink-0 overflow-hidden border border-border">
                                  <img
                                    src={sub.productImage || "/durtup-logo.png"}
                                    alt={sub.productName}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "/durtup-logo.png";
                                    }}
                                  />
                                </div>
                                <span className="font-bold text-foreground line-clamp-1" title={sub.productName}>
                                  {sub.productName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {sub.variantLabel ? (
                                <Badge variant="outline" className="text-[10px] bg-muted/50 font-normal">
                                  {sub.variantLabel}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="font-bold text-foreground">{sub.customerName}</div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-orange-500" />
                                  <span>{sub.customerEmail}</span>
                                </div>
                                {sub.customerPhone && (
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Smartphone className="w-3 h-3 text-emerald-500" />
                                    <span>{sub.customerPhone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {sub.channel === "both" ? "ইমেইল + পুশ" : sub.channel === "push" ? "পুশ" : "ইমেইল"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sub.status === "notified" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
                                  নোটিফাইড
                                </Badge>
                              ) : sub.status === "pending" ? (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200">
                                  অপেক্ষমান
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  বাতিল
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {new Date(sub.createdAt).toLocaleDateString("bn-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {sub.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelSub(sub.id)}
                                  className="h-7 px-2 text-destructive hover:bg-destructive/10 text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            কোনো সাবস্ক্রিপশন খুঁজে পাওয়া যায়নি
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SETTINGS */}
          <TabsContent value="settings" className="space-y-4 pt-3">
            <Card className="border border-border/80">
              <CardHeader className="p-4 sm:p-5 border-b border-border/60">
                <CardTitle className="text-base font-bold">
                  ব্যাক ইন স্টক নোটিফিকেশন কনফিগারেশন
                </CardTitle>
                <CardDescription className="text-xs">
                  গ্রাহকদের কাছে স্বয়ংক্রিয় নোটিফিকেশন পাঠানোর শর্ত ও মেসেজ টেমপ্লেট
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">সিস্টেম চালু রাখুন (Enable Feature)</h4>
                    <p className="text-xs text-muted-foreground">স্টক আউট পণ্যে Notify Me বাটন প্রদর্শিত হবে</p>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">স্বয়ংক্রিয় রিস্টক নোটিফিকেশন (Auto Trigger)</h4>
                    <p className="text-xs text-muted-foreground">
                      এডমিন ইনভেন্টরি পেজ বা স্টোর থেকে স্টক বৃদ্ধি পেলে সাথে সাথে অপেক্ষারত ক্রেতাদের নোটিফিকেশন পাঠানো হবে
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoTriggerOnRestock}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, autoTriggerOnRestock: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">গেস্ট গ্রাহকদের অনুমতি দিন (Guest Subscription)</h4>
                    <p className="text-xs text-muted-foreground">লগইন ছাড়া শুধু ইমেইল দিয়ে সাবস্ক্রাইব করার সুযোগ</p>
                  </div>
                  <Switch
                    checked={settings.allowGuestSubscriptions}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, allowGuestSubscriptions: v }))}
                  />
                </div>

                {/* Templates */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">পুশ নোটিফিকেশন টাইটেল টেমপ্লেট</Label>
                    <Input
                      value={settings.pushTitleTemplate}
                      onChange={(e) => setSettings((s) => ({ ...s, pushTitleTemplate: e.target.value }))}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">পুশ নোটিফিকেশন মেসেজ টেমপ্লেট</Label>
                    <Input
                      value={settings.pushBodyTemplate}
                      onChange={(e) => setSettings((s) => ({ ...s, pushBodyTemplate: e.target.value }))}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">ইমেইল সাবজেক্ট টেমপ্লেট</Label>
                    <Input
                      value={settings.emailSubjectTemplate}
                      onChange={(e) => setSettings((s) => ({ ...s, emailSubjectTemplate: e.target.value }))}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl px-5"
                  >
                    সেটিংস সংরক্ষণ করুন
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 3. Manual Restock Trigger Modal */}
        <Dialog open={triggerModalOpen} onOpenChange={setTriggerModalOpen}>
          <DialogContent className="sm:max-w-md p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-orange-600" />
                রিস্টক নোটিফিকেশন পাঠান
              </DialogTitle>
              <DialogDescription className="text-xs">
                পণ্যটি স্টকে এসেছে জানিয়ে অপেক্ষারত {selectedProductForTrigger?.pendingCount} জন গ্রাহককে পুশ ও ইমেইল পাঠান।
              </DialogDescription>
            </DialogHeader>

            {selectedProductForTrigger && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border">
                  <img
                    src={selectedProductForTrigger.productImage || "/durtup-logo.png"}
                    alt={selectedProductForTrigger.productName}
                    className="w-12 h-12 object-contain rounded-lg bg-background border p-1"
                  />
                  <div>
                    <h4 className="text-xs font-bold line-clamp-1">{selectedProductForTrigger.productName}</h4>
                    <p className="text-[11px] text-orange-600 font-bold mt-0.5">
                      অপেক্ষারত গ্রাহক: {selectedProductForTrigger.pendingCount} জন
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="restock-qty" className="text-xs font-bold">
                    যুক্তকৃত নতুন স্টক পরিমাণ (Restock Quantity):
                  </Label>
                  <Input
                    id="restock-qty"
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-9 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    গ্রাহককে জানানো হবে যে {restockQuantity}টি নতুন ইউনিট স্টকে যোগ করা হয়েছে।
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTriggerModalOpen(false)}
                disabled={triggering}
                className="text-xs rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                size="sm"
                onClick={handleTriggerAlerts}
                disabled={triggering}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
              >
                {triggering ? "নোটিফিকেশন পাঠানো হচ্ছে..." : "এখনই পাঠান (Send Alerts)"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
