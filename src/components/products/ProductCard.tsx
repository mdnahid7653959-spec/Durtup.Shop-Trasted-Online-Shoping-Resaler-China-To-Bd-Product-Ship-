import { memo, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getProductImageCandidates, getSmartProductImage, getResponsiveImageSrcSet, PRODUCT_CARD_SIZES } from "@/utils/productImageHelper";
import { saveFastProduct } from "@/utils/fastProductStorage";

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
}

function ProductCardComponent({ product, priority = false }: ProductCardProps) {
  const navigate = useNavigate();
  const finalPrice = Math.max(0, Math.round(Number(product.price) || 0));
  const rawOriginal = product.originalPrice ? Math.round(Number(product.originalPrice)) : 0;
  const discount = (rawOriginal > finalPrice && finalPrice > 0)
    ? Math.round(((rawOriginal - finalPrice) / rawOriginal) * 100)
    : 0;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
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
    try {
      await addToCart(product, 1);
    } catch (err) {
      console.error("ProductCard handleBuyNow error:", err);
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

  return (
    <div className="group relative bg-card rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-full border border-border flex flex-col justify-between">
      <div>
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 max-w-[calc(100%-48px)] pointer-events-none">
          {discount > 0 && (
            <Badge className="bg-orange-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md w-fit">
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
            "absolute top-1.5 right-1.5 z-10 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-150 active:scale-90",
            inWishlist ? "bg-orange-600 text-white" : "bg-white/90 text-muted-foreground hover:text-orange-600"
          )}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
        </button>

        {/* Product Image with smooth skeleton backdrop and zero CLS layout container */}
        <Link 
          to={`/product/${product.slug || product.id}`} 
          state={{ preloadedProduct: product }}
          onMouseEnter={handlePreload}
          onTouchStart={handlePreload}
          onClick={() => saveFastProduct(product)}
          className="block"
        >
          <div className="relative aspect-square overflow-hidden bg-white dark:bg-slate-900/60 flex items-center justify-center p-1.5">
            <SafeProductImage
              product={product}
              width={300}
              height={300}
              sizes={PRODUCT_CARD_SIZES}
              priority={priority}
              fit="contain"
              className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
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
            onClick={() => saveFastProduct(product)}
          >
            <h3 
              title={product.name}
              className="font-medium text-[12px] sm:text-[13px] leading-tight text-foreground line-clamp-2 mb-1.5 min-h-[2rem] hover:text-orange-600 transition-colors break-words"
            >
              {product.name}
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
            <span className="text-sm sm:text-base font-black text-orange-600">
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
          className="w-full water-droplet-btn water-droplet-crystal font-bold text-xs sm:text-sm py-2 px-3 flex items-center justify-center cursor-pointer active:scale-[0.96] transition-all"
        >
          Order Now
        </button>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
