import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Camera, 
  Save, 
  Store, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  LogOut, 
  Wallet, 
  BellRing, 
  Trash2, 
  ChevronRight, 
  Package, 
  Heart, 
  Sparkles, 
  MessageCircle, 
  HelpCircle,
  ExternalLink,
  Shield,
  Check,
  Building,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSellerStatus } from "@/hooks/useSellerStatus";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/lib/firebaseAdapter";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCard } from "@/components/products/ProductCard";
import { getCustomerStockAlerts, cancelStockAlert, BACK_IN_STOCK_EVENT, type StockAlertSubscription } from "@/services/backInStockService";
import {
  getCustomerPriceAlerts,
  cancelPriceAlert,
  PRICE_DROP_EVENT,
  type PriceAlertSubscription,
} from "@/services/priceDropService";
import { ModernRadialLoader } from "@/components/common/ModernRadialLoader";
import { cn } from "@/lib/utils";

export default function Account() {
  const { user, profile, loading, signOut } = useAuth();
  const { status: sellerStatus, sellerInfo, isApprovedSeller, isPendingSeller } = useSellerStatus();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "profile";

  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [stockAlerts, setStockAlerts] = useState<StockAlertSubscription[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertSubscription[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = () => {
      getCustomerStockAlerts(user.id, user.email).then(setStockAlerts);
      getCustomerPriceAlerts(user.id || user.email).then(setPriceAlerts);
    };
    fetchAlerts();
    window.addEventListener(BACK_IN_STOCK_EVENT, fetchAlerts);
    window.addEventListener(PRICE_DROP_EVENT, fetchAlerts);
    return () => {
      window.removeEventListener(BACK_IN_STOCK_EVENT, fetchAlerts);
      window.removeEventListener(PRICE_DROP_EVENT, fetchAlerts);
    };
  }, [user]);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      toast({ title: "সফলভাবে লগআউট হয়েছে", description: "Logged out successfully" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "লগআউট ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setLoggingOut(false);
    }
  };

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Address fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [savingAddress, setSavingAddress] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);

  // Password reset via email
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone((profile as any).phone || "");
      setAvatarUrl(profile.avatar_url || user?.photoURL || "");
    }
  }, [profile, user]);

  // Load default address from DB
  useEffect(() => {
    const loadAddress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();

      if (data) {
        setDefaultAddressId(data.id);
        setAddress(data.address_line1 || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZipCode(data.postal_code || "");
        setCountry(data.country || "Bangladesh");
      }
    };
    loadAddress();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (dbError) throw dbError;

      setAvatarUrl(publicUrl);
      toast({ title: "Profile photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved successfully."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    setSavingAddress(true);
    try {
      if (defaultAddressId) {
        const { error } = await supabase
          .from("addresses")
          .update({
            address_line1: address,
            city: city,
            state: state,
            postal_code: zipCode,
            country: country || "Bangladesh",
            updated_at: new Date().toISOString()
          })
          .eq("id", defaultAddressId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
            address_line1: address,
            city: city,
            state: state,
            postal_code: zipCode,
            country: country || "Bangladesh",
            is_default: true,
            full_name: fullName || user.email?.split("@")[0] || "User",
            phone: phone || ""
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setDefaultAddressId(data.id);
      }
      toast({ title: "Address saved!", description: "Your delivery address has been updated." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSendResetEmail = async () => {
    const targetEmail = user?.email;
    if (!targetEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No registered email found for this account."
      });
      return;
    }

    setSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetEmailSent(true);
      toast({
        title: "Verification email sent!",
        description: `Check your Gmail inbox (${targetEmail}) for the password reset link.`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: error.message || "Could not send verification email."
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ModernRadialLoader size="lg" label="লোড হচ্ছে..." showBrand />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pendingAlertsCount = stockAlerts.filter(s => s.status === "pending").length + priceAlerts.filter(p => p.status === "active").length;

  const navTabs = [
    { id: "profile", label: "প্রোফাইল তথ্য", english: "Profile Details", icon: User },
    { id: "address", label: "ডেলিভারি ঠিকানা", english: "Delivery Address", icon: MapPin },
    { id: "password", label: "লগইন ও সিকিউরিটি", english: "Password & Security", icon: ShieldCheck },
    { 
      id: "recently-viewed", 
      label: "ব্রাউজিং হিস্টোরি", 
      english: "Recently Viewed", 
      icon: Clock, 
      count: recentlyViewed.length 
    },
    { 
      id: "stock-alerts", 
      label: "স্টক ও প্রাইস অ্যালার্ট", 
      english: "Alerts & Notifications", 
      icon: BellRing, 
      count: pendingAlertsCount 
    },
  ];

  const displayEmail = user.email?.endsWith("@durtup.shop") ? user.email.split("@")[0] : user.email;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
      <Header />

      <main className="flex-1 py-4 sm:py-6 lg:py-8 pb-24 md:pb-12">
        <div className="container max-w-6xl px-3 sm:px-4 space-y-6">

          {/* Profile Identity Hero Banner */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs overflow-hidden">
            {/* Subtle brand tint glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* User Avatar + Identity Info */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-sm ring-4 ring-orange-500/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{fullName ? fullName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}</span>
                    )}
                  </div>
                  {/* Camera Upload Overlay */}
                  <label 
                    className="absolute -bottom-1 -right-1 p-1.5 sm:p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95 touch-manipulation"
                    title="Change profile photo"
                  >
                    {uploadingAvatar ? (
                      <span className="block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
                      {fullName || "Valued Shopper"}
                    </h1>
                    <Badge variant="secondary" className="text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-orange-600" />
                      <span>Verified Shopper</span>
                    </Badge>
                    {isApprovedSeller && (
                      <Badge className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        <span>রিসেলার পার্টনার</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px] sm:max-w-none">{displayEmail}</span>
                    </span>
                    {phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Hub Shortcuts & Logout */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 text-xs font-semibold border-border/80 hover:bg-muted/60"
                >
                  <Link to="/orders">
                    <Package className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
                    <span>অর্ডারসমূহ</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 text-xs font-semibold border-border/80 hover:bg-muted/60"
                >
                  <Link to="/wishlist">
                    <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                    <span>উইশলিস্ট</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-xl h-9 text-xs font-semibold border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  <span>{loggingOut ? "লগআউট..." : "লগআউট"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Navigation Menu & Helpdesk (Desktop Sidebar) */}
            <div className="lg:col-span-4 space-y-4">

              {/* Mobile Tab Scroll (Visible only on mobile/tablet) */}
              <div className="lg:hidden overflow-x-auto scrollbar-none -mx-3 px-3">
                <div className="flex items-center gap-1.5 min-w-max pb-1">
                  {navTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={cn(
                          "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation cursor-pointer",
                          isActive
                            ? "bg-orange-600 text-white shadow-xs"
                            : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-muted-foreground")} />
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                          <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                            isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                          )}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Vertical Nav Card */}
              <div className="hidden lg:block rounded-2xl border border-border/80 bg-card p-2 shadow-xs space-y-1">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  একাউন্ট মেনু
                </div>

                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSearchParams({ tab: tab.id })}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group cursor-pointer",
                        isActive
                          ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-800/50 shadow-2xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-muted/60 hover:text-foreground font-medium"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive
                            ? "bg-orange-600 text-white"
                            : "bg-muted text-muted-foreground group-hover:text-foreground"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs leading-tight truncate">{tab.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{tab.english}</p>
                        </div>
                      </div>

                      {tab.count !== undefined && tab.count > 0 ? (
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                          isActive
                            ? "bg-orange-600 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {tab.count}
                        </span>
                      ) : (
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",
                          isActive
                            ? "text-orange-600 translate-x-0.5"
                            : "text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Support & Reseller Promo Card */}
              <div className="hidden lg:block rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">রিসেলার পার্টনার প্রোগ্রাম</h4>
                    <p className="text-[11px] text-muted-foreground">বিনা পুঁজিতে অনলাইন ব্যবসা</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ফেসবুকে পণ্য বিক্রি করে প্রতি অর্ডারে লাভ করুন। সম্পূর্ণ ফ্রি রেজিস্ট্রেশন।
                </p>
                <Button
                  asChild
                  size="sm"
                  className="w-full rounded-xl text-xs font-semibold h-8 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                >
                  <Link to="/reseller">
                    <span>রিসেলার ড্যাশবোর্ড দেখুন</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Need Help Card */}
              <div className="hidden lg:block rounded-2xl border border-border/80 bg-muted/30 p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-foreground">কাস্টমার সাপোর্ট</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিম ২৪/৭ প্রস্তুত রয়েছে।
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href="https://wa.me/8801885985097"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="tel:01885985097"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>01885985097</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Right Column: Tab Content */}
            <div className="lg:col-span-8 space-y-4">

              {/* TAB 1: Profile Information */}
              {currentTab === "profile" && (
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                  <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold">ব্যক্তিগত প্রোফাইল (Profile)</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          আপনার নাম এবং যোগাযোগের তথ্য আপডেট করুন।
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                          পূর্ণ নাম (Full Name)
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10 h-10 rounded-xl text-sm"
                            placeholder="আপনার নাম লিখুন"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                          মোবাইল নম্বর (Phone Number)
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10 h-10 rounded-xl text-sm"
                            placeholder="+880 1XXX-XXXXXX"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                          ইমেইল এড্রেস (Registered Email)
                        </Label>
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> ভেরিফাইড একাউন্ট
                        </span>
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={user.email || ""}
                          disabled
                          className="pl-10 bg-muted/60 h-10 rounded-xl text-sm font-mono text-muted-foreground"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        নিরাপত্তাজনিত কারণে রেজিস্টার্ড ইমেইল পরিবর্তনযোগ্য নয়।
                      </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "সংরক্ষণ হচ্ছে..." : "তথ্য সংরক্ষণ করুন (Save Changes)"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 2: Delivery Address */}
              {currentTab === "address" && (
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                  <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold">ডেলিভারি ঠিকানা (Delivery Address)</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            চেকআউটের সময় এই ঠিকানাটি স্বয়ংক্রিয়ভাবে ব্যবহার করা হবে।
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200">
                        ডিফল্ট ঠিকানা
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Street Address */}
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-semibold text-foreground">
                        পূর্ণ ঠিকানা / বাসা ও রোড নং (Street Address)
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="pl-10 min-h-[85px] rounded-xl text-sm"
                          placeholder="বাসা নং, রোড নং, এলাকা/থানা, জেলা"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* City */}
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs font-semibold text-foreground">
                          শহর / জেলা (City / District)
                        </Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="যেমন: ঢাকা, চট্টগ্রাম, রংপুর"
                            className="pl-10 h-10 rounded-xl text-sm"
                          />
                        </div>
                      </div>

                      {/* State / Division */}
                      <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs font-semibold text-foreground">
                          বিভাগ (Division)
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="state"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            placeholder="যেমন: ঢাকা বিভাগ"
                            className="pl-10 h-10 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Postal Code */}
                      <div className="space-y-1.5">
                        <Label htmlFor="zipCode" className="text-xs font-semibold text-foreground">
                          পোস্ট কোড (Postal Code)
                        </Label>
                        <Input
                          id="zipCode"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="যেমন: 1209"
                          className="h-10 rounded-xl text-sm"
                        />
                      </div>

                      {/* Country */}
                      <div className="space-y-1.5">
                        <Label htmlFor="country" className="text-xs font-semibold text-foreground">
                          দেশ (Country)
                        </Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="Bangladesh"
                            className="pl-10 h-10 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        onClick={handleSaveAddress}
                        disabled={savingAddress}
                        className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {savingAddress ? "সংরক্ষণ হচ্ছে..." : "ঠিকানা সংরক্ষণ করুন (Save Address)"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 3: Password & Security */}
              {currentTab === "password" && (
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                  <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold">লগইন ও পাসওয়ার্ড সিকিউরিটি (Security)</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          আপনার একাউন্টের নিরাপত্তার জন্য জিমেইল ভেরিফিকেশনের মাধ্যমে পাসওয়ার্ড পরিবর্তন করুন।
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {resetEmailSent ? (
                      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center max-w-lg mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-base text-foreground">
                          ভেরিফিকেশন ইমেইল পাঠানো হয়েছে!
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          আমরা <span className="font-semibold text-foreground">{user?.email}</span> এ একটি নিরাপদ পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। আপনার ইনবক্স (অথবা স্প্যাম ফোল্ডার) চেক করে নতুন পাসওয়ার্ড সেট করুন।
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                          <a
                            href="https://mail.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-xs"
                          >
                            <Mail className="h-4 w-4" />
                            <span>Gmail ইনবক্স খুলুন</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendResetEmail}
                            disabled={sendingResetEmail}
                            className="rounded-xl text-xs font-semibold"
                          >
                            {sendingResetEmail ? "পুনরায় পাঠানো হচ্ছে..." : "আবার লিংক পাঠান"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-lg">
                        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            রেজিস্টার্ড জিমেইল একাউন্ট
                          </span>
                          <div className="flex items-center gap-2 font-mono font-semibold text-sm text-foreground">
                            <Mail className="h-4 w-4 text-orange-600" />
                            <span>{user?.email || "No email available"}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          নিচের বাটনে ক্লিক করলে আপনার জিমেইলে একটি নিরাপদ ভেরিফিকেশন লিংক পাঠানো হবে। লিংকে ক্লিক করে তাৎক্ষণিক আপনার নতুন পাসওয়ার্ড সেট করতে পারবেন।
                        </p>

                        <Button
                          onClick={handleSendResetEmail}
                          disabled={sendingResetEmail || !user?.email}
                          className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Mail className="w-4 h-4" />
                          <span>{sendingResetEmail ? "লিংক পাঠানো হচ্ছে..." : "জিমেইলে পাসওয়ার্ড রিসেট লিংক পাঠান"}</span>
                        </Button>
                      </div>
                    )}

                    {/* Security Recommendations Card */}
                    <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40 space-y-2 mt-6">
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-xs">
                        <Shield className="w-4 h-4" />
                        <span>অ্যাকাউন্ট সিকিউরিটি টিপস</span>
                      </div>
                      <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                        <li>কখনোই আপনার পাসওয়ার্ড বা কোনো ওটিপি অন্য কারো সাথে শেয়ার করবেন না।</li>
                        <li>সর্বদা অন্তত ৮ অক্ষরের শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।</li>
                        <li>পাবলিক কম্পিউটারে লগইন করার পর অবশ্যই লগআউট করতে ভুলবেন না।</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 4: Recently Viewed (Viewing History) */}
              {currentTab === "recently-viewed" && (
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                  <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold">ব্রাউজিং হিস্টোরি (Recently Viewed)</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            আপনার সম্প্রতি দেখা পণ্যের তালিকা (মোট {recentlyViewed.length}টি পণ্য)
                          </CardDescription>
                        </div>
                      </div>

                      {recentlyViewed.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await clearRecentlyViewed();
                            toast({ title: "সফল", description: "হিস্টোরি মুছে ফেলা হয়েছে" });
                          }}
                          className="rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/20 h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span>হিস্টোরি মুছুন</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    {recentlyViewed.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-sm text-foreground">
                          কোনো ব্রাউজিং হিস্টোরি পাওয়া যায়নি
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          আপনি যেকোনো পণ্য ব্রাউজ করলে তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত থাকবে।
                        </p>
                        <Button asChild className="rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white h-9 px-4">
                          <Link to="/products">পণ্য ব্রাউজ করুন</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {recentlyViewed.map((prod, idx) => (
                          <ProductCard key={prod.id || idx} product={prod as any} index={idx} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* TAB 5: Stock & Price Alerts */}
              {currentTab === "stock-alerts" && (
                <Card className="rounded-2xl border border-border/80 shadow-xs">
                  <CardHeader className="p-4 sm:p-6 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center shrink-0">
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold">স্টক ও প্রাইস ড্রপ অ্যালার্ট (Alerts)</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          যেসব পণ্যের স্টক বা দাম কমার জন্য নোটিফিকেশন সেট করেছেন তার তালিকা।
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {stockAlerts.length === 0 && priceAlerts.length === 0 ? (
                      <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                          <BellRing className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-sm text-foreground">
                          কোনো সক্রিয় অ্যালার্ট নেই
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          যেকোনো আউট-অব-স্টক বা প্রিয় পণ্যের পেজে "Notify Me" বাটনে ক্লিক করে অ্যালার্ট চালু করতে পারেন।
                        </p>
                        <Button asChild className="rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white h-9 px-4">
                          <Link to="/products">পণ্য ব্রাউজ করুন</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Stock Alerts list */}
                        {stockAlerts.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-muted p-1 shrink-0 overflow-hidden border">
                                <img
                                  src={sub.productImage || "/durtup-logo.png"}
                                  alt={sub.productName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/durtup-logo.png";
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  to={`/product/${sub.productSlug || sub.productId}`}
                                  className="font-bold text-xs sm:text-sm text-foreground hover:text-orange-600 transition truncate block"
                                >
                                  {sub.productName}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-foreground">
                                    ৳{Number(sub.productPrice).toLocaleString()}
                                  </span>
                                  {sub.variantLabel && (
                                    <span className="text-[10px] text-orange-600 font-semibold">
                                      • {sub.variantLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                              {sub.status === "notified" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px]">
                                  <Check className="w-3 h-3 mr-1" />
                                  স্টক এসেছে
                                </Badge>
                              ) : sub.status === "pending" ? (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[10px]">
                                  <Clock className="w-3 h-3 mr-1" />
                                  অপেক্ষায় রয়েছে
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 text-[10px]">
                                  বাতিল
                                </Badge>
                              )}

                              {sub.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await cancelStockAlert(sub.id);
                                    toast({ title: "সফল", description: "স্টক অ্যালার্ট বাতিল করা হয়েছে" });
                                    if (user) getCustomerStockAlerts(user.id, user.email).then(setStockAlerts);
                                  }}
                                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  বাতিল
                                </Button>
                              )}

                              <Button
                                asChild
                                size="sm"
                                className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                              >
                                <Link to={`/product/${sub.productSlug || sub.productId}`}>
                                  দেখুন
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
