import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp, 
  Eye, 
  MousePointerClick, 
  DollarSign, 
  ShoppingCart, 
  Target, 
  Calendar, 
  Layers, 
  CheckCircle, 
  Play, 
  Pause,
  ExternalLink,
  Sliders,
  BarChart3
} from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { logAdminActivity } from "@/services/auditLogger";
import { useToast } from "@/hooks/use-toast";

export interface AdCampaign {
  id: string;
  name: string;
  type: "sponsored_products" | "search_keyword" | "category_featured";
  daily_budget: number;
  total_budget: number;
  cpc_bid: number; // Cost per click bid in BDT
  target_keywords: string[];
  target_category?: string;
  target_product_ids?: string[];
  start_date: string;
  end_date: string;
  status: "active" | "paused" | "completed";
  // Metrics
  impressions: number;
  clicks: number;
  spend: number;
  orders: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CAMPAIGNS: AdCampaign[] = [
  {
    id: "camp-flash-deals",
    name: "Winter Electronics Sponsored Boost",
    type: "sponsored_products",
    daily_budget: 500,
    total_budget: 15000,
    cpc_bid: 3.5,
    target_keywords: ["earbuds", "smart watch", "power bank", "bluetooth"],
    target_category: "Electronics",
    start_date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    status: "active",
    impressions: 4850,
    clicks: 342,
    spend: 1197,
    orders: 14,
    revenue: 16800,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "camp-search-promo",
    name: "High-Intent Keyword Search Ads",
    type: "search_keyword",
    daily_budget: 300,
    total_budget: 9000,
    cpc_bid: 4.0,
    target_keywords: ["gadgets", "chopper", "blender", "kitchen"],
    target_category: "Kitchen & Dining",
    start_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    end_date: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
    status: "active",
    impressions: 2120,
    clicks: 185,
    spend: 740,
    orders: 9,
    revenue: 9450,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function AdminAds() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"sponsored_products" | "search_keyword" | "category_featured">("sponsored_products");
  const [formDailyBudget, setFormDailyBudget] = useState<number>(500);
  const [formTotalBudget, setFormTotalBudget] = useState<number>(10000);
  const [formCpcBid, setFormCpcBid] = useState<number>(3.5);
  const [formKeywords, setFormKeywords] = useState<string>("wireless, earbuds, smart watch");
  const [formCategory, setFormCategory] = useState<string>("Electronics");
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState<string>(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);

  // Load Campaigns
  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const list: AdCampaign[] = [];
      if (db) {
        try {
          const snap = await getDocs(collection(db, "ads_campaigns"));
          snap.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as AdCampaign);
          });
        } catch {}
      }

      if (list.length === 0) {
        const rawLocal = localStorage.getItem("durtup_ads_campaigns");
        if (rawLocal) {
          list.push(...JSON.parse(rawLocal));
        } else {
          list.push(...DEFAULT_CAMPAIGNS);
          localStorage.setItem("durtup_ads_campaigns", JSON.stringify(DEFAULT_CAMPAIGNS));
        }
      }

      setCampaigns(list);
    } catch (e) {
      console.error("Ads campaigns load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalOrders = 0;

    campaigns.forEach((c) => {
      totalSpend += c.spend || 0;
      totalRevenue += c.revenue || 0;
      totalImpressions += c.impressions || 0;
      totalClicks += c.clicks || 0;
      totalOrders += c.orders || 0;
    });

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";

    return {
      totalSpend: Math.round(totalSpend),
      totalRevenue: Math.round(totalRevenue),
      totalImpressions,
      totalClicks,
      totalOrders,
      ctr,
      roas,
    };
  }, [campaigns]);

  // Save Campaign
  const handleSaveCampaign = async () => {
    if (!formName.trim()) {
      toast({ title: "Name Required", description: "Please enter a campaign name.", variant: "destructive" });
      return;
    }

    const kwList = formKeywords.split(",").map(k => k.trim()).filter(Boolean);

    const campaignData: AdCampaign = {
      id: editingCampaign ? editingCampaign.id : `camp-${Date.now()}`,
      name: formName,
      type: formType,
      daily_budget: Number(formDailyBudget) || 500,
      total_budget: Number(formTotalBudget) || 10000,
      cpc_bid: Number(formCpcBid) || 3.0,
      target_keywords: kwList,
      target_category: formCategory,
      start_date: formStartDate,
      end_date: formEndDate,
      status: editingCampaign ? editingCampaign.status : "active",
      impressions: editingCampaign ? editingCampaign.impressions : 0,
      clicks: editingCampaign ? editingCampaign.clicks : 0,
      spend: editingCampaign ? editingCampaign.spend : 0,
      orders: editingCampaign ? editingCampaign.orders : 0,
      revenue: editingCampaign ? editingCampaign.revenue : 0,
      created_at: editingCampaign ? editingCampaign.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (db) {
        await setDoc(doc(db, "ads_campaigns", campaignData.id), campaignData);
      }
    } catch {}

    const updated = editingCampaign
      ? campaigns.map(c => c.id === campaignData.id ? campaignData : c)
      : [...campaigns, campaignData];

    setCampaigns(updated);
    localStorage.setItem("durtup_ads_campaigns", JSON.stringify(updated));

    await logAdminActivity({
      action: editingCampaign ? "UPDATE_AD_CAMPAIGN" : "CREATE_AD_CAMPAIGN",
      entity_type: "ads",
      entity_id: campaignData.id,
      entity_name: campaignData.name,
      new_value: campaignData,
      details: `Ad campaign saved with daily budget ৳${campaignData.daily_budget}`,
    });

    toast({
      title: editingCampaign ? "Campaign Updated" : "Campaign Launched",
      description: `Campaign "${campaignData.name}" has been saved.`,
    });

    setIsModalOpen(false);
    setEditingCampaign(null);
  };

  // Toggle Campaign Pause/Play
  const handleToggleStatus = async (campaign: AdCampaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    const updatedCampaign = { ...campaign, status: newStatus as any, updated_at: new Date().toISOString() };

    try {
      if (db) {
        await setDoc(doc(db, "ads_campaigns", campaign.id), updatedCampaign);
      }
    } catch {}

    const updated = campaigns.map(c => c.id === campaign.id ? updatedCampaign : c);
    setCampaigns(updated);
    localStorage.setItem("durtup_ads_campaigns", JSON.stringify(updated));

    toast({
      title: newStatus === "active" ? "Campaign Resumed" : "Campaign Paused",
      description: `Campaign "${campaign.name}" is now ${newStatus}.`,
    });
  };

  // Delete Campaign
  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;

    try {
      if (db) {
        await deleteDoc(doc(db, "ads_campaigns", id));
      }
    } catch {}

    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("durtup_ads_campaigns", JSON.stringify(updated));

    await logAdminActivity({
      action: "DELETE_AD_CAMPAIGN",
      entity_type: "ads",
      entity_id: id,
      entity_name: name,
      details: "Ad campaign removed by admin",
    });

    toast({ title: "Campaign Deleted", description: `Campaign "${name}" has been removed.` });
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormName("");
    setFormType("sponsored_products");
    setFormDailyBudget(500);
    setFormTotalBudget(10000);
    setFormCpcBid(3.5);
    setFormKeywords("wireless, earbuds, smart watch");
    setFormCategory("Electronics");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (camp: AdCampaign) => {
    setEditingCampaign(camp);
    setFormName(camp.name);
    setFormType(camp.type);
    setFormDailyBudget(camp.daily_budget);
    setFormTotalBudget(camp.total_budget);
    setFormCpcBid(camp.cpc_bid);
    setFormKeywords(camp.target_keywords.join(", "));
    setFormCategory(camp.target_category || "Electronics");
    setFormStartDate(camp.start_date);
    setFormEndDate(camp.end_date);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Ads & Sponsored Products Manager">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Ads & Campaigns Manager
              </h1>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                Active Engine
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Internal sponsored product ads, keyword targeting, CPC bids, and real ROAS performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openCreateModal} className="h-8 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create Ad Campaign
            </Button>
          </div>
        </div>

        {/* 4 Summary Performance KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Total Ad Spend</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ৳{summary.totalSpend.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {summary.totalClicks.toLocaleString()} total clicks generated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Attributed Sales</span>
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ৳{summary.totalRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {summary.totalOrders} orders directly converted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Return On Ad Spend (ROAS)</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary.roas}x
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                ৳{summary.roas} earned per ৳1 ad spend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Click-Through Rate (CTR)</span>
              <MousePointerClick className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {summary.ctr}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {summary.totalImpressions.toLocaleString()} views served
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Campaigns & Sponsored Products</CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of on-site sponsored placements and search boosts
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {campaigns.length} Campaigns
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left font-medium py-2.5 px-4">Campaign Name</th>
                    <th className="text-left font-medium py-2.5 px-4">Status</th>
                    <th className="text-right font-medium py-2.5 px-4">Daily Budget</th>
                    <th className="text-right font-medium py-2.5 px-4">CPC Bid</th>
                    <th className="text-right font-medium py-2.5 px-4">Impressions</th>
                    <th className="text-right font-medium py-2.5 px-4">Clicks</th>
                    <th className="text-right font-medium py-2.5 px-4">Spend</th>
                    <th className="text-right font-medium py-2.5 px-4">Sales / ROAS</th>
                    <th className="text-right font-medium py-2.5 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((camp) => {
                    const roas = camp.spend > 0 ? (camp.revenue / camp.spend).toFixed(1) : "0.0";
                    return (
                      <tr key={camp.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{camp.name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{camp.type.replace("_", " ")}</span>
                            <span>•</span>
                            <span>{camp.start_date} to {camp.end_date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              camp.status === "active" 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {camp.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          ৳{camp.daily_budget.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          ৳{camp.cpc_bid}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {camp.impressions.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-primary">
                          {camp.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          ৳{camp.spend.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ৳{camp.revenue.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-semibold text-purple-600">
                            {roas}x ROAS
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => handleToggleStatus(camp)}
                            title={camp.status === "active" ? "Pause Campaign" : "Resume Campaign"}
                          >
                            {camp.status === "active" ? (
                              <Pause className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => openEditModal(camp)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-rose-500"
                            onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* External Ad Integrations Adapter Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">External Ad Platform Adapters</CardTitle>
            <CardDescription className="text-xs">
              Direct tracking connectors for Google Ads, Facebook Conversions API, and TikTok
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border bg-muted/20 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Meta / Facebook Pixel</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ViewContent, AddToCart, Purchase webhooks
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Connected (Pixel ID Active)
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Google Ads Conversion</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Enhanced e-commerce purchase tracking
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px] bg-muted text-muted-foreground">
                    Ready for Tag ID
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">TikTok Ads Pixel</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Event tracking adapter
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px] bg-muted text-muted-foreground">
                    Adapter Installed
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Campaign Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingCampaign ? "Edit Campaign" : "Create New Ad Campaign"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure budget, keywords, and CPC bids for internal product promotion.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs">Campaign Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Flash Deals Sponsored Campaign"
                  className="h-8 mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ad Type</Label>
                  <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                    <SelectTrigger className="h-8 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sponsored_products" className="text-xs">Sponsored Products</SelectItem>
                      <SelectItem value="search_keyword" className="text-xs">Search Keywords</SelectItem>
                      <SelectItem value="category_featured" className="text-xs">Category Banner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Target Category</Label>
                  <Input
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Electronics"
                    className="h-8 mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Target Keywords (comma-separated)</Label>
                <Input
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="earbuds, smart watch, bluetooth"
                  className="h-8 mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Daily Budget (৳)</Label>
                  <Input
                    type="number"
                    value={formDailyBudget}
                    onChange={(e) => setFormDailyBudget(Number(e.target.value))}
                    className="h-8 mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Total Budget (৳)</Label>
                  <Input
                    type="number"
                    value={formTotalBudget}
                    onChange={(e) => setFormTotalBudget(Number(e.target.value))}
                    className="h-8 mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">CPC Bid (৳)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formCpcBid}
                    onChange={(e) => setFormCpcBid(Number(e.target.value))}
                    className="h-8 mt-1 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="h-8 mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="h-8 mt-1 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveCampaign}>
                Save Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
