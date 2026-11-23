import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Flame, Clock, ArrowRight, ShoppingCart, CheckCircle } from "lucide-react";
import { SafeProductImage } from "@/components/products/SafeProductImage";
import {
  getActiveFlashSaleCampaign,
  calculateTimeRemaining,
  type FlashSaleProductItem,
  type FlashSaleCampaign,
} from "@/services/flashSaleService";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export const FlashSaleLiveSection: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [campaign, setCampaign] = useState<FlashSaleCampaign | null>(getActiveFlashSaleCampaign);

  // Time remaining state ticking every second
  const [time, setTime] = useState(() => {
    return campaign ? calculateTimeRemaining(campaign.endTime) : null;
  });

  useEffect(() => {
    const checkCampaign = () => {
      const active = getActiveFlashSaleCampaign();
      setCampaign(active);
      if (active) {
        setTime(calculateTimeRemaining(active.endTime));
      } else {
        setTime(null);
      }
    };

    checkCampaign();

    const interval = setInterval(() => {
      if (campaign) {
        const remaining = calculateTimeRemaining(campaign.endTime);
        setTime(remaining);
        if (remaining.isExpired) {
          // Auto close when countdown hits 00:00:00
          checkCampaign();
        }
      } else {
        checkCampaign();
      }
    }, 1000);

    const handleUpdate = () => checkCampaign();
    window.addEventListener("durtup_flash_sale_updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("durtup_flash_sale_updated", handleUpdate);
    };
  }, [campaign?.id, campaign?.endTime]);

  const handleBuyNow = async (item: FlashSaleProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.flashSold >= item.flashStock) {
      toast.error("দুঃখিত, এই পণ্যের ফ্ল্যাশ সেল স্টক শেষ হয়ে গেছে!");
      return;
    }

    try {
      await addToCart(
        {
          id: item.productId,
          name: item.name,
          slug: item.slug,
          image: item.image,
          price: item.flashPrice,
          originalPrice: item.regularPrice,
          rating: 4.9,
          reviews: 25,
          sold: item.flashSold,
        },
        1
      );
      toast.success(`${item.name} ফ্ল্যাশ সেল অফারে কার্টে যোগ হয়েছে!`);
      navigate("/checkout");
    } catch (err) {
      toast.error("কার্টে যোগ করতে সমস্যা হয়েছে");
    }
  };

  const handleAddToCart = async (item: FlashSaleProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.flashSold >= item.flashStock) {
      toast.error("এই পণ্যের ফ্ল্যাশ সেল স্টক শেষ হয়ে গেছে!");
      return;
    }

    try {
      await addToCart(
        {
          id: item.productId,
          name: item.name,
          slug: item.slug,
          image: item.image,
          price: item.flashPrice,
          originalPrice: item.regularPrice,
          rating: 4.9,
          reviews: 25,
          sold: item.flashSold,
        },
        1
      );
      toast.success(`${item.name} কার্টে যোগ হয়েছে!`);
    } catch {
      toast.error("কার্টে যোগ করতে সমস্যা হয়েছে");
    }
  };

  if (!campaign || !time || time.isExpired || !campaign.products || campaign.products.length === 0) {
    return null;
  }

  const formatDigit = (n: number) => String(n).padStart(2, "0");

  return (
    <section id="flash-sale-live-section" className="w-full px-2 sm:px-4 py-2 sm:py-3 select-none">
      <div className="max-w-7xl mx-auto rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-0.5 sm:p-1 shadow-lg">
        <div className="bg-white dark:bg-slate-950 rounded-[14px] p-3 sm:p-5">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* Title & Flame Icon */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md animate-pulse">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-1.5">
                    <span>{campaign.titleBn || campaign.title}</span>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 hidden xs:inline" />
                  </h2>
                  <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                    Live
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  {campaign.description || "সীমিত সময়ের জন্য অবিশ্বাস্য বিশেষ ছাড়"}
                </p>
              </div>
            </div>

            {/* Live Synchronized Countdown Timer */}
            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-red-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span>অফার শেষ হতে বাকি:</span>
              </div>

              <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
                {time.days > 0 && (
                  <>
                    <div className="bg-slate-900 text-white dark:bg-red-600 px-2 py-1 rounded-lg shadow-xs">
                      {formatDigit(time.days)}<span className="text-[9px] font-sans font-medium text-slate-400 ml-0.5">d</span>
                    </div>
                    <span className="text-red-500 font-bold">:</span>
                  </>
                )}
                <div className="bg-slate-900 text-white dark:bg-red-600 px-2 py-1 rounded-lg shadow-xs">
                  {formatDigit(time.hours)}<span className="text-[9px] font-sans font-medium text-slate-400 ml-0.5">h</span>
                </div>
                <span className="text-red-500 font-bold">:</span>
                <div className="bg-slate-900 text-white dark:bg-red-600 px-2 py-1 rounded-lg shadow-xs">
                  {formatDigit(time.minutes)}<span className="text-[9px] font-sans font-medium text-slate-400 ml-0.5">m</span>
                </div>
                <span className="text-red-500 font-bold">:</span>
                <div className="bg-red-600 text-white px-2 py-1 rounded-lg shadow-xs">
                  {formatDigit(time.seconds)}<span className="text-[9px] font-sans font-medium text-red-200 ml-0.5">s</span>
                </div>
              </div>

              <Link
                to="/products?filter=flash_sale"
                className="hidden md:flex items-center gap-1 text-xs font-extrabold text-orange-600 hover:text-orange-700 pl-2 transition-colors"
              >
                <span>সব দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Flash Sale Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {campaign.products.map((item) => {
              const isSoldOut = item.flashSold >= item.flashStock;
              const soldPercent = Math.min(
                100,
                Math.round((item.flashSold / Math.max(1, item.flashStock)) * 100)
              );

              return (
                <div
                  key={`flash-item-${item.productId}`}
                  className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-2 sm:p-2.5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden select-none"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                      <span className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-xs">
                        -{item.discountPercent}%
                      </span>
                    </div>

                    {/* Product Photo */}
                    <Link
                      to={`/product/${item.slug || item.productId}`}
                      className="block relative aspect-square overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 p-1 mb-2"
                    >
                      <SafeProductImage
                        product={{
                          id: item.productId,
                          name: item.name,
                          image: item.image,
                        }}
                        width={240}
                        height={240}
                        fit="contain"
                        className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-300"
                      />
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="text-white font-black text-xs uppercase bg-red-600 px-2 py-1 rounded shadow-md">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Product Title */}
                    <Link to={`/product/${item.slug || item.productId}`}>
                      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="text-sm sm:text-base font-black text-red-600 leading-tight">
                        ৳{item.flashPrice.toLocaleString()}
                      </span>
                      {item.regularPrice > item.flashPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ৳{item.regularPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Progress Bar & Buy Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    {/* Sale Stock Progress */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1 font-semibold">
                        <span>বিক্রি: {item.flashSold}/{item.flashStock}</span>
                        <span className="text-orange-600 font-bold">{soldPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-500"
                          style={{ width: `${soldPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Order Button */}
                    <button
                      onClick={(e) => handleBuyNow(item, e)}
                      disabled={isSoldOut}
                      className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs active:scale-95 ${
                        isSoldOut
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white cursor-pointer"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{isSoldOut ? "স্টক শেষ" : "এখনই অর্ডার করুন"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
