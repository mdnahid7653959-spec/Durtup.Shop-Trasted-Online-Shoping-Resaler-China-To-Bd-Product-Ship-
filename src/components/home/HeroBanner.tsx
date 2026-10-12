import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prefetchRoute } from "@/components/RoutePrefetcher";
import { useHomeProducts } from "@/hooks/useHomeProducts";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { getSmartProductImage } from "@/utils/productImageHelper";
import type { Product } from "@/components/products/ProductCard";

interface HeroSlide {
  id: string;
  title: string;
  link: string;
  imageWebp: string;
  imageJpg: string;
  alt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "gaming-electronics",
    title: "Durtup-এ সেরা গেমিং এবং ইলেকট্রনিক্স অ্যাক্সেসরিজ",
    link: "/category/gadgets-electronics",
    imageWebp: "/banners/hero-banner-1.webp",
    imageJpg: "/banners/hero-banner-1.jpg",
    alt: "Durtup - সেরা গেমিং এবং ইলেকট্রনিক্স অ্যাক্সেসরিজ | এখনই কিনুন",
  },
  {
    id: "all-products-offer",
    title: "আপনার পছন্দের সব পণ্য এক ঠিকানায়",
    link: "/products",
    imageWebp: "/banners/hero-banner-2.webp",
    imageJpg: "/banners/hero-banner-2.jpg",
    alt: "Durtup.shop - আপনার পছন্দের সব পণ্য এক ঠিকানায় | কেনাকাটা করুন নিশ্চিন্তে",
  },
];

