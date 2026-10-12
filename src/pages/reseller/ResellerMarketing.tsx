import React, { useState } from "react";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

export default function ResellerMarketing() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const phoneNumber = "01885985097";
  const whatsappUrl = `https://wa.me/8801885985097?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি Durtup রিসেলার। মার্কেটিং কনটেন্ট, ছবি ও ভিডিওর জন্য যোগাযোগ করছি।")}`;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    toast({ title: "নম্বর কপি হয়েছে", description: `${phoneNumber} ক্লিপবোর্ডে কপি করা হয়েছে।` });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ResellerLayout>
      <SEOHead title="মার্কেটিং কনটেন্ট ও সাপোর্ট - Durtup Reseller" />

      <div className="max-w-3xl mx-auto space-y-6 py-4">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            মার্কেটিং কনটেন্ট ও সাপোর্ট
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            পণ্য প্রমোশন, হাই-রেজুলেশন ছবি ও ভিডিও কনটেন্ট পেতে সরাসরি এডমিন টিমের সাথে যুক্ত থাকুন।
          </p>
        </div>

        {/* Dedicated Admin Contact Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs text-center">
          
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              কনটেন্টের জন্য এডমিনের সাথে যোগাযোগ করুন
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              ফেসবুক পেজ, টিকটক বা ইনস্টাগ্রামে প্রোডাক্ট প্রমোশন করার জন্য কোনো পণ্যের ছবি, ভিডিও, ব্যানার বা কাস্টম বিজ্ঞাপনী কনটেন্ট প্রয়োজন হলে সরাসরি নিচের নম্বরে হোয়াটসঅ্যাপে মেসেজ দিন।
            </p>
          </div>

          {/* Phone Display Pill */}
          <div className="inline-flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-medium">হোয়াটসঅ্যাপ / হেল্পলাইন:</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tracking-wider">
              {phoneNumber}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              হোয়াটসঅ্যাপে মেসেজ পাঠান ({phoneNumber})
            </a>

            <Button
              onClick={handleCopyNumber}
              variant="outline"
              className="w-full sm:w-auto rounded-xl h-11 px-5 border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              {copied ? "নম্বর কপি হয়েছে" : "নম্বর কপি করুন"}
            </Button>

            <a
              href={`tel:${phoneNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              সরাসরি কল করুন
            </a>
          </div>

          {/* Help Info Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            <span>সাপোর্ট সময়: প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত সক্রিয় সেবা প্রদান করা হয়।</span>
          </div>

        </div>

      </div>
    </ResellerLayout>
  );
}
