import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCompare } from "@/contexts/CompareContext";
import { useCart } from "@/contexts/CartContext";
import { buildProductComparisonMatrix } from "@/services/productCompareService";
import { SafeProductImage } from "@/components/products/SafeProductImage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSmartBack } from "@/hooks/useSmartBack";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import {
  Scale,
  Trash2,
  X,
  ShoppingCart,
  Zap,
  ArrowLeft,
  Plus,
  Sparkles,
  CheckCircle2,
  Star,
  Check,
  Search,
  ShieldCheck,
  CheckCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Fast demo seed products if user arrives with empty compare list
const DEMO_COMPARE_PRODUCTS = [
  {
    id: "demo-t900",
    name: "T900 Ultra 2 Smartwatch with HD Bluetooth Calling",
    slug: "t900-ultra-2-smartwatch",
    price: 990,
    originalPrice: 1550,
    rating: 4.8,
    reviews: 142,
    sold: 850,
    image: "/products/t900-ultra.webp",
    category: "smartwatch",
    category_name: "Smart Watches",
    stock: 25,
    freeShipping: true,
  },
  {
    id: "demo-t800",
    name: "T800 Pro Max Series 8 Smartwatch Ocean Band",
    slug: "t800-pro-max-smartwatch",
    price: 850,
    originalPrice: 1200,
    rating: 4.6,
    reviews: 98,
    sold: 520,
    image: "/products/t800-pro.webp",
    category: "smartwatch",
    category_name: "Smart Watches",
    stock: 14,
    freeShipping: false,
  },
];