// Helper to get random item index different from excluded index
function getRandomIndex(total: number, excludeIndex = -1): number {
  if (total <= 1) return 0;
  let idx = Math.floor(Math.random() * total);
  while (idx === excludeIndex) {
    idx = Math.floor(Math.random() * total);
  }
  return idx;
}

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [isSideCardsPaused, setIsSideCardsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const { data: homeData } = useHomeProducts();

  // Combine rich product catalog pool for dynamic selection
  const productPool: Product[] = useMemo(() => {
    const raw = [
      ...(homeData?.featured || []),
      ...(homeData?.trending || []),
      ...(homeData?.flashSale || []),
      ...(homeData?.allProducts || []),
      ...FAST_SEED_PRODUCTS,
    ];
    // Deduplicate by ID and ensure valid image & price
    const seen = new Set<string>();
    const unique: Product[] = [];
    for (const p of raw) {
      if (p && p.id && !seen.has(p.id) && p.name && (p.price || p.price === 0)) {
        seen.add(p.id);
        unique.push(p);
      }
    }
    return unique.length > 0 ? unique : FAST_SEED_PRODUCTS;
  }, [homeData]);

  // Initial random product selection per user session
  const [prodIndex1, setProdIndex1] = useState<number>(() => getRandomIndex(FAST_SEED_PRODUCTS.length));
  const [prodIndex2, setProdIndex2] = useState<number>(() => getRandomIndex(FAST_SEED_PRODUCTS.length, 0));

  // Auto-rotate the side random products smoothly every 6.5 seconds
  useEffect(() => {
    if (isSideCardsPaused || productPool.length < 2) return;

    const interval = setInterval(() => {
      setProdIndex1((prev) => getRandomIndex(productPool.length, prev));
      setProdIndex2((prev) => getRandomIndex(productPool.length, prev));
    }, 6500);

    return () => clearInterval(interval);
  }, [isSideCardsPaused, productPool.length]);

  const product1 = productPool[prodIndex1 % productPool.length] || FAST_SEED_PRODUCTS[0];
  const product2 = productPool[prodIndex2 % productPool.length] || FAST_SEED_PRODUCTS[1] || FAST_SEED_PRODUCTS[0];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Auto-advance banner carousel
  useEffect(() => {
    if (isBannerPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [isBannerPaused, nextSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
    setIsBannerPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 40) {
        nextSlide();
      } else if (diff < -40) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsBannerPaused(false);
  };

  return (
    <section 
      id="hero-banner-section" 
      aria-label="Promotional Hero Banners"
      className="w-full px-2 sm:px-4 pt-1 sm:pt-2 pb-1"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          
          {/* Main Hero Slider (8 cols on lg, 9 cols on xl) */}
          <div className="lg:col-span-8 xl:col-span-9 relative flex">
            <div
              className="w-full relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-md sm:shadow-lg bg-slate-950 select-none group/banner border border-border/40 aspect-[1024/400] max-h-[440px]"
              onMouseEnter={() => setIsBannerPaused(true)}
              onMouseLeave={() => setIsBannerPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Slide Track */}
              <div 
                className="w-full h-full flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {HERO_SLIDES.map((slide, index) => (
                  <div 
                    key={slide.id} 
                    className="w-full h-full shrink-0 relative"
                  >
                    <Link
                      to={slide.link}
                      onMouseEnter={() => prefetchRoute(slide.link)}
                      onTouchStart={() => prefetchRoute(slide.link)}
                      aria-label={slide.title}
                      className="block w-full h-full relative cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <picture className="w-full h-full block">
                        <source srcSet={slide.imageWebp} type="image/webp" />
                        <img
                          src={slide.imageJpg}
                          alt={slide.alt}
                          width={1024}
                          height={400}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/banner:scale-[1.01]"
                          loading={index === 0 ? "eager" : "lazy"}
                          // @ts-expect-error fetchPriority attribute is supported in modern browsers
                          fetchPriority={index === 0 ? "high" : "low"}
                          decoding="async"
                        />
                      </picture>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Left Arrow Button (Desktop hover only) */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous Slide"
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md items-center justify-center border border-white/20 opacity-0 group-hover/banner:opacity-100 transition-all duration-200 active:scale-90 shadow-md hover:scale-105"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Right Arrow Button (Desktop hover only) */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next Slide"
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md items-center justify-center border border-white/20 opacity-0 group-hover/banner:opacity-100 transition-all duration-200 active:scale-90 shadow-md hover:scale-105"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Right Side 2 Dynamic Random Products (Glassmorphic Showcase) */}
          <div 
            className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-3 justify-between"
            onMouseEnter={() => setIsSideCardsPaused(true)}
            onMouseLeave={() => setIsSideCardsPaused(false)}
          >
            {/* Top Product Card */}
            <SideProductCard
              key={`side-prod-1-${product1.id}`}
              product={product1}
            />

            {/* Bottom Product Card */}
            <SideProductCard
              key={`side-prod-2-${product2.id}`}
              product={product2}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

interface SideProductCardProps {
  product: Product;
}

const SideProductCard = memo(function SideProductCard({ product }: SideProductCardProps) {
  const displayImage = getSmartProductImage(product.name, product.image, (product as any).category || "");
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const productUrl = `/product/${product.id}`;

  return (
    <Link
      to={productUrl}
      onMouseEnter={() => prefetchRoute(productUrl)}
      onTouchStart={() => prefetchRoute(productUrl)}
      className="group/card relative flex-1 flex flex-col justify-between p-3 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-500 hover:-translate-y-1"
    >
      {/* 1. UPORE: Product Photo in Box */}
      <div className="relative w-full h-24 sm:h-28 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-1.5 flex items-center justify-center overflow-hidden border border-border/50 shadow-2xs group-hover/card:scale-[1.02] transition-transform duration-300">
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain filter drop-shadow-sm group-hover/card:scale-108 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-1.5 right-1.5 text-[9px] sm:text-[10px] font-black text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-950/50 px-1.5 py-0.5 rounded-full border border-red-500/20 shadow-xs">
            -{discount}%
          </span>
        )}
      </div>

      {/* 2. NICHE: Description / Title */}
      <div className="pt-2 pb-1 relative z-10">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1 group-hover/card:text-primary transition-colors">
          {product.name}
        </h3>
      </div>

      {/* 3. TAR NICHE: Price & Water-Droplet Glass Buy Now Button */}
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-border/40 relative z-10">
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-black text-orange-600 leading-tight">
            ৳{Number(product.price).toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[11px] text-muted-foreground line-through">
              ৳{Number(product.originalPrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Crystal Water-Droplet Glass Buy Now Button */}
        <div className="water-droplet-btn water-droplet-crystal font-extrabold text-xs sm:text-sm py-1.5 px-4 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md active:scale-[0.96] transition-all text-slate-900 border border-white/90">
          <span>Buy Now</span>
        </div>
      </div>
    </Link>
  );
});

export default memo(HeroBanner);
