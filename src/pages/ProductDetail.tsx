import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingCart, ShoppingBag, Star, Shield, RotateCcw, Minus, Plus, Loader2, Play, ChevronLeft, ChevronRight, Share2, Zap, MessageSquare, ShieldCheck, Store, Truck, Award, Sparkles, TrendingUp, Package, ZoomIn, ZoomOut, X, Maximize2, Ruler, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/firebaseAdapter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useProductRealtimeSync } from "@/hooks/useRealtimeSync";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useSmartBack } from "@/hooks/useSmartBack";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { ProductReviews } from "@/components/products/ProductReviews";
import { StoreDetails } from "@/components/products/StoreDetails";
import { ProductDescriptionSection } from "@/components/products/ProductDescriptionSection";
import { getCachedMohasagorProducts, findMohasagorProduct, findMohasagorProductSync, findSeriesImages, FALLBACK_SUPPLIER_PRODUCTS } from "@/utils/mohasagorCache";
import { calculateProductPrice } from "@/utils/pricingMargin";
import { getSmartProductImage, getDirectImageUrl, optimizeImageUrl, getResponsiveImageSrcSet, PRODUCT_DETAIL_SIZES, getCategoryFallbackImage, getCategoryFallbackImages } from "@/utils/productImageHelper";
import { getEnhancedProductDescription } from "@/utils/productDescriptionHelper";
import { extractProductVariants, getColorHex, sortVariantValues, type ProductVariant } from "@/utils/productVariantHelper";
import { db } from "@/integrations/firebase/client";
import { getFastProduct, saveFastProduct } from "@/utils/fastProductStorage";
import { ProductZoomViewer } from "@/components/products/ProductZoomViewer";
import { SEOHead } from "@/components/SEOHead";
import { generateProductSEOTitle, generateProductSEODescription, DEFAULT_BANGLADESH_PRODUCT_FAQS } from "@/utils/seoHelper";
import { getCanonicalProductUrl } from "@/utils/productSlugHelper";
import { trackViewContent, trackAddToCart } from "@/components/FacebookPixel";

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean | null;
  sort_order: number | null;
}
interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  regular_price: number;
  discount_price: number | null;
  stock_quantity: number;
  free_shipping: boolean;
  rating_average: number;
  rating_count: number;
  sold_count: number;
  is_featured: boolean;
  warranty_info: string | null;
  return_policy: string | null;
  color?: string | null;
  video_url?: string | null;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  category_id?: string | null;
  brand_id?: string | null;
  tags?: string[] | null;
  seller_id?: string | null;
}
const defaultImages = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600' fill='%23f8fafc'><rect width='600' height='600' rx='30'/><g transform='translate(250, 240)' fill='none' stroke='%2394a3b8' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'><rect x='10' y='20' width='80' height='70' rx='10'/><circle cx='35' cy='45' r='10'/><path d='M10 75 l25-25 l20 20 l25-25 l10 10'/></g><text x='300' y='360' font-family='sans-serif' font-size='20' font-weight='600' fill='%2364748b' text-anchor='middle'>No Image Uploaded</text></svg>"
];

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
};

function MobileProductTopBar() {
  const handleSmartBack = useSmartBack();
  return (
    <div className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-foreground border-b border-slate-100 dark:border-slate-800 shadow-xs w-full max-w-[100vw]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 w-full max-w-full">
        <button 
          onClick={handleSmartBack} 
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 rounded-full shrink-0 flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer" 
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate flex-1 text-center">
          Product Details
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <Link to="/wishlist" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 rounded-full text-slate-700 dark:text-slate-200" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 rounded-full text-slate-700 dark:text-slate-200" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}



function InlineStoreBar({ sellerId, onContactSeller, contactingSeller }: {
  sellerId: string;
  onContactSeller: () => void;
  contactingSeller: boolean;
}) {
  const { data: store, isLoading } = useQuery({
    queryKey: ["inline-store", sellerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolve_product_seller", {
        _product_seller_id: sellerId,
      });

      if (error) {
        console.error("Inline store resolve error:", error);
        return null;
      }

      return Array.isArray(data) ? data[0] : data;
    },
    enabled: !!sellerId,
  });

  if (isLoading) {
    return <div className="h-16 mt-4 rounded-xl bg-muted animate-pulse" />;
  }

  const storeName = store?.shop_name || "Durtup Official";

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border mt-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
        {store?.shop_logo ? (
          <img src={store.shop_logo} alt={storeName} className="w-full h-full object-cover" />
        ) : (
          <Store className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground truncate">{storeName}</span>
          {(store?.is_featured ?? true) && <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
        </div>
        {store?.rating_average != null ? (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="text-xs text-muted-foreground">
              {Number(store.rating_average).toFixed(1)} ({store.rating_count || 0})
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Trusted marketplace seller</span>
        )}
      </div>
      <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0" onClick={onContactSeller} disabled={contactingSeller}>
        {contactingSeller ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Chat</span>
      </Button>
    </div>
  );
}

// Helper to extract clean deduplication key from image URL
// (handles proxy wrappers like wsrv.nl, CDN signed tokens, and query strings)
export const extractImageDedupeKey = (url: string): string => {
  if (!url || typeof url !== "string") return "";
  try {
    let target = url.trim();
    if (target.includes("wsrv.nl/?url=") || target.includes("wsrv.nl?url=")) {
      const match = target.match(/[?&]url=([^&]+)/);
      if (match) {
        target = decodeURIComponent(match[1]);
      }
    }
    const clean = decodeURIComponent(target).split("?")[0].split("#")[0].trim();
    const parts = clean.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(-2).join("/").toLowerCase();
    } else if (parts.length === 1) {
      return parts[0].toLowerCase();
    }
    return clean.toLowerCase();
  } catch {
    return url.toLowerCase().split("?")[0];
  }
};

// Helper to map images from Mohasagor / Dropshipping / Supplier API
const mapSupplierImages = (raw: any): ProductImage[] => {
  const product_images: ProductImage[] = [];
  const base = "https://mohasagor.com.bd";
  
  const resolveUrl = (url: any): string => {
    if (!url || typeof url !== "string") return "";
    let trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
      return trimmed;
    }
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
  };

  const addedKeys = new Set<string>();
  const addImg = (url: any) => {
    const u = resolveUrl(url);
    if (!u) return;

    // Normalize and extract filename to prevent duplicates with proxy prefixes or query strings
    const key = extractImageDedupeKey(u);

    if (!addedKeys.has(key)) {
      addedKeys.add(key);
      product_images.push({
        id: `img-${product_images.length}`,
        image_url: u,
        is_primary: product_images.length === 0,
        sort_order: product_images.length
      });
    }
  };

  // 1. Check raw.product_images array (objects or strings)
  if (Array.isArray(raw.product_images) && raw.product_images.length > 0) {
    raw.product_images.forEach((img: any) => {
      if (typeof img === "string") {
        addImg(img);
      } else if (img && typeof img === "object") {
        addImg(img.product_image || img.image_url || img.image || img.url || img.path || img.src);
      }
    });
  }

  // 2. Check raw.images array (objects or strings)
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    raw.images.forEach((img: any) => {
      if (typeof img === "string") {
        addImg(img);
      } else if (img && typeof img === "object") {
        addImg(img.image_url || img.url || img.image || img.src);
      }
    });
  }

  // 3. Check gallery and photos array or comma-separated strings
  if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    raw.photos.forEach((p: any) => addImg(p));
  } else if (typeof raw.photos === "string" && raw.photos.includes(",")) {
    raw.photos.split(",").forEach((p: string) => addImg(p));
  }

  if (Array.isArray(raw.gallery) && raw.gallery.length > 0) {
    raw.gallery.forEach((g: any) => addImg(g));
  } else if (typeof raw.gallery === "string" && raw.gallery.includes(",")) {
    raw.gallery.split(",").forEach((g: string) => addImg(g));
  }

  if (Array.isArray(raw.gallery_images) && raw.gallery_images.length > 0) {
    raw.gallery_images.forEach((g: any) => addImg(g));
  }

  // 4. Extract all variant photos (e.g. from color/style options)
  if (Array.isArray(raw.product_variants) && raw.product_variants.length > 0) {
    raw.product_variants.forEach((v: any) => {
      if (v && typeof v === "object") {
        addImg(v.image || v.image_url || v.variant_image || v.photo || v.img);
      }
    });
  }
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    raw.variants.forEach((v: any) => {
      if (v && typeof v === "object") {
        addImg(v.image || v.image_url || v.variant_image || v.photo || v.img);
      }
    });
  }

  // 5. Single image properties
  if (raw.thumbnail_img) addImg(raw.thumbnail_img);
  if (raw.image_url) addImg(raw.image_url);
  if (raw.image) addImg(raw.image);
  if (raw.thumbnail) addImg(raw.thumbnail);
  if (raw.photo) addImg(raw.photo);
  if (raw.featured_image) addImg(raw.featured_image);

  return product_images;
};

// Helper to map supplier product to Product interface (Price MUST match card price exactly)
const mapSupplierProduct = (raw: any, productSlug: string, imagesArr: ProductImage[]): Product => {
  let sellingPrice = 0;
  let regularPrice: number | null = null;

  // Check if product is already processed with final price (e.g. from mohasagorCache or home products)
  if (raw.discount_price !== undefined || raw.originalPrice !== undefined) {
    sellingPrice = Number(raw.discount_price || raw.price || 0);
    regularPrice = raw.originalPrice || raw.regular_price ? Number(raw.originalPrice || raw.regular_price) : null;
  } else {
    // Direct raw API object - calculate with dynamic margin
    const exactRetailPrice = parseFloat(raw.price) || parseFloat(raw.sale_price) || 0;
    const rawRegularPrice = parseFloat(raw.regular_price) || 0;

    const calc = calculateProductPrice(exactRetailPrice, undefined, rawRegularPrice);
    sellingPrice = calc.price;
    regularPrice = calc.regularPrice;
  }

  const variants = extractProductVariants(raw);

  return {
    id: String(raw.id || `prod_${Date.now()}`),
    name: raw.name || raw.title || "Product",
    slug: productSlug,
    short_description: raw.short_description || null,
    description: getEnhancedProductDescription({
      id: String(raw.id),
      name: raw.name || raw.title || "Product",
      category: raw.category || raw.category_id,
      description: raw.details || raw.description,
      short_description: raw.short_description,
      price: sellingPrice
    }),
    regular_price: (regularPrice && regularPrice > sellingPrice) ? regularPrice : sellingPrice,
    discount_price: (regularPrice && regularPrice > sellingPrice) ? sellingPrice : null,
    stock_quantity: parseInt(raw.stock_quantity) || parseInt(raw.stock) || 50,
    free_shipping: true,
    rating_average: Number(raw.rating_average || 4.8),
    rating_count: Number(raw.rating_count || 15),
    sold_count: parseInt(raw.sold) || parseInt(raw.sold_count) || 45,
    is_featured: Boolean(raw.is_featured || raw.isFeatured),
    warranty_info: raw.warranty_info || null,
    return_policy: raw.return_policy || null,
    color: raw.color || null,
    video_url: raw.video_link || raw.video_url || null,
    product_images: imagesArr,
    product_variants: variants,
    category_id: raw.category_id || raw.category || null,
    seller_id: raw.seller_id || "mohasagor.com.bd"
  };
};

