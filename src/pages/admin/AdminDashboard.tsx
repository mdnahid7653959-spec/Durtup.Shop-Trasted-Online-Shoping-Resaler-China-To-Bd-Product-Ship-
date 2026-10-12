import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  Percent,
  Warehouse,
  Truck,
  Eye,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  Store,
  Layers,
  Tag,
  CreditCard,
  MessageSquare,
  Gift,
  HelpCircle,
  Calendar,
  Filter
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { getInMemoryProducts } from "@/utils/mohasagorCache";
import { useToast } from "@/hooks/use-toast";
import { isMockOrder, purgeMockOrdersFromStorage } from "@/utils/orderValidation";

export type DateRangePreset = "today" | "7days" | "30days" | "custom";

interface RawOrder {
  id: string;
  order_number: string;
  total: number;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  items: any[];
}

interface OrderMetrics {
  totalRevenue: number;
  grossRevenue: number;
  totalDiscount: number;
  totalShipping: number;
  totalPaymentFees: number;
  totalSupplierCost: number;
  refundLoss: number;
  actualProfit: number;
  orderCount: number;
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  returnedCount: number;
  refundedCount: number;
  avgOrderValue: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<DateRangePreset>("7days");
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Raw data from Firestore/DB
  const [allOrders, setAllOrders] = useState<RawOrder[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalSellersCount, setTotalSellersCount] = useState<number>(0);
  const [sellersList, setSellersList] = useState<any[]>([]);

