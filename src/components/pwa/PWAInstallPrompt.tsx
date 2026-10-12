import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  BellRing, 
  X, 
  Share, 
  PlusSquare, 
  ChevronRight,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PWAInstallPrompt: React.FC = () => {
  const {
    canInstall,
    isInstalled,
    isPromptOpen,
    isIOS,
    isMobile,
    showIOSGuide,
    setShowIOSGuide,
    showAndroidGuide,
    setShowAndroidGuide,
    installApp,
    dismissPrompt,
    openPrompt
  } = usePWAInstall();

  const [installing, setInstalling] = useState(false);

  // If already installed in standalone mode, don't show prompt
  if (isInstalled) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const installed = await installApp();
      if (!installed) {
        if (isIOS) {
          setShowIOSGuide(true);
        } else {
          setShowAndroidGuide(true);
        }
      }
    } catch {
      if (isIOS) {
        setShowIOSGuide(true);
      } else {
        setShowAndroidGuide(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {/* 1. AUTOMATIC POPUP / BOTTOM SHEET (Shown to mobile visitors) */}
      {isPromptOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
          >
            {/* Header with gradient bar */}
            <div className="relative bg-gradient-to-r from-primary via-orange-500 to-amber-500 p-5 text-white">
              <button
                onClick={() => dismissPrompt(true)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 active:scale-95 text-white transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl bg-white p-1 shadow-lg flex items-center justify-center shrink-0 border-2 border-white/90 overflow-hidden">
                  <img
                    src="/icon-192.png"
                    alt="Durtup App"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/apple-touch-icon.png';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-black tracking-tight leading-none text-white drop-shadow-xs">Durtup.shop</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                      Official
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium mt-1">
                    Official Mobile Web Application
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-foreground leading-snug">
                  সহজ ও দ্রুত কেনাকাটার জন্য অ্যাপটি ফোনে ইনস্টল করুন
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  প্লে স্টোর ছাড়াই সরাসরি ১ ক্লিকে আপনার ফোনের হোমস্ক্রিনে অ্যাপটি যোগ হবে এবং যেকোনো সময় এক ট্যাপে কেনাকাটা করতে পারবেন।
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                <Button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full h-12 text-sm sm:text-base font-bold rounded-2xl bg-gradient-to-r from-primary via-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isIOS ? 'ইনস্টল করার নিয়ম দেখুন' : 'ইনস্টল করুন (Install App)'}</span>
                </Button>

                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={() => dismissPrompt(true)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold py-1.5 transition-colors cursor-pointer"
                  >
                    পরে করব (Later)
                  </button>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    100% Safe & Free
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. iOS SAFARI STEP-BY-STEP INSTALL GUIDE */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-primary/20 shadow-xs">
                  <img src="/icon-192.png" alt="Durtup" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-base">iPhone এ অ্যাপ ইনস্টল করুন</h3>
              </div>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/60 border">
                <div className="p-2 rounded-xl bg-primary text-white shrink-0 mt-0.5">
                  <Share className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">১. Safari ব্রাউজারের নিচে Share চাপুন</p>
                  <p className="text-xs text-muted-foreground mt-0.5">নিচের বারে থাকা Share (⎋) আইকনে ক্লিক করুন।</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/60 border">
                <div className="p-2 rounded-xl bg-primary text-white shrink-0 mt-0.5">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">২. "Add to Home Screen" সিলেক্ট করুন</p>
                  <p className="text-xs text-muted-foreground mt-0.5">মেনু স্ক্রল করে "Add to Home Screen" এ ট্যাপ করে "Add" চাপুন।</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="font-bold text-xs">৩. সম্পন্ন!</p>
                  <p className="text-[11px] mt-0.5">আপনার iPhone হোমস্ক্রিনে Durtup App চলে আসবে!</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-11 rounded-xl bg-primary text-white font-bold"
            >
              বুঝেছি (Got it)
            </Button>
          </div>
        </div>
      )}

      {/* 3. ANDROID / CHROME / BROWSER STEP-BY-STEP INSTALL GUIDE */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-primary/20 shadow-xs">
                  <img src="/icon-192.png" alt="Durtup" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-base text-foreground">সরাসরি অ্যাপ ইনস্টল করার নিয়ম</h3>
              </div>
              <button 
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/60 border">
                <div className="p-2 rounded-xl bg-primary text-white shrink-0 mt-0.5 font-black text-xs">
                  ⋮
                </div>
                <div>
                  <p className="font-bold text-foreground">১. ব্রাউজারের উপরে ৩-ডট (⋮) চাপুন</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ডানপাশের উপরে থাকা ৩-ডট (⋮) অপশন মেনুতে ক্লিক করুন।</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/60 border">
                <div className="p-2 rounded-xl bg-primary text-white shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-foreground">২. "Install app" বা "Add to Home screen" চাপুন</p>
                  <p className="text-xs text-muted-foreground mt-0.5">মেনু থেকে Install App / Add to Home screen সিলেক্ট করুন।</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="font-bold text-xs">৩. সম্পন্ন!</p>
                  <p className="text-[11px] mt-0.5">আপনার ফোনে সরাসরি অফিশিয়াল Durtup Mobile App তৈরি হয়ে যাবে!</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setShowAndroidGuide(false)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
            >
              বুঝেছি (Got it)
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
