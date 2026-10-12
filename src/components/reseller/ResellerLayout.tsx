import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ResellerService, ResellerProfile } from "@/services/resellerService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ResellerLayoutProps {
  children: React.ReactNode;
}

export function ResellerLayout({ children }: ResellerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile: authProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for real-time profile updates from settings or orders
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setResellerProfile(e.detail);
      }
    };
    window.addEventListener("reseller_profile_updated", handleProfileUpdate);

    if (!user) {
      const guestUid = "guest_reseller_" + (localStorage.getItem("durtup_guest_id") || "1");
      ResellerService.getProfile(guestUid, "reseller@durtup.shop", "New Reseller").then((prof) => {
        setResellerProfile(prof);
        setLoading(false);
      });
      return () => window.removeEventListener("reseller_profile_updated", handleProfileUpdate);
    }

    ResellerService.getProfile(user.id, user.email || "", authProfile?.full_name || "Reseller Partner")
      .then((prof) => {
        setResellerProfile(prof);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    return () => window.removeEventListener("reseller_profile_updated", handleProfileUpdate);
  }, [user, authProfile]);

  const navItems = [
    {
      title: "ড্যাশবোর্ড",
      path: "/reseller/dashboard",
    },
    {
      title: "হোলসেল ক্যাটালগ",
      path: "/reseller/products",
    },
    {
      title: "নতুন কাস্টমার অর্ডার",
      path: "/reseller/orders/new",
    },
    {
      title: "আমার অর্ডারসমূহ",
      path: "/reseller/orders",
      count: resellerProfile?.totalOrders,
    },
    {
      title: "ওয়ালেট ও উইথড্রয়াল",
      path: "/reseller/wallet",
    },
    {
      title: "মার্কেটিং কিট ও ছবি",
      path: "/reseller/marketing",
    },
    {
      title: "API ও অটোমেশন",
      path: "/reseller/api",
    },
    {
      title: "শপ সেটিংস",
      path: "/reseller/settings",
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "লগআউট সম্পন্ন হয়েছে" });
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      
      {/* Smooth Executive Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold border border-slate-200 dark:border-slate-700"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? "বন্ধ করুন" : "মেন্যু"}
            </button>

            <Link to="/reseller/dashboard" className="flex items-center gap-2 group">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Durtup<span className="text-orange-600">.Reseller</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                {resellerProfile?.level || "Partner"}
              </span>
            </Link>
          </div>

          {/* Header Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/reseller/wallet"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100/50 transition-colors"
            >
              <span className="text-[11px] text-emerald-600/80 mr-1.5">উইথড্রল ব্যালেন্স:</span>
              <span className="font-extrabold">৳{resellerProfile?.walletBalance?.toLocaleString("en-IN") || 0}</span>
            </Link>

            <Button
              asChild
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs h-9 px-4 transition-all"
            >
              <Link to="/reseller/orders/new">
                নতুন কাস্টমার অর্ডার
              </Link>
            </Button>

            <Link 
              to="/" 
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              মূল শপ
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              লগআউট
            </button>
          </div>

          {/* Header Mobile Summary */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/reseller/wallet"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/70"
            >
              ৳{resellerProfile?.walletBalance?.toLocaleString("en-IN") || 0}
            </Link>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full flex-1 flex gap-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs space-y-4">
            
            {/* Minimalist Shop Profile Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {resellerProfile?.shopName || "আমার রিসেলার শপ"}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 uppercase">
                  {resellerProfile?.level || "Bronze"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || "Partner Account"}
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">ব্যালেন্স:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  ৳{resellerProfile?.walletBalance?.toLocaleString("en-IN") || 0}
                </span>
              </div>
            </div>

            {/* Navigation Links (Pure typography, no icon clutter) */}
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150",
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <span>{item.title}</span>
                    {typeof item.count === "number" && item.count > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Support Link */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href="https://wa.me/8801885985097"
                target="_blank"
                rel="noreferrer"
                className="block px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                WhatsApp সাপোর্ট (01885985097)
              </a>
            </div>

          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-4 flex flex-col shadow-xl z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Durtup Reseller
                </span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded"
                >
                  বন্ধ করুন
                </button>
              </div>

              {/* Mobile Shop Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg mb-3">
                <p className="font-bold text-xs text-slate-900 dark:text-white">{resellerProfile?.shopName || "আমার শপ"}</p>
                <p className="text-[11px] text-slate-400">{user?.email || "Partner"}</p>
                <div className="mt-2 pt-2 border-t border-slate-200/50 flex justify-between text-xs font-bold text-emerald-600">
                  <span>উইথড্রল ব্যালেন্স:</span>
                  <span>৳{resellerProfile?.walletBalance?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>

              {/* Mobile Nav Links */}
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>{item.title}</span>
                      {typeof item.count === "number" && item.count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-auto">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700"
                >
                  মূল শপ ভিজিট
                </Link>
                <button
                  onClick={handleLogout}
                  className="block text-center w-full py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  লগআউট
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-10">
          {children}
        </main>

      </div>

      {/* Smooth Minimal Bottom Navigation Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around shadow-sm pb-[calc(env(safe-area-inset-bottom,8px)+4px)]">
        <Link
          to="/reseller/dashboard"
          className={cn(
            "py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors",
            location.pathname === "/reseller/dashboard" 
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          ড্যাশবোর্ড
        </Link>

        <Link
          to="/reseller/products"
          className={cn(
            "py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors",
            location.pathname === "/reseller/products" 
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          ক্যাটালগ
        </Link>

        <Link
          to="/reseller/orders/new"
          className="py-1.5 px-3 rounded-lg bg-orange-600 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
        >
          + অর্ডার
        </Link>

        <Link
          to="/reseller/orders"
          className={cn(
            "py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors",
            location.pathname === "/reseller/orders" 
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          অর্ডারসমূহ
        </Link>

        <Link
          to="/reseller/wallet"
          className={cn(
            "py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors",
            location.pathname === "/reseller/wallet" 
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
              : "text-slate-600 dark:text-slate-400"
          )}
        >
          ওয়ালেট
        </Link>
      </div>

    </div>
  );
}
