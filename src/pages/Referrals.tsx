import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  Users, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  ArrowRight, 
  ShoppingBag, 
  Sparkles, 
  MessageSquare, 
  Facebook, 
  Send, 
  ChevronRight, 
  ShieldCheck, 
  LogIn, 
  RefreshCw 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { 
  getReferralSettings, 
  getReferralSettingsSync, 
  ReferralSettings, 
  ensureUserReferralProfile 
} from "@/services/referralService";

interface ReferralRecord {
  id: string;
  referredUserId?: string;
  orderId?: string;
  orderNumber?: string;
  orderAmount?: number;
  rewardAmount?: number;
  status: string;
  createdAt: string;
  rewardedAt?: string;
  friendName?: string;
}

export default function Referrals() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  
  // Instant synchronous initialization from memory and localStorage
  const [settings, setSettings] = useState<ReferralSettings>(() => getReferralSettingsSync());

  const [userProfileData, setUserProfileData] = useState<any>(() => {
    if (profile) return profile;
    if (typeof window !== "undefined") {
      try {
        const activeUid = user?.id || JSON.parse(localStorage.getItem("durtup_active_user") || "{}")?.id;
        if (activeUid) {
          const raw = localStorage.getItem("durtup_profile_" + activeUid);
          if (raw) return JSON.parse(raw);
        }
      } catch {}
    }
    return null;
  });

  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const activeUid = user?.id || JSON.parse(localStorage.getItem("durtup_active_user") || "{}")?.id;
        if (activeUid) {
          const raw = localStorage.getItem("durtup_referrals_" + activeUid);
          if (raw) return JSON.parse(raw);
        }
      } catch {}
    }
    return [];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync profile changes from context
  useEffect(() => {
    if (profile) {
      setUserProfileData((prev: any) => ({
        ...prev,
        ...profile,
        walletBalance: Number((profile as any).wallet_balance || (profile as any).walletBalance || prev?.walletBalance || 0),
        totalEarned: Number((profile as any).total_earned || (profile as any).totalEarned || prev?.totalEarned || 0),
        successfulReferrals: Number((profile as any).successful_referrals || (profile as any).successfulReferrals || prev?.successfulReferrals || 0),
        referralCode: (profile as any).referralCode || (profile as any).referral_code || prev?.referralCode || (user?.id ? `DUR${user.id.slice(0, 5).toUpperCase()}` : "DURTUP"),
      }));
    }
  }, [profile, user]);

  // Non-blocking parallel background sync
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const userId = user.id;

    async function syncData() {
      try {
        setIsRefreshing(true);

        // 1. Fire all requests concurrently with zero serial waiting
        const [settingsResult, profileResult, referralsResult] = await Promise.allSettled([
          getReferralSettings(),
          getDoc(doc(db, "profiles", userId)),
          getDocs(query(collection(db, "referrals"), where("referrerId", "==", userId)))
        ]);

        if (!isMounted) return;

        // Process settings
        let currentSettings = settings;
        if (settingsResult.status === "fulfilled" && settingsResult.value) {
          currentSettings = settingsResult.value;
          setSettings(currentSettings);
        }

        // Process profile
        let code = userProfileData?.referralCode || userProfileData?.referral_code;
        if (profileResult.status === "fulfilled" && profileResult.value.exists()) {
          const pData = profileResult.value.data();
          code = pData.referralCode || pData.referral_code || code;
          const updatedProfile = {
            ...pData,
            referralCode: code || `DUR${userId.slice(0, 5).toUpperCase()}`,
            walletBalance: Number(pData.wallet_balance || pData.walletBalance || 0),
            totalEarned: Number(pData.total_earned || pData.totalEarned || 0),
            successfulReferrals: Number(pData.successful_referrals || pData.successfulReferrals || 0),
          };
          setUserProfileData(updatedProfile);
          try {
            localStorage.setItem("durtup_profile_" + userId, JSON.stringify(updatedProfile));
          } catch {}
        }

        // If user didn't have referralCode, ensure one in background
        if (!code) {
          ensureUserReferralProfile(userId, user.email, user.displayName).then(({ referralCode: newCode }) => {
            if (isMounted && newCode) {
              setUserProfileData((prev: any) => ({ ...prev, referralCode: newCode }));
            }
          }).catch(() => {});
        }

        // Process referrals history
        if (referralsResult.status === "fulfilled") {
          const list: ReferralRecord[] = [];
          for (const d of referralsResult.value.docs) {
            const rData = d.data();
            list.push({
              id: d.id,
              referredUserId: rData.referredUserId,
              orderId: rData.orderId,
              orderNumber: rData.orderNumber || rData.orderId,
              orderAmount: Number(rData.orderAmount || 0),
              rewardAmount: Number(rData.rewardAmount || currentSettings.referrerReward || 50),
              status: rData.status || (rData.rewarded ? "rewarded" : "pending"),
              createdAt: rData.createdAt || new Date().toISOString(),
              rewardedAt: rData.rewardedAt,
              friendName: rData.referredUserId ? `Customer (${rData.referredUserId.slice(0, 6)}...)` : "Friend"
            });
          }

          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReferrals(list);
          try {
            localStorage.setItem("durtup_referrals_" + userId, JSON.stringify(list));
          } catch {}
        }
      } catch (err) {
        console.warn("Non-critical background referral sync notice:", err);
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    }

    syncData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Derived referral code available immediately (0ms)
  const referralCode = useMemo(() => {
    return (
      userProfileData?.referralCode ||
      userProfileData?.referral_code ||
      (profile as any)?.referralCode ||
      (profile as any)?.referral_code ||
      (user?.id ? `DUR${user.id.slice(0, 5).toUpperCase()}` : "DURTUP")
    );
  }, [userProfileData, profile, user]);

  const referralUrl = `https://durtup.shop/?ref=${referralCode}`;

  const shareText = `আমি Durtup.shop থেকে শপিং করছি! তুমি আমার রেফারেল লিংক ব্যবহার করে প্রথম অর্ডারে ৳${settings?.newCustomerDiscount || 30} ছাড় পাবে:\n${referralUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(referralUrl);
      } else {
        const input = document.createElement("input");
        input.value = referralUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      toast({
        title: "লিংক কপি হয়েছে! 🎉",
        description: "রেফারেল লিংকটি বন্ধুদের সাথে শেয়ার করুন।",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({
        title: "কপি করা সম্ভব হয়নি",
        description: "অনুগ্রহ করে লিংকটি ম্যানুয়ালি কপি করুন।",
        variant: "destructive"
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Durtup Refer & Earn",
          text: shareText,
          url: referralUrl,
        });
      } catch {
        // cancelled or dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
    window.open(url, "_blank");
  };

  const shareViaMessenger = () => {
    const url = `fb-messenger://share/?link=${encodeURIComponent(referralUrl)}`;
    window.open(url, "_blank");
  };

  const totalReferralsCount = referrals.length;
  const successfulCount = referrals.filter(r => r.status === "rewarded").length;
  const totalEarned = userProfileData?.totalEarned || (successfulCount * (settings?.referrerReward || 50));
  const availableBalance = userProfileData?.walletBalance || 0;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SEOHead 
        title="Refer & Earn | Durtup.shop" 
        description="বন্ধুকে Durtup-এ আনুন, দুজনেই লাভবান হন। প্রতি রেফারেলে ৳৫০ বোনাস ও নতুন গ্রাহকদের প্রথম অর্ডারে ৳৩০ ছাড়।" 
      />
      <Header />

      <main className="flex-1 pb-20 pt-3 sm:pt-6">
        <div className="container max-w-4xl px-3 sm:px-6 space-y-4 sm:space-y-6">

          {/* Logged-out Banner Alert */}
          {!user && !authLoading && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">রেফার করে প্রতি সফল অর্ডারে ৳{settings.referrerReward} আয় করুন!</h3>
                  <p className="text-xs text-muted-foreground">আপনার পার্সোনাল রেফারেল লিংক পেতে ও ব্যালেন্স ক্যাশআউট করতে লগইন করুন।</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/login?redirect=/referrals")} 
                size="sm" 
                className="w-full sm:w-auto rounded-xl font-bold shadow-xs shrink-0"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                লগইন করুন
              </Button>
            </div>
          )}

          {/* Hero Banner Image */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-primary/20 bg-gradient-to-r from-orange-500 to-amber-600 aspect-[16/6.5] sm:aspect-[16/5] min-h-[110px]">
            <img 
              src="/referral-banner.png" 
              alt="Durtup Refer & Earn" 
              className="w-full h-full object-cover rounded-2xl sm:rounded-3xl select-none block"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Referral Link & Share Box */}
          <Card className="border shadow-md rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm sm:text-lg flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-foreground">
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  আপনার ইউনিক রেফারেল লিংক
                </span>
                <Badge variant="outline" className="font-mono text-xs font-bold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/30">
                  CODE: {referralCode}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Copy URL bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-muted/60 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-foreground truncate select-all">
                  {referralUrl}
                </div>
                <Button 
                  onClick={handleCopyLink} 
                  className="h-10 sm:h-11 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "কপি হয়েছে!" : "Copy Link"}</span>
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="pt-1">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                  সরাসরি শেয়ার করুন:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  <Button 
                    variant="outline" 
                    onClick={shareViaWhatsApp}
                    className="h-10 sm:h-11 rounded-xl border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={shareViaFacebook}
                    className="h-10 sm:h-11 rounded-xl border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={shareViaMessenger}
                    className="h-10 sm:h-11 rounded-xl border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Send className="h-4 w-4 text-sky-600" />
                    <span>Messenger</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleNativeShare}
                    className="h-10 sm:h-11 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Share2 className="h-4 w-4 text-primary" />
                    <span>More Share</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border shadow-xs rounded-2xl bg-card">
              <CardContent className="p-3.5 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] sm:text-xs font-medium">Total Referrals</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xl sm:text-3xl font-black text-foreground">{totalReferralsCount}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">মোট যুক্ত বন্ধু</p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs rounded-2xl bg-card">
              <CardContent className="p-3.5 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] sm:text-xs font-medium">Successful</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl sm:text-3xl font-black text-emerald-600">{successfulCount}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">ডেলিভার্ড ও রিওয়ার্ডেড</p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs rounded-2xl bg-card">
              <CardContent className="p-3.5 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] sm:text-xs font-medium">Total Earned</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xl sm:text-3xl font-black text-foreground">৳{totalEarned.toLocaleString()}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">মোট অর্জিত আয়</p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-3.5 sm:p-5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] sm:text-xs font-medium text-emerald-800 dark:text-emerald-300">Available Balance</span>
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl sm:text-3xl font-black text-emerald-600">৳{availableBalance.toLocaleString()}</p>
                <Link to="/wallet" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                  <span>উত্তোলন করুন</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-2 font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                কীভাবে কাজ করে?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-muted/40 border flex flex-col items-center text-center space-y-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm sm:text-base shrink-0">
                    ১
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm">লিংক শেয়ার করুন</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    আপনার ইউনিক রেফারেল লিংক কপি করে সোশ্যাল মিডিয়ায় বা বন্ধুদের সাথে শেয়ার করুন।
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-muted/40 border flex flex-col items-center text-center space-y-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm sm:text-base shrink-0">
                    ২
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm">বন্ধু অর্ডার করবে</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    বন্ধু আপনার লিংকের মাধ্যমে একাউন্ট খুলে ন্যূনতম ৳{settings?.minimumOrderAmount || 500} টাকার প্রথম অর্ডারে ৳{settings?.newCustomerDiscount || 30} ছাড় পাবেন।
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-muted/40 border flex flex-col items-center text-center space-y-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-sm sm:text-base shrink-0">
                    ৩
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm">৳{settings?.referrerReward || 50} রিওয়ার্ড গ্রহণ করুন</h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    অর্ডারটি সফলভাবে ডেলিভারি হওয়ার সাথে সাথেই আপনার ওয়ালেটে ৳{settings?.referrerReward || 50} যোগ হবে, যা bKash/Nagad-এ ক্যাশআউট করতে পারবেন!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral History Table */}
          <Card className="border shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-2 font-bold">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  রেফারেল ইতিহাস (Referral History)
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isRefreshing && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground font-semibold">
                    {referrals.length} জন রেফার্ড
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {referrals.length === 0 ? (
                <div className="py-10 sm:py-12 px-4 text-center space-y-2.5">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mx-auto" />
                  <p className="font-semibold text-muted-foreground text-xs sm:text-sm">এখনো কোনো রেফারেল রেকর্ড নেই</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto">
                    আপনার রেফারেল লিংকটি বন্ধুদের সাথে শেয়ার করুন এবং প্রতি সফল অর্ডারে বোনাস উপভোগ করুন।
                  </p>
                  <Button onClick={handleCopyLink} variant="outline" size="sm" className="rounded-xl mt-2 font-semibold text-xs">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    রেফারেল লিংক কপি করুন
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {referrals.map((r) => (
                    <div key={r.id} className="p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-3 hover:bg-muted/20 transition-colors">
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground">{r.friendName}</span>
                          <Badge 
                            variant="secondary"
                            className={
                              r.status === "rewarded" 
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-semibold text-[10px]"
                                : r.status === "pending" || r.status === "qualified"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/20 font-semibold text-[10px]"
                                : "bg-muted text-muted-foreground font-semibold text-[10px]"
                            }
                          >
                            {r.status === "rewarded" ? "Rewarded" : r.status === "pending" ? "Order Pending" : r.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground">
                          Order #{r.orderNumber || r.orderId} • {new Date(r.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-black text-emerald-600">
                          {r.status === "rewarded" ? `+৳${r.rewardAmount}` : `৳${r.rewardAmount} (Pending)`}
                        </p>
                        {r.orderAmount ? (
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground">Order: ৳{r.orderAmount}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>

      <Footer />
    </div>
  );
}

