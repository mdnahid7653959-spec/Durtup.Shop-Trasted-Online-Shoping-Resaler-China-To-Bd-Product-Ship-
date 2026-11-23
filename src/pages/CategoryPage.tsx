import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCachedMohasagorProducts,
  getSyncProducts,
  filterProductsByCategory,
  hydrateCatalog,
  isCompleteCatalogReady
} from "@/utils/mohasagorCache";
import { SEOHead } from "@/components/SEOHead";
import { generateCategorySEOTitle, generateCategorySEODescription, DEFAULT_BANGLADESH_PRODUCT_FAQS } from "@/utils/seoHelper";
import { findCategoryOrSubcategory, CATEGORIES_DATA } from "@/data/categoriesData";
import { cn } from "@/lib/utils";

const PRODUCTS_PER_PAGE = 24;

interface Category {

  id: string;
  name: string;
  slug: string;
  description: string | null;
  bangla?: string;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const subcategoryParam = (searchParams.get("subcategory") || "").toLowerCase().trim();

  const categoryLookup = findCategoryOrSubcategory(slug || "");
  const mainCat = categoryLookup.category || null;
  const formattedName = mainCat ? mainCat.name : (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "");
  const filterKey = subcategoryParam || slug || "";

  const [category, setCategory] = useState<Category | null>(() => {
    if (!slug) return null;
    if (mainCat) {
      return {
        id: mainCat.id,
        name: mainCat.name,
        slug: mainCat.slug,
        description: `Explore premium ${mainCat.name} products with best prices & fast delivery in Bangladesh`,
      };
    }
    return {
      id: `cat-${slug}`,
      name: formattedName,
      slug,
      description: `Explore top quality products in ${formattedName}`,
    };
  });

  // 1. Instant 0ms Initial State from in-memory cache
  const [products, setProducts] = useState<Product[]>(() => {
    const syncList = getSyncProducts();
    return filterProductsByCategory(syncList, filterKey, formattedName);
  });

  const [productsLoading, setProductsLoading] = useState<boolean>(() => {
    const syncList = getSyncProducts();
    const initialFiltered = filterProductsByCategory(syncList, filterKey, formattedName);
    return initialFiltered.length === 0 && !isCompleteCatalogReady();
  });

  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isAutoLoadingRef = useRef(false);

