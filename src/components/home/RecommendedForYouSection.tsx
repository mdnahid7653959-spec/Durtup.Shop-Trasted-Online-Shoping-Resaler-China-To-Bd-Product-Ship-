import React, { useMemo } from "react";
import { Sparkles, ArrowRight, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import {
  getPersonalizedRecommendations,
  getCustomerAffinityProfile,
} from "@/services/recommendationService";
import { useHomeProducts } from "@/hooks/useHomeProducts";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";

export const RecommendedForYouSection: React.FC = () => {
  const { data } = useHomeProducts();

  const catalogPool = useMemo(() => {
    try {
      const raw = [
        ...(Array.isArray(data?.allProducts) ? data.allProducts : []),
        ...(Array.isArray(data?.trending) ? data.trending : []),
        ...(Array.isArray(data?.featured) ? data.featured : []),
        ...(Array.isArray(FAST_SEED_PRODUCTS) ? FAST_SEED_PRODUCTS : []),
      ];
      const seen = new Set<string>();
      const list: Product[] = [];
      for (const p of raw) {
        if (p && p.id && !seen.has(p.id) && p.name) {
          seen.add(p.id);
          list.push(p);
        }
      }
      return list.length > 0 ? list : FAST_SEED_PRODUCTS;
    } catch {
      return FAST_SEED_PRODUCTS;
    }
  }, [data]);

  const recommendedProducts = useMemo(() => {
    return getPersonalizedRecommendations(catalogPool, 12);
  }, [catalogPool]);

  const profile = useMemo(() => {
    return getCustomerAffinityProfile();
  }, []);

  if (!recommendedProducts || recommendedProducts.length === 0) {
    return null;
  }

  const topCategoryName = profile.topCategories[0]?.category;

  return (
    <section className="w-full px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                  Recommended For You
                </h2>
                {profile.hasHistory && (
                  <span className="text-[10px] font-black text-white bg-orange-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Personalized
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {profile.hasHistory && topCategoryName
                  ? `আপনার আগ্রহ ও ${topCategoryName} ক্যাটাগরির পছন্দের ভিত্তিতে`
                  : "সেরা রেটিং ও সর্বাধিক বিক্রিত জনপ্রিয় পণ্যসমূহ"}
              </p>
            </div>
          </div>

          <Link
            to="/products"
            className="group flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {recommendedProducts.map((product, idx) => (
            <ProductCard
              key={`rec-${product.id}-${idx}`}
              product={product}
              index={idx}
              priority={idx < 6}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
