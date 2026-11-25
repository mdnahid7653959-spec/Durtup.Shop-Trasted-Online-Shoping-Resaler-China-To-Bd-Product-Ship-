import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { User, Mail, Phone, MapPin, Lock, Camera, Save, Eye, EyeOff, Store, Clock, CheckCircle, ShieldCheck, LogOut, Wallet, Share2, Gift, BellRing, TrendingDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  deletePriceAlert,
  PRICE_DROP_EVENT,
  type PriceAlertSubscription,
} from "@/services/priceDropService";
import { ModernRadialLoader } from "@/components/common/ModernRadialLoader";

export default function Account() {
  const { user, profile, loading, signOut } = useAuth();
  const { status: sellerStatus, sellerInfo, isApprovedSeller, isPendingSeller, hasApplied } = useSellerStatus();
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
  const [country, setCountry] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const [savingAddress, setSavingAddress] = useState(false);
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone((profile as any).phone || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

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
    // Force light theme
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
        description: "Your profile information has been saved."
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

  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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
        <ModernRadialLoader size="lg" label="Loading..." showBrand />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-4 sm:py-6 lg:py-8 pb-24 md:pb-8">
        <div className="container max-w-4xl px-3 sm:px-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Account Settings</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>লগআউট (Logout)</span>
            </Button>
          </div>

          <Tabs value={currentTab} onValueChange={(val) => setSearchParams({ tab: val })} className="space-y-4 sm:space-y-6">
            {/* Mobile-friendly horizontal scroll tabs */}
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="grid w-full grid-cols-6 min-w-[580px] h-10 sm:h-11">
                <TabsTrigger value="profile" className="text-[11px] sm:text-sm px-2 sm:px-3">Profile</TabsTrigger>
                <TabsTrigger value="address" className="text-[11px] sm:text-sm px-2 sm:px-3">Address</TabsTrigger>
                <TabsTrigger value="password" className="text-[11px] sm:text-sm px-2 sm:px-3">Password</TabsTrigger>
                <TabsTrigger value="recently-viewed" className="text-[11px] sm:text-sm px-2 sm:px-3 flex items-center gap-1">
                  <span>Viewing History</span>
                  {recentlyViewed.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {recentlyViewed.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="stock-alerts" className="text-[11px] sm:text-sm px-2 sm:px-3 flex items-center gap-1">
                  <span>Stock Alerts</span>
                  {stockAlerts.filter(s => s.status === "pending").length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {stockAlerts.filter(s => s.status === "pending").length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-0 sm:border shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  {/* Avatar - Centered on mobile */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-4 ring-primary/10">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 shadow-lg touch-manipulation active:scale-95 cursor-pointer">
                        {uploadingAvatar ? (
                          <span className="block w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-sm sm:text-base">{fullName || "Your Name"}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{profile?.phone || (user.email?.endsWith("@durtup.shop") ? user.email.split("@")[0] : user.email)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="fullName" className="text-xs sm:text-sm">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-11 sm:h-10 text-sm"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={user.email || ""}
                          disabled
                          className="pl-10 bg-muted h-11 sm:h-10 text-sm"
                        />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-11 sm:h-10 text-sm"
                          placeholder="+880 1XXX-XXXXXX"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold touch-manipulation active:scale-[0.98]"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address Tab */}
            <TabsContent value="address">
              <Card className="border-0 sm:border shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">Delivery Address</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">This address will be auto-filled during checkout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="grid gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="address" className="text-xs sm:text-sm">Street Address / House & Road</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="pl-10 min-h-[70px] sm:min-h-[80px] text-sm"
                          placeholder="House #, Road #, Area / Thana, District"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="city" className="text-xs sm:text-sm">City / District</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Dhaka, Chittagong"
                          className="h-11 sm:h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="state" className="text-xs sm:text-sm">Division / State</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="e.g. Dhaka Division"
                          className="h-11 sm:h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="zipCode" className="text-xs sm:text-sm">Postal Code</Label>
                        <Input
                          id="zipCode"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="e.g. 1209"
                          className="h-11 sm:h-10 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="country" className="text-xs sm:text-sm">Country</Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Bangladesh"
                          className="h-11 sm:h-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
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
                    }}
                    className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold touch-manipulation active:scale-[0.98]"
                    disabled={savingAddress}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingAddress ? "Saving Address..." : "Save Address"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card className="border-0 sm:border shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Change Password via Email
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    For your account security, a password reset verification link will be sent to your registered Gmail address.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  {resetEmailSent ? (
                    <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-base text-foreground">
                        Verification Email Sent!
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        We have sent a secure password reset link to <span className="font-semibold text-foreground">{user?.email}</span>. Check your inbox (or spam folder) and click the link to set your new password.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <a
                          href="https://mail.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          <Mail className="h-4 w-4" /> Open Gmail Inbox
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSendResetEmail}
                          disabled={sendingResetEmail}
                          className="text-xs"
                        >
                          {sendingResetEmail ? "Resending..." : "Resend Link"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      <div className="p-3.5 rounded-xl bg-muted/50 border space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Registered Gmail Address
                        </span>
                        <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                          <Mail className="h-4 w-4 text-primary" />
                          <span>{user?.email || "No email available"}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Click the button below and we will send a password change link to your Gmail. You can then verify your identity and set a new password safely.
                      </p>

                      <Button
                        onClick={handleSendResetEmail}
                        className="w-full sm:w-auto h-11 sm:h-10 text-sm font-semibold touch-manipulation active:scale-[0.98] bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                        disabled={sendingResetEmail || !user?.email}
                      >
                        <Mail className="w-4 h-4" />
                        {sendingResetEmail ? "Sending Link..." : "Send Verification Link to Gmail"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Viewing History Tab */}
            <TabsContent value="recently-viewed">
              <Card className="border-0 sm:border shadow-sm">
                <CardHeader className="p-4 sm:p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        ব্রাউজিং হিস্টোরি (Recently Viewed)
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        আপনার সম্প্রতি দেখা পণ্যের তালিকা (সর্বশেষ দেখা পণ্য প্রথমে)
                      </CardDescription>
                    </div>
                    {recentlyViewed.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await clearRecentlyViewed();
                          toast({ title: "সফল", description: "হিস্টোরি মুছে ফেলা হয়েছে" });
                        }}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        হিস্টোরি মুছুন
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {recentlyViewed.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed bg-muted/20">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <Clock className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">
                        কোনো ব্রাউজিং হিস্টোরি নেই
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                        আপনি যেকোনো পণ্য দেখলে তা স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে।
                      </p>
                      <Button asChild className="rounded-xl font-bold text-xs bg-primary text-primary-foreground">
                        <Link to="/products">পণ্য ব্রাউজ করুন</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {recentlyViewed.map((prod, idx) => (
                        <ProductCard key={prod.id || idx} product={prod as any} index={idx} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Back in Stock Alerts Tab */}
            <TabsContent value="stock-alerts">
              <Card className="border-0 sm:border shadow-sm">
                <CardHeader className="p-4 sm:p-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <BellRing className="w-5 h-5 text-orange-600" />
                        স্টক অ্যালার্ট ও নোটিফিকেশন (Back in Stock Alerts)
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        যেসব পণ্যের স্টকের জন্য আপনি অপেক্ষা করছেন সেগুলোর তালিকা
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  {stockAlerts.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed bg-muted/20">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <BellRing className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">
                        কোনো সক্রিয় স্টক অ্যালার্ট নেই
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                        যেকোনো আউট-অব-স্টক পণ্যের পেজে "Notify Me When in Stock" বাটনে ক্লিক করে নোটিফিকেশন সেট করতে পারেন।
                      </p>
                      <Button asChild className="rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white">
                        <Link to="/products">পণ্য ব্রাউজ করুন</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stockAlerts.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg bg-muted p-1 shrink-0 overflow-hidden border">
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
                                className="font-bold text-xs sm:text-sm text-foreground hover:text-orange-600 transition line-clamp-1"
                              >
                                {sub.productName}
                              </Link>
                              {sub.variantLabel && (
                                <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                                  ভ্যারিয়েন্ট: {sub.variantLabel}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-black text-foreground">
                                  ৳{Number(sub.productPrice).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  • অনুরোধের তারিখ: {new Date(sub.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                            {sub.status === "notified" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                স্টক এসেছে! (Notified)
                              </Badge>
                            ) : sub.status === "pending" ? (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200">
                                <Clock className="w-3 h-3 mr-1" />
                                অপেক্ষায় রয়েছে (Pending)
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200">
                                বাতিল (Cancelled)
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
                              className="h-8 text-xs bg-primary text-primary-foreground font-bold rounded-lg"
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
            </TabsContent>
          </Tabs>


          {/* Bottom Account Status & Logout Section */}
          <div className="mt-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">বর্তমানে লগইন আছেন</p>
              <p className="text-xs sm:text-sm font-bold text-foreground truncate max-w-xs">{profile?.phone || (user.email?.endsWith("@durtup.shop") ? user.email.split("@")[0] : user.email)}</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full sm:w-auto rounded-xl font-bold text-xs sm:text-sm h-10 px-5 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? "লগআউট হচ্ছে..." : "লগআউট করুন (Log Out)"}</span>
            </Button>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

