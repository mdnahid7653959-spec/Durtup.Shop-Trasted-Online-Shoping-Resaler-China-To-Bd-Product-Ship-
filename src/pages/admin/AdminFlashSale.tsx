import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Zap,
  Plus,
  Clock,
  Trash2,
  Edit2,
  Play,
  Pause,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Flame,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getAllCampaigns,
  createFlashSaleCampaign,
  updateFlashSaleCampaign,
  deleteFlashSaleCampaign,
  calculateTimeRemaining,
  type FlashSaleCampaign,
  type FlashSaleProductItem,
} from "@/services/flashSaleService";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminFlashSale() {
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>(getAllCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productConfigs, setProductConfigs] = useState<
    Record<string, { discountPercent: number; flashStock: number }>
  >({});

  // Reload campaigns
  const reload = () => {
    setCampaigns(getAllCampaigns());
  };

  useEffect(() => {
    const handleUpdate = () => reload();
    window.addEventListener("durtup_flash_sale_updated", handleUpdate);
    return () => window.removeEventListener("durtup_flash_sale_updated", handleUpdate);
  }, []);

  // Compute Overall Flash Sale Analytics
  const overallStats = campaigns.reduce(
    (acc, c) => {
      acc.revenue += c.analytics?.totalRevenue || 0;
      acc.orders += c.analytics?.totalOrders || 0;
      acc.unitsSold += c.analytics?.totalUnitsSold || 0;
      const totalStock = c.products?.reduce((s, p) => s + (p.flashStock || 0), 0) || 0;
      acc.allocatedStock += totalStock;
      return acc;
    },
    { revenue: 0, orders: 0, unitsSold: 0, allocatedStock: 0 }
  );

  const overallSellThroughRate =
    overallStats.allocatedStock > 0
      ? Math.round((overallStats.unitsSold / overallStats.allocatedStock) * 100)
      : 0;

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCampaignId(null);
    setTitle("Weekend Mega Flash Sale");
    setTitleBn("উইকেন্ড মেগা ফ্ল্যাশ সেল");
    setDescription("সীমিত সময়ের জন্য বিশেষ ছাড়");
    const now = new Date();
    setStartTime(now.toISOString().slice(0, 16));
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setEndTime(tomorrow.toISOString().slice(0, 16));

    // Default select first 4 seed products
    const initialIds = FAST_SEED_PRODUCTS.slice(0, 4).map((p) => p.id);
    setSelectedProductIds(initialIds);
    const initialConfigs: Record<string, { discountPercent: number; flashStock: number }> = {};
    initialIds.forEach((id) => {
      initialConfigs[id] = { discountPercent: 35, flashStock: 30 };
    });
    setProductConfigs(initialConfigs);
    setIsModalOpen(true);
  };

  // Toggle Product Selection
  const toggleProductSelect = (id: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      } else {
        setProductConfigs((configs) => ({
          ...configs,
          [id]: { discountPercent: 30, flashStock: 25 },
        }));
        return [...prev, id];
      }
    });
  };

  // Submit Campaign
  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProductIds.length === 0) {
      toast.error("অনুগ্রহ করে অন্তত ১টি পণ্য সিলেক্ট করুন");
      return;
    }

    const campaignProducts: FlashSaleProductItem[] = selectedProductIds.map((id) => {
      const p = FAST_SEED_PRODUCTS.find((item) => item.id === id) || {
        id,
        name: "Product " + id,
        slug: "product-" + id,
        image: "/placeholder.svg",
        price: 1000,
        originalPrice: 1200,
      };

      const cfg = productConfigs[id] || { discountPercent: 30, flashStock: 25 };
      const regPrice = Number(p.originalPrice || p.price) || 1000;
      const flashPrice = Math.round(regPrice * (1 - cfg.discountPercent / 100));

      return {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        image: p.image,
        regularPrice: regPrice,
        discountPercent: cfg.discountPercent,
        flashPrice,
        flashStock: cfg.flashStock,
        flashSold: 0,
      };
    });

    if (editingCampaignId) {
      updateFlashSaleCampaign(editingCampaignId, {
        title,
        titleBn,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        products: campaignProducts,
      });
      toast.success("ক্যাম্পেইন সফলভাবে আপডেট করা হয়েছে!");
    } else {
      createFlashSaleCampaign({
        title,
        titleBn,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status: "active",
        products: campaignProducts,
      });
      toast.success("নতুন ফ্ল্যাশ সেল ক্যাম্পেইন সফলভাবে চালু হয়েছে!");
    }

    setIsModalOpen(false);
    reload();
  };

  // Toggle Status (Active / Paused)
  const handleToggleStatus = (c: FlashSaleCampaign) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    updateFlashSaleCampaign(c.id, { status: newStatus });
    toast.info(`ক্যাম্পেইন স্ট্যাটাস পরিবর্তন: ${newStatus}`);
    reload();
  };

  // Delete Campaign
  const handleDelete = (id: string) => {
    if (confirm("আপনি কি নিশ্চিত এই ফ্ল্যাশ সেল ক্যাম্পেইন ডিলিট করতে চান?")) {
      deleteFlashSaleCampaign(id);
      toast.success("ক্যাম্পেইন ডিলিট করা হয়েছে");
      reload();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-red-600 fill-red-600" />
              Flash Sale Management System
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              লাইভ কাউন্টডাউন টাইমার, লিমিটেড স্টক কোটা ও অটোমেটিক এক্সপায়ারেশন সহ ফ্ল্যাশ সেল ক্যাম্পেইন পরিচালনা
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> নতুন ফ্ল্যাশ সেল তৈরি করুন
          </button>
        </div>

        {/* Analytics Top Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>মোট ফ্ল্যাশ সেল রেভিনিউ</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">
              ৳{overallStats.revenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">ফ্ল্যাশ অফার থেকে মোট আয়</p>
          </div>

          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>মোট বিক্রি হওয়া ইউনিট</span>
              <ShoppingBag className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {overallStats.unitsSold.toLocaleString()} টি
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">মোট ডিসকাউন্টেড পণ্য বিক্রয়</p>
          </div>

          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>ফ্ল্যাশ অর্ডার সংখ্যা</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {overallStats.orders.toLocaleString()} টি
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">সফল ফ্ল্যাশ সেল অর্ডার</p>
          </div>

          <div className="bg-card border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>স্টক এক্সহশন রেট (Sell-Through)</span>
              <Flame className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {overallSellThroughRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">ফ্ল্যাশ কোটা সফলভাবে বিক্রিত</p>
          </div>
        </div>

        {/* Campaign List */}
        <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b flex justify-between items-center">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              ফ্ল্যাশ সেল ক্যাম্পেইন তালিকা ({campaigns.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-3 px-4">ক্যাম্পেইন নাম</th>
                  <th className="py-3 px-4">সময়সীমা (Start - End)</th>
                  <th className="py-3 px-4">অবশিষ্ট সময়</th>
                  <th className="py-3 px-4">পণ্য সংখ্যা</th>
                  <th className="py-3 px-4">স্টক ও বিক্রয়</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaigns.map((c) => {
                  const time = calculateTimeRemaining(c.endTime);
                  const isEnded = time.isExpired || c.status === "ended";

                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-sm">{c.titleBn || c.title}</div>
                        <div className="text-[11px] text-muted-foreground">{c.title}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div>{new Date(c.startTime).toLocaleString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-muted-foreground">হতে {new Date(c.endTime).toLocaleString("bn-BD", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isEnded ? (
                          <Badge variant="outline" className="text-slate-400 bg-slate-100 dark:bg-slate-800">
                            মেয়াদ শেষ
                          </Badge>
                        ) : (
                          <div className="font-mono font-bold text-red-600">
                            {time.days > 0 ? `${time.days}d ` : ""}
                            {String(time.hours).padStart(2, "0")}:{String(time.minutes).padStart(2, "0")}:{String(time.seconds).padStart(2, "0")}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {c.products?.length || 0} টি
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold">
                          বিক্রি: {c.analytics?.totalUnitsSold || 0} টি
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          আয়: ৳{(c.analytics?.totalRevenue || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.status === "active" && !isEnded ? (
                          <Badge className="bg-red-600 text-white font-bold">সক্রিয় (Active)</Badge>
                        ) : c.status === "paused" ? (
                          <Badge className="bg-amber-500 text-white font-bold">স্থগিত (Paused)</Badge>
                        ) : (
                          <Badge variant="secondary">সমাপ্ত (Ended)</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            title={c.status === "active" ? "স্থগিত করুন" : "সক্রিয় করুন"}
                            className="p-1.5 rounded-lg border hover:bg-muted transition"
                          >
                            {c.status === "active" ? (
                              <Pause className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Campaign Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-card border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  নতুন ফ্ল্যাশ সেল ক্যাম্পেইন তৈরি
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitCampaign} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">ক্যাম্পেইনের নাম (বাংলা)</label>
                    <input
                      type="text"
                      required
                      value={titleBn}
                      onChange={(e) => setTitleBn(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                      placeholder="মেগা ফ্ল্যাশ সেল"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">ক্যাম্পেইনের নাম (English)</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                      placeholder="Mega Flash Sale"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">শুরুর সময় (Start Time)</label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-background font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">শেষের সময় (End Time)</label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-background font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">ক্যাম্পেইন বিবরণ / অফার মেসেজ</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                    placeholder="সীমিত সময়ের জন্য বাছাইকৃত জনপ্রিয় পণ্যে সর্বোচ্চ ৪০% পর্যন্ত অবিশ্বাস্য ছাড়!"
                  />
                </div>

                {/* Product Selection List */}
                <div className="space-y-2 pt-2 border-t">
                  <label className="block text-xs font-bold flex items-center justify-between">
                    <span>ফ্ল্যাশ সেলের পণ্য নির্বাচন করুন ({selectedProductIds.length} সিলেক্টেড)</span>
                    <span className="text-muted-foreground text-[10px]">ডিসকাউন্ট ও স্টক কোটা নির্ধারণ করুন</span>
                  </label>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {FAST_SEED_PRODUCTS.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      const cfg = productConfigs[p.id] || { discountPercent: 30, flashStock: 25 };
                      const flashPrice = Math.round(Number(p.price) * (1 - cfg.discountPercent / 100));

                      return (
                        <div
                          key={`select-prod-${p.id}`}
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-colors ${
                            isSelected
                              ? "border-red-500/60 bg-red-50/30 dark:bg-red-950/20"
                              : "border-border/60 bg-card hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProductSelect(p.id)}
                              className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                            />
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center p-0.5">
                              <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="text-xs font-bold line-clamp-1 text-foreground max-w-[200px] sm:max-w-xs">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                আসল মূল্য: ৳{Number(p.price).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">ছাড়:</span>
                                <input
                                  type="number"
                                  min="5"
                                  max="80"
                                  value={cfg.discountPercent}
                                  onChange={(e) =>
                                    setProductConfigs({
                                      ...productConfigs,
                                      [p.id]: {
                                        ...cfg,
                                        discountPercent: Math.max(5, parseInt(e.target.value) || 0),
                                      },
                                    })
                                  }
                                  className="w-14 px-1.5 py-1 border rounded text-xs text-center font-bold bg-background"
                                />
                                <span className="text-xs">%</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">স্টক:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="500"
                                  value={cfg.flashStock}
                                  onChange={(e) =>
                                    setProductConfigs({
                                      ...productConfigs,
                                      [p.id]: {
                                        ...cfg,
                                        flashStock: Math.max(1, parseInt(e.target.value) || 1),
                                      },
                                    })
                                  }
                                  className="w-16 px-1.5 py-1 border rounded text-xs text-center font-bold bg-background"
                                />
                              </div>

                              <div className="text-xs font-black text-red-600 ml-1">
                                ৳{flashPrice.toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-muted"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-red-700 hover:to-orange-700"
                  >
                    ক্যাম্পেইন সংরক্ষণ ও চালু করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
