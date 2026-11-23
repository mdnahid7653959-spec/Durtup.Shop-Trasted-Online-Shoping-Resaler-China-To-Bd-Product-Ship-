import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { getCachedMohasagorProducts, interleaveCatalogs, getSyncProducts } from "@/utils/mohasagorCache";
import { EcomsellerEngine } from "@/services/suppliers/ecomsellerEngine";
import { prefetchProductImages } from "@/utils/productImageHelper";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";

const BATCH_SIZE = 18;

function deduplicateProductsStrict(items: Product[]): Product[] {
  const seen = new Set<string>();
  const res: Product[] = [];
  for (const item of items) {
    if (!item) continue;
    const nameKey = (item.name || "").trim().toLowerCase();
    const idKey = String(item.id || "").trim().toLowerCase();
    const slugKey = String(item.slug || "").trim().toLowerCase();
    
    if (idKey && seen.has(`id:${idKey}`)) continue;
    if (slugKey && seen.has(`slug:${slugKey}`)) continue;
    if (nameKey && seen.has(`name:${nameKey}`)) continue;
    
    if (idKey) seen.add(`id:${idKey}`);
    if (slugKey) seen.add(`slug:${slugKey}`);
    if (nameKey) seen.add(`name:${nameKey}`);
    res.push(item);
  }
  return res;
}

// Keep catalog & loaded products in memory so returning from product details restores immediately without re-fetch flash
let cachedFeedAllCatalog: Product[] = [];
let cachedFeedDisplayedProducts: Product[] = [];
let cachedFeedPage = 1;
let cachedFeedHasMore = true;
let cachedFeedScrollY = 0;

export function InfiniteProductFeed() {
  const [allCatalog, setAllCatalog] = useState<Product[]>(() => {
    if (cachedFeedAllCatalog.length > 0) return cachedFeedAllCatalog;
    const sync = getSyncProducts();
    if (sync && sync.length > 10) {
      const deduped = deduplicateProductsStrict(sync);
      cachedFeedAllCatalog = deduped;
      return deduped;
    }
    const deduped = deduplicateProductsStrict(FAST_SEED_PRODUCTS);
    return deduped;
  });
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(() => {
    if (cachedFeedDisplayedProducts.length > 0) return cachedFeedDisplayedProducts;
    const sync = getSyncProducts();
    if (sync && sync.length > 10) {
      const batch = deduplicateProductsStrict(sync).slice(0, BATCH_SIZE);
      cachedFeedDisplayedProducts = batch;
      return batch;
    }
    const batch = deduplicateProductsStrict(FAST_SEED_PRODUCTS).slice(0, BATCH_SIZE);
    return batch;
  });
  const [page, setPage] = useState(() => cachedFeedPage);
  const [hasMore, setHasMore] = useState(() => cachedFeedHasMore);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Restore scroll position when returning from product page
  useEffect(() => {
    const savedScrollY = cachedFeedScrollY || Number(sessionStorage.getItem("durtup_feed_scroll_y") || 0);
    const lastClicked = sessionStorage.getItem("durtup_last_clicked_product");

    if (savedScrollY > 0 || lastClicked) {
      const attemptRestore = () => {
        if (lastClicked) {
          const targetEl =
            document.getElementById(`product-card-${lastClicked}`) ||
            document.querySelector(`[data-product-id="${lastClicked}"]`) ||
            document.querySelector(`[data-product-slug="${lastClicked}"]`);
          if (targetEl) {
            targetEl.scrollIntoView({ block: "center", behavior: "auto" });
            sessionStorage.removeItem("durtup_last_clicked_product");
            return true;
          }
        }
        if (savedScrollY > 0) {
          window.scrollTo({ top: savedScrollY, behavior: "auto" });
          return true;
        }
        return false;
      };

      // Try immediately, then retry after layout paint
      if (!attemptRestore()) {
        const timer = setTimeout(attemptRestore, 60);
        const secondTimer = setTimeout(attemptRestore, 200);
        return () => {
          clearTimeout(timer);
          clearTimeout(secondTimer);
        };
      }
    }
  }, []);

  // Save scroll position on scroll & unmount
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        cachedFeedScrollY = window.scrollY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (window.scrollY > 150) {
        cachedFeedScrollY = window.scrollY;
        try {
          sessionStorage.setItem("durtup_feed_scroll_y", String(window.scrollY));
        } catch {}
      }
    };
  }, []);

  // Load initial products from both supplier caches
  useEffect(() => {
    async function initCatalog() {
      try {
        const [mohasagor, ecomseller] = await Promise.all([
          getCachedMohasagorProducts().catch(() => []),
          EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []),
        ]);
        const products = deduplicateProductsStrict(interleaveCatalogs(mohasagor, ecomseller));
        if (products && products.length > 0) {
          setAllCatalog(products);
          cachedFeedAllCatalog = products;

          setDisplayedProducts((prev) => {
            if (cachedFeedDisplayedProducts.length > 0) {
              return cachedFeedDisplayedProducts;
            }
            const initialBatch = products.slice(0, BATCH_SIZE);
            cachedFeedDisplayedProducts = initialBatch;
            return initialBatch;
          });

          setHasMore(() => {
            const currentCount = cachedFeedDisplayedProducts.length > 0 ? cachedFeedDisplayedProducts.length : BATCH_SIZE;
            const more = products.length > currentCount;
            cachedFeedHasMore = more;
            return more;
          });

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
      const products = deduplicateProductsStrict(interleaveCatalogs(mohasagor, ecomseller));
      if (products && products.length > 0) {
        const timeBlock = Math.floor(Date.now() / (5 * 60 * 1000));
        const shift = (timeBlock * BATCH_SIZE) % products.length;
        const rotated = [...products.slice(shift), ...products.slice(0, shift)];
        const dedupedRotated = deduplicateProductsStrict(rotated);
        setAllCatalog(dedupedRotated);
        setDisplayedProducts(dedupedRotated.slice(0, BATCH_SIZE));
        setPage(1);
        setHasMore(dedupedRotated.length > BATCH_SIZE);
      }
    }, 5 * 60 * 1000);

    // Listen for background API product updates
    const handleUpdate = async () => {
      const [mohasagor, ecomseller] = await Promise.all([
        getCachedMohasagorProducts().catch(() => []),
        EcomsellerEngine.getCachedEcomsellerProducts().catch(() => []),
      ]);
      const updated = deduplicateProductsStrict(interleaveCatalogs(mohasagor, ecomseller));
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
    const nextBatch = deduplicateProductsStrict(allCatalog.slice(0, nextPage * BATCH_SIZE));
    const more = nextBatch.length < allCatalog.length;

    setDisplayedProducts(nextBatch);
    setPage(nextPage);
    setHasMore(more);

    cachedFeedDisplayedProducts = nextBatch;
    cachedFeedPage = nextPage;
    cachedFeedHasMore = more;

    // Pre-warm next batch of images ahead of time
    prefetchProductImages(nextBatch.slice((nextPage - 1) * BATCH_SIZE, nextPage * BATCH_SIZE + 12));
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
          <ProductCard key={`${product.id}-${idx}`} product={product} index={idx} priority={idx < 12} />
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
