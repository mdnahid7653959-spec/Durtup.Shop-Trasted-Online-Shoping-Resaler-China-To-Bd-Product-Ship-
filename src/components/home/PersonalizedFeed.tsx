import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Flame, Smartphone, Shirt, Home } from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { useAuth } from "@/contexts/AuthContext";
import { getSmartProductImage } from "@/utils/productImageHelper";
import { ProductCard, type Product } from "@/components/products/ProductCard";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "recently_viewed_products";
const CACHED_PRODUCTS_KEY = "cached_personalized_products_v3";
let inMemoryProductsCache: Product[] | null = null;

type Row = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  regular_price: number;
  discount_price: number | null;
  rating_average: number | null;
  rating_count?: number | null;
  sold_count?: number | null;
  free_shipping?: boolean | null;
  is_new_arrival?: boolean | null;
  is_best_seller?: boolean | null;
  product_images?: { image_url: string; is_primary: boolean | null }[];
};

function primaryImage(p: Row): string {
  const primary =
    p.product_images?.find((i) => i.is_primary)?.image_url ||
    p.product_images?.[0]?.image_url;
  return getSmartProductImage(p.name, primary);
}

const CATEGORY_TABS = [
  { id: "all", label: "All For You", icon: Sparkles },
  { id: "deals", label: "Hot Deals", icon: Flame },
  { id: "gadgets", label: "Gadgets", icon: Smartphone },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "home", label: "Home", icon: Home },
];

export function PersonalizedFeed() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => {
    if (inMemoryProductsCache && inMemoryProductsCache.length > 0) return inMemoryProductsCache;
    try {
      const cached = sessionStorage.getItem(CACHED_PRODUCTS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryProductsCache = parsed;
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [selectedTab, setSelectedTab] = useState("all");
  const [loading, setLoading] = useState(() => !products || products.length === 0);

  useEffect(() => {
    if (inMemoryProductsCache && inMemoryProductsCache.length >= 6) {
      setProducts(inMemoryProductsCache);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        let viewedIds: string[] = [];
        if (user) {
          const { data } = await supabase
            .from("recently_viewed")
            .select("product_id, viewed_at")
            .eq("user_id", user.id)
            .order("viewed_at", { ascending: false })
            .limit(30);
          viewedIds = (data || []).map((r) => r.product_id);
        } else {
          try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
              const items = JSON.parse(stored) as { id: string }[];
              viewedIds = items.map((i) => i.id).slice(0, 30);
            }
          } catch {}
        }

        let topCategories: string[] = [];
        if (viewedIds.length > 0) {
          const { data: viewed } = await supabase
            .from("products")
            .select("category_id")
            .in("id", viewedIds);
          const counts = new Map<string, number>();
          (viewed || []).forEach((p) => {
            if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
          });
          topCategories = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
        }

        const cols =
          "id,name,slug,category_id,regular_price,discount_price,rating_average,rating_count,sold_count,free_shipping,is_new_arrival,is_best_seller,product_images(image_url,is_primary)";

        let rows: Row[] = [];
        if (topCategories.length > 0) {
          let q = supabase
            .from("products")
            .select(cols)
            .eq("status", "active")
            .in("category_id", topCategories)
            .order("view_count", { ascending: false })
            .order("sold_count", { ascending: false })
            .limit(12);
          if (viewedIds.length > 0) q = q.not("id", "in", `(${viewedIds.join(",")})`);
          const { data } = await q;
          rows = (data as Row[]) || [];
        }

        if (rows.length < 12) {
          const exclude = [...new Set([...viewedIds, ...rows.map((r) => r.id)])];
          let q = supabase
            .from("products")
            .select(cols)
            .eq("status", "active")
            .order("view_count", { ascending: false })
            .order("sold_count", { ascending: false })
            .order("rating_average", { ascending: false })
            .limit(12 - rows.length);
          if (exclude.length > 0) q = q.not("id", "in", `(${exclude.join(",")})`);
          const { data: fb } = await q;
          rows = [...rows, ...(((fb as Row[]) || []))];
        }

        if (rows.length < 12) {
          const { FAST_SEED_PRODUCTS } = await import("@/data/fastSeedCatalog");
          const needed = 12 - rows.length;
          const seedSlice = FAST_SEED_PRODUCTS.slice(0, needed).map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category_id: null,
            regular_price: p.originalPrice || p.price,
            discount_price: p.originalPrice ? p.price : null,
            rating_average: p.rating,
            rating_count: p.reviews,
            sold_count: p.sold,
            free_shipping: p.freeShipping ?? true,
            is_new_arrival: p.isNew ?? false,
            is_best_seller: p.isBestSeller ?? false,
            product_images: [{ image_url: p.image, is_primary: true }],
          }));
          rows = [...rows, ...seedSlice];
        }

        const mappedProducts: Product[] = rows.slice(0, 12).map((p, index) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: primaryImage(p),
          price: p.discount_price ?? p.regular_price,
          originalPrice: p.discount_price ? p.regular_price : undefined,
          rating: Number(p.rating_average) || 4.8,
          reviews: p.rating_count || 15,
          sold: p.sold_count || 45,
          freeShipping: p.free_shipping ?? true,
          isNew: p.is_new_arrival ?? index < 4,
          isBestSeller: p.is_best_seller ?? index % 3 === 0,
        }));

        setProducts(mappedProducts);
        inMemoryProductsCache = mappedProducts;
        try {
          sessionStorage.setItem(CACHED_PRODUCTS_KEY, JSON.stringify(mappedProducts));
        } catch {}
      } catch (err) {
        console.error("PersonalizedFeed load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const filteredProducts = useMemo(() => {
    if (selectedTab === "all") return products;
    if (selectedTab === "deals") return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
    if (selectedTab === "gadgets") return products.filter((p) => /phone|earbud|watch|charger|cable|smart|usb|mouse|keyboard|tech/i.test(p.name));
    if (selectedTab === "fashion") return products.filter((p) => /shirt|hoodie|pant|shoe|dress|t-shirt|bag|watch|glass|jacket/i.test(p.name));
    return products;
  }, [products, selectedTab]);

  if (loading || products.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden py-3">
      {/* Header */}
      <div className="px-3 pb-2.5 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">Just For You</h2>
            <p className="text-[10px] text-muted-foreground">Handpicked picks for your lifestyle</p>
          </div>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Clean 2-column mobile product grid */}
      <div className="px-3 pt-1 pb-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredProducts.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