  // Main data fetcher
  const loadDashboardData = useCallback(async () => {
    try {
      setFetchError(null);
      
      // 1. Fetch Orders from Firestore and Supabase
      purgeMockOrdersFromStorage();
      const ordersMap = new Map<string, RawOrder>();

      try {
        if (db) {
          const snap = await getDocs(collection(db, "orders"));
          snap.forEach((d) => {
            const data = d.data();
            if (!isMockOrder(data) && !isMockOrder({ id: d.id, ...data })) {
              const orderNum = data.order_number || data.orderNumber || d.id;
              ordersMap.set(orderNum, {
                id: d.id,
                order_number: orderNum,
                total: Number(data.total || data.total_amount || 0),
                subtotal: Number(data.subtotal || data.total || 0),
                discount_amount: Number(data.discount_amount || data.discount || 0),
                shipping_cost: Number(data.shipping_cost || 0),
                status: (data.status || "pending").toLowerCase(),
                payment_status: (data.payment_status || "pending").toLowerCase(),
                payment_method: data.payment_method || "cod",
                customer_name: data.customer_name || data.shipping_address?.firstName 
                  ? `${data.shipping_address?.firstName || ""} ${data.shipping_address?.lastName || ""}`.trim()
                  : "Customer",
                customer_phone: data.customer_phone || data.shipping_address?.phone || "",
                created_at: data.created_at || data.createdAt || new Date().toISOString(),
                items: Array.isArray(data.items) ? data.items : [],
              });
            }
          });
        }
      } catch (e) {
        console.warn("Firestore orders fetch:", e);
      }

      try {
        const { data: dbOrders } = await supabase.from("orders").select("*");
        if (dbOrders) {
          dbOrders.forEach((o: any) => {
            if (!isMockOrder(o)) {
              const orderNum = o.order_number || o.id;
              if (!ordersMap.has(orderNum)) {
                ordersMap.set(orderNum, {
                  id: o.id,
                  order_number: orderNum,
                  total: Number(o.total || 0),
                  subtotal: Number(o.subtotal || o.total || 0),
                  discount_amount: Number(o.discount_amount || 0),
                  shipping_cost: Number(o.shipping_cost || 0),
                  status: (o.status || "pending").toLowerCase(),
                  payment_status: (o.payment_status || "pending").toLowerCase(),
                  payment_method: o.payment_method || "cod",
                  customer_name: o.customer_name || "Customer",
                  customer_phone: o.customer_phone || "",
                  created_at: o.created_at || new Date().toISOString(),
                  items: Array.isArray(o.items) ? o.items : [],
                });
              }
            }
          });
        }
      } catch (e) {}

      // Supplement from local_orders if present
      try {
        const rawLocal = localStorage.getItem("local_orders");
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            parsed.forEach((o: any) => {
              if (!isMockOrder(o)) {
                const orderNum = o.order_number || o.id;
                if (!ordersMap.has(orderNum)) {
                  ordersMap.set(orderNum, {
                    id: o.id || orderNum,
                    order_number: orderNum,
                    total: Number(o.total || 0),
                    subtotal: Number(o.subtotal || o.total || 0),
                    discount_amount: Number(o.discount_amount || 0),
                    shipping_cost: Number(o.shipping_cost || 0),
                    status: (o.status || "pending").toLowerCase(),
                    payment_status: (o.payment_status || "pending").toLowerCase(),
                    payment_method: o.payment_method || "cod",
                    customer_name: o.customer_name || "Customer",
                    customer_phone: o.customer_phone || "",
                    created_at: o.created_at || new Date().toISOString(),
                    items: Array.isArray(o.items) ? o.items : [],
                  });
                }
              }
            });
          }
        }
      } catch (e) {}

      setAllOrders(Array.from(ordersMap.values()));

      // 2. Fetch Catalog Products
      const prodsMap = new Map<string, any>();
      try {
        const mem = getInMemoryProducts();
        if (mem) {
          mem.forEach((p: any) => {
            prodsMap.set(String(p.id), p);
          });
        }
      } catch (e) {}

      try {
        if (db) {
          const pSnap = await getDocs(collection(db, "products"));
          pSnap.forEach((d) => {
            const data = d.data();
            prodsMap.set(d.id, { id: d.id, ...data });
          });
        }
      } catch (e) {}

      try {
        const { data: dbProducts } = await supabase.from("products").select("*");
        (dbProducts || []).forEach((p: any) => {
          if (!prodsMap.has(String(p.id))) {
            prodsMap.set(String(p.id), p);
          }
        });
      } catch (e) {}

      setAllProducts(Array.from(prodsMap.values()));

      // 3. Fetch Registered Customers Count
      try {
        if (db) {
          const uSnap = await getDocs(collection(db, "profiles"));
          setTotalUsersCount(uSnap.size);
        } else {
          const { count } = await supabase.from("profiles").select("*", { count: "exact" });
          setTotalUsersCount(count || 0);
        }
      } catch (e) {
        setTotalUsersCount(0);
      }

      // 4. Fetch Sellers
      try {
        if (db) {
          const sSnap = await getDocs(collection(db, "sellers"));
          const sellers: any[] = [];
          sSnap.forEach((d) => {
            sellers.push({ id: d.id, ...d.data() });
          });
          setSellersList(sellers);
          setTotalSellersCount(sellers.length);
        }
      } catch (e) {
        setTotalSellersCount(0);
        setSellersList([]);
      }

    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setFetchError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    toast({
      title: "Dashboard Refreshed",
      description: "Latest business metrics calculated from live database records.",
    });
  };

