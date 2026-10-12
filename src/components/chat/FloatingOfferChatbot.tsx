import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Move, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatOffer {
  id: string;
  text: string;
  intent: string;
  questionLabel?: string;
}

const TEMPTING_OFFERS: ChatOffer[] = [
  {
    id: "coupon_deal",
    text: "🎁 স্পেশাল সিক্রেট ডিসকাউন্ট কুপন কোড!",
    intent: "off_active_coupons",
    questionLabel: "🎁 আজকের স্পেশাল সিক্রেট ডিসকাউন্ট কুপন কোড কী ও কীভাবে পাবো?",
  },
  {
    id: "budget_picker",
    text: "🛍️ বাজেটে সেরা প্রোডাক্ট পছন্দ করুন!",
    intent: "flow_product_finder",
    questionLabel: "🛍️ আমার বাজেটে সেরা প্রোডাক্ট পছন্দ করতে সাহায্য করুন",
  },
  {
    id: "fast_shipping",
    text: "🚚 সারাদেশে মাত্র ৬০ টাকায় ডেলিভারি!",
    intent: "del_charge_time",
    questionLabel: "🚚 সারা বাংলাদেশে ডেলিভারি চার্জ ও ডেলিভারি সময় কত?",
  },
  {
    id: "order_tracking",
    text: "📦 পার্সেল কোথায়? লাইভ ট্র্যাকিং দেখুন!",
    intent: "acc_my_latest_order",
    questionLabel: "📦 আমার সর্বশেষ অর্ডার কোথায় ও লাইভ ট্র্যাকিং দেখতে চাই",
  },
  {
    id: "support_help",
    text: "💬 সরাসরি কাস্টমার কেয়ার ও WhatsApp!",
    intent: "tech_support_contact",
    questionLabel: "💬 কাস্টমার কেয়ার ও WhatsApp হেল্পলাইন নম্বর কত?",
  },
  {
    id: "report_complaint",
    text: "🚨 সমস্যা বা অভিযোগ দ্রুত রিপোর্ট করুন!",
    intent: "flow_submit_report",
    questionLabel: "🚨 যেকোনো অভিযোগ বা সমস্যা সংক্রান্ত রিপোর্ট জমা দিতে চাই",
  },
];

const BOT_SIZE_MOBILE = 46;
const BOT_SIZE_DESKTOP = 52;

export function FloatingOfferChatbot() {
  return null;
}

