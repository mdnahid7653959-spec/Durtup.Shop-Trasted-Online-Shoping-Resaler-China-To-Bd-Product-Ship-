import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  getCachedMohasagorProducts, 
  getSyncProducts, 
  filterProductsByCategory,
  hydrateCatalog,
  isCompleteCatalogReady 
} from "@/utils/mohasagorCache";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { supabase } from "@/lib/firebaseAdapter";
import { 
  ChevronRight, Loader2, Package, 
  Smartphone, Shirt, Home, Dumbbell, Gamepad2, 
  Sparkles, Car, Gem, Baby, Watch, Headphones, 
  Wrench, ShoppingBag, Gift, Tag, LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES_DATA, type MainCategoryItem } from "@/data/categoriesData";
import { optimizeImageUrl } from "@/utils/productImageHelper";

const categoryIcons: Record<string, LucideIcon> = {
  "gadgets-electronics": Smartphone,
  "mens-fashion": Shirt,
  "womens-fashion": Sparkles,
  "home-lifestyle": Home,
  "kids-zone": Baby,
  "foods": ShoppingBag,
  "winter": Shirt,
  "watch": Watch,
  "customize-gift": Gift,
  "offer": Tag,
  "others": Package,
  "electronics": Smartphone,
  "fashion": Shirt,
  "home": Home,
  "beauty": Sparkles,
  "watches": Watch,
  "kids": Baby,
};

