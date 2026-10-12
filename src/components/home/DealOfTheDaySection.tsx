import { memo, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { getSmartProductImage, optimizeImageUrl, getResponsiveImageSrcSet, MINI_CARD_SIZES } from "@/utils/productImageHelper";
import { type Product } from "@/components/products/ProductCard";

import { SafeProductImage } from "@/components/products/SafeProductImage";

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
  speed?: number; // pixels per second
  rowId: string;
}

function DealRow({
  items,
  direction,
  speed = 36,
  rowId,
}: DealRowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const isManuallyDraggingRef = useRef<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startScrollLeftRef = useRef<number>(0);
  const dragDistRef = useRef<number>(0);
  
  // Touch refs
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartScrollLeftRef = useRef<number>(0);
  const isHorizontalDragRef = useRef<boolean>(false);
  const isVerticalScrollRef = useRef<boolean>(false);
  const isTouchingRef = useRef<boolean>(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const scrollPosRef = useRef<number>(0);

  // Set initial scroll position for right-moving track so it can scroll backwards seamlessly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const setInitialPos = () => {
      const singleSetWidth = el.scrollWidth / 3;
      if (singleSetWidth > 10) {
        if (direction === "right" && el.scrollLeft < 5) {
          el.scrollLeft = singleSetWidth;
          scrollPosRef.current = singleSetWidth;
        } else if (direction === "left" && el.scrollLeft === 0) {
          scrollPosRef.current = el.scrollLeft;
        }
      }
    };

    setInitialPos();
    const timer = setTimeout(setInitialPos, 150);
    return () => clearTimeout(timer);
  }, [direction, items]);

  const [isVisible, setIsVisible] = useState<boolean>(true);

  // IntersectionObserver to pause auto-scroll when off-screen (saves massive CPU & battery)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "150px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // RequestAnimationFrame Infinite Continuous Auto-Scroll Loop
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isVisible) return;

    lastTimeRef.current = performance.now();
    scrollPosRef.current = el.scrollLeft;

    const step = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      // Only skip auto-scroll while user is actively dragging horizontally
      if (!isManuallyDraggingRef.current && el) {
        const singleSetWidth = el.scrollWidth / 3;
        if (singleSetWidth > 20) {
          const delta = speed * dt;

          if (direction === "left") {
            scrollPosRef.current += delta;
            if (scrollPosRef.current >= singleSetWidth * 2) {
              scrollPosRef.current -= singleSetWidth;
            }
          } else {
            scrollPosRef.current -= delta;
            if (scrollPosRef.current <= singleSetWidth * 0.1) {
              scrollPosRef.current += singleSetWidth;
            }
          }

          el.scrollLeft = scrollPosRef.current;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [direction, speed, isVisible]);

  // Infinite Wrap helper
  const handleWrapIfNeeded = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const singleSetWidth = el.scrollWidth / 3;
    if (singleSetWidth <= 20) return;

    if (el.scrollLeft >= singleSetWidth * 2) {
      el.scrollLeft -= singleSetWidth;
      scrollPosRef.current = el.scrollLeft;
      if (isMouseDownRef.current) startScrollLeftRef.current -= singleSetWidth;
      if (isTouchingRef.current) touchStartScrollLeftRef.current -= singleSetWidth;
    } else if (el.scrollLeft <= singleSetWidth * 0.1) {
      el.scrollLeft += singleSetWidth;
      scrollPosRef.current = el.scrollLeft;
      if (isMouseDownRef.current) startScrollLeftRef.current += singleSetWidth;
      if (isTouchingRef.current) touchStartScrollLeftRef.current += singleSetWidth;
    }
  }, []);

  // Mouse Drag Events (Desktop)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    const el = containerRef.current;
    startScrollLeftRef.current = el ? el.scrollLeft : 0;
    scrollPosRef.current = el ? el.scrollLeft : 0;
    dragDistRef.current = 0;
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    const dx = e.clientX - startXRef.current;
    dragDistRef.current = Math.abs(dx);
    if (dragDistRef.current > 5) {
      isDraggingRef.current = true;
      isManuallyDraggingRef.current = true;
    }
    if (isManuallyDraggingRef.current) {
      const el = containerRef.current;
      const targetScroll = startScrollLeftRef.current - dx;
      el.scrollLeft = targetScroll;
      scrollPosRef.current = targetScroll;
      handleWrapIfNeeded();
    }
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      isManuallyDraggingRef.current = false;
      if (containerRef.current) {
        scrollPosRef.current = containerRef.current.scrollLeft;
      }
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 80);
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      isManuallyDraggingRef.current = false;
      if (containerRef.current) {
        scrollPosRef.current = containerRef.current.scrollLeft;
      }
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 80);
    }
  };

  // Touch Events (Mobile) - seamlessly allows vertical page scrolling while enabling horizontal drag
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    const el = containerRef.current;
    touchStartScrollLeftRef.current = el ? el.scrollLeft : 0;
    scrollPosRef.current = el ? el.scrollLeft : 0;
    isHorizontalDragRef.current = false;
    isVerticalScrollRef.current = false;
    isTouchingRef.current = true;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchingRef.current || !containerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;

    // Check gesture direction if not locked yet
    if (!isHorizontalDragRef.current && !isVerticalScrollRef.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
        // Vertical scroll -> let browser handle page scroll naturally without stopping anything
        isVerticalScrollRef.current = true;
        return;
      } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
        // Horizontal drag -> take control to swipe products
        isHorizontalDragRef.current = true;
        isManuallyDraggingRef.current = true;
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    if (isHorizontalDragRef.current) {
      const el = containerRef.current;
      const targetScroll = touchStartScrollLeftRef.current - dx;
      el.scrollLeft = targetScroll;
      scrollPosRef.current = targetScroll;
      handleWrapIfNeeded();
    }
  };

  const handleTouchEnd = () => {
    isTouchingRef.current = false;
    isHorizontalDragRef.current = false;
    isVerticalScrollRef.current = false;
    isManuallyDraggingRef.current = false;
    if (containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollLeft;
    }
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative overflow-x-auto overflow-y-hidden w-full cursor-grab active:cursor-grabbing select-none no-scrollbar touch-pan-y"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex w-max gap-1.5 sm:gap-2.5 md:gap-3 py-1 pointer-events-auto">
        {items.map((product, idx) => (
          <ProductDealCard
            key={`${rowId}-${product.id}-${idx}`}
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
  // Split and format products into 2 distinct continuous rows with triple-buffer
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

    // Perfectly sized 14 items per row (42 with 3x buffer = 84 cards total, saving 91% DOM nodes)
    const maxItemsPerRow = 14;
    const timeShift = Math.floor(Date.now() / (3 * 60 * 1000));
    
    const sliceR1 = r1.length > maxItemsPerRow
      ? [...r1.slice((timeShift * 15) % r1.length), ...r1.slice(0, (timeShift * 15) % r1.length)].slice(0, maxItemsPerRow)
      : r1;
      
    const sliceR2 = r2.length > maxItemsPerRow
      ? [...r2.slice((timeShift * 15) % r2.length), ...r2.slice(0, (timeShift * 15) % r2.length)].slice(0, maxItemsPerRow)
      : r2;

    const ensureBuffer = (arr: Product[]) => {
      if (arr.length === 0) return [];
      let result = [...arr];
      while (result.length < 8) {
        result = [...result, ...arr];
      }
      return result;
    };

    const baseR1 = ensureBuffer(sliceR1);
    const baseR2 = ensureBuffer(sliceR2.length > 0 ? sliceR2 : sliceR1);

    // Tripled buffer ensures seamless infinite scroll in both left & right directions
    return {
      row1: [...baseR1, ...baseR1, ...baseR1],
      row2: [...baseR2, ...baseR2, ...baseR2],
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
