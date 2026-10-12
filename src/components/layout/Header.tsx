import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Heart, 
  User, 
  Menu, 
  ShoppingCart, 
  MessageCircle, 
  LogOut,
  ArrowLeft,
  Search,
  Store,
  Share2,
  Wallet,
  ChevronRight,
  Package,
  Truck,
  HelpCircle,
  Phone,
  Layers,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  Gift,
  Camera,
  TrendingUp,
  Crown,
  Zap,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/firebaseAdapter";
import { SmartSearchBar } from "@/components/search/SmartSearchBar";
import { CategoryPillsNav } from "@/components/layout/CategoryPillsNav";
import { useSmartBack } from "@/hooks/useSmartBack";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const handleSmartBack = useSmartBack();

  const isHomePage = location.pathname === "/";
  const isCheckoutPage = location.pathname.toLowerCase() === "/checkout" || location.pathname.toLowerCase().startsWith("/checkout");
  const isMessagesPage = location.pathname.toLowerCase() === "/messages" || location.pathname.toLowerCase().startsWith("/messages");

  const { user, profile, signOut } = useAuth();
  const avatarUrl = profile?.avatar_url || user?.photoURL || null;
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { toast } = useToast();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPhone, setReportPhone] = useState("");
  const [reportCategory, setReportCategory] = useState("Order & Delivery");
  const [reportOrder, setReportOrder] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (reportModalOpen) {
      const savedPhone = (profile as any)?.phone || localStorage.getItem("customer_phone") || "";
      if (savedPhone && !reportPhone) {
        setReportPhone(savedPhone);
      }
    }
  }, [reportModalOpen, profile]);

  const handleSubmitProblemReport = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = reportPhone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({
        title: "Mobile number required",
        description: "Please enter a valid mobile number (e.g. 01XXXXXXXXX) so our support team can reach you.",
        variant: "destructive",
      });
      return;
    }

    if (!reportDetails.trim() || reportDetails.trim().length < 5) {
      toast({
        title: "Problem details required",
        description: "Please describe the problem you experienced.",
        variant: "destructive",
      });
      return;
    }

    setReportSubmitting(true);
    try {
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ticketNum = `RPT-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowIso = new Date().toISOString();
      const userName = profile?.full_name || (user?.email ? user.email.split("@")[0] : "Customer");

      // 1. Insert into support_tickets for Admin Helpdesk & Support panel
      await supabase.from("support_tickets").insert({
        id: ticketId,
        user_id: user?.id || null,
        ticket_number: ticketNum,
        category: reportCategory,
        subject: `[Problem Report] ${reportCategory} - Phone: ${cleanPhone}`,
        status: "open",
        created_at: nowIso,
        updated_at: nowIso,
      });

      // 2. Insert into ticket_messages for readable thread in admin panel
      const messageContent = [
        `🚨 CUSTOMER PROBLEM REPORT #${ticketNum}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📱 User Contact Phone: ${cleanPhone}`,
        `👤 Reporter Name: ${userName}`,
        `📧 Email: ${user?.email || "Guest"}`,
        `🏷️ Category: ${reportCategory}`,
        reportOrder.trim() ? `📦 Order Reference: ${reportOrder.trim()}` : null,
        `━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📝 Problem Description:`,
        reportDetails.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      await supabase.from("ticket_messages").insert({
        ticket_id: ticketId,
        sender_id: user?.id || "guest",
        sender_type: "customer",
        message: messageContent,
        attachments: [],
        is_internal: false,
        created_at: nowIso,
      });

      // 3. Also backup into problem_reports
      try {
        await supabase.from("problem_reports").insert({
          ticket_id: ticketId,
          ticket_number: ticketNum,
          user_id: user?.id || null,
          user_name: userName,
          phone: cleanPhone,
          category: reportCategory,
          order_id: reportOrder.trim() || null,
          description: reportDetails.trim(),
          status: "open",
          created_at: nowIso,
        });
      } catch (err) {
        console.warn("problem_reports insert:", err);
      }

      try {
        localStorage.setItem("customer_phone", cleanPhone);
      } catch {}

      toast({
        title: "Problem Report Submitted!",
        description: `Ticket #${ticketNum} created. Support will contact ${cleanPhone} promptly.`,
      });

      setReportModalOpen(false);
      setReportDetails("");
      setReportOrder("");
    } catch (err: any) {
      console.error("Problem report error:", err);
      toast({
        title: "Submission failed",
        description: err?.message || "Please call our helpline directly.",
        variant: "destructive",
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user) { setHasUnreadMessages(false); return; }

    const checkUnread = async () => {
      const { data: buyerConvs } = await supabase
        .from("conversations").select("buyer_unread_count")
        .eq("buyer_id", user.id).gt("buyer_unread_count", 0).limit(1);

      if (buyerConvs && buyerConvs.length > 0) { setHasUnreadMessages(true); return; }

      const { data: sellerData } = await supabase
        .from("sellers").select("id")
        .eq("user_id", user.id).eq("status", "approved").limit(1);

      if (sellerData && sellerData.length > 0) {
        const { data: sellerConvs } = await supabase
          .from("conversations").select("seller_unread_count")
          .eq("seller_id", sellerData[0].id).gt("seller_unread_count", 0).limit(1);
        if (sellerConvs && sellerConvs.length > 0) { setHasUnreadMessages(true); return; }
      }
      setHasUnreadMessages(false);
    };

    checkUnread();
    const channel = supabase
      .channel("unread-messages-indicator")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => checkUnread())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, () => checkUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out", description: "You've been successfully logged out." });
      navigate("/");
    } catch (error) { 
      console.error("Logout error:", error); 
    }
  };

  return (
    <>
      {/* Main Header (Scrolls naturally with page content) */}
      <header className="relative w-full max-w-full bg-white dark:bg-slate-900 shadow-xs border-b border-slate-100 dark:border-slate-800">

      {/* 1. Main Header Row (Logo, Search, Actions) */}
      <div className="px-3 sm:px-4 py-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between gap-2 sm:gap-6 w-full">
          
          {/* Left: Back button on subpages / Hamburger on Home, and Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {!isHomePage ? (
              <button 
                onClick={handleSmartBack}
                className="p-1 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 rounded-xl transition-all flex items-center justify-center text-slate-800 dark:text-slate-100 hover:text-orange-600 group"
                aria-label="Back"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setMenuDrawerOpen(true)}
                className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 rounded-xl transition-all flex items-center justify-center text-slate-800 dark:text-slate-100 hover:text-orange-600 cursor-pointer"
                aria-label="Navigation Menu"
                title="Main Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            <Link to="/" className="flex flex-col items-start justify-center group select-none py-0.5">
              <div className="flex items-baseline tracking-tight font-black leading-none">
                <span className="text-lg sm:text-2xl md:text-[26px] text-orange-600 font-extrabold tracking-tight">Durtup</span>
                <span className="text-[11px] sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">.shop</span>
              </div>
              {/* Signature Orange Smile Curve */}
              <svg viewBox="0 0 100 20" className="w-14 sm:w-20 md:w-24 h-2 -mt-0.5 text-orange-600 fill-none stroke-current stroke-[3]">
                <path d="M 5,5 Q 50,18 95,5" strokeLinecap="round" />
                <path d="M 85,2 L 95,5 L 90,11" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
              </svg>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop - On ALL pages except Checkout) / Checkout Secure Badge */}
          {!isCheckoutPage ? (
            <div className="flex-1 max-w-xl lg:max-w-2xl mx-3 lg:mx-6 hidden md:block">
              <SmartSearchBar variant="desktop" />
            </div>
          ) : (
            <div className="flex items-center justify-center shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>100% Secure Checkout</span>
              </div>
              <div className="sm:hidden flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>100% Secure</span>
              </div>
            </div>
          )}

          {/* Right Action Icons (Messages, Wishlist, Account) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Messages / Sigma AI Assistant */}
            <Link to="/messages" className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group" title="Sigma AI Assistant">
              <div className="relative">
                <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {hasUnreadMessages && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-xs">
                    1
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none mt-1">Messages</span>
            </Link>

            {/* Wishlist (Desktop) */}
            <Link to="/wishlist" className="hidden md:flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative group" title="Wishlist">
              <div className="relative">
                <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-xs">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none mt-1">Wishlist</span>
            </Link>

            {/* Account / User Menu (Desktop) */}
            <div className="hidden lg:block ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center p-1 sm:px-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <User className="h-5 w-5" />
                    <span className="text-[10px] font-medium leading-none mt-1 truncate max-w-[60px]">
                      {user ? profile?.full_name?.split(' ')[0] || 'Account' : 'Account'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  {user ? (
                    <>
                      <div className="p-3 border-b">
                        <p className="text-sm font-bold text-foreground">{profile?.full_name || 'Welcome!'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <DropdownMenuItem asChild className="bg-orange-500/10 text-orange-600 font-bold focus:bg-orange-500/20 focus:text-orange-600">
                        <Link to="/reseller/dashboard" className="cursor-pointer flex items-center justify-between w-full">
                          <span className="flex items-center gap-1.5"><Store className="h-4 w-4" /> রিসেলার প্যানেল</span>
                          <span className="text-[9px] bg-orange-600 text-white font-black px-1.5 py-0.5 rounded">লাইভ</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/orders" className="cursor-pointer">My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/wishlist" className="cursor-pointer">Wishlist</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/referrals" className="cursor-pointer flex items-center justify-between"><span>Refer & Earn</span><span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">৳৫০ বোনাস</span></Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/wallet" className="cursor-pointer">My Wallet</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/account" className="cursor-pointer">Account Settings</Link></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <div className="p-3 border-b">
                        <p className="text-sm font-bold text-foreground">Welcome to Durtup.shop!</p>
                        <div className="flex gap-2 mt-2">
                          <Button asChild size="sm" className="flex-1"><Link to="/login">Sign In</Link></Button>
                          <Button asChild variant="outline" size="sm" className="flex-1"><Link to="/register">Register</Link></Button>
                        </div>
                      </div>
                      <DropdownMenuItem asChild className="bg-orange-500/10 text-orange-600 font-bold focus:bg-orange-500/20 focus:text-orange-600">
                        <Link to="/reseller" className="cursor-pointer flex items-center justify-between w-full">
                          <span className="flex items-center gap-1.5"><Store className="h-4 w-4" /> রিসেলার প্রোগ্রাম</span>
                          <span className="text-[9px] bg-orange-600 text-white font-black px-1.5 py-0.5 rounded">আয় করুন</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/referrals" className="cursor-pointer flex items-center justify-between"><span>Refer & Earn</span><span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">৳৫০ বোনাস</span></Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/orders" className="cursor-pointer">My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/wishlist" className="cursor-pointer">Wishlist</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/account" className="cursor-pointer">Account Settings</Link></DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>

        </div>

        {/* Search Bar (Mobile View - Always visible except on checkout) */}
        {!isCheckoutPage && (
          <div className="mt-1.5 mb-2 md:hidden">
            <SmartSearchBar variant="mobile" />
          </div>
        )}
      </div>

      {/* 2. Fluid Slidable Category Pills Navigation (Visible ONLY on Home Page) */}
      {isHomePage && (
        <CategoryPillsNav />
      )}

      {/* Slide-out Navigation Drawer for Hamburger Menu */}
      <Sheet open={menuDrawerOpen} onOpenChange={setMenuDrawerOpen}>
        <SheetContent 
          side="left" 
          hideCloseButton
          className="w-[88vw] max-w-[360px] p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shadow-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>

          {/* Drawer Top Bar: Brand Logo & Sleek Close Button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <Link 
              to="/" 
              onClick={() => setMenuDrawerOpen(false)}
              className="flex items-baseline tracking-tight font-black leading-none group select-none"
            >
              <span className="text-2xl text-orange-600 font-extrabold tracking-tight">Durtup</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">.shop</span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-2xs hover:rotate-90"
              aria-label="Close menu"
              title="Close Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile Card (Compact & Clean English) */}
          <div className="px-3 pt-2.5 shrink-0">
            {user ? (
              <div className="p-2.5 px-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <Link 
                    to="/account" 
                    onClick={() => setMenuDrawerOpen(false)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-orange-500/20 shadow-xs bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span>{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}</span>
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-850" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-600 transition-colors">
                          {profile?.full_name || "Valued Customer"}
                        </p>
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300/60 dark:border-amber-700/50 px-1.5 py-0.2 rounded-full">
                          VIP
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email || (profile as any)?.phone || "Durtup Member"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    to="/account"
                    onClick={() => setMenuDrawerOpen(false)}
                    className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center text-slate-900 dark:text-slate-100 transition-all shadow-2xs hover:shadow-xs shrink-0"
                    title="Account Settings"
                  >
                    <Settings className="w-4 h-4 stroke-[2.2]" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-2.5 px-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Welcome! Sign in to shop faster
                </p>
                <div className="flex gap-2">
                  <Button 
                    asChild 
                    size="sm" 
                    className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs font-bold"
                    onClick={() => setMenuDrawerOpen(false)}
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-7 text-xs rounded-lg border-slate-300 dark:border-slate-600 font-bold"
                    onClick={() => setMenuDrawerOpen(false)}
                  >
                    <Link to="/register">Register</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3.5">
            
            {/* 1. Reseller & Dropshipping Hub (Professional - NO ICONS) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-3 bg-orange-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Earnings & Rewards
                </span>
              </div>

              {/* Official Reseller & Dropshipping Hub Banner Card */}
              <Link
                to={user ? "/reseller/dashboard" : "/reseller"}
                onClick={() => setMenuDrawerOpen(false)}
                className="block group relative"
              >
                <div className="relative overflow-hidden rounded-[20px] shadow-xl border border-orange-500/35 hover:border-orange-500/70 bg-slate-950 transition-all duration-300 hover:shadow-orange-500/20 active:scale-[0.99]">
                  <img
                    src="/reseller-banner.png"
                    alt="Durtup.shop - আমাদের সাথে রিসেলিং শুরু করুন, ঘরে বসেই আয় করুন!"
                    className="w-full h-auto object-contain block group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  {/* Subtle Interactive Shimmer Gloss Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </Link>

              {/* 2 & 3: Refer & Earn + My Wallet (English) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Refer & Earn Card */}
                <Link
                  to="/referrals"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="p-3 rounded-2xl border border-amber-300/90 dark:border-amber-700/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.98] relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%)"
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-black bg-gradient-to-r from-amber-600 to-orange-600 text-white px-1.5 py-0.5 rounded-full shadow-xs">
                      ৳50 Bonus
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 tracking-tight">
                      Refer & Earn
                    </p>
                    <p className="text-[10px] text-amber-900 font-semibold mt-0.5 leading-tight">
                      Instant cash bonus on every referral
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold text-amber-800 group-hover:text-amber-950">
                      <span>Invite Friends</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>

                {/* My Wallet Card */}
                <Link
                  to="/wallet"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="p-3 rounded-2xl border border-teal-300/90 dark:border-teal-700/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.98] relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 60%, #a7f3d0 100%)"
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] font-black bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-1.5 py-0.5 rounded-full shadow-xs">
                      Cashout
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 tracking-tight">
                      My Wallet
                    </p>
                    <p className="text-[10px] text-teal-900 font-semibold mt-0.5 leading-tight">
                      Check balance and cashout anytime
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-extrabold text-teal-800 group-hover:text-teal-950">
                      <span>View Wallet</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Quick Navigation Menu with Professional Gradient Icons (English) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="w-1.5 h-3 bg-slate-500 dark:bg-slate-400 rounded-full" />
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Menu & Services
                </span>
              </div>

              <div className="bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xs space-y-0.5">
                <Link
                  to="/categories"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-xs group-hover:border-slate-350 dark:group-hover:border-slate-600 group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                      <Layers className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        All Categories
                      </p>
                      <p className="text-[10px] text-muted-foreground">Browse all product departments</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-xs group-hover:border-slate-350 dark:group-hover:border-slate-600 group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                      <Package className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        My Orders
                      </p>
                      <p className="text-[10px] text-muted-foreground">Order history and receipts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/track-order"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-xs group-hover:border-slate-350 dark:group-hover:border-slate-600 group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                      <Truck className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        Track Order
                      </p>
                      <p className="text-[10px] text-muted-foreground">Live courier tracking</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-xs group-hover:border-slate-350 dark:group-hover:border-slate-600 group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                      <Heart className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        Wishlist
                      </p>
                      <p className="text-[10px] text-muted-foreground">Saved items & favorites</p>
                    </div>
                  </div>
                  {wishlistCount > 0 ? (
                    <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black rounded-full border border-slate-200 dark:border-slate-700">
                      {wishlistCount}
                    </Badge>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                  )}
                </Link>

                <Link
                  to="/messages"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-xs group-hover:border-slate-350 dark:group-hover:border-slate-600 group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                      <MessageCircle className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        Sigma AI & Messages
                      </p>
                      <p className="text-[10px] text-muted-foreground">Live chat & instant support</p>
                    </div>
                  </div>
                  {hasUnreadMessages ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white animate-pulse ring-2 ring-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                  )}
                </Link>

                <Link
                  to="/account"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-xs group-hover:border-slate-350 dark:group-hover:border-slate-600 group-hover:shadow-sm group-hover:scale-105 transition-all duration-200">
                      <Settings className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        Account Settings
                      </p>
                      <p className="text-[10px] text-muted-foreground">Profile & address management</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* Helpline & Report Problem Section (English) */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shadow-2xs">
                    <HelpCircle className="w-4 h-4 text-slate-950 dark:text-white stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Need Help?</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/50">
                  24/7 Available
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Contact customer care or report any issue for fast resolution
              </p>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <a
                  href="tel:01885985097"
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-950 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 group"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-950 dark:text-slate-100 stroke-[2.2] group-hover:scale-110 transition-transform" /> 
                  <span>Call Now</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    setReportModalOpen(true);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-950 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer group"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-slate-950 dark:text-slate-100 stroke-[2.2] group-hover:scale-110 transition-transform" /> 
                  <span>Report Issue</span>
                </button>
              </div>
            </div>

          </div>

          {/* Drawer Footer: Logout (English) */}
          {user && (
            <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMenuDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-200/70 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-950/50 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Report a Problem Modal Dialog */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md max-w-[94vw] p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 text-slate-950 dark:text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertCircle className="w-5 h-5 text-slate-950 dark:text-white stroke-[2.2]" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Report a Problem
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Submit issue details. Our admin and support team will follow up directly.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitProblemReport} className="space-y-3.5 mt-2">
            {/* User Mobile Number - MANDATORY */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="report-phone" className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  Mobile Number <span className="text-rose-500 font-black">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Required for callback</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="report-phone"
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={reportPhone}
                  onChange={(e) => setReportPhone(e.target.value)}
                  className="pl-9 h-10 text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Issue Category */}
            <div className="space-y-1.5">
              <Label htmlFor="report-category" className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Issue Category <span className="text-rose-500 font-black">*</span>
              </Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger id="report-category" className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select issue category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Order & Delivery" className="text-xs">Order & Delivery Issue</SelectItem>
                  <SelectItem value="Payment & Refund" className="text-xs">Payment & Refund Issue</SelectItem>
                  <SelectItem value="Product Quality" className="text-xs">Damaged or Defective Item</SelectItem>
                  <SelectItem value="Website Bug" className="text-xs">Website / App Technical Problem</SelectItem>
                  <SelectItem value="Reseller / Wallet" className="text-xs">Reseller & Wallet Issue</SelectItem>
                  <SelectItem value="Account & Login" className="text-xs">Account & Login Issue</SelectItem>
                  <SelectItem value="Other Feedback" className="text-xs">Other Problem / Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Reference (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="report-order" className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Order Number <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="report-order"
                placeholder="e.g. #ORD-1234 or leave blank"
                value={reportOrder}
                onChange={(e) => setReportOrder(e.target.value)}
                className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Problem Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="report-details" className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  Problem Description <span className="text-rose-500 font-black">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Min 5 characters</span>
              </div>
              <Textarea
                id="report-details"
                required
                rows={3}
                placeholder="Describe what went wrong so our technical and support team can fix it quickly..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none min-h-[80px]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 text-xs font-bold rounded-xl"
                onClick={() => setReportModalOpen(false)}
                disabled={reportSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-900/10"
                disabled={reportSubmitting}
              >
                {reportSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </header>
    </>
  );
}

export default Header;
