import { memo, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
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
        className="block w-full flex flex-col flex-1 cursor-pointer"
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
  rowId: string;
}

function DealRow({ items, rowId }: DealRowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 15);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 15);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, items]);

  const handleScroll = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(280, Math.round(el.clientWidth * 0.7));
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    setIsMouseDown(true);
    isDraggingRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      isDraggingRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const onMouseUpOrLeave = () => {
    setIsMouseDown(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group/row w-full">
      {/* Left Scroll Navigation Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll products left"
          className="absolute -left-1 sm:-left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-lg border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all opacity-95 sm:opacity-0 sm:group-hover/row:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Right Scroll Navigation Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll products right"
          className="absolute -right-1 sm:-right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-lg border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all opacity-95 sm:opacity-0 sm:group-hover/row:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Interactive Free-Drag & Native Swipe Scroll Track */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        className={cn(
          "flex gap-2 sm:gap-3 overflow-x-auto py-1 no-scrollbar select-none transition-[scroll]",
          isMouseDown ? "cursor-grabbing scroll-auto" : "cursor-grab scroll-smooth"
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
          overscrollBehaviorX: "contain",
        }}
      >
        {items.map((product, idx) => (
          <ProductDealCard
            key={`${rowId}-${product.id || idx}-${idx}`}
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
  // Split and format products into 2 distinct rows
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
              Exclusive daily discounts & special offers • সোয়াইপ বা টেনে ডিলগুলো দেখুন
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View All Link */}
            <Link
              to="/products?filter=deals"
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors shrink-0"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* 2 Interactive Free-Scroll & Draggable Rows Container */}
        <div className="deal-marquee-wrapper relative overflow-hidden py-1 space-y-2 sm:space-y-3 rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/40 p-1.5 sm:p-2.5 border border-slate-100 dark:border-slate-800/80">
          {/* Row 1 */}
          <DealRow
            rowId="row1"
            items={row1}
          />

          {/* Row 2 */}
          <DealRow
            rowId="row2"
            items={row2}
          />
        </div>
      </div>
    </section>
  );
}

export const DealOfTheDaySection = memo(DealOfTheDayComponent);
