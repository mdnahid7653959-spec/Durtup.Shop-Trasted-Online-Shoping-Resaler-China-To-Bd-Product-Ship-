import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  Users, 
  Share2, 
  Gift, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpRight, 
  Check, 
  X, 
  Settings as SettingsIcon,
  DollarSign,
  ShieldCheck,
  Save,
  Loader2,
  Eye, 
  RotateCcw, 
  Smartphone,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  limit,
  getDoc 
} from "firebase/firestore";
import { 
  getReferralSettings, 
  saveReferralSettings, 
  ReferralSettings, 
  processOrderReferralReward,
  processWithdrawal,
  manualAdjustment
} from "@/services/referralService";
import { logAdminActivity } from "@/services/auditLogger";

interface ReferralItem {
  id: string;
  referralCode: string;
  referrerId?: string;
  referredUserId?: string;
  orderId?: string;
  orderNumber?: string;
  orderAmount?: number;
  rewardAmount?: number;
  newCustomerDiscount?: number;
  status: string;
  qualified?: boolean;
  rewarded?: boolean;
  createdAt: string;
  rewardedAt?: string;
  referrerName?: string;
  referredUserName?: string;
}

interface WithdrawalItem {
  id: string;
  userId: string;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  userName?: string;
  userEmail?: string;
}

interface TopUpItem {
  id: string;
  userId: string;
  amount: number;
  method: string;
  senderNumber: string;
  trxId: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  userName?: string;
  userEmail?: string;
}

