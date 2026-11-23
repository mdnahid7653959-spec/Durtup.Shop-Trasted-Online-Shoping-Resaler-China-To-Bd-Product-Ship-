import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToPriceAlert,
  checkCustomerPriceAlert,
  cancelPriceAlert,
  type PriceAlertSubscription,
} from "@/services/priceDropService";
import { toast } from "sonner";
import { getSmartProductImage } from "@/utils/productImageHelper";

interface PriceDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string | number;
    name: string;
    slug?: string;
    price?: number;
    regular_price?: number;
    image?: string;
    images?: string[];
  };
  selectedVariants?: Record<string, string>;
}

export const PriceDropModal: React.FC<PriceDropModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariants = {},
}) => {
  const { user } = useAuth();

  const currentPrice = Math.max(0, Number(product.price || product.regular_price) || 0);

  // Form states
  const [targetPrice, setTargetPrice] = useState<number>(() => {
    return Math.round(currentPrice * 0.9); // default 10% drop
  });
  const [customerName, setCustomerName] = useState(user?.displayName || (user as any)?.full_name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState((user as any)?.phone || "");
  const [channel, setChannel] = useState<"email" | "push" | "both">("both");

  // Status states
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [existingAlert, setExistingAlert] = useState<PriceAlertSubscription | null>(null);
  const [successData, setSuccessData] = useState<PriceAlertSubscription | null>(null);

  // Build clean variant label
  const variantKeys = Object.keys(selectedVariants);
  const variantLabel =
    variantKeys.length > 0
      ? variantKeys.map((k) => `${k}: ${selectedVariants[k]}`).join(", ")
      : undefined;

  const productImage =
    product.image ||
    (product.images && product.images[0]) ||
    getSmartProductImage(product as any) ||
    "/durtup-logo.png";

  // Check if customer already has an alert
  useEffect(() => {
    if (!isOpen) return;

    // Reset target price if product changes
    setTargetPrice(Math.round(currentPrice * 0.9));
    setSuccessData(null);

    const emailOrId = user?.id || user?.email || customerEmail;
    if (emailOrId) {
      checkCustomerPriceAlert(String(product.id), variantLabel, emailOrId).then((res) => {
        if (res.isSubscribed && res.subscription) {
          setExistingAlert(res.subscription);
          setTargetPrice(res.subscription.targetPrice);
        } else {
          setExistingAlert(null);
        }
      });
    }
  }, [isOpen, product.id, variantLabel, user?.id, user?.email]);

  if (!isOpen) return null;

  const savings = Math.max(0, currentPrice - targetPrice);
  const savingsPercent = currentPrice > 0 ? Math.round((savings / currentPrice) * 100) : 0;

  const quickDiscountPills = [
    { label: "-5%", percent: 0.05 },
    { label: "-10%", percent: 0.10 },
    { label: "-15%", percent: 0.15 },
    { label: "-20%", percent: 0.20 },
    { label: "-25%", percent: 0.25 },
  ];

  const handleQuickPercent = (percent: number) => {
    const newTarget = Math.round(currentPrice * (1 - percent));
    setTargetPrice(newTarget);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস দিন");
      return;
    }

    if (targetPrice <= 0) {
      toast.error("টার্গেট প্রাইস অবশ্যই ০ টাকার বেশি হতে হবে");
      return;
    }

    if (targetPrice >= currentPrice) {
      toast.error(`টার্গেট প্রাইস বর্তমান মূল্য (৳${currentPrice.toLocaleString()}) এর চেয়ে কম হতে হবে`);
      return;
    }

    setLoading(true);
    try {
      const res = await subscribeToPriceAlert({
        productId: String(product.id),
        productName: product.name,
        productSlug: product.slug || String(product.id),
        productImage,
        currentPrice,
        targetPrice,
        variantLabel,
        variantAttributes: selectedVariants,
        userId: user?.id,
        customerName: customerName || "Customer",
        customerEmail,
        customerPhone,
        channel,
      });

      if (res.success && res.subscription) {
        setSuccessData(res.subscription);
        toast.success(res.message);
      } else if (res.alreadySubscribed) {
        toast.info(res.message);
        if (res.subscription) setExistingAlert(res.subscription);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("দাম কমার অ্যালার্ট সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAlert = async () => {
    if (!existingAlert) return;
    setCancelling(true);
    try {
      const res = await cancelPriceAlert(existingAlert.id, user?.id || customerEmail);
      if (res.success) {
        toast.success(res.message);
        setExistingAlert(null);
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("অ্যালার্ট বাতিল করা যায়নি।");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-4 sm:p-5 text-white flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight flex items-center gap-1.5">
                <span>দাম কমলে জানান</span>
                <span className="text-[10px] font-bold bg-white text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Price Drop
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-white/90">
                টার্গেট মূল্যে নামলেই তাৎক্ষণিক Push ও Email নোটিফিকেশন পান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Product Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/50 border border-border/80">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-white dark:bg-card p-1 border flex items-center justify-center overflow-hidden">
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                {product.name}
              </h4>
              {variantLabel && (
                <span className="inline-block mt-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-200/60 dark:border-orange-900/40">
                  {variantLabel}
                </span>
              )}
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-muted-foreground">বর্তমান মূল্য:</span>
                <span className="text-sm sm:text-base font-black text-foreground">
                  ৳{currentPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Already Subscribed Notice */}
          {existingAlert && !successData && (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start justify-between gap-3 text-blue-900 dark:text-blue-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">আপনার প্রাইস ড্রপ অ্যালার্ট সক্রিয় রয়েছে!</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    টার্গেট মূল্য: ৳{existingAlert.targetPrice.toLocaleString()} ({existingAlert.customerEmail})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelAlert}
                disabled={cancelling}
                className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition border border-red-200 dark:border-red-900/40 shrink-0 flex items-center gap-1"
              >
                {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                <span>বাতিল</span>
              </button>
            </div>
          )}

          {/* Success Screen */}
          {successData ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                অ্যালার্ট সফলভাবে সেট করা হয়েছে!
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                পণ্যটির দাম যখনই <strong className="text-orange-600">৳{successData.targetPrice.toLocaleString()}</strong> বা তার নিচে নামবে, তখনই আপনাকে তাৎক্ষণিক নোটিফিকেশন পাঠানো হবে।
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          ) : (
            /* Target Price Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Price Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>আপনার টার্গেট মূল্য (Target Price):</span>
                    <span className="text-orange-600">*</span>
                  </label>
                  {savings > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      সাশ্রয়: ৳{savings.toLocaleString()} (-{savingsPercent}%)
                    </span>
                  )}
                </div>

                {/* Quick discount chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground mr-1">কুইক সিলেক্ট:</span>
                  {quickDiscountPills.map((pill) => {
                    const pillTarget = Math.round(currentPrice * (1 - pill.percent));
                    const isSelected = targetPrice === pillTarget;
                    return (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => handleQuickPercent(pill.percent)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                          isSelected
                            ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border-border/80"
                        }`}
                      >
                        {pill.label} (৳{pillTarget.toLocaleString()})
                      </button>
                    );
                  })}
                </div>

                {/* Custom target price input */}
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground font-black text-sm">
                    ৳
                  </div>
                  <input
                    type="number"
                    value={targetPrice || ""}
                    onChange={(e) => setTargetPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    max={currentPrice - 1}
                    min={1}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm font-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="আপনার পছন্দের মূল্য লিখুন"
                  />
                </div>
              </div>

              {/* Notification Channel Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">নোটিফিকেশন চ্যানেল:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel("both")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      channel === "both"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 font-bold shadow-xs"
                        : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5" />
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px]">উভয় (Both)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("push")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      channel === "push"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 font-bold shadow-xs"
                        : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Push Notif</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      channel === "email"
                        ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 font-bold shadow-xs"
                        : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Email Only</span>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">আপনার নাম:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="নাম লিখুন"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    ইমেইল এড্রেস <span className="text-orange-600">*</span>:
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="example@mail.com"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || targetPrice >= currentPrice || targetPrice <= 0}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>অ্যালার্ট সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>দাম কমলে আমাকে জানান (Set Alert)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
