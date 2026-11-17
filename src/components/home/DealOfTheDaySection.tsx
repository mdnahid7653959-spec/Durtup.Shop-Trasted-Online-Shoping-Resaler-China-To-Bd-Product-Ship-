import { memo, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { MINI_CARD_SIZES } from "@/utils/productImageHelper";
import { type Product } from "@/components/products/ProductCard";
import { SafeProductImage } from "@/components/products/SafeProductImage";
import { cn } from "@/lib/utils";

interface DealOfTheDayProps {
  products?: Product[];
}

function ProductDealCard({
  product,
  idx,
  isDraggingRef,
}: {
  product: Product;
  idx: number;
  isDraggingRef: React.MutableRefObject<boolean>;
}) {
  const discountPercentages = [26, 22, 18, 25, 20, 24, 30, 21, 19, 28];
  const finalPrice = Math.max(0, Math.round(Number(product.price) || 0));
  const rawOriginal = product.originalPrice ? Math.round(Number(product.originalPrice)) : 0;
  
  const discount = (rawOriginal > finalPrice && finalPrice > 0)
    ? Math.round(((rawOriginal - finalPrice) / rawOriginal) * 100)
    : discountPercentages[idx % discountPercentages.length];

  const regularPrice = (rawOriginal > finalPrice)
    ? rawOriginal
    : Math.round(finalPrice * (1 + discount / 100));

  const reviewCounts = ["1.2k", "890", "2.3k", "1.1k", "750", "920", "1.5k", "640", "1.8k"];
  const reviewCount =
    product.reviews >= 1000
      ? `${(product.reviews / 1000).toFixed(1)}k`
      : product.reviews > 0
        ? product.reviews
        : reviewCounts[idx % reviewCounts.length];

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="w-[125px] xs:w-[138px] sm:w-[160px] md:w-[185px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-orange-400 dark:hover:border-orange-500/50 transition-all duration-200 p-1.5 sm:p-2.5 relative group/card shadow-2xs select-none flex flex-col justify-between"
    >
      <Link
        to={`/product/${product.slug || product.id}`}
        state={{ preloadedProduct: product }}
        onClick={handleClick}
        draggable={false}
        className="block w-full flex flex-col flex-1"
      >
        {/* Discount Badge */}
        <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
          <span className="bg-[#ff3b30] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
            -{discount}%
          </span>
        </div>

        {/* Product Image Container with Safe Multi-Tier Fallback */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 mb-1.5 flex items-center justify-center p-1 pointer-events-none">
          <SafeProductImage
            product={product}
            width={185}
            height={185}
            sizes={MINI_CARD_SIZES}
            priority={idx < 4}
            fit="contain"
            className="group-hover/card:scale-108 transition-transform duration-300 filter drop-shadow-xs"
          />
        </div>

        {/* Product Title */}
        <h3 
          title={product.name}
          className="font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 h-[2rem] sm:h-[2.4rem] mb-1 group-hover/card:text-orange-600 transition-colors pointer-events-none leading-snug break-words"
        >
          {product.name}
        </h3>

        {/* 5-Star Rating & Reviews */}
        <div className="flex items-center gap-0.5 sm:gap-1 mb-1.5 pointer-events-none mt-auto">
          <div className="flex items-center text-amber-400">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
          </div>
          <span className="text-[8px] sm:text-[10px] text-slate-500 font-medium">
            ({reviewCount})
          </span>
        </div>

        {/* Price & Fast Action Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className="text-xs sm:text-sm font-black text-orange-600 leading-none">
              ৳{finalPrice.toLocaleString("en-BD")}
            </span>
            {regularPrice > finalPrice && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through leading-none">
                ৳{regularPrice.toLocaleString("en-BD")}
              </span>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/60 dark:text-orange-400 px-1.5 py-0.5 rounded-md">
            Order
          </span>
        </div>
      </Link>
    </div>
  );
}


interface DealRowProps {
  items: Product[];
  direction: "left" | "right";
  speed?: number;
  rowId: string;
}

function DealRow({
  items,
  direction,
  rowId,
}: DealRowProps) {
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Take a clean slice and duplicate for 100% seamless, mathematically perfect loop
  const slice = useMemo(() => {
    if (!items || items.length === 0) return [];
    let base = [...items];
    while (base.length < 8) {
      base = [...base, ...items];
    }
    return base.slice(0, 16);
  }, [items]);

  if (slice.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden w-full select-none deal-marquee-track-container group/row cursor-default pointer-events-auto"
    >
      <div
        className={cn(
          "flex w-max gap-2 sm:gap-3 py-1 group-hover/row:[animation-play-state:paused]",
          direction === "left" ? "animate-durtup-marquee-left" : "animate-durtup-marquee-right"
        )}
        style={{
          animationDuration: `${Math.max(26, slice.length * 3.0)}s`,
          willChange: "transform",
        }}
      >
        {/* Set 1 */}
        {slice.map((product, idx) => (
          <ProductDealCard
            key={`${rowId}-a-${product.id}-${idx}`}
            product={product}
            idx={idx}
            isDraggingRef={isDraggingRef}
          />
        ))}

        {/* Set 2 (Identical Clone for continuous 0% to -50% loop) */}
        {slice.map((product, idx) => (
          <ProductDealCard
            key={`${rowId}-b-${product.id}-${idx}`}
            product={product}
            idx={idx}
            isDraggingRef={isDraggingRef}
          />
        ))}
      </div>
    </div>
  );
}

function DealOfTheDayComponent({ products = [] }: DealOfTheDayProps) {
  // Split and format products into 2 distinct continuous rows
  const { row1, row2 } = useMemo(() => {
    if (!products || products.length === 0) return { row1: [], row2: [] };

    // Deduplicate unique products
    const unique: Product[] = [];
    const seen = new Set<string>();

    for (const p of products) {
      if (!p || !p.id || !p.name) continue;
      const key = (p.slug || p.id).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }

    const items = unique.length > 0 ? unique : products;

    // Split into 2 alternating rows for diversity
    const r1: Product[] = [];
    const r2: Product[] = [];

    items.forEach((item, i) => {
      if (i % 2 === 0) {
        r1.push(item);
      } else {
        r2.push(item);
      }
    });

    return {
      row1: r1.length > 0 ? r1 : items,
      row2: r2.length > 0 ? r2 : items,
    };
  }, [products]);

  if (row1.length === 0 && row2.length === 0) return null;

  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3 overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header with Title and View All */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-red-500 rounded-full inline-block" />
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Deal of the Day
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pl-3.5 mt-0.5 font-medium">
              Exclusive daily discounts & special offers • Auto-streaming
            </p>
          </div>

          <div>
            {/* View All Link */}
            <Link
              to="/products?filter=deals"
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors shrink-0"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* 2 Continuous Dual-Direction Auto-Running & Interactive Rows Container */}
        <div className="deal-marquee-wrapper relative overflow-hidden py-1 space-y-2 sm:space-y-3 rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/40 p-1 sm:p-2 border border-slate-100 dark:border-slate-800/80">
          {/* Row 1: Auto-Scroll to the Left ← & Interactive Drag */}
          <DealRow
            rowId="row1"
            items={row1}
            direction="left"
            speed={38}
          />

          {/* Row 2: Auto-Scroll to the Right → & Interactive Drag */}
          <DealRow
            rowId="row2"
            items={row2}
            direction="right"
            speed={38}
          />
        </div>
      </div>
    </section>
  );
}

export const DealOfTheDaySection = memo(DealOfTheDayComponent);
