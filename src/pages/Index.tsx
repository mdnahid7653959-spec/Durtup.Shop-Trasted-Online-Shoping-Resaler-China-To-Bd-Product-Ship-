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
import { SEOHead } from "@/components/SEOHead";

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
    if (data?.dealProducts && data.dealProducts.length > 0) {
      return data.dealProducts;
    }
    if (data?.allProducts && data.allProducts.length > 0) {
      return data.allProducts;
    }
    return [
      ...(data?.trending || []),
      ...(data?.featured || []),
      ...(data?.flashSale || []),
      ...(data?.latestProducts || []),
      ...(data?.recommended || []),
    ];
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
      <Header />

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

        {/* 2. Hero Banner (Sunset Gadget Showcase) */}
        <HeroBanner />

        {/* 3. Trust & Service Feature Strip */}
        <TrustBadges />

        {/* 4. Flash Sale Header + 8 Quick Category Shortcut Cards */}
        <FlashSaleSection />

        {/* 5. Deal of the Day Product Carousel */}
        {isLoading ? (
          <SectionSkeleton />
        ) : (
          <DealOfTheDaySection products={dealProducts} />
        )}

        {/* 6. Popular Categories Showcase (4 Pastel Banners) */}
        <PopularCategoriesSection />

        {/* 7. Just Added / Fresh Products Section */}
        {data?.latestProducts && data.latestProducts.length > 0 && (
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
        )}

        {/* Brand Promotional Banner */}
        <HomeMidBanner />

        {/* 8. Endless Automatic Product Feed */}
        <section className="w-full px-3 sm:px-4 pt-2">
          <div className="max-w-7xl mx-auto">
            <InfiniteProductFeed />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default memo(Index);
