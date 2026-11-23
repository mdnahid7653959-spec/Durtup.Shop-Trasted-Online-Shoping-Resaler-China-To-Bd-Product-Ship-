import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { adminDb } from "@/lib/adminDb";
import { Gift, Star, Trophy, Users, Plus, Trash2, Edit, Settings, History, Sparkles, CheckCircle2, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getLoyaltySettings,
  saveLoyaltySettings as saveLoyaltySettingsService,
  awardBonusPoints,
  getAllLoyaltyMembers,
  getAllLoyaltyHistory,
  LoyaltySettings,
  LoyaltyAccount,
  LoyaltyTransaction,
  DEFAULT_LOYALTY_SETTINGS
} from "@/services/loyaltyService";

interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: any;
  is_active: boolean;
}

export default function AdminLoyalty() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [members, setMembers] = useState<LoyaltyAccount[]>([]);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const { toast } = useToast();

  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);

  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    points_required: 100,
    reward_type: "discount",
    reward_value: { discount_percent: 10 }
  });

  // Bonus points modal state
  const [bonusForm, setBonusForm] = useState({
    userId: "",
    userEmail: "",
    points: 100,
    reason: "কাস্টমার লয়্যালটি বোনাস (Customer Loyalty Bonus)"
  });
  const [grantingBonus, setGrantingBonus] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [savedSettings, memberList, historyList, rewardsRes] = await Promise.all([
        getLoyaltySettings(),
        getAllLoyaltyMembers(100),
        getAllLoyaltyHistory(100),
        adminDb.select<LoyaltyReward>("loyalty_rewards", { orderBy: { col: "points_required" } }).catch(() => ({ data: [] }))
      ]);

      setSettings(savedSettings);
      setMembers(memberList);
      setHistory(historyList);
      if (rewardsRes.data) setRewards(rewardsRes.data);
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveLoyaltySettingsService(settings);
      toast({
        title: "সেটিংস সংরক্ষিত হয়েছে",
        description: "লয়্যালটি পয়েন্টস প্রোগ্রাম সেটিংস সফলভাবে আপডেট করা হয়েছে।"
      });
    } catch (e: any) {
      toast({
        title: "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে",
        description: e.message || String(e),
        variant: "destructive"
      });
    }
  };

  const handleGrantBonus = async () => {
    if (!bonusForm.userId.trim()) {
      toast({ title: "ইউজার আইডি দিন", description: "বোনাস পয়েন্ট দিতে ইউজার আইডি আবশ্যক।", variant: "destructive" });
      return;
    }
    if (bonusForm.points <= 0) {
      toast({ title: "সঠিক পয়েন্ট সংখ্যা দিন", description: "পয়েন্ট সংখ্যা ১ বা তার বেশি হতে হবে।", variant: "destructive" });
      return;
    }

    setGrantingBonus(true);
    try {
      const res = await awardBonusPoints(
        bonusForm.userId.trim(),
        bonusForm.points,
        bonusForm.reason.trim(),
        bonusForm.userEmail.trim() || undefined
      );

      if (res.success) {
        toast({
          title: "বোনাস পয়েন্ট প্রদান সম্পন্ন!",
          description: `ইউজারকে সফলভাবে ${bonusForm.points} বোনাস পয়েন্ট দেওয়া হয়েছে।`
        });
        setBonusDialogOpen(false);
        setBonusForm({
          userId: "",
          userEmail: "",
          points: 100,
          reason: "কাস্টমার লয়্যালটি বোনাস (Customer Loyalty Bonus)"
        });
        fetchData();
      } else {
        toast({ title: "ব্যর্থ হয়েছে", description: res.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || String(err), variant: "destructive" });
    } finally {
      setGrantingBonus(false);
    }
  };

  const saveReward = async () => {
    const data = {
      name: rewardForm.name,
      description: rewardForm.description,
      points_required: rewardForm.points_required,
      reward_type: rewardForm.reward_type,
      reward_value: rewardForm.reward_value,
      is_active: true,
    };
    if (editingReward) {
      await adminDb.update("loyalty_rewards", data, { id: editingReward.id });
      toast({ title: "Reward updated" });
    } else {
      await adminDb.insert("loyalty_rewards", data);
      toast({ title: "Reward created" });
    }
    setRewardDialogOpen(false);
    setEditingReward(null);
    setRewardForm({ name: "", description: "", points_required: 100, reward_type: "discount", reward_value: { discount_percent: 10 } });
    fetchData();
  };

  const toggleReward = async (id: string, isActive: boolean) => {
    await adminDb.update("loyalty_rewards", { is_active: !isActive }, { id });
    fetchData();
  };

  const deleteReward = async (id: string) => {
    if (!confirm("Delete this reward?")) return;
    await adminDb.remove("loyalty_rewards", { id });
    fetchData();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300";
      case "gold": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300";
      case "silver": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300";
      default: return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200";
    }
  };

  const stats = {
    totalMembers: members.length,
    platinum: members.filter(m => m.tier === "platinum").length,
    gold: members.filter(m => m.tier === "gold").length,
    silver: members.filter(m => m.tier === "silver").length,
    totalPointsIssued: members.reduce((sum, m) => sum + (m.lifetime_points || 0), 0)
  };

  if (loading) {
    return (
      <AdminLayout title="Loyalty Points Program">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Loyalty Points Program">
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground font-medium">মোট মেম্বার</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-purple-500/20 bg-purple-500/5 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{stats.platinum}</p>
                  <p className="text-xs text-muted-foreground font-medium">প্ল্যাটিনাম মেম্বার</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-amber-500/20 bg-amber-500/5 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-300">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.gold}</p>
                  <p className="text-xs text-muted-foreground font-medium">গোল্ড মেম্বার</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/80 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{stats.totalPointsIssued.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-medium">মোট প্রদানকৃত পয়েন্ট</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList className="grid grid-cols-4 max-w-xl">
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs font-bold">
              <Settings className="h-3.5 w-3.5" /> সেটিংস
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1.5 text-xs font-bold">
              <Users className="h-3.5 w-3.5" /> মেম্বার তালিকা
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs font-bold">
              <History className="h-3.5 w-3.5" /> অডিট হিস্ট্রি
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-1.5 text-xs font-bold">
              <Gift className="h-3.5 w-3.5" /> রিওয়ার্ডস
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SETTINGS (Enterprise Control Panel) */}
          <TabsContent value="settings">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-4 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      লয়্যালটি পয়েন্টস কনফিগারেশন সেটিংস
                    </CardTitle>
                    <CardDescription className="text-xs">
                      কাস্টমার প্রতিটি অর্ডারে কত পয়েন্ট পাবে, কনভার্সন রেট এবং রিডেম্পশন নীতি নির্ধারণ করুন
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold">প্রোগ্রাম সক্রিয়:</Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(val) => setSettings({ ...settings, enabled: val })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Points Calculation & Conversion */}
                  <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/60">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" /> পয়েন্ট অর্জন ও কনভার্সন রেট
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-xs font-bold">প্রতি ৳১০০ কেনাকাটায় পয়েন্ট</Label>
                          <p className="text-[11px] text-muted-foreground">ডেলিভারড অর্ডারের সফল মূল্যের প্রতি ৳১০০ এর জন্য পয়েন্ট পাবে</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={settings.pointsPerHundredSpent}
                          onChange={(e) => setSettings({ ...settings, pointsPerHundredSpent: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-xs font-bold">পয়েন্ট কনভার্সন রেট (১ পয়েন্ট = কত টাকা)</Label>
                          <p className="text-[11px] text-muted-foreground">যেমন: 0.50 দিলে ১০০ পয়েন্টের মূল্য হবে ৳৫০ ছাড়</p>
                        </div>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.01"
                          value={settings.pointValueInTaka}
                          onChange={(e) => setSettings({ ...settings, pointValueInTaka: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-xs font-bold">রিডিম করার ন্যূনতম পয়েন্ট (Min Points)</Label>
                          <p className="text-[11px] text-muted-foreground">কাস্টমারের সর্বনিম্ন কত পয়েন্ট জমা থাকলে চেকআউটে ব্যবহার করতে পারবে</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={settings.minPointsToRedeem}
                          onChange={(e) => setSettings({ ...settings, minPointsToRedeem: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-xs font-bold">সর্বোচ্চ রিডেম্পশন পার্সেন্টেজ (%)</Label>
                          <p className="text-[11px] text-muted-foreground">অর্ডারের সাবটোটালের সর্বোচ্চ কত শতাংশ পয়েন্ট দিয়ে ছাড় নেওয়া যাবে</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={settings.maxPointsRedemptionPercent}
                            onChange={(e) => setSettings({ ...settings, maxPointsRedemptionPercent: Number(e.target.value) })}
                            className="w-20 text-center font-bold"
                          />
                          <span className="text-xs font-bold">%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label className="text-xs font-bold">পয়েন্টের মেয়াদ (Expiry Days)</Label>
                          <p className="text-[11px] text-muted-foreground">কত দিন পর পয়েন্ট মেয়াদোত্তীর্ণ হবে (০ দিলে মেয়াদহীন / Never Expire)</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            value={settings.expiryDays}
                            onChange={(e) => setSettings({ ...settings, expiryDays: Number(e.target.value) })}
                            className="w-24 text-center font-bold"
                          />
                          <span className="text-xs text-muted-foreground">দিন</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: VIP Membership Tiers */}
                  <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-border/60">
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-500" /> ভিআইপি মেম্বারশিপ টায়ার থ্রেশহোল্ড (লাইফটাইম পয়েন্ট)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      লাইফটাইম অর্জিত মোট পয়েন্ট অনুযায়ী কাস্টমার অটোমেটিক টায়ারে উন্নীত হবে:
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getTierColor("bronze")}>ব্রোঞ্জ (Bronze)</Badge>
                        <Input
                          type="number"
                          value={settings.bronzeThreshold}
                          onChange={(e) => setSettings({ ...settings, bronzeThreshold: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getTierColor("silver")}>সিলভার (Silver)</Badge>
                        <Input
                          type="number"
                          value={settings.silverThreshold}
                          onChange={(e) => setSettings({ ...settings, silverThreshold: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getTierColor("gold")}>গোল্ড (Gold)</Badge>
                        <Input
                          type="number"
                          value={settings.goldThreshold}
                          onChange={(e) => setSettings({ ...settings, goldThreshold: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={getTierColor("platinum")}>প্ল্যাটিনাম (Platinum)</Badge>
                        <Input
                          type="number"
                          value={settings.platinumThreshold}
                          onChange={(e) => setSettings({ ...settings, platinumThreshold: Number(e.target.value) })}
                          className="w-24 text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <ShieldCheck className="h-4 w-4" /> সম্পূর্ণ সার্ভার-সাইড ভ্যালিডেশন ও সিকিউরিটি নিশ্চিত
                      </div>
                      <p>চেকআউটে পয়েন্ট পরিবর্তন বা ডুপ্লিকেট ক্রেডিট প্রতিরোধ ব্যবস্থা সক্রিয় রয়েছে।</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveSettings}
                    className="h-10 px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md"
                  >
                    সেটিংস সংরক্ষণ করুন (Save Settings)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MEMBERS & BONUS POINTS */}
          <TabsContent value="members">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">লয়্যালটি পয়েন্টস মেম্বার তালিকা</CardTitle>
                  <CardDescription className="text-xs">
                    সব কাস্টমারের বর্তমান পয়েন্ট ব্যালেন্স ও লাইফটাইম স্কোর
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setBonusDialogOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" /> বোনাস পয়েন্ট দিন (Give Bonus)
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ইউজার আইডি / ইমেইল</TableHead>
                      <TableHead className="text-center">বর্তমান পয়েন্ট</TableHead>
                      <TableHead className="text-center">লাইফটাইম পয়েন্ট</TableHead>
                      <TableHead className="text-center">ব্যয়কৃত পয়েন্ট</TableHead>
                      <TableHead className="text-center">টায়ার (Tier)</TableHead>
                      <TableHead className="text-right">একশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          কোনো লয়্যালটি মেম্বার পাওয়া যায়নি।
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">
                                {member.user_name || member.user_email || `User: ${member.user_id.slice(0, 10)}...`}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">{member.user_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-black text-amber-600">
                            ★ {member.points.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-bold text-foreground">
                            {member.lifetime_points.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground font-medium">
                            {member.points_spent?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getTierColor(member.tier)}>
                              {member.tier.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBonusForm({
                                  userId: member.user_id,
                                  userEmail: member.user_email || "",
                                  points: 100,
                                  reason: "লয়্যালটি স্পেশাল রিওয়ার্ড"
                                });
                                setBonusDialogOpen(true);
                              }}
                              className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            >
                              + বোনাস পয়েন্ট
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: AUDIT HISTORY / TRANSACTION LEDGER */}
          <TabsContent value="history">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  পয়েন্ট লেনদেন অডিট লগ (Transaction Ledger)
                </CardTitle>
                <CardDescription className="text-xs">
                  পয়েন্ট অর্জন, রিডিম, বোনাস ও রিফান্ড সংক্রান্ত সম্পূর্ণ অডিট হিস্ট্রি
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ ও সময়</TableHead>
                      <TableHead>ইউজার</TableHead>
                      <TableHead>ধরন (Type)</TableHead>
                      <TableHead>অর্ডার নং</TableHead>
                      <TableHead className="text-center">পয়েন্ট পরিবর্তন</TableHead>
                      <TableHead className="text-center">পরবর্তী ব্যালেন্স</TableHead>
                      <TableHead>বিবরণ (Reason)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          এখনো কোনো পয়েন্ট ট্রানজ্যাকশন রেকর্ড হয়নি।
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString("bn-BD", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {tx.user_email || tx.user_id.slice(0, 8) + "..."}
                          </TableCell>
                          <TableCell>
                            {tx.type === "order_delivered" && (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 flex items-center gap-1 w-fit">
                                <ArrowUpRight className="h-3 w-3" /> ডেলিভারি অর্জন
                              </Badge>
                            )}
                            {tx.type === "checkout_redeemed" && (
                              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 flex items-center gap-1 w-fit">
                                <ArrowDownRight className="h-3 w-3" /> চেকআউট রিডিম
                              </Badge>
                            )}
                            {tx.type === "admin_bonus" && (
                              <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 flex items-center gap-1 w-fit">
                                <Sparkles className="h-3 w-3" /> এডমিন বোনাস
                              </Badge>
                            )}
                            {tx.type === "order_refunded" && (
                              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 flex items-center gap-1 w-fit">
                                <History className="h-3 w-3" /> রিফান্ড ফেরত
                              </Badge>
                            )}
                            {tx.type === "admin_adjustment" && (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                সমন্বয় (Adjustment)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-foreground">
                            {tx.order_number ? `#${tx.order_number}` : "-"}
                          </TableCell>
                          <TableCell className={`text-center font-black ${tx.points >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {tx.points >= 0 ? `+${tx.points}` : tx.points} ★
                          </TableCell>
                          <TableCell className="text-center font-bold text-foreground">
                            {tx.balance_after} ★
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {tx.description}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: REWARDS */}
          <TabsContent value="rewards">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Loyalty Rewards</CardTitle>
                    <CardDescription>Configure rewards customers can redeem with points</CardDescription>
                  </div>
                  <Button onClick={() => setRewardDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Reward
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => (
                    <Card key={reward.id} className={`${!reward.is_active ? "opacity-60" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Gift className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{reward.name}</h3>
                              <p className="text-sm text-muted-foreground">{reward.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={reward.is_active}
                            onCheckedChange={() => toggleReward(reward.id, reward.is_active)}
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <Badge variant="secondary">{reward.points_required} points</Badge>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingReward(reward);
                                setRewardForm({
                                  name: reward.name,
                                  description: reward.description || "",
                                  points_required: reward.points_required,
                                  reward_type: reward.reward_type,
                                  reward_value: reward.reward_value || {}
                                });
                                setRewardDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteReward(reward.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {rewards.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No rewards configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Give Bonus Points Dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              কাস্টমারকে বোনাস পয়েন্ট প্রদান করুন
            </DialogTitle>
            <DialogDescription className="text-xs">
              নির্দিষ্ট কাস্টমারকে বোনাস পয়েন্ট দিন। এটি অবিলম্বে তাদের ওয়ালেট ব্যালেন্সে যুক্ত হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ইউজার আইডি (User ID) *</Label>
              <Input
                value={bonusForm.userId}
                onChange={(e) => setBonusForm({ ...bonusForm, userId: e.target.value })}
                placeholder="যেমন: k7J9aB... অথবা কাস্টমার আইডি"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">কাস্টমার ইমেইল (ঐচ্ছিক)</Label>
              <Input
                value={bonusForm.userEmail}
                onChange={(e) => setBonusForm({ ...bonusForm, userEmail: e.target.value })}
                placeholder="customer@gmail.com"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">বোনাস পয়েন্ট পরিমাণ *</Label>
              <Input
                type="number"
                min="1"
                value={bonusForm.points}
                onChange={(e) => setBonusForm({ ...bonusForm, points: Number(e.target.value) })}
                className="font-bold text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">বোনাসের কারণ বা বিবরণ *</Label>
              <Textarea
                value={bonusForm.reason}
                onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                placeholder="যেমন: স্পেশাল ঈদ অফার বোনাস"
                rows={2}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBonusDialogOpen(false)} disabled={grantingBonus}>
              বাতিল
            </Button>
            <Button onClick={handleGrantBonus} disabled={grantingBonus} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              {grantingBonus ? "প্রেরণ করা হচ্ছে..." : "বোনাস পয়েন্ট যুক্ত করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Add Reward"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reward Name</Label>
              <Input
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                placeholder="10% Discount"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                placeholder="Get 10% off your next order"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Required</Label>
                <Input
                  type="number"
                  value={rewardForm.points_required}
                  onChange={(e) => setRewardForm({ ...rewardForm, points_required: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <Select
                  value={rewardForm.reward_type}
                  onValueChange={(v) => setRewardForm({ ...rewardForm, reward_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    <SelectItem value="product">Free Product</SelectItem>
                    <SelectItem value="coupon">Coupon Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveReward}>Save Reward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
