import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorMessage = error?.message || String(error) || "";
    const isChunk =
      errorMessage.includes("Failed to fetch dynamically imported module") ||
      errorMessage.includes("Importing a module script failed") ||
      errorMessage.includes("error loading dynamically imported module") ||
      errorMessage.includes("Loading chunk") ||
      errorMessage.includes("dynamically imported module") ||
      errorMessage.includes("is not a valid JavaScript MIME type");

    return { hasError: true, error, isChunkError: isChunk };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);

    const errorMessage = error?.message || String(error) || "";
    const isChunkError =
      errorMessage.includes("Failed to fetch dynamically imported module") ||
      errorMessage.includes("Importing a module script failed") ||
      errorMessage.includes("error loading dynamically imported module") ||
      errorMessage.includes("Loading chunk") ||
      errorMessage.includes("dynamically imported module") ||
      errorMessage.includes("is not a valid JavaScript MIME type");

    if (isChunkError && typeof window !== "undefined") {
      const lastReload = sessionStorage.getItem("chunk_eb_reload_ts");
      const now = Date.now();

      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("chunk_eb_reload_ts", now.toString());

        // Clear stale CacheStorage immediately
        if ("caches" in window) {
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
        }

        // Force cache-busting reload
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("_v", now.toString());
          window.location.replace(url.toString());
        }, 150);
      }
    }
  }

  handleReload = () => {
    sessionStorage.removeItem("chunk_reload_timestamp");
    sessionStorage.removeItem("chunk_retry_timestamp");
    sessionStorage.removeItem("chunk_eb_reload_ts");
    sessionStorage.removeItem("vite_preload_reload");

    if (typeof window !== "undefined") {
      if ("caches" in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("_v", Date.now().toString());
          window.location.replace(url.toString());
        });
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set("_v", Date.now().toString());
        window.location.replace(url.toString());
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Chunk deployment mismatch loading state (auto-healing)
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
            <div className="relative mb-5">
              <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
              </div>
            </div>
            <h3 className="text-base font-bold text-foreground">অ্যাপ্লিকেশন আপডেট হচ্ছে...</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs leading-relaxed">
              নতুন সংস্করণ লোড হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow-sm active:scale-95"
              >
                এখনই লোড করুন
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition active:scale-95"
              >
                হোমে যান
              </a>
            </div>
          </div>
        );
      }

      // Elegant customer-friendly application error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-sm p-6 bg-card border rounded-2xl shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-foreground">সাময়িক বিভ্রাট দেখা দিয়েছে</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              পেজটি লোড করার সময় সাময়িক সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন অথবা হোম পেজে ফিরে যান।
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition shadow active:scale-95"
              >
                আবার চেষ্টা করুন
              </button>
              <a
                href="/"
                className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-xs font-bold hover:bg-secondary/90 transition active:scale-95"
              >
                হোমে যান
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
