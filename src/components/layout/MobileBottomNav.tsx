import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  User, 
  Heart, 
  Search, 
  Bell, 
  Store, 
  MessageCircle, 
  LucideIcon 
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/lib/firebaseAdapter";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { prefetchRoute } from "@/components/RoutePrefetcher";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  category: LayoutGrid,
  categories: LayoutGrid,
  grid: LayoutGrid,
  "layout-grid": LayoutGrid,
  shapes: LayoutGrid,
  "shopping-cart": ShoppingCart,
  cart: ShoppingBag,
  bag: ShoppingBag,
  package: Package,
  orders: Package,
  user: User,
  account: User,
  profile: User,
  heart: Heart,
  wishlist: Heart,
  search: Search,
  bell: Bell,
  store: Store,
  "live-chat": MessageCircle,
  chat: MessageCircle,
  messages: MessageCircle,
  message: MessageCircle,
};

interface NavTab {
  label: string;
  icon: string;
  href: string;
  badge?: string;
}

const defaultTabs: NavTab[] = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Wishlist", icon: "wishlist", href: "/wishlist", badge: "wishlist" },
  { label: "Cart", icon: "cart", href: "/cart", badge: "cart" },
  { label: "Orders", icon: "orders", href: "/orders" },
  { label: "Account", icon: "account", href: "/account" },
];

