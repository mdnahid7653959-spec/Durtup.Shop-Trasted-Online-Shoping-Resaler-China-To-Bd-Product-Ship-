import { memo, useState } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const BANNER_HIDE_KEY = "durtup_top_app_banner_dismissed";

function TopAppInstallBannerComponent() {
  const { isInstalled, installApp, openPrompt } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(BANNER_HIDE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // If already installed, opened in standalone app, or dismissed by user, do not render
  if (isInstalled || isDismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem(BANNER_HIDE_KEY, "true");
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstall = async () => {
    openPrompt();
    try {
      await installApp();
    } catch {
      openPrompt();
    }
  };

  return (
    <div className="block lg:hidden w-full relative bg-gradient-to-r from-[#FF5722] via-[#F4511E] to-[#E64A19] text-white shadow-md border-b border-orange-800/30 select-none animate-in fade-in slide-in-from-top duration-300 overflow-hidden">
      {/* Top Gloss Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2">
        
        {/* Left: App Icon + Title & Description */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* App Icon */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 shadow-md flex items-center justify-center shrink-0 border border-white/95 overflow-hidden">
            <img
              src="/icon-192.png"
              alt="Durtup Mobile App"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/apple-touch-icon.png";
              }}
            />
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-xs sm:text-sm text-white tracking-tight truncate drop-shadow-xs">
                Durtup Mobile App
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-white border border-white/20 shrink-0">
                <Sparkles className="w-2 h-2 text-amber-200 fill-amber-200" />
                Free
              </span>
            </div>
            <p className="text-[9.5px] sm:text-xs text-white/95 truncate leading-none mt-1 font-medium drop-shadow-xs">
              প্লে স্টোর ছাড়াই সরাসরি ফোনে ১ ক্লিকে ইনস্টল করুন
            </p>
          </div>
        </div>

        {/* Right: Actions Group (Install Button + Frosted Glass Dismiss Button) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Install Button */}
          <Button
            size="sm"
            onClick={handleInstall}
            className="h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-full bg-white text-orange-600 hover:bg-orange-50 active:scale-95 font-black text-[11px] sm:text-xs shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-md transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer border border-white/90 shrink-0"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 shrink-0 stroke-[2.5] animate-bounce" />
            <span className="whitespace-nowrap font-black">ইনস্টল করুন</span>
          </Button>

          {/* Modern Frosted Glass Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Hide banner"
            title="ব্যানারটি বন্ধ করুন"
            className="w-6.5 h-6.5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/35 active:bg-white/45 active:scale-90 text-white border border-white/30 backdrop-blur-md shadow-xs transition-all cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}

export const TopAppInstallBanner = memo(TopAppInstallBannerComponent);
