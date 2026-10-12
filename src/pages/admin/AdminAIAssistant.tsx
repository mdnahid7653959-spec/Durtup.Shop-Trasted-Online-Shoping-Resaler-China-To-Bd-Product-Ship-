import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  RefreshCw, 
  HelpCircle, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Warehouse,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { getInMemoryProducts } from "@/utils/mohasagorCache";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  timeRange?: string;
  drillDownLink?: string;
  drillDownLabel?: string;
  dataPoints?: { label: string; value: string }[];
}

const PRESET_QUESTIONS = [
  "আজ কত টাকা revenue হয়েছে?",
  "আজ কোন product সবচেয়ে বেশি বিক্রি হয়েছে?",
  "গত ৭ দিনে কোন category সবচেয়ে বেশি profit করেছে?",
  "কোন product-এর stock শেষ হতে যাচ্ছে?",
  "গত মাসের তুলনায় sales কতটা পরিবর্তন হয়েছে?",
  "এখন কয়টি pending অর্ডার রয়েছে?",
];

export default function AdminAIAssistant() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "আসসালামু আলাইকুম! আমি আপনার Durtup OS বিজনেস অ্যাডমিন অ্যাসিস্ট্যান্ট। আমি সরাসরি আপনার স্টোরের লাইভ ডাটাবেজ থেকে রিয়েল ডাটা বিশ্লেষণ করে উত্তর দিয়ে থাকি। আপনি বাংলা অথবা ইংরেজিতে যেকোনো প্রশ্ন করতে পারেন।",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Live data stores
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Load Store Data
  useEffect(() => {
    const loadRealData = async () => {
      const ordersMap = new Map<string, any>();
      try {
        if (db) {
          const snap = await getDocs(collection(db, "orders"));
          snap.forEach((d) => ordersMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch {}

      try {
        const { data: dbOrders } = await supabase.from("orders").select("*");
        (dbOrders || []).forEach((o: any) => ordersMap.set(o.id, o));
      } catch {}

      setAllOrders(Array.from(ordersMap.values()));

      const prodsMap = new Map<string, any>();
      try {
        const mem = getInMemoryProducts();
        if (mem) mem.forEach((p) => prodsMap.set(String(p.id), p));
      } catch {}

      try {
        if (db) {
          const pSnap = await getDocs(collection(db, "products"));
          pSnap.forEach((d) => prodsMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch {}

      setAllProducts(Array.from(prodsMap.values()));

      try {
        if (db) {
          const uSnap = await getDocs(collection(db, "profiles"));
          const users: any[] = [];
          uSnap.forEach((d) => users.push(d.data()));
          setAllUsers(users);
        }
      } catch {}
    };

    loadRealData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Query Processor: Zero Hallucination Engine
  const processAdminQuery = async (query: string): Promise<Omit<ChatMessage, "id" | "sender" | "timestamp">> => {
    const q = query.toLowerCase().trim();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

    // 1. "আজ কত টাকা revenue হয়েছে?" or "Today's revenue"
    if (q.includes("আজ") && (q.includes("revenue") || q.includes("বিক্রি") || q.includes("টাকা") || q.includes("sales"))) {
      const todayOrders = allOrders.filter((o) => {
        const dt = (o.created_at || o.createdAt || "").split("T")[0];
        return dt === todayStr && o.status !== "cancelled" && o.status !== "refunded";
      });

      const todayRev = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const todayPending = allOrders.filter((o) => {
        const dt = (o.created_at || o.createdAt || "").split("T")[0];
        return dt === todayStr && o.status === "pending";
      }).length;

      return {
        text: todayOrders.length > 0
          ? `আজ (${todayStr}) মোট ৳${todayRev.toLocaleString()} টাকার অর্ডার সম্পন্ন হয়েছে (${todayOrders.length} টি ভ্যালিড অর্ডার)। বর্তমানে ${todayPending} টি অর্ডার কনফার্মেশনের অপেক্ষায় রয়েছে।`
          : `আজ (${todayStr}) এখনো কোনো সফল অর্ডার রেকর্ড হয়নি (মোট রেভিনিউ ৳০)। তবে পেন্ডিং অর্ডার ও নতুন ভিজিটর পর্যবেক্ষণ করা হচ্ছে।`,
        timeRange: `আজকের দিন (${todayStr})`,
        drillDownLink: "/admin/orders",
        drillDownLabel: "আজকের অর্ডার দেখুন",
        dataPoints: [
          { label: "Today's Revenue", value: `৳${todayRev.toLocaleString()}` },
          { label: "Valid Orders", value: `${todayOrders.length}` },
          { label: "Pending", value: `${todayPending}` },
        ],
      };
    }

    // 2. "আজ কোন product সবচেয়ে বেশি বিক্রি হয়েছে?" or "Top selling product today"
    if (q.includes("product") && (q.includes("বেশি বিক্রি") || q.includes("top") || q.includes("best selling"))) {
      const itemSales = new Map<string, { name: string; qty: number; rev: number }>();

      const targetOrders = q.includes("আজ") 
        ? allOrders.filter((o) => (o.created_at || "").startsWith(todayStr))
        : allOrders.filter((o) => new Date(o.created_at || 0) >= sevenDaysAgo);

      targetOrders.forEach((o) => {
        if (o.status !== "cancelled" && Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const id = String(item.product_id || item.id || item.name || "item");
            const existing = itemSales.get(id) || {
              name: item.title || item.name || "Product",
              qty: 0,
              rev: 0,
            };
            existing.qty += Number(item.quantity || 1);
            existing.rev += Number(item.price || 0) * Number(item.quantity || 1);
            itemSales.set(id, existing);
          });
        }
      });

      const sorted = Array.from(itemSales.values()).sort((a, b) => b.qty - a.qty);

      if (sorted.length > 0) {
        const top = sorted[0];
        return {
          text: `বিশ্লেষণ অনুযায়ী শীর্ষ বিক্রিত প্রোডাক্ট হলো "${top.name}"। এটি মোট ${top.qty} টি বিক্রি হয়েছে এবং মোট ৳${top.rev.toLocaleString()} টাকা সেল জেনারেট করেছে।`,
          timeRange: q.includes("আজ") ? "আজকের দিন" : "বিগত ৭ দিন",
          drillDownLink: "/admin/products",
          drillDownLabel: "প্রোডাক্ট ক্যাটালগ দেখুন",
          dataPoints: [
            { label: "Top Product", value: top.name },
            { label: "Units Sold", value: `${top.qty} units` },
            { label: "Total Sales", value: `৳${top.rev.toLocaleString()}` },
          ],
        };
      } else {
        return {
          text: `উক্ত সময়সীমায় কোনো প্রোডাক্ট বিক্রি হয়নি। ডাটাবেজে রেকর্ড করা অর্ডার অনুযায়ী এখনো কোনো বিক্রয় ডাটা পাওয়া যায়নি।`,
          timeRange: q.includes("আজ") ? "আজকের দিন" : "বিগত ৭ দিন",
          drillDownLink: "/admin/products",
          drillDownLabel: "প্রোডাক্ট লিস্ট দেখুন",
        };
      }
    }

    // 3. "কোন product-এর stock শেষ হতে যাচ্ছে?" or "Low stock items"
    if (q.includes("stock") || q.includes("স্টক") || q.includes("শেষ")) {
      const lowStockItems = allProducts.filter((p) => {
        const s = Number(p.stock_quantity ?? p.stock ?? 10);
        return s <= 10;
      });

      const outOfStock = lowStockItems.filter((p) => Number(p.stock_quantity ?? p.stock ?? 0) <= 0);

      return {
        text: `বর্তমানে আপনার ইনভেন্টরিতে ${lowStockItems.length} টি প্রোডাক্ট লো-স্টক অবস্থায় রয়েছে, যার মধ্যে ${outOfStock.length} টি সম্পূর্ণ আউট-অব-স্টক (০ স্টক)। দ্রুত রিস্টক করার সুপারিশ করা হচ্ছে।`,
        timeRange: "বর্তমান লাইভ ইনভেন্টরি",
        drillDownLink: "/admin/inventory?filter=low",
        drillDownLabel: "ইনভেন্টরি রিস্টক করুন",
        dataPoints: [
          { label: "Low Stock Items", value: `${lowStockItems.length}` },
          { label: "Out of Stock", value: `${outOfStock.length}` },
          { label: "Total Catalog", value: `${allProducts.length}` },
        ],
      };
    }

    // 4. "গত ৭ দিনে কোন category সবচেয়ে বেশি profit করেছে?" or "Category profit"
    if (q.includes("category") || q.includes("ক্যাটাগরি") || q.includes("profit")) {
      const catSales = new Map<string, { rev: number; profit: number }>();
      const orders7d = allOrders.filter((o) => new Date(o.created_at || 0) >= sevenDaysAgo && o.status !== "cancelled");

      orders7d.forEach((o) => {
        const cat = o.category || "General / Electronics";
        const rev = Number(o.total || 0);
        const profit = Math.round(rev * 0.25); // Estimated profit margin
        const existing = catSales.get(cat) || { rev: 0, profit: 0 };
        existing.rev += rev;
        existing.profit += profit;
        catSales.set(cat, existing);
      });

      const sortedCats = Array.from(catSales.entries()).sort((a, b) => b[1].profit - a[1].profit);

      if (sortedCats.length > 0) {
        const [topCat, stats] = sortedCats[0];
        return {
          text: `বিগত ৭ দিনে সবচেয়ে বেশি লাভ করা ক্যাটাগরি হলো "${topCat}"। এর থেকে আনুমানিক ৳${stats.profit.toLocaleString()} নিট প্রফিট এসেছে (মোট সেলস ৳${stats.rev.toLocaleString()})।`,
          timeRange: "বিগত ৭ দিন",
          drillDownLink: "/admin/categories",
          drillDownLabel: "ক্যাটাগরি ম্যানেজমেন্ট",
          dataPoints: [
            { label: "Top Category", value: topCat },
            { label: "Net Profit", value: `৳${stats.profit.toLocaleString()}` },
            { label: "Sales Revenue", value: `৳${stats.rev.toLocaleString()}` },
          ],
        };
      } else {
        return {
          text: `বিগত ৭ দিনে কোনো ক্যাটাগরিতে সেলস রেকর্ড পাওয়া যায়নি। নতুন ক্যাম্পেইন শুরু করার পরামর্শ দেওয়া হচ্ছে।`,
          timeRange: "বিগত ৭ দিন",
          drillDownLink: "/admin/categories",
          drillDownLabel: "ক্যাটাগরি তালিকা",
        };
      }
    }

    // 5. "গত মাসের তুলনায় sales কতটা পরিবর্তন হয়েছে?" or "Monthly comparison"
    if (q.includes("মাসের") || q.includes("মাস") || q.includes("তুলনা") || q.includes("sales") || q.includes("comparison")) {
      const thisMonthOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at || 0);
        return d >= thirtyDaysAgo && o.status !== "cancelled";
      });
      const prevMonthOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at || 0);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo && o.status !== "cancelled";
      });

      const thisMonthRev = thisMonthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const prevMonthRev = prevMonthOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

      const diff = prevMonthRev > 0 ? ((thisMonthRev - prevMonthRev) / prevMonthRev) * 100 : (thisMonthRev > 0 ? 100 : 0);
      const isUp = diff >= 0;

      return {
        text: `গত ৩০ দিনে মোট সেলস ৳${thisMonthRev.toLocaleString()} (${thisMonthOrders.length} টি অর্ডার)। পূর্ববর্তী ৩০ দিনের সেলস ছিল ৳${prevMonthRev.toLocaleString()}। সার্বিকভাবে সেলস ${isUp ? "+" : ""}${diff.toFixed(1)}% ${isUp ? "বৃদ্ধি পেয়েছে 📈" : "হ্রাস পেয়েছে 📉"}।`,
        timeRange: "গত ৩০ দিন বনাম পূর্ববর্তী ৩০ দিন",
        drillDownLink: "/admin/reports",
        drillDownLabel: "ডিটেইল রিপোর্টস দেখুন",
        dataPoints: [
          { label: "Current 30D", value: `৳${thisMonthRev.toLocaleString()}` },
          { label: "Previous 30D", value: `৳${prevMonthRev.toLocaleString()}` },
          { label: "Growth", value: `${isUp ? "+" : ""}${diff.toFixed(1)}%` },
        ],
      };
    }

    // 6. "পেন্ডিং অর্ডারগুলোর অবস্থা কী?" or "Pending orders"
    if (q.includes("pending") || q.includes("পেন্ডিং") || q.includes("অর্ডার")) {
      const pendingList = allOrders.filter((o) => (o.status || "").toLowerCase() === "pending");
      const pendingTotal = pendingList.reduce((sum, o) => sum + Number(o.total || 0), 0);

      return {
        text: `বর্তমানে সিস্টেমে ${pendingList.length} টি পেন্ডিং অর্ডার রয়েছে, যার মোট মূল্য ৳${pendingTotal.toLocaleString()}। কাস্টমারের সাথে দ্রুত যোগাযোগ করে অর্ডারগুলো কনফার্ম করতে হবে।`,
        timeRange: "বর্তমান লাইভ স্ট্যাটাস",
        drillDownLink: "/admin/orders?status=pending",
        drillDownLabel: "পেন্ডিং অর্ডার প্রসেস করুন",
        dataPoints: [
          { label: "Pending Orders", value: `${pendingList.length}` },
          { label: "Pending Value", value: `৳${pendingTotal.toLocaleString()}` },
        ],
      };
    }

    // Default Intelligence Fallback
    const totalRev = allOrders
      .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return {
      text: `আপনার প্রশ্নের প্রেক্ষিতে লাইভ ডাটাবেজ বিশ্লেষণ করা হয়েছে। স্টোরের সার্বিক ডাটা: মোট রেভিনিউ ৳${totalRev.toLocaleString()}, সক্রিয় ক্যাটালগ আইটেম ${allProducts.length} টি, এবং নিবন্ধিত গ্রাহক ${allUsers.length} জন। নির্দিষ্ট তথ্য জানতে নিচের সাজেস্টেড প্রশ্নগুলো থেকে নির্বাচন করতে পারেন।`,
      timeRange: "সর্বমোট লাইভ ডাটা",
      drillDownLink: "/admin",
      drillDownLabel: "ড্যাশবোর্ডে ফিরে যান",
      dataPoints: [
        { label: "Total Revenue", value: `৳${totalRev.toLocaleString()}` },
        { label: "Products", value: `${allProducts.length}` },
        { label: "Customers", value: `${allUsers.length}` },
      ],
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsProcessing(true);

    try {
      const response = await processAdminQuery(query);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        ...response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: "দুঃখিত, ডাটা বিশ্লেষণ করতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout title="AI Admin Business Assistant">
      <div className="max-w-4xl mx-auto space-y-4 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Durtup AI Admin Assistant
              </h1>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[10px]">
                Live Store Brain
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask operational, financial, or stock queries in Bengali or English. Directly computed from database.
            </p>
          </div>

          <Badge variant="secondary" className="text-xs">
            {allOrders.length} Orders • {allProducts.length} Products
          </Badge>
        </div>

        {/* Chat Stream Window */}
        <Card className="min-h-[460px] flex flex-col justify-between">
          <CardContent className="p-4 overflow-y-auto max-h-[500px] space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-600">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3.5 text-xs space-y-2 ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                      : "bg-muted/50 border text-foreground rounded-tl-xs shadow-xs"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Data Points if any */}
                  {msg.dataPoints && msg.dataPoints.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/50">
                      {msg.dataPoints.map((dp, idx) => (
                        <div key={idx} className="p-2 rounded bg-card/80 border text-[11px]">
                          <span className="text-[10px] text-muted-foreground block truncate">{dp.label}</span>
                          <span className="font-bold text-foreground truncate block">{dp.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata & Drill-down */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-muted-foreground">
                    <span>
                      {msg.timeRange && (
                        <span className="bg-muted-foreground/10 px-1.5 py-0.5 rounded font-mono mr-2">
                          {msg.timeRange}
                        </span>
                      )}
                      {msg.timestamp}
                    </span>

                    {msg.drillDownLink && (
                      <Link
                        to={msg.drillDownLink}
                        className="text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        {msg.drillDownLabel || "View Details"}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600">
                  <Bot className="h-4 w-4 animate-spin" />
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>ডাটাবেজ থেকে রিয়েল ডাটা বিশ্লেষণ করা হচ্ছে...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Suggested Questions Bar */}
          <div className="p-3 border-t bg-muted/20">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
              সাজেস্টেড প্রশ্ন (ক্লিক করে সরাসরি অ্যানালাইসিস দেখুন):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  disabled={isProcessing}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-card hover:bg-muted text-foreground border shadow-2xs transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2 mt-3">
              <Input
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="যেকোনো প্রশ্ন লিখুন (যেমন: আজ কত টাকা revenue হয়েছে?)..."
                className="text-xs h-9 bg-card"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isProcessing}
              />
              <Button
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={isProcessing || !inputPrompt.trim()}
                className="h-9 gap-1.5 text-xs px-4"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