const getCategoryIcon = (slug: string): LucideIcon => {
  return categoryIcons[slug] || ShoppingBag;
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<MainCategoryItem[]>(CATEGORIES_DATA);
  const [selectedCategory, setSelectedCategory] = useState<MainCategoryItem | null>(CATEGORIES_DATA[0]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [productsLoading, setProductsLoading] = useState<boolean>(() => !isCompleteCatalogReady());

  // 1. Instant 0ms product initialization
  const [products, setProducts] = useState<Product[]>(() => {
    const syncList = getSyncProducts();
    const initialCat = CATEGORIES_DATA[0];
    return filterProductsByCategory(syncList, initialCat.slug, initialCat.name);
  });

  // Fetch products immediately when category or subcategory changes (0ms delay)
  useEffect(() => {
    if (!selectedCategory) return;
    const syncList = getSyncProducts();
    const filterKey = selectedSubcategory || selectedCategory.slug;
    const instantFiltered = filterProductsByCategory(syncList, filterKey, selectedCategory.name);
    setProducts(instantFiltered);
    if (instantFiltered.length > 0 || isCompleteCatalogReady()) {
      setProductsLoading(false);
    }
  }, [selectedCategory, selectedSubcategory]);

  // Active hydration trigger on mount and background catalog update listener
  useEffect(() => {
    let isMounted = true;

    hydrateCatalog().then((fullList) => {
      if (!isMounted || !selectedCategory) return;
      const filterKey = selectedSubcategory || selectedCategory.slug;
      const instantFiltered = filterProductsByCategory(fullList, filterKey, selectedCategory.name);
      setProducts(instantFiltered);
      setProductsLoading(false);
    }).catch(() => {
      if (isMounted) setProductsLoading(false);
    });

    const handleUpdate = () => {
      if (!selectedCategory) return;
      const syncList = getSyncProducts();
      const filterKey = selectedSubcategory || selectedCategory.slug;
      const instantFiltered = filterProductsByCategory(syncList, filterKey, selectedCategory.name);
      setProducts(instantFiltered);
      if (instantFiltered.length > 0 || isCompleteCatalogReady()) {
        setProductsLoading(false);
      }
    };

    window.addEventListener("mohasagor_products_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("mohasagor_products_updated", handleUpdate);
    };
  }, [selectedCategory, selectedSubcategory]);

  const handleCategoryClick = (category: MainCategoryItem) => {
    navigate(`/category/${category.slug}`);
  };

  const handleParentClick = (category: MainCategoryItem) => {
    setSelectedCategory(category);
    setSelectedSubcategory("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="All Product Categories - Durtup.shop Bangladesh"
        description="Browse all shopping categories on Durtup.shop: gadgets, electronics, smart watches, men's & women's fashion, earbuds, and lifestyle products with Cash on Delivery across Bangladesh."
        url="https://durtup.shop/categories"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "All Categories", url: "/categories" },
        ]}
        itemList={categories.map(c => ({
          name: c.name,
          url: `/category/${c.slug}`,
          image: c.image,
        }))}
      />
      <Header />
      
      <main className="flex-1 pb-20 md:pb-0">
        {/* Mobile: Split sidebar + subcategories + products */}
        <div className="md:hidden flex h-[calc(100vh-60px-60px)]">
          {/* Left sidebar - All 11 Categories */}
          <div className="w-24 bg-muted/40 border-r border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0 scrollbar-none">
            {categories.map((category) => {
              const isSelected = selectedCategory?.id === category.id;
              const IconComponent = getCategoryIcon(category.slug);

              return (
                <button
                  key={category.id}
                  onClick={() => handleParentClick(category)}
                  className={cn(
                    "w-full p-2.5 flex flex-col items-center gap-1 text-center transition-colors border-l-3 relative",
                    isSelected
                      ? "bg-background border-l-orange-600 text-orange-600 font-bold shadow-2xs"
                      : "border-l-transparent text-muted-foreground hover:bg-background/50 font-medium"
                  )}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <img
                      src={category.image || "/category-gadgets.webp"}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/category-gadgets.webp";
                      }}
                    />
                  </div>
                  <span className="text-[10px] line-clamp-2 leading-tight">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right content - Subcategories chips & Products */}
          <div className="flex-1 overflow-y-auto p-2.5">
            {selectedCategory && (
              <>
                {/* Header Banner */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div>
                    <h2 className="text-sm font-extrabold text-foreground">
                      {selectedCategory.name}
                    </h2>
                  </div>
                  <Link
                    to={`/category/${selectedCategory.slug}`}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Subcategory Pills Row */}
                {selectedCategory.subcategories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 mb-2.5">
                    <button
                      onClick={() => setSelectedSubcategory("")}
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-colors",
                        !selectedSubcategory
                          ? "bg-orange-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      All
                    </button>
                    {selectedCategory.subcategories.map((sub) => {
                      const isSubActive = selectedSubcategory === sub.slug;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSubcategory(sub.slug)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 transition-colors whitespace-nowrap",
                            isSubActive
                              ? "bg-orange-600 text-white font-bold shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-50"
                          )}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Products Grid */}
                {productsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-card rounded-xl border p-4">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground text-xs font-semibold">No products found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop: Rich Categories Grid with Subcategory Flyouts */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                All Product Categories
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our full catalog categorized across 11 major departments with subcategory filters
              </p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/60 px-3 py-1 rounded-full">
              {categories.length} Major Categories
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.slug);

              return (
                <div 
                  key={category.id} 
                  className="bg-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all hover:border-orange-500/40 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
                        <img
                          src={category.image || "/category-gadgets.webp"}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.onerror = null;
                            target.src = "/category-gadgets.webp";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/category/${category.slug}`}
                          className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-orange-600 transition-colors block truncate"
                        >
                          {category.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {category.subcategories.length} subcategories
                        </p>
                      </div>
                    </div>

                    {/* Subcategories list */}
                    <div className="grid grid-cols-2 gap-1.5 mb-4">
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/category/${category.slug}?subcategory=${sub.slug}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 truncate"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* View Category Button */}
                  <Link
                    to={`/category/${category.slug}`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-600 hover:text-white font-bold text-xs flex items-center justify-between text-slate-800 dark:text-slate-200 transition-all"
                  >
                    <span>Browse All {category.name}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