export default function Compare() {
  const navigate = useNavigate();
  const handleSmartBack = useSmartBack();
  const { compareItems, totalCount, maxLimit, removeFromCompare, clearCompare, addToCompare } = useCompare();
  const { addToCart } = useCart();
  const [highlightDifferences, setHighlightDifferences] = useState<boolean>(false);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);

  // Quick product search & add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Matrix generation
  const { groups, summary } = useMemo(() => {
    return buildProductComparisonMatrix(compareItems);
  }, [compareItems]);

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    setAddingCartId(product.id);
    try {
      await addToCart(product, 1);
    } finally {
      setTimeout(() => setAddingCartId(null), 600);
    }
  };

  const handleBuyNow = async (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product, 1);
      navigate("/checkout");
    } catch {}
  };

  const handleLoadDemo = () => {
    DEMO_COMPARE_PRODUCTS.forEach((p) => addToCompare(p as any));
  };

  // Filtered seed products for Quick Add dialog
  const availableQuickProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAST_SEED_PRODUCTS.filter((p) => {
      if (query) {
        const titleMatch = (p.name || "").toLowerCase().includes(query);
        const codeMatch = (p.product_code || "").toLowerCase().includes(query);
        const catMatch = (p.category || "").toLowerCase().includes(query);
        if (!titleMatch && !codeMatch && !catMatch) return false;
      }
      if (selectedCategory !== "all") {
        const cat = (p.category || p.category_name || "").toLowerCase();
        if (!cat.includes(selectedCategory.toLowerCase())) return false;
      }
      return true;
    }).slice(0, 15);
  }, [searchQuery, selectedCategory]);

  const hasEmptySlot = compareItems.length < maxLimit;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-4 sm:py-6 lg:py-8 pb-24 md:pb-12">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4">
          
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSmartBack}
                className="rounded-full w-9 h-9 p-0 shrink-0 shadow-2xs hover:bg-muted"
                title="পেছনে যান"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-black flex items-center gap-2 text-foreground tracking-tight">
                  <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
                  </span>
                  <span>প্রোডাক্ট তুলনা ইঞ্জিন (Comparison)</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  পণ্যগুলোর দাম, স্পেসিফিকেশন ও ফিচারের নির্ভুল ও স্বচ্ছ তুলনা
                </p>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompare}
                  className="text-xs text-muted-foreground hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 h-9 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  সব মুছুন
                </Button>

                {hasEmptySlot && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-xs h-9 font-bold border-orange-500/30 text-orange-600 hover:bg-orange-500/10 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-orange-600" />
                    আরও পণ্য যোগ করুন ({totalCount}/{maxLimit})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Empty State */}
          {totalCount === 0 ? (
            <div className="py-12 sm:py-20 text-center max-w-lg mx-auto bg-card rounded-3xl border border-dashed border-border p-6 sm:p-10 shadow-xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                <Scale className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-lg sm:text-xl font-black mb-2 text-foreground">
                আপনার তুলনা তালিকা খালি
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                যেকোনো প্রোডাক্টের কার্ডে থাকা <strong>Scale (তুলনা)</strong> আইকনে ক্লিক করে সর্বোচ্চ ৪টি প্রোডাক্ট একসাথে পাশাপাশি বিস্তারিত তুলনা করুন।
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={handleLoadDemo}
                  className="w-full sm:w-auto text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  স্মার্টওয়াচ ডেমো তুলনা দেখুন
                </Button>
                <Link to="/products" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full text-xs sm:text-sm font-semibold">
                    সকল পণ্য ব্রাউজ করুন
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              
              {/* Highlight Differences Switch & Counter Banner */}
              <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs px-3 py-1.5 rounded-full border border-orange-500/20">
                    {totalCount} টি পণ্য নির্বাচিত
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                    (সর্বোচ্চ {maxLimit}টি পণ্য পাশাপাশি দেখা যাবে)
                  </span>
                </div>

                <div className="flex items-center gap-2.5 bg-muted/40 border border-border/80 rounded-xl px-3 py-1.5">
                  <Switch
                    id="highlight-diff"
                    checked={highlightDifferences}
                    onCheckedChange={setHighlightDifferences}
                  />
                  <Label
                    htmlFor="highlight-diff"
                    className="text-xs sm:text-sm font-bold cursor-pointer select-none text-foreground flex items-center gap-1.5"
                  >
                    <span>শুধুমাত্র অমিলগুলো হাইলাইট করুন</span>
                    {highlightDifferences && (
                      <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded font-black tracking-wide shadow-2xs">
                        Active
                      </span>
                    )}
                  </Label>
                </div>
              </div>

              {/* Main Comparison Matrix Table */}
              <div className="relative overflow-x-auto border border-border/90 rounded-2xl bg-card shadow-sm scrollbar-thin">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  
                  {/* Sticky Header Row: Product Cards with Perfect Geometric Alignment */}
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-border">
                      
                      {/* Fixed Top-Left Specification Guide Sidebar */}
                      <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 w-[160px] sm:w-[240px] min-w-[160px] sm:min-w-[240px] align-top border-r border-border">
                        <div className="h-full flex flex-col justify-between p-3 sm:p-4 bg-muted/30 dark:bg-slate-800/40 rounded-2xl border border-border/60 min-h-[340px]">
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[11px] mb-2.5">
                              <Layers className="w-3.5 h-3.5" />
                              <span>তুলনা নির্দেশিকা</span>
                            </div>
                            <h3 className="font-black text-sm sm:text-base text-foreground tracking-tight leading-snug">
                              পণ্য স্পেসিফিকেশন ও ফিচার তুলনা
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed hidden sm:block">
                              পণ্যগুলোর দাম, লাইভ স্টক, ওয়ারেন্টি ও ফিচারের পার্থক্য যাচাই করে আপনার জন্য সেরা পণ্যটি বেছে নিন।
                            </p>
                          </div>

                          <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground space-y-1.5 hidden sm:block">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>সেরা মূল্য চিহ্নিতকরণ</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                              <Star className="w-3.5 h-3.5 shrink-0 fill-current" />
                              <span>টপ রেটেড পণ্য নির্দেশিকা</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>অরিজিনাল গ্যারান্টি</span>
                            </div>
                          </div>
                        </div>
                      </th>

                      {/* Product Columns with Aligned Heights */}
                      {compareItems.map((prod, idx) => {
                        const isLowestPrice = prod.id === summary.lowestPriceId && totalCount > 1;
                        const isHighestRated = prod.id === summary.highestRatedId && totalCount > 1;
                        const discountPct =
                          prod.originalPrice && prod.originalPrice > prod.price
                            ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                            : 0;

                        return (
                          <th
                            key={prod.id}
                            className="p-3 sm:p-4 w-[210px] sm:w-[260px] min-w-[210px] sm:min-w-[260px] align-top border-r border-border/60 last:border-r-0"
                          >
                            <div className="bg-card rounded-2xl border border-border/70 hover:border-orange-500/40 transition-all p-3 sm:p-4 shadow-2xs hover:shadow-sm flex flex-col justify-between min-h-[340px]">
                              
                              {/* Uniform Header Badge Row (Fixed height: h-7) */}
                              <div className="h-7 flex items-center justify-between gap-1 w-full">
                                <div>
                                  {isLowestPrice ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-[11px] font-black">
                                      ★ সেরা মূল্য
                                    </span>
                                  ) : isHighestRated ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-black">
                                      ★ টপ রেটেড
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 text-[10px] sm:text-[11px] font-bold">
                                      পণ্য #{idx + 1}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeFromCompare(prod.id)}
                                  className="w-6 h-6 rounded-full bg-muted/80 hover:bg-rose-500 hover:text-white text-muted-foreground flex items-center justify-center transition-colors shrink-0"
                                  title="তালিকা থেকে বাদ দিন"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Uniform Image Container (Aspect Square, Max 140px, Centered) */}
                              <Link
                                to={`/product/${prod.slug || prod.id}`}
                                className="group relative w-full aspect-square max-w-[140px] sm:max-w-[150px] mx-auto rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border/50 p-2.5 flex items-center justify-center overflow-hidden my-2.5 shadow-2xs"
                              >
                                <SafeProductImage
                                  product={prod}
                                  width={140}
                                  height={140}
                                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                                {discountPct > 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-2xs">
                                    -{discountPct}%
                                  </span>
                                )}
                              </Link>

                              {/* Fixed Height Product Title (h-11 line-clamp-2 ensures zero vertical jitter) */}
                              <div className="h-11 flex items-center justify-center text-center my-1 px-1">
                                <Link
                                  to={`/product/${prod.slug || prod.id}`}
                                  className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug"
                                  title={prod.name}
                                >
                                  {prod.name}
                                </Link>
                              </div>

                              {/* Fixed Height Rating & Reviews Row (h-5) */}
                              <div className="h-5 flex items-center justify-center gap-1.5 text-[11px] font-bold">
                                <div className="flex items-center text-amber-500 gap-0.5">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  <span>{Number(prod.rating || 4.8).toFixed(1)}</span>
                                </div>
                                <span className="text-muted-foreground font-normal">
                                  ({prod.reviews || 25}+ রিভিউ)
                                </span>
                              </div>

                              {/* Fixed Height Pricing Row (h-8) */}
                              <div className="h-8 flex items-baseline justify-center gap-2 my-1">
                                <span className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-500 tracking-tight">
                                  ৳{Number(prod.price || 0).toLocaleString()}
                                </span>
                                {prod.originalPrice && prod.originalPrice > prod.price && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    ৳{Number(prod.originalPrice).toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {/* Fixed Height Aligned Action Buttons */}
                              <div className="grid grid-cols-1 gap-1.5 pt-2.5 border-t border-border/50">
                                <Button
                                  size="sm"
                                  onClick={(e) => handleAddToCart(prod, e)}
                                  className="w-full h-8 sm:h-9 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 rounded-xl active:scale-95 shadow-2xs"
                                >
                                  {addingCartId === prod.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 animate-bounce" />
                                      <span>যুক্ত হয়েছে</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>কার্টে যোগ করুন</span>
                                    </>
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleBuyNow(prod, e)}
                                  className="w-full h-8 sm:h-9 text-xs font-bold text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/60 hover:bg-orange-500/10 flex items-center justify-center gap-1.5 rounded-xl active:scale-95"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-current text-orange-500" />
                                  <span>এখনই কিনুন</span>
                                </Button>
                              </div>

                            </div>
                          </th>
                        );
                      })}

                      {/* Empty Slot Column if Under Max Limit */}
                      {hasEmptySlot && (
                        <th className="p-3 sm:p-4 w-[210px] sm:w-[260px] min-w-[210px] sm:min-w-[260px] align-top">
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="group w-full border-2 border-dashed border-border/80 hover:border-orange-500/70 bg-muted/20 hover:bg-orange-500/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[340px] transition-all cursor-pointer"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3 shadow-2xs">
                              <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-black text-sm text-foreground group-hover:text-orange-600 transition-colors">
                              আরেকটি পণ্য যোগ করুন
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-1">
                              সর্বোচ্চ {maxLimit}টি পণ্য পাশাপাশি তুলনা করুন
                            </span>
                          </button>
                        </th>
                      )}

                    </tr>
                  </thead>

                  {/* Body: Structured Grouped Specification Rows */}
                  <tbody>
                    {groups.map((group) => (
                      <React.Fragment key={group.id}>
                        {/* Section Header Row with Orange Accent Bar */}
                        <tr className="border-t-2 border-b border-border">
                          <td
                            colSpan={hasEmptySlot ? compareItems.length + 2 : compareItems.length + 1}
                            className="p-3 sm:p-3.5 font-black text-xs sm:text-sm text-foreground bg-slate-100/90 dark:bg-slate-800/90 border-l-4 border-orange-500"
                          >
                            <div className="flex items-center gap-2">
                              <span>{group.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                {group.rows.length} টি তথ্য
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Specs Rows */}
                        {group.rows.map((row) => {
                          const isDiff = row.isDifferent;
                          const shouldHighlight = highlightDifferences && isDiff;

                          return (
                            <tr
                              key={row.key}
                              className={cn(
                                "border-b border-border/50 transition-colors",
                                shouldHighlight
                                  ? "bg-amber-500/10 dark:bg-amber-500/15"
                                  : "hover:bg-muted/25"
                              )}
                            >
                              {/* Sticky Left Specification Name */}
                              <td className="sticky left-0 z-10 bg-card p-3 sm:p-4 font-semibold text-xs sm:text-sm text-foreground border-r border-border shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="leading-snug">{row.label}</span>
                                  {isDiff && highlightDifferences && (
                                    <span className="text-[9px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                                      অমিল
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Product Values */}
                              {compareItems.map((prod) => {
                                const rawVal = row.values[prod.id];
                                const textVal = String(rawVal ?? "—");
                                const isPositive =
                                  textVal.includes("হ্যাঁ") ||
                                  textVal.includes("ইন স্টক") ||
                                  textVal.includes("ফ্রি");
                                const isNegative =
                                  textVal.includes("প্রযোজ্য নয়") ||
                                  textVal.includes("না") ||
                                  textVal === "—";

                                return (
                                  <td
                                    key={prod.id}
                                    className={cn(
                                      "p-3 sm:p-4 text-xs sm:text-sm border-r border-border/40 last:border-r-0 align-middle",
                                      shouldHighlight && "font-bold text-amber-950 dark:text-amber-200"
                                    )}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      {isPositive && (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      )}
                                      <span
                                        className={cn(
                                          isNegative
                                            ? "text-muted-foreground/60"
                                            : "text-foreground font-medium"
                                        )}
                                      >
                                        {textVal}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Empty slot placeholder for add product column */}
                              {hasEmptySlot && (
                                <td className="p-3 sm:p-4 text-center text-muted-foreground/30 text-xs">
                                  —
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>

                </table>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Quick Add Product Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <Scale className="w-5 h-5 text-orange-600" />
              <span>তুলনা তালিকায় পণ্য যোগ করুন</span>
            </DialogTitle>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative my-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য বা ব্র্যান্ডের নাম লিখে সার্চ করুন..."
              className="pl-9 pr-4 text-xs sm:text-sm h-10 rounded-xl"
            />
          </div>

          {/* Category Quick Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
            {[
              { id: "all", label: "সকল পণ্য" },
              { id: "smartwatch", label: "স্মার্টওয়াচ" },
              { id: "gadget", label: "গ্যাজেটস" },
              { id: "camera", label: "ক্যামেরা" },
              { id: "audio", label: "হেডফোন/ইয়ারবাড" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full font-bold transition-all shrink-0 text-xs",
                  selectedCategory === cat.id
                    ? "bg-orange-500 text-white shadow-2xs"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[45vh] scrollbar-thin">
            {availableQuickProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                কোনো পণ্য পাওয়া যায়নি
              </div>
            ) : (
              availableQuickProducts.map((p) => {
                const isAlreadyAdded = compareItems.some((c) => String(c.id) === String(p.id));

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/70 hover:border-orange-500/40 bg-card hover:bg-muted/20 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 border border-border/40 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <SafeProductImage
                          product={p}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground line-clamp-1">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-orange-600">
                            ৳{Number(p.price || 0).toLocaleString()}
                          </span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              ৳{Number(p.originalPrice).toLocaleString()}
                            </span>
                          )}
                          <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            {p.rating || 4.8}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={isAlreadyAdded || compareItems.length >= maxLimit}
                      onClick={() => {
                        addToCompare(p);
                        if (compareItems.length + 1 >= maxLimit) {
                          setIsAddModalOpen(false);
                        }
                      }}
                      className={cn(
                        "h-8 px-3 text-xs font-bold rounded-lg shrink-0",
                        isAlreadyAdded
                          ? "bg-muted text-muted-foreground"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      )}
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          যুক্ত আছে
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 mr-1" />
                          যোগ করুন
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              নির্বাচিত: {compareItems.length}/{maxLimit} টি
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs font-semibold"
            >
              সম্পন্ন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