interface DurtupImageLoaderProps {
  className?: string;
  label?: string;
}

function DurtupImageLoader({ className, label = "ছবি প্রস্তুত হচ্ছে..." }: DurtupImageLoaderProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center select-none pointer-events-none p-4", className)}>
      {/* Ambient Radial Glowing Halo */}
      <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/20 via-amber-500/25 to-orange-600/20 rounded-full blur-2xl animate-durtup-glow pointer-events-none" />

      {/* Luxury Concentric Orbital Spinner */}
      <div className="relative w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
        {/* Soft Background Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-orange-500/15 dark:border-orange-500/25" />

        {/* Precision Smooth Spinning Gradient Track */}
        <svg className="w-full h-full animate-durtup-spin" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="durtupLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.05" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#durtupLoaderGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="200"
            strokeDashoffset="50"
            fill="none"
          />
        </svg>

        {/* Center Insignia Medallion */}
        <div className="absolute inset-2.5 rounded-full bg-card/95 shadow-lg border border-orange-500/20 flex items-center justify-center backdrop-blur-md">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30 relative overflow-hidden animate-durtup-float">
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-durtup-sweep" />
            <ShoppingBag className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Durtup Brand Signature Pill */}
      <div className="mt-3.5 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card/90 dark:bg-card/95 backdrop-blur-md border border-orange-500/25 shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-spin" style={{ animationDuration: "3s" }} />
        <span className="text-xs sm:text-[13px] font-black tracking-tight select-none">
          <span className="text-orange-500 font-black">Durtup</span>
          <span className="text-foreground">.shop</span>
        </span>
      </div>

      {/* Precision Micro-Progress Shimmer Bar & Label */}
      <div className="mt-2.5 flex flex-col items-center gap-1.5">
        <div className="w-32 h-1 rounded-full bg-muted/80 dark:bg-muted/40 overflow-hidden relative shadow-inner">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full animate-durtup-sweep" />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground/90 tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping inline-block" />
          {label}
        </span>
      </div>
    </div>
  );
}

