import { useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES_DATA, findCategoryOrSubcategory } from "@/data/categoriesData";
import { prefetchRoute } from "@/components/RoutePrefetcher";

interface CategoryPillsNavProps {
  isCompact?: boolean;
  isVisible?: boolean;
}

export const CategoryPillsNav = memo(function CategoryPillsNav({ 
  isCompact = false,
  isVisible = true 
}: CategoryPillsNavProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const rawCatParam = searchParams.get("category");
  const rawSubParam = searchParams.get("subcategory");
  const currentCategory = (rawCatParam || "").toLowerCase().trim();
  const currentSubcategory = (rawSubParam || "").toLowerCase().trim();

  // Active category detection
  const isHomeActive = location.pathname === "/" && !currentCategory && !currentSubcategory;
  const pathCategorySlug = location.pathname.startsWith("/category/")
    ? location.pathname.replace("/category/", "").split("/")[0].split("?")[0]
    : "";
  const activeCategoryInfo = findCategoryOrSubcategory(
    currentCategory || currentSubcategory || pathCategorySlug
  );
  const activeMainCategory = activeCategoryInfo.category || null;

  // High-performance Drag & Scroll State
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const [isGrabbing, setIsGrabbing] = useState(false);

  // Liquid Water Droplet Sliding State
  const [dropletStyle, setDropletStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const [isDropletSliding, setIsDropletSliding] = useState(false);
  const [dropletSlideDir, setDropletSlideDir] = useState<"left" | "right" | "none">("none");
  const prevPillLeftRef = useRef<number | null>(null);

  // Dropdown hover state for desktop pills
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  // Precise Physical Water Droplet Calculation (Calculates exact position relative to UL)
  const updateDroplet = useCallback((instant = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>("[data-active='true']");
    if (!activeEl) {
      setDropletStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const elLeft = activeRect.left - containerRect.left + container.scrollLeft;
    const elTop = activeRect.top - containerRect.top + container.scrollTop;
    const elWidth = activeRect.width;
    const elHeight = activeRect.height;

    if (prevPillLeftRef.current !== null && Math.abs(prevPillLeftRef.current - elLeft) > 2 && !instant) {
      const dir = elLeft > prevPillLeftRef.current ? "right" : "left";
      setDropletSlideDir(dir);
      setIsDropletSliding(true);
      setTimeout(() => {
        setIsDropletSliding(false);
        setDropletSlideDir("none");
      }, 200);
    }
    prevPillLeftRef.current = elLeft;

    setDropletStyle({
      left: elLeft,
      top: elTop,
      width: elWidth,
      height: elHeight,
      opacity: 1,
    });
  }, []);

  useLayoutEffect(() => {
    updateDroplet(true);
    const frame = requestAnimationFrame(() => {
      updateDroplet(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, currentCategory, activeMainCategory, updateDroplet]);

  useEffect(() => {
    if (isVisible) {
      const timer1 = setTimeout(() => {
        updateDroplet(true);
        checkScrollability();
      }, 30);
      const timer2 = setTimeout(() => {
        updateDroplet(true);
      }, 200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isVisible, updateDroplet, checkScrollability]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollability();
    updateDroplet(true);

    const onScroll = () => {
      checkScrollability();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      checkScrollability();
      updateDroplet(true);
    });

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
        checkScrollability();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
  }, [checkScrollability, updateDroplet]);

  // Robust drag gesture detection without false click blocking
  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const el = scrollContainerRef.current;
      if (!el) return;
      
      const deltaX = e.pageX - startXRef.current;
      dragDistanceRef.current = Math.abs(deltaX);

      // Only engage drag if moved more than 12px (avoids false drags on normal clicks / taps)
      if (dragDistanceRef.current > 12) {
        hasDraggedRef.current = true;
        setIsGrabbing(true);
        el.scrollLeft = scrollLeftRef.current - deltaX;
        checkScrollability();
      }
    };

    const onGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setIsGrabbing(false);
        if (dragDistanceRef.current > 12) {
          setTimeout(() => {
            hasDraggedRef.current = false;
            dragDistanceRef.current = 0;
          }, 50);
        } else {
          hasDraggedRef.current = false;
          dragDistanceRef.current = 0;
        }
      }
    };

    window.addEventListener("mousemove", onGlobalMouseMove, { passive: true });
    window.addEventListener("mouseup", onGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, [checkScrollability]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkScrollability, 200);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    dragDistanceRef.current = 0;
    startXRef.current = e.pageX;
    scrollLeftRef.current = el.scrollLeft;
  };

  // Ultra-fast instant category shift handler
  const handlePillClick = (e: React.MouseEvent, href: string) => {
    if (hasDraggedRef.current || dragDistanceRef.current > 12) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
      dragDistanceRef.current = 0;
      return;
    }

    e.preventDefault();

    const clickedEl = e.currentTarget as HTMLElement;
    const container = scrollContainerRef.current;
    if (clickedEl && container) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = clickedEl.getBoundingClientRect();
      const elLeft = activeRect.left - containerRect.left + container.scrollLeft;
      const elTop = activeRect.top - containerRect.top + container.scrollTop;

      if (prevPillLeftRef.current !== null && Math.abs(prevPillLeftRef.current - elLeft) > 2) {
        const dir = elLeft > prevPillLeftRef.current ? "right" : "left";
        setDropletSlideDir(dir);
        setIsDropletSliding(true);
        setTimeout(() => {
          setIsDropletSliding(false);
          setDropletSlideDir("none");
        }, 200);
      }
      prevPillLeftRef.current = elLeft;

      setDropletStyle({
        left: elLeft,
        top: elTop,
        width: activeRect.width,
        height: activeRect.height,
        opacity: 1,
      });
    }

    // Instant zero-lag navigation and auto-scroll to top
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    navigate(href);
  };

  const handleMouseEnter = (catId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCategory(catId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  return (
    <div className={cn("relative bg-transparent select-none", isCompact ? "py-0.5 px-1 sm:px-2" : "py-1 sm:py-1.5 px-2 sm:px-4")}>
      <div className="max-w-7xl mx-auto relative flex items-center">
        {/* Dock Container with Crystal Styling */}
        <div className={cn(
          "w-full relative flex items-center rounded-[26px]",
          isCompact ? "p-0.5" : "p-1",
          "bg-white/95 dark:bg-slate-900/95",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-slate-200/90 dark:border-slate-800",
          "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.03)]",
          "dark:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.5)]"
        )}>
          {/* Specular gloss top reflection beam on the dock */}
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-white/30 to-transparent pointer-events-none opacity-90" />

          {/* Left Slide Arrow Button */}
          {canScrollLeft && (
            <div className="hidden md:flex absolute left-1 z-30 h-full items-center">
              <button
                type="button"
                onClick={() => scrollByAmount(-320)}
                className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md border border-white/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Scrollable / Draggable Pills List */}
          <nav className="w-full overflow-hidden px-1 py-0.5 relative">
            <ul
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none select-none py-0.5 touch-pan-x relative",
                isGrabbing ? "cursor-grabbing" : "cursor-grab"
              )}
              style={{ 
                WebkitOverflowScrolling: "touch",
                userSelect: "none"
              }}
            >
              {/* Single Hyper-Realistic 3D Sliding Water Droplet */}
              {dropletStyle.opacity > 0 && (
                <div
                  className={cn(
                    "absolute pointer-events-none z-0",
                    "transition-all duration-200 ease-out"
                  )}
                  style={{
                    left: `${dropletStyle.left}px`,
                    top: `${dropletStyle.top}px`,
                    width: `${dropletStyle.width}px`,
                    height: `${dropletStyle.height}px`,
                  }}
                >
                  <div 
                    className={cn(
                      "w-full h-full p-0.5 transition-transform duration-150",
                      isDropletSliding && dropletSlideDir === "right" && "scale-x-[1.12] scale-y-[0.90] origin-left",
                      isDropletSliding && dropletSlideDir === "left" && "scale-x-[1.12] scale-y-[0.90] origin-right",
                      !isDropletSliding && "scale-100"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-full h-full rounded-full relative overflow-hidden",
                        "bg-gradient-to-b from-white/95 via-white/45 to-white/75",
                        "dark:from-white/35 dark:via-white/12 dark:to-white/30",
                        "backdrop-blur-md",
                        "border border-white/95 dark:border-white/60",
                        "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.06),inset_0_0_15px_rgba(255,255,255,0.9)]",
                        "dark:shadow-[0_6px_22px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3),inset_0_0_15px_rgba(255,255,255,0.25)]"
                      )}
                    >
                      {/* Top Specular Glare */}
                      <div className="absolute top-0.5 left-2.5 w-6 h-[2px] bg-gradient-to-r from-white via-white to-white/70 rounded-full blur-[0.15px] shadow-[0_0_4px_rgba(255,255,255,1)]" />
                      {/* Sparkle Dot */}
                      <div className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff,0_0_2px_#ffffff]" />
                      {/* Bottom Caustic Light Arc */}
                      <div className="absolute bottom-0.5 inset-x-2 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px] shadow-[0_0_4px_rgba(255,255,255,0.95)]" />
                    </div>
                  </div>
                </div>
              )}

              {/* "All" Pill */}
              <li className="shrink-0 z-10">
                <Link
                  to="/"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseEnter={() => prefetchRoute("/")}
                  onTouchStart={() => prefetchRoute("/")}
                  onClick={(e) => handlePillClick(e, "/")}
                  data-active={isHomeActive}
                  className={cn(
                    "relative px-4 sm:px-5 py-1.5 text-xs sm:text-sm rounded-full transition-colors duration-150 flex items-center justify-center gap-1 whitespace-nowrap select-none",
                    isHomeActive
                      ? "text-slate-950 dark:text-white font-extrabold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  )}
                >
                  <span>All</span>
                </Link>
              </li>

              {/* Categories */}
              {CATEGORIES_DATA.map((cat) => {
                const isActive = activeMainCategory?.id === cat.id;
                const isHovered = hoveredCategory === cat.id;

                return (
                  <li
                    key={cat.id}
                    className="shrink-0 z-10"
                    onMouseEnter={() => {
                      prefetchRoute(`/category/${cat.slug}`);
                      handleMouseEnter(cat.id);
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={`/category/${cat.slug}`}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onTouchStart={() => prefetchRoute(`/category/${cat.slug}`)}
                      onClick={(e) => handlePillClick(e, `/category/${cat.slug}`)}
                      data-active={isActive}
                      className={cn(
                        "relative px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm rounded-full transition-colors duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap select-none",
                        isActive
                          ? "text-slate-950 dark:text-white font-extrabold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                      )}
                    >
                      <span>{cat.name}</span>
                    </Link>

                    {/* Desktop Hover Subcategories Dropdown */}
                    {isHovered && cat.subcategories.length > 0 && !isGrabbing && (
                      <div
                        className="hidden md:block absolute top-full left-0 z-50 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700 shadow-2xl rounded-2xl py-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-150"
                        onMouseEnter={() => handleMouseEnter(cat.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-orange-600">
                            {cat.name}
                          </span>
                        </div>

                        <div className="py-1">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/category/${cat.slug}?subcategory=${sub.slug}`}
                              draggable={false}
                              onDragStart={(e) => e.preventDefault()}
                              className="flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 transition-colors"
                            >
                              <span>{sub.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

              {/* More Categories Button */}
              <li className="shrink-0 z-10">
                <Link
                  to="/categories"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onClick={(e) => handlePillClick(e, "/categories")}
                  className="px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap select-none"
                >
                  <span>More</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </nav>

          {/* Right Slide Arrow Button */}
          {canScrollRight && (
            <div className="hidden md:flex absolute right-1 z-30 h-full items-center">
              <button
                type="button"
                onClick={() => scrollByAmount(320)}
                className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-md border border-white/80 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CategoryPillsNav;
