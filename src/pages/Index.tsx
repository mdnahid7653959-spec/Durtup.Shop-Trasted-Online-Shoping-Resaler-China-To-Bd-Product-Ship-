import { memo, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { TrustBadges } from "@/components/home/TrustBadges";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { DealOfTheDaySection } from "@/components/home/DealOfTheDaySection";
import { PopularCategoriesSection } from "@/components/home/PopularCategoriesSection";
import { useHomeProducts } from "@/hooks/useHomeProducts";
import { ProductSection } from "@/components/home/ProductSection";
import { Clock } from "lucide-react";
import { InfiniteProductFeed } from "@/components/home/InfiniteProductFeed";
import { HomeMidBanner } from "@/components/home/HomeMidBanner";
import { RecommendedForYouSection } from "@/components/home/RecommendedForYouSection";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { SEOHead } from "@/components/SEOHead";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";

const SectionSkeleton = () => (
  <div className="py-3 sm:py-5">
    <div className="bg-card border rounded-2xl p-3 sm:p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted skeleton-shimmer" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded-lg w-32 skeleton-shimmer" />
          <div className="h-3 bg-muted rounded-lg w-24 skeleton-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <div className="aspect-square bg-muted rounded-xl mb-2 skeleton-shimmer" />
            <div className="h-3 bg-muted rounded w-full mb-1.5 skeleton-shimmer" />
            <div className="h-3 bg-muted rounded w-2/3 skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  const { data, isLoading, isError } = useHomeProducts();

  // Combine products for Deal of the Day across full multi-supplier catalog (2,000+ items streaming)
  const dealProducts = useMemo(() => {
    try {
      if (Array.isArray(data?.dealProducts) && data.dealProducts.length > 0) {
        return data.dealProducts;
      }
      if (Array.isArray(data?.allProducts) && data.allProducts.length > 0) {
        return data.allProducts;
      }
      const combined = [
        ...(Array.isArray(data?.trending) ? data.trending : []),
        ...(Array.isArray(data?.featured) ? data.featured : []),
        ...(Array.isArray(data?.flashSale) ? data.flashSale : []),
        ...(Array.isArray(data?.latestProducts) ? data.latestProducts : []),
        ...(Array.isArray(data?.recommended) ? data.recommended : []),
      ];
      if (combined.length > 0) return combined;
      return FAST_SEED_PRODUCTS;
    } catch (e) {
      console.warn("Index: Error processing deal products", e);
      return FAST_SEED_PRODUCTS;
    }
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Durtup.shop - পছন্দের পণ্য খুঁজে নিন | অনলাইন শপিং বাংলাদেশ"
        description="পছন্দের পণ্য খুঁজে নিন Durtup.shop-এ। গ্যাজেট, ইলেকট্রনিক্স, ফ্যাশন, হোম ও আরও অনেক পণ্য সাশ্রয়ী দামে—সহজ অর্ডার ও নিরাপদ শপিং।"
        url="https://durtup.shop"
        type="website"
      />

      {/* 1. Header with Top Notice, Logo, Search & Category Pills */}
      <SectionErrorBoundary>
        <Header />
      </SectionErrorBoundary>

      <main className="flex-1 pb-20 md:pb-8 space-y-2 sm:space-y-4">
        {isError && (
          <section className="w-full px-3 sm:px-4 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-8 bg-card border rounded-xl">
                <p className="text-muted-foreground">Unable to load products. Please refresh the page.</p>
              </div>
            </div>
          </section>
        )}

        {/* 2. Hero Banner (Sunset Gadget Showcase + Featured Side Products) */}
        <SectionErrorBoundary>
          <HeroBanner />
        </SectionErrorBoundary>

        {/* 3. Deal of the Day Product Carousel - Products immediately visible upon entering the site! */}
        <SectionErrorBoundary>
          {isLoading && (!dealProducts || dealProducts.length === 0) ? (
            <SectionSkeleton />
          ) : (
            <DealOfTheDaySection products={dealProducts} />
          )}
        </SectionErrorBoundary>

        {/* 4. Quick Category Shortcut Cards */}
        <SectionErrorBoundary>
          <FlashSaleSection />
        </SectionErrorBoundary>

        {/* 5. Trust & Service Feature Strip */}
        <SectionErrorBoundary>
          <TrustBadges />
        </SectionErrorBoundary>

        {/* 6. Popular Categories Showcase (4 Pastel Banners) */}
        <SectionErrorBoundary>
          <PopularCategoriesSection />
        </SectionErrorBoundary>

        {/* 7. Just Added / Fresh Products Section */}
        {data?.latestProducts && data.latestProducts.length > 0 && (
          <SectionErrorBoundary>
            <section className="w-full px-3 sm:px-4">
              <div className="max-w-7xl mx-auto">
                <ProductSection
                  title="Just Added"
                  subtitle="Fresh products"
                  products={data.latestProducts}
                  viewAllLink="/products?sort=newest"
                  icon={Clock}
                  iconBgColor="bg-gradient-to-br from-blue-500 to-cyan-500"
                  iconColor="text-white"
                />
              </div>
            </section>
          </SectionErrorBoundary>
        )}

        {/* Brand Promotional Banner */}
        <SectionErrorBoundary>
          <HomeMidBanner />
        </SectionErrorBoundary>

        {/* 8. Smart Personalized Product Recommendations */}
        <SectionErrorBoundary>
          <RecommendedForYouSection />
        </SectionErrorBoundary>

        {/* 9. Recently Viewed Products (appears dynamically when customer views products) */}
        <SectionErrorBoundary>
          <RecentlyViewedSection />
        </SectionErrorBoundary>

        {/* 10. Endless Automatic Product Feed */}
        <SectionErrorBoundary>
          <section className="w-full px-3 sm:px-4 pt-2">
            <div className="max-w-7xl mx-auto">
              <InfiniteProductFeed />
            </div>
          </section>
        </SectionErrorBoundary>

      </main>

      <SectionErrorBoundary>
        <Footer />
      </SectionErrorBoundary>
    </div>
  );
};

export default memo(Index);