function ProductDetailContent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const preloaded = (location.state as any)?.preloadedProduct;

  const initialProd = (() => {
    if (preloaded) {
      const mappedImages = mapSupplierImages(preloaded);
      const mapped = mapSupplierProduct(preloaded, preloaded.slug || slug || "", mappedImages);
      if (mappedImages.length > 1) {
        saveFastProduct(mapped);
      }
      return mapped;
    }
    if (slug) {
      const targetLower = String(slug).toLowerCase().trim();
      const suffixMatch = targetLower.match(/-(\d+)$/);
      const cleanId = targetLower.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "").replace(/^ecom-/, "").replace(/^ecom_/, "");
      const extractedId = suffixMatch ? suffixMatch[1] : (/^\d+$/.test(cleanId) ? cleanId : "");

      // 1. Instant 0ms memory & session/local storage check (only if multi-image)
      const fast = getFastProduct(slug) || 
        (extractedId ? getFastProduct(extractedId) : null) || 
        (cleanId ? getFastProduct(cleanId) : null);
      if (fast && ((fast.product_images && fast.product_images.length > 1) || ((fast as any).images && (fast as any).images.length > 1))) {
        return fast;
      }

      const cached = findMohasagorProductSync(slug) || 
        (extractedId ? findMohasagorProductSync(extractedId) : null) || 
        (cleanId ? findMohasagorProductSync(cleanId) : null) ||
        (cleanId ? findMohasagorProductSync(`ecom-${cleanId}`) : null);

      if (cached) {
        const mappedImages = mapSupplierImages(cached);
        const mapped = mapSupplierProduct(cached, cached.slug || slug, mappedImages);
        if (mappedImages.length > 1) {
          saveFastProduct(mapped);
        }
        return mapped;
      }

      if (fast) return fast;
    }
    return null;
  })();

  const initialVariantState = (() => {
    if (initialProd?.product_variants && initialProd.product_variants.length > 0) {
      const initial: Record<string, string> = {};
      const attrs = Array.from(new Set(initialProd.product_variants.map(v => v.attribute)));
      attrs.forEach(attr => {
        const attrValues = initialProd.product_variants!.filter(v => v.attribute === attr).map(v => v.variant);
        const sorted = sortVariantValues(attr, attrValues);
        if (sorted.length > 0) initial[attr] = sorted[0];
      });
      return initial;
    }
    return {};
  })();

  const [product, setProduct] = useState<Product | null>(initialProd);
  const [loading, setLoading] = useState<boolean>(!initialProd);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [loadedMainImages, setLoadedMainImages] = useState<Record<string, boolean>>({});
  const [loadedThumbnails, setLoadedThumbnails] = useState<Record<string, boolean>>({});
  const [prevImage, setPrevImage] = useState<string>("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(initialVariantState);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const variantSelectorRef = useRef<HTMLDivElement>(null);
  const {
    addToCart,
    itemCount: cartCount
  } = useCart();
  const {
    isInWishlist,
    toggleWishlist
  } = useWishlist();
  const {
    toast
  } = useToast();
  const {
    trackView
  } = useRecentlyViewed();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: "left" | "right") => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      thumbnailScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Enable real-time sync for this product
  useProductRealtimeSync(product?.id);

  // Image URL Resolver & Fallback Helper
  const resolveImage = (img: any): string => {
    const cat = (product as any)?.category || product?.category_id || "";
    if (!img) return getCategoryFallbackImage(product?.name || "", cat);
    const url = typeof img === "string" ? img : img.image_url || img.url || img.product_image;
    if (!url || typeof url !== "string") return getCategoryFallbackImage(product?.name || "", cat);
    let trimmed = url.trim();
    if (!trimmed) return getCategoryFallbackImage(product?.name || "", cat);
    let fullUrl = trimmed;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:") && !trimmed.startsWith("blob:")) {
      if (trimmed.startsWith("//")) fullUrl = `https:${trimmed}`;
      else if (trimmed.startsWith("/")) fullUrl = `https://mohasagor.com.bd${trimmed}`;
      else fullUrl = `https://mohasagor.com.bd/${trimmed}`;
    }
    if (fullUrl.includes("mohasagor.com.bd")) {
      return fullUrl.replace(/^https?:\/\/mohasagor\.com\.bd/i, "/api/mohasagor");
    }
    if (fullUrl.includes("ecomsellerbd.com")) {
      return fullUrl.replace(/^https?:\/\/ecomsellerbd\.com/i, "/api/ecomseller");
    }
    return fullUrl;
  };

  const recordUserProductView = (p: any) => {
    if (typeof window === "undefined" || !p) return;
    try {
      const cat = p.category_id || p.category_slug || p.category || "";
      if (cat) {
        const rawCats = localStorage.getItem("user_viewed_categories");
        const cats: string[] = rawCats ? JSON.parse(rawCats) : [];
        const updatedCats = [cat, ...cats.filter((c: string) => c !== cat)].slice(0, 10);
        localStorage.setItem("user_viewed_categories", JSON.stringify(updatedCats));
      }
      const rawProds = localStorage.getItem("recently_viewed_products");
      const prods: any[] = rawProds ? JSON.parse(rawProds) : [];
      const updatedProds = [
        { id: p.id, name: p.name || p.title, slug: p.slug, category: cat, image: p.product_images?.[0]?.image_url || p.image || p.image_url },
        ...prods.filter((item: any) => item.id !== p.id)
      ].slice(0, 15);
      localStorage.setItem("recently_viewed_products", JSON.stringify(updatedProds));
    } catch {}
  };

  // Safely extract all image fields from product schema across all suppliers & formats
  const rawImgList = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    const add = (u: any) => {
      if (!u) return;
      if (typeof u === "string" && u.trim() && !list.includes(u.trim())) {
        list.push(u.trim());
      } else if (typeof u === "object") {
        const val = u.image_url || u.url || u.image || u.product_image || u.path || u.src;
        if (typeof val === "string" && val.trim() && !list.includes(val.trim())) {
          list.push(val.trim());
        }
      }
    };

    if (Array.isArray(product.product_images)) product.product_images.forEach(add);
    if (Array.isArray((product as any).images)) (product as any).images.forEach(add);
    if (Array.isArray((product as any).gallery)) (product as any).gallery.forEach(add);
    if (Array.isArray((product as any).photos)) (product as any).photos.forEach(add);
    if (Array.isArray((product as any).gallery_images)) (product as any).gallery_images.forEach(add);
    if (Array.isArray((product as any).product_variants)) {
      (product as any).product_variants.forEach((v: any) => v && add(v.image || v.image_url || v.variant_image || v.photo));
    }
    if (Array.isArray((product as any).variants)) {
      (product as any).variants.forEach((v: any) => v && add(v.image || v.image_url || v.variant_image || v.photo));
    }
    if ((product as any).image) add((product as any).image);
    if ((product as any).image_url) add((product as any).image_url);
    if ((product as any).thumbnail) add((product as any).thumbnail);
    if ((product as any).thumbnail_img) add((product as any).thumbnail_img);
    if ((product as any).featured_image) add((product as any).featured_image);

    if (list.length === 0) {
      const cat = (product as any)?.category || product?.category_id || "";
      const seriesImgs = findSeriesImages(product.name || "");
      if (seriesImgs.length > 0) {
        list.push(...seriesImgs);
      } else {
        list.push(...getCategoryFallbackImages(product.name || "", cat, 4));
      }
    }
    return list;
  }, [product]);

  const initialImages = useMemo(() => {
    const rawResolved = (rawImgList || []).map(resolveImage).filter(Boolean);
    const seenImgKeys = new Set<string>();
    const res: string[] = [];
    for (const u of rawResolved) {
      if (!u) continue;
      const key = extractImageDedupeKey(u);
      if (!seenImgKeys.has(key)) {
        seenImgKeys.add(key);
        res.push(u);
      }
    }
    const cat = (product as any)?.category || product?.category_id || "";
    if (res.length === 0) {
      const seriesImgs = findSeriesImages(product?.name || "");
      if (seriesImgs.length > 0) {
        res.push(...seriesImgs);
      } else {
        res.push(...getCategoryFallbackImages(product?.name || "", cat, 4));
      }
    } else if (res.length === 1) {
      // If product has only 1 photo, check if an exact sibling model in catalog has the remaining photos
      const seriesImgs = findSeriesImages(product?.name || "", res);
      if (seriesImgs.length > res.length) {
        res.length = 0;
        res.push(...seriesImgs);
      }
    }
    return res;
  }, [rawImgList, product]);

  const [galleryImages, setGalleryImages] = useState<string[]>(initialImages);
  const failedUrlsRef = useRef<Set<string>>(new Set());

  // Synchronize gallery images when product or initialImages change
  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      const valid = initialImages.filter(img => !failedUrlsRef.current.has(img));
      if (valid.length > 0) {
        setGalleryImages(valid);
      } else {
        const cat = (product as any)?.category || product?.category_id || "";
        const seriesImgs = findSeriesImages(product?.name || "");
        if (seriesImgs.length > 0) {
          setGalleryImages(seriesImgs);
        } else {
          setGalleryImages(getCategoryFallbackImages(product?.name || "", cat, 4));
        }
      }
    }
  }, [product?.id, initialImages.join("|")]);

  const images = galleryImages.length > 0 ? galleryImages : initialImages;
  const currentImage = images[selectedImage] || images[0] || "";
  const isCurrentMainLoaded = Boolean(loadedMainImages[currentImage]);

  // Preload hero above-the-fold image immediately
  useEffect(() => {
    if (images && images.length > 0 && images[0]) {
      const heroUrl = images[0];
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = heroUrl;
      link.setAttribute("fetchpriority", "high");
      document.head.appendChild(link);
      return () => {
        try {
          document.head.removeChild(link);
        } catch {}
      };
    }
  }, [images]);

  // Proactively preload and decode ALL gallery photos in parallel for instant 0ms switching
  useEffect(() => {
    if (!images || images.length === 0) return;
    images.forEach((imgUrl) => {
      if (!imgUrl || failedUrlsRef.current.has(imgUrl)) return;
      const direct = getDirectImageUrl(imgUrl) || imgUrl;
      const img = new Image();
      img.decoding = "async";
      img.src = direct;
      img.onload = () => {
        setLoadedMainImages(prev => ({ ...prev, [imgUrl]: true, [direct]: true }));
        setLoadedThumbnails(prev => ({ ...prev, [imgUrl]: true, [direct]: true }));
      };
      img.onerror = () => {
        failedUrlsRef.current.add(imgUrl);
      };
    });
  }, [images]);

  // Proactive safety watchdog: If main image hangs or fails to load within 2.5 seconds, advance to next real photo
  useEffect(() => {
    if (!currentImage || isCurrentMainLoaded || currentImage.startsWith("data:")) return;
    const cat = (product as any)?.category || product?.category_id || "";
    const timer = setTimeout(() => {
      if (!loadedMainImages[currentImage]) {
        failedUrlsRef.current.add(currentImage);
        setGalleryImages(prev => {
          const remaining = prev.filter(img => img !== currentImage && !failedUrlsRef.current.has(img));
          if (remaining.length > 0) {
            return remaining;
          }
          const seriesImgs = findSeriesImages(product?.name || "");
          if (seriesImgs.length > 0) {
            return seriesImgs;
          }
          return getCategoryFallbackImages(product?.name || "", cat, 4);
        });
        setSelectedImage(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [currentImage, isCurrentMainLoaded, product?.name, selectedImage]);

  const handleMainImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.srcset = "";
    const failedSrc = currentImage;
    if (failedSrc) failedUrlsRef.current.add(failedSrc);

    const cat = (product as any)?.category || product?.category_id || "";

    setGalleryImages(prev => {
      const remaining = prev.filter(img => img !== failedSrc && !failedUrlsRef.current.has(img));
      if (remaining.length > 0) {
        return remaining;
      }
      const seriesImgs = findSeriesImages(product?.name || "");
      const fallbacks = seriesImgs.length > 0 ? seriesImgs : getCategoryFallbackImages(product?.name || "", cat, 4);
      if (fallbacks[0]) {
        setLoadedMainImages(p => ({ ...p, [fallbacks[0]]: true }));
        setPrevImage(fallbacks[0]);
      }
      return fallbacks;
    });
    setSelectedImage(prev => (prev > 0 ? prev - 1 : 0));
  };

  const handleThumbnailError = (index: number, failedUrl: string) => {
    if (failedUrl) failedUrlsRef.current.add(failedUrl);
    const cat = (product as any)?.category || product?.category_id || "";

    setGalleryImages(prev => {
      const remaining = prev.filter(img => img !== failedUrl && !failedUrlsRef.current.has(img));
      if (remaining.length > 0) {
        return remaining;
      }
      const seriesImgs = findSeriesImages(product?.name || "");
      return seriesImgs.length > 0 ? seriesImgs : getCategoryFallbackImages(product?.name || "", cat, 4);
    });
    setSelectedImage(prev => (prev >= index && prev > 0 ? prev - 1 : 0));
  };

  const heroSrcSet = useMemo(() => {
    return currentImage && !currentImage.startsWith("data:")
      ? getResponsiveImageSrcSet(currentImage, [400, 600, 800, 1000], 80)
      : "";
  }, [currentImage]);

  // Touch swipe handling for images
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      const totalImages = (product as any)?.video_url ? images.length + 1 : images.length;
      setSelectedImage(prev => Math.min(prev + 1, totalImages - 1));
      setShowVideo(selectedImage === images.length - 1 && (product as any)?.video_url);
    }
    if (touchEnd - touchStart > 75) {
      // Swipe right
      setSelectedImage(prev => Math.max(prev - 1, 0));
      setShowVideo(false);
    }
  };

  const applyLoadedProduct = (loaded: Product) => {
    if (!loaded) return;
    const rawObj = loaded as any;
    const finalPrice = Number(loaded.discount_price || loaded.regular_price || rawObj.price || 0);
    const regPrice = Number(loaded.regular_price || rawObj.originalPrice || finalPrice || 0);
    loaded.regular_price = regPrice > 0 ? regPrice : finalPrice;
    loaded.discount_price = (regPrice > finalPrice && finalPrice > 0) ? finalPrice : null;
    loaded.rating_average = Number(loaded.rating_average ?? rawObj.rating ?? 4.8);
    loaded.rating_count = Number(loaded.rating_count ?? rawObj.reviews ?? 15);
    loaded.sold_count = Number(loaded.sold_count ?? rawObj.sold ?? 45);
    let variants = loaded.product_variants || [];
    if (!variants || variants.length === 0) {
      variants = extractProductVariants(loaded);
      loaded.product_variants = variants;
    }
    setProduct(loaded);
    saveFastProduct(loaded);

    // Ensure browser URL synchronizes cleanly with canonical product slug
    if (loaded.slug && slug && slug !== loaded.slug && typeof window !== "undefined") {
      try {
        window.history.replaceState(null, "", `/product/${loaded.slug}`);
      } catch {}
    }

    // Dynamic Title & OpenGraph meta tags for social share previews
    if (typeof document !== "undefined") {
      document.title = `${loaded.name} | Durtup.shop`;
      const desc = loaded.short_description || loaded.description?.slice(0, 160) || loaded.name;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `${loaded.name} | Durtup.shop`);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", desc);

      const ogImg = document.querySelector('meta[property="og:image"]');
      const firstImg = loaded.product_images?.[0]?.image_url || (loaded as any)?.image;
      if (ogImg && firstImg) ogImg.setAttribute("content", firstImg);
    }

    if (variants && variants.length > 0) {
      const initial: Record<string, string> = {};
      const attrs = Array.from(new Set(variants.map(v => v.attribute)));
      attrs.forEach(attr => {
        const attrValues = variants.filter(v => v.attribute === attr).map(v => v.variant);
        const sorted = sortVariantValues(attr, attrValues);
        if (sorted.length > 0) {
          initial[attr] = sorted[0];
        }
      });
      setSelectedVariants(initial);
    } else {
      setSelectedVariants({});
    }
  };

  useEffect(() => {
    // Scroll instantly to the very top (image and header) whenever slug changes
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setSelectedImage(0);
    setShowVideo(false);
    setQuantity(1);
    setSelectedVariants({});
    setLightboxOpen(false);

    async function fetchProduct() {
      if (!slug) return;
      let rawSlug = String(slug);
      try {
        rawSlug = decodeURIComponent(rawSlug);
        if (rawSlug.includes("%")) {
          try { rawSlug = decodeURIComponent(rawSlug); } catch {}
        }
      } catch {}
      const targetSlug = rawSlug.split("?")[0].split("&")[0].split("#")[0].trim().replace(/\/+$/, "");
      const targetLower = targetSlug.toLowerCase();
      
      // Extract numeric ID suffix if present (e.g. "stylishcomfortable-sports-t-shirt-4-four-pis-combo-offer-9749" -> "9749")
      const suffixMatch = targetLower.match(/-(\d+)$/);
      const cleanId = targetLower.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "").replace(/^ecom-/, "").replace(/^ecom_/, "");
      const extractedId = suffixMatch ? suffixMatch[1] : (/^\d+$/.test(cleanId) ? cleanId : "");

      // Check synchronous cache / fast storage / preloadedProduct first to render instantly
      const syncProduct = (location.state as any)?.preloadedProduct ||
        getFastProduct(targetSlug) ||
        (extractedId ? getFastProduct(extractedId) : null) ||
        (cleanId ? getFastProduct(cleanId) : null) ||
        findMohasagorProductSync(targetSlug) || 
        (extractedId ? findMohasagorProductSync(extractedId) : null) || 
        (cleanId ? findMohasagorProductSync(cleanId) : null) ||
        (cleanId ? findMohasagorProductSync(`ecom-${cleanId}`) : null);

      if (syncProduct && syncProduct.name) {
        const mappedImages = mapSupplierImages(syncProduct);
        const mappedProduct = mapSupplierProduct(syncProduct, syncProduct.slug || targetSlug, mappedImages);
        applyLoadedProduct(mappedProduct);
        trackView(mappedProduct.id);
        recordUserProductView(mappedProduct);
        setLoading(false);

        // Allow catalogWorker to hydrate the latest rich images & full description in background
      } else {
        setLoading(true);
      }

      try {
        let resolved = false;
        const handleFound = (p: Product) => {
          if (!p) return;
          const hasMultipleImgs = (p.product_images && p.product_images.length > 1) || (Array.isArray((p as any).images) && (p as any).images.length > 1);
          const hasFullDesc = (p.description && p.description.length > 250) || ((p as any).details && (p as any).details.length > 250);
          if (hasMultipleImgs && hasFullDesc) {
            resolved = true;
          }
          applyLoadedProduct(p);
          trackView(p.id);
          recordUserProductView(p);
          setLoading(false);
        };

        // 1. Direct Supplier Master Cache & Raw Fast Catalog Lookup
        const catalogWorker = async () => {
          try {
            const foundSp = await findMohasagorProduct(targetSlug);
            if (foundSp && !resolved) {
              const mappedImages = mapSupplierImages(foundSp);
              const mappedProduct = mapSupplierProduct(foundSp, foundSp.slug || targetSlug, mappedImages);
              handleFound(mappedProduct);
              return;
            }
          } catch (spErr) {
            console.warn("Supplier master lookup warning:", spErr);
          }

          // Direct Ecomseller BD Catalog Lookup
          try {
            const { EcomsellerEngine } = await import("@/services/suppliers/ecomsellerEngine");
            const ecomProducts = await EcomsellerEngine.getCachedEcomsellerProducts();
            let foundEcom = ecomProducts.find((p: any) => 
              p.slug === targetLower || 
              p.id === targetLower || 
              p.id === `ecom-${cleanId}` ||
              p.id === cleanId ||
              p.supplier_sku === cleanId ||
              p.sku?.toLowerCase() === targetLower ||
              p.sku?.toLowerCase() === `ecom-${cleanId}`
            );

            if (!foundEcom && (targetSlug || cleanId)) {
              try {
                const liveDetail = await EcomsellerEngine.fetchProductDetail(targetSlug || cleanId);
                if (liveDetail && liveDetail.name) {
                  const { CategoryMappingService } = await import("@/services/suppliers/categoryMappingService");
                  const mappedCategory = CategoryMappingService.resolveCategory(liveDetail.categorySlug || "", liveDetail.category || "");
                  const pricingConfig = EcomsellerEngine.getPricingConfig();
                  const priceInfo = EcomsellerEngine.calculatePrice(liveDetail.price, mappedCategory.slug, liveDetail.id, pricingConfig);

                  foundEcom = {
                    id: `ecom-${liveDetail.id}`,
                    name: liveDetail.name,
                    slug: liveDetail.slug || targetSlug,
                    description: liveDetail.description || liveDetail.name,
                    regular_price: priceInfo.regularStrikethroughPrice,
                    discount_price: priceInfo.finalSellingPrice,
                    price: priceInfo.finalSellingPrice,
                    stock_quantity: liveDetail.stock || 25,
                    is_featured: false,
                    category_id: mappedCategory.id,
                    category: mappedCategory.name,
                    images: Array.isArray(liveDetail.images) && liveDetail.images.length > 0 ? liveDetail.images : [],
                    image: Array.isArray(liveDetail.images) && liveDetail.images.length > 0 ? liveDetail.images[0] : "",
                    supplier_sku: liveDetail.code,
                    seller_id: "Ecomseller BD"
                  };
                }
              } catch (liveErr) {
                console.warn("Live Ecomseller detail fetch warning:", liveErr);
              }
            }

            if (foundEcom && !resolved) {
              let fullDesc = foundEcom.description;
              let fullImages = Array.isArray(foundEcom.images) && foundEcom.images.length > 0 ? [...foundEcom.images] : [];
              try {
                const detail = await EcomsellerEngine.fetchProductDetail(foundEcom.slug || targetSlug);
                if (detail) {
                  if (detail.description) fullDesc = detail.description;
                  if (Array.isArray(detail.images) && detail.images.length > 0) {
                    detail.images.forEach((u: string) => {
                      if (u && !fullImages.includes(u)) fullImages.push(u);
                    });
                  }
                }
              } catch {}

              if (fullImages.length === 0 && foundEcom.image) {
                fullImages = [foundEcom.image];
              }

              const imgList: ProductImage[] = fullImages.map((imgUrl: string, idx: number) => ({
                id: `ecom-img-${idx}`,
                image_url: imgUrl,
                is_primary: idx === 0,
                sort_order: idx
              }));

              const formatted: Product = {
                id: foundEcom.id,
                name: foundEcom.name,
                slug: foundEcom.slug || targetSlug,
                short_description: null,
                description: fullDesc || foundEcom.name,
                regular_price: foundEcom.regular_price,
                discount_price: foundEcom.discount_price || foundEcom.price,
                stock_quantity: foundEcom.stock_quantity || 25,
                free_shipping: true,
                rating_average: 4.8,
                rating_count: 18,
                sold_count: 52,
                is_featured: Boolean(foundEcom.is_featured),
                warranty_info: "7 Days Replacement Warranty",
                return_policy: "Standard 7 days return policy",
                color: null,
                video_url: null,
                product_images: imgList,
                product_variants: [],
                category_id: foundEcom.category_id || foundEcom.category || null,
                seller_id: "Ecomseller BD"
              };

              handleFound(formatted);
            }
          } catch (ecomErr) {
            console.warn("Ecomseller product lookup warning:", ecomErr);
          }
        };

        // 2. Query Supabase Database by slug, ID, or cleanId
        const supabaseWorker = async () => {
          try {
            const { data } = await supabase.from("products").select(`
                *,
                product_images (
                  id,
                  image_url,
                  is_primary,
                  sort_order
                ),
                product_variants (
                  id,
                  product_id,
                  name,
                  color,
                  size,
                  storage,
                  price,
                  image_url
                ),
                supplier_product_mappings (
                  supplier_id,
                  supplier_sku
                )
              `).or(`slug.eq.${targetSlug},id.eq.${targetSlug},slug.eq.${targetLower},id.eq.${cleanId}`).maybeSingle();

            if (data && !resolved) {
              const dbVariants = extractProductVariants(data);
              data.product_variants = dbVariants;

              const mapping = data.supplier_product_mappings && data.supplier_product_mappings[0];
              const isMohasagor = data.sku?.startsWith("MOH-") || (mapping && mapping.supplier_sku);
              if (isMohasagor) {
                try {
                  const supplierSku = mapping?.supplier_sku || data.sku.replace("MOH-", "");
                  const { data: responseData, error: apiError } = await supabase.functions.invoke("supplier-api", {
                    body: { 
                      action: "get-product-details", 
                      supplierId: mapping?.supplier_id || "da929859-f7fa-4590-a3ad-f7012eac5b8c", 
                      payload: { productId: supplierSku } 
                    }
                  });

                  if (!apiError && responseData?.success && responseData.data) {
                    const raw = responseData.data;
                    let mappedImages = mapSupplierImages(raw);
                    if (mappedImages.length === 0 && data.product_images && data.product_images.length > 0) {
                      mappedImages = data.product_images;
                    }
                    const mappedProduct = mapSupplierProduct(raw, targetSlug, mappedImages);
                    mappedProduct.id = data.id;
                    if (data.seller_id) mappedProduct.seller_id = data.seller_id;
                    if ((!mappedProduct.product_variants || mappedProduct.product_variants.length === 0) && dbVariants.length > 0) {
                      mappedProduct.product_variants = dbVariants;
                    }
                    handleFound(mappedProduct);
                    return;
                  }
                } catch (err) {
                  console.warn("Failed to fetch live supplier product details:", err);
                }
              }

              handleFound(data as unknown as Product);
            }
          } catch (dbErr) {
            console.warn("Supabase product lookup warning:", dbErr);
          }
        };

        // 3. Fast Targeted Query Firestore DB
        const firestoreWorker = async () => {
          try {
            const directRef = doc(db, "products", targetSlug);
            const directSnap = await getDoc(directRef);
            if (directSnap.exists() && !resolved) {
              handleFirestoreDoc(directSnap.id, directSnap.data());
              return;
            }

            const q = query(collection(db, "products"), where("slug", "==", targetSlug), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty && !resolved) {
              const d = snap.docs[0];
              handleFirestoreDoc(d.id, d.data());
              return;
            }

            if (cleanId) {
              const q2 = query(collection(db, "products"), where("slug", "==", `product-${cleanId}`), limit(1));
              const snap2 = await getDocs(q2);
              if (!snap2.empty && !resolved) {
                const d = snap2.docs[0];
                handleFirestoreDoc(d.id, d.data());
                return;
              }
            }
          } catch (fsErr) {
            console.warn("Firestore product lookup warning:", fsErr);
          }
        };

        const handleFirestoreDoc = (docId: string, data: any) => {
          if (resolved || !data) return;
          const rawImgs = Array.isArray(data.images) && data.images.length > 0
            ? data.images
            : [data.image_url || data.image || defaultImages[0]];

          const imgList: ProductImage[] = rawImgs.map((imgUrl: string, idx: number) => ({
            id: `img-${idx}`,
            image_url: imgUrl,
            is_primary: idx === 0,
            sort_order: idx
          }));

          const formatted: Product = {
            id: docId,
            name: data.title || data.name || "Product",
            slug: data.slug || targetSlug,
            short_description: data.short_description || data.shortDescription || null,
            description: data.description || "High quality product.",
            regular_price: Number(data.regular_price || data.price || 0),
            discount_price: data.discount_price ? Number(data.discount_price) : null,
            stock_quantity: Number(data.stock_quantity ?? data.stock ?? 50),
            free_shipping: true,
            rating_average: Number(data.rating_average || 4.8),
            rating_count: Number(data.rating_count || 15),
            sold_count: Number(data.sold_count || 40),
            is_featured: Boolean(data.is_featured || data.isFeatured),
            warranty_info: data.warranty_info || null,
            return_policy: data.return_policy || null,
            color: data.color || null,
            video_url: data.video_url || null,
            product_images: imgList,
            product_variants: extractProductVariants({ ...data, id: docId }),
            category_id: data.category_id || data.category || null,
            seller_id: data.seller_id || "Admin"
          };
          handleFound(formatted);
        };

        // Launch all high-speed parallel workers concurrently
        await Promise.allSettled([
          catalogWorker(),
          supabaseWorker(),
          firestoreWorker()
        ]);

        if (resolved) return;

        // 4. Check Local Storage Admin Products (if available in this browser session)
        try {
          const rawLocal = localStorage.getItem("enterprise_admin_products") || localStorage.getItem("local_products");
          if (rawLocal) {
            const list = JSON.parse(rawLocal);
            if (Array.isArray(list)) {
              const found = list.find((p: any) => 
                (p.slug || "").toLowerCase() === targetLower || 
                (p.id || "").toLowerCase() === targetLower || 
                String(p.id) === targetSlug ||
                (p.name || p.title || "").toLowerCase() === targetLower
              );

              if (found) {
                const rawImgs = Array.isArray(found.images) && found.images.length > 0
                  ? found.images
                  : Array.isArray(found.product_images) && found.product_images.length > 0
                  ? found.product_images.map((i: any) => i.image_url || i.url)
                  : [found.image_url || found.image || defaultImages[0]];

                const imgList: ProductImage[] = rawImgs.map((imgUrl: string, idx: number) => ({
                  id: `img-${idx}`,
                  image_url: imgUrl,
                  is_primary: idx === 0,
                  sort_order: idx
                }));

                const formattedProduct: Product = {
                  id: String(found.id || `prod_${Date.now()}`),
                  name: found.name || found.title || "Product",
                  slug: found.slug || targetSlug,
                  short_description: found.short_description || found.shortDescription || null,
                  description: found.description || "High quality product from store.",
                  regular_price: Number(found.regular_price || found.price || 0),
                  discount_price: found.discount_price ? Number(found.discount_price) : null,
                  stock_quantity: Number(found.stock_quantity || found.stock || 50),
                  free_shipping: Boolean(found.free_shipping ?? true),
                  rating_average: Number(found.rating_average || 4.8),
                  rating_count: Number(found.rating_count || 18),
                  sold_count: Number(found.sold_count || 45),
                  is_featured: Boolean(found.is_featured || found.isFeatured),
                  warranty_info: found.warranty_info || null,
                  return_policy: found.return_policy || null,
                  color: found.color || null,
                  video_url: found.video_url || null,
                  product_images: imgList,
                  product_variants: extractProductVariants(found),
                  category_id: found.category_id || found.category || null,
                  seller_id: found.seller_id || "Admin"
                };

                applyLoadedProduct(formattedProduct);
                trackView(formattedProduct.id);
                recordUserProductView(formattedProduct);
                setLoading(false);
                return;
              }
            }
          }
        } catch (localErr) {
          console.warn("ProductDetail local storage check warning:", localErr);
        }

        // 5. CJ Dropshipping Fallback (if ID corresponds to CJ product)
        try {
          const cjCandidateId = cleanId || targetSlug;
          const { data: cjData } = await supabase.functions.invoke("cj-products", {
            body: { productId: cjCandidateId }
          });
          if (cjData?.success && cjData?.product) {
            const cj = cjData.product;
            const cjImgs: ProductImage[] = Array.isArray(cj.images) && cj.images.length > 0
              ? cj.images.map((u: string, i: number) => ({ id: `cj-img-${i}`, image_url: u, is_primary: i === 0, sort_order: i }))
              : [{ id: "cj-0", image_url: cj.image, is_primary: true, sort_order: 0 }];

            const formattedCJ: Product = {
              id: cj.id,
              name: cj.nameEn || cj.name,
              slug: targetSlug,
              short_description: null,
              description: cj.descriptionEn || cj.description || "International quality product.",
              regular_price: Number(cj.price || 0),
              discount_price: cj.originalPrice ? Number(cj.originalPrice) : null,
              stock_quantity: cj.inStock ? 50 : 0,
              free_shipping: Boolean(cj.freeShipping),
              rating_average: 4.8,
              rating_count: 24,
              sold_count: cj.listedCount || 60,
              is_featured: false,
              warranty_info: null,
              return_policy: null,
              color: null,
              video_url: null,
              product_images: cjImgs,
              product_variants: extractProductVariants(cj),
              category_id: cj.category || null,
              seller_id: "CJ Dropshipping"
            };

            applyLoadedProduct(formattedCJ);
            trackView(formattedCJ.id);
            recordUserProductView(formattedCJ);
            setLoading(false);
            return;
          }
        } catch (cjErr) {
          // Not a CJ product
        }

        // 6. Hardcoded Demo Products Fallback
        const fallback = FALLBACK_SUPPLIER_PRODUCTS.find(p =>
          p.slug.toLowerCase() === targetLower ||
          p.id.toLowerCase() === targetLower ||
          p.id.toLowerCase() === cleanId ||
          p.slug.toLowerCase() === `product-${cleanId}`
        );
        if (fallback) {
          const mappedImages = mapSupplierImages(fallback);
          const mapped = mapSupplierProduct(fallback, fallback.slug || targetSlug, mappedImages);
          applyLoadedProduct(mapped);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("ProductDetail catch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [slug, trackView]);

  // If background catalog hydrates or updates while user is on this page and product is still missing, retry!
  useEffect(() => {
    const handleUpdate = () => {
      if (!product && slug) {
        let rawSlug = String(slug);
        try {
          rawSlug = decodeURIComponent(rawSlug);
          if (rawSlug.includes("%")) {
            try { rawSlug = decodeURIComponent(rawSlug); } catch {}
          }
        } catch {}
        const targetSlug = rawSlug.split("?")[0].split("&")[0].split("#")[0].trim().replace(/\/+$/, "");
        const targetLower = targetSlug.toLowerCase();
        const suffixMatch = targetLower.match(/-(\d+)$/);
        const cleanId = targetLower.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "");
        const extractedId = suffixMatch ? suffixMatch[1] : (/^\d+$/.test(cleanId) ? cleanId : "");

        const syncProduct = findMohasagorProductSync(targetSlug) || 
          (extractedId ? findMohasagorProductSync(extractedId) : null) || 
          (cleanId ? findMohasagorProductSync(cleanId) : null);

        if (syncProduct && syncProduct.name) {
          const mappedImages = mapSupplierImages(syncProduct);
          const mappedProduct = mapSupplierProduct(syncProduct, syncProduct.slug || targetSlug, mappedImages);
          applyLoadedProduct(mappedProduct);
          setLoading(false);
        }
      }
    };
    window.addEventListener("mohasagor_products_updated", handleUpdate);
    return () => window.removeEventListener("mohasagor_products_updated", handleUpdate);
  }, [product, slug]);

  useEffect(() => {
    if (product) {
      const pPrice = product.discount_price || product.regular_price || 0;
      try {
        trackViewContent(product.id, product.name, pPrice, "BDT");
      } catch {}
    }
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Auto-select first variant for any unselected attributes if variants exist
    let currentVariants = { ...selectedVariants };
    if (product.product_variants && product.product_variants.length > 0) {
      const attributes = Array.from(new Set(product.product_variants.map(v => v.attribute)));
      let changed = false;
      attributes.forEach(attr => {
        if (!currentVariants[attr]) {
          const attrVariants = product.product_variants!.filter(v => v.attribute === attr).map(v => v.variant);
          const sorted = sortVariantValues(attr, attrVariants);
          if (sorted.length > 0) {
            currentVariants[attr] = sorted[0];
            changed = true;
          }
        }
      });
      if (changed) {
        setSelectedVariants(currentVariants);
      }
    }

    setAddingToCart(true);
    try {
      await addToCart(product, quantity, currentVariants);
      try {
        const pPrice = (product.discount_price || product.regular_price || 0) * quantity;
        trackAddToCart(product.id, product.name, pPrice, "BDT");
      } catch {}
    } catch (err) {
      console.error("handleAddToCart error:", err);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    let currentVariants = { ...selectedVariants };
    if (product.product_variants && product.product_variants.length > 0) {
      const attributes = Array.from(new Set(product.product_variants.map(v => v.attribute)));
      let changed = false;
      attributes.forEach(attr => {
        if (!currentVariants[attr]) {
          const attrVariants = product.product_variants!.filter(v => v.attribute === attr).map(v => v.variant);
          const sorted = sortVariantValues(attr, attrVariants);
          if (sorted.length > 0) {
            currentVariants[attr] = sorted[0];
            changed = true;
          }
        }
      });
      if (changed) {
        setSelectedVariants(currentVariants);
      }
    }

    setBuyingNow(true);
    try {
      await addToCart(product, quantity, currentVariants);
      navigate("/checkout");
    } catch (err) {
      console.error("handleBuyNow error:", err);
      navigate("/checkout");
    } finally {
      setBuyingNow(false);
    }
  };
  const handleWishlistToggle = () => {
    if (!product) return;
    toggleWishlist(product.id);
  };
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/product/${encodeURIComponent(product?.slug || product?.id || "")}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "Durtup Product",
          url: shareUrl
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Product link copied to clipboard"
      });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const current = target.src;
    target.onerror = null;

    // 1. If failed through wsrv.nl proxy, extract original URL and load directly
    if (current.includes("wsrv.nl/?url=")) {
      try {
        const parsed = new URL(current);
        const originalUrl = parsed.searchParams.get("url");
        if (originalUrl) {
          target.src = decodeURIComponent(originalUrl);
          return;
        }
      } catch {}
    }

    // 2. Try another available product image before generic fallback
    if (images && images.length > 1) {
      const alternate = images.find(img => img && img !== current);
      if (alternate) {
        target.src = alternate;
        return;
      }
    }

    // 3. Try smart category fallback image before blank placeholder
    const fallback = getSmartProductImage(product?.name || "", "", product?.category_id || "");
    if (fallback && fallback !== current) {
      target.src = fallback;
      return;
    }

    // 4. Ultimate fallback
    target.src = defaultImages[0];
  };

  const { user: authUser } = useAuth();
  const [contactingSeller, setContactingSeller] = useState(false);

  const handleContactSeller = async () => {
    if (!authUser) {
      toast({ title: "Please login", description: "You need to login to chat with support", variant: "destructive" });
      navigate("/login");
      return;
    }
    setContactingSeller(true);
    try {
      const targetSellerId = product?.seller_id || "admin";
      const targetProductId = product?.id || null;
      const convId = `conv-${authUser.id}-${targetSellerId}${targetProductId ? `-${targetProductId}` : ''}`;
      const nowIso = new Date().toISOString();

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", convId)
        .maybeSingle();

      if (existing?.id) {
        navigate(`/messages/${existing.id}`);
      } else {
        await supabase
          .from("conversations")
          .insert({
            id: convId,
            buyer_id: authUser.id,
            seller_id: targetSellerId,
            product_id: targetProductId,
            last_message_at: nowIso,
            last_message: `Inquiry about: ${product?.name || "Product"}`,
            seller_unread_count: 1,
            buyer_unread_count: 0,
            created_at: nowIso
          });

        await supabase
          .from("messages")
          .insert({
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            conversation_id: convId,
            sender_id: authUser.id,
            sender_type: "buyer",
            content: `Hi, I am inquiring about "${product?.name || "this product"}".`,
            created_at: nowIso,
            is_read: false
          });

        navigate(`/messages/${convId}`);
      }
    } catch (err) {
      console.error("Error contacting support:", err);
      toast({ title: "Error", description: "Could not start chat", variant: "destructive" });
    } finally {
      setContactingSeller(false);
    }
  };

  const inWishlist = product ? isInWishlist(product.id) : false;
  const fallbackFormattedName = slug ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Product";
  const seoTitle = product ? generateProductSEOTitle(product) : `${fallbackFormattedName} Price in Bangladesh | Durtup.shop`;
  const seoDesc = product ? generateProductSEODescription(product) : `Buy ${fallbackFormattedName} online in Bangladesh at Durtup.shop with Cash on Delivery and fast home delivery.`;
  const seoUrl = `https://durtup.shop/product/${product?.slug || slug || ""}`;
  const seoImage = images[0] || "https://durtup.shop/icon-512.png";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead
          title={seoTitle}
          description={seoDesc}
          image={seoImage}
          url={seoUrl}
          type="product"
          product={{
            id: slug || "product",
            name: fallbackFormattedName,
            slug: slug,
            image: seoImage,
            regular_price: 1000,
          }}
          breadcrumbs={[
            { name: "Home", url: "/" },
            { name: "Products", url: "/products" },
            { name: fallbackFormattedName, url: `/product/${slug}` }
          ]}
          faqs={DEFAULT_BANGLADESH_PRODUCT_FAQS}
        />
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileProductTopBar />
        <main className="flex-1 container py-4 sm:py-8 pb-20 md:pb-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-5xl py-6">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center">
              <div className="aspect-square bg-card rounded-2xl border border-border/80 shadow-sm flex items-center justify-center p-6 relative overflow-hidden">
                <DurtupImageLoader label="প্রোডাক্ট লোড হচ্ছে..." />
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded-xl w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded-lg w-1/2 animate-pulse" />
                <div className="h-12 bg-muted/60 rounded-xl w-1/3 animate-pulse mt-4" />
                <div className="h-12 bg-orange-500/10 rounded-xl w-full border border-orange-500/20 animate-pulse mt-4" />
                <div className="h-28 bg-muted/40 rounded-xl w-full animate-pulse mt-4" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEOHead
          title={`Product Details | Durtup.shop`}
          description="Browse thousands of genuine deals, electronics, and fashion items at Durtup.shop."
          noindex={true}
        />
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileProductTopBar />
        <main className="flex-1 container py-8 pb-20 md:pb-8">
          <div className="max-w-xl mx-auto text-center py-6 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center">
              <Package className="h-8 w-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground mb-2">পণ্যটি খুঁজে পাওয়া যায়নি</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mb-6">
              আপনি যে লিঙ্কটি খুঁজছেন তা হয়তো সরানো হয়েছে বা লিঙ্কটিতে সমস্যা আছে। নিচের ডিলগুলো দেখতে পারেন অথবা হোমপেজে যান:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <Link to="/">
                <Button size="default" className="font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md">
                  হোমে ফিরে যান (Back to Home)
                </Button>
              </Link>
              <Link to="/products">
                <Button size="default" variant="outline" className="font-bold border-orange-200 hover:border-orange-400">
                  সব প্রোডাক্ট দেখুন (All Products)
                </Button>
              </Link>
            </div>

            {/* Recommended Products Grid so customer never hits a dead end */}
            <div className="text-left mt-6 border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-orange-600" />
                <h2 className="text-sm sm:text-base font-bold text-foreground">জনপ্রিয় কিছু প্রডাক্ট দেখুন:</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FALLBACK_SUPPLIER_PRODUCTS.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug || p.id}`}
                    state={{ preloadedProduct: p }}
                    className="group block bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all p-2"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-[11px] sm:text-xs font-semibold line-clamp-1 group-hover:text-orange-600">{p.name}</p>
                    <p className="text-xs font-black text-orange-600 mt-1">৳{p.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const price = Number(product.discount_price || product.regular_price || (product as any).price || 0);
  const regularPrice = Number(product.regular_price || (product as any).originalPrice || price || 0);
  const discount = (regularPrice > price && regularPrice > 0) ? Math.round((1 - price / regularPrice) * 100) : 0;
  return <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={generateProductSEOTitle(product)}
        description={generateProductSEODescription(product)}
        image={images[0]}
        url={getCanonicalProductUrl(product.slug || product.id)}
        type="product"
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          short_description: product.short_description,
          description: product.description,
          regular_price: product.regular_price,
          discount_price: product.discount_price,
          stock_quantity: product.stock_quantity,
          rating_average: (product as any).has_real_reviews ? product.rating_average : undefined,
          rating_count: (product as any).has_real_reviews ? product.rating_count : undefined,
          has_real_reviews: Boolean((product as any).has_real_reviews),
          brand: (product as any).brand_name || "Durtup",
          category: (product as any).category_name || "Products",
          image: images[0],
          images: images,
          free_shipping: product.free_shipping,
          warranty_info: product.warranty_info,
        }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          ...((product as any).category_name ? [
            { name: "Categories", url: "/categories" },
            { name: (product as any).category_name, url: `/category/${((product as any).category_slug || (product as any).category_name.toLowerCase().replace(/\s+/g, '-'))}` },
          ] : [
            { name: "Products", url: "/products" }
          ]),
          { name: product.name, url: `/product/${product.slug || product.id}` }
        ]}
        faqs={DEFAULT_BANGLADESH_PRODUCT_FAQS}
      />
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileProductTopBar />

      <main className="flex-1 pb-40 md:pb-8 w-full max-w-full overflow-hidden">
        <div className="container px-0 sm:px-4 md:px-6 py-0 sm:py-6 w-full max-w-full">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-10 xl:gap-12 w-full max-w-full min-w-0 items-start">
            {/* Product Images Section */}
            <div className="w-full max-w-full min-w-0 lg:sticky lg:top-24">
              {/* Main Image with clean, perfect-fit presentation */}
              <div className="flex justify-center mb-2 sm:mb-4 w-full max-w-full">
                <div className="relative w-full sm:max-w-[480px] md:max-w-[520px] lg:max-w-[540px] xl:max-w-[580px]">
                  <div
                    ref={imageContainerRef}
                    className="relative aspect-square w-full sm:rounded-2xl overflow-hidden bg-white dark:bg-card border-b sm:border border-border/70 sm:shadow-sm cursor-zoom-in group flex items-center justify-center p-1 sm:p-4"
                    onClick={() => !showVideo && setLightboxOpen(true)}
                    onMouseMove={(e) => {
                      if (showVideo) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const y = ((e.clientY - rect.top) / rect.height) * 100;
                      setHoverPos({ x, y });
                    }}
                    onMouseLeave={() => setHoverPos(null)}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {showVideo && product.video_url ? (
                      getYouTubeEmbedUrl(product.video_url) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(product.video_url) || ''}
                          title="Product Video"
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={product.video_url} controls className="w-full h-full object-contain object-center bg-black/5" playsInline />
                      )
                    ) : (
                      <>
                        {/* Premium Durtup.shop Branded Image Loading Animation */}
                        <div
                          className={cn(
                            "absolute inset-0 z-0 bg-gradient-to-b from-card/85 via-muted/20 to-card/85 backdrop-blur-[3px] flex items-center justify-center transition-all duration-400 ease-out pointer-events-none select-none",
                            isCurrentMainLoaded ? "opacity-0 scale-98 pointer-events-none" : "opacity-100 scale-100"
                          )}
                        >
                          <DurtupImageLoader label="Loading image..." />
                        </div>

                        {/* Retained previous image to prevent ANY white flash on thumbnail change */}
                        {prevImage && prevImage !== currentImage && !isCurrentMainLoaded && (
                          <img
                            src={prevImage}
                            alt="Previous photo"
                            className="absolute inset-0 w-full h-full object-contain object-center z-1 pointer-events-none opacity-30 blur-[2px] transition-opacity duration-300"
                          />
                        )}

                        {/* Main Product Image with instant eager loading & smooth fade-in */}
                        <img
                          key={currentImage}
                          src={currentImage}
                          srcSet={heroSrcSet || undefined}
                          sizes={PRODUCT_DETAIL_SIZES}
                          alt={product.name}
                          width="540"
                          height="540"
                          style={{
                            imageRendering: "-webkit-optimize-contrast",
                            ...(hoverPos
                              ? {
                                  transformOrigin: `${hoverPos.x}% ${hoverPos.y}%`,
                                  transform: "scale(2)",
                                  transition: "transform 0.08s ease-out",
                                }
                              : {
                                  transform: "scale(1)",
                                  transition: "transform 0.25s ease-out",
                                }),
                          }}
                          className={cn(
                            "w-full h-full max-h-full object-contain object-center select-none will-change-transform drop-shadow-sm transition-opacity duration-300 relative z-2",
                            isCurrentMainLoaded ? "opacity-100" : "opacity-0"
                          )}
                          loading="eager"
                          {...({ fetchpriority: "high" } as any)}
                          decoding="async"
                          onLoad={() => {
                            setLoadedMainImages(prev => ({ ...prev, [currentImage]: true }));
                            setPrevImage(currentImage);
                          }}
                          onError={handleMainImageError}
                        />
                      </>
                    )}

                    {/* Tap to Zoom Premium Badge */}
                    {!showVideo && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                        className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 hover:bg-primary backdrop-blur-md text-white text-[11px] font-bold shadow-lg transition-all hover:scale-105 active:scale-95 z-10 border border-white/20"
                        title="Click to open Fullscreen HD Zoom"
                      >
                        <ZoomIn className="h-3 w-3 text-primary-foreground" />
                        <span className="hidden sm:inline">Click to Zoom (HD)</span>
                        <span className="sm:hidden">Tap to Zoom</span>
                      </button>
                    )}

                    {/* Wishlist Button on Product Image */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product) {
                          toggleWishlist(product.id);
                        }
                      }}
                      className={cn(
                        "absolute top-2.5 left-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full backdrop-blur-md shadow-md flex items-center justify-center transition-all z-10 hover:scale-105 active:scale-95 border cursor-pointer",
                        product && isInWishlist(product.id)
                          ? "bg-rose-600 text-white border-rose-500 shadow-rose-600/30"
                          : "bg-white/90 dark:bg-card/90 text-slate-700 dark:text-slate-200 hover:text-rose-600 border-slate-200/60 dark:border-slate-700/60"
                      )}
                      aria-label={product && isInWishlist(product.id) ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
                      title={product && isInWishlist(product.id) ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-transform",
                          product && isInWishlist(product.id) ? "fill-current text-white scale-110" : ""
                        )}
                      />
                    </button>

                    {/* Image Counter Badge - only show when multiple images/video exist */}
                    {((product as any).video_url ? images.length + 1 : images.length) > 1 && (
                      <div className="absolute top-2.5 right-11 sm:right-12 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-bold shadow-md z-10">
                        {selectedImage + 1} / {(product as any).video_url ? images.length + 1 : images.length}
                      </div>
                    )}

                    {/* Image navigation arrows - only show when multiple images/video exist */}
                    {((product as any)?.video_url ? images.length + 1 : images.length) > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(Math.max(0, selectedImage - 1));
                            setShowVideo(false);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur shadow-md flex items-center justify-center opacity-0 sm:opacity-100 hover:bg-primary hover:text-white transition-all disabled:opacity-0 z-10"
                          disabled={selectedImage === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const totalImages = (product as any)?.video_url ? images.length : images.length - 1;
                            if (selectedImage < totalImages) {
                              setSelectedImage(selectedImage + 1);
                              if (selectedImage === images.length - 1 && (product as any)?.video_url) {
                                setShowVideo(true);
                              }
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur shadow-md flex items-center justify-center opacity-0 sm:opacity-100 hover:bg-primary hover:text-white transition-all z-10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Share button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(); }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur shadow-md flex items-center justify-center hover:bg-primary hover:text-white transition-all z-10"
                      aria-label="Share"
                    >
                      <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>

                    {/* Image indicator dots - only show when multiple images/video exist */}
                    {((product as any)?.video_url ? images.length + 1 : images.length) > 1 && (
                      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 sm:hidden z-10 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        {images.map((_, i) => (
                          <div key={i} className={`h-1.5 rounded-full transition-all ${selectedImage === i && !showVideo ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
                        ))}
                        {product.video_url && <div className={`h-1.5 rounded-full transition-all ${showVideo ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail strip - Large, crisp, beautifully scrollable gallery */}
              {((product as any)?.video_url ? images.length + 1 : images.length) > 1 && (
                <div className="relative group/thumb mt-3 sm:mt-4 w-full sm:max-w-[480px] md:max-w-[520px] lg:max-w-[540px] xl:max-w-[580px] mx-auto px-1">
                  {/* Left scroll chevron button */}
                  <button
                    type="button"
                    onClick={() => scrollThumbnails("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 sm:-translate-x-2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-card/95 shadow-md border border-border/80 flex items-center justify-center text-foreground hover:bg-orange-500 hover:text-white transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer hidden sm:flex"
                    aria-label="Scroll left"
                    title="Previous photos"
                  >
                    <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
                  </button>

                  {/* Thumbnail Scroll Container */}
                  <div
                    ref={thumbnailScrollRef}
                    className="flex gap-2.5 sm:gap-3 overflow-x-auto py-2 px-1 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50 w-full"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {images.map((img, i) => {
                      const isThumbLoaded = Boolean(loadedThumbnails[img]);
                      return (
                        <button
                          key={`${i}-${img}`}
                          type="button"
                          onClick={() => {
                            setSelectedImage(i);
                            setShowVideo(false);
                          }}
                          onMouseEnter={() => {
                            const direct = getDirectImageUrl(img) || img;
                            const pre = new Image();
                            pre.decoding = "async";
                            pre.src = direct;
                            pre.onload = () => {
                              setLoadedMainImages(prev => ({ ...prev, [img]: true, [direct]: true }));
                            };
                          }}
                          onTouchStart={() => {
                            const direct = getDirectImageUrl(img) || img;
                            const pre = new Image();
                            pre.decoding = "async";
                            pre.src = direct;
                            pre.onload = () => {
                              setLoadedMainImages(prev => ({ ...prev, [img]: true, [direct]: true }));
                            };
                          }}
                          className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-[84px] lg:h-[84px] rounded-2xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 bg-white dark:bg-card p-1.5 cursor-pointer relative ${
                            selectedImage === i && !showVideo
                              ? 'border-orange-500 ring-3 ring-orange-500/25 shadow-lg scale-105 z-10'
                              : 'border-border/80 hover:border-orange-500/60 opacity-80 hover:opacity-100 hover:scale-102'
                          }`}
                          title={`View photo ${i + 1}`}
                        >
                          {!isThumbLoaded && (
                            <div className="absolute inset-0 bg-muted/40 animate-pulse pointer-events-none rounded-xl" />
                          )}
                          <img
                            src={optimizeImageUrl(img, 120, 75)}
                            alt={`${product.name} photo ${i + 1}`}
                            width="84"
                            height="84"
                            loading={i < 4 ? "eager" : "lazy"}
                            decoding="async"
                            style={{ imageRendering: "-webkit-optimize-contrast" }}
                            className={cn(
                              "w-full h-full object-contain transition-opacity duration-200 relative z-1",
                              isThumbLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setLoadedThumbnails(prev => ({ ...prev, [img]: true }))}
                            onError={() => handleThumbnailError(i, img)}
                          />
                        </button>
                      );
                    })}

                    {/* Video thumbnail */}
                    {product.video_url && (
                      <button
                        type="button"
                        onClick={() => setShowVideo(true)}
                        className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-[84px] lg:h-[84px] rounded-2xl overflow-hidden border-2 transition-all duration-200 flex items-center justify-center bg-muted flex-shrink-0 relative cursor-pointer ${
                          showVideo ? 'border-orange-500 ring-3 ring-orange-500/25 shadow-lg scale-105 z-10' : 'border-border/80 hover:border-orange-500/60 opacity-80 hover:opacity-100 hover:scale-102'
                        }`}
                        title="Watch product video"
                      >
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white" />
                        </div>
                        {getYouTubeEmbedUrl(product.video_url) ? (
                          <img
                            src={`https://img.youtube.com/vi/${product.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]}/mqdefault.jpg`}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video src={product.video_url} className="w-full h-full object-cover" muted playsInline />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right scroll chevron button */}
                  <button
                    type="button"
                    onClick={() => scrollThumbnails("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 sm:translate-x-2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-card/95 shadow-md border border-border/80 flex items-center justify-center text-foreground hover:bg-orange-500 hover:text-white transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer hidden sm:flex"
                    aria-label="Scroll right"
                    title="Next photos"
                  >
                    <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>


            {/* Product Info */}
            <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6 px-4 sm:px-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {product.is_featured && (
                    <Badge className="bg-gradient-to-r from-warning to-primary text-white border-0 gap-1">
                      <Sparkles className="h-3 w-3" /> Best Seller
                    </Badge>
                  )}
                  {product.sold_count > 100 && (
                    <Badge variant="outline" className="border-primary/30 text-primary gap-1">
                      <TrendingUp className="h-3 w-3" /> Trending
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-success/30 text-success gap-1">
                    <ShieldCheck className="h-3 w-3" /> Authentic
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight tracking-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning/10">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-foreground font-semibold">
                      {Number(product.rating_average ?? 4.8).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({Number(product.rating_count ?? 15)})
                    </span>
                  </div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {Number(product.sold_count ?? 45).toLocaleString()} sold
                  </span>
                </div>
              </div>

              {/* Premium price card */}
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/10 via-warning/5 to-primary/5 border border-primary/20">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
                    ৳{Number(price || 0).toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg sm:text-xl text-muted-foreground line-through">
                        ৳{Number(regularPrice || 0).toLocaleString()}
                      </span>
                      <Badge variant="destructive" className="bg-sale text-base font-bold">-{discount}%</Badge>
                    </>
                  )}
                </div>
                {discount > 0 && (
                  <p className="relative mt-2 text-sm text-success font-medium flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    You save ৳{Number(regularPrice - price).toLocaleString()}
                  </p>
                )}
                {product.free_shipping && (
                  <div className="relative mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    <Truck className="h-3.5 w-3.5" /> Free Shipping
                  </div>
                )}
              </div>

              {/* Product Color */}
              {(product as any).color && <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Color:</span>
                  <div className="w-8 h-8 rounded-full border-2 border-border shadow-sm" style={{
                backgroundColor: (product as any).color
              }} title={(product as any).color} />
                  <span className="text-sm text-muted-foreground">{(product as any).color}</span>
                </div>}

              {/* Product Variants (Color, Size, etc.) */}
              {product.product_variants && product.product_variants.length > 0 && (
                <div ref={variantSelectorRef} className="space-y-4 pt-4 border-t scroll-mt-20">
                  {Array.from(new Set(product.product_variants.map(v => v.attribute))).map(attribute => {
                    const variantsForAttr = product.product_variants!.filter(v => v.attribute === attribute);
                    const isColorAttr = attribute.toLowerCase().includes("color") || attribute.toLowerCase().includes("colour") || attribute.toLowerCase().includes("কালার");
                    const isSizeAttr = attribute.toLowerCase().includes("size") || attribute.toLowerCase().includes("সাইজ");
                    const rawValues = Array.from(new Set(variantsForAttr.map(v => v.variant)));
                    const sortedValues = sortVariantValues(attribute, rawValues);

                    return (
                      <div key={attribute} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span>{attribute}:</span>
                            <span className="text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-full text-xs">
                              {selectedVariants[attribute] || 'Select one'}
                            </span>
                          </h4>
                          {isSizeAttr && (
                            <button
                              type="button"
                              onClick={() => setSizeGuideOpen(true)}
                              className="text-xs text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Ruler className="h-3.5 w-3.5" /> Size Guide
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {sortedValues.map((val, idx) => {
                            const isSelected = selectedVariants[attribute] === val;
                            const hex = isColorAttr ? getColorHex(val) : null;

                            return (
                              <button
                                key={val || idx}
                                type="button"
                                onClick={() => {
                                  setSelectedVariants(prev => ({ ...prev, [attribute]: val }));
                                  const matchingVariantIndex = variantsForAttr.findIndex(v => v.variant === val);
                                  if (matchingVariantIndex >= 0 && matchingVariantIndex < images.length) {
                                    setSelectedImage(matchingVariantIndex);
                                    setShowVideo(false);
                                  }
                                }}
                                className={`flex items-center gap-2 px-4 py-2.5 sm:px-4.5 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border cursor-pointer select-none active:scale-95
                                  ${isSelected 
                                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-primary/30 scale-105' 
                                    : 'border-border/80 bg-muted/40 hover:bg-muted text-foreground hover:border-primary/50'}`}
                              >
                                {hex && (
                                  <span 
                                    className="w-4 h-4 rounded-full border-2 border-white/60 shadow-xs shrink-0" 
                                    style={{ backgroundColor: hex }} 
                                  />
                                )}
                                <span>{val}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3] ml-0.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  {product.stock_quantity > 1 ? (
                    <>
                      <div className="flex items-center border-2 border-primary/20 rounded-xl overflow-hidden bg-background">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="p-3 hover:bg-primary hover:text-white transition-colors touch-manipulation disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit">
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="px-6 font-bold text-lg">{quantity}</span>
                        <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={quantity >= product.stock_quantity} className="p-3 hover:bg-primary hover:text-white transition-colors touch-manipulation disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit">
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {product.stock_quantity} available
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-success">
                      Only 1 left in stock
                    </span>
                  )}
                </div>



                {/* Product Action Buttons (Desktop Only - Mobile uses sticky bottom bar) */}
                <div className="hidden md:flex items-center gap-3 w-full max-w-full">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-bold border-2 border-primary/30 hover:border-primary hover:bg-primary/5 rounded-2xl shadow-xs transition-all active:scale-[0.98]" 
                    onClick={handleAddToCart} 
                    disabled={addingToCart}
                  >
                    {addingToCart ? <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" /> : <ShoppingCart className="h-5 w-5 mr-2 shrink-0" />}
                    Add to Cart
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-2xl shadow-md shadow-orange-600/25 transition-all active:scale-[0.98]" 
                    onClick={handleBuyNow} 
                    disabled={buyingNow}
                  >
                    {buyingNow ? <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" /> : <Zap className="h-5 w-5 mr-2 shrink-0" />}
                    Buy Now
                  </Button>
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className={cn(
                      "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 shrink-0 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer",
                      inWishlist
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 shadow-rose-500/20"
                        : "bg-card border-border hover:border-rose-400 hover:text-rose-600 text-muted-foreground hover:bg-rose-50/40 dark:hover:bg-rose-950/20"
                    )}
                    aria-label={inWishlist ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
                    title={inWishlist ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
                  >
                    <Heart className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200", inWishlist ? "fill-current text-rose-600 scale-110" : "hover:scale-110")} />
                  </button>
                </div>
              </div>

              {/* Trust badges - 4 icons */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-4 border-t">
                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl bg-muted/40 hover:bg-primary/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center">Secure Pay</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl bg-muted/40 hover:bg-primary/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <RotateCcw className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center">Easy Return</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl bg-muted/40 hover:bg-primary/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl bg-muted/40 hover:bg-primary/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-center">Warranty</span>
                </div>
              </div>




              {/* Product Highlighted Description Section */}
              {(() => {
                const enhancedDesc = getEnhancedProductDescription({
                  id: product.id,
                  name: product.name,
                  category: product.category_id || undefined,
                  description: product.description,
                  short_description: product.short_description,
                  price: product.discount_price || product.regular_price
                });
                const unescapedDesc = (enhancedDesc || "")
                  .replace(/\\x3C/gi, "<")
                  .replace(/\\x3E/gi, ">")
                  .replace(/\\x22/gi, '"')
                  .replace(/\\x27/gi, "'")
                  .replace(/\\x2F/gi, "/")
                  .replace(/\\x26/gi, "&")
                  .replace(/\\x0A/gi, "\n")
                  .replace(/\\x0D/gi, "\r")
                  .replace(/\\"/g, '"');
                const isHtml = /<[a-z][\s\S]*>/i.test(unescapedDesc);

                return (
                  <ProductDescriptionSection 
                    description={unescapedDesc} 
                    isHtml={isHtml} 
                  />
                );
              })()}

            </div>
          </div>

          {/* Product Ratings & Reviews Section (Directly Below Description) */}
          <div className="mt-8 w-full max-w-full min-w-0">
            <ProductReviews
              productId={product.id}
              ratingAverage={product.rating_average}
              ratingCount={product.rating_count}
              productName={product.name}
            />
          </div>



          {/* Related Products - Full width below product grid */}
          <div className="w-full max-w-full min-w-0">
            <RelatedProducts 
              product={{
                id: product.id,
                name: product.name,
                category_id: product.category_id,
                brand_id: product.brand_id,
                regular_price: product.regular_price,
                discount_price: product.discount_price,
                tags: product.tags,
              }}
              title="For You"
              subtitle="Recommended items for you"
              limit={100}
            />
          </div>
        </div>

        {/* Mobile sticky action bar pinned to bottom */}
        <div 
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_25px_rgba(0,0,0,0.12)] px-3 py-2 max-w-[100vw] overflow-hidden" 
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
        >
          <div className="max-w-lg mx-auto w-full space-y-1.5">
            {/* Selected Variant Indicator Pill */}
            {product.product_variants && product.product_variants.length > 0 && (
              <div 
                onClick={() => variantSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="flex items-center justify-between px-3 py-1 rounded-lg bg-muted/80 border border-border/50 text-[11px] cursor-pointer hover:bg-muted active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-muted-foreground font-medium">Selected:</span>
                  <span className="text-primary font-bold truncate">
                    {Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(" • ") || "Select Size / Color"}
                  </span>
                </div>
                <span className="text-[10px] text-primary font-bold shrink-0 ml-1.5 flex items-center gap-0.5">
                  Change →
                </span>
              </div>
            )}

            {/* Fast Action Buttons with Sleek Home and Wishlist shortcuts */}
            <div className="flex items-center gap-2 w-full">
              {/* Professional Home Shortcut Tile */}
              <Link 
                to="/" 
                className="flex items-center justify-center h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-600 hover:bg-orange-50 active:scale-90 shrink-0 transition-all border border-slate-200/60 dark:border-slate-700 shadow-xs group"
                title="Go to Home"
                aria-label="Home"
              >
                <Home className="h-5 w-5 group-hover:scale-110 transition-transform text-slate-700 dark:text-slate-200" />
              </Link>

              {/* Wishlist Shortcut Tile */}
              <button
                type="button"
                onClick={() => product && toggleWishlist(product.id)}
                className={cn(
                  "flex items-center justify-center h-11 w-11 rounded-2xl active:scale-90 shrink-0 transition-all border shadow-xs group cursor-pointer",
                  product && isInWishlist(product.id)
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-600 hover:bg-rose-50/50"
                )}
                title={product && isInWishlist(product.id) ? "Wishlist থেকে সরান" : "Wishlist-এ যোগ করুন"}
                aria-label="Wishlist"
              >
                <Heart className={cn("h-5 w-5 transition-transform group-hover:scale-110", product && isInWishlist(product.id) && "fill-current text-rose-600")} />
              </button>

              {/* Add to Cart */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-11 px-3 text-xs sm:text-sm font-black rounded-2xl border-orange-200 dark:border-orange-900/40 text-orange-600 hover:bg-orange-50/50 active:scale-[0.98] shadow-xs"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin shrink-0" /> : <ShoppingCart className="h-4 w-4 mr-1.5 shrink-0" />}
                <span className="truncate">Add to Cart</span>
              </Button>

              {/* Buy Now */}
              <Button
                size="sm"
                className="flex-1 h-11 px-3 text-xs sm:text-sm font-black rounded-2xl bg-orange-600 hover:bg-orange-500 text-white active:scale-[0.98] shadow-md shadow-orange-600/30"
                onClick={handleBuyNow}
                disabled={buyingNow}
              >
                {buyingNow ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin shrink-0" /> : <Zap className="h-4 w-4 mr-1.5 shrink-0" />}
                <span className="truncate">Buy Now</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
      {/* Interactive Fullscreen HD Image Lightbox Zoom Modal */}
      <ProductZoomViewer
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        initialIndex={selectedImage}
        productName={product.name}
      />
      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSizeGuideOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Ruler className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Size Guide (সাইজ চার্ট)</h3>
                  <p className="text-xs text-muted-foreground">Standard Measurements (Inches / ইঞ্চি)</p>
                </div>
              </div>
              <button onClick={() => setSizeGuideOpen(false)} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Shirts / T-Shirts Table */}
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Shirts / T-Shirts / Polos / Hoodies
                </h4>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 text-muted-foreground font-semibold">
                        <th className="p-2 border-b">Size</th>
                        <th className="p-2 border-b">Chest (বডি)</th>
                        <th className="p-2 border-b">Length (লম্বা)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr><td className="p-2 font-bold text-foreground">M</td><td className="p-2">38"</td><td className="p-2">28"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">L</td><td className="p-2">40"</td><td className="p-2">29"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">XL</td><td className="p-2">42"</td><td className="p-2">30"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">XXL (2XL)</td><td className="p-2">44"</td><td className="p-2">31"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pants / Trousers Table */}
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Pants / Jeans / Gabardine (প্যান্ট ও ট্রাউজার)
                </h4>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 text-muted-foreground font-semibold">
                        <th className="p-2 border-b">Waist (কোমর)</th>
                        <th className="p-2 border-b">Length (দৈর্ঘ্য)</th>
                        <th className="p-2 border-b">Thigh (রান)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr><td className="p-2 font-bold text-foreground">28</td><td className="p-2">38"</td><td className="p-2">22"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">30</td><td className="p-2">39"</td><td className="p-2">23"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">32</td><td className="p-2">40"</td><td className="p-2">24"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">34</td><td className="p-2">41"</td><td className="p-2">25"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">36</td><td className="p-2">42"</td><td className="p-2">26"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">38</td><td className="p-2">42"</td><td className="p-2">27"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Panjabi Table */}
              <div>
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Panjabi (পাঞ্জাবি)
                </h4>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/60 text-muted-foreground font-semibold">
                        <th className="p-2 border-b">Size</th>
                        <th className="p-2 border-b">Chest (বডি)</th>
                        <th className="p-2 border-b">Length (লম্বা)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr><td className="p-2 font-bold text-foreground">40</td><td className="p-2">40"</td><td className="p-2">40"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">42</td><td className="p-2">42"</td><td className="p-2">42"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">44</td><td className="p-2">44"</td><td className="p-2">44"</td></tr>
                      <tr><td className="p-2 font-bold text-foreground">46</td><td className="p-2">46"</td><td className="p-2">46"</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => setSizeGuideOpen(false)}>
              Got It (বুঝেছি)
            </Button>
          </div>
        </div>
      )}
      <Footer />
    </div>;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const location = useLocation();
  const activeKey = slug || location.pathname;
  return <ProductDetailContent key={activeKey} />;
}
