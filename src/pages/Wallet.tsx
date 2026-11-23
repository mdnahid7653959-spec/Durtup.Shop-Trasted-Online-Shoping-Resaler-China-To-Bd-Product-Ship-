import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  Clock,
  Sparkles,
  Share2,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Smartphone,
  Info,
  Copy,
  Check,
  Star,
  Award,
  Gift,
  Trophy,
  Coins,
  Percent
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/useSmartBack";
import { cn } from "@/lib/utils";
import { getReferralSettings, ReferralSettings, requestWithdrawal } from "@/services/referralService";
import {
  getUserLoyaltyAccount,
  getUserLoyaltyHistory,
  getLoyaltySettings,
  type LoyaltyAccount,
  type LoyaltyTransaction,
  type LoyaltySettings
} from "@/services/loyaltyService";
import {
  getUserCashbackHistory,
  getActiveCashbackCampaigns,
  type CashbackTransaction,
  type CashbackCampaign
} from "@/services/cashbackService";

interface Transaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  description: string | null;
  status?: string;
  balance_after?: number;
  created_at: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const handleSmartBack = useSmartBack();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);

  // Loyalty Points State
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyTransaction[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  
  // Cashback State
  const [cashbackHistory, setCashbackHistory] = useState<CashbackTransaction[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<CashbackCampaign[]>([]);
  const [totalCashbackEarned, setTotalCashbackEarned] = useState<number>(0);
  
  const [activeLedgerTab, setActiveLedgerTab] = useState<"wallet" | "loyalty" | "cashback">("wallet");

  // Withdraw Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("500");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("bkash");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Top Up Modal State (Exact bKash payment method as Checkout)
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("500");
  const [bkashSenderNumber, setBkashSenderNumber] = useState<string>("");
  const [bkashTrxId, setBkashTrxId] = useState<string>("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submittingTopUp, setSubmittingTopUp] = useState(false);

  const handleCopyNumber = (num: string = "01885985097") => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    toast({
      title: "নাম্বার কপি হয়েছে! 📋",
      description: `${num} ক্লিপবোর্ডে কপি করা হয়েছে।`,
    });
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = Number(topUpAmount);
    if (!amountNum || amountNum < 50) {
      toast({
        variant: "destructive",
        title: "ভুল টপ-আপ পরিমাণ",
        description: "সর্বনিম্ন টপ-আপ পরিমাণ ৳৫০",
      });
      return;
    }

    const cleanSender = bkashSenderNumber.replace(/\D/g, "");
    if (cleanSender.length < 11) {
      toast({
        variant: "destructive",
        title: "ভুল বিকাশ নম্বর",
        description: "১১ ডিজিটের সঠিক বিকাশ মোবাইল নম্বর প্রদান করুন।",
      });
      return;
    }

    if (!bkashTrxId.trim()) {
      toast({
        variant: "destructive",
        title: "TrxID আবশ্যক",
        description: "আপনার বিকাশ লেনদেনের ট্রানজেকশন আইডি (TrxID) প্রদান করুন।",
      });
      return;
    }

    try {
      setSubmittingTopUp(true);
      const topupId = `topup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();
      const userName = profile?.full_name || profile?.name || user.displayName || "Customer";
      const userEmail = profile?.email || user.email || "";

      // 1. Save to wallet_topups collection
      await setDoc(doc(db, "wallet_topups", topupId), {
        id: topupId,
        userId: user.id,
        user_id: user.id,
        userName,
        userEmail,
        userPhone: cleanSender,
        amount: amountNum,
        method: "bkash",
        senderNumber: cleanSender,
        trxId: bkashTrxId.trim().toUpperCase(),
        status: "pending",
        createdAt: nowIso,
        created_at: nowIso,
      });

      // 2. Add pending transaction to wallet_transactions
      await setDoc(doc(db, "wallet_transactions", topupId), {
        id: topupId,
        userId: user.id,
        user_id: user.id,
        amount: amountNum,
        type: "credit",
        direction: "credit",
        category: "top_up",
        description: `bKash Top-up (Sender: ${cleanSender}, TrxID: ${bkashTrxId.trim().toUpperCase()})`,
        status: "pending",
        created_at: nowIso,
        createdAt: nowIso,
      });

      // 3. Send admin notification
      await setDoc(doc(db, "admin_notifications", `notif-${topupId}`), {
        id: `notif-${topupId}`,
        type: "wallet_topup",
        title: `💰 New Wallet Top-Up (৳${amountNum})!`,
        message: `${userName} sent ৳${amountNum} via bKash (Sender: ${cleanSender}, TrxID: ${bkashTrxId.trim().toUpperCase()})`,
        total_amount: amountNum,
        payment_method: "bkash",
        customer_name: userName,
        customer_phone: cleanSender,
        customer_email: userEmail,
        read: false,
        created_at: nowIso,
      });

      toast({
        title: "টপ-আপ অনুরোধ সফল হয়েছে! 🎉",
        description: `৳${amountNum} টপ-আপের TrxID (${bkashTrxId.trim().toUpperCase()}) সফলভাবে জমা হয়েছে। ভেরিফাই করে ওয়ালেটে ব্যালেন্স যুক্ত করা হবে।`,
      });

      setTopUpModalOpen(false);
      setBkashSenderNumber("");
      setBkashTrxId("");
      fetchWalletData();
    } catch (err: any) {
      console.error("Top up error:", err);
      toast({
        variant: "destructive",
        title: "টপ-আপ ত্রুটি",
        description: err.message || "Failed to submit top-up request",
      });
    } finally {
      setSubmittingTopUp(false);
    }
  };

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      // 1. Settings
      const s = await getReferralSettings();
      setSettings(s);

      // 2. Profile balance
      const pSnap = await getDoc(doc(db, "profiles", user.id));
      if (pSnap.exists()) {
        const d = pSnap.data();
        setWalletBalance(Number(d.wallet_balance || d.walletBalance || 0));
        setTotalEarned(Number(d.total_earned || d.totalEarned || 0));
      }

      // 3. Transactions
      const txQuery = query(
        collection(db, "wallet_transactions"),
        where("userId", "==", user.id)
      );
      const txSnap = await getDocs(txQuery);
      const txList: Transaction[] = [];

      txSnap.forEach((d) => {
        const data = d.data();
        txList.push({
          id: d.id,
          amount: Number(data.amount || 0),
          type: data.type || data.direction || "credit",
          direction: data.direction || data.type || "credit",
          category: data.category || "adjustment",
          description: data.description || null,
          status: data.status || "completed",
          balance_after: data.balance_after,
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
        });
      });

      // Also query legacy user_id
      if (txList.length === 0) {
        const txLegacyQuery = query(
          collection(db, "wallet_transactions"),
          where("user_id", "==", user.id)
        );
        const legacySnap = await getDocs(txLegacyQuery);
        legacySnap.forEach((d) => {
          const data = d.data();
          if (!txList.some(x => x.id === d.id)) {
            txList.push({
              id: d.id,
              amount: Number(data.amount || 0),
              type: data.type || data.direction || "credit",
              direction: data.direction || data.type || "credit",
              category: data.category || "adjustment",
              description: data.description || null,
              status: data.status || "completed",
              balance_after: data.balance_after,
              created_at: data.created_at || data.createdAt || new Date().toISOString(),
            });
          }
        });
      }

      txList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txList);

      // 4. Fetch Loyalty Account, Settings & History
      try {
        const [lAcc, lHist, lSet] = await Promise.all([
          getUserLoyaltyAccount(user.id, user.email, profile?.full_name),
          getUserLoyaltyHistory(user.id),
          getLoyaltySettings()
        ]);
        setLoyaltyAccount(lAcc);
        setLoyaltyHistory(lHist);
        setLoyaltySettings(lSet);
      } catch (lErr) {
        console.warn("Loyalty data fetch notice:", lErr);
      }

      // 5. Fetch Cashback History & Active Campaigns
      try {
        const [cbHist, cbCamps] = await Promise.all([
          getUserCashbackHistory(user.id),
          getActiveCashbackCampaigns()
        ]);
        setCashbackHistory(cbHist);
        setActiveCampaigns(cbCamps);

        const earnedTotal = cbHist
          .filter(t => t.type === "credit" && t.status === "credited")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        setTotalCashbackEarned(earnedTotal);
      } catch (cbErr) {
        console.warn("Cashback data fetch notice:", cbErr);
      }
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountNum = Number(withdrawAmount);
    const minAmount = settings?.minimumWithdrawAmount || 500;

    if (!amountNum || amountNum < minAmount) {
      toast({
        variant: "destructive",
        title: "ভুল উত্তোলন পরিমাণ",
        description: `সর্বনিম্ন উত্তোলনের পরিমাণ ৳${minAmount}`,
      });
      return;
    }

    if (amountNum > walletBalance) {
      toast({
        variant: "destructive",
        title: "অপর্যাপ্ত ব্যালেন্স",
        description: `আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳${walletBalance}`,
      });
      return;
    }

    const cleanAcc = accountNumber.replace(/\D/g, "");
    if (cleanAcc.length < 11) {
      toast({
        variant: "destructive",
        title: "ভুল একাউন্ট নম্বর",
        description: "১১ ডিজিটের সঠিক মোবাইল ব্যাংকিং নম্বর প্রদান করুন।",
      });
      return;
    }

    try {
      setSubmittingWithdraw(true);
      const res = await requestWithdrawal(user.id, amountNum, withdrawMethod, cleanAcc);

      if (res?.success) {
        setWalletBalance(res.newBalance !== undefined ? res.newBalance : Math.max(0, walletBalance - amountNum));
        setWithdrawModalOpen(false);
        setAccountNumber("");
        toast({
          title: "উত্তোলন অনুরোধ সফল হয়েছে! 🎉",
          description: `৳${amountNum} উত্তোলনের অনুরোধ জমা হয়েছে। এডমিন দ্রুত আপনার ${withdrawMethod.toUpperCase()} (${cleanAcc})-এ টাকা পাঠিয়ে দেবেন।`,
        });
        fetchWalletData();
      } else {
        throw new Error(res?.error || "Withdrawal failed");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "উত্তোলন ত্রুটি",
        description: err.message || "Failed to process withdrawal request",
      });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead title="My Wallet - Durtup.shop" description="Durtup customer wallet" />
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-sm px-4">
            <WalletIcon className="h-16 w-16 mx-auto text-muted-foreground/60" />
            <h2 className="text-xl font-bold">লগইন আবশ্যক</h2>
            <p className="text-sm text-muted-foreground">আপনার ওয়ালেট ব্যালেন্স দেখতে অনুগ্রহ করে লগইন করুন।</p>
            <Button onClick={() => navigate("/login?redirect=/wallet")} className="w-full font-bold">
              লগইন করুন
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <SEOHead title="My Wallet | Durtup.shop" description="Manage your Durtup wallet and referral earnings" />
      <Header />
      
      <main className="flex-1 pb-24 md:pb-12 pt-4">
        <div className="container max-w-3xl px-4 sm:px-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleSmartBack} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-black">My Wallet</h1>
            </div>
            <Link to="/referrals">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                <Share2 className="h-3.5 w-3.5" />
                Refer & Earn
              </Button>
            </Link>
          </div>

          {/* Balance Cards Grid */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Primary Balance Card */}
            <Card className="sm:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-amber-700 text-primary-foreground border-0 shadow-lg rounded-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <WalletIcon className="h-32 w-32" />
              </div>
              <CardContent className="p-6 relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wider">
                      Available Balance
                    </p>
                    <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                      ৳{walletBalance.toLocaleString()}
                    </p>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/25 text-white border-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs">
                    100% Safe & Secure
                  </Badge>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => setWithdrawModalOpen(true)}
                    className="w-full h-11 bg-white text-orange-600 hover:bg-white/95 hover:text-orange-700 active:scale-[0.99] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all border-0"
                  >
                    <ArrowUpRight className="h-5 w-5 stroke-[2.5]" />
                    <span>উত্তোলন করুন (Withdraw)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Total Earned Card */}
            <Card className="rounded-2xl border shadow-sm bg-card flex flex-col justify-between">
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Earned</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-foreground">
                  ৳{totalEarned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground leading-tight pt-1">
                  রেফারেল প্রোগ্রাম ও রিওয়ার্ড থেকে অর্জিত মোট আয়।
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dedicated Loyalty Points Overview Card */}
          <Card className="rounded-2xl border border-amber-500/30 shadow-md bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                    <Star className="h-6 w-6 fill-current text-amber-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg text-foreground">
                        লয়্যালটি পয়েন্ট (Loyalty Points)
                      </h3>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                        {loyaltyAccount?.tier || "Bronze"} Tier
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      প্রতি সফল ডেলিভারি অর্ডারে ৳১০০ কেনাকাটায় {loyaltySettings?.pointsPerHundredSpent || 5} পয়েন্ট পান!
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-white dark:bg-card p-3 rounded-xl border border-amber-500/20 sm:border-0 sm:bg-transparent sm:p-0">
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                    ★ {Number(loyaltyAccount?.points || 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">পয়েন্ট</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ≈ ৳{Number((loyaltyAccount?.points || 0) * (loyaltySettings?.pointValueInTaka || 0.50)).toLocaleString()} চেকআউট ছাড়
                  </p>
                </div>
              </div>

              {/* Loyalty rules micro-strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-500/20 text-[11px] sm:text-xs">
                <div className="p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground block">লাইফটাইম অর্জিত</span>
                  <span className="font-bold text-foreground">★ {Number(loyaltyAccount?.lifetime_points || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground block">ডিসকাউন্টে ব্যবহৃত</span>
                  <span className="font-bold text-foreground">★ {Number(loyaltyAccount?.points_spent || 0).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-background/60 col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground block">পয়েন্ট মেয়াদ</span>
                  <span className="font-bold text-foreground">{loyaltySettings?.expiryDays ? `${loyaltySettings.expiryDays} দিন` : "আজীবন (No Expiry)"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dedicated Automated Cashback Rewards Overview Card */}
          <Card className="rounded-2xl border border-emerald-500/30 shadow-md bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-card overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Coins className="h-6 w-6 text-emerald-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg text-foreground">
                        ক্যাশব্যাক রিওয়ার্ড (Cashback Rewards)
                      </h3>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                        Auto-Credited
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      প্রতিটি সফল ডেলিভারি অর্ডারে স্বয়ংক্রিয় ক্যাশব্যাক সরাসরি ওয়ালেটে জমা হয়।
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-white dark:bg-card p-3 rounded-xl border border-emerald-500/20 sm:border-0 sm:bg-transparent sm:p-0">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    ৳{Number(totalCashbackEarned || 0).toLocaleString()}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">
                    মোট অর্জিত ক্যাশব্যাক
                  </p>
                </div>
              </div>

              {/* Active Cashback Campaigns Banner Strip */}
              {activeCampaigns.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5" /> চলতি অফার: {activeCampaigns[0].name}
                    </span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black">
                      {activeCampaigns[0].cashback_percent}% ক্যাশব্যাক
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {activeCampaigns[0].min_order_amount ? `ন্যূনতম ৳${activeCampaigns[0].min_order_amount} কেনাকাটায় ` : ""}
                    সর্বোচ্চ ৳{activeCampaigns[0].max_cashback_amount || 500} পর্যন্ত ক্যাশব্যাক!
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>পরবর্তী যেকোনো অর্ডারে চেকআউটের সময় ওয়ালেট থেকে সরাসরি ক্যাশব্যাক টাকা খরচ করা যায়।</span>
                <Button asChild size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 font-bold p-0 h-auto">
                  <Link to="/products">কেনাকাটা করুন →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Promo */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">প্রতি রেফারেলে ৳৫০ বোনাস!</p>
                <p className="text-xs text-muted-foreground">বন্ধুদের ইনভাইট করে আরো বেশি ওয়ালেট ব্যালেন্স অর্জন করুন।</p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-xl font-bold shrink-0">
              <Link to="/referrals">Invite Now</Link>
            </Button>
          </div>

          {/* Transaction History & Points Ledger Tabs */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={activeLedgerTab === "wallet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLedgerTab("wallet")}
                    className="rounded-xl text-xs font-bold gap-1.5 h-8"
                  >
                    <WalletIcon className="h-3.5 w-3.5" />
                    টাকা লেনদেন ({transactions.length})
                  </Button>
                  <Button
                    variant={activeLedgerTab === "cashback" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLedgerTab("cashback")}
                    className={cn(
                      "rounded-xl text-xs font-bold gap-1.5 h-8",
                      activeLedgerTab === "cashback"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        : "text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    )}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    ক্যাশব্যাক হিস্ট্রি ({cashbackHistory.length})
                  </Button>
                  <Button
                    variant={activeLedgerTab === "loyalty" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveLedgerTab("loyalty")}
                    className={cn(
                      "rounded-xl text-xs font-bold gap-1.5 h-8",
                      activeLedgerTab === "loyalty"
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                        : "text-amber-700 dark:text-amber-400 border-amber-500/30"
                    )}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" />
                    পয়েন্ট বিবরণী ({loyaltyHistory.length})
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  {activeLedgerTab === "wallet"
                    ? `${transactions.length} Transactions`
                    : activeLedgerTab === "cashback"
                    ? `${cashbackHistory.length} Cashback Records`
                    : `${loyaltyHistory.length} Points Records`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : activeLedgerTab === "loyalty" ? (
                /* Loyalty Points History Ledger */
                loyaltyHistory.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <Star className="h-12 w-12 mx-auto text-amber-500/40 mb-2" />
                    <p className="font-semibold text-muted-foreground text-sm">কোনো লয়্যালটি পয়েন্টের রেকর্ড নেই</p>
                    <p className="text-xs text-muted-foreground">সফল অর্ডার ডেলিভারি হলে স্বয়ংক্রিয়ভাবে পয়েন্ট এখানে যুক্ত হবে।</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {loyaltyHistory.map((item) => {
                      const isPositive = item.points > 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                isPositive
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-red-500/10 text-red-600"
                              )}
                            >
                              {item.type === "admin_bonus" ? (
                                <Gift className="h-5 w-5" />
                              ) : isPositive ? (
                                <Star className="h-5 w-5 fill-current" />
                              ) : (
                                <ArrowUpRight className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground mt-0.5">
                                <span>
                                  {new Date(item.created_at).toLocaleDateString("en-BD", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {item.order_number && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                    Order #{item.order_number}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p
                              className={cn(
                                "font-black text-sm sm:text-base",
                                isPositive ? "text-amber-600 dark:text-amber-400" : "text-orange-600"
                              )}
                            >
                              {isPositive ? "+" : ""}{item.points} pts
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              ব্যালেন্স: {item.balance_after}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : activeLedgerTab === "cashback" ? (
                /* Automated Cashback History Ledger */
                cashbackHistory.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-2">
                    <Coins className="h-12 w-12 mx-auto text-emerald-500/40 mb-2" />
                    <p className="font-semibold text-muted-foreground text-sm">কোনো ক্যাশব্যাকের রেকর্ড নেই</p>
                    <p className="text-xs text-muted-foreground">সফল ডেলিভারি অর্ডারে স্বয়ংক্রিয়ভাবে ক্যাশব্যাক ক্রেডিট হবে।</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cashbackHistory.map((item) => {
                      const isCredit = item.type === "credit";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                isCredit
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-red-500/10 text-red-600"
                              )}
                            >
                              <Coins className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground mt-0.5">
                                <span>
                                  {new Date(item.created_at).toLocaleDateString("en-BD", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {item.order_number && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                    Order #{item.order_number}
                                  </Badge>
                                )}
                                <Badge
                                  className={cn(
                                    "text-[9px] uppercase px-1.5 py-0 border-0 font-bold",
                                    item.status === "credited"
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : item.status === "reversed"
                                      ? "bg-red-500/10 text-red-600"
                                      : "bg-amber-500/10 text-amber-600"
                                  )}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p
                              className={cn(
                                "font-black text-sm sm:text-base",
                                isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
                              )}
                            >
                              {isCredit ? "+" : "-"}৳{Number(item.amount).toLocaleString()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              ব্যালেন্স: ৳{Number(item.balance_after || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-muted-foreground text-sm">এখনো কোনো লেনদেন হয়নি</p>
                  <p className="text-xs text-muted-foreground">আপনার ওয়ালেট লেনদেনের হিসাব এখানে প্রদর্শিত হবে।</p>
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((transaction) => {
                    const isCredit = transaction.type === "credit" || transaction.direction === "credit";
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-red-500/10 text-red-600"
                            )}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-foreground capitalize">
                                {transaction.category.replace(/_/g, " ")}
                              </p>
                              {transaction.status === "pending" && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                                  Pending
                                </Badge>
                              )}
                              {transaction.status === "cancelled" && (
                                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                                  Cancelled
                                </Badge>
                              )}
                            </div>
                            {transaction.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {transaction.description}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString("en-BD", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={cn(
                              "font-black text-sm sm:text-base",
                              isCredit ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {isCredit ? "+" : "-"}৳{transaction.amount.toLocaleString()}
                          </p>
                          {transaction.balance_after !== undefined && (
                            <p className="text-[11px] text-muted-foreground">
                              Bal: ৳{transaction.balance_after.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              ব্যালেন্স উত্তোলন (Withdraw)
            </DialogTitle>
            <DialogDescription className="text-xs">
              আপনার ওয়ালেটে বর্তমান ব্যালেন্স: <strong>৳{walletBalance.toLocaleString()}</strong>। 
              সর্বনিম্ন উত্তোলন: <strong>৳{settings?.minimumWithdrawAmount || 500}</strong>।
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">উত্তোলনের পরিমাণ (টাকা)</Label>
              <Input
                type="number"
                min={settings?.minimumWithdrawAmount || 500}
                max={walletBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500"
                className="rounded-xl h-11 text-base font-bold"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">পেমেন্ট মেথড নির্বাচন করুন</Label>
              <RadioGroup 
                value={withdrawMethod} 
                onValueChange={setWithdrawMethod}
                className="grid grid-cols-3 gap-2"
              >
                <div>
                  <RadioGroupItem value="bkash" id="w_bkash" className="peer sr-only" />
                  <Label 
                    htmlFor="w_bkash"
                    className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 font-bold text-xs"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-pink-600" />
                    bKash
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="nagad" id="w_nagad" className="peer sr-only" />
                  <Label 
                    htmlFor="w_nagad"
                    className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 font-bold text-xs"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-orange-600" />
                    Nagad
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="rocket" id="w_rocket" className="peer sr-only" />
                  <Label 
                    htmlFor="w_rocket"
                    className="flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 font-bold text-xs"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-purple-600" />
                    Rocket
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{withdrawMethod.toUpperCase()} পার্সোনাল নম্বর</Label>
              <Input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="017XXXXXXXX"
                className="rounded-xl h-11"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                টাকা পৌঁছানোর জন্য সঠিক পার্সোনাল একাউন্ট নম্বর দিন।
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setWithdrawModalOpen(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button 
                type="submit" 
                disabled={submittingWithdraw || walletBalance < (settings?.minimumWithdrawAmount || 500)}
                className="rounded-xl font-bold"
              >
                {submittingWithdraw ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    প্রক্রিয়াধীন...
                  </>
                ) : (
                  "অনুরোধ জমা দিন"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Top Up Dialog with Exact Same bKash UI as Checkout */}
      <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              ওয়ালেট টপ-আপ (Add Money)
            </DialogTitle>
            <DialogDescription className="text-xs">
              বিকাশের মাধ্যমে আপনার Durtup ওয়ালেটে টাকা যোগ করুন
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTopUpSubmit} className="space-y-4 pt-1">
            {/* Amount Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>টাকার পরিমাণ নির্বাচন করুন</span>
                <span className="text-[11px] text-muted-foreground">সর্বনিম্ন: ৳৫০</span>
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {["100", "200", "500", "1000", "2000", "5000"].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={topUpAmount === preset ? "default" : "outline"}
                    onClick={() => setTopUpAmount(preset)}
                    className={cn(
                      "h-9 text-xs font-bold rounded-xl transition-all",
                      topUpAmount === preset ? "bg-primary text-primary-foreground shadow-sm" : "border-border hover:border-primary/50"
                    )}
                  >
                    ৳{Number(preset).toLocaleString()}
                  </Button>
                ))}
              </div>
              <div className="relative pt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-primary text-sm pt-1">৳</span>
                <Input
                  type="number"
                  min="50"
                  max="50000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="অন্য পরিমাণ লিখুন (যেমন: 500)"
                  className="pl-8 rounded-xl h-11 text-base font-bold"
                  required
                />
              </div>
            </div>

            {/* bKash Payment Method Box (Exact same styling as Checkout) */}
            <div className="space-y-3 pt-1">
              <Label className="text-xs font-bold text-foreground">পেমেন্ট মেথড</Label>
              
              {/* bKash Selector Card */}
              <div className="flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl w-full min-w-0 border-[#E2136E] bg-[#E2136E]/5 shadow-sm ring-1 ring-[#E2136E]/20">
                <div className="w-8 h-8 rounded-lg bg-[#E2136E] text-white flex items-center justify-center font-black text-[11px] shadow-sm shrink-0">
                  bKash
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm text-foreground block">bKash (বিকাশ)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Send Money / Make payment via bKash</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[#E2136E] shrink-0 ml-auto" />
              </div>

              {/* bKash Payment Details Box */}
              <div className="p-3.5 sm:p-5 rounded-xl border-2 border-[#E2136E]/30 bg-gradient-to-br from-[#E2136E]/10 via-background to-muted/20 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 w-full min-w-0 overflow-hidden">
                {/* bKash Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2136E]/20 flex-wrap gap-2 min-w-0 w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#E2136E] text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                      bKash
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-foreground truncate">bKash Payment Details</h4>
                      <p className="text-[11px] text-muted-foreground truncate">Personal / Merchant Account</p>
                    </div>
                  </div>
                  <Badge className="bg-[#E2136E] hover:bg-[#E2136E] text-white text-[10px] font-bold px-2 py-0.5 shrink-0">
                    Send Money
                  </Badge>
                </div>

                {/* Instructions & Number */}
                <div className="p-3 rounded-xl bg-[#E2136E]/10 border border-[#E2136E]/20 space-y-2.5 overflow-hidden w-full min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">bKash Number</span>
                      <span className="text-lg sm:text-xl font-black text-[#E2136E] tracking-wider block select-all">01885985097</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyNumber("01885985097")}
                      className="h-8 px-2.5 sm:px-3 text-xs font-semibold border-[#E2136E]/30 text-[#E2136E] hover:bg-[#E2136E]/10 flex items-center gap-1.5 shrink-0"
                    >
                      {copiedNumber ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedNumber ? "Copied!" : "Copy Number"}
                    </Button>
                  </div>

                  <div className="pt-1 text-xs text-foreground/80 space-y-1.5 break-words">
                    <p className="flex items-start gap-1.5 font-medium">
                      <span className="w-4 h-4 rounded-full bg-[#E2136E] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <span>বিকাশ অ্যাপে গিয়ে <strong>Send Money</strong> করুন।</span>
                    </p>
                    <p className="flex items-start gap-1.5 font-medium">
                      <span className="w-4 h-4 rounded-full bg-[#E2136E] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <span>টাকার পরিমাণ: <strong className="text-[#E2136E]">৳{Number(topUpAmount || 0).toLocaleString()}</strong></span>
                    </p>
                    <p className="flex items-start gap-1.5 font-medium">
                      <span className="w-4 h-4 rounded-full bg-[#E2136E] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <span>পেমেন্ট সম্পন্ন করে নিচের ঘরে আপনার বিকাশ নাম্বার ও TrxID দিন।</span>
                    </p>
                  </div>
                </div>

                {/* Inputs for verification */}
                <div className="grid sm:grid-cols-2 gap-3 pt-1 w-full min-w-0">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="topupBkashNumber" className="text-xs font-bold text-foreground">
                      Sender bKash Number (আপনার বিকাশ নাম্বার) *
                    </Label>
                    <Input
                      id="topupBkashNumber"
                      placeholder="e.g. 01XXXXXXXXX"
                      value={bkashSenderNumber}
                      onChange={(e) => setBkashSenderNumber(e.target.value)}
                      className="h-10 text-xs border-[#E2136E]/30 focus-visible:ring-[#E2136E] w-full"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="topupBkashTrxId" className="text-xs font-bold text-foreground">
                      Transaction ID (TrxID / ট্রানজেকশন আইডি) *
                    </Label>
                    <Input
                      id="topupBkashTrxId"
                      placeholder="e.g. 9M7A8X9K2"
                      value={bkashTrxId}
                      onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                      className="h-10 text-xs border-[#E2136E]/30 focus-visible:ring-[#E2136E] uppercase font-mono w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setTopUpModalOpen(false)}
                className="rounded-xl"
              >
                বাতিল
              </Button>
              <Button 
                type="submit" 
                disabled={submittingTopUp || !topUpAmount || Number(topUpAmount) < 50 || !bkashSenderNumber || !bkashTrxId}
                className="rounded-xl font-bold bg-[#E2136E] hover:bg-[#E2136E]/90 text-white shadow-md"
              >
                {submittingTopUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    যাচাই করা হচ্ছে...
                  </>
                ) : (
                  `৳${Number(topUpAmount || 0).toLocaleString()} টপ-আপ নিশ্চিত করুন`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
