import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Building2, 
  History,
  Sparkles,
  Info
} from "lucide-react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile, ResellerWithdrawal } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ResellerWallet() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [withdrawals, setWithdrawals] = useState<ResellerWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdraw Modal Form
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawMethod, setWithdrawMethod] = useState<"bkash" | "nagad" | "rocket" | "bank">("bkash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    Promise.all([
      ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "Partner"),
      ResellerService.getWithdrawals(uid)
    ]).then(([prof, withs]) => {
      setProfile(prof);
      setWithdrawals(withs);
      setWithdrawAmount(prof.walletBalance > 0 ? prof.walletBalance : 100);
      setAccountNumber(prof.defaultPaymentAccount || "");
      setAccountName(prof.shopName || "");
      setLoading(false);
    });
  }, [user, authProfile]);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile || profile.walletBalance < withdrawAmount) {
      toast({
        variant: "destructive",
        title: "অপর্যাপ্ত ব্যালেন্স",
        description: `আপনার সর্বোচ্চ উইথড্রলযোগ্য ব্যালেন্স ৳${profile?.walletBalance || 0}`
      });
      return;
    }

    if (withdrawAmount < 100) {
      toast({
        variant: "destructive",
        title: "নূন্যতম উইথড্র ১০০ টাকা",
        description: "কমপক্ষে ১০০ টাকা উইথড্র রিকোয়েস্ট পাঠানো যাবে।"
      });
      return;
    }

    if (!accountNumber.trim()) {
      toast({
        variant: "destructive",
        title: "একাউন্ট নম্বর দিন",
        description: "বিকাশ/নগদ বা ব্যাংক একাউন্ট নম্বর দেওয়া আবশ্যক।"
      });
      return;
    }

    setSubmitting(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      const withRes = await ResellerService.requestWithdrawal(uid, {
        amount: withdrawAmount,
        method: withdrawMethod,
        accountNumber: accountNumber,
        accountName: accountName || profile.shopName,
      });

      // Update local state
      const updatedProfile = await ResellerService.getProfile(uid);
      const updatedWiths = await ResellerService.getWithdrawals(uid);
      setProfile(updatedProfile);
      setWithdrawals(updatedWiths);

      setWithdrawModalOpen(false);
      toast({
        title: "🎉 উইথড্র রিকোয়েস্ট সফল হয়েছে!",
        description: `৳${withdrawAmount} উইথড্র রিকোয়েস্ট গৃহীত হয়েছে। খুব শীঘ্রই টাকা আপনার ${withdrawMethod.toUpperCase()}-এ পৌঁছাবে।`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "ব্যর্থ হয়েছে",
        description: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResellerLayout>
      <SEOHead title="রিসেলার ওয়ালেট ও পে-আউট - Durtup Reseller" />

      <div className="space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-6 w-6 text-orange-600" />
              <span>রিসেলার ওয়ালেট ও টাকা উত্তোলন</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ডেলিভারি হওয়া অর্ডারের লাভ সরাসরি আপনার বিকাশ, নগদ বা ব্যাংক একাউন্টে ক্যাশআউট করুন।
            </p>
          </div>

          <Button
            onClick={() => setWithdrawModalOpen(true)}
            disabled={!profile || profile.walletBalance < 100}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 text-xs h-10 px-5"
          >
            <ArrowUpRight className="h-4 w-4 mr-1.5" />
            <span>টাকা তুলুন (উইথড্র)</span>
          </Button>
        </div>

        {/* 3 Wallet Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Available Balance */}
          <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 p-5 rounded-2xl border border-emerald-500/30 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                উইথড্রলযোগ্য ব্যালেন্স
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black">
                ৳
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 mt-3">
              ৳{profile?.walletBalance?.toLocaleString("en-IN") || 0}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
              নূন্যতম উইথড্র: ৳১০০ (১২-২৪ ঘণ্টার মধ্যে পেইড)
            </p>
          </div>

          {/* 2. Pending Balance */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                পেন্ডিং প্রফিট মার্জিন
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              ৳{profile?.pendingBalance?.toLocaleString("en-IN") || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              কুরিয়ার ডেলিভারি সম্পন্ন হলে এই ব্যালেন্স আনলক হবে
            </p>
          </div>

          {/* 3. Total Payouts */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                মোট পেইড উইথড্রয়াল
              </span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-3">
              ৳{withdrawals.filter(w => w.status === "approved").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-purple-600 font-semibold mt-2">
              সফল উইথড্র সংখ্যা: {withdrawals.filter(w => w.status === "approved").length} টি
            </p>
          </div>

        </div>

        {/* Payment Policy Banner */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
          <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-900 dark:text-white">উইথড্রয়াল ও পে-আউট নিয়মাবলী:</p>
            <p>• উইথড্র রিকোয়েস্ট পাঠানোর পর ১২ থেকে ২৪ ঘণ্টার মধ্যে সরাসরি bKash / Nagad পার্সোনাল নাম্বারে সেন্ড মানি বা ক্যাশ-ইন করা হয়।</p>
            <p>• কোনো প্রকার উইথড্রয়াল ফি কাটা হয় না (জিরো ট্রানজেকশন ফি)।</p>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              টাকা উত্তোলনের ইতিহাস (Payout History)
            </h2>
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 space-y-2">
              <Wallet className="h-10 w-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                এখনো কোনো উইথড্রয়াল রিকোয়েস্ট করা হয়নি
              </p>
              <p className="text-xs text-slate-500">
                অর্ডার ডেলিভারির পর ব্যালেন্স যোগ হলে সরাসরি বিকাশে টাকা তুলুন।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">তারিখ</th>
                    <th className="pb-3 font-bold">মেথড</th>
                    <th className="pb-3 font-bold">একাউন্ট নম্বর ও নাম</th>
                    <th className="pb-3 font-bold">পরিমাণ</th>
                    <th className="pb-3 font-bold">স্ট্যাটাস</th>
                    <th className="pb-3 font-bold">TrxID / নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {new Date(w.requestedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-3 uppercase font-extrabold text-orange-600">
                        {w.method}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{w.accountNumber}</p>
                        <p className="text-[10px] text-slate-500">{w.accountName}</p>
                      </td>
                      <td className="py-3 font-black text-sm text-slate-900 dark:text-white">
                        ৳{w.amount}
                      </td>
                      <td className="py-3">
                        <Badge className={
                          w.status === "approved"
                            ? "bg-emerald-600 text-white"
                            : w.status === "rejected"
                            ? "bg-rose-600 text-white"
                            : "bg-amber-500 text-white"
                        }>
                          {w.status === "approved" ? "পেইড (Paid)" : w.status === "rejected" ? "বাতিল" : "পেন্ডিং (Processing)"}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-slate-500 text-[11px]">
                        {w.trxId || "প্রক্রিয়াধীন..."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Withdraw Modal Dialog */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              <span>উইথড্র রিকোয়েস্ট পাঠান</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
            
            {/* Balance banner */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300 font-bold">উইথড্রলযোগ্য ব্যালেন্স:</span>
              <span className="text-lg font-black text-emerald-600">৳{profile?.walletBalance || 0}</span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                পেমেন্ট মেথড নির্বাচন করুন *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "bkash", label: "bKash" },
                  { id: "nagad", label: "Nagad" },
                  { id: "rocket", label: "Rocket" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWithdrawMethod(m.id as any)}
                    className={`py-2.5 rounded-xl border font-bold text-center transition-all ${
                      withdrawMethod === m.id
                        ? "border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-600 ring-2 ring-orange-500/20"
                        : "border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                উইথড্র টাকার পরিমাণ (৳) *
              </label>
              <Input
                type="number"
                min={100}
                max={profile?.walletBalance || 100}
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="rounded-xl font-black text-base h-11 text-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">নূন্যতম ১০০ টাকা</span>
            </div>

            {/* Account Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {withdrawMethod.toUpperCase()} পার্সোনাল নম্বর *
              </label>
              <Input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="rounded-xl text-xs h-10"
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                একাউন্ট হোল্ডারের নাম / শপ নেম
              </label>
              <Input
                placeholder="আপনার নাম বা শপ নেম"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="rounded-xl text-xs h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !profile || profile.walletBalance < withdrawAmount}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 text-sm shadow-md"
            >
              {submitting ? "প্রসেসিং হচ্ছে..." : "কনফার্ম উইথড্র রিকোয়েস্ট"}
            </Button>

          </form>
        </DialogContent>
      </Dialog>

    </ResellerLayout>
  );
}