function _DisabledFloatingOfferChatbot() {

  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("durtup_bot_hidden") === "true";
    } catch {
      return false;
    }
  });

  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Clamping helper considering total width
  const clampPos = useCallback((rawX: number, rawY: number) => {
    if (typeof window === "undefined") return { x: rawX, y: rawY };
    const isMobile = window.innerWidth <= 768;
    const botSize = isMobile ? BOT_SIZE_MOBILE : BOT_SIZE_DESKTOP;
    const minX = 6;
    const maxX = Math.max(6, window.innerWidth - botSize - 8);
    const minY = 60;
    const maxY = Math.max(60, window.innerHeight - botSize - (isMobile ? 85 : 30));

    return {
      x: Math.min(Math.max(minX, rawX), maxX),
      y: Math.min(Math.max(minY, rawY), maxY),
    };
  }, []);

  // Compute safe initial position
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const botSize = isMobile ? BOT_SIZE_MOBILE : BOT_SIZE_DESKTOP;
    const defaultX = window.innerWidth - botSize - 12;
    const defaultY = window.innerHeight - botSize - (isMobile ? 95 : 45);

    try {
      const saved = sessionStorage.getItem("durtup_bot_coord");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPos(parsed.x, parsed.y));
          return;
        }
      }
    } catch {}

    setPosition(clampPos(defaultX, defaultY));
  }, [clampPos]);

  // Handle window resize with clamping
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return clampPos(prev.x, prev.y);
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPos]);

  // Cycle offers periodically (every 5 seconds)
  useEffect(() => {
    if (isHovered || isDragging) return;

    timerRef.current = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % TEMPTING_OFFERS.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, isDragging]);

  const activeOffer = TEMPTING_OFFERS[currentOfferIndex];

  const handleOpenChat = (offer?: ChatOffer) => {
    if (hasMovedRef.current) return;
    const target = offer || activeOffer;
    const labelToSend = target.questionLabel || target.text;
    navigate(`/messages?intent=${encodeURIComponent(target.intent)}&label=${encodeURIComponent(labelToSend)}`);
  };

  // Pointer Drag Handlers (Unified Touch + Mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = position || clampPos(window.innerWidth - 70, window.innerHeight - 100);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (Math.hypot(dx, dy) > 6) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const nextX = posStartRef.current.x + dx;
      const nextY = posStartRef.current.y + dy;
      setPosition(clampPos(nextX, nextY));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (hasMovedRef.current) {
      if (position) {
        try {
          sessionStorage.setItem("durtup_bot_coord", JSON.stringify(position));
        } catch {}
      }
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 100);
    }
  };

  const handleBotClick = () => {
    if (hasMovedRef.current) return;
    handleOpenChat(activeOffer);
  };

  const handleHideBot = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHidden(true);
    try {
      sessionStorage.setItem("durtup_bot_hidden", "true");
    } catch {}
  };

  if (isHidden || !position) return null;

  // Screen-aware dynamic placement and width constraints
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 380;
  const isMobile = screenWidth <= 768;
  const avatarSize = isMobile ? BOT_SIZE_MOBILE : BOT_SIZE_DESKTOP;
  const isLeftSide = position.x < screenWidth / 2;

  // Maximum allowed width for the pill to strictly prevent horizontal overflow on any phone
  const maxPillWidth = isLeftSide
    ? Math.max(120, screenWidth - position.x - avatarSize - 16)
    : Math.max(120, position.x - 16);

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        top: 0,
        left: 0,
      }}
      className="fixed z-50 pointer-events-none select-none touch-none"
    >
      <div
        className={cn(
          "relative flex items-center gap-1.5 sm:gap-2",
          isLeftSide ? "flex-row" : "flex-row-reverse -translate-x-[calc(100%-46px)] sm:-translate-x-[calc(100%-52px)]"
        )}
      >
        
        {/* 1. Main Draggable Circular AI Avatar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleBotClick}
          className="pointer-events-auto relative shrink-0 cursor-grab active:cursor-grabbing group"
          title="টেনে যেকোনো জায়গায় নিয়ে যান অথবা চ্যাট করতে ক্লিক করুন"
        >
          {/* Ambient Glowing Halo */}
          <div className={cn(
            "absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 via-cyan-500 to-amber-500 opacity-60 blur-md transition-opacity pointer-events-none",
            isDragging ? "opacity-95 scale-110" : "group-hover:opacity-90 animate-pulse"
          )} />

          {/* Avatar Disc */}
          <div
            className={cn(
              "w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-full",
              "bg-slate-950 p-[2px] shadow-[0_6px_25px_rgba(249,115,22,0.45)]",
              "border border-white/30 transition-transform duration-100",
              isDragging ? "scale-110 shadow-2xl" : "hover:scale-105 active:scale-95",
              "flex items-center justify-center overflow-hidden"
            )}
          >
            {/* Inner Ring */}
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-cyan-400 p-[1.5px] flex items-center justify-center">
              
              {/* Dark Core */}
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-transparent to-cyan-500/30 animate-pulse pointer-events-none" />

                {/* Sigma Logo */}
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)] relative z-10 group-hover:rotate-6 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 4H5l7 8-7 8h14" />
                </svg>

                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-300 rounded-full shadow-[0_0_8px_#fde047] animate-ping" />
              </div>
            </div>

            {/* Online Green Indicator Dot */}
            <span className="absolute top-0 right-0 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </span>

            {/* Mini AI Badge */}
            <span className="absolute -bottom-0.5 inset-x-0 mx-auto w-max px-1 sm:px-1.5 py-0.2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 text-white text-[6.5px] sm:text-[7px] font-black uppercase tracking-wider shadow-sm border border-white/60 flex items-center gap-0.5 leading-none">
              <Move className="w-1.5 h-1.5" /> AI
            </span>
          </div>
        </div>

        {/* 2. Full Clean Single-Line Animated Offer Pill with Integrated Close Button */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ maxWidth: `${maxPillWidth}px` }}
          className={cn(
            "pointer-events-auto h-8.5 sm:h-10 pl-3 pr-1.5 sm:pl-4 sm:pr-2.5 rounded-full",
            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
            "border border-orange-400/90 dark:border-orange-500/60",
            "shadow-[0_4px_20px_rgba(249,115,22,0.25)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.7)]",
            "flex items-center gap-1.5 sm:gap-2 cursor-pointer overflow-hidden",
            "hover:scale-[1.02] transition-all duration-200",
            "animate-in fade-in slide-in-from-right-2 duration-200 shrink-0 group"
          )}
        >
          {/* Full Single-Line Offer Text with Ellipsis */}
          <span 
            onClick={() => handleOpenChat(activeOffer)}
            className="text-[11px] sm:text-[13px] font-black text-slate-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1 leading-none drop-shadow-xs group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
          >
            {activeOffer.text}
          </span>

          {/* Integrated Sleek Close / Hide Button */}
          <button
            type="button"
            onClick={handleHideBot}
            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
            title="হাইড করুন"
            aria-label="Hide Chatbot"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}
