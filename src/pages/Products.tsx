import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { CombinedProductCard } from "@/components/products/CombinedProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronRight, Globe, X, SlidersHorizontal, ArrowUpDown, Tag, Sparkles, Camera, Store, Search, Loader2, AlertCircle, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { useCombinedSearch, CombinedProduct } from "@/hooks/useCombinedSearch";
import { useCategories } from "@/hooks/useProductSearch";
import { useCJSettings } from "@/hooks/useCJSettings";
import { SEOHead } from "@/components/SEOHead";
import { normalizeCategory, productMatchesCategory } from "@/utils/categoryHelper";
import { CATEGORIES_DATA } from "@/data/categoriesData";
import { ImageSearchModal } from "@/components/search/ImageSearchModal";
import { getVisualSearchSession, clearVisualSearchSession, fetchVisualSearchNextPage } from "@/utils/imageSearch";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";

const PRODUCTS_PER_PAGE = 24;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);

  const mapVisualProduct = (p: any, tier?: "best" | "similar", score?: number, reasons?: string[]): CombinedProduct => ({
    id: String(p.id),
    name: p.name,
    slug: p.slug || `product-${p.id}`,
    image: p.image,
    price: Number(p.price) || 0,
    originalPrice: p.originalPrice || (p as any).regular_price,
    rating: Number(p.rating) || 4.8,
    reviews: Number(p.reviews) || 15,
    sold: Number(p.sold) || 45,
    category: p.category || (p as any).category_name || "General",
    category_name: (p as any).category_name || p.category || "General",
    category_slug: (p as any).category_slug || (p as any).categorySlug,
    freeShipping: true,
    source: "local" as const,
    supplier_name: (p as any).supplier_name || "Durtup Marketplace",
    matchTier: tier || (p as any).matchTier || "similar",
    matchScore: score || (p as any).matchScore || 85,
    matchedReasons: reasons || (p as any).matchedReasons || ["Visual Match"]
  });

  const isVisualSearchMode = searchParams.get("visualSearch") === "true";
  const isVisualSearch = isVisualSearchMode;
  const initialVisualSession = isVisualSearchMode ? getVisualSearchSession() : null;

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(
    initialVisualSession?.previewUrl || null
  );
  const [visualConfidence, setVisualConfidence] = useState<string | null>(
    initialVisualSession?.confidence && initialVisualSession.confidence >= 60
      ? String(initialVisualSession.confidence)
      : null
  );
  const [visualProducts, setVisualProducts] = useState<CombinedProduct[] | null>(() => {
    if (!isVisualSearchMode || !initialVisualSession) return null;
    if (initialVisualSession.matchedProducts && initialVisualSession.matchedProducts.length > 0) {
      return initialVisualSession.matchedProducts.map((m) =>
        mapVisualProduct(m.product, m.matchTier, m.matchScore, m.matchedReasons)
      );
    }
    if (initialVisualSession.products && initialVisualSession.products.length > 0) {
      return initialVisualSession.products.map((p) => mapVisualProduct(p));
    }
    return null;
  });
  const [visualBestMatches, setVisualBestMatches] = useState<CombinedProduct[]>(() => {
    if (!initialVisualSession) return [];
    if (initialVisualSession.matchedProducts && initialVisualSession.matchedProducts.length > 0) {
      return initialVisualSession.matchedProducts
        .filter((m) => m.matchTier === "best")
        .map((m) => mapVisualProduct(m.product, m.matchTier, m.matchScore, m.matchedReasons));
    }
    return [];
  });
  const [visualSimilarProducts, setVisualSimilarProducts] = useState<CombinedProduct[]>(() => {
    if (!initialVisualSession) return [];
    if (initialVisualSession.matchedProducts && initialVisualSession.matchedProducts.length > 0) {
      const sim = initialVisualSession.matchedProducts
        .filter((m) => m.matchTier !== "best")
        .map((m) => mapVisualProduct(m.product, m.matchTier, m.matchScore, m.matchedReasons));
      return sim.length > 0
        ? sim
        : (initialVisualSession.products || []).map((p) => mapVisualProduct(p));
    }
    if (initialVisualSession.products && initialVisualSession.products.length > 0) {
      return initialVisualSession.products.map((p) => mapVisualProduct(p));
    }
    return [];
  });
  const [visualSessionKey, setVisualSessionKey] = useState<string | null>(
    initialVisualSession?.sessionKey || null
  );
  const [visualPage, setVisualPage] = useState<number>(initialVisualSession?.page || 1);
  const [visualHasMore, setVisualHasMore] = useState<boolean>(Boolean(initialVisualSession?.hasMore));
  const [visualTotal, setVisualTotal] = useState<number>(
    initialVisualSession?.total || initialVisualSession?.products?.length || 0
  );
  const [visualAiAnalysis, setVisualAiAnalysis] = useState<any>(initialVisualSession?.aiAnalysis || null);
  const [isLoadingMoreVisual, setIsLoadingMoreVisual] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visualSession = isVisualSearchMode ? (initialVisualSession || getVisualSearchSession()) : null;

  const rawSearch = searchParams.get("search") || searchParams.get("q");
  const searchQuery = rawSearch ? rawSearch.trim().replace(/\s+/g, " ") : undefined;
  const currentCategory = searchParams.get("category") || undefined;
  const currentSupplier = searchParams.get("supplier") || undefined;
  const currentSort = searchParams.get("sort") || (isVisualSearchMode ? "relevance" : (searchQuery ? "relevance" : "newest"));

  // Read visual search session and restore real matched products
  useEffect(() => {
    const syncVisualSession = () => {
      if (isVisualSearchMode) {
        const session = getVisualSearchSession();
        // If we are in visual search mode and there's a leftover search param that wasn't typed by user, remove it
        if (searchParams.has("search") && (!session?.keyword || session.keyword === "Visual Search")) {
          const cleanParams = new URLSearchParams(searchParams);
          cleanParams.delete("search");
          cleanParams.delete("q");
          setSearchParams(cleanParams, { replace: true });
          return;
        }
        if (session) {
          if (session.previewUrl) {
            setUploadedImagePreview(session.previewUrl);
          }
          setVisualSessionKey(session.sessionKey || null);
          setVisualPage(session.page || 1);
          setVisualHasMore(Boolean(session.hasMore));
          setVisualTotal(session.total || session.products?.length || 0);
          setVisualAiAnalysis(session.aiAnalysis || null);

          if (session.confidence && session.confidence >= 60) {
            setVisualConfidence(String(session.confidence));
          } else {
            setVisualConfidence(null);
          }

          if (session.matchedProducts && session.matchedProducts.length > 0) {
            const allMapped: CombinedProduct[] = session.matchedProducts.map((m) =>
              mapVisualProduct(m.product, m.matchTier, m.matchScore, m.matchedReasons)
            );
            const best = allMapped.filter((p) => p.matchTier === "best");
            const similar = allMapped.filter((p) => p.matchTier !== "best");

            setVisualProducts(allMapped);
            setVisualBestMatches(best);
            setVisualSimilarProducts(similar.length > 0 ? similar : allMapped);
            return;
          } else if (session.products && session.products.length > 0) {
            const allMapped = session.products.map((p) => mapVisualProduct(p));
            setVisualProducts(allMapped);
            setVisualBestMatches([]);
            setVisualSimilarProducts(allMapped);
            return;
          } else {
            // If no direct matches, fallback to top catalog products so user never sees empty screen
            const fallbackList = FAST_SEED_PRODUCTS.slice(0, 36).map((p) =>
              mapVisualProduct(p, "similar", 0, ["জনপ্রিয় ট্রেন্ডিং পণ্য"])
            );
            setVisualConfidence(null);
            setVisualProducts(fallbackList);
            setVisualBestMatches([]);
            setVisualSimilarProducts(fallbackList);
            return;
          }
        }

        // If no session exists at all (e.g. direct load without search)
        const fallbackList = FAST_SEED_PRODUCTS.slice(0, 36).map((p) =>
          mapVisualProduct(p, "similar", 0, ["জনপ্রিয় ট্রেন্ডিং পণ্য"])
        );
        setVisualConfidence(null);
        setVisualProducts(fallbackList);
        setVisualBestMatches([]);
        setVisualSimilarProducts(fallbackList);
      } else {
        setUploadedImagePreview(null);
        setVisualConfidence(null);
        setVisualProducts(null);
        setVisualBestMatches([]);
        setVisualSimilarProducts([]);
        setVisualSessionKey(null);
        setVisualHasMore(false);
      }
    };

    syncVisualSession();

    window.addEventListener("durtup_visual_search_updated", syncVisualSession);
    window.addEventListener("durtup_visual_search_cleared", syncVisualSession);
    window.addEventListener("storage", syncVisualSession);

    return () => {
      window.removeEventListener("durtup_visual_search_updated", syncVisualSession);
      window.removeEventListener("durtup_visual_search_cleared", syncVisualSession);
      window.removeEventListener("storage", syncVisualSession);
    };
  }, [isVisualSearchMode, searchParams, searchQuery]);

  const pathFilter = location.pathname.includes("flash-sale") ? "flash-sale"
    : location.pathname.includes("new-arrivals") ? "new"
    : location.pathname.includes("free-shipping") ? "free-shipping"
    : undefined;

  const currentFilter = searchParams.get("filter") || pathFilter || "all";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  const [minPriceInput, setMinPriceInput] = useState<string>(searchParams.get("minPrice") || "");
  const [maxPriceInput, setMaxPriceInput] = useState<string>(searchParams.get("maxPrice") || "");

  const params = {
    search: searchQuery,
    category: currentCategory,
    supplier: currentSupplier,
    sort: currentSort,
    filter: currentFilter !== "all" ? currentFilter : undefined,
    minPrice,
    maxPrice,
  };

  const { data: searchResults, isLoading, isError, refetch } = useCombinedSearch(params);
  const { data: categories } = useCategories();
  const { data: cjSettings } = useCJSettings();

  // Filter visually matched products if price, category, or search query is applied
  const filteredVisualProducts = useMemo(() => {
    if (!isVisualSearch || !visualProducts) return null;
    let list = visualProducts.filter((p) => {
      if (minPrice !== undefined && p.price < minPrice) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      if (currentCategory && currentCategory !== "all") {
        return productMatchesCategory(p, currentCategory);
      }
      return true;
    });

    // If a search query is present (e.g. "X01 Full Charge"), ensure products match the query tokens
    if (searchQuery && searchQuery.trim()) {
      const qTokens = searchQuery.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
      const queryMatched = list.filter((p) => {
        const nameLower = (p.name || "").toLowerCase();
        const catLower = (p.category || "").toLowerCase();
        return qTokens.some((tok) => nameLower.includes(tok) || catLower.includes(tok));
      });
      if (queryMatched.length > 0) {
        return queryMatched;
      }
    }

    return list;
  }, [isVisualSearch, visualProducts, minPrice, maxPrice, currentCategory, searchQuery]);

  const filteredBestMatches = useMemo(() => {
    if (!isVisualSearch || visualBestMatches.length === 0) return [];
    return visualBestMatches.filter((p) => {
      if (minPrice !== undefined && p.price < minPrice) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      if (currentCategory && currentCategory !== "all") {
        return productMatchesCategory(p, currentCategory);
      }
      return true;
    });
  }, [isVisualSearch, visualBestMatches, minPrice, maxPrice, currentCategory]);

  const filteredSimilarProducts = useMemo(() => {
    if (!isVisualSearch) return [];
    const bestIds = new Set(filteredBestMatches.map((p) => p.id));
    const source = visualSimilarProducts.length > 0 ? visualSimilarProducts : (visualProducts || []);
    return source.filter((p) => {
      if (bestIds.has(p.id)) return false;
      if (minPrice !== undefined && p.price < minPrice) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      if (currentCategory && currentCategory !== "all") {
        return productMatchesCategory(p, currentCategory);
      }
      return true;
    });
  }, [isVisualSearch, visualSimilarProducts, visualProducts, filteredBestMatches, minPrice, maxPrice, currentCategory]);

  // Visual search results are the EXCLUSIVE result source when isVisualSearch is true
  const localProducts = useMemo(() => {
    if (isVisualSearch) {
      if (filteredVisualProducts && filteredVisualProducts.length > 0) {
        if (searchQuery && searchQuery.trim() && visualSession?.keyword && visualSession.keyword !== "Visual Search") {
          const qTokens = searchQuery.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
          const relevant = filteredVisualProducts.filter((p) => {
            const nameLower = (p.name || "").toLowerCase();
            return qTokens.some((tok) => nameLower.includes(tok));
          });
          if (relevant.length > 0) {
            return relevant;
          }
        }
        return filteredVisualProducts;
      }
      if (visualProducts && visualProducts.length > 0) {
        return visualProducts;
      }
      return [];
    }
    return searchResults?.local || [];
  }, [isVisualSearch, filteredVisualProducts, visualProducts, visualSession?.keyword, searchQuery, searchResults]);

  const cjProducts = isVisualSearch ? [] : (searchResults?.cj || []);
  const searchIntent = searchResults?.intent;
  const totalCount = localProducts.length + cjProducts.length;

  const isEffectiveLoading = isVisualSearch ? (visualProducts === null) : isLoading;
  const isEffectiveError = isVisualSearch ? false : isError;

  // Reset visible pagination count whenever search or filters change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchQuery, currentCategory, currentSupplier, currentSort, currentFilter, minPrice, maxPrice, isVisualSearch]);

  const handleLoadMoreVisual = async () => {
    if (!visualSessionKey || !visualHasMore || isLoadingMoreVisual) return;
    setIsLoadingMoreVisual(true);
    try {
      const nextPage = visualPage + 1;
      const res = await fetchVisualSearchNextPage(visualSessionKey, nextPage, PRODUCTS_PER_PAGE);
      if (res.products && res.products.length > 0) {
        const moreMapped: CombinedProduct[] = res.products.map((m) => ({
          id: String(m.product.id),
          name: m.product.name,
          slug: m.product.slug || `product-${m.product.id}`,
          image: m.product.image,
          price: Number(m.product.price) || 0,
          originalPrice: m.product.originalPrice,
          rating: Number(m.product.rating) || 4.8,
          reviews: Number(m.product.reviews) || 15,
          sold: Number(m.product.sold) || 45,
          category: m.product.category || "General",
          category_name: m.product.category_name || m.product.category || "General",
          category_slug: m.product.category_slug,
          freeShipping: true,
          source: "local" as const,
          supplier_name: "Durtup Marketplace",
          matchTier: m.matchTier || "similar",
          matchScore: m.matchScore,
          matchedReasons: m.matchedReasons
        }));

        setVisualProducts((prev) => (prev ? [...prev, ...moreMapped] : moreMapped));
        setVisualSimilarProducts((prev) => [...prev, ...moreMapped]);
        setVisualPage(nextPage);
        setVisualHasMore(res.hasMore);
      } else {
        setVisualHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch next visual search page:", err);
    } finally {
      setIsLoadingMoreVisual(false);
    }
  };

  const isAutoLoadingRef = useRef(false);

  const loadNextBatch = useCallback(() => {
    if (isAutoLoadingRef.current) return;

    if (isVisualSearch) {
      if (visualHasMore && !isLoadingMoreVisual) {
        isAutoLoadingRef.current = true;
        handleLoadMoreVisual().finally(() => {
          setTimeout(() => {
            isAutoLoadingRef.current = false;
          }, 300);
        });
      } else if (visibleCount < localProducts.length) {
        isAutoLoadingRef.current = true;
        setVisibleCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, localProducts.length));
        setTimeout(() => {
          isAutoLoadingRef.current = false;
        }, 150);
      }
    } else {
      if (visibleCount < localProducts.length) {
        isAutoLoadingRef.current = true;
        setVisibleCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, localProducts.length));
        setTimeout(() => {
          isAutoLoadingRef.current = false;
        }, 150);
      }
    }
  }, [isVisualSearch, visualHasMore, isLoadingMoreVisual, visibleCount, localProducts.length]);

  // Engine 1: IntersectionObserver with generous 1000px early-trigger threshold
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

  // Engine 2: Throttled Window Scroll & Touchmove event listener (100% reliable continuous scroll on all devices)
  useEffect(() => {
    const hasMore = isVisualSearch 
      ? (visualHasMore || visibleCount < localProducts.length) 
      : visibleCount < localProducts.length;

    if (!hasMore) return;

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
  }, [loadNextBatch, isVisualSearch, visualHasMore, visibleCount, localProducts.length]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const applyPriceRange = () => {
    const newParams = new URLSearchParams(searchParams);
    if (minPriceInput && !isNaN(Number(minPriceInput))) {
      newParams.set("minPrice", minPriceInput);
    } else {
      newParams.delete("minPrice");
    }
    if (maxPriceInput && !isNaN(Number(maxPriceInput))) {
      newParams.set("maxPrice", maxPriceInput);
    } else {
      newParams.delete("maxPrice");
    }
    setSearchParams(newParams);
  };

  const clearPriceRange = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("minPrice");
    newParams.delete("maxPrice");
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    if (isVisualSearch) {
      const p = new URLSearchParams();
      p.set("visualSearch", "true");
      setSearchParams(p);
    } else {
      setSearchParams({});
    }
  };

  const hasUserTextQuery = Boolean(searchQuery && visualSession?.keyword && visualSession.keyword !== "Visual Search");

  const isSortActive = isVisualSearch
    ? Boolean(currentSort && currentSort !== "relevance")
    : Boolean(currentSort && currentSort !== "newest");

  const hasFilters = Boolean(
    (!isVisualSearch && searchQuery) ||
    (isVisualSearch && hasUserTextQuery) ||
    currentCategory ||
    isSortActive ||
    (currentFilter && currentFilter !== "all") ||
    (minPrice !== undefined || maxPrice !== undefined)
  );

  const availableCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    return CATEGORIES_DATA.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      bangla: c.bangla,
      image_url: c.image,
      icon: c.iconName
    }));
  }, [categories]);

  const normalizedCategory = useMemo(() => normalizeCategory(currentCategory), [currentCategory]);

  const activeCategoryObj = useMemo(() => {
    if (!currentCategory) return null;
    const targetSlug = normalizedCategory?.slug;
    return availableCategories.find(c => 
      c.slug === currentCategory || 
      c.id === currentCategory || 
      (targetSlug && (c.slug === targetSlug || c.id === targetSlug)) ||
      c.name.toLowerCase() === (currentCategory || "").toLowerCase() ||
      (normalizedCategory && (c.slug === normalizedCategory.parentSlug || c.id === normalizedCategory.parentSlug))
    );
  }, [availableCategories, currentCategory, normalizedCategory]);

  const selectedCategoryValue = activeCategoryObj?.slug || normalizedCategory?.slug || (currentCategory ? currentCategory.toLowerCase() : "all");

  const fallbackCategoryName = currentCategory
    ? normalizedCategory
      ? normalizedCategory.name
      : currentCategory.toLowerCase() === "home"
      ? "Home & Lifestyle"
      : currentCategory.toLowerCase() === "electronics"
      ? "Gadgets & Electronics"
      : currentCategory.toLowerCase().includes("women")
      ? "Women's Fashion"
      : currentCategory.toLowerCase().includes("men")
      ? "Men's Fashion"
      : currentCategory.toLowerCase() === "beauty"
      ? "Health & Beauty"
      : currentCategory.toLowerCase().includes("watch")
      ? "Watch"
      : currentCategory.toLowerCase() === "kids"
      ? "Kids Zone"
      : currentCategory.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : null;

  const pageHeading = isVisualSearch
    ? `Visual Search Results${hasUserTextQuery ? ` for "${searchQuery}"` : ""}`
    : searchQuery 
    ? `Results for "${searchQuery}"`
    : currentSupplier === "ecomseller"
    ? "Ecomseller BD Products"
    : currentSupplier === "mohasagor"
    ? "Mohasagor BD Products"
    : activeCategoryObj 
    ? activeCategoryObj.name 
    : normalizedCategory
    ? normalizedCategory.name
    : fallbackCategoryName
    ? fallbackCategoryName
    : currentFilter === "flash-sale"
    ? "Flash Sale & Deals"
    : currentFilter === "new"
    ? "New Arrivals"
    : currentFilter === "free-shipping"
    ? "Free Shipping Products"
    : "All Products";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead 
        title={`${pageHeading} in Bangladesh | Durtup.shop`}
        description={`Explore ${pageHeading} online at Durtup.shop. Best prices in Bangladesh, Cash on Delivery, genuine quality, and fast home delivery.`}
        url={hasFilters ? undefined : "https://durtup.shop/products"}
        noindex={Boolean(params.search || (hasFilters && (minPrice || maxPrice)))}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" }
        ]}
      />
      <Header />
      <main className="flex-1 max-w-full overflow-hidden">
        <div className="container py-4 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <aside className={`lg:w-64 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card border rounded-xl p-4 sticky top-24 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-orange-500" />
                    Filters
                  </div>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive">
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      Category
                    </label>
                    <Select 
                      value={selectedCategoryValue} 
                      onValueChange={(v) => updateFilter("category", v === "all" ? null : v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Categories</SelectItem>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat.id || cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                  {/* Sort By Filter */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      Sort By
                    </label>
                    <Select 
                      value={currentSort} 
                      onValueChange={(v) => updateFilter("sort", v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="relevance">Best Match</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High (৳)</SelectItem>
                        <SelectItem value="price-high">Price: High to Low (৳)</SelectItem>
                        <SelectItem value="trending">Most Popular</SelectItem>
                        <SelectItem value="rating">Top Rated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Special Filter Option */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                      Offers & Badges
                    </label>
                    <Select 
                      value={currentFilter} 
                      onValueChange={(v) => updateFilter("filter", v === "all" ? null : v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="flash-sale">Flash Sale & Deals</SelectItem>
                        <SelectItem value="new">New Arrivals</SelectItem>
                        <SelectItem value="free-shipping">Free Shipping</SelectItem>
                        <SelectItem value="featured">Featured Picks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="pt-2 border-t space-y-2">
                    <label className="text-xs font-semibold text-foreground block">
                      Price Range (৳)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                        className="h-8 text-xs px-2"
                      />
                      <span className="text-xs text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                        className="h-8 text-xs px-2"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={applyPriceRange} className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-500 text-white">
                        Apply
                      </Button>
                      {(minPrice !== undefined || maxPrice !== undefined) && (
                        <Button size="sm" variant="outline" onClick={clearPriceRange} className="h-7 text-xs px-2">
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Quick Price Range Presets */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMinPriceInput("");
                          setMaxPriceInput("500");
                          const p = new URLSearchParams(searchParams);
                          p.delete("minPrice");
                          p.set("maxPrice", "500");
                          setSearchParams(p);
                        }}
                        className="text-[11px] py-1 px-2 rounded border bg-muted/30 hover:bg-muted text-center transition-colors truncate"
                      >
                        Under ৳500
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMinPriceInput("500");
                          setMaxPriceInput("1000");
                          const p = new URLSearchParams(searchParams);
                          p.set("minPrice", "500");
                          p.set("maxPrice", "1000");
                          setSearchParams(p);
                        }}
                        className="text-[11px] py-1 px-2 rounded border bg-muted/30 hover:bg-muted text-center transition-colors truncate"
                      >
                        ৳500 - ৳1K
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMinPriceInput("1000");
                          setMaxPriceInput("2500");
                          const p = new URLSearchParams(searchParams);
                          p.set("minPrice", "1000");
                          p.set("maxPrice", "2500");
                          setSearchParams(p);
                        }}
                        className="text-[11px] py-1 px-2 rounded border bg-muted/30 hover:bg-muted text-center transition-colors truncate"
                      >
                        ৳1K - ৳2.5K
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMinPriceInput("2500");
                          setMaxPriceInput("");
                          const p = new URLSearchParams(searchParams);
                          p.set("minPrice", "2500");
                          p.delete("maxPrice");
                          setSearchParams(p);
                        }}
                        className="text-[11px] py-1 px-2 rounded border bg-muted/30 hover:bg-muted text-center transition-colors truncate"
                      >
                        ৳2,500+
                      </button>
                    </div>
                  </div>

                  {/* CJ Products Info */}
                  {cjSettings?.is_enabled && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                        <span>International products included</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground min-w-0 truncate">
                    {pageHeading}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {isEffectiveLoading ? "Searching products..." : `${totalCount} products found`}
                  </p>
                </div>
                
                <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters {hasFilters && `(${Array.from(searchParams.keys()).length})`}
                </Button>
              </div>

              {/* Flash Sale Exciting Deal Banner */}
              {currentFilter === "flash-sale" && (
                <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-lg relative overflow-hidden animate-in fade-in duration-200">
                  <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black tracking-wide uppercase flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-spin" /> Limited Time Event
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950 text-[11px] font-black tracking-wide uppercase">
                          UP TO 50% OFF
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        ⚡ Flash Sale & Mega Deals
                      </h2>
                      <p className="text-xs sm:text-sm text-white/90 font-medium">
                        সেরা সব ট্রেন্ডিং গ্যাজেট ও লাইফস্টাইল প্রডাক্টে সীমিত সময়ের বিশাল মূল্যছাড়!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ultra-Premium AI Visual Search Active Banner */}
              {isVisualSearch && (
                <div className="mb-6 rounded-2xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  {/* Top Ambient Gradient Accent Bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

                  <div className="p-4 sm:p-5">
                    {/* Micro Eyebrow Status Bar */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-bold tracking-wider uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Durtup Vision AI
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Catalog scanned with deep visual embeddings
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {visualConfidence && Number(visualConfidence) >= 60 ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                            ✨ {visualConfidence}% Match
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                            AI Verified
                          </Badge>
                        )}
                        {visualTotal > 0 && (
                          <span className="text-xs font-semibold text-muted-foreground hidden md:inline">
                            {visualTotal} catalog items found
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Scanned Photo & AI Recognition */}
                      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                        {uploadedImagePreview ? (
                          <div className="relative group shrink-0">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-orange-500/30 bg-muted/40 shadow-md">
                              <img
                                src={uploadedImagePreview}
                                alt="Your Uploaded Product"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-1">
                                <span className="text-[9px] font-bold text-white tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs">
                                  Your Photo
                                </span>
                              </div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-2 ring-background">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shrink-0">
                            <Camera className="h-8 w-8 stroke-[1.75]" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                              Visual Search Results
                            </h2>
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                            {hasUserTextQuery ? (
                              <>
                                Matched from catalog for photo with search query:{" "}
                                <span className="font-bold text-orange-600">"{searchQuery}"</span>
                              </>
                            ) : visualAiAnalysis?.product_type ? (
                              <>
                                AI recognized:{" "}
                                <span className="font-bold text-foreground capitalize">
                                  {visualAiAnalysis.product_type}
                                </span>{" "}
                                {visualTotal > 0 ? "and ranked matching items from our live catalog." : "— no matching items found in our current catalog."}
                              </>
                            ) : (
                              "Showing items with visual and semantic similarity from Durtup catalog."
                            )}
                          </p>

                          {/* AI Neural Attribute Insights Chips */}
                          {visualAiAnalysis && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                              {visualAiAnalysis.product_type && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] font-semibold text-orange-700 dark:text-orange-300">
                                  <Tag className="w-3 h-3 text-orange-500 shrink-0" />
                                  <span className="text-muted-foreground font-normal">Type:</span>
                                  <span className="capitalize">{visualAiAnalysis.product_type}</span>
                                </div>
                              )}

                              {visualAiAnalysis.primary_color && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/70 border border-border text-[11px] font-semibold text-foreground">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                    style={{
                                      backgroundColor:
                                        visualAiAnalysis.primary_color.toLowerCase().includes("black") ? "#18181b"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("white") ? "#ffffff"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("blue") ? "#2563eb"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("red") ? "#dc2626"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("green") ? "#16a34a"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("pink") ? "#ec4899"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("silver") || visualAiAnalysis.primary_color.toLowerCase().includes("grey") ? "#94a3b8"
                                        : visualAiAnalysis.primary_color.toLowerCase().includes("gold") ? "#eab308"
                                        : "#f97316"
                                    }}
                                  />
                                  <span className="text-muted-foreground font-normal">Color:</span>
                                  <span className="capitalize">{visualAiAnalysis.primary_color}</span>
                                </div>
                              )}

                              {visualAiAnalysis.brand && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/70 border border-border text-[11px] font-semibold text-foreground">
                                  <span className="text-muted-foreground font-normal">Brand:</span>
                                  <span>{visualAiAnalysis.brand}</span>
                                </div>
                              )}

                              {visualAiAnalysis.model && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/70 border border-border text-[11px] font-semibold text-foreground">
                                  <span className="text-muted-foreground font-normal">Model:</span>
                                  <span>{visualAiAnalysis.model}</span>
                                </div>
                              )}

                              {visualAiAnalysis.category && visualAiAnalysis.category !== "general" && (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/70 border border-border text-[11px] font-semibold text-foreground">
                                  <span className="text-muted-foreground font-normal">Category:</span>
                                  <span className="capitalize">{visualAiAnalysis.category.replace(/-/g, " ")}</span>
                                </div>
                              )}

                              {visualTotal > 0 ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{visualTotal} Matches</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                  <span>0 Matches found</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Action Controls */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                        <Button
                          size="sm"
                          onClick={() => setImageSearchOpen(true)}
                          className="h-9 px-3.5 text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl shadow-sm shadow-orange-600/20 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Upload Another Photo</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            clearVisualSearchSession();
                            const p = new URLSearchParams(searchParams);
                            p.delete("visualSearch");
                            p.delete("search");
                            p.delete("q");
                            setSearchParams(p);
                          }}
                          className="h-9 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl border-border/80 hover:bg-muted/50 cursor-pointer"
                        >
                          View All Products
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gemini AI Spelling Correction Suggestion Banner */}
              {searchIntent?.spellingCorrected && searchIntent?.correctedQuery && (
                <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-600 shrink-0" />
                    <span>
                      Did you mean:{" "}
                      <button
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.set("search", searchIntent.correctedQuery!);
                          p.set("q", searchIntent.correctedQuery!);
                          setSearchParams(p);
                        }}
                        className="font-bold text-orange-600 underline hover:text-orange-700 cursor-pointer"
                      >
                        {searchIntent.correctedQuery}
                      </button>
                      ?
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline font-medium">
                    AI Spelling Assistant
                  </span>
                </div>
              )}

              {/* Gemini AI Detected Attributes & Intent Pills (Text search only) */}
              {!isVisualSearch && searchIntent && (searchIntent.attributes?.color || searchIntent.attributes?.gender || searchIntent.attributes?.style) && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3.5 animate-in fade-in duration-200">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mr-1">
                    <Sparkles className="h-3 w-3 text-orange-600" />
                    AI Detected:
                  </span>
                  {searchIntent.attributes.color && (
                    <Badge variant="outline" className="text-xs font-medium bg-muted/40 border-orange-500/30">
                      Color: <strong className="ml-1 text-foreground">{searchIntent.attributes.color}</strong>
                    </Badge>
                  )}
                  {searchIntent.attributes.gender && (
                    <Badge variant="outline" className="text-xs font-medium bg-muted/40 border-orange-500/30 capitalize">
                      Gender: <strong className="ml-1 text-foreground">{searchIntent.attributes.gender}</strong>
                    </Badge>
                  )}
                  {searchIntent.attributes.style && (
                    <Badge variant="outline" className="text-xs font-medium bg-muted/40 border-orange-500/30 capitalize">
                      Style: <strong className="ml-1 text-foreground">{searchIntent.attributes.style}</strong>
                    </Badge>
                  )}
                </div>
              )}

              {/* Active Filter Badges */}
              {hasFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-xl bg-muted/30 border">
                  <span className="text-xs text-muted-foreground font-medium mr-1">Active:</span>
                  {(!isVisualSearch && searchQuery) || (isVisualSearch && hasUserTextQuery && searchQuery) ? (
                    <Badge variant="secondary" className="gap-1 text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                      Search: "{searchQuery}"
                      <button 
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.delete("search");
                          p.delete("q");
                          setSearchParams(p);
                        }} 
                        className="ml-1 hover:text-destructive"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null}
                  {currentCategory && (
                    <Badge variant="secondary" className="gap-1 text-xs font-normal">
                      Category: {activeCategoryObj?.name || currentCategory}
                      <button onClick={() => updateFilter("category", null)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {isSortActive && (
                    <Badge variant="secondary" className="gap-1 text-xs font-normal">
                      Sort: {currentSort}
                      <button onClick={() => updateFilter("sort", isVisualSearch ? "relevance" : "newest")} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {currentFilter && currentFilter !== "all" && (
                    <Badge variant="secondary" className="gap-1 text-xs font-normal">
                      Filter: {currentFilter}
                      <button onClick={() => updateFilter("filter", null)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(minPrice !== undefined || maxPrice !== undefined) && (
                    <Badge variant="secondary" className="gap-1 text-xs font-normal">
                      Price: ৳{minPrice || 0} - {maxPrice ? `৳${maxPrice}` : "Any"}
                      <button onClick={clearPriceRange} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <button onClick={clearFilters} className="text-xs text-orange-600 hover:underline font-medium ml-auto">
                    Reset all
                  </button>
                </div>
              )}

              {isEffectiveLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-xl mb-3" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : isEffectiveError ? (
                <div className="text-center py-16 px-4 max-w-md mx-auto">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">
                    Unable to load products
                  </h3>
                  <p className="text-xs text-muted-foreground mb-5">
                    Please check your internet connection and try again.
                  </p>
                  <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Retry
                  </Button>
                </div>
              ) : totalCount > 0 ? (
                <>
                  {cjProducts.length > 0 && (
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        International Products
                      </Badge>
                    </div>
                  )}

                  {/* Local Products Grid (with Visual Search Tier Support) */}
                  {localProducts.length > 0 && (
                    <div className="space-y-4 mb-8">
                      {isVisualSearch && filteredBestMatches.length > 0 ? (
                        <>
                          {/* Tier 1: Spotlight Best Match */}
                          <div className="mb-8 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] via-card to-card p-4 sm:p-5 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-emerald-500/20">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                                  Top Verified Match
                                </Badge>
                                <span className="text-xs sm:text-sm font-semibold text-foreground">
                                  Highest visual & catalog alignment
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">
                                {filteredBestMatches.length === 1 ? "1 exact catalog match found" : `${filteredBestMatches.length} top matches found`}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                              {filteredBestMatches.map((product, idx) => (
                                <ProductCard key={`best-${product.id}`} product={product} priority={idx < 4} />
                              ))}
                            </div>
                          </div>

                          {/* Tier 2 & 3: Similar & Alternative Products */}
                          {filteredSimilarProducts.length > 0 && (
                            <div className="space-y-4 mb-8">
                              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                <div className="flex items-center gap-2.5">
                                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                                    Similar & Alternative Products
                                  </h3>
                                  <Badge variant="secondary" className="text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    {filteredSimilarProducts.length} items
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                  Related alternatives from catalog
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {filteredSimilarProducts.slice(0, visibleCount).map((product) => (
                                  <ProductCard key={`sim-${product.id}`} product={product} />
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : isVisualSearch ? (
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between pb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-foreground">
                                Matching Products
                              </h3>
                              <Badge variant="secondary" className="text-xs font-semibold">
                                {localProducts.length} items
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              Ranked by visual similarity
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            {localProducts.slice(0, visibleCount).map((product, idx) => (
                              <ProductCard key={product.id} product={product} priority={idx < 4} />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                          {localProducts.slice(0, visibleCount).map((product, idx) => (
                            <ProductCard key={product.id} product={product} priority={idx < 4} />
                          ))}
                        </div>
                      )}

                      {(isVisualSearch ? (visualHasMore || visibleCount < localProducts.length) : visibleCount < localProducts.length) ? (
                        <div ref={sentinelRef} className="py-8 flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs backdrop-blur-md animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                            <span className="text-xs font-semibold text-foreground/85">
                              {isVisualSearch && isLoadingMoreVisual
                                ? "আরও ভিজ্যুয়াল প্রোডাক্ট খোঁজা হচ্ছে..."
                                : "আরও প্রোডাক্ট লোড হচ্ছে..."
                              }
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground/75">
                            Showing {Math.min(visibleCount, localProducts.length)} {isVisualSearch && visualTotal > 0 ? `of ${visualTotal}` : `of ${localProducts.length}`} products
                          </span>
                        </div>
                      ) : localProducts.length > 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-1 bg-border rounded-full mb-2.5" />
                          <p className="text-xs font-semibold text-muted-foreground">
                            সবগুলো {localProducts.length}টি প্রোডাক্ট প্রদর্শিত হয়েছে
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* CJ Products Section */}
                  {cjProducts.length > 0 && (
                    <>
                      {localProducts.length > 0 && (
                        <div className="flex items-center gap-3 my-6">
                          <div className="h-px flex-1 bg-border" />
                          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                            <Globe className="h-3.5 w-3.5" />
                            International Products
                          </Badge>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {cjProducts.map(product => (
                          <CombinedProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : isVisualSearch ? (
                <div className="text-center py-16 px-4 max-w-md mx-auto animate-in fade-in duration-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shadow-xs">
                    <Camera className="h-8 w-8 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    No matching products found for this photo
                  </h3>
                  <p className="text-sm font-semibold text-orange-600 mb-1">
                    আপনার আপলোড করা ছবির সাথে মিল থাকা কোনো প্রোডাক্ট পাওয়া যায়নি
                  </p>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    We could not find an identical match in our current catalog. Try uploading a clearer photo or browsing our products.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <Button onClick={() => setImageSearchOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer" size="sm">
                      <Camera className="h-4 w-4 mr-1.5" /> Upload Another Photo
                    </Button>
                    <Button onClick={() => {
                      clearVisualSearchSession();
                      const p = new URLSearchParams(searchParams);
                      p.delete("visualSearch");
                      p.delete("search");
                      p.delete("q");
                      setSearchParams(p);
                    }} variant="outline" size="sm" className="text-xs font-semibold rounded-xl cursor-pointer">
                      Browse All Products
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 px-4 max-w-md mx-auto animate-in fade-in duration-200">
                  <div className="w-14 h-14 mx-auto mb-3.5 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                    {searchQuery ? `No matching products found for "${searchQuery}"` : "No products found"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                    {searchQuery
                      ? "We couldn't find any relevant products matching this exact search in our catalog."
                      : "Try adjusting your filters or search terms."}
                  </p>

                  {/* 3 Dedicated Options: Try another search, Browse related category, Upload an image */}
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
                          if (searchInput) {
                            searchInput.focus();
                            searchInput.select();
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        Try Another Search
                      </Button>

                      {searchIntent?.category && searchIntent.category !== "general" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const p = new URLSearchParams();
                            p.set("category", searchIntent.category);
                            setSearchParams(p);
                          }}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          <Tag className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                          Browse Category
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setImageSearchOpen(true)}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                        Upload a Photo
                      </Button>
                    </div>

                    {searchQuery && (
                      <div className="pt-3 border-t">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Popular In Catalog
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {["T-Shirt", "Smart Watch", "Mobile Phone", "Trimmer", "Sneakers", "Wireless Earbuds"].map((kw) => (
                            <button
                              key={kw}
                              onClick={() => {
                                const p = new URLSearchParams(searchParams);
                                p.set("search", kw);
                                p.delete("q");
                                setSearchParams(p);
                              }}
                              className="text-xs px-3 py-1 rounded-full border bg-muted/40 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-600 transition-colors cursor-pointer"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button onClick={clearFilters} variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <ImageSearchModal
        open={imageSearchOpen}
        onOpenChange={setImageSearchOpen}
      />
      <Footer />
    </div>
  );
}
