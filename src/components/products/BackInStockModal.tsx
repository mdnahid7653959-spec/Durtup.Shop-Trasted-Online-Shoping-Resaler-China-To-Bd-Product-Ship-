import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellRing, CheckCircle2, Mail, Smartphone, AlertCircle, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToStockAlert,
  checkCustomerStockAlert,
  cancelStockAlert,
  type StockAlertSubscription,
} from "@/services/backInStockService";
import { SafeProductImage } from "@/components/products/SafeProductImage";
import { toast } from "sonner";

export interface BackInStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    slug?: string;
    image?: string;
    price: number;
    originalPrice?: number;
    [key: string]: any;
  };
  selectedVariants?: Record<string, string>;
  onSubscribed?: (sub: StockAlertSubscription) => void;
}

export const BackInStockModal: React.FC<BackInStockModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariants = {},
  onSubscribed,
}) => {
  const { user, profile } = useAuth();

  const variantLabel = Object.entries(selectedVariants).length > 0
    ? Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(", ")
    : undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"both" | "email" | "push">("both");
  const [loading, setLoading] = useState(false);
  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);
  const [existingSubscription, setExistingSubscription] = useState<StockAlertSubscription | null>(null);

  // Initialize auto-filled fields when opened
  useEffect(() => {
    if (isOpen) {
      const defaultName = (profile as any)?.full_name || (user as any)?.displayName || "";
      const defaultEmail = user?.email || (profile as any)?.email || "";
      const defaultPhone = (profile as any)?.phone || "";
      setName(defaultName);
      setEmail(defaultEmail);
      setPhone(defaultPhone);

      // Check duplicate
      const identifier = user?.id || defaultEmail;
      if (identifier) {
        checkCustomerStockAlert(String(product.id), variantLabel, identifier).then((res) => {
          setIsAlreadySubscribed(res.isSubscribed);
          setExistingSubscription(res.subscription || null);
        });
      }
    }
  }, [isOpen, user, profile, product.id, variantLabel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস প্রদান করুন");
      return;
    }

    setLoading(true);
    try {
      const res = await subscribeToStockAlert({
        productId: String(product.id),
        productName: product.name,
        productSlug: product.slug || String(product.id),
        productImage: product.image || (product as any).image_url || "/durtup-logo.png",
        productPrice: Number(product.price || 0),
        variantAttributes: selectedVariants,
        variantLabel,
        userId: user?.id,
        customerName: name || "Customer",
        customerEmail: email,
        customerPhone: phone,
        channel,
      });

      if (res.success && res.subscription) {
        toast.success(res.message);
        setIsAlreadySubscribed(true);
        setExistingSubscription(res.subscription);
        onSubscribed?.(res.subscription);
        setTimeout(() => onClose(), 1500);
      } else if (res.alreadySubscribed) {
        toast.info(res.message);
        setIsAlreadySubscribed(true);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error("সাবস্ক্রাইব করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!existingSubscription?.id) return;
    setLoading(true);
    try {
      await cancelStockAlert(existingSubscription.id);
      setIsAlreadySubscribed(false);
      setExistingSubscription(null);
      toast.success("স্টক অ্যালার্ট সাবস্ক্রিপশন বাতিল করা হয়েছে");
    } catch {
      toast.error("বাতিল করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
        {/* Header with vibrant urgency accent */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
                <BellRing className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-white">
                  স্টকে এলে আমাকে জানান
                </DialogTitle>
                <DialogDescription className="text-xs text-white/90 font-medium">
                  পণ্যটি পুনরায় স্টকে আসার সাথে সাথে সবার আগে অ্যালার্ট পান
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Mini Product Snapshot */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/60 border border-border/60">
            <div className="w-16 h-16 rounded-lg bg-background p-1 flex items-center justify-center shrink-0 border border-border/40 overflow-hidden">
              <SafeProductImage
                product={product}
                width={80}
                height={80}
                fit="contain"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                {product.name}
              </h4>
              {variantLabel && (
                <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                  ভ্যারিয়েন্ট: {variantLabel}
                </div>
              )}
              <div className="text-xs font-bold text-muted-foreground mt-0.5">
                মূল্য: <span className="text-foreground font-black">৳{Number(product.price).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Already Subscribed State */}
          {isAlreadySubscribed ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                  আপনি ইতিমধ্যে সাবস্ক্রাইব করেছেন!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                  পণ্যটি স্টকে আসা মাত্রই <strong>{existingSubscription?.customerEmail || email}</strong> ঠিকানায় নোটিফিকেশন পৌঁছে যাবে।
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  সাবস্ক্রিপশন বাতিল করুন
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-xs bg-primary text-primary-foreground font-bold"
                >
                  ঠিক আছে
                </Button>
              </div>
            </div>
          ) : (
            /* Subscription Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="bis-name" className="text-xs font-medium text-foreground">
                  আপনার নাম (Name)
                </Label>
                <Input
                  id="bis-name"
                  type="text"
                  placeholder="যেমন: মোঃ সাকিব হোসেন"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <Label htmlFor="bis-email" className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>ইমেইল এড্রেস (Email Address) *</span>
                  <span className="text-[10px] text-muted-foreground">বাধ্যতামূলক</span>
                </Label>
                <div className="relative">
                  <Input
                    id="bis-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs pl-8 rounded-xl"
                    required
                  />
                  <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <Label htmlFor="bis-phone" className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>মোবাইল নম্বর (Phone / WhatsApp)</span>
                  <span className="text-[10px] text-muted-foreground">ঐচ্ছিক</span>
                </Label>
                <div className="relative">
                  <Input
                    id="bis-phone"
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs pl-8 rounded-xl"
                  />
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Channel Selector */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-medium text-foreground">
                  নোটিফিকেশন চ্যানেল বেছে নিন:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel("both")}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center transition ${
                      channel === "both"
                        ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-600 dark:text-orange-400"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    ইমেইল + পুশ
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center transition ${
                      channel === "email"
                        ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-600 dark:text-orange-400"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    শুধু ইমেইল
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("push")}
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold text-center transition ${
                      channel === "push"
                        ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-600 dark:text-orange-400"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    শুধু পুশ
                  </button>
                </div>
              </div>

              {/* Privacy badge */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>আমরা কোনো স্প্যাম পাঠাই না। কেবল পণ্যটি স্টকে এলেই জানানো হবে।</span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      অনুরোধ সংরক্ষণ হচ্ছে...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Bell className="w-4 h-4 fill-current" />
                      নোটিফিকেশন সেট করুন
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