export default function AdminReferrals() {
  const { admin } = useAdminAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("referrals");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data State
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [topups, setTopups] = useState<TopUpItem[]>([]);
  const [processingTopupId, setProcessingTopupId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReferralSettings>({
    enabled: true,
    referrerReward: 50,
    newCustomerDiscount: 30,
    minimumOrderAmount: 500,
    rewardTrigger: "delivered",
    maxDailyRewards: 10,
    withdrawEnabled: true,
    minimumWithdrawAmount: 500,
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reject Withdrawal Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetWithdrawal, setTargetWithdrawal] = useState<WithdrawalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  // Settings saving state
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);

      // 1. Settings
      const s = await getReferralSettings(true);
      setSettings(s);

      // 2. Fetch Profiles map for resolving names
      const profilesSnap = await getDocs(collection(db, "profiles"));
      const profileMap = new Map<string, any>();
      profilesSnap.forEach((p) => profileMap.set(p.id, p.data()));

      // 3. Fetch Referrals
      try {
        const refSnap = await getDocs(collection(db, "referrals"));
        const refList: ReferralItem[] = [];
        refSnap.forEach((d) => {
          const data = d.data();
          const rId = data.referrerId || data.referrer_id;
          const uId = data.referredUserId || data.referred_user_id;

          const rProf = rId ? profileMap.get(rId) : null;
          const uProf = uId ? profileMap.get(uId) : null;

          refList.push({
            id: d.id,
            referralCode: data.referralCode || data.referral_code || "",
            referrerId: rId,
            referredUserId: uId,
            orderId: data.orderId || data.order_id,
            orderNumber: data.orderNumber || data.order_number || data.orderId,
            orderAmount: Number(data.orderAmount || data.order_amount || 0),
            rewardAmount: Number(data.rewardAmount || data.reward_amount || s.referrerReward || 50),
            newCustomerDiscount: Number(data.newCustomerDiscount || data.new_customer_discount || s.newCustomerDiscount || 30),
            status: data.status || (data.rewarded ? "rewarded" : "pending"),
            qualified: data.qualified !== false,
            rewarded: data.rewarded === true,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            rewardedAt: data.rewardedAt || data.rewarded_at,
            referrerName: rProf?.full_name || rProf?.name || rId,
            referredUserName: uProf?.full_name || uProf?.name || uId,
          });
        });

        refList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReferrals(refList);
      } catch (e) {
        console.warn("Referrals collection read error:", e);
      }

      // 4. Fetch Withdrawals
      try {
        const withSnap = await getDocs(collection(db, "withdrawals"));
        const withList: WithdrawalItem[] = [];
        withSnap.forEach((d) => {
          const data = d.data();
          const uId = data.userId || data.user_id;
          const uProf = uId ? profileMap.get(uId) : null;

          withList.push({
            id: d.id,
            userId: uId,
            amount: Number(data.amount || 0),
            method: data.method || "bkash",
            accountNumber: data.accountNumber || data.account_number || "",
            status: data.status || "pending",
            adminNote: data.adminNote || data.admin_note,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            processedAt: data.processedAt || data.processed_at,
            processedBy: data.processedBy || data.processed_by,
            userName: uProf?.full_name || uProf?.name || "Customer",
            userEmail: uProf?.email,
          });
        });

        withList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWithdrawals(withList);
      } catch (e) {
        console.warn("Withdrawals collection read error:", e);
      }

      // 4. Fetch Top-Up Requests
      try {
        const topSnap = await getDocs(collection(db, "wallet_topups"));
        const topList: TopUpItem[] = [];
        topSnap.forEach((d) => {
          const data = d.data();
          const uId = data.userId || data.user_id;
          const uProf = uId ? profileMap.get(uId) : null;

          topList.push({
            id: d.id,
            userId: uId,
            amount: Number(data.amount || 0),
            method: data.method || "bkash",
            senderNumber: data.senderNumber || data.sender_number || "",
            trxId: data.trxId || data.trx_id || "",
            status: data.status || "pending",
            adminNote: data.adminNote || data.admin_note,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            processedAt: data.processedAt || data.processed_at,
            userName: data.userName || uProf?.full_name || uProf?.name || "Customer",
            userEmail: data.userEmail || uProf?.email,
          });
        });

        topList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTopups(topList);
      } catch (e) {
        console.warn("Wallet topups collection read error:", e);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "ডেটা লোড ত্রুটি",
        description: err.message || "Failed to load referral administration data",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Metrics Calculation
  const uniqueReferrers = new Set(referrals.map(r => r.referrerId).filter(Boolean)).size;
  const totalReferredUsers = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === "rewarded").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending" || r.status === "qualified").length;
  const totalRewardsIssued = referrals.filter(r => r.status === "rewarded").reduce((sum, r) => sum + (r.rewardAmount || 50), 0);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingWithdrawalsAmount = withdrawals.filter(w => w.status === "pending").reduce((sum, w) => sum + w.amount, 0);
  const paidWithdrawalsAmount = withdrawals.filter(w => w.status === "paid" || w.status === "approved").reduce((sum, w) => sum + w.amount, 0);

  const pendingTopupsCount = topups.filter(t => t.status === "pending").length;
  const pendingTopupsAmount = topups.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);

  // Handlers for Top-Ups
  const handleApproveTopup = async (t: TopUpItem) => {
    try {
      setProcessingTopupId(t.id);
      const res = await manualAdjustment(
        t.userId,
        "credit",
        t.amount,
        `bKash Top-up approved (TrxID: ${t.trxId})`,
        admin?.displayName || "Admin"
      );

      if (res?.success) {
        const nowIso = new Date().toISOString();
        await setDoc(doc(db, "wallet_topups", t.id), {
          status: "approved",
          processedAt: nowIso,
          processedBy: admin?.displayName || "Admin"
        }, { merge: true });

        await setDoc(doc(db, "wallet_transactions", t.id), {
          status: "completed"
        }, { merge: true });

        logAdminActivity({
          action: "approve",
          entity_type: "wallet",
          entity_id: t.id,
          entity_name: t.userName || "Customer",
          details: `Approved wallet top-up of ৳${t.amount} (TrxID: ${t.trxId})`,
        });

        toast({
          title: "টপ-আপ অনুমোদিত ও ব্যালেন্স যুক্ত হয়েছে! 🎉",
          description: `৳${t.amount} কাস্টমারের ওয়ালেটে যুক্ত করা হয়েছে।`,
        });
        fetchData();
      } else {
        throw new Error(res?.error || "Failed to credit balance");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ত্রুটি", description: err.message });
    } finally {
      setProcessingTopupId(null);
    }
  };

  const handleRejectTopup = async (t: TopUpItem) => {
    if (!window.confirm(`Are you sure you want to reject Top-up request for ৳${t.amount} (TrxID: ${t.trxId})?`)) return;
    try {
      setProcessingTopupId(t.id);
      const nowIso = new Date().toISOString();
      await setDoc(doc(db, "wallet_topups", t.id), {
        status: "rejected",
        processedAt: nowIso,
        processedBy: admin?.displayName || "Admin"
      }, { merge: true });

      await setDoc(doc(db, "wallet_transactions", t.id), {
        status: "cancelled"
      }, { merge: true });

      logAdminActivity({
        action: "reject",
        entity_type: "wallet",
        entity_id: t.id,
        entity_name: t.userName || "Customer",
        details: `Rejected wallet top-up request for ৳${t.amount} (TrxID: ${t.trxId})`,
      });

      toast({
        title: "টপ-আপ বাতিল করা হয়েছে",
        description: `TrxID ${t.trxId} এর টপ-আপ অনুরোধ বাতিল করা হয়েছে।`,
      });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ত্রুটি", description: err.message });
    } finally {
      setProcessingTopupId(null);
    }
  };

  // Handlers for Withdrawals
  const handleApproveWithdrawal = async (w: WithdrawalItem) => {
    try {
      setProcessingWithdrawalId(w.id);
      const res = await processWithdrawal(w.id, "approved", "Approved by admin", admin?.displayName || "Admin");
      if (res?.success) {
        logAdminActivity({
          action: "approve",
          entity_type: "wallet",
          entity_id: w.id,
          entity_name: w.userName || "Customer",
          details: `Approved referral withdrawal of ৳${w.amount} (${w.method.toUpperCase()} - ${w.accountNumber})`,
        });
        toast({ title: "উত্তোলন অনুমোদিত", description: `৳${w.amount} উত্তোলন অনুমোদিত হয়েছে।` });
        fetchData();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ত্রুটি", description: err.message });
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleMarkPaidWithdrawal = async (w: WithdrawalItem) => {
    try {
      setProcessingWithdrawalId(w.id);
      const res = await processWithdrawal(w.id, "paid", "Paid via mobile banking", admin?.displayName || "Admin");
      if (res?.success) {
        logAdminActivity({
          action: "approve",
          entity_type: "wallet",
          entity_id: w.id,
          entity_name: w.userName || "Customer",
          details: `Marked referral withdrawal of ৳${w.amount} as PAID (${w.method.toUpperCase()} - ${w.accountNumber})`,
        });
        toast({ title: "পেইড হিসেবে চিহ্নিত", description: `৳${w.amount} পেমেন্ট সম্পন্ন হয়েছে।` });
        fetchData();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ত্রুটি", description: err.message });
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleRejectWithdrawalSubmit = async () => {
    if (!targetWithdrawal) return;
    try {
      setProcessingWithdrawalId(targetWithdrawal.id);
      const res = await processWithdrawal(
        targetWithdrawal.id, 
        "rejected", 
        rejectReason || "Rejected by admin", 
        admin?.displayName || "Admin"
      );

      if (res?.success) {
        toast({ 
          title: "উত্তোলন বাতিল ও রিফান্ড সম্পন্ন", 
          description: `উত্তোলন বাতিল করা হয়েছে এবং ৳${targetWithdrawal.amount} ব্যবহারকারীর ওয়ালেটে ফেরত দেওয়া হয়েছে।` 
        });
        setRejectModalOpen(false);
        setTargetWithdrawal(null);
        setRejectReason("");
        fetchData();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ত্রুটি", description: err.message });
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  // Manual Reward / Reversal Handlers
  const handleManualReward = async (r: ReferralItem) => {
    if (!r.orderId) return;
    try {
      const res = await processOrderReferralReward(r.orderId, "delivered");
      if (res?.success) {
        toast({ title: "রিওয়ার্ড সফলভাবে প্রদান করা হয়েছে!", description: `৳${res.rewardAmount || 50} রেফারার ওয়ালেটে যোগ হয়েছে।` });
        fetchData();
      } else {
        toast({ variant: "destructive", title: "নোটিশ", description: res?.reason || "Could not process reward" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ত্রুটি", description: err.message });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await saveReferralSettings(settings);
      toast({ title: "সেটিংস সংরক্ষিত হয়েছে!", description: "রেফারেল সিস্টেম সেটিংস সফলভাবে আপডেট হয়েছে।" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "সংরক্ষণ ত্রুটি", description: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered lists
  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch = 
      (r.referralCode && r.referralCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.referrerName && r.referrerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.orderNumber && r.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch = 
      (w.accountNumber && w.accountNumber.includes(searchQuery)) ||
      (w.userName && w.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.userEmail && w.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTopups = topups.filter((t) => {
    const matchesSearch = 
      (t.senderNumber && t.senderNumber.includes(searchQuery)) ||
      (t.trxId && t.trxId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.userName && t.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Referrals & Rewards Management">
      <div className="space-y-6 pb-12">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Share2 className="h-6 w-6 text-primary" />
              Referrals & Wallet Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              রেফারেল প্রোগ্রাম, ওয়ালেট রিওয়ার্ড ও ক্যাশআউট রিকোয়েস্ট ম্যানেজমেন্ট
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={refreshing}
              className="rounded-xl font-bold gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          <Card className="rounded-2xl border shadow-sm bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Unique Referrers</span>
              <p className="text-2xl font-black text-foreground">{uniqueReferrers}</p>
              <p className="text-[10px] text-muted-foreground">মোট সক্রিয় রেফারার</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Total Referred</span>
              <p className="text-2xl font-black text-foreground">{totalReferredUsers}</p>
              <p className="text-[10px] text-muted-foreground">মোট রেফারেল অর্ডার</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-emerald-600">Successful</span>
              <p className="text-2xl font-black text-emerald-600">{successfulReferrals}</p>
              <p className="text-[10px] text-muted-foreground">রিওয়ার্ড প্রদান সম্পন্ন</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-amber-600">Pending</span>
              <p className="text-2xl font-black text-amber-600">{pendingReferrals}</p>
              <p className="text-[10px] text-muted-foreground">ডেলিভারির অপেক্ষায়</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-card">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-primary">Rewards Issued</span>
              <p className="text-2xl font-black text-primary">৳{totalRewardsIssued.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">মোট প্রদত্ত বোনাস</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Pending Withdrawals</span>
              <p className="text-2xl font-black text-amber-600">৳{pendingWithdrawalsAmount.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{pendingWithdrawalsCount} টি পেন্ডিং রিকোয়েস্ট</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-[#E2136E]">Pending Top-Ups</span>
              <p className="text-2xl font-black text-[#E2136E]">৳{pendingTopupsAmount.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{pendingTopupsCount} টি টপ-আপ রিকোয়েস্ট</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Control */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-xl flex-wrap">
            <TabsTrigger value="referrals" className="rounded-lg font-bold gap-2 text-xs sm:text-sm">
              <Share2 className="h-4 w-4" />
              Referrals List ({referrals.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-lg font-bold gap-2 text-xs sm:text-sm relative">
              <Wallet className="h-4 w-4" />
              Withdrawals
              {pendingWithdrawalsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                  {pendingWithdrawalsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="topups" className="rounded-lg font-bold gap-2 text-xs sm:text-sm relative">
              <Plus className="h-4 w-4" />
              Top-Up Requests
              {pendingTopupsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#E2136E] text-white rounded-full text-[10px] font-black">
                  {pendingTopupsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg font-bold gap-2 text-xs sm:text-sm">
              <SettingsIcon className="h-4 w-4" />
              Referral Settings
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: REFERRALS TABLE */}
          <TabsContent value="referrals" className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="রেফারেল কোড, রেফারার বা অর্ডার নম্বর দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="rewarded">Rewarded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Referrals Table */}
            <Card className="rounded-2xl border shadow-sm overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Referral Code</TableHead>
                    <TableHead className="font-bold text-xs">Referrer</TableHead>
                    <TableHead className="font-bold text-xs">Referred Customer</TableHead>
                    <TableHead className="font-bold text-xs">Order / Amount</TableHead>
                    <TableHead className="font-bold text-xs">Reward</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Date</TableHead>
                    <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <p className="text-xs text-muted-foreground mt-2">তথ্য লোড হচ্ছে...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredReferrals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                        কোনো রেফারেল রেকর্ড খুঁজে পাওয়া যায়নি।
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReferrals.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-xs text-primary">
                          {r.referralCode}
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="font-bold text-foreground">{r.referrerName || "User"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{r.referrerId?.slice(0, 8)}...</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="font-medium text-foreground">{r.referredUserName || "Customer"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{r.referredUserId?.slice(0, 8)}...</p>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="font-bold text-foreground">#{r.orderNumber || r.orderId}</p>
                          <p className="text-[11px] text-muted-foreground">৳{r.orderAmount?.toLocaleString()}</p>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-emerald-600">
                          ৳{r.rewardAmount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.status === "rewarded"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] font-bold"
                                : r.status === "pending" || r.status === "qualified"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] font-bold"
                                : "bg-muted text-muted-foreground text-[10px]"
                            }
                          >
                            {r.status === "rewarded" ? "Rewarded" : r.status === "pending" ? "Pending" : r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {r.status !== "rewarded" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualReward(r)}
                              className="h-8 text-xs font-bold rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              Reward Now
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: WITHDRAWAL REQUESTS */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card className="rounded-2xl border shadow-sm overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Customer</TableHead>
                    <TableHead className="font-bold text-xs">Amount</TableHead>
                    <TableHead className="font-bold text-xs">Method</TableHead>
                    <TableHead className="font-bold text-xs">Account Number</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Requested At</TableHead>
                    <TableHead className="text-right font-bold text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <p className="text-xs text-muted-foreground mt-2">উত্তোলন ডেটা লোড হচ্ছে...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredWithdrawals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                        কোনো উত্তোলন অনুরোধ খুঁজে পাওয়া যায়নি।
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWithdrawals.map((w) => (
                      <TableRow key={w.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs">
                          <p className="font-bold text-foreground">{w.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{w.userEmail || w.userId}</p>
                        </TableCell>
                        <TableCell className="font-black text-sm text-foreground">
                          ৳{w.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-bold uppercase text-[10px]">
                            {w.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs">
                          {w.accountNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              w.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] font-bold"
                                : w.status === "approved"
                                ? "bg-blue-500/10 text-blue-700 border-blue-500/30 text-[10px] font-bold"
                                : w.status === "pending"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] font-bold"
                                : "bg-red-500/10 text-red-700 border-red-500/30 text-[10px] font-bold"
                            }
                          >
                            {w.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(w.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {w.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingWithdrawalId === w.id}
                                onClick={() => handleMarkPaidWithdrawal(w)}
                                className="h-8 text-xs font-bold rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              >
                                Mark Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingWithdrawalId === w.id}
                                onClick={() => {
                                  setTargetWithdrawal(w);
                                  setRejectModalOpen(true);
                                }}
                                className="h-8 text-xs font-bold rounded-lg text-red-600 border-red-500/30 hover:bg-red-500/10"
                              >
                                Reject & Refund
                              </Button>
                            </>
                          )}
                          {w.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingWithdrawalId === w.id}
                              onClick={() => handleMarkPaidWithdrawal(w)}
                              className="h-8 text-xs font-bold rounded-lg text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB: TOP-UP REQUESTS */}
          <TabsContent value="topups" className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="বিকাশ নম্বর, TrxID বা গ্রাহকের নাম দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Top-Ups Table */}
            <Card className="rounded-2xl border shadow-sm overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Customer</TableHead>
                    <TableHead className="font-bold text-xs">Amount</TableHead>
                    <TableHead className="font-bold text-xs">Method</TableHead>
                    <TableHead className="font-bold text-xs">Sender Number</TableHead>
                    <TableHead className="font-bold text-xs">TrxID</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Date</TableHead>
                    <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredTopups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                        কোনো টপ-আপ অনুরোধ পাওয়া যায়নি।
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTopups.map((t) => (
                      <TableRow key={t.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs">
                          <p className="font-bold text-foreground">{t.userName}</p>
                          <p className="text-[10px] text-muted-foreground">{t.userEmail || t.userId}</p>
                        </TableCell>
                        <TableCell className="font-black text-sm text-foreground">
                          ৳{t.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#E2136E] text-white font-bold uppercase text-[10px]">
                            {t.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs">
                          {t.senderNumber}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-[#E2136E]">
                          {t.trxId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              t.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px] font-bold"
                                : t.status === "pending"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] font-bold"
                                : "bg-red-500/10 text-red-700 border-red-500/30 text-[10px] font-bold"
                            }
                          >
                            {t.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {t.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                disabled={processingTopupId === t.id}
                                onClick={() => handleApproveTopup(t)}
                                className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              >
                                {processingTopupId === t.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  `Approve & Credit ৳${t.amount}`
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={processingTopupId === t.id}
                                onClick={() => handleRejectTopup(t)}
                                className="h-8 text-xs font-bold rounded-lg text-red-600 border-red-500/30 hover:bg-red-500/10"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 4: REFERRAL SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="rounded-2xl border shadow-sm bg-card max-w-2xl">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  Referral & Reward Global Rules
                </CardTitle>
                <CardDescription className="text-xs">
                  এই মানগুলি পরিবর্তন করলে কোড পরিবর্তন ছাড়াই অবিলম্বে রেফারেল প্রোগ্রামে কার্যকর হবে।
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  {/* System Enable / Disable */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border">
                    <div>
                      <Label className="font-bold text-sm">রেফারেল সিস্টেম চালু রাখুন</Label>
                      <p className="text-xs text-muted-foreground">সিস্টেম বন্ধ করলে নতুন বোনাস বা ছাড় প্রযোজ্য হবে না।</p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                    />
                  </div>

                  {/* Referrer Reward Amount */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs">রেফারার রিওয়ার্ড (টাকা)</Label>
                      <Input
                        type="number"
                        value={settings.referrerReward}
                        onChange={(e) => setSettings({ ...settings, referrerReward: Number(e.target.value) })}
                        className="rounded-xl h-10 font-bold"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">প্রতি সফল অর্ডারে রেফারার পাবেন।</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs">নতুন গ্রাহকের ছাড় (টাকা)</Label>
                      <Input
                        type="number"
                        value={settings.newCustomerDiscount}
                        onChange={(e) => setSettings({ ...settings, newCustomerDiscount: Number(e.target.value) })}
                        className="rounded-xl h-10 font-bold"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">রেফারেল লিংকে প্রথম অর্ডারে গ্রাহক ছাড় পাবেন।</p>
                    </div>
                  </div>

                  {/* Minimum Order & Trigger */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs">ন্যূনতম অর্ডার মূল্য (টাকা)</Label>
                      <Input
                        type="number"
                        value={settings.minimumOrderAmount}
                        onChange={(e) => setSettings({ ...settings, minimumOrderAmount: Number(e.target.value) })}
                        className="rounded-xl h-10 font-bold"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">রিওয়ার্ড পাওয়ার যোগ্য ন্যূনতম কার্ট মূল্য।</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs">রিওয়ার্ড ট্রিগার স্ট্যাটাস</Label>
                      <Select
                        value={settings.rewardTrigger}
                        onValueChange={(v) => setSettings({ ...settings, rewardTrigger: v })}
                      >
                        <SelectTrigger className="rounded-xl h-10 font-bold">
                          <SelectValue placeholder="Reward Trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delivered">Delivered (সুপারিশকৃত)</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">যে স্ট্যাটাসে পৌঁছালে স্বয়ংক্রিয় রিওয়ার্ড যোগ হবে।</p>
                    </div>
                  </div>

                  {/* Daily Max Limit & Minimum Withdrawal */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs">দৈনিক সর্বোচ্চ রিওয়ার্ড সীমা (জন)</Label>
                      <Input
                        type="number"
                        value={settings.maxDailyRewards}
                        onChange={(e) => setSettings({ ...settings, maxDailyRewards: Number(e.target.value) })}
                        className="rounded-xl h-10 font-bold"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">প্রতি ২৪ ঘন্টায় একজন ব্যবহারকারীর সর্বোচ্চ রিওয়ার্ড।</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs">ন্যূনতম ক্যাশআউট / উত্তোলন (টাকা)</Label>
                      <Input
                        type="number"
                        value={settings.minimumWithdrawAmount}
                        onChange={(e) => setSettings({ ...settings, minimumWithdrawAmount: Number(e.target.value) })}
                        className="rounded-xl h-10 font-bold"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">সর্বনিম্ন যত টাকা উত্তোলন অনুরোধ করা যাবে।</p>
                    </div>
                  </div>

                  {/* Withdrawal Enabled */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border">
                    <div>
                      <Label className="font-bold text-sm">ওয়ালেট উত্তোলন (Withdrawal) চালু রাখুন</Label>
                      <p className="text-xs text-muted-foreground">বন্ধ রাখলে গ্রাহকরা সাময়িকভাবে নতুন উত্তোলনের অনুরোধ করতে পারবে না।</p>
                    </div>
                    <Switch
                      checked={settings.withdrawEnabled}
                      onCheckedChange={(v) => setSettings({ ...settings, withdrawEnabled: v })}
                    />
                  </div>

                  <Button type="submit" disabled={savingSettings} className="w-full h-11 rounded-xl font-bold gap-2">
                    {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>সেটিংস সংরক্ষণ করুন</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Withdrawal Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              উত্তোলন বাতিল ও রিফান্ড
            </DialogTitle>
            <DialogDescription className="text-xs">
              উত্তোলন বাতিল করলে অনুরোধকৃত <strong>৳{targetWithdrawal?.amount}</strong> স্বয়ংক্রিয়ভাবে গ্রাহকের ওয়ালেটে ফেরত দেওয়া হবে।
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">বাতিলকরণের কারণ (Admin Note)</Label>
              <Input
                placeholder="যেমন: ভুল বিকাশ নম্বর বা তথ্য অসম্পূর্ণ"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="rounded-xl">
              ফিরে যান
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectWithdrawalSubmit} 
              disabled={Boolean(processingWithdrawalId)}
              className="rounded-xl font-bold"
            >
              {processingWithdrawalId ? "বাতিল হচ্ছে..." : "বাতিল ও রিফান্ড নিশ্চিত করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
