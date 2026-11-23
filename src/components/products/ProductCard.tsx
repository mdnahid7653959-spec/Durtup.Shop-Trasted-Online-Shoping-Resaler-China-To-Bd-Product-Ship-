import { memo, useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getProductImageCandidates, getSmartProductImage, getResponsiveImageSrcSet, PRODUCT_CARD_SIZES } from "@/utils/productImageHelper";
import { saveFastProduct } from "@/utils/fastProductStorage";
import { CustomerAuthModal } from "@/components/auth/CustomerAuthModal";

export interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  sold: number;
  freeShipping?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  images?: string[];
  product_images?: any[];
  details?: string;
  description?: string;
  category?: string;
  category_name?: string;
  category_slug?: string;
  stock?: number;
  stock_quantity?: number;
  name_bn?: string;
}

import { SafeProductImage } from "@/components/products/SafeProductImage";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  index?: number;
}

/**
 * Extracts distinct variant / color / model tag from product name
 * e.g. "OLEVS 9931G (Blue Dial)" -> { baseName: "OLEVS 9931G", variantTag: "Blue Dial" }
 */
function extractVariantBadge(name: string): { baseName: string; variantTag: string | null } {
  if (!name) return { baseName: "", variantTag: null };

  const parenMatch = name.match(/[\(\[]\s*([^()\[\]]{2,30})\s*[\)\]]/);
  if (parenMatch && parenMatch[1]) {
    const tag = parenMatch[1].trim();
    if (/dial|black|white|blue|gold|golden|silver|red|green|navy|camo|ash|color|edition|combo|set|pack|pro|ultra|max/i.test(tag) || tag.length <= 16) {
      const baseName = name.replace(parenMatch[0], "").replace(/\s{2,}/g, " ").trim();
      return { baseName, variantTag: tag };
    }
  }

  const dashMatch = name.match(/[-–]\s*([A-Za-z0-9\s]{2,20})$/);
  if (dashMatch && dashMatch[1]) {
    const tag = dashMatch[1].trim();
    if (!/product|shop|bangladesh|online|bd/i.test(tag)) {
      const baseName = name.replace(dashMatch[0], "").trim();
      return { baseName, variantTag: tag };
    }
  }

  return { baseName: name, variantTag: null };
}

function ProductCardComponent({ product, priority = false, index = 0 }: ProductCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const isNearFold = priority || (index ?? 0) < 18;
  const [isVisible, setIsVisible] = useState(true);

  // Serial stagger delay: 0ms for initial fold products, gentle stagger for scroll batches
  const staggerDelay = isNearFold ? 0 : Math.min((index % 6) * 35, 140);

  const { baseName, variantTag } = useMemo(() => extractVariantBadge(product.name), [product.name]);

  const finalPrice = Math.max(0, Math.round(Number(product.price) || 0));
  const rawOriginal = product.originalPrice ? Math.round(Number(product.originalPrice)) : 0;
  const discount = (rawOriginal > finalPrice && finalPrice > 0)
    ? Math.round(((rawOriginal - finalPrice) / rawOriginal) * 100)
    : 0;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
    } catch (err) {
      console.error("ProductCard handleAddToCart error:", err);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const hasVariants = Boolean(
      (product.product_variants && product.product_variants.length > 0) ||
      (Array.isArray((product as any).variants) && (product as any).variants.length > 0)
    );
    if (hasVariants) {
      handleCardClick();
      navigate(`/product/${product.slug || product.id}?action=buy`);
      return;
    }
    try {
      await addToCart(product, 1);
    } catch (err) {
      console.error("ProductCard handleBuyNow error:", err);
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    navigate("/checkout");
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handlePreload = () => {
    saveFastProduct(product);
  };

  const handleCardClick = () => {
    saveFastProduct(product);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("durtup_last_clicked_product", String(product.slug || product.id));
        sessionStorage.setItem("durtup_feed_scroll_y", String(window.scrollY));
      }
    } catch { }
  };

  return (
    <div
      ref={cardRef}
      id={`product-card-${product.slug || product.id}`}
      data-product-id={product.id}
      data-product-slug={product.slug}
      style={{
        transitionDelay: isVisible ? `${staggerDelay}ms` : "0ms",
      }}
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden hover:shadow-md dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-200 will-change-[transform,opacity] w-full border border-border/80 flex flex-col justify-between opacity-100 translate-y-0 scale-100"
      )}
    >
      <div>
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 max-w-[calc(100%-48px)] pointer-events-none">
          {discount > 0 && (
            <Badge className="bg-orange-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md w-fit shadow-2xs">
              -{discount}%
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-md w-fit">
              NEW
            </Badge>
          )}
          {product.isBestSeller && (
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md w-fit">
              TOP
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full shadow-2xs flex items-center justify-center transition-colors duration-150 active:scale-95",
            inWishlist ? "bg-orange-600 text-white" : "bg-white/90 dark:bg-slate-800/90 text-muted-foreground hover:text-orange-600 border border-slate-200/60 dark:border-slate-700/60"
          )}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          title={inWishlist ? "উইশলিস্ট থেকে সরান" : "উইশলিস্টে যোগ করুন"}
        >
          <Heart className={cn("h-3.5 w-3.5", inWishlist && "fill-current")} />
        </button>

        {/* Product Image with smooth skeleton backdrop and zero CLS layout container */}
        <Link
          to={`/product/${product.slug || product.id}`}
          state={{ preloadedProduct: product }}
          onMouseEnter={handlePreload}
          onTouchStart={handlePreload}
          onClick={handleCardClick}
          className="block"
        >
          <div className="relative aspect-square overflow-hidden bg-white dark:bg-slate-900/60 flex items-center justify-center p-1.5">
            <SafeProductImage
              product={product}
              width={300}
              height={300}
              sizes={PRODUCT_CARD_SIZES}
              priority={priority || index < 12}
              fit="contain"
              className="w-full h-full object-contain group-hover:scale-104 transition-transform duration-300 ease-out"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-2.5 pb-0">
          <Link
            to={`/product/${product.slug || product.id}`}
            state={{ preloadedProduct: product }}
            onMouseEnter={handlePreload}
            onTouchStart={handlePreload}
            onClick={handleCardClick}
          >
            {variantTag && (
              <span className="inline-block text-[9.5px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded px-1.5 py-0.5 mb-1 truncate max-w-full">
                {variantTag}
              </span>
            )}
            <h3
              title={product.name}
              className="font-medium text-[12px] sm:text-[13px] leading-tight text-foreground line-clamp-2 mb-1.5 min-h-[2rem] hover:text-orange-600 transition-colors break-words"
            >
              {baseName || product.name}
            </h3>
          </Link>

          {/* Rating & Sales */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <div className="flex items-center gap-0.5 bg-amber-500/10 px-1 py-0.5 rounded">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              <span className="text-[10px] font-semibold text-foreground">
                {Number(product.rating || 4.8).toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {Number(product.sold || 45) >= 1000 ? `${(Number(product.sold || 45) / 1000).toFixed(0)}k sold` : `${product.sold || 45} sold`}
            </span>
          </div>

          {/* Price Section */}
          <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-orange-600">
              ৳{finalPrice.toLocaleString("en-BD")}
            </span>
            {rawOriginal > finalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                ৳{rawOriginal.toLocaleString("en-BD")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button - Instant Buy Now */}
      <div className="p-2.5 pt-0 mt-1">
        <button
          onClick={handleBuyNow}
          className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-xs sm:text-sm py-2 px-3 rounded-lg shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
        >
          Order Now
        </button>
      </div>

      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => navigate("/checkout")}
      />
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
