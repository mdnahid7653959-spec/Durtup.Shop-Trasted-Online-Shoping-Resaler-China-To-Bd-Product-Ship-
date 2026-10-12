import { memo } from "react";
import { Link } from "react-router-dom";

interface CategoryTile {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  bgGradient: string;
  border: string;
  image: string;
}

// 4 Most Popular & Trending Categories matching the live database
const POPULAR_TILES: CategoryTile[] = [
  {
    id: "electronics",
    name: "Gadgets & Electronics",
    subtitle: "Up to 30% Off",
    href: "/category/gadgets-electronics",
    bgGradient: "bg-[#e8edff] dark:bg-indigo-950/30",
    border: "border-indigo-100 dark:border-indigo-900/40",
    image: "/category-gadgets.webp",
  },
  {
    id: "mens-fashion",
    name: "Men's Fashion",
    subtitle: "Up to 40% Off",
    href: "/category/mens-fashion",
    bgGradient: "bg-[#fef4db] dark:bg-amber-950/30",
    border: "border-amber-100 dark:border-amber-900/40",
    image: "/category-mens.webp",
  },
  {
    id: "womens-fashion",
    name: "Women's Fashion",
    subtitle: "Up to 40% Off",
    href: "/category/womens-fashion",
    bgGradient: "bg-[#fdebf3] dark:bg-pink-950/30",
    border: "border-pink-100 dark:border-pink-900/40",
    image: "/category-womens.webp",
  },
  {
    id: "smart-watch",
    name: "Smart Watches",
    subtitle: "Up to 35% Off",
    href: "/category/watch",
    bgGradient: "bg-[#e8f7ee] dark:bg-emerald-950/30",
    border: "border-emerald-100 dark:border-emerald-900/40",
    image: "/category-smartwatch.webp",
  },
];

function PopularCategoriesComponent() {
  return (
    <section className="w-full px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Popular Categories
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* 4 Category Showcase Banners Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {POPULAR_TILES.map((tile) => (
            <Link
              key={tile.id}
              to={tile.href}
              className={`relative overflow-hidden rounded-2xl p-3 sm:p-4 ${tile.bgGradient} border ${tile.border} shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[95px] sm:min-h-[115px] group`}
            >
              {/* Text Info */}
              <div className="z-10 relative max-w-[62%]">
                <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-orange-600 transition-colors">
                  {tile.name}
                </h3>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                  {tile.subtitle}
                </p>
              </div>

              {/* Product Cutout Image on Bottom Right */}
              <div className="absolute right-1.5 bottom-1.5 sm:right-2.5 sm:bottom-2.5 w-14 h-14 sm:w-18 sm:h-18 rounded-xl overflow-hidden pointer-events-none group-hover:scale-110 transition-transform duration-300">
                <img
                  src={tile.image}
                  alt={tile.name}
                  width={72}
                  height={72}
                  className="w-full h-full object-cover rounded-xl filter drop-shadow-sm"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/category-gadgets.webp";
                  }}
                />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

export const PopularCategoriesSection = memo(PopularCategoriesComponent);