  // Date Filtering Logic
  const { currentPeriodOrders, previousPeriodOrders, rangeLabel } = useMemo(() => {
    const now = new Date();
    let startCurrent: Date;
    let endCurrent: Date = now;
    let startPrev: Date;
    let endPrev: Date;
    let label = "";

    if (dateRange === "today") {
      startCurrent = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const dayMs = 86400000;
      startPrev = new Date(startCurrent.getTime() - dayMs);
      endPrev = new Date(startCurrent.getTime());
      label = "Today (compared to Yesterday)";
    } else if (dateRange === "7days") {
      startCurrent = new Date(now.getTime() - 7 * 86400000);
      startPrev = new Date(startCurrent.getTime() - 7 * 86400000);
      endPrev = new Date(startCurrent.getTime());
      label = "Last 7 Days (compared to prior 7 days)";
    } else if (dateRange === "30days") {
      startCurrent = new Date(now.getTime() - 30 * 86400000);
      startPrev = new Date(startCurrent.getTime() - 30 * 86400000);
      endPrev = new Date(startCurrent.getTime());
      label = "Last 30 Days (compared to prior 30 days)";
    } else {
      // Custom
      startCurrent = new Date(customStartDate + "T00:00:00");
      endCurrent = new Date(customEndDate + "T23:59:59");
      const diffMs = endCurrent.getTime() - startCurrent.getTime();
      startPrev = new Date(startCurrent.getTime() - diffMs);
      endPrev = new Date(startCurrent.getTime());
      label = `Custom (${customStartDate} to ${customEndDate})`;
    }

    const current = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= startCurrent && d <= endCurrent;
    });

    const previous = allOrders.filter((o) => {
      const d = new Date(o.created_at);
      return d >= startPrev && d < endPrev;
    });

