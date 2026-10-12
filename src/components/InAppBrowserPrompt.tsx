import React, { useState, useEffect } from "react";
import { ExternalLink, Copy, Check, MoreVertical, Share2, Compass, X, AlertCircle } from "lucide-react";
import { detectInAppBrowser, openInExternalBrowser, InAppBrowserInfo } from "@/utils/inAppBrowserDetector";
import { Button } from "@/components/ui/button";

export const InAppBrowserPrompt: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<InAppBrowserInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const info = detectInAppBrowser();
    if (info.isInApp) {
      setBrowserInfo(info);

      // Check if user previously dismissed in this session
      const isDismissed = sessionStorage.getItem("iab_prompt_dismissed") === "true";
      if (isDismissed) {
        setDismissed(true);
        return;
      }

      // Automatically attempt Android external browser redirect on first mount if not attempted yet
      const redirectedKey = "iab_auto_redirect_done";
      if (info.isAndroid && !sessionStorage.getItem(redirectedKey)) {
        sessionStorage.setItem(redirectedKey, "1");
        openInExternalBrowser();
      }
    }
  }, []);

  if (!browserInfo?.isInApp || dismissed) {
    return null;
  }

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback copy
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenBrowser = () => {
    openInExternalBrowser();
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("iab_prompt_dismissed", "true");
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[99999] bg-gradient-to-b from-black/90 via-black/80 to-transparent p-3 sm:p-4 backdrop-blur-md animate-in fade-in slide-in-from-top duration-300">
      <div className="max-w-lg mx-auto bg-card border border-primary/30 shadow-2xl rounded-2xl p-4 sm:p-5 text-card-foreground">
        
        {/* Header with platform badge */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Compass className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {browserInfo.displayName || "Social App"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  ইন-অ্যাপ ব্রাউজার
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-foreground mt-0.5">
                স্মুথ শপিং অভিজ্ঞতার জন্য ব্রাউজারে খুলুন
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close banner"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step-by-step Visual Instruction */}
        <div className="mt-3 bg-muted/40 rounded-xl p-3 text-xs sm:text-sm text-foreground space-y-2 border border-border/40">
          <div className="font-medium text-primary flex items-center gap-1.5">
            📌 ব্রাউজারে খোলার সহজ উপায়:
          </div>
          
          {browserInfo.isIOS ? (
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li>
                উপরের ডানে বা নিচের{" "}
                <strong className="text-foreground inline-flex items-center gap-1 px-1 py-0.5 bg-background rounded border">
                  <Share2 className="h-3 w-3" /> Share
                </strong>{" "}
                অথবা{" "}
                <strong className="text-foreground inline-flex items-center gap-1 px-1 py-0.5 bg-background rounded border">
                  <MoreVertical className="h-3 w-3" /> ৩ ডট
                </strong>{" "}
                -এ চাপ দিন।
              </li>
              <li>
                মেন্যু থেকে{" "}
                <strong className="text-foreground">"Open in Safari / Chrome"</strong> বা{" "}
                <strong className="text-foreground">"ব্রাউজারে খুলুন"</strong> সিলেক্ট করুন।
              </li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
              <li>
                উপরের ডান কোনায়{" "}
                <strong className="text-foreground inline-flex items-center gap-1 px-1 py-0.5 bg-background rounded border">
                  <MoreVertical className="h-3 w-3" /> ৩ ডট মেন্যু
                </strong>{" "}
                -এ চাপ দিন।
              </li>
              <li>
                <strong className="text-foreground">"Open in Chrome / Browser"</strong> অথবা{" "}
                <strong className="text-foreground">"ব্রাউজারে খুলুন"</strong> অপশনে ক্লিক করুন।
              </li>
            </ol>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleOpenBrowser}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 h-10"
          >
            <ExternalLink className="h-4 w-4" />
            সরাসরি ব্রাউজারে খুলুন
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="flex-1 border-border font-medium flex items-center justify-center gap-2 h-10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">লিংক কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                লিংক কপি করুন
              </>
            )}
          </Button>
        </div>

        {/* Small dismiss text */}
        <div className="mt-2.5 text-center">
          <button
            onClick={handleDismiss}
            className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
          >
            এখানেই সাধারণ ভাবে চালিয়ে যান
          </button>
        </div>
      </div>
    </div>
  );
};
