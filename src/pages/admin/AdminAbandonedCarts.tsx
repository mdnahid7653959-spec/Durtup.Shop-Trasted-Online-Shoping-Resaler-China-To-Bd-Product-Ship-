import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Send,
  Settings,
  Mail,
  Smartphone,
  ShieldCheck,
  Percent,
  DollarSign,
  Eye,
  Gift,
  ExternalLink,
  Flame,
  Check,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getAbandonedCartSettings,
  saveAbandonedCartSettings,
  getAbandonedCarts,
  getRecoveryAnalytics,
  processDueAbandonedCartReminders,
  sendManualCartReminder,
  type AbandonedCart,
  type AbandonedCartSettings,
  type CartRecoveryAnalytics,
  DEFAULT_ABANDONED_CART_SETTINGS
} from "@/services/abandonedCartService";
import { logAdminActivity } from "@/services/auditLogger";

export default function AdminAbandonedCarts() {
  const { admin } = useAdminAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("carts");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingDue, setProcessingDue] = useState(false);

  // Data State
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [analytics, setAnalytics] = useState<CartRecoveryAnalytics>({
    totalAbandonedCarts: 0,
    totalRecoveredCarts: 0,
    recoveryRate: 0,
    totalRecoveredRevenue: 0,
    potentialRevenueLost: 0,
    stage1SentCount: 0,
    stage2SentCount: 0,
    stage3SentCount: 0,
  });
  const [settings, setSettings] = useState<AbandonedCartSettings>(DEFAULT_ABANDONED_CART_SETTINGS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "abandoned" | "recovered">("all");

  // Modals
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [manualStage, setManualStage] = useState<1 | 2 | 3>(1);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [cartsData, analyticsData, settingsData] = await Promise.all([
        getAbandonedCarts("all"),
        getRecoveryAnalytics(),
        getAbandonedCartSettings(true),
      ]);
      setCarts(cartsData);
      setAnalytics(analyticsData);
      setSettings(settingsData);
    } catch (err) {
      console.error("Error fetching abandoned carts data:", err);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Failed to load abandoned carts. Please refresh.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Carts
  const filteredCarts = useMemo(() => {
    return carts.filter((cart) => {
      // Status filter
      if (statusFilter !== "all" && cart.status !== statusFilter) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchCustomer =
        (cart.customerName && cart.customerName.toLowerCase().includes(q)) ||
        (cart.customerEmail && cart.customerEmail.toLowerCase().includes(q)) ||
        (cart.customerPhone && cart.customerPhone.includes(q)) ||
        (cart.userId && cart.userId.toLowerCase().includes(q));

      const matchProduct = cart.items?.some((item) => item.name.toLowerCase().includes(q));
      return matchCustomer || matchProduct;
    });
  }, [carts, statusFilter, searchQuery]);

  // Handle Run Due Reminders
  const handleRunDueReminders = async () => {
    try {
      setProcessingDue(true);
      const res = await processDueAbandonedCartReminders();
      toast({
        title: "অটোমেটেড রিমাইন্ডার সম্পন্ন!",
        description: `মোট ${res.processed}টি কার্ট চেক করা হয়েছে। প্রেরিত: ধাপ ১: ${res.stage1Sent}, ধাপ ২: ${res.stage2Sent}, ধাপ ৩: ${res.stage3Sent}`,
      });
      fetchData();
      logAdminActivity({
        admin_id: admin?.id || "admin",
        admin_email: admin?.email || "admin",
        action: "run_abandoned_cart_reminders",
        module: "abandoned_carts",
        details: res,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "রিমাইন্ডার প্রসেসিং ব্যর্থ",
        description: err.message || "Failed to process reminders.",
      });
    } finally {
      setProcessingDue(false);
    }
  };

  // Handle Send Manual Reminder
  const handleSendManualReminder = async () => {
    if (!selectedCart) return;
    try {
      setSendingReminder(true);
      const success = await sendManualCartReminder(selectedCart.id, manualStage);
      if (success) {
        toast({
          title: "রিমাইন্ডার সফলভাবে পাঠানো হয়েছে! 🚀",
          description: `ধাপ ${manualStage}-এর রিমাইন্ডার কাস্টমারকে প্রেরণ করা হয়েছে।`,
        });
        setReminderModalOpen(false);
        fetchData();
        logAdminActivity({
          admin_id: admin?.id || "admin",
          admin_email: admin?.email || "admin",
          action: "send_manual_cart_reminder",
          module: "abandoned_carts",
          target_id: selectedCart.id,
          details: { stage: manualStage, customerName: selectedCart.customerName },
        });
      } else {
        throw new Error("Could not send reminder.");
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "প্রেরণ ব্যর্থ হয়েছে",
        description: e.message || "Failed to send reminder.",
      });
    } finally {
      setSendingReminder(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await saveAbandonedCartSettings(settings);
      toast({
        title: "সেটিংস সংরক্ষিত হয়েছে! ✅",
        description: "অটোমেটেড কার্ট রিকভারি শিডিউল ও টেমপ্লেট সফলভাবে আপডেট হয়েছে।",
      });
      logAdminActivity({
        admin_id: admin?.id || "admin",
        admin_email: admin?.email || "admin",
        action: "update_abandoned_cart_settings",
        module: "abandoned_carts",
        details: settings,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "সংরক্ষণ ব্যর্থ",
        description: e.message || "Failed to save settings.",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  Abandoned Cart Recovery
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  ফেলে যাওয়া কার্ট স্বয়ংক্রিয়ভাবে শনাক্ত ও বহু-ধাপে রিকভারি রিমাইন্ডার সিস্টেম
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </Button>

            <Button
              size="sm"
              onClick={handleRunDueReminders}
              disabled={processingDue}
              className="rounded-xl text-xs font-bold gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${processingDue ? "animate-spin" : ""}`} />
              রিমাইন্ডার এখন রান করুন
            </Button>
          </div>
        </div>

        {/* Top Analytics Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">মোট ড্রপড কার্ট</span>
                <ShoppingCart className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {analytics.totalAbandonedCarts}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">গ্রাহকের অপূর্ণ কার্ট</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">সফল রিকভারি</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {analytics.totalRecoveredCarts}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">অর্ডার সম্পন্ন হয়েছে</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">রিকভারি রেট</span>
                <Percent className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                {analytics.recoveryRate}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">সফল রূপান্তর হার</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">উদ্ধারকৃত রাজস্ব</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ৳{analytics.totalRecoveredRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">রিকভার হওয়া বিক্রয়</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold">ঝুঁকিতে থাকা রাজস্ব</span>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
                ৳{analytics.potentialRevenueLost.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">অপেক্ষারত কার্ট মূল্য</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-2xl">
            <TabsTrigger value="carts" className="rounded-xl text-xs font-bold gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              কার্ট তালিকা ({filteredCarts.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl text-xs font-bold gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              শিডিউল ও সেটিংস
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl text-xs font-bold gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              কনভার্সন ফানেল ও বিশ্লেষণ
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Abandoned Carts Table */}
          <TabsContent value="carts" className="space-y-4">
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="নাম, ফোন, ইমেইল বা পণ্য দিয়ে খুঁজুন..."
                        className="pl-9 h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={(val: any) => setStatusFilter(val)}
                    >
                      <SelectTrigger className="h-9 w-36 text-xs rounded-xl">
                        <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব কার্ট (All)</SelectItem>
                        <SelectItem value="active">Active (সক্রিয়)</SelectItem>
                        <SelectItem value="abandoned">Abandoned (ফেলে যাওয়া)</SelectItem>
                        <SelectItem value="recovered">Recovered (উদ্ধারকৃত)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-16">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">কার্ট ডেটা লোড হচ্ছে...</p>
                  </div>
                ) : filteredCarts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="font-bold text-sm text-muted-foreground">কোনো ড্রপড কার্ট পাওয়া যায়নি</p>
                    <p className="text-xs text-muted-foreground mt-0.5">গ্রাহক পণ্য কার্টে রেখে চেকআউট না করলে তা এখানে আসবে।</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-bold">গ্রাহক (Customer)</TableHead>
                          <TableHead className="text-xs font-bold">কার্টের পণ্য (Items)</TableHead>
                          <TableHead className="text-xs font-bold">মূল্য (Total)</TableHead>
                          <TableHead className="text-xs font-bold">সময় (Timeline)</TableHead>
                          <TableHead className="text-xs font-bold">রিমাইন্ডার স্ট্যাটাস</TableHead>
                          <TableHead className="text-xs font-bold">স্ট্যাটাস</TableHead>
                          <TableHead className="text-xs font-bold text-right">অ্যাকশন</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCarts.map((cart) => {
                          const reminders = cart.remindersSent || {};
                          const hasS1 = !!reminders.stage1;
                          const hasS2 = !!reminders.stage2;
                          const hasS3 = !!reminders.stage3;

                          return (
                            <TableRow key={cart.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-xs text-foreground">
                                    {cart.customerName || "Customer"}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {cart.customerPhone || cart.customerEmail || cart.userId.slice(0, 10)}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2 overflow-hidden shrink-0">
                                    {cart.items?.slice(0, 3).map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="inline-block h-8 w-8 rounded-lg ring-2 ring-background bg-slate-100 overflow-hidden shrink-0"
                                      >
                                        {item.image ? (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <ShoppingCart className="w-4 h-4 m-2 text-muted-foreground" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-foreground">
                                    {cart.itemCount || cart.items?.length || 0} টি পণ্য
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <span className="font-black text-sm text-foreground">
                                  ৳{Number(cart.subtotal || 0).toLocaleString()}
                                </span>
                              </TableCell>

                              <TableCell>
                                <div className="text-[11px] text-muted-foreground space-y-0.5">
                                  <div>
                                    {new Date(cart.updatedAt || cart.createdAt).toLocaleDateString("en-BD", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] font-bold px-1.5 py-0 ${
                                      hasS1 ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "opacity-40"
                                    }`}
                                  >
                                    ধাপ ১ (১ঘ)
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] font-bold px-1.5 py-0 ${
                                      hasS2 ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : "opacity-40"
                                    }`}
                                  >
                                    ধাপ ২ (২৪ঘ)
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] font-bold px-1.5 py-0 ${
                                      hasS3 ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "opacity-40"
                                    }`}
                                  >
                                    ধাপ ৩ (৪৮ঘ)
                                  </Badge>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  className={`text-[10px] font-bold capitalize border-0 ${
                                    cart.status === "recovered"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                      : cart.status === "abandoned"
                                      ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                                      : "bg-blue-500/10 text-blue-600"
                                  }`}
                                >
                                  {cart.status === "recovered" ? "Recovered 🎉" : cart.status}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCart(cart);
                                      setDetailsModalOpen(true);
                                    }}
                                    className="h-7 px-2 text-xs rounded-lg"
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                    বিস্তারিত
                                  </Button>

                                  {cart.status !== "recovered" && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCart(cart);
                                        const nextStg = !hasS1 ? 1 : !hasS2 ? 2 : 3;
                                        setManualStage(nextStg);
                                        setReminderModalOpen(true);
                                      }}
                                      className="h-7 px-2 text-xs rounded-lg bg-orange-500 hover:bg-orange-600 text-white gap-1"
                                    >
                                      <Send className="w-3 h-3" />
                                      রিমাইন্ডার পাঠান
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Reminder Schedule & Channels Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">অটোমেটেড রিকভারি কনফিগারেশন</CardTitle>
                    <CardDescription className="text-xs">
                      রিমাইন্ডার প্রেরণের সময়সূচি, চ্যানেল ও বিশেষ ছাড় কনফিগার করুন
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="rec-active" className="text-xs font-bold">
                      {settings.enabled ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Disabled)"}
                    </Label>
                    <Switch
                      id="rec-active"
                      checked={settings.enabled}
                      onCheckedChange={(checked) => setSettings((s) => ({ ...s, enabled: checked }))}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 1. Schedule Timing (Hours) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ১. রিমাইন্ডার শিডিউল (Schedule Timing)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" /> প্রথম রিমাইন্ডার (ঘণ্টা পর)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={settings.stage1Hours}
                        onChange={(e) => setSettings((s) => ({ ...s, stage1Hours: Number(e.target.value) || 1 }))}
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">ডিফল্ট: ১ ঘণ্টা পর নম্র রিমাইন্ডার</p>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-500" /> দ্বিতীয় রিমাইন্ডার (ঘণ্টা পর)
                      </Label>
                      <Input
                        type="number"
                        min="2"
                        value={settings.stage2Hours}
                        onChange={(e) => setSettings((s) => ({ ...s, stage2Hours: Number(e.target.value) || 24 }))}
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">ডিফল্ট: ২৪ ঘণ্টা পর স্টক শেষ হওয়ার সতর্কতা</p>
                    </div>

                    <div className="p-4 rounded-xl border bg-muted/20 space-y-2">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500" /> তৃতীয় রিমাইন্ডার (ঘণ্টা পর)
                      </Label>
                      <Input
                        type="number"
                        min="3"
                        value={settings.stage3Hours}
                        onChange={(e) => setSettings((s) => ({ ...s, stage3Hours: Number(e.target.value) || 48 }))}
                        className="h-9 text-xs rounded-xl"
                      />
                      <p className="text-[10px] text-muted-foreground">ডিফল্ট: ৪৮ ঘণ্টা পর কুপন ছাড় অফার</p>
                    </div>
                  </div>
                </div>

                {/* 2. Notification Channels */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ২. প্রেরণের চ্যানেলসমূহ (Delivery Channels)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-primary" /> Web/Mobile Push
                        </Label>
                        <p className="text-[10px] text-muted-foreground">ব্রাউজার ও ফোন পুশ নোটিফিকেশন</p>
                      </div>
                      <Switch
                        checked={settings.channels.pushNotification}
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, channels: { ...s.channels, pushNotification: checked } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-amber-500" /> In-App Notification
                        </Label>
                        <p className="text-[10px] text-muted-foreground">কাস্টমার ইনবক্স বার্তা</p>
                      </div>
                      <Switch
                        checked={settings.channels.inAppNotification}
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, channels: { ...s.channels, inAppNotification: checked } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-500" /> Email Notification
                        </Label>
                        <p className="text-[10px] text-muted-foreground">ইমেইল বার্তা প্রেরণ</p>
                      </div>
                      <Switch
                        checked={settings.channels.email}
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, channels: { ...s.channels, email: checked } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-sky-500" /> Telegram Alerts
                        </Label>
                        <p className="text-[10px] text-muted-foreground">এডমিন টেলিগ্রাম সতর্কতা</p>
                      </div>
                      <Switch
                        checked={settings.channels.telegramAlert}
                        onCheckedChange={(checked) =>
                          setSettings((s) => ({ ...s, channels: { ...s.channels, telegramAlert: checked } }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Stage 3 Incentives (Coupons) */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        ৩. রিকভারি ইনসেন্টিভ (Stage 3 Special Discount)
                      </h3>
                      <p className="text-[11px] text-muted-foreground">৪৮ ঘণ্টা পার হওয়া কাস্টমারকে অর্ডারের জন্য বিশেষ কুপন কোড প্রদান</p>
                    </div>
                    <Switch
                      checked={settings.incentives.enableStage3Discount}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, incentives: { ...s.incentives, enableStage3Discount: checked } }))
                      }
                    />
                  </div>

                  {settings.incentives.enableStage3Discount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">কুপন কোড (Coupon Code)</Label>
                        <Input
                          value={settings.incentives.couponCode}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              incentives: { ...s.incentives, couponCode: e.target.value.toUpperCase() },
                            }))
                          }
                          className="h-9 text-xs rounded-xl font-mono uppercase font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">ছাড়ের পরিমাণ (Discount %)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={settings.incentives.discountPercent}
                          onChange={(e) =>
                            setSettings((s) => ({
                              ...s,
                              incentives: { ...s.incentives, discountPercent: Number(e.target.value) || 5 },
                            }))
                          }
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Message Templates */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    ৪. নোটিফিকেশন বার্তা টেমপ্লেট (Templates)
                  </h3>

                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                      <Label className="text-xs font-bold">ধাপ ১ মেসেজ (Stage 1 - 1 Hour)</Label>
                      <Input
                        value={settings.templates.stage1Title}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            templates: { ...s.templates, stage1Title: e.target.value },
                          }))
                        }
                        placeholder="Title"
                        className="h-8 text-xs rounded-lg"
                      />
                      <Textarea
                        value={settings.templates.stage1Body}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            templates: { ...s.templates, stage1Body: e.target.value },
                          }))
                        }
                        rows={2}
                        className="text-xs rounded-lg resize-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                      <Label className="text-xs font-bold">ধাপ ২ মেসেজ (Stage 2 - 24 Hours)</Label>
                      <Input
                        value={settings.templates.stage2Title}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            templates: { ...s.templates, stage2Title: e.target.value },
                          }))
                        }
                        placeholder="Title"
                        className="h-8 text-xs rounded-lg"
                      />
                      <Textarea
                        value={settings.templates.stage2Body}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            templates: { ...s.templates, stage2Body: e.target.value },
                          }))
                        }
                        rows={2}
                        className="text-xs rounded-lg resize-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                      <Label className="text-xs font-bold">ধাপ ৩ মেসেজ (Stage 3 - 48 Hours with Incentive)</Label>
                      <Input
                        value={settings.templates.stage3Title}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            templates: { ...s.templates, stage3Title: e.target.value },
                          }))
                        }
                        placeholder="Title"
                        className="h-8 text-xs rounded-lg"
                      />
                      <Textarea
                        value={settings.templates.stage3Body}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            templates: { ...s.templates, stage3Body: e.target.value },
                          }))
                        }
                        rows={2}
                        className="text-xs rounded-lg resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="rounded-xl text-xs font-bold gap-1.5 bg-primary px-6"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {savingSettings ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Conversion Funnel & Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">রিকভারি ফানেল (Recovery Funnel)</CardTitle>
                  <CardDescription className="text-xs">কার্ট তৈরি থেকে চূড়ান্ত অর্ডারে রূপান্তরের পর্যায়সমূহ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>১. কার্ট পরিত্যক্ত (Abandoned)</span>
                        <span>{analytics.totalAbandonedCarts} টি</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>২. প্রথম রিমাইন্ডার প্রেরিত (Stage 1)</span>
                        <span>{analytics.stage1SentCount} টি</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${analytics.totalAbandonedCarts ? Math.min(100, Math.round((analytics.stage1SentCount / analytics.totalAbandonedCarts) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>৩. দ্বিতীয় রিমাইন্ডার প্রেরিত (Stage 2)</span>
                        <span>{analytics.stage2SentCount} টি</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${analytics.totalAbandonedCarts ? Math.min(100, Math.round((analytics.stage2SentCount / analytics.totalAbandonedCarts) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>৪. তৃতীয় রিমাইন্ডার প্রেরিত (Stage 3)</span>
                        <span>{analytics.stage3SentCount} টি</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${analytics.totalAbandonedCarts ? Math.min(100, Math.round((analytics.stage3SentCount / analytics.totalAbandonedCarts) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-emerald-600">
                        <span>৫. সফল রিকভারি সম্পন্ন (Recovered Orders)</span>
                        <span>{analytics.totalRecoveredCarts} টি ({analytics.recoveryRate}%)</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, analytics.recoveryRate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy and Policy Box */}
              <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-card via-muted/10 to-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    প্রাইভেসি ও কনসেন্ট সুরক্ষা পলিসি
                  </CardTitle>
                  <CardDescription className="text-xs">Customer Notification Consent & Frequency Capping</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <p className="font-bold text-foreground">১. সর্বোচ্চ ৩টি রিমাইন্ডার ক্যাপ (Frequency Cap)</p>
                    <p className="text-[11px]">একটি নির্দিষ্ট কার্টের জন্য সর্বোচ্চ ৩টি রিমাইন্ডারের বেশি কখনই প্রেরণ করা হয় না।</p>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <p className="font-bold text-foreground">২. অর্ডার সম্পন্ন হওয়া মাত্রই স্বয়ংক্রিয় অবসান</p>
                    <p className="text-[11px]">গ্রাহক যেকোনো সময় অর্ডার সম্পন্ন করলেই সাথে সাথে সকল অপেক্ষারত রিমাইন্ডার বন্ধ হয়ে যায়।</p>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-card space-y-1">
                    <p className="font-bold text-foreground">৩. নোটিফিকেশন পারমিশন ও কনসেন্ট সম্মান</p>
                    <p className="text-[11px]">শুধুমাত্র ব্রাউজারে অনুমতি প্রদানকারী গ্রাহকের ফোনেই পুশ নোটিফিকেশন প্রদর্শন করা হয়।</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: View Cart Details */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">কার্টের বিস্তারিত বিবরণ</DialogTitle>
              <DialogDescription className="text-xs">
                গ্রাহক: {selectedCart?.customerName || "Customer"} ({selectedCart?.customerPhone || selectedCart?.customerEmail || "N/A"})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
              <div className="divide-y border rounded-xl overflow-hidden bg-card">
                {selectedCart?.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 m-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[10px] text-muted-foreground">{item.variantName}</p>
                      )}
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {item.quantity} × ৳{item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right font-black text-xs text-foreground">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-muted/40 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">মোট মূল্য:</span>
                  <span className="font-bold text-foreground">৳{selectedCart?.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">স্ট্যাটাস:</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {selectedCart?.status}
                  </Badge>
                </div>
                {selectedCart?.recoveredOrderId && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>অর্ডার আইডি:</span>
                    <span>#{selectedCart.recoveredOrderId}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                বন্ধ করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Send Manual Reminder */}
        <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">রিমাইন্ডার প্রেরণ নিশ্চিত করুন</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedCart?.customerName} ({selectedCart?.customerPhone || selectedCart?.customerEmail || "Customer"})-কে বার্তা পাঠানো হবে।
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">কোন ধাপের রিমাইন্ডার পাঠাবেন?</Label>
                <Select
                  value={String(manualStage)}
                  onValueChange={(val) => setManualStage(Number(val) as 1 | 2 | 3)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ধাপ ১: সাধারণ রিমাইন্ডার (১ ঘণ্টা)</SelectItem>
                    <SelectItem value="2">ধাপ ২: স্টক শেষ হওয়ার সতর্কতা (২৪ ঘণ্টা)</SelectItem>
                    <SelectItem value="3">ধাপ ৩: বিশেষ উপহার/কুপন ছাড় (৪৮ ঘণ্টা)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-950 dark:text-orange-200">
                <p className="font-bold">বার্তা প্রিভিউ:</p>
                <p className="text-[11px] mt-1">
                  {manualStage === 1
                    ? settings.templates.stage1Body
                    : manualStage === 2
                    ? settings.templates.stage2Body
                    : settings.templates.stage3Body.replace("{COUPON}", settings.incentives.couponCode)}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderModalOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                বাতিল
              </Button>
              <Button
                size="sm"
                onClick={handleSendManualReminder}
                disabled={sendingReminder}
                className="rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingReminder ? "পাঠানো হচ্ছে..." : "এখনই পাঠান"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
