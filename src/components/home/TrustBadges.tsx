import { memo } from "react";
import { CheckCircle2, Truck, ShieldCheck, RefreshCw } from "lucide-react";

function TrustBadgesComponent() {
  return (
    <section className="w-full px-3 sm:px-4 py-1.5 sm:py-2">
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs">
        
        {/* Clean 2x2 on Mobile, 4 in a row on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4">
          
          {/* Badge 1: 100% Authentic */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3 border-b lg:border-b-0 border-r border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">100% Authentic</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Genuine Products</p>
            </div>
          </div>

          {/* Badge 2: Fast Delivery */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Fast Delivery</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Across Bangladesh</p>
            </div>
          </div>

          {/* Badge 3: Secure Payment */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3 border-r border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Secure Payment</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">100% Protected</p>
            </div>
          </div>

          {/* Badge 4: Easy Returns */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 dark:text-slate-200 shrink-0 stroke-[1.75]" />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Easy Returns</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Instant Check & Return</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export const TrustBadges = memo(TrustBadgesComponent);
