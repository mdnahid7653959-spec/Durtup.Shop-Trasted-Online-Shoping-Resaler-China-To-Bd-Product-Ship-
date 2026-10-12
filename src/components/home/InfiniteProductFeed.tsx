import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { getCachedMohasagorProducts, interleaveCatalogs } from "@/utils/mohasagorCache";
import { EcomsellerEngine } from "@/services/suppliers/ecomsellerEngine";
import { prefetchProductImages } from "@/utils/productImageHelper";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";

const BATCH_SIZE = 18;

export function InfiniteProductFeed() {
  const [allCatalog, setAllCatalog] = useState<Product[]>(() => FAST_SEED_PRODUCTS);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(() => FAST_SEED_PRODUCTS.slice(0, BATCH_SIZE));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load initial products from both supplier caches
  useEffect(() => {
    async function initCatalog() {
      try {
        const [mohasagor, ecomseller] = await Promise.all([
          getCachedMohasagorProducts().catch(() => []),
          EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []),
        ]);
        const products = interleaveCatalogs(mohasagor, ecomseller);
        if (products && products.length > 0) {
          setAllCatalog(products);
          setDisplayedProducts(products.slice(0, BATCH_SIZE));
          setHasMore(products.length > BATCH_SIZE);
          // Defer background warming slightly so visible cards render instantly with full priority
          setTimeout(() => {
            prefetchProductImages(products.slice(BATCH_SIZE, BATCH_SIZE + 12), 12);
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to load infinite product feed:", err);
      }
    }

    initCatalog();

    // Auto 5-minute product shuffle & refresh timer
    const autoRotateTimer = setInterval(async () => {
      const [mohasagor, ecomseller] = await Promise.all([
        getCachedMohasagorProducts().catch(() => []),
        EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []),
      ]);
      const products = interleaveCatalogs(mohasagor, ecomseller);
      if (products && products.length > 0) {
        const timeBlock = Math.floor(Date.now() / (5 * 60 * 1000));
        const shift = (timeBlock * BATCH_SIZE) % products.length;
        const rotated = [...products.slice(shift), ...products.slice(0, shift)];
        setAllCatalog(rotated);
        setDisplayedProducts(rotated.slice(0, BATCH_SIZE));
        setPage(1);
        setHasMore(rotated.length > BATCH_SIZE);
      }
    }, 5 * 60 * 1000);

    // Listen for background API product updates
    const handleUpdate = async () => {
      const [mohasagor, ecomseller] = await Promise.all([
        getCachedMohasagorProducts().catch(() => []),
        EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []),
      ]);
      const updated = interleaveCatalogs(mohasagor, ecomseller);
      if (updated && updated.length > 0) {
        setAllCatalog(updated);
        setDisplayedProducts((prev) => {
          const currentCount = Math.max(prev.length, BATCH_SIZE);
          return updated.slice(0, currentCount);
        });
      }
    };
    window.addEventListener("mohasagor_products_updated", handleUpdate);
    window.addEventListener("ecomseller_products_updated", handleUpdate);
    window.addEventListener("durtup_products_updated", handleUpdate);
    return () => {
      clearInterval(autoRotateTimer);
      window.removeEventListener("mohasagor_products_updated", handleUpdate);
      window.removeEventListener("ecomseller_products_updated", handleUpdate);
      window.removeEventListener("durtup_products_updated", handleUpdate);
    };
  }, []);

  // Function to load next batch synchronously with 0ms lag
  const loadNextBatch = () => {
    if (!hasMore || allCatalog.length === 0) return;
    const nextPage = page + 1;
    const nextBatch = allCatalog.slice(0, nextPage * BATCH_SIZE);

    setDisplayedProducts(nextBatch);
    setPage(nextPage);
    setHasMore(nextBatch.length < allCatalog.length);
  };

  // IntersectionObserver for Infinite Scroll with large 1000px look-ahead
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadNextBatch();
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, hasMore, allCatalog]);

  if (displayedProducts.length === 0) return null;

  return (
    <section className="w-full py-6 space-y-4">
      {/* Title block that matches the original theme styling */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          More to Love
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayedProducts.map((product, idx) => (
          <ProductCard key={`${product.id}-${idx}`} product={product} priority={idx < 6} />
        ))}
      </div>

      {/* Load More Sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="w-full py-8 flex justify-center items-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
            Loading more products...
          </div>
        </div>
      )}
    </section>
  );
}
