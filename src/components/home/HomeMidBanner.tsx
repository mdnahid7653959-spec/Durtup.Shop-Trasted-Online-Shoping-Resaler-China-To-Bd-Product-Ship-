import { memo } from "react";
import { Link } from "react-router-dom";

export function HomeMidBannerComponent() {
  return (
    <section className="w-full px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/products"
          aria-label="Durtup.shop - Everything You Need"
          className="group block relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-orange-500/10 hover:border-orange-500/30"
        >
          <div className="w-full aspect-[1024/334] relative bg-gradient-to-r from-[#e65100] via-[#f57c00] to-[#ff9800] overflow-hidden">
            <img
              src="/hero-banner-durtup.webp"
              alt="Durtup.shop - Everything You Need"
              width={1024}
              height={334}
              className="w-full h-full object-cover object-center transform transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("hero-banner-durtu.webp")) {
                  target.src = "/hero-banner-durtu.webp";
                }
              }}
            />
            {/* Subtle gloss/shimmer highlight overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        </Link>
      </div>
    </section>
  );
}

export const HomeMidBanner = memo(HomeMidBannerComponent);
export default HomeMidBanner;
