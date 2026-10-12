import React from "react";
import { Link } from "react-router-dom";
import { Scale, CheckCircle2, ShoppingBag, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SigmaComparisonData } from "@/server/sigmaServerEngine";

interface SigmaComparisonCardProps {
  data: SigmaComparisonData;
  onAddToCart?: (productId: string | number, name: string) => void;
  onOrderNow?: (productId: string | number, name: string) => void;
}

export const SigmaComparisonCard: React.FC<SigmaComparisonCardProps> = ({
  data,
  onAddToCart,
  onOrderNow,
}) => {
  if (!data?.products || data.products.length < 2) return null;

  const [prodA, prodB] = data.products;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 text-slate-900 shadow-sm overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              প্রোডাক্ট তুলনা (Side-by-Side Comparison)
            </h4>
            <p className="text-[10px] text-slate-500">Sigma AI Powered Smart Spec Analysis</p>
          </div>
        </div>
        <Badge className="bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold">
          VS Comparison
        </Badge>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Product A */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col">
          <img
            src={prodA.image || "/placeholder.svg"}
            alt={prodA.name}
            className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2 border border-slate-200"
          />
          <Link
            to={`/product/${prodA.slug || prodA.id}`}
            className="font-bold text-xs line-clamp-2 text-slate-800 hover:text-orange-600 transition-colors mb-1"
          >
            {prodA.name}
          </Link>
          <span className="text-sm font-black text-orange-600 mb-2">
            ৳{Number(prodA.price || 0).toLocaleString()}
          </span>

          <div className="space-y-1 text-[11px] text-slate-700 border-t border-slate-200/80 pt-2 mb-3">
            {Object.entries(prodA.specs || {}).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">{key}:</span>
                <span className="font-semibold text-slate-800 text-right">{val}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddToCart?.(prodA.id, prodA.name)}
              className="w-full h-7 text-[11px] font-bold border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 gap-1 rounded-lg shadow-2xs"
            >
              <ShoppingBag className="h-3 w-3" /> কার্টে যোগ
            </Button>
          </div>
        </div>

        {/* Product B */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col">
          <img
            src={prodB.image || "/placeholder.svg"}
            alt={prodB.name}
            className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2 border border-slate-200"
          />
          <Link
            to={`/product/${prodB.slug || prodB.id}`}
            className="font-bold text-xs line-clamp-2 text-slate-800 hover:text-orange-600 transition-colors mb-1"
          >
            {prodB.name}
          </Link>
          <span className="text-sm font-black text-orange-600 mb-2">
            ৳{Number(prodB.price || 0).toLocaleString()}
          </span>

          <div className="space-y-1 text-[11px] text-slate-700 border-t border-slate-200/80 pt-2 mb-3">
            {Object.entries(prodB.specs || {}).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-0.5">
                <span className="text-slate-500 text-[10px]">{key}:</span>
                <span className="font-semibold text-slate-800 text-right">{val}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddToCart?.(prodB.id, prodB.name)}
              className="w-full h-7 text-[11px] font-bold border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 gap-1 rounded-lg shadow-2xs"
            >
              <ShoppingBag className="h-3 w-3" /> কার্টে যোগ
            </Button>
          </div>
        </div>
      </div>

      {/* Sigma AI Recommendation Summary */}
      {data.winnerRecommendation && (
        <div className="bg-orange-50 border border-orange-200/80 rounded-xl p-2.5 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-[11px] sm:text-xs text-orange-950 leading-relaxed">
            <span className="font-bold text-orange-600">Sigma Recommendation: </span>
            {data.winnerRecommendation}
          </div>
        </div>
      )}
    </div>
  );
};
