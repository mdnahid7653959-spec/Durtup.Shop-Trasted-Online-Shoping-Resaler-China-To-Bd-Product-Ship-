import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins,
  Plus,
  Trash2,
  Edit,
  History,
  Settings,
  Sparkles,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Percent
} from "lucide-react";
import {
  getAllCashbackCampaigns,
  saveCashbackCampaign,
  deleteCashbackCampaign,
  getAllCashbackHistory,
  getCashbackSettings,
  saveCashbackSettings,
  CashbackCampaign,
  CashbackTransaction,
  CashbackSettings,
  DEFAULT_CASHBACK_SETTINGS
} from "@/services/cashbackService";

const AVAILABLE_CATEGORIES = [
  "Gadgets & Electronics",
  "Men's Fashion",
  "Women's Fashion",
  "Home & Lifestyle",
  "Health & Beauty",
  "Kids Zone",
  "Foods",
  "Winter",
  "Watch",
  "Jewelry"
];

export default function AdminCashback() {
  const [campaigns, setCampaigns] = useState<CashbackCampaign[]>([]);
  const [history, setHistory] = useState<CashbackTransaction[]>([]);
  const [settings, setSettings] = useState<CashbackSettings>(DEFAULT_CASHBACK_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CashbackCampaign | null>(null);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    cashback_percent: 10,
    max_cashback_amount: 500,
    min_order_amount: 1000,
    target_type: "all" as "all" | "categories" | "products",
    target_categories: [] as string[],
    target_products_str: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [camps, hist, sett] = await Promise.all([
        getAllCashbackCampaigns(),
        getAllCashbackHistory(100),
        getCashbackSettings()
      ]);
      setCampaigns(camps);
      setHistory(hist);
      setSettings(sett);
    } catch (err) {
      console.error("Error loading cashback data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setForm({
      name: "",
      description: "",
      cashback_percent: 10,
      max_cashback_amount: 500,
      min_order_amount: 1000,
      target_type: "all",
      target_categories: [],
      target_products_str: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_active: true
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: CashbackCampaign) => {
    setEditingCampaign(c);
    setForm({
      name: c.name,
      description: c.description || "",
      cashback_percent: c.cashback_percent,
      max_cashback_amount: c.max_cashback_amount,
      min_order_amount: c.min_order_amount,
      target_type: c.target_type,
      target_categories: c.target_categories || [],
      target_products_str: (c.target_products || []).join(", "),
      start_date: c.start_date || new Date().toISOString().split("T")[0],
      end_date: c.end_date || new Date().toISOString().split("T")[0],
      is_active: c.is_active
    });
    setDialogOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "নাম আবশ্যক", description: "ক্যাম্পেইনের নাম দিন।", variant: "destructive" });
      return;
    }
    if (form.cashback_percent <= 0) {
      toast({ title: "সঠিক শতকরা হার দিন", description: "ক্যাশব্যাক পার্সেন্টেজ ১% বা তার বেশি হতে হবে।", variant: "destructive" });
      return;
    }

    setSavingCampaign(true);
    try {
      const targetProds = form.target_products_str
        ? form.target_products_str.split(",").map(p => p.trim()).filter(Boolean)
        : [];

      await saveCashbackCampaign({
        id: editingCampaign?.id,
        name: form.name.trim(),
        description: form.description.trim(),
        cashback_percent: Number(form.cashback_percent),
        max_cashback_amount: Number(form.max_cashback_amount),
        min_order_amount: Number(form.min_order_amount),
        target_type: form.target_type,
        target_categories: form.target_categories,
        target_products: targetProds,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: form.is_active
      });

      toast({
        title: editingCampaign ? "ক্যাম্পেইন আপডেট হয়েছে!" : "নতুন ক্যাম্পেইন সফলভাবে তৈরি হয়েছে! 🎉",
        description: `${form.name} সফলভাবে সংরক্ষিত হয়েছে।`
      });
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "Failed to save campaign", variant: "destructive" });
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (c: CashbackCampaign) => {
    try {
      await saveCashbackCampaign({ ...c, is_active: !c.is_active });
      setCampaigns(prev => prev.map(item => item.id === c.id ? { ...item, is_active: !c.is_active } : item));
      toast({
        title: !c.is_active ? "ক্যাম্পেইন সক্রিয় করা হয়েছে" : "ক্যাম্পেইন বন্ধ করা হয়েছে",
        description: c.name
      });
    } catch (err) {
      toast({ title: "Error", description: "Status change failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ক্যাম্পেইনটি ডিলিট করতে চান?")) return;
    try {
      await deleteCashbackCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({ title: "Campaign deleted" });
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleSaveGlobalSettings = async () => {
    try {
      await saveCashbackSettings(settings);
      toast({
        title: "গ্লোবাল সেটিংস সংরক্ষিত হয়েছে",
        description: "ক্যাশব্যাক পলিসি সফলভাবে আপডেট হয়েছে।"
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save settings", variant: "destructive" });
    }
  };

  // KPI Metrics
  const totalCashbackDistributed = history
    .filter(h => h.type === "awarded")
    .reduce((sum, h) => sum + (h.cashback_amount || 0), 0);
  const activeCampaignsCount = campaigns.filter(c => c.is_active).length;
  const eligibleOrdersCount = history.filter(h => h.type === "awarded").length;

  if (loading) {
    return (
      <AdminLayout title="Cashback System">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Cashback System">
      <div className="space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    ৳{totalCashbackDistributed.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">মোট প্রদত্ত ক্যাশব্যাক (Total Cashback)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{activeCampaignsCount}</p>
                  <p className="text-xs text-muted-foreground font-medium">চলমান ক্যাম্পেইন (Active Campaigns)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{eligibleOrdersCount}</p>
                  <p className="text-xs text-muted-foreground font-medium">ক্যাশব্যাকপ্রাপ্ত অর্ডার সংখ্যা</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="campaigns" className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> ক্যাম্পেইনসমূহ
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-bold flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> অডিট হিস্ট্রি
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs font-bold flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" /> সেটিংস
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CAMPAIGNS */}
          <TabsContent value="campaigns">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    ক্যাশব্যাক ক্যাম্পেইন ব্যবস্থাপনা
                  </CardTitle>
                  <CardDescription className="text-xs">
                    নির্দিষ্ট পণ্য, ক্যাটাগরি বা সম্পূর্ণ অর্ডারের জন্য ক্যাশব্যাক ক্যাম্পেইন তৈরি ও পরিচালনা করুন
                  </CardDescription>
                </div>
                <Button
                  onClick={handleOpenCreate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" /> নতুন ক্যাম্পেইন
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ক্যাম্পেইনের নাম</TableHead>
                      <TableHead className="text-center">ক্যাশব্যাক হার</TableHead>
                      <TableHead className="text-center">নূন্যতম অর্ডার</TableHead>
                      <TableHead className="text-center">সর্বোচ্চ সীমা</TableHead>
                      <TableHead>প্রযোজ্য পণ্য/ক্যাটাগরি</TableHead>
                      <TableHead>মেয়াদ</TableHead>
                      <TableHead className="text-center">স্ট্যাটাস</TableHead>
                      <TableHead className="text-right">একশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                          কোনো ক্যাম্পেইন তৈরি করা হয়নি। "নতুন ক্যাম্পেইন" বাটনে ক্লিক করে অফার শুরু করুন।
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((camp) => (
                        <TableRow key={camp.id} className={!camp.is_active ? "opacity-60 bg-muted/20" : ""}>
                          <TableCell className="font-medium">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">{camp.name}</p>
                              {camp.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1">{camp.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-black text-emerald-600">
                            {camp.cashback_percent}%
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold">
                            ৳{camp.min_order_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-foreground">
                            ৳{camp.max_cashback_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {camp.target_type === "all" && (
                              <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-300">
                                সব পণ্য (All Store)
                              </Badge>
                            )}
                            {camp.target_type === "categories" && (
                              <Badge className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300">
                                {camp.target_categories?.length || 0} টি ক্যাটাগরি
                              </Badge>
                            )}
                            {camp.target_type === "products" && (
                              <Badge className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300">
                                {camp.target_products?.length || 0} টি নির্দিষ্ট পণ্য
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {camp.start_date} হতে {camp.end_date}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={camp.is_active}
                              onCheckedChange={() => handleToggleCampaignStatus(camp)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(camp)}
                                className="h-8 w-8 text-primary"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(camp.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: AUDIT HISTORY */}
          <TabsContent value="history">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  ক্যাশব্যাক ট্রানজ্যাকশন অডিট লগ (Cashback Ledger)
                </CardTitle>
                <CardDescription className="text-xs">
                  প্রতিটি সফল অর্ডারের ক্যাশব্যাক বিতরণ এবং রিফান্ড/ক্যান্সেলেশনের রিয়েল-টাইম রেকর্ড
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ ও সময়</TableHead>
                      <TableHead>কাস্টমার</TableHead>
                      <TableHead>অর্ডার নং</TableHead>
                      <TableHead className="text-right">অর্ডারের মূল্য</TableHead>
                      <TableHead className="text-center">ক্যাশব্যাক (%)</TableHead>
                      <TableHead className="text-center">ক্যাশব্যাক প্রাপ্তি</TableHead>
                      <TableHead>ক্যাম্পেইনের নাম</TableHead>
                      <TableHead className="text-center">স্ট্যাটাস</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                          এখনো কোনো ক্যাশব্যাক ট্রানজ্যাকশন রেকর্ড হয়নি।
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString("bn-BD", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {tx.user_email || tx.user_name || tx.user_id.slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-foreground">
                            #{tx.order_number}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold">
                            ৳{tx.order_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-muted-foreground">
                            {tx.cashback_percent}%
                          </TableCell>
                          <TableCell className={`text-center font-black ${tx.type === "awarded" ? "text-emerald-600" : "text-rose-600"}`}>
                            {tx.type === "awarded" ? `+৳${tx.cashback_amount}` : `-৳${tx.cashback_amount}`}
                          </TableCell>
                          <TableCell className="text-xs text-foreground max-w-xs truncate">
                            {tx.campaign_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {tx.type === "awarded" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300">
                                সফলভাবে জমা হয়েছে
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-300">
                                রিভার্সড (বাতিল)
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SETTINGS */}
          <TabsContent value="settings">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-4 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      গ্লোবাল ক্যাশব্যাক পলিসি সেটিংস
                    </CardTitle>
                    <CardDescription className="text-xs">
                      সিস্টেম-ওয়াইড ক্যাশব্যাক সক্ষমতা এবং ডিফল্ট প্যারামিটার নির্ধারণ করুন
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold">সিস্টেম সক্রিয়:</Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(val) => setSettings({ ...settings, enabled: val })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5 max-w-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-xs font-bold">ডিফল্ট ক্যাশব্যাক পার্সেন্টেজ (%)</Label>
                      <p className="text-[11px] text-muted-foreground">ক্যাম্পেইন ছাড়া সাধারণ অর্ডারের ক্ষেত্রে প্রযোজ্য হার</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.default_cashback_percent}
                        onChange={(e) => setSettings({ ...settings, default_cashback_percent: Number(e.target.value) })}
                        className="w-24 text-center font-bold"
                      />
                      <span className="text-xs font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-xs font-bold">ডিফল্ট নূন্যতম অর্ডার মূল্য (৳)</Label>
                      <p className="text-[11px] text-muted-foreground">ক্যাশব্যাক পেতে সর্বনিম্ন কত টাকার অর্ডার করতে হবে</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={settings.default_min_order_amount}
                      onChange={(e) => setSettings({ ...settings, default_min_order_amount: Number(e.target.value) })}
                      className="w-24 text-center font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-xs font-bold">ডিফল্ট সর্বোচ্চ ক্যাশব্যাক সীমা (৳)</Label>
                      <p className="text-[11px] text-muted-foreground">প্রতি অর্ডারে সর্বোচ্চ কত টাকা পর্যন্ত ক্যাশব্যাক দেওয়া যাবে</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={settings.default_max_cashback}
                      onChange={(e) => setSettings({ ...settings, default_max_cashback: Number(e.target.value) })}
                      className="w-24 text-center font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <ShieldCheck className="h-4 w-4" /> পূর্ণাঙ্গ সার্ভার-সাইড সিকিউরিটি ও ডুপ্লিকেট প্রতিরোধ
                  </div>
                  <p>প্রতিটি ডেলিভারির বিপরীতে ইউনিক আইডেমপোটেন্সি চাবি দিয়ে ফায়ারস্টোর ব্যালেন্স আপডেট করা হয়।</p>
                </div>

                <Button
                  onClick={handleSaveGlobalSettings}
                  className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                >
                  সেটিংস সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create / Edit Campaign Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              {editingCampaign ? "ক্যাম্পেইন সম্পাদন করুন" : "নতুন ক্যাশব্যাক ক্যাম্পেইন তৈরি"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              ক্যাশব্যাকের শতকরা হার, নূন্যতম অর্ডার এবং মেয়াদ নির্ধারণ করুন
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCampaign} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">ক্যাম্পেইনের নাম *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="যেমন: উইন্টার স্পেশাল ১০% ক্যাশব্যাক"
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">বিবরণ (ঐচ্ছিক)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="কাস্টমারদের জন্য অফার সংক্রান্ত বার্তা..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">ক্যাশব্যাক হার (%) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.cashback_percent}
                  onChange={(e) => setForm({ ...form, cashback_percent: Number(e.target.value) })}
                  className="font-bold text-center text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">নূন্যতম অর্ডার (৳) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                  className="font-bold text-center text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold">সর্বোচ্চ সীমা (৳) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.max_cashback_amount}
                  onChange={(e) => setForm({ ...form, max_cashback_amount: Number(e.target.value) })}
                  className="font-bold text-center text-xs"
                  required
                />
              </div>
            </div>

            {/* Target Scope */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">প্রযোজ্য পরিধি (Applicable Scope)</Label>
              <Select
                value={form.target_type}
                onValueChange={(val: any) => setForm({ ...form, target_type: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সব পণ্য ও ক্যাটাগরি (All Store)</SelectItem>
                  <SelectItem value="categories">নির্দিষ্ট ক্যাটাগরি (Specific Categories)</SelectItem>
                  <SelectItem value="products">নির্দিষ্ট পণ্য (Specific Product IDs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* If Categories selected */}
            {form.target_type === "categories" && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/60">
                <Label className="text-xs font-bold">ক্যাটাগরি নির্বাচন করুন:</Label>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const isChecked = form.target_categories.includes(cat);
                    return (
                      <label key={cat} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, target_categories: [...form.target_categories, cat] });
                            } else {
                              setForm({ ...form, target_categories: form.target_categories.filter(c => c !== cat) });
                            }
                          }}
                          className="rounded text-primary"
                        />
                        <span className="truncate">{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Specific Products selected */}
            {form.target_type === "products" && (
              <div className="space-y-1">
                <Label className="text-xs font-bold">প্রোডাক্ট আইডি / কোড (কমা দিয়ে লিখুন)</Label>
                <Input
                  value={form.target_products_str}
                  onChange={(e) => setForm({ ...form, target_products_str: e.target.value })}
                  placeholder="যেমন: prod-1, ECOM-93acb82a, olevs-watch"
                  className="font-mono text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">শুরুর তারিখ</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">শেষের তারিখ</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border/60">
              <Label className="text-xs font-bold">ক্যাম্পেইন সক্রিয় রাখুন</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(val) => setForm({ ...form, is_active: val })}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={savingCampaign}>
                বাতিল
              </Button>
              <Button type="submit" disabled={savingCampaign} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {savingCampaign ? "সংরক্ষণ হচ্ছে..." : "ক্যাম্পেইন সেভ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