    return { currentPeriodOrders: current, previousPeriodOrders: previous, rangeLabel: label };
  }, [allOrders, dateRange, customStartDate, customEndDate]);

  // Metric Calculation Helper
  const calculateMetrics = (orders: RawOrder[]): OrderMetrics => {
    let totalRevenue = 0;
    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalShipping = 0;
    let totalPaymentFees = 0;
    let totalSupplierCost = 0;
    let refundLoss = 0;

    let pendingCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let returnedCount = 0;
    let refundedCount = 0;

    orders.forEach((o) => {
      const status = (o.status || "pending").toLowerCase();
      const isCancelled = status === "cancelled";
      const isRefunded = status === "refunded";
      const isReturned = status === "returned";

      if (status === "pending") pendingCount++;
      else if (status === "processing") processingCount++;
      else if (status === "shipped") shippedCount++;
      else if (status === "delivered" || status === "completed") deliveredCount++;
      else if (isCancelled) cancelledCount++;
      else if (isReturned) returnedCount++;
      else if (isRefunded) refundedCount++;

      if (isRefunded || isReturned) {
        refundLoss += o.total || 0;
      }

      if (!isCancelled && !isRefunded) {
        totalRevenue += o.total || 0;
        grossRevenue += o.subtotal || o.total || 0;
        totalDiscount += o.discount_amount || 0;
        totalShipping += o.shipping_cost || 0;

        // Payment Gateway Fee calculation:
        // Digital payments (bKash/Nagad/Rocket/SSLCommerz/Card): ~1.85%
        // COD: 0% gateway fee
        const method = (o.payment_method || "").toLowerCase();
        if (method !== "cod" && method !== "cash") {
          totalPaymentFees += (o.total || 0) * 0.0185;
        }

        // Supplier Cost estimation from items or default catalog cost base
        if (Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const cost = Number(item.purchase_price || item.cost || (Number(item.price || 0) * 0.70));
            const qty = Number(item.quantity || 1);
            totalSupplierCost += cost * qty;
          });
        }
      }
    });

    // Actual Profit Formula:
    // Profit = Revenue - Supplier Cost - Delivery Charge (if borne) - Payment Gateway Fees - Return Loss
    const actualProfit = Math.max(
      0,
      totalRevenue - totalSupplierCost - (totalShipping * 0.8) - totalPaymentFees - refundLoss
    );

    const validOrderCount = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded").length;
    const avgOrderValue = validOrderCount > 0 ? Math.round(totalRevenue / validOrderCount) : 0;

    return {
      totalRevenue: Math.round(totalRevenue),
      grossRevenue: Math.round(grossRevenue),
      totalDiscount: Math.round(totalDiscount),
      totalShipping: Math.round(totalShipping),
      totalPaymentFees: Math.round(totalPaymentFees),
      totalSupplierCost: Math.round(totalSupplierCost),
      refundLoss: Math.round(refundLoss),
      actualProfit: Math.round(actualProfit),
      orderCount: orders.length,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      returnedCount,
      refundedCount,
      avgOrderValue,
    };
  };

  const currentMetrics = useMemo(() => calculateMetrics(currentPeriodOrders), [currentPeriodOrders]);
  const prevMetrics = useMemo(() => calculateMetrics(previousPeriodOrders), [previousPeriodOrders]);

  // Inventory Health Metrics
  const inventoryStats = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    let totalValuation = 0;

    allProducts.forEach((p) => {
      const stock = Number(p.stock_quantity ?? p.stock ?? 0);
      const price = Number(p.price || p.regular_price || 0);
      if (stock <= 0) outOfStock++;
      else if (stock <= 10) lowStock++;
      totalValuation += Math.max(0, stock) * price;
    });

    return {
      totalProducts: allProducts.length,
      lowStock,
      outOfStock,
      totalValuation: Math.round(totalValuation),
    };
  }, [allProducts]);

  // Timeseries Chart Data
  const timeseriesData = useMemo(() => {
    const dayMap = new Map<string, { date: string; revenue: number; profit: number; orders: number }>();

    // Generate daily keys
    const sorted = [...currentPeriodOrders].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sorted.forEach((o) => {
      const dayKey = o.created_at.split("T")[0];
      const existing = dayMap.get(dayKey) || { date: dayKey, revenue: 0, profit: 0, orders: 0 };
      existing.orders += 1;
      if (o.status !== "cancelled" && o.status !== "refunded") {
        existing.revenue += o.total || 0;
        // Estimated day profit
        const dayCost = (o.total || 0) * 0.70;
        existing.profit += Math.max(0, (o.total || 0) - dayCost);
      }
      dayMap.set(dayKey, existing);
    });

    if (dayMap.size === 0) {
      // Return 7 empty days if no records exist in period
      const result: { date: string; revenue: number; profit: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        result.push({ date: d.slice(5), revenue: 0, profit: 0, orders: 0 });
      }
      return result;
    }

    return Array.from(dayMap.values()).map((item) => ({
      ...item,
      date: item.date.slice(5), // MM-DD
      revenue: Math.round(item.revenue),
      profit: Math.round(item.profit),
    }));
  }, [currentPeriodOrders]);

  // Top Selling Products in Period
  const topProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty: number; revenue: number }>();

    currentPeriodOrders.forEach((o) => {
      if (o.status !== "cancelled" && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const id = String(item.product_id || item.id || item.name || "prod");
          const existing = map.get(id) || {
            id,
            name: item.title || item.name || "Product",
            qty: 0,
            revenue: 0,
          };
          const q = Number(item.quantity || 1);
          const p = Number(item.price || 0);
          existing.qty += q;
          existing.revenue += p * q;
          map.set(id, existing);
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [currentPeriodOrders]);

  // Order Status Distribution Data
  const orderStatusDistribution = useMemo(() => {
    return [
      { name: "Delivered", value: currentMetrics.deliveredCount, color: "#10b981" },
      { name: "Processing", value: currentMetrics.processingCount, color: "#3b82f6" },
      { name: "Shipped", value: currentMetrics.shippedCount, color: "#8b5cf6" },
      { name: "Pending", value: currentMetrics.pendingCount, color: "#f59e0b" },
      { name: "Cancelled", value: currentMetrics.cancelledCount, color: "#ef4444" },
      { name: "Returned", value: currentMetrics.returnedCount, color: "#ec4899" },
    ].filter((item) => item.value > 0);
  }, [currentMetrics]);

  // Percentage Change Helper
  const getPctChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? "+100%" : "0%";
    const diff = ((current - prev) / prev) * 100;
    return `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`;
  };

  const isPositive = (current: number, prev: number) => current >= prev;

  return (
    <AdminLayout title="Business Control Center">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header & Date Range Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Operating System Dashboard
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                Real-Time
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rangeLabel} • Derived directly from live store transactions & inventory
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Range Presets */}
            <div className="flex items-center bg-muted/70 p-1 rounded-lg border">
              {(["today", "7days", "30days", "custom"] as DateRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDateRange(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    dateRange === preset
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset === "today" ? "Today" : preset === "7days" ? "7 Days" : preset === "30days" ? "30 Days" : "Custom"}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {dateRange === "custom" && (
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 text-xs w-32 bg-card"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 text-xs w-32 bg-card"
                />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Notification if any */}
        {fetchError && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              <span>{fetchError}</span>
            </div>
            <Button size="sm" variant="destructive" onClick={handleRefresh}>
              Retry Query
            </Button>
          </div>
        )}

        {/* Primary KPI Grid (8 Core Operational Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Sales / Revenue */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-xs group"
            onClick={() => navigate("/admin/orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Total Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    ৳{currentMetrics.totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    <span className={`font-semibold flex items-center gap-0.5 ${
                      isPositive(currentMetrics.totalRevenue, prevMetrics.totalRevenue) 
                        ? "text-emerald-600" 
                        : "text-rose-500"
                    }`}>
                      {isPositive(currentMetrics.totalRevenue, prevMetrics.totalRevenue) ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {getPctChange(currentMetrics.totalRevenue, prevMetrics.totalRevenue)}
                    </span>
                    <span className="text-muted-foreground">vs prev period</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 2. Actual Profit */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-xs group border-emerald-500/30 bg-emerald-500/[0.02]"
            onClick={() => navigate("/admin/finance")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Actual Net Profit</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Real
                </Badge>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{currentMetrics.actualProfit.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Revenue - Costs - Courier - Fees
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 3. Total Orders */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-xs group"
            onClick={() => navigate("/admin/orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Total Orders</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {currentMetrics.orderCount.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    <span className={`font-semibold flex items-center gap-0.5 ${
                      isPositive(currentMetrics.orderCount, prevMetrics.orderCount) 
                        ? "text-emerald-600" 
                        : "text-rose-500"
                    }`}>
                      {isPositive(currentMetrics.orderCount, prevMetrics.orderCount) ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {getPctChange(currentMetrics.orderCount, prevMetrics.orderCount)}
                    </span>
                    <span className="text-muted-foreground">vs prev period</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 4. Average Order Value (AOV) */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-xs group"
            onClick={() => navigate("/admin/reports")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Avg Order Value (AOV)</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Percent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    ৳{currentMetrics.avgOrderValue.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Delivered: {currentMetrics.deliveredCount} orders
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 5. Pending Orders (Action Required) */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-xs ${
              currentMetrics.pendingCount > 0 ? "border-amber-500/40 bg-amber-500/[0.02]" : ""
            }`}
            onClick={() => navigate("/admin/orders?status=pending")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Pending Orders</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {currentMetrics.pendingCount}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                    <span>Needs Confirmation</span>
                    <ArrowRight className="h-3 w-3" />
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 6. Processing & In Fulfillment */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-xs group"
            onClick={() => navigate("/admin/orders?status=processing")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Processing / Shipped</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Truck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {currentMetrics.processingCount + currentMetrics.shippedCount}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {currentMetrics.processingCount} packing • {currentMetrics.shippedCount} on road
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 7. Catalog & Low Stock Alert */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-xs ${
              inventoryStats.lowStock > 0 || inventoryStats.outOfStock > 0 
                ? "border-rose-500/30 bg-rose-500/[0.01]" 
                : ""
            }`}
            onClick={() => navigate("/admin/inventory?filter=low")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Inventory Alerts</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
                <Warehouse className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <span>{inventoryStats.lowStock + inventoryStats.outOfStock}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      / {inventoryStats.totalProducts} items
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                    {inventoryStats.outOfStock} out of stock • {inventoryStats.lowStock} low
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 8. Total Registered Customers */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-xs group"
            onClick={() => navigate("/admin/users")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">Registered Customers</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {totalUsersCount.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {totalSellersCount} verified vendors
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts & Operational Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Profit Trends Chart (2 Columns) */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Revenue & Actual Profit Trend</CardTitle>
                <CardDescription className="text-xs">
                  Daily financial performance for the selected time range
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Revenue (৳)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Profit (৳)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeseriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#revenueGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Net Profit"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#profitGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Lifecycle Breakdown (1 Column) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Fulfillment Status</CardTitle>
              <CardDescription className="text-xs">
                Real lifecycle distribution of period orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : orderStatusDistribution.length === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-center p-4">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-medium text-foreground">No orders in selected range</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Orders placed via website or admin will appear in real-time.
                  </p>
                </div>
              ) : (
                <div className="h-[280px] w-full flex flex-col items-center justify-center">
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {orderStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t text-[11px]">
                    {orderStatusDistribution.map((entry) => (
                      <div key={entry.name} className="flex flex-col items-center text-center">
                        <span className="font-semibold text-foreground">{entry.value}</span>
                        <span className="text-muted-foreground text-[10px]">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections: Recent Orders & Top Selling Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders Table (2 Columns) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Recent Customer Orders</CardTitle>
                <CardDescription className="text-xs">
                  Latest transactions recorded in database
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-primary gap-1"
                onClick={() => navigate("/admin/orders")}
              >
                View All Orders
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : currentPeriodOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">No orders in this period</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try switching date range to "30 Days" or "All Time".
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30 text-muted-foreground">
                        <th className="text-left font-medium py-2.5 px-4">Order #</th>
                        <th className="text-left font-medium py-2.5 px-4">Customer</th>
                        <th className="text-left font-medium py-2.5 px-4">Status</th>
                        <th className="text-left font-medium py-2.5 px-4">Method</th>
                        <th className="text-right font-medium py-2.5 px-4">Total</th>
                        <th className="text-right font-medium py-2.5 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentPeriodOrders.slice(0, 6).map((order) => (
                        <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-foreground">
                            {order.order_number}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-medium text-foreground">{order.customer_name}</div>
                            {order.customer_phone && (
                              <div className="text-[10px] text-muted-foreground">{order.customer_phone}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge 
                              variant="outline" 
                              className={`capitalize text-[10px] font-medium ${
                                order.status === "delivered" 
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : order.status === "processing"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : order.status === "shipped"
                                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                  : order.status === "cancelled"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 uppercase text-[10px] text-muted-foreground">
                            {order.payment_method || "COD"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-foreground">
                            ৳{order.total.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => navigate(`/admin/orders?search=${order.order_number}`)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Products List (1 Column) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Top Products</CardTitle>
                <CardDescription className="text-xs">
                  Highest volume items in period
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-primary gap-1"
                onClick={() => navigate("/admin/products")}
              >
                Catalog
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">No product sales in this period</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Products sold in customer orders will appear ranked by revenue.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, idx) => (
                    <div 
                      key={p.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/products/${p.id}`)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate max-w-[160px]">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.qty} units sold
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        ৳{p.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Operational Command Shortcuts */}
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Quick Operational Workflows
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs justify-start gap-2"
              onClick={() => navigate("/admin/products/new")}
            >
              <Package className="h-3.5 w-3.5 text-primary" />
              Add Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs justify-start gap-2"
              onClick={() => navigate("/admin/pricing")}
            >
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              Pricing Rules
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs justify-start gap-2"
              onClick={() => navigate("/admin/coupons")}
            >
              <Percent className="h-3.5 w-3.5 text-blue-600" />
              Create Coupon
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs justify-start gap-2"
              onClick={() => navigate("/admin/inventory?filter=low")}
            >
              <Warehouse className="h-3.5 w-3.5 text-rose-500" />
              Restock Stock
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs justify-start gap-2"
              onClick={() => navigate("/admin/ai-admin")}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              AI Assistant
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs justify-start gap-2"
              onClick={() => navigate("/admin/audit-logs")}
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Audit Logs
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
