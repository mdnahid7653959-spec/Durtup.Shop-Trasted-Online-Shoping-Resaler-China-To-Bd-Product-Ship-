import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Sparkles,
  Sliders,
  Save,
  RotateCcw,
  ShoppingBag,
  Eye,
  TrendingUp,
  Layers,
  Percent,
} from "lucide-react";
import {
  getRecommendationSettings,
  saveRecommendationSettings,
  getPersonalizedRecommendations,
  type RecommendationSettings,
} from "@/services/recommendationService";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { toast } from "sonner";

export default function AdminRecommendations() {
  const [settings, setSettings] = useState<RecommendationSettings>(getRecommendationSettings);
  const [previewProducts, setPreviewProducts] = useState(FAST_SEED_PRODUCTS.slice(0, 6));

  useEffect(() => {
    const list = getPersonalizedRecommendations(FAST_SEED_PRODUCTS, 6);
    setPreviewProducts(list);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecommendationSettings(settings);
    toast.success("সুপারিশ অ্যালগরিদম সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
  };

  const handleReset = () => {
    const defaultSettings: RecommendationSettings = {
      categoryAffinityWeight: 0.35,
      browsingDecayWeight: 0.25,
      purchaseAffinityWeight: 0.25,
      popularityWeight: 0.15,
      bundleDiscountPercent: 5,
      maxRecommendations: 12,
      enableColdStartFallback: true,
    };
    setSettings(defaultSettings);
    saveRecommendationSettings(defaultSettings);
    toast.info("ডিফল্ট সেটিংস রিস্টোর করা হয়েছে");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-600" />
              Smart Personalized Recommendation Engine
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              কাস্টমারের ব্রাউজিং ইতিহাস, কেনাকাটা ও ক্যাটাগরি পছন্দের উপর ভিত্তি করে স্মার্ট রেকমেন্ডেশন ও বান্ডেল অফার
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> ডিফল্ট রিস্টোর
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> সংরক্ষণ করুন
            </button>
          </div>
        </div>

        {/* Algorithm Weight Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="bg-card border rounded-2xl p-5 shadow-xs space-y-5">
              <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Sliders className="w-4 h-4 text-orange-600" />
                অ্যালগরিদম স্কোরিং প্যারামিটার (Scoring Weights)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Category Affinity */}
                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      ক্যাটাগরি আগ্রহ (Category Affinity)
                    </span>
                    <span className="text-orange-600">{Math.round(settings.categoryAffinityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.categoryAffinityWeight}
                    onChange={(e) =>
                      setSettings({ ...settings, categoryAffinityWeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-orange-600"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    কাস্টমার পূর্বে যে ক্যাটাগরিগুলো সবচেয়ে বেশি দেখেছেন বা পছন্দ করেছেন তার গুরুত্ব।
                  </p>
                </div>

                {/* 2. Browsing Decay */}
                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-500" />
                      ব্রাউজিং হিস্টোরি ওয়েট (Browsing Decay)
                    </span>
                    <span className="text-orange-600">{Math.round(settings.browsingDecayWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.browsingDecayWeight}
                    onChange={(e) =>
                      setSettings({ ...settings, browsingDecayWeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-orange-600"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    সম্প্রতি দেখা পণ্যগুলোর রিমাইন্ডার এবং পুনঃউপস্থাপনের প্রাধান্য।
                  </p>
                </div>

                {/* 3. Purchase Affinity */}
                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                      পূর্ববর্তী কেনাকাটা (Purchase Synergy)
                    </span>
                    <span className="text-orange-600">{Math.round(settings.purchaseAffinityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.purchaseAffinityWeight}
                    onChange={(e) =>
                      setSettings({ ...settings, purchaseAffinityWeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-orange-600"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    সফল ডেলিভার্ড অর্ডারকৃত পণ্যের সাথে সম্পর্কিত এক্সেসরিজ বা পরিপূরক পণ্যের অগ্রাধিকার।
                  </p>
                </div>

                {/* 4. Rating & Popularity */}
                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      পপুলারিটি ও রেটিং (Rating & Popularity)
                    </span>
                    <span className="text-orange-600">{Math.round(settings.popularityWeight * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.popularityWeight}
                    onChange={(e) =>
                      setSettings({ ...settings, popularityWeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-orange-600"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    হাই রেটিং (৪.৫+) এবং টপ সেলিং পণ্যের বেসলাইন বুস্টিং।
                  </p>
                </div>
              </div>

              {/* Bundle & Feed Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t">
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-orange-600" />
                    Frequently Bought Together বান্ডেল ছাড় (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.bundleDiscountPercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bundleDiscountPercent: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    কাস্টমার একসাথে কম্বো বান্ডেল কিনলে অতিরিক্ত ছাড় শতাংশ।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    হোমপেজে সর্বোচ্চ রেকমেন্ডেশন সংখ্যা
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="36"
                    value={settings.maxRecommendations}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxRecommendations: Math.max(4, parseInt(e.target.value) || 12),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    "Recommended For You" সেকশনে একবারে প্রদর্শিত পণ্যের সংখ্যা।
                  </p>
                </div>
              </div>

              {/* Cold-Start Toggle */}
              <div className="flex items-center justify-between p-3.5 border rounded-xl bg-muted/20">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    নতুন কাস্টমারের জন্য কোল্ড-স্টার্ট ফলব্যাক (Cold-Start Mode)
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    কোন ব্রাউজিং বা অর্ডার ইতিহাস না থাকলে সেরা বিক্রিত ও জনপ্রিয় পণ্য প্রদর্শন করবে।
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableColdStartFallback}
                  onChange={(e) =>
                    setSettings({ ...settings, enableColdStartFallback: e.target.checked })
                  }
                  className="w-4 h-4 accent-orange-600"
                />
              </div>
            </form>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <Sparkles className="w-4 h-4 text-orange-600" />
                লাইভ প্রিভিউ (Top Recommendations)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                বর্তমান অ্যালগরিদম কনফিগারেশন অনুযায়ী প্রথম ৬টি র‍্যাংকড পণ্য:
              </p>

              <div className="space-y-2.5">
                {previewProducts.map((p, idx) => (
                  <div
                    key={`prev-${p.id}-${idx}`}
                    className="flex items-center gap-2.5 p-2 rounded-xl border bg-muted/30"
                  >
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold line-clamp-1 text-foreground">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-orange-600 font-bold">
                        ৳{Number(p.price).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