interface MobileNavConfig {
  tabs: NavTab[];
}

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [unreadCount, setUnreadCount] = useState(0);
  const { config } = useSiteConfig<MobileNavConfig>("mobile_nav", { tabs: defaultTabs });

  // Real-time unread messages listener
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const checkUnread = async () => {
      try {
        const { data: buyerConvs } = await supabase
          .from("conversations").select("buyer_unread_count")
          .eq("buyer_id", user.id).gt("buyer_unread_count", 0);

        let total = 0;
        if (buyerConvs) {
          total += buyerConvs.reduce((acc, c) => acc + (c.buyer_unread_count || 0), 0);
        }

        const { data: sellerData } = await supabase
          .from("sellers").select("id")
          .eq("user_id", user.id).eq("status", "approved").limit(1);

        if (sellerData && sellerData.length > 0) {
          const { data: sellerConvs } = await supabase
            .from("conversations").select("seller_unread_count")
            .eq("seller_id", sellerData[0].id).gt("seller_unread_count", 0);
          if (sellerConvs) {
            total += sellerConvs.reduce((acc, c) => acc + (c.seller_unread_count || 0), 0);
          }
        }
        setUnreadCount(total);
      } catch (err) {
        console.error("Error checking unread messages:", err);
      }
    };

    checkUnread();
    const channel = supabase
      .channel("mobile-unread-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => checkUnread())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, () => checkUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const rawTabs = config.tabs?.length ? config.tabs : defaultTabs;
  // Ensure "Messages" or "Category" tab is replaced with "Wishlist"
  const tabs = rawTabs.map((t) => {
    if (
      t.label.toLowerCase().includes("msg") || 
      t.label.toLowerCase().includes("message") || 
      t.href.includes("/message") ||
      t.label.toLowerCase().includes("cat") || 
      t.href.includes("/cat")
    ) {
      return { label: "Wishlist", icon: "wishlist", href: "/wishlist", badge: "wishlist" };
    }
    return t;
  });

  const getBadgeCount = (badge?: string) => {
    if (badge === "cart") return cartCount;
    if (badge === "wishlist" || badge === "heart") return wishlistCount;
    if (badge === "messages" || badge === "chat") return unreadCount;
    return 0;
  };

  // Find active tab index for the sliding water droplet
  const activeIndex = tabs.findIndex((tab) => {
    const p = location.pathname.toLowerCase();
    const href = (tab.href || "").toLowerCase();
    
    if (href === "/" || href === "") {
      return p === "/" || p === "";
    }
    if (href.includes("wishlist") || href.includes("heart")) {
      return p.includes("wishlist");
    }
    if (href.includes("message") || href.includes("chat")) {
      return p.includes("message") || p.includes("chat");
    }
    if (href.includes("cat")) {
      return p.includes("cat");
    }
    if (href.includes("order")) {
      return p.includes("order");
    }
    if (href.includes("cart") || href.includes("bag")) {
      return p.includes("cart") || p.includes("bag");
    }
    if (
      href.includes("account") || 
      href.includes("profile") || 
      href.includes("user") || 
      href.includes("auth") || 
      href.includes("login")
    ) {
      return (
        p.includes("account") || 
        p.includes("profile") || 
        p.includes("auth") || 
        p.includes("login") || 
        p.includes("user")
      );
    }
    return p === href || (href !== "/" && p.startsWith(href));
  });

  const effectiveActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Real liquid physics animation state (stretch on move, bounce on settle)
  const [isSliding, setIsSliding] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right" | "none">("none");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const prevIndexRef = useRef(effectiveActiveIndex);
  const initialHeightRef = useRef(typeof window !== "undefined" ? (window.visualViewport?.height || window.innerHeight) : 0);

  // Detect Mobile Virtual Keyboard via focusin/focusout and visualViewport resize
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!initialHeightRef.current) {
      initialHeightRef.current = window.visualViewport?.height || window.innerHeight;
    }

    const handleResize = () => {
      const currentVh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const baseHeight = Math.max(initialHeightRef.current, window.screen?.height ? window.screen.height * 0.7 : 600);
      const isKb = (baseHeight - currentVh) > 120;
      setIsKeyboardOpen(isKb);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (!active || (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")) {
          const currentVh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
          const baseHeight = Math.max(initialHeightRef.current, 600);
          setIsKeyboardOpen((baseHeight - currentVh) > 120);
        }
      }, 100);
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    window.addEventListener("resize", handleResize);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    if (prevIndexRef.current !== effectiveActiveIndex) {
      const dir = effectiveActiveIndex > prevIndexRef.current ? "right" : "left";
      setSlideDir(dir);
      setIsSliding(true);
      prevIndexRef.current = effectiveActiveIndex;

      const timer = setTimeout(() => {
        setIsSliding(false);
        setSlideDir("none");
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [effectiveActiveIndex]);

  if (isKeyboardOpen) return null;

  return (
    <div 
      className="md:hidden fixed bottom-1 left-0 right-0 z-50 pointer-events-none px-2.5 flex justify-center transition-all duration-300"
      style={{ bottom: "max(env(safe-area-inset-bottom, 0px) + 2px, 4px)" }}
    >
      <nav 
        aria-label="Mobile Navigation"
        className={cn(
          "pointer-events-auto relative w-full max-w-[390px]",
          "rounded-[26px] p-1.5",
          // Premium solid base dock with crystal blur
          "bg-white/95 dark:bg-slate-900/95",
          "backdrop-blur-xl backdrop-saturate-150",
          // Refined border and elevation shadow
          "border border-slate-200/90 dark:border-slate-800",
          "shadow-[0_12px_32px_-4px_rgba(0,0,0,0.14),0_4px_12px_-2px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_14px_36px_-4px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Specular gloss top reflection beam on the dock */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none opacity-90" />

        {/* ── Hyper-Realistic Pure Crystal Water Droplet (আসল স্ফটিক স্বচ্ছ পানির ফোঁটা) ── */}
        {activeIndex !== -1 && (
          <div
            className={cn(
              "absolute top-1.5 bottom-1.5 pointer-events-none z-0",
              // Ultra-smooth fluid spring glide
              "transition-transform duration-400 ease-spring"
            )}
            style={{
              width: `calc((100% - 12px) / ${tabs.length})`,
              left: "6px",
              transform: `translateX(${effectiveActiveIndex * 100}%)`,
            }}
          >
            <div 
              className={cn(
                "w-full h-full p-0.5 transition-transform duration-300",
                // Liquid droplet elastic deformation when sliding
                isSliding && slideDir === "right" && "scale-x-[1.14] scale-y-[0.88] origin-left",
                isSliding && slideDir === "left" && "scale-x-[1.14] scale-y-[0.88] origin-right",
                !isSliding && "scale-100"
              )}
            >
              <div 
                className={cn(
                  "w-full h-full rounded-[21px] relative overflow-hidden",
                  // Pure crystal water transparency / 3D liquid lens
                  "bg-gradient-to-b from-white/80 via-white/25 to-white/60",
                  "dark:from-white/30 dark:via-white/10 dark:to-white/25",
                  "backdrop-blur-md",
                  // Realistic water meniscus surface-tension border
                  "border border-white/95 dark:border-white/60",
                  // 3D Liquid refraction caustics, inner specular gloss, and drop shadow
                  "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.06),inset_0_0_15px_rgba(255,255,255,0.9)]",
                  "dark:shadow-[0_6px_22px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(255,255,255,0.25)]"
                )}
              >
                {/* 1. Main Curved Top-Left Specular Glare (উপরের প্রধান চকচকে আলোর বক্ররেখা) */}
                <div className="absolute top-1 left-2.5 w-7 h-[3px] bg-gradient-to-r from-white via-white to-white/70 rounded-full blur-[0.15px] shadow-[0_0_4px_rgba(255,255,255,1)]" />

                {/* 2. Primary Micro Sparkle Dot (ডানপাশের প্রধান চকচকে আলোর বিন্দু) */}
                <div className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_#ffffff,0_0_2px_#ffffff]" />

                {/* 3. Secondary Tiny Glint Dot (ডানপাশের ছোট আলোর স্ফুলিঙ্গ) */}
                <div className="absolute top-3.5 right-2 w-1 h-1 rounded-full bg-white/95 shadow-[0_0_3px_#ffffff]" />

                {/* 4. Left Rim Micro Light Reflection (বামপাশের প্রান্তিক আলোর রিফ্লেক্ট) */}
                <div className="absolute top-3.5 left-1.5 w-[2px] h-3 bg-gradient-to-b from-white/90 to-transparent rounded-full blur-[0.2px]" />

                {/* 5. Right Rim Micro Light Reflection (ডানপাশের প্রান্তিক আলোর রিফ্লেক্ট) */}
                <div className="absolute top-4 right-1.5 w-[1.5px] h-2.5 bg-gradient-to-b from-white/80 to-transparent rounded-full blur-[0.2px]" />

                {/* 6. Bottom Caustic Light Arc (নিচের প্রতিসরিত বাঁকানো আলোর ফোকাস) */}
                <div className="absolute bottom-0.5 inset-x-3 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px] shadow-[0_0_4px_rgba(255,255,255,0.95)]" />

                {/* 7. Bottom-Left Small Light Reflection Spot (নিচের ছোট উজ্জ্বল আলোর বিন্দু) */}
                <div className="absolute bottom-1.5 left-4 w-2.5 h-[1.5px] bg-white/90 rounded-full blur-[0.2px] shadow-[0_0_3px_#ffffff]" />
              </div>
            </div>
          </div>
        )}

        <div 
          className="relative z-10 grid h-[52px] items-center gap-1" 
          style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
        >
          {tabs.map((tab, idx) => {
            const isActive = idx === activeIndex;
            const badgeCount = getBadgeCount(tab.badge);
            const IconComp = iconMap[tab.icon] || Home;

            return (
              <Link
                key={tab.label}
                to={tab.href}
                aria-label={tab.label}
                onMouseEnter={() => prefetchRoute(tab.href)}
                onTouchStart={() => prefetchRoute(tab.href)}
                className={cn(
                  "flex flex-col items-center justify-center relative touch-manipulation h-full py-1.5 px-1 rounded-[18px] transition-all duration-200 active:scale-90 select-none group",
                  isActive 
                    ? "text-slate-900 dark:text-white font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <div className="relative flex items-center justify-center">
                  <IconComp 
                    className={cn(
                      "h-[21px] w-[21px] transition-all duration-300",
                      isActive 
                        ? "stroke-[2.35] text-slate-900 dark:text-white scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" 
                        : "stroke-[1.85] text-slate-500 dark:text-slate-400 group-hover:scale-105"
                    )} 
                  />
                  
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in-50 duration-150">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>

                <span className={cn(
                  "text-[10.5px] leading-tight tracking-tight transition-all duration-200 mt-1",
                  isActive 
                    ? "text-slate-900 dark:text-white font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-none" 
                    : "text-slate-500 dark:text-slate-400 font-medium"
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

