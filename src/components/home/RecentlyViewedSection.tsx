import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import { Clock, Trash2, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const RecentlyViewedSection: React.FC = () => {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
  const [clearing, setClearing] = useState(false);

  if (!recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearRecentlyViewed();
      toast.success("ব্রাউজিং হিস্টোরি সফলভাবে মুছে ফেলা হয়েছে");
    } catch {
      toast.error("হিস্টোরি মুছতে সমস্যা হয়েছে");
    } finally {
      setClearing(false);
    }
  };

  return (
    <section 
      id="recently-viewed-section"
      className="w-full px-3 sm:px-4 py-2 sm:py-3 select-none"
    >
      <div className="max-w-7xl mx-auto bg-card border border-border/80 rounded-2xl p-3 sm:p-5 shadow-xs">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                  Recently Viewed
                </h2>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-900/40">
                  {recentlyViewed.length}টি পণ্য
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                আপনার ব্রাউজকৃত পণ্যসমূহ (সর্বশেষ দেখা পণ্য প্রথমে)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear History with Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={clearing}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1 active:scale-95 disabled:opacity-50"
                  title="হিস্টোরি মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[11px] font-medium">হিস্টোরি মুছুন</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ব্রাউজিং হিস্টোরি মুছে ফেলতে চান?</AlertDialogTitle>
                  <AlertDialogDescription>
                    আপনার সম্প্রতি দেখা {recentlyViewed.length}টি পণ্যের তালিকা মুছে যাবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90 text-white">
                    হ্যাঁ, মুছে ফেলুন
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Link
              to="/account?tab=recently-viewed"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Responsive Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {recentlyViewed.slice(0, 12).map((product, idx) => (
            <div key={`recent-view-${product.id}-${idx}`} className="relative">
              <ProductCard
                product={product}
                index={idx}
                priority={idx < 6}
              />
              {/* Out of Stock Ribbon Overlay */}
              {product.is_out_of_stock && (
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                  <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight">
                    Stock Out
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(RecentlyViewedSection);
