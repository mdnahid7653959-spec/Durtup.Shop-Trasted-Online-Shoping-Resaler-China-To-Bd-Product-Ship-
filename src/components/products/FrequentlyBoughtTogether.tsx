import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Check, ShoppingCart, Layers, CheckCircle2 } from "lucide-react";
import { SafeProductImage } from "@/components/products/SafeProductImage";
import type { Product } from "@/components/products/ProductCard";
import { getFrequentlyBoughtTogether } from "@/services/recommendationService";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { cn } from "@/lib/utils";

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
  catalog?: Product[];
}

function getSafePrice(p: any): number {
  if (!p) return 0;
  const val = p.price ?? p.discount_price ?? p.sale_price ?? p.regular_price ?? 0;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
  return isNaN(num) || num <= 0 ? 0 : Math.round(num);
}

function getSafeOriginalPrice(p: any): number {
  if (!p) return 0;
  const val = p.originalPrice ?? p.regular_price ?? p.price ?? 0;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
  const safeP = getSafePrice(p);
  return isNaN(num) || num <= safeP ? safeP : Math.round(num);
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  currentProduct,
  catalog = FAST_SEED_PRODUCTS,
}) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const bundleData = useMemo(() => {
    return getFrequentlyBoughtTogether(currentProduct, catalog);
  }, [currentProduct, catalog]);

  // Track which products are selected in the bundle (current product always checked)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(bundleData.bundleProducts.map((p) => p.id));
  });

  const toggleSelect = (id: string) => {
    if (id === currentProduct.id) return; // Cannot uncheck current product
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedProducts = useMemo(() => {
    return bundleData.bundleProducts.filter((p) => selectedIds.has(p.id));
  }, [bundleData, selectedIds]);

  const basePriceSum = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + getSafePrice(p), 0);
  }, [selectedProducts]);

  const originalPriceSum = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + getSafeOriginalPrice(p), 0);
  }, [selectedProducts]);

  const discountedBundlePrice = useMemo(() => {
    if (selectedProducts.length > 1) {
      const mult = (100 - bundleData.discountPercent) / 100;
      return Math.round(basePriceSum * mult);
    }
    return basePriceSum;
  }, [selectedProducts, basePriceSum, bundleData.discountPercent]);

  const totalSavings = Math.max(0, originalPriceSum - discountedBundlePrice);

  const handleAddBundleToCart = async () => {
    if (adding) return;
    setAdding(true);
    try {
      for (const prod of selectedProducts) {
        await addToCart(prod, 1);
      }
      toast.success(
        `কম্বো বান্ডেলের ${selectedProducts.length}টি পণ্য কার্টে যোগ হয়েছে! ৳${totalSavings.toLocaleString()} সাশ্রয়!`
      );
    } catch (err) {
      toast.error("বান্ডেল কার্টে যোগ করতে সমস্যা হয়েছে");
    } finally {
      setAdding(false);
    }
  };

  if (!bundleData.bundleProducts || bundleData.bundleProducts.length < 2) {
    return null;
  }

  return (
    <section className="bg-card border border-border/70 rounded-2xl p-4 sm:p-6 shadow-2xs mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Frequently Bought Together
            </h3>
            <p className="text-xs text-muted-foreground">
              একসাথে কিনলে <span className="font-semibold text-foreground">৫% বিশেষ কম্বো ছাড়</span>
            </p>
          </div>
        </div>

        {bundleData.discountPercent > 0 && (
          <span className="self-start sm:self-center text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60 px-2.5 py-1 rounded-full">
            {bundleData.discountPercent}% Bundle Savings
          </span>
        )}
      </div>

      {/* Main Grid: Products Strip (Left) + Total Summary Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Visual Product Cards Row */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {bundleData.bundleProducts.map((p, idx) => {
              const isSelected = selectedIds.has(p.id);
              const isCurrent = p.id === currentProduct.id;
              const price = getSafePrice(p);
              const origPrice = getSafeOriginalPrice(p);

              return (
                <React.Fragment key={p.id}>
                  {idx > 0 && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 select-none">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}

                  <div
                    onClick={() => toggleSelect(p.id)}
                    className={cn(
                      "group relative flex flex-col p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none w-[110px] sm:w-[135px] shrink-0",
                      isSelected
                        ? "border-orange-500/80 bg-orange-50/20 dark:bg-orange-950/20 shadow-2xs"
                        : "border-border/60 bg-muted/20 opacity-60 hover:opacity-90"
                    )}
                  >
                    {/* Selection Checkbox */}
                    <div
                      className={cn(
                        "absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shadow-2xs transition-colors",
                        isSelected
                          ? "bg-orange-600 text-white"
                          : "bg-background border border-border text-transparent"
                      )}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    {/* Badge: Main Product vs Addon */}
                    <span className="self-end text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {isCurrent ? "এই পণ্যটি" : "+ বান্ডেল"}
                    </span>

                    {/* Image */}
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-border/50 flex items-center justify-center p-1.5 mb-2">
                      <SafeProductImage
                        product={p}
                        width={120}
                        height={120}
                        fit="contain"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Title */}
                    <p
                      title={p.name}
                      className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug h-[2rem]"
                    >
                      {p.name}
                    </p>

                    {/* Price */}
                    <div className="mt-1.5 flex items-baseline gap-1 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-orange-600 tabular-nums">
                        ৳{price.toLocaleString()}
                      </span>
                      {origPrice > price && (
                        <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                          ৳{origPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Itemized Selection Checklist (Amazon style) */}
          <div className="bg-muted/30 border border-border/60 rounded-xl p-3 flex flex-col gap-2">
            {bundleData.bundleProducts.map((p) => {
              const isSelected = selectedIds.has(p.id);
              const isCurrent = p.id === currentProduct.id;
              const price = getSafePrice(p);

              return (
                <label
                  key={`check-${p.id}`}
                  className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isCurrent}
                    onChange={() => toggleSelect(p.id)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="flex-1 truncate">
                    {isCurrent ? (
                      <strong className="text-foreground">এই পণ্যটি: </strong>
                    ) : null}
                    <span className="text-muted-foreground">{p.name}</span>
                  </span>
                  <span className="font-bold text-foreground tabular-nums shrink-0">
                    ৳{price.toLocaleString()}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Pricing & Checkout Summary Card (Right) */}
        <div className="lg:col-span-4 bg-muted/40 border border-border/70 rounded-xl p-4 flex flex-col justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              বান্ডেল মূল্য ({selectedProducts.length}টি পণ্য)
            </span>

            <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
              <span className="text-2xl font-black text-foreground tabular-nums">
                ৳{discountedBundlePrice.toLocaleString()}
              </span>
              {originalPriceSum > discountedBundlePrice && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">
                  ৳{originalPriceSum.toLocaleString()}
                </span>
              )}
            </div>

            {totalSavings > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/60 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>সাশ্রয়: ৳{totalSavings.toLocaleString()} ({bundleData.discountPercent}% ছাড়)</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            disabled={adding}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>
              {adding ? "যোগ হচ্ছে..." : `একসাথে ${selectedProducts.length}টি পণ্য কার্টে যোগ করুন`}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
