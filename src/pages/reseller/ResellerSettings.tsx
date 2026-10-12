import React, { useState, useEffect } from "react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProfile } from "@/services/resellerService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerSettings() {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ResellerProfile | null>(null);
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "rocket" | "bank">("bkash");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
    ResellerService.getProfile(uid, user?.email || "", authProfile?.full_name || "Partner")
      .then((p) => {
        setProfile(p);
        setShopName(p.shopName || "");
        setPhone(p.phone || "");
        setWhatsapp(p.whatsapp || "");
        setPaymentMethod(p.defaultPaymentMethod || "bkash");
        setPaymentAccount(p.defaultPaymentAccount || "");
      });
  }, [user, authProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast({ variant: "destructive", title: "শপের নাম আবশ্যক", description: "অনুগ্রহ করে আপনার শপ বা পেজের নাম লিখুন।" });
      return;
    }

    setSaving(true);
    try {
      const uid = user?.id || "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      const updated = await ResellerService.updateProfile(uid, {
        shopName: shopName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        defaultPaymentMethod: paymentMethod,
        defaultPaymentAccount: paymentAccount.trim(),
      });
      
      setProfile(updated);
      
      toast({
        title: "সেটিংস সংরক্ষিত হয়েছে",
        description: "আপনার শপের নাম ও পেমেন্ট তথ্য সফলভাবে আপডেট হয়েছে।",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "সংরক্ষণ করা যায়নি",
        description: err.message || "অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResellerLayout>
      <SEOHead title="শপ সেটিংস - Durtup Reseller" />

      <div className="max-w-2xl mx-auto space-y-4 pt-1 sm:pt-2">
        {/* Header Title Card (No clipping, no icon clutter) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block mb-1">
            শপ প্রোফাইল সেটিংস
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            রিসেলার শপ সেটিংস ও প্রোফাইল
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            আপনার ফেসবুক পেজের নাম এবং ডিফল্ট পেমেন্ট তথ্য সংরক্ষণ করুন। এই তথ্য পার্সেলের প্যাকেটে প্রিন্ট হবে।
          </p>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 text-xs">
          
          {/* Shop Branding Section */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                শপ ও ব্র্যান্ড তথ্য (পার্সেলের প্যাকেটে যাবে)
              </h2>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                আপনার শপ / পেজের নাম *
              </label>
              <Input
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="যেমন: BD Smart Mart"
                className="rounded-lg text-xs h-10 bg-slate-50/50 dark:bg-slate-800/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                  কাস্টমার হেল্পলাইন ফোন
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="rounded-lg text-xs h-10 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                  WhatsApp নম্বর
                </label>
                <Input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="rounded-lg text-xs h-10 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
            </div>
          </div>

          {/* Default Payout Section */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                ডিফল্ট পে-আউট মেথড (টাকা তোলার জন্য)
              </h2>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                পেমেন্ট মেথড
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
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 rounded-lg border text-center text-xs font-bold transition-all ${
                      paymentMethod === m.id
                        ? "border-slate-900 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                {paymentMethod.toUpperCase()} পার্সোনাল একাউন্ট নম্বর
              </label>
              <Input
                type="tel"
                value={paymentAccount}
                onChange={(e) => setPaymentAccount(e.target.value)}
                placeholder="017XXXXXXXX"
                className="rounded-lg text-xs h-10 bg-slate-50/50 dark:bg-slate-800/50"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg h-10 text-xs shadow-xs transition-colors"
          >
            {saving ? "সংরক্ষণ করা হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
          </Button>

        </form>
      </div>
    </ResellerLayout>
  );
}