  // Reset pagination when category or subcategory changes
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [slug, subcategoryParam]);

  const loadNextBatch = useCallback(() => {
    if (isAutoLoadingRef.current || visibleCount >= products.length) return;
    isAutoLoadingRef.current = true;
    setVisibleCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, products.length));
    setTimeout(() => {
      isAutoLoadingRef.current = false;
    }, 150);
  }, [visibleCount, products.length]);

  // Engine 1: IntersectionObserver with early 1000px threshold
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadNextBatch();
      }
    }, {
      root: null,
      rootMargin: "1000px 0px 1000px 0px",
      threshold: 0
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadNextBatch]);

  // Engine 2: Throttled Window Scroll listener fallback
  useEffect(() => {
    if (visibleCount >= products.length) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const fullHeight = Math.max(
          document.documentElement.scrollHeight || 0,
          document.body.scrollHeight || 0
        );

        if (scrollY + viewportHeight >= fullHeight - 1000) {
          loadNextBatch();
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [loadNextBatch, visibleCount, products.length]);

  // Subcategory Navigation Container Ref
  const subScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active subcategory into view
  useEffect(() => {
    const el = subScrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>("[data-subactive='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [subcategoryParam]);

  // 2. High-Speed Instant Synchronous Category/Subcategory Switch (০ মিলিসেকেন্ড ইনস্ট্যান্ট লোড)
  useLayoutEffect(() => {
    const syncList = getSyncProducts();
    const instantFiltered = filterProductsByCategory(syncList, filterKey, formattedName);
    setProducts(prev => {
      if (prev.length === instantFiltered.length && prev[0]?.id === instantFiltered[0]?.id) {
        return prev;
      }
      return instantFiltered;
    });
  }, [slug, subcategoryParam, filterKey, formattedName]);

  // 3. Category Data Hydration: Immediately hydrate full catalog on mount
  useEffect(() => {
    let isMounted = true;

    hydrateCatalog().then((fullList) => {
      if (!isMounted) return;
      const filtered = filterProductsByCategory(fullList, filterKey, formattedName);
      setProducts(filtered);
      setProductsLoading(false);
    }).catch(() => {
      if (isMounted) setProductsLoading(false);
    });

    const handleUpdate = () => {
      const syncList = getSyncProducts();
      const instantFiltered = filterProductsByCategory(syncList, filterKey, formattedName);
      setProducts(instantFiltered);
      if (instantFiltered.length > 0 || isCompleteCatalogReady()) {
        setProductsLoading(false);
      }
    };

    window.addEventListener("mohasagor_products_updated", handleUpdate);
    window.addEventListener("ecomseller_products_updated", handleUpdate);
    window.addEventListener("durtup_products_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("mohasagor_products_updated", handleUpdate);
      window.removeEventListener("ecomseller_products_updated", handleUpdate);
      window.removeEventListener("durtup_products_updated", handleUpdate);
    };
  }, [filterKey, formattedName]);

  // Instant subcategory switch with zero lag
  const handleSubcategorySelect = (subSlug: string) => {
    const newFilterKey = subSlug || slug || "";
    const syncList = getSyncProducts();
    const instantList = filterProductsByCategory(syncList, newFilterKey, formattedName);
    setProducts(instantList);

    // Update URL search params
    if (!subSlug) {
      searchParams.delete("subcategory");
    } else {
      searchParams.set("subcategory", subSlug);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const categoryName = category?.name || (slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Products");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={generateCategorySEOTitle({ name: categoryName, slug: slug || "" })}
        description={generateCategorySEODescription({ name: categoryName, slug: slug || "" })}
        url={`https://durtup.shop/category/${slug || ""}`}
        category={{ name: categoryName, slug: slug || "" }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Categories", url: "/categories" },
          { name: categoryName, url: `/category/${slug || ""}` }
        ]}
        itemList={products.slice(0, 10).map(p => ({
          name: p.name,
          url: `/product/${p.slug || p.id}`,
          image: p.image,
          price: p.price,
        }))}
        faqs={DEFAULT_BANGLADESH_PRODUCT_FAQS}
      />

      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="px-3 sm:container py-2.5 sm:py-4">
          {/* Subcategory Pills Navigation Track (Clean, Unslop UI) */}
          {mainCat && mainCat.subcategories.length > 0 && (
            <div className="mb-4 select-none">
              <div
                ref={subScrollRef}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1.5 px-2 rounded-2xl",
                  "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
                  "border border-slate-200/90 dark:border-slate-800 shadow-2xs"
                )}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* "All [Category]" Button */}
                <button
                  onClick={() => handleSubcategorySelect("")}
                  data-subactive={!subcategoryParam}
                  className={cn(
                    "px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm rounded-xl transition-all duration-150 shrink-0 whitespace-nowrap select-none font-semibold cursor-pointer",
                    !subcategoryParam
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  All {mainCat.name}
                </button>

                {/* Subcategories Buttons */}
                {mainCat.subcategories.map((sub) => {
                  const isSelected = subcategoryParam === sub.slug.toLowerCase();
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubcategorySelect(sub.slug)}
                      data-subactive={isSelected}
                      className={cn(
                        "px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm rounded-xl transition-all duration-150 shrink-0 whitespace-nowrap select-none font-medium cursor-pointer",
                        isSelected
                          ? "bg-orange-600 text-white font-semibold shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Grid */}
          {productsLoading ? (
            <div className="py-16 sm:py-24 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-md">
                <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                <span className="text-sm font-semibold text-foreground/85">লোড হচ্ছে ক্যাটাগরি পণ্য...</span>
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                {products.slice(0, visibleCount).map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx} priority={idx < 4} />
                ))}
              </div>
              {visibleCount < products.length ? (
                <div ref={sentinelRef} className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs backdrop-blur-md animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                    <span className="text-xs font-semibold text-foreground/85">লোড হচ্ছে আরও পণ্য...</span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground/75">
                    Showing {Math.min(visibleCount, products.length)} of {products.length} products
                  </span>
                </div>
              ) : products.length > 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-1 bg-border rounded-full mb-2.5" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    সবগুলো {products.length}টি পণ্য প্রদর্শিত হয়েছে
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-card rounded-2xl border border-dashed p-8">
              <p className="text-muted-foreground text-sm sm:text-base font-semibold">
                {subcategoryParam
                  ? "No products found in this subcategory right now."
                  : "No products found in this category right now."}
              </p>
              {subcategoryParam ? (
                <button
                  onClick={() => handleSubcategorySelect("")}
                  className="text-orange-600 font-bold text-sm mt-3 inline-block hover:underline"
                >
                  View All {mainCat?.name || "Category"} Products →
                </button>
              ) : (
                <Link
                  to="/products"
                  className="text-orange-600 font-bold text-sm mt-3 inline-block hover:underline"
                >
                  View All Products →
                </Link>
              )}
            </div>
          )}

        </div>
      </main>


      <Footer />
    </div>
  );
}
