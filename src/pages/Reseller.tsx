import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Store, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Truck, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Package,
  Layers
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";

export default function ResellerLanding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <SEOHead
        title="রিসেলার হাব - জিরো ইনভেস্টমেন্টে ড্রপশিপিং বিজনেস - Durtup.shop"
        description="Durtup-এর সাথে ফ্রি রিসেলার হিসেবে যুক্ত হোন। পাইকারি মূল্যে গ্যাজেট ও পণ্য ফেসবুকে বিক্রি করে প্রতিদিন নিশ্চিত লাভ অর্জন করুন।"
      />
      <Header />

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-orange-600 via-amber-600 to-orange-700 text-white py-12 sm:py-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Durtup Official Reseller & Dropship Program</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                জিরো ইনভেস্টমেন্টে শুরু করুন <br className="hidden sm:inline" />
                আপনার নিজস্ব <span className="text-amber-200 underline decoration-white/40">অনলাইন ব্যবসা</span>!
              </h1>

              <p className="text-base sm:text-lg text-white/95 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                পণ্য স্টক করার ঝামেলা নেই, প্যাকিং বা কুরিয়ার ডেলিভারির চিন্তা নেই। আমাদের পাইকারি পণ্য ফেসবুকে সেল করুন এবং নিশ্চিত প্রফিট সরাসরি bKash-এ বুঝে নিন!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-white text-orange-700 hover:bg-white/95 font-black text-base px-8 h-12.5 rounded-2xl shadow-xl shadow-black/20"
                >
                  <Link to={user ? "/reseller/dashboard" : "/register?redirect=/reseller/dashboard"}>
                    {user ? "রিসেলার প্যানেলে প্রবেশ করুন" : "রিসেলার একাউন্ট তৈরি করুন"}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold px-7 h-12.5 rounded-2xl backdrop-blur-xs text-base"
                >
                  <Link to="/reseller/products">হোলসেল ক্যাটালগ দেখুন</Link>
                </Button>
              </div>

              {/* Micro proof badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-white/90 font-semibold">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> ১০০% ফ্রি জয়েনিং</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> ক্যাশ অন ডেলিভারি (COD)</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> দৈনিক বিকাশ পে-আউট</span>
              </div>
            </div>

            {/* Right Anime Showcase Card Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none">
                {/* Glow halos */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                
                <div className="relative rounded-3xl overflow-hidden bg-slate-950/80 border border-white/20 shadow-2xl backdrop-blur-xl">
                  {/* Anime Hero Image */}
                  <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                    <img
                      src="/reseller-anime.jpg"
                      alt="Top Reseller Dropshipper"
                      className="w-full h-full object-cover object-[50%_15%] hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Floating Floating Stat Badge on Image */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <div>
                        <p className="text-[10px] text-amber-200/80 uppercase font-black tracking-wider leading-none">Top Earner</p>
                        <p className="text-xs font-black text-amber-300 leading-none mt-0.5">৳১,২০,০০০+/মাস</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="p-4 sm:p-5 space-y-3 bg-gradient-to-b from-slate-950/90 to-slate-950">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Elite Reseller Portal</span>
                        <h3 className="text-base sm:text-lg font-black text-white">লাইভ ড্রপশিপ ড্যাশবোর্ড</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        অর্ডার একটিভ
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <p className="text-[10px] text-slate-400 font-bold">ইনভেস্টমেন্ট</p>
                        <p className="text-xs font-black text-white mt-0.5">৳০ জিরো</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <p className="text-[10px] text-slate-400 font-bold">হোলসেল রেট</p>
                        <p className="text-xs font-black text-amber-300 mt-0.5">সর্বনিম্ন</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                        <p className="text-[10px] text-slate-400 font-bold">ক্যাশআউট</p>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">ইনস্ট্যান্ট</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
        </section>

        {/* 3 Step Workflow */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              কীভাবে কাজ করে রিসেলার প্যানেল?
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              মাত্র ৩টি সহজ ধাপে ঘরে বসেই আপনার অনলাইন ই-কমার্স ড্রপশিপিং ইনকাম শুরু করুন:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-xl">
                ১
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">পণ্য বাছাই ও শেয়ার করুন</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আমাদের পাইকারি ক্যাটালগ থেকে গ্যাজেট ও ফ্যাশন আইটেম বেছে নিন। এক ক্লিকে হাই-রেজুলেশন ছবি ও তৈরি করা বাংলা ক্যাপশন আপনার ফেসবুক পেজে পোস্ট করুন।
              </p>
            </div>

            <div className="bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xl">
                ২
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">কাস্টমারের নামে অর্ডার দিন</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ফেসবুকে কাস্টমার পেলে তাদের নাম, ফোন ও ঠিকানা দিয়ে আপনার নির্ধারিত লাভে রিসেলার প্যানেল থেকে ড্রপশিপ অর্ডার প্লেস করুন।
              </p>
            </div>

            <div className="bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xl">
                ৩
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">বিকাশে প্রফিট বুঝে নিন</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                আমরা আপনার শপের নামে কাস্টমারের কাছে ক্যাশ অন ডেলিভারিতে পার্সেল পাঠাব। ডেলিভারির সাথে সাথেই লাভ বিকাশ/নগদে ক্যাশআউট করুন।
              </p>
            </div>

          </div>
        </section>

        {/* Benefits Grid */}
        <section className="bg-slate-50 dark:bg-slate-900/50 py-16 px-4 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                কেন Durtup রিসেলার প্রোগ্রাম সেরা?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: Store,
                  title: "আপনার নিজস্ব ব্র্যান্ডিং",
                  desc: "চালানের প্যাকেটে প্রেরক হিসেবে আপনার ফেসবুক পেজের নাম ও নাম্বার থাকবে।",
                },
                {
                  icon: Truck,
                  title: "ফাস্টেস্ট হোম ডেলিভারি",
                  desc: "Steadfast ও Pathao কুরিয়ারের মাধ্যমে সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি।",
                },
                {
                  icon: Wallet,
                  title: "ইনস্ট্যান্ট ক্যাশআউট",
                  desc: "নূন্যতম ১০০ টাকা ব্যালেন্স হলেই বিকাশ ও নগদে সরাসরি টাকা তোলার সুবিধা।",
                },
                {
                  icon: ShieldCheck,
                  title: "৭ দিনের রিপ্লেসমেন্ট",
                  desc: "পণ্যে কোনো ত্রুটি থাকলে কাস্টমারকে ১০০% রিপ্লেসমেন্ট গ্যারান্টি আমরা প্রদান করি।",
                },
              ].map((b, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="h-11 w-11 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{b.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action footer banner */}
        <section className="py-16 px-4 max-w-4xl mx-auto text-center space-y-6">
          <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black">
              আজই শুরু করুন আপনার রিসেলিং জার্নি
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto">
              কোনো পূর্ব অভিজ্ঞতার প্রয়োজন নেই। একাউন্ট তৈরি করলেই সরাসরি রিসেলার ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-orange-700 hover:bg-white/95 font-black text-base px-8 h-12 rounded-2xl shadow-lg"
            >
              <Link to={user ? "/reseller/dashboard" : "/register?redirect=/reseller/dashboard"}>
                একাউন্ট খুলুন এবং প্যানেলে যান
              </Link>
            </Button>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
