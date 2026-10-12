import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye, Zap, Star, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SigmaProductCardData } from "@/server/sigmaServerEngine";

interface SigmaProductCardProps {
  product: SigmaProductCardData;
  onAddToCart?: (product: SigmaProductCardData) => void;
  onOrderNow?: (product: SigmaProductCardData) => void;
  onCompare?: (product: SigmaProductCardData) => void;
}

export const SigmaProductCard: React.FC<SigmaProductCardProps> = ({
  product,
  onAddToCart,
  onOrderNow,
  onCompare,
}) => {
  const currentPrice = Number(product.price || 0);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const discountPercent = originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : null;

  const productUrl = `/product/${product.slug || product.id}`;

  return (
    <div className="group relative flex flex-col bg-white/85 backdrop-blur-xl border border-sky-100/90 rounded-3xl p-3.5 shadow-[inset_0_2px_4px_rgba(255,255,255,1),_0_8px_25px_rgba(14,165,233,0.08)] hover:shadow-[0_12px_32px_rgba(14,165,233,0.18)] hover:border-cyan-300 transition-all duration-300 overflow-hidden w-full max-w-[280px] sm:max-w-[300px] shrink-0">
      {/* Top Badges */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-1 items-start">
        {discountPercent ? (
          <Badge className="bg-rose-500/90 hover:bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 shadow-sm rounded-full uppercase tracking-wider backdrop-blur-sm">
            {discountPercent}% OFF
          </Badge>
        ) : null}
        {product.freeShipping && (
          <Badge className="bg-cyan-500/90 hover:bg-cyan-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <Truck className="h-2.5 w-2.5" /> ফ্রি ডেলিভারি
          </Badge>
        )}
      </div>

      {/* Product Image */}
      <Link
        to={productUrl}
        className="relative w-full aspect-square bg-sky-50/50 rounded-2xl overflow-hidden mb-3 block cursor-pointer border border-sky-100/60"
      >
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Product Title & Info */}
      <div className="flex-1 flex flex-col">
        <Link
          to={productUrl}
          className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 hover:text-cyan-600 transition-colors leading-snug mb-1.5"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Rating & Stock */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{product.rating || 4.8}</span>
            <span className="text-slate-400 text-[10px]">({product.reviews || 18})</span>
          </div>
          <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50/90 border border-cyan-200/60 px-2 py-0.5 rounded-full">
            ইন স্টক
          </span>
        </div>

        {/* Price Section */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base sm:text-lg font-black text-cyan-600">
            ৳{currentPrice.toLocaleString()}
          </span>
          {originalPrice && originalPrice > currentPrice && (
            <span className="text-xs text-slate-400 line-through">
              ৳{originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-1.5 mt-auto pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddToCart?.(product)}
            className="w-full text-xs font-bold h-8 rounded-full border-sky-200 text-sky-800 hover:bg-cyan-50 hover:border-cyan-300 gap-1 px-1 shadow-[inset_0_1px_2px_rgba(255,255,255,1)]"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-cyan-600" />
            <span>কার্টে যোগ</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOrderNow?.(product)}
            className="w-full text-xs font-bold h-8 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white gap-1 px-1 shadow-[0_4px_14px_rgba(6,182,212,0.3)]"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>অর্ডার করুন</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
