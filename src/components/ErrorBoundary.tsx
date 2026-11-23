import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
  autoRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false, autoRecovering: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorMessage = error?.message || String(error) || "";
    const isChunk =
      errorMessage.includes("Failed to fetch dynamically imported module") ||
      errorMessage.includes("Importing a module script failed") ||
      errorMessage.includes("error loading dynamically imported module") ||
      errorMessage.includes("Loading chunk") ||
      errorMessage.includes("dynamically imported module") ||
      errorMessage.includes("is not a valid JavaScript MIME type") ||
      errorMessage.includes("Outdated Optimize Dep");

    return { hasError: true, error, isChunkError: isChunk, autoRecovering: false };
  }

  cleanupCorruptCache = () => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem("chunk_reload_timestamp");
      sessionStorage.removeItem("chunk_retry_timestamp");
      sessionStorage.removeItem("chunk_eb_reload_ts");
      sessionStorage.removeItem("vite_preload_reload");
      
      const volatileKeys = [
        "mohasagor_cached_home_products_v15",
        "durtup_nav_history_stack",
        "mohasagor_catalog_cache",
        "fast_storage_index",
        "durtup_recently_viewed",
        "durtup_search_history",
        "durtup_interactions",
      ];
      volatileKeys.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

      if ("caches" in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
    } catch {}
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.cleanupCorruptCache();

    // Auto-heal on transient runtime or chunk/HMR error
    if (typeof window !== "undefined") {
      const lastHeal = sessionStorage.getItem("auto_eb_healed_ts");
      const now = Date.now();
      const canAutoHeal = !lastHeal || now - parseInt(lastHeal, 10) > 12000;

      if (canAutoHeal) {
        sessionStorage.setItem("auto_eb_healed_ts", now.toString());
        this.setState({ autoRecovering: true });

        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("_r", now.toString());
          window.location.replace(url.toString());
        }, 400);
      }
    }
  }

  handleCleanReload = () => {
    this.cleanupCorruptCache();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("_v", Date.now().toString());
      window.location.replace(url.toString());
    }
  };

  handleGoHome = () => {
    this.cleanupCorruptCache();
    if (typeof window !== "undefined") {
      window.location.href = "/?_reset=" + Date.now();
    }
  };

  render() {
    if (this.state.hasError) {
      // Auto-recovering spinner state
      if (this.state.autoRecovering || this.state.isChunkError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
            <div className="relative mb-5">
              <div className="h-12 w-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
              </div>
            </div>
            <h3 className="text-base font-bold text-foreground">অ্যাপ্লিকেশন আপডেট হচ্ছে...</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs leading-relaxed">
              সিস্টেম ক্যাশ ক্লিয়ার করে পেজটি স্বয়ংক্রিয়ভাবে রিলোড করা হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={this.handleCleanReload}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition shadow-sm active:scale-95"
              >
                এখনই লোড করুন
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition active:scale-95"
              >
                হোমে যান
              </button>
            </div>
          </div>
        );
      }

      // Elegant customer-friendly application error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 select-none">
          <div className="text-center max-w-md w-full p-6 sm:p-8 bg-card border border-border/80 rounded-2xl shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 mx-auto flex items-center justify-center shadow-xs">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">সাময়িক বিভ্রাট দেখা দিয়েছে</h2>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-xs mx-auto">
                পেজটি লোড করার সময় সাময়িক ক্যাশ বা নেটওয়ার্ক সমস্যা হয়েছে। নিচের বাটনে ক্লিক করে ক্যাশ ক্লিয়ার করে রিলোড দিন।
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleCleanReload}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold hover:from-orange-600 hover:to-amber-600 transition shadow active:scale-95 flex items-center gap-1.5"
              >
                <span>ক্যাশ ক্লিয়ার করে রিলোড</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition active:scale-95"
              >
                <span>হোমে যান</span>
              </button>
            </div>

            {/* Display exact crash reason for instant diagnosis in development */}
            {this.state.error && (
              <details className="text-left text-[11px] font-mono bg-destructive/10 text-destructive p-3 rounded-xl border border-destructive/20 mt-3 max-h-48 overflow-auto">
                <summary className="cursor-pointer font-bold select-none text-xs">
                  ত্রুটি সংক্রান্ত বিস্তারিত (Debug Info): {this.state.error.message || String(this.state.error)}
                </summary>
                <pre className="mt-2 text-[10px] whitespace-pre-wrap opacity-80">
                  {this.state.error.stack || String(this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Isolated Section Error Boundary
 * Prevents any individual homepage widget or component error from crashing the whole page.
 */
export class SectionErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[SectionErrorBoundary] Recovered from widget crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}
