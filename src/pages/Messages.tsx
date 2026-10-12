import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { 
  ShoppingBag, 
  Truck, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  Plus, 
  HelpCircle, 
  PackageCheck, 
  ShieldCheck, 
  Scale, 
  Phone, 
  MessageCircle, 
  Tag, 
  Lock, 
  Compass,
  AlertCircle,
  Send,
  MessageSquare
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { 
  fetchAllFAQs, 
  FAQ_CATEGORIES, 
  SEED_FAQ_ITEMS,
  type FAQItem, 
  type FAQCategory,
  trackQuestionClick,
  submitCustomerReport
} from "@/services/knowledgeBaseService";
import {
  getLiveStoreSettings,
  getLiveActiveCoupons,
  getLiveUserOrders,
  getScoredRecommendedProducts,
  generateObjectiveComparison,
  type BotMessage,
  type ConversationState,
  INITIAL_CONVERSATION_STATE,
  type BotProductRecommendation,
  type BotComparisonData,
  type BotOrderSummary
} from "@/services/botEngine";
import type { Product } from "@/components/products/ProductCard";

function SigmaAILogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0 select-none", className)}>
      <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center">
        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
          {/* Subtle Cyber Grid / Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-transparent to-purple-500/20 pointer-events-none" />
          
          {/* Sigma Greek Stylized Symbol with Glowing Gradients */}
          <svg
            className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] relative z-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 4H5l7 8-7 8h14" />
          </svg>

          {/* AI Sparkle */}
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_6px_#67e8f9] animate-pulse" />
        </div>
      </div>
      {/* Active Online Pulse Dot */}
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-xs ring-2 ring-emerald-500/20" />
    </div>
  );
}

function renderFormattedSpan(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-black text-slate-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedBotText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        if (!line.trim()) {
          return <div key={idx} className="h-1" />;
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-0.5 my-0.5">
              <span className="text-orange-500 font-bold shrink-0">•</span>
              <div className="flex-1">{renderFormattedSpan(line.replace(/^[-•]\s*/, ""))}</div>
            </div>
          );
        }
        return <p key={idx} className="leading-relaxed">{renderFormattedSpan(line)}</p>;
      })}
    </div>
  );
}

