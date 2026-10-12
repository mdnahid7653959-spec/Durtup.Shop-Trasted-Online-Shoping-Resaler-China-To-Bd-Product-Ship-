import { memo } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

interface CategoryShortcut {
  name: string;
  bangla: string;
  href: string;
  image?: string;
  isAll?: boolean;
}

// 8 Top Categories with clean, high-resolution circular cards and responsive typography
const QUICK_CATEGORIES: CategoryShortcut[] = [
  {
    name: "Gadgets",
    bangla: "ইলেকট্রনিক্স",
    href: "/category/gadgets-electronics",
    image: "/category-gadgets.webp",
  },
  {
    name: "Smart Watch",
    bangla: "স্মার্ট ওয়াচ",
    href: "/category/watch",
    image: "/category-smartwatch.webp",
  },
  {
    name: "Men's Wear",
    bangla: "পুরুষদের পোশাক",
    href: "/category/mens-fashion",
    image: "/category-mens.webp",
  },
  {
    name: "Women's Wear",
    bangla: "শাড়ি ও ড্রেস",
    href: "/category/womens-fashion",
    image: "/category-womens.webp",
  },
  {
    name: "Home Living",
    bangla: "হোম অ্যাপ্লায়েন্স",
    href: "/category/home-lifestyle",
    image: "/category-home.webp",
  },
  {
    name: "Pure Foods",
    bangla: "খাবার ও মধু",
    href: "/category/foods",
    image: "/category-foods.webp",
  },
  {
    name: "Kids Zone",
    bangla: "বাচ্চাদের খেলনা",
    href: "/category/kids-zone",
    image: "/category-kids.webp",
  },
  {
    name: "All Categories",
    bangla: "সব ক্যাটাগরি",
    href: "/categories",
    isAll: true,
  },
];

function FlashSaleSectionComponent() {
  return (
    <section className="w-full px-2 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto bg-card border border-border/70 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
        
        {/* Categories Header */}
        <div className="flex items-center justify-between px-0.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 bg-orange-500 rounded-full inline-block" />
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Shop by Category
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pl-3.5 mt-0.5 font-medium">
              Explore all product categories
            </p>
          </div>

          {/* View All Link */}
          <Link
            to="/categories"
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors shrink-0"
          >
            View All →
          </Link>
        </div>

        {/* 8 Modern High-End Circular Category Showcase */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-4">
          {QUICK_CATEGORIES.map((cat) => {
            return (
              <Link
                key={cat.name}
                to={cat.href}
                className="flex flex-col items-center group cursor-pointer transition-transform"
              >
                {/* Perfect Round Circle with Smooth Shadow & Border Ring */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full relative flex items-center justify-center p-1 bg-white dark:bg-slate-800/90 border-2 border-slate-100 dark:border-slate-700/80 shadow-xs group-hover:border-orange-500 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                  {cat.isAll ? (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-orange-600 text-white flex flex-col items-center justify-center shadow-inner group-hover:from-orange-600 group-hover:to-orange-500 transition-colors">
                      <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] sm:text-[10px] font-black tracking-wider text-orange-200 mt-0.5">ALL</span>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        width={88}
                        height={88}
                        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/category-gadgets.webp";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Clean, Non-Cramped Typography */}
                <div className="mt-2 text-center w-full px-0.5 flex flex-col items-center">
                  <span className="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 transition-colors line-clamp-1 leading-snug">
                    {cat.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight mt-0.5">
                    {cat.bangla}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export const FlashSaleSection = memo(FlashSaleSectionComponent);