export default function BuyerMessages() {
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialIntentFiredRef = useRef(false);

  const [faqs, setFaqs] = useState<FAQItem[]>(SEED_FAQ_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>("popular");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_CONVERSATION_STATE);
  const processedParamRef = useRef<string | null>(null);

  // Customer Report Submission State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPhone, setReportPhone] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportCategory, setReportCategory] = useState("পণ্য সংক্রান্ত সমস্যা");
  const [reportOrderNo, setReportOrderNo] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Clean first name
  const rawName = profile?.full_name || user?.user_metadata?.full_name || profile?.name || "";
  const cleanName = rawName
    ? rawName.replace(/^(md\.?|mohammad|mohammed|mrs\.?|mr\.?|mst\.?)\s+/i, "").split(" ")[0] || rawName.split(" ")[0]
    : "";

  // Prefill phone and name if user profile exists
  useEffect(() => {
    if (profile?.full_name || user?.user_metadata?.full_name) {
      setReportName(profile?.full_name || user?.user_metadata?.full_name || "");
    }
    if (profile?.phone || (user as any)?.phone) {
      setReportPhone(profile?.phone || (user as any)?.phone || "");
    }
  }, [user, profile]);

  // Initial Greeting Bot Message
  const getGreetingMessage = useCallback((): BotMessage => {
    return {
      id: "welcome-root",
      sender: "bot",
      text: cleanName
        ? `আসসালামু আলাইকুম **${cleanName}**! 👋\nআমি **Sigma AI** — Durtup.shop-এর অফিসিয়াল পার্সোনাল শপিং ও কাস্টমার কেয়ার গাইড।\n\nপ্রোডাক্ট কেনাকাটা, বাজেট অনুযায়ী সেরা পছন্দ, লাইভ অর্ডার ট্র্যাক, ডেলিভারি চার্জ বা রিটার্ন পলিসি জানতে নিচের অপশনে ক্লিক করুন:`
        : `আসসালামু আলাইকুম! 👋\nআমি **Sigma AI** — Durtup.shop-এর অফিসিয়াল পার্সোনাল শপিং ও কাস্টমার কেয়ার গাইড।\n\nপণ্য পছন্দ, বাজেট রিকমেন্ডেশন, লাইভ ডেলিভারি চার্জ বা অর্ডারে সহায়তা পেতে নিচের যেকোনো বিষয়ে ক্লিক করুন:`,
      timestamp: "এইমাত্র",
      followUpQuestions: [
        { label: "🛍️ পণ্য কিনতে চাই (বাজেট ও ক্যাটাগরি)", intentOrQuery: "flow_product_finder" },
        { label: "🚚 ডেলিভারি চার্জ ও সময় কত?", intentOrQuery: "del_charge_time" },
        { label: "📞 কাস্টমার কেয়ার ও WhatsApp (01885985097)", intentOrQuery: "tech_support_contact" },
        { label: "🚨 সমস্যা / অভিযোগ রিপোর্ট করুন", intentOrQuery: "flow_submit_report" },
        { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", intentOrQuery: "pay_cod_available" },
        { label: "📦 আমার অর্ডার কোথায়? (লাইভ ট্র্যাক)", intentOrQuery: "acc_my_latest_order" },
        { label: "🔄 ৭ দিন রিটার্ন ও চেক পলিসি", intentOrQuery: "ret_policy_check" },
        { label: "🎁 চলতি ডিসকাউন্ট কুপন", intentOrQuery: "off_active_coupons" },
        { label: "💼 রিসেলার প্রোগ্রাম ও আয়", intentOrQuery: "reseller_join_guide" },
        { label: "⚖️ দুটি প্রোডাক্টের তুলনা করুন", intentOrQuery: "flow_product_compare" },
      ],
    };
  }, [cleanName]);

  const [messages, setMessages] = useState<BotMessage[]>([getGreetingMessage()]);

  // Handle Report Form Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = reportPhone.trim().replace(/[\s-]/g, "");
    if (!cleanedPhone || cleanedPhone.length < 11) {
      toast.error("অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)");
      return;
    }
    if (!reportDetails.trim()) {
      toast.error("অনুগ্রহ করে আপনার অভিযোগ বা সমস্যার বিবরণ লিখুন");
      return;
    }

    setIsSubmittingReport(true);
    const res = await submitCustomerReport({
      name: reportName.trim() || cleanName || "কাস্টমার",
      phone: cleanedPhone,
      category: reportCategory,
      orderNumber: reportOrderNo.trim() || undefined,
      details: reportDetails.trim(),
      userId: user?.id,
    });

    setIsSubmittingReport(false);

    if (res.success) {
      setIsReportModalOpen(false);
      setReportDetails("");
      setReportOrderNo("");
      toast.success("আপনার রিপোর্টটি সফলভাবে গ্রহণ করা হয়েছে!");

      const botMsgId = `bot-${Date.now()}`;
      const nowTime = new Date().toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true });

      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: `✅ **আপনার অভিযোগটি সফলভাবে জমা হয়েছে!**\n\n• **রেফারেন্স নম্বর:** #${res.reportId}\n• **যোগাযোগ নম্বর:** ${cleanedPhone}\n• **সমস্যার ধরন:** ${reportCategory}\n\nআমাদের সাপোর্ট টিম আপনার অভিযোগটি গুরুত্বের সাথে যাচাই করে দ্রুত এই নম্বরে যোগাযোগ করবে। প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ দিতে পারেন: **01885985097**।`,
          timestamp: nowTime,
          actions: [
            { label: "💬 WhatsApp হেল্পলাইন (01885985097)", type: "link", payload: "https://wa.me/8801885985097", variant: "default" },
            { label: "🛍️ শপিং চালিয়ে যান", type: "link", payload: "/products", variant: "outline" },
          ],
          followUpQuestions: [
            { label: "🚚 ডেলিভারি চার্জ কত?", intentOrQuery: "del_charge_time" },
            { label: "📦 আমার অর্ডার কোথায়?", intentOrQuery: "acc_my_latest_order" },
          ],
        },
      ]);
    } else {
      toast.error("রিপোর্ট জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  // Load FAQs from Central Service
  useEffect(() => {
    fetchAllFAQs().then((list) => {
      if (list && list.length > 0) setFaqs(list);
    });
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Handle Start Over (Reset conversation)
  const handleStartOver = () => {
    setConversationState(INITIAL_CONVERSATION_STATE);
    setMessages([getGreetingMessage()]);
    toast.info("কথোপকথন রিস্টার্ট করা হয়েছে");
  };

  // Dispatch and handle Intent / Question Click
  const handleUserSelect = async (queryOrIntent: string, displayLabel?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const userText = displayLabel || queryOrIntent;
    const userMsgId = `user-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", hour12: true });

    // 1. Add User Message Bubble
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: userText,
        timestamp: nowTime,
      },
    ]);

    // Track Question Click for Admin Analytics
    trackQuestionClick(queryOrIntent);

    // 2. Resolve Multi-Step or Knowledge Base Intent
    try {
      // -------------------------------------------------------------
      // MULTI-STEP FLOW A: PRODUCT FINDER (Category -> Budget -> Scored Match)
      // -------------------------------------------------------------
      if (queryOrIntent === "flow_product_finder" || queryOrIntent === "prod_recommend_guided") {
        setConversationState((prev) => ({ ...prev, currentIntent: "PRODUCT_FINDER", currentStep: "CATEGORY" }));

        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: "অবশ্যই! আপনার জন্য পারফেক্ট পণ্যটি খুঁজে বের করতে সাহায্য করছি।\n\nআপনি কোন ধরনের পণ্য খুঁজছেন? নিচে থেকে ক্যাটাগরি নির্বাচন করুন:",
            timestamp: nowTime,
            followUpQuestions: [
              { label: "⌚ স্মার্টওয়াচ (Smartwatch)", intentOrQuery: "cat_select_smartwatch", icon: "⌚" },
              { label: "🎧 ইয়ারবাডস ও অডিও (Audio)", intentOrQuery: "cat_select_audio", icon: "🎧" },
              { label: "📱 গ্যাজেটস ও এক্সেসরিজ", intentOrQuery: "cat_select_gadgets", icon: "📱" },
              { label: "👕 ফ্যাশন ও পোশাক", intentOrQuery: "cat_select_fashion", icon: "👕" },
              { label: "🏠 হোম ও লাইফস্টাইল", intentOrQuery: "cat_select_home", icon: "🏠" },
              { label: "🌐 সকল পণ্য কালেকশন", intentOrQuery: "cat_select_all", icon: "🌐" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      // Product Finder: Category Selected -> Ask Budget
      if (queryOrIntent.startsWith("cat_select_")) {
        const catKey = queryOrIntent.replace("cat_select_", "");
        const catLabels: Record<string, string> = {
          smartwatch: "স্মার্টওয়াচ",
          audio: "ইয়ারবাডস ও অডিও",
          gadgets: "গ্যাজেটস ও এক্সেসরিজ",
          fashion: "ফ্যাশন ও পোশাক",
          home: "হোম ও লাইফস্টাইল",
          all: "সকল পণ্য",
        };
        const catLabel = catLabels[catKey] || catKey;

        setConversationState((prev) => ({
          ...prev,
          selectedCategory: catKey,
          selectedCategoryLabel: catLabel,
          currentStep: "BUDGET",
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `চমৎকার! নির্বাচিত ক্যাটাগরি: **${catLabel}**।\n\nএবার আপনার আনুমানিক বাজেট কত তা নির্বাচন করুন:`,
            timestamp: nowTime,
            followUpQuestions: [
              { label: "💰 ৳৫০০-এর নিচে", intentOrQuery: `budget_under_500_${catKey}`, icon: "💰" },
              { label: "💰 ৳৫০০ – ৳১,০০০", intentOrQuery: `budget_500_1000_${catKey}`, icon: "💰" },
              { label: "💰 ৳১,০০০ – ৳২,০০০", intentOrQuery: `budget_1000_2000_${catKey}`, icon: "💰" },
              { label: "💎 ৳২,০০০+", intentOrQuery: `budget_above_2000_${catKey}`, icon: "💎" },
              { label: "🌟 যেকোনো বাজেট", intentOrQuery: `budget_any_${catKey}`, icon: "🌟" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      // Product Finder: Budget Selected -> Live DB Query & Scoring
      if (queryOrIntent.startsWith("budget_")) {
        let minB: number | null = null;
        let maxB: number | null = null;
        let budgetLabel = "যেকোনো বাজেট";
        const parts = queryOrIntent.split("_");
        const catKey = parts[parts.length - 1];

        if (queryOrIntent.includes("under_500")) {
          maxB = 500;
          budgetLabel = "৳৫০০-এর নিচে";
        } else if (queryOrIntent.includes("500_1000")) {
          minB = 500;
          maxB = 1000;
          budgetLabel = "৳৫০০ – ৳১,০০০";
        } else if (queryOrIntent.includes("1000_2000")) {
          minB = 1000;
          maxB = 2000;
          budgetLabel = "৳১,০০০ – ৳২,০০০";
        } else if (queryOrIntent.includes("above_2000")) {
          minB = 2000;
          budgetLabel = "৳২,০০০+";
        }

        const scored = await getScoredRecommendedProducts({
          categorySlug: catKey === "all" ? null : catKey,
          minBudget: minB,
          maxBudget: maxB,
          limit: 4,
        });

        if (scored.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: `আপনার নির্বাচিত বাজেট (${budgetLabel}) অনুযায়ী লাইভ ডাটাবেজ থেকে ম্যাচ করা সেরা পণ্যসমূহ:`,
              timestamp: nowTime,
              products: scored,
              actions: [
                { label: "🛒 কার্ট দেখুন", type: "link", payload: "/cart", variant: "default" },
                { label: "🛍️ আরও পণ্য দেখুন", type: "link", payload: "/products", variant: "outline" },
              ],
              followUpQuestions: [
                { label: "⚖️ দুটি প্রোডাক্টের তুলনা করুন", intentOrQuery: "flow_product_compare", icon: "⚖️" },
                { label: "🚚 ডেলিভারি চার্জ কত?", intentOrQuery: "del_charge_time", icon: "🚚" },
                { label: "🔄 অন্য ক্যাটাগরি দেখুন", intentOrQuery: "flow_product_finder", icon: "🔄" },
              ],
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: `আপনার নির্বাচিত বাজেট (${budgetLabel}) অনুযায়ী এই মুহূর্তে সরাসরি কোনো স্টক পাওয়া যায়নি।\nতবে আপনি আমাদের সম্পূর্ণ ক্যাটালগে অন্যান্য প্রোডাক্ট দেখতে পারেন:`,
              timestamp: nowTime,
              actions: [
                { label: "🛍️ সম্পূর্ণ ক্যাটালগ দেখুন", type: "link", payload: "/products", variant: "default" },
                { label: "📞 কাস্টমার সাপোর্ট", type: "link", payload: "/contact", variant: "outline" },
              ],
              followUpQuestions: [
                { label: "🔄 অন্য বাজেটে খুঁজুন", intentOrQuery: `cat_select_${catKey}`, icon: "🔄" },
                { label: "🔥 সর্বাধিক বিক্রিত পণ্য", intentOrQuery: "flow_product_finder", icon: "🔥" },
              ],
            },
          ]);
        }

        setIsProcessing(false);
        return;
      }

      // -------------------------------------------------------------
      // MULTI-STEP FLOW B: PRODUCT COMPARISON (Live 2-Product Comparison)
      // -------------------------------------------------------------
      if (queryOrIntent === "flow_product_compare") {
        const topProds = await getScoredRecommendedProducts({ limit: 6 });
        if (topProds.length >= 2) {
          const comp = generateObjectiveComparison(topProds[0].product, topProds[1].product);
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: `আমাদের শীর্ষ দুটি ট্রেন্ডিং পণ্যের লাইভ স্পেসিফিকেশন ও মূল্য তুলনা নিচে দেওয়া হলো:\n\n**${comp.productA.name}** বনাম **${comp.productB.name}**\n\n${comp.summary}`,
              timestamp: nowTime,
              comparison: comp,
              actions: [
                { label: `🛍️ ${comp.productA.name.slice(0, 15)}... দেখুন`, type: "link", payload: `/product/${comp.productA.slug || comp.productA.id}`, variant: "default" },
                { label: `🛍️ ${comp.productB.name.slice(0, 15)}... দেখুন`, type: "link", payload: `/product/${comp.productB.slug || comp.productB.id}`, variant: "outline" },
              ],
              followUpQuestions: [
                { label: "🚚 ডেলিভারি চার্জ কত?", intentOrQuery: "del_charge_time", icon: "🚚" },
                { label: "💵 ক্যাশ অন ডেলিভারি আছে?", intentOrQuery: "pay_cod_available", icon: "💵" },
                { label: "🛍️ নতুন পণ্য খুঁজুন", intentOrQuery: "flow_product_finder", icon: "🛍️" },
              ],
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: "দুঃখিত, তুলনার জন্য প্রয়োজনীয় লাইভ পণ্য ডেটা এই মুহূর্তে যথেষ্ট নয়। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
              timestamp: nowTime,
              actions: [{ label: "🛍️ সকল পণ্য দেখুন", type: "link", payload: "/products", variant: "default" }],
            },
          ]);
        }
        setIsProcessing(false);
        return;
      }

      // -------------------------------------------------------------
      // AUTH FLOW: LIVE USER ORDERS & ORDER STATUS
      // -------------------------------------------------------------
      if (queryOrIntent === "acc_my_latest_order" || queryOrIntent === "user_orders") {
        if (!user) {
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: "আপনার ব্যক্তিগত অর্ডারের লাইভ তথ্য ও স্ট্যাটাস দেখতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন:",
              timestamp: nowTime,
              actions: [
                { label: "🔑 লগইন করুন", type: "link", payload: "/login?redirect=/messages", variant: "default" },
                { label: "📦 অর্ডার ট্র্যাকিং পেজ", type: "link", payload: "/track", variant: "outline" },
              ],
              followUpQuestions: [
                { label: "🚚 ডেলিভারি কতদিন লাগে?", intentOrQuery: "del_charge_time", icon: "🚚" },
                { label: "📞 কাস্টমার সাপোর্ট", intentOrQuery: "tech_support_contact", icon: "📞" },
              ],
            },
          ]);
          setIsProcessing(false);
          return;
        }

        const userOrders = await getLiveUserOrders(user.id);

        if (userOrders.length > 0) {
          const latest = userOrders[0];
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: `আপনার সর্বশেষ অর্ডারের (**#${latest.orderNumber}**) লাইভ ট্র্যাকিং ও বিস্তারিত স্ট্যাটাস:`,
              timestamp: nowTime,
              order: latest,
              ordersList: userOrders.length > 1 ? userOrders.slice(1) : undefined,
              actions: [
                { label: "📦 বিস্তারিত ট্র্যাকিং দেখুন", type: "link", payload: `/orders/${latest.orderId}`, variant: "default" },
                { label: "📋 সকল অর্ডার তালিকা", type: "link", payload: "/orders", variant: "outline" },
              ],
              followUpQuestions: [
                { label: "🔄 রিটার্ন ও এক্সচেঞ্জ নিয়ম", intentOrQuery: "ret_policy_check", icon: "🔄" },
                { label: "📞 কাস্টমার সাপোর্ট কেয়ার", intentOrQuery: "tech_support_contact", icon: "📞" },
              ],
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: "bot",
              text: "আপনার অ্যাকাউন্টে বর্তমানে কোনো পূর্ববর্তী অর্ডার পাওয়া যায়নি। নতুন পণ্য অর্ডার করতে নিচের বাটনে ক্লিক করুন:",
              timestamp: nowTime,
              actions: [
                { label: "🛍️ পণ্য ব্রাউজ করুন", type: "link", payload: "/products", variant: "default" },
              ],
              followUpQuestions: [
                { label: "🛍️ প্রোডাক্ট রিকমেন্ডেশন", intentOrQuery: "flow_product_finder", icon: "🛍️" },
                { label: "🎁 চলতি অফারসমূহ", intentOrQuery: "off_active_coupons", icon: "🎁" },
              ],
            },
          ]);
        }
        setIsProcessing(false);
        return;
      }

      // -------------------------------------------------------------
      // DYNAMIC DATA INTENTS: SHIPPING CONFIG, STORE CONTACT, COUPONS
      // -------------------------------------------------------------
      if (queryOrIntent === "del_charge_time" || queryOrIntent === "shipping_config") {
        const settings = await getLiveStoreSettings();
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `🚚 **Durtup.shop অফিসিয়াল ডেলিভারি তথ্য:**\n\n• **সারাদেশে ডেলিভারি চার্জ:** মাত্র **৳${settings.insideDhakaFee}** (সারা বাংলাদেশ মাত্র ৬০ টাকা)\n• **ঢাকার ভিতরে ডেলিভারি সময়:** ${settings.insideDhakaTime}\n• **ঢাকার বাইরে ডেলিভারি সময়:** ${settings.outsideDhakaTime}\n\n📦 প্রতিটি পার্সেল ক্লোজ মনিটরিং ও লাইভ এসএমএস ট্র্যাকিং সহ পাঠানো হয়।`,
            timestamp: nowTime,
            actions: [
              { label: "📦 অর্ডার ট্র্যাক করুন", type: "link", payload: "/track", variant: "default" },
              { label: "🛍️ শপিং শুরু করুন", type: "link", payload: "/products", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "💵 ক্যাশ অন ডেলিভারি নিয়ম", intentOrQuery: "pay_cod_available" },
              { label: "🔄 ৭ দিন রিটার্ন ও চেক পলিসি", intentOrQuery: "ret_policy_check" },
              { label: "📦 আমার অর্ডার কোথায়?", intentOrQuery: "acc_my_latest_order" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      if (queryOrIntent === "off_active_coupons" || queryOrIntent === "active_coupons") {
        const coupons = await getLiveActiveCoupons();
        const couponListText = coupons.map((c) => `• কোড: **${c.code}** — ${c.discountText} (${c.description})`).join("\n");
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `🎁 **বর্তমানে সক্রিয় স্পেশাল ডিসকাউন্ট কুপনসমূহ:**\n\n${couponListText}\n\nচেকআউট পেজে কুপন কোডটি প্রবেশ করিয়ে সরাসরি ডিসকাউন্ট উপভোগ করুন!`,
            timestamp: nowTime,
            actions: [
              { label: "🛍️ অফার প্রোডাক্ট দেখুন", type: "link", payload: "/products?filter=deals", variant: "default" },
              { label: "🛒 কার্টে যান", type: "link", payload: "/cart", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "🛍️ প্রোডাক্ট রিকমেন্ডেশন", intentOrQuery: "flow_product_finder", icon: "🛍️" },
              { label: "🚚 ডেলিভারি চার্জ কত?", intentOrQuery: "del_charge_time", icon: "🚚" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      if (queryOrIntent === "flow_submit_report" || queryOrIntent === "open_report") {
        setIsReportModalOpen(true);
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `🚨 **সমস্যা বা অভিযোগ রিপোর্ট ফরম:**\n\nআপনার যেকোনো অভিযোগ বা সমস্যার দ্রুত সমাধানের জন্য রিপোর্ট ফর্মটি পূরণ করুন। আমাদের কাস্টমার কেয়ার টিম আপনার নম্বরে সরাসরি যোগাযোগ করে বিষয়টি সমাধান করবে।\n\nজরুরি প্রয়োজনে সরাসরি আমাদের বিজনেস হোয়াটসঅ্যাপে যোগাযোগ করতে পারেন: **01885985097**।`,
            timestamp: nowTime,
            actions: [
              { label: "📝 অভিযোগ ফর্ম পূরণ করুন", type: "callback", payload: "open_report_dialog", variant: "default" },
              { label: "💬 WhatsApp হেল্পলাইন (01885985097)", type: "link", payload: "https://wa.me/8801885985097", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "📞 কাস্টমার কেয়ার হেল্পলাইন", intentOrQuery: "tech_support_contact" },
              { label: "📦 আমার অর্ডার কোথায়?", intentOrQuery: "acc_my_latest_order" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      if (queryOrIntent === "tech_support_contact" || queryOrIntent === "site_contact") {
        const settings = await getLiveStoreSettings();
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `📞 **Durtup.shop অফিসিয়াল কাস্টমার কেয়ার ও হেল্পলাইন:**\n\n• **হোয়াটসঅ্যাপ বিজনেস নম্বর:** **01885985097**\n• **সরাসরি হেল্পলাইন কল:** **01885985097**\n• **ইমেইল:** ${settings.email}\n• **অফিস ঠিকানা:** ${settings.address}\n• **সার্ভিস সময়:** প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত।\n\nআপনার কোনো অর্ডার বা সার্ভিস নিয়ে অভিযোগ থাকলে সরাসরি রিপোর্ট জমা দিতে পারেন।`,
            timestamp: nowTime,
            actions: [
              { label: "💬 WhatsApp (01885985097)", type: "link", payload: "https://wa.me/8801885985097", variant: "default" },
              { label: "📞 সরাসরি কল করুন (01885985097)", type: "link", payload: "tel:01885985097", variant: "outline" },
              { label: "🚨 অভিযোগ রিপোর্ট করুন", type: "callback", payload: "open_report_dialog", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "🚨 সমস্যা বা অভিযোগ রিপোর্ট", intentOrQuery: "flow_submit_report" },
              { label: "🔄 ৭ দিন রিটার্ন ও চেক পলিসি", intentOrQuery: "ret_policy_check" },
              { label: "📦 আমার অর্ডার কোথায়?", intentOrQuery: "acc_my_latest_order" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      // -------------------------------------------------------------
      // DIRECT FAQ INTENT HANDLERS (COD, Return, Reseller, Orders)
      // -------------------------------------------------------------
      if (queryOrIntent === "pay_cod_available" || queryOrIntent === "cod_rules") {
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `💵 **১০০% ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা:**\n\n• Durtup.shop-এ কোনো ধরনের অগ্রিম পেমেন্ট ছাড়াই নিশ্চিন্তে অর্ডার করতে পারবেন।\n• ডেলিভারিম্যানের কাছ থেকে পণ্যটি হাতে পেয়ে সম্পূর্ণ মূল্য পরিশোধ করবেন।\n• এছাড়া চাইলে বিকাশ, নগদ, রকেট বা ডেবিট/ক্রেডিট কার্ডের মাধ্যমেও পেমেন্ট করতে পারেন।`,
            timestamp: nowTime,
            actions: [
              { label: "🛍️ শপিং শুরু করুন", type: "link", payload: "/products", variant: "default" },
              { label: "🚚 ডেলিভারি চার্জ কত?", type: "intent", payload: "del_charge_time", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "🚚 ডেলিভারি চার্জ ও সময়", intentOrQuery: "del_charge_time" },
              { label: "🔄 ৭ দিন রিটার্ন পলিসি", intentOrQuery: "ret_policy_check" },
              { label: "🎁 চলতি ডিসকাউন্ট কুপন", intentOrQuery: "off_active_coupons" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      if (queryOrIntent === "ret_policy_check" || queryOrIntent === "return_policy") {
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `🛡️ **৭ দিনের চেক ও রিটার্ন নিশ্চয়তা:**\n\n• ডেলিভারিম্যানের সামনেই পার্সেল খুলে চেক করে দেখে নিতে পারবেন।\n• কোনো ত্রুটি, ভাঙা বা পণ্যে অমিল পেলে ডেলিভারিম্যানের কাছে সাথে সাথে রিটার্ন করতে পারবেন (কোনো চার্জ প্রযোজ্য নয়)।\n• ডেলিভারির পরেও ৭ দিনের মধ্যে আনবক্সিং ভিডিও সহ যোগাযোগ করলে দ্রুত পরিবর্তন বা রিফান্ড দেওয়া হয়।`,
            timestamp: nowTime,
            actions: [
              { label: "📄 রিটার্ন পলিসি পেজ", type: "link", payload: "/returns", variant: "outline" },
              { label: "💬 WhatsApp সাপোর্ট (01885985097)", type: "link", payload: "https://wa.me/8801885985097", variant: "default" },
            ],
            followUpQuestions: [
              { label: "📞 কাস্টমার কেয়ার হেল্পলাইন", intentOrQuery: "tech_support_contact" },
              { label: "🚚 ডেলিভারি চার্জ কত?", intentOrQuery: "del_charge_time" },
              { label: "📦 আমার অর্ডার ট্র্যাক", intentOrQuery: "acc_my_latest_order" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      if (queryOrIntent === "reseller_join_guide" || queryOrIntent === "reseller_income") {
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: `💼 **Durtup.shop রিসেলার প্রোগ্রাম (জিরো ইনভেস্টমেন্ট):**\n\n১. সম্পূর্ণ বিনামূল্যে রিসেলার অ্যাকাউন্ট তৈরি করুন।\n২. আমাদের পাইকারি রেটের যেকোনো প্রোডাক্ট আপনার ফেসবুক পেজ, গ্রুপ বা পরিচিতদের কাছে নিজের প্রফিট মার্জিন যোগ করে শেয়ার করুন।\n৩. কাস্টমারের নাম ও ঠিকানায় অর্ডার প্লেস করুন। আমরা ডেলিভারি সম্পন্ন করে আপনার প্রফিট সরাসরি বিকাশ/নগদ ওয়ালেটে পাঠিয়ে দেবো।`,
            timestamp: nowTime,
            actions: [
              { label: "💼 রিসেলার রেজিস্ট্রেশন", type: "link", payload: "/affiliate", variant: "default" },
              { label: "💬 রিসেলার হেল্পলাইন", type: "link", payload: "https://wa.me/8801885985097", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "🛍️ পণ্য ক্যাটালগ দেখুন", intentOrQuery: "flow_product_finder" },
              { label: "🚚 ডেলিভারি সময় কত?", intentOrQuery: "del_charge_time" },
            ],
          },
        ]);
        setIsProcessing(false);
        return;
      }

      // -------------------------------------------------------------
      // STANDARD KNOWLEDGE BASE ITEM LOOKUP
      // -------------------------------------------------------------
      const matchedFaq = faqs.find(
        (f) =>
          f.id.toLowerCase() === queryOrIntent.toLowerCase() ||
          f.questionBn.toLowerCase() === queryOrIntent.toLowerCase() ||
          f.questionEn.toLowerCase() === queryOrIntent.toLowerCase()
      );

      if (matchedFaq) {
        // Collect related follow-up questions
        const relatedFollowUps = (matchedFaq.relatedQuestionIds || [])
          .map((id) => faqs.find((f) => f.id === id))
          .filter(Boolean)
          .map((f) => ({
            label: f!.questionBn,
            intentOrQuery: f!.id,
          }));

        // Default follow-ups if empty
        const finalFollowUps = relatedFollowUps.length > 0 ? relatedFollowUps : [
          { label: "🛍️ প্রোডাক্ট রিকমেন্ডেশন", intentOrQuery: "flow_product_finder", icon: "🛍️" },
          { label: "🚚 ডেলিভারি চার্জ ও সময়", intentOrQuery: "del_charge_time", icon: "🚚" },
          { label: "📞 কাস্টমার সাপোর্ট কেয়ার", intentOrQuery: "tech_support_contact", icon: "📞" },
        ];

        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: matchedFaq.answerBn,
            timestamp: nowTime,
            actions: matchedFaq.actionButtons,
            followUpQuestions: finalFollowUps,
          },
        ]);
      } else {
        // ZERO-HALLUCINATION SAFE FALLBACK
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: "bot",
            text: "দুঃখিত, এই তথ্যটি বর্তমানে নিশ্চিতভাবে পাওয়া যাচ্ছে না। সঠিক ও হালনাগাদ তথ্যের জন্য অনুগ্রহ করে আমাদের কাস্টমার সাপোর্ট টিমের সাথে যোগাযোগ করুন।",
            timestamp: nowTime,
            actions: [
              { label: "📞 কাস্টমার সাপোর্ট", type: "link", payload: "/contact", variant: "default" },
              { label: "🛍️ পণ্য ক্যাটালগ", type: "link", payload: "/products", variant: "outline" },
            ],
            followUpQuestions: [
              { label: "🛍️ প্রোডাক্ট রিকমেন্ডেশন", intentOrQuery: "flow_product_finder", icon: "🛍️" },
              { label: "🚚 ডেলিভারি চার্জ কত?", intentOrQuery: "del_charge_time", icon: "🚚" },
              { label: "🔥 মূল মেনু", intentOrQuery: "root_greeting", icon: "🔥" },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error("[BotEngine Error]:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: "bot",
          text: "দুঃখিত, এই মুহূর্তে তথ্য লোড করতে সমস্যা হচ্ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন অথবা কাস্টমার কেয়ারে যোগাযোগ করুন।",
          timestamp: nowTime,
          isError: true,
          actions: [{ label: "📞 কাস্টমার কেয়ার", type: "link", payload: "/contact", variant: "default" }],
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-respond to incoming URL Intent (e.g. from Floating Offer Chatbot)
  useEffect(() => {
    const urlIntent = searchParams.get("intent");
    const urlLabel = searchParams.get("label");
    if (urlIntent) {
      const paramKey = `${urlIntent}___${urlLabel || ""}`;
      if (processedParamRef.current !== paramKey) {
        processedParamRef.current = paramKey;
        handleUserSelect(urlIntent, urlLabel || undefined);
      }
    }
  }, [searchParams]);

  // Add to Cart handler with feedback
  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} কার্টে যোগ করা হয়েছে!`, {
      action: {
        label: "কার্ট দেখুন",
        onClick: () => navigate("/cart"),
      },
    });
  };

  // Filtered FAQs for Question Search Modal
  const allFilteredFaqs = faqs.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.questionBn.toLowerCase().includes(term) ||
      f.questionEn.toLowerCase().includes(term) ||
      f.answerBn.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans pb-16 md:pb-0">
      {/* 1. Header Bar with Brand Avatar, Status & Controls */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="হোমে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-2.5">
            <SigmaAILogo className="w-9 h-9 sm:w-10 sm:h-10" />

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base bg-gradient-to-r from-slate-900 via-cyan-800 to-orange-600 dark:from-white dark:via-cyan-300 dark:to-orange-400 bg-clip-text text-transparent leading-none">
                  Sigma AI
                </h1>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-black border-cyan-300 dark:border-cyan-700/60 text-cyan-600 dark:text-cyan-400 bg-cyan-50/80 dark:bg-cyan-950/40 uppercase tracking-wide">
                  Smart AI
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Durtup.shop অফিসিয়াল শপিং ও সাপোর্ট অ্যাসিস্ট্যান্ট
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Start Over Button */}
          <button
            type="button"
            onClick={handleStartOver}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            title="নতুন করে শুরু করুন"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">রিস্টার্ট</span>
          </button>
        </div>
      </header>

      {/* 2. Main Conversation Feed Stream */}
      <main
        ref={messagesContainerRef}
        className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-5 space-y-4 overflow-y-auto"
      >
        {messages.map((msg, index) => {
          const isBot = msg.sender === "bot";

          return (
            <div
              key={msg.id || index}
              className={cn(
                "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300",
                isBot ? "items-start" : "items-end"
              )}
            >
              {/* Message Bubble Container */}
              <div
                className={cn(
                  "max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 shadow-2xs text-xs sm:text-sm leading-relaxed",
                  isBot
                    ? "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs"
                    : "bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium rounded-tr-xs shadow-md"
                )}
              >
                {/* Formatted Text Content */}
                {isBot ? (
                  <FormattedBotText text={msg.text} />
                ) : (
                  <div className="whitespace-pre-line">{msg.text}</div>
                )}

                {/* Embedded Live Product Recommendations */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {msg.products.map(({ product, matchReasons }, pIdx) => {
                      const img = getSmartProductImage(product.name, product.image);
                      return (
                        <div
                          key={`prod-${product.id}-${pIdx}`}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md transition-all"
                        >
                          <div className="flex gap-2.5">
                            <img
                              src={img}
                              alt={product.name}
                              className="w-16 h-16 object-contain bg-white dark:bg-slate-900 rounded-lg p-1 border shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-xs line-clamp-2 text-slate-900 dark:text-slate-100">
                                {product.name}
                              </h4>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="font-black text-orange-600 text-sm">
                                  ৳{Number(product.price).toLocaleString("en-BD")}
                                </span>
                                {product.originalPrice && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    ৳{Number(product.originalPrice).toLocaleString("en-BD")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Match Reasons */}
                          {matchReasons && matchReasons.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-0.5">
                              {matchReasons.map((r, rIdx) => (
                                <div key={rIdx} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Product Card Actions */}
                          <div className="flex gap-1.5 mt-2.5 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-[11px] font-semibold"
                              asChild
                            >
                              <Link to={`/product/${product.slug || product.id}`}>
                                বিস্তারিত দেখুন
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-[11px] font-bold bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={(e) => handleAddToCart(product, e)}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> কার্টে নিন
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Embedded Product Comparison Card */}
                {msg.comparison && (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-900 p-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b">
                      <div>বৈশিষ্ট্য</div>
                      <div className="text-center font-extrabold text-orange-600 truncate">{msg.comparison.productA.name.slice(0, 14)}..</div>
                      <div className="text-center font-extrabold text-blue-600 truncate">{msg.comparison.productB.name.slice(0, 14)}..</div>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 text-[10px] sm:text-xs">
                      {msg.comparison.features.map((feat, fIdx) => (
                        <div key={fIdx} className="grid grid-cols-3 p-2 items-center">
                          <div className="font-medium text-slate-500">{feat.name}</div>
                          <div className={cn("text-center font-bold", feat.highlight === "A" && "text-emerald-600 font-extrabold")}>{feat.valueA}</div>
                          <div className={cn("text-center font-bold", feat.highlight === "B" && "text-emerald-600 font-extrabold")}>{feat.valueB}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Live Order Tracking Card */}
                {msg.order && (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">অর্ডার নম্বর</span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">#{msg.order.orderNumber}</h4>
                      </div>
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black border", msg.order.statusColor)}>
                        {msg.order.statusTextBn}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">অর্ডারের তারিখ:</span>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{msg.order.createdAt}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">মোট মূল্য:</span>
                        <div className="font-bold text-orange-600">৳{Number(msg.order.totalAmount).toLocaleString("en-BD")}</div>
                      </div>
                    </div>

                    {msg.order.items && msg.order.items.length > 0 && (
                      <div className="pt-1.5 border-t text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">আইটেম: </span>
                        {msg.order.items.map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Attached to Answer */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {msg.actions.map((act, aIdx) => {
                      if (act.type === "callback") {
                        return (
                          <Button
                            key={aIdx}
                            size="sm"
                            variant={act.variant || "default"}
                            className={cn(
                              "h-8 text-xs font-bold rounded-xl",
                              act.variant === "default" && "bg-orange-600 hover:bg-orange-700 text-white"
                            )}
                            onClick={() => {
                              if (act.payload === "open_report_dialog") {
                                setIsReportModalOpen(true);
                              }
                            }}
                          >
                            {act.label}
                          </Button>
                        );
                      }

                      if (act.type === "intent") {
                        return (
                          <Button
                            key={aIdx}
                            size="sm"
                            variant={act.variant || "default"}
                            className={cn(
                              "h-8 text-xs font-bold rounded-xl",
                              act.variant === "default" && "bg-orange-600 hover:bg-orange-700 text-white"
                            )}
                            onClick={() => handleUserSelect(act.payload, act.label)}
                          >
                            {act.label}
                          </Button>
                        );
                      }

                      return (
                        <Button
                          key={aIdx}
                          size="sm"
                          variant={act.variant || "default"}
                          className={cn(
                            "h-8 text-xs font-bold rounded-xl",
                            act.variant === "default" && "bg-orange-600 hover:bg-orange-700 text-white"
                          )}
                          asChild
                        >
                          {act.payload.startsWith("http") ? (
                            <a href={act.payload} target="_blank" rel="noopener noreferrer">
                              {act.label} <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          ) : (
                            <Link to={act.payload}>
                              {act.label}
                            </Link>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>

              {/* Context-Aware Follow-Up Question Chips Underneath Bot Answer */}
              {isBot && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                <div className="mt-2.5 max-w-[95%] sm:max-w-[90%] space-y-1.5 pl-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>সম্পর্কিত বিষয় বা প্রশ্ন:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {msg.followUpQuestions.map((q, qIdx) => (
                      <button
                        key={`fu-${qIdx}`}
                        type="button"
                        onClick={() => handleUserSelect(q.intentOrQuery, q.label)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-200 transition-all shadow-2xs hover:shadow-xs active:scale-95 flex items-center gap-1.5 text-left"
                      >
                        <span>{q.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Processing / Loading indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border rounded-2xl w-max shadow-2xs text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
            <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-300">তথ্য যাচাই করা হচ্ছে...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* 3. Bottom Guided Category Navigation Bar (Zero Text Input) */}
      <footer className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-2.5 sm:p-3.5 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Category Chips Scroll Area */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {FAQ_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-2xs",
                    isSelected
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.nameBn.replace(/^[^\s]+\s*/, "")}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Clickable Questions in Active Category */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {faqs
              .filter((f) => (selectedCategory === "popular" ? f.category === "popular" : f.category === selectedCategory))
              .slice(0, 6)
              .map((faq) => (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() => handleUserSelect(faq.id, faq.questionBn)}
                  className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 text-orange-900 dark:text-orange-200 text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
                  <span className="truncate max-w-[200px]">{faq.questionBn}</span>
                </button>
              ))}
          </div>
        </div>
      </footer>

      {/* 4. Predefined Approved Questions Search Modal */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  অনুমোদিত সকল প্রশ্ন ও বিষয়
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  যেকোনো বিষয়ে ক্লিক করে তাৎক্ষণিক সঠিক উত্তর ও লাইভ ডেটা দেখুন
                </p>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
              <input
                type="text"
                placeholder="প্রশ্ন বা বিষয় খুঁজুন (যেমন: ডেলিভারি, ক্যাশ অন ডেলিভারি, রিটার্ন)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-orange-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </DialogHeader>

          {/* List of Categorized Questions in Modal */}
          <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
            {FAQ_CATEGORIES.map((cat) => {
              const catFaqs = allFilteredFaqs.filter((f) => f.category === cat.id);
              if (catFaqs.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    <span className="text-sm">{cat.icon}</span>
                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">{cat.nameBn}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">({catFaqs.length})</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {catFaqs.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setIsSearchModalOpen(false);
                          handleUserSelect(q.id, q.questionBn);
                        }}
                        className="text-left px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-slate-800 hover:border-orange-300 transition-all flex items-center justify-between gap-2 group cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600">
                          {q.questionBn}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-orange-600" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {allFilteredFaqs.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                কোনো প্রশ্ন পাওয়া যায়নি। অন্য শব্দ দিয়ে সার্চ করুন।
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Customer Issue & Report Submission Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              সমস্যা বা অভিযোগ রিপোর্ট জমা দিন
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label htmlFor="report-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="report-phone"
                placeholder="01XXXXXXXXX"
                value={reportPhone}
                onChange={(e) => setReportPhone(e.target.value)}
                className="h-10 text-xs rounded-xl"
                required
              />
              <p className="text-[10px] text-slate-500">আপনার সাথে যোগাযোগের জন্য একটি সক্রিয় ১১ ডিজিটের নম্বর দিন।</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="report-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                আপনার নাম (ঐচ্ছিক)
              </Label>
              <Input
                id="report-name"
                placeholder="আপনার পূর্ণ নাম"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  সমস্যার ধরন <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="পণ্য সংক্রান্ত সমস্যা">📦 পণ্য সংক্রান্ত সমস্যা</option>
                  <option value="ডেলিভারি বিলম্ব">🚚 ডেলিভারি বিলম্ব / ট্র্যাক</option>
                  <option value="পেমেন্ট বা রিফান্ড">💳 পেমেন্ট বা রিফান্ড</option>
                  <option value="অর্ডার বাতিল বা পরিবর্তন">🔄 অর্ডার বাতিল / পরিবর্তন</option>
                  <option value="অন্যান্য অভিযোগ">📝 অন্যান্য অভিযোগ</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="report-order" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  অর্ডার নং (যদি থাকে)
                </Label>
                <Input
                  id="report-order"
                  placeholder="#ORD-..."
                  value={reportOrderNo}
                  onChange={(e) => setReportOrderNo(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="report-details" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                সমস্যা বা অভিযোগের বিবরণ <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="report-details"
                placeholder="আপনার সমস্যাটির বিস্তারিত বিবরণ লিখুন..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="min-h-[85px] text-xs rounded-xl resize-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReportModalOpen(false)}
                className="h-9 text-xs rounded-xl"
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingReport}
                className="h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isSubmittingReport ? "জমা হচ্ছে..." : "রিপোর্ট জমা দিন"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
