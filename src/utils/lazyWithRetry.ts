import { lazy, ComponentType } from "react";

/**
 * Enhanced React.lazy wrapper that automatically self-heals chunk deployments,
 * clears stale browser/service-worker caches, and guarantees smooth navigation
 * without triggering developer notice modals.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (firstError: any) {
      console.warn("[LazyRetry] First chunk load failed, retrying in 250ms...", firstError?.message);
      try {
        await new Promise((r) => setTimeout(r, 250));
        return await componentImport();
      } catch (retryError: any) {
        const msg = String(retryError?.message || retryError || "");
        const isChunkError =
          msg.includes("Failed to fetch dynamically imported module") ||
          msg.includes("Importing a module script failed") ||
          msg.includes("error loading dynamically imported module") ||
          msg.includes("Loading chunk") ||
          msg.includes("dynamically imported module") ||
          msg.includes("is not a valid JavaScript MIME type");

        if (isChunkError && typeof window !== "undefined") {
          console.warn("[LazyRetry] Stale chunk detected during deployment transition. Healing caches...");
          const lastReload = sessionStorage.getItem("chunk_retry_timestamp");
          const now = Date.now();

          // Reload once every 10 seconds to bypass stale browser / edge cache
          if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
            sessionStorage.setItem("chunk_retry_timestamp", now.toString());

            // Clear browser CacheStorage so stale HTML/assets are discarded immediately
            if ("caches" in window) {
              try {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
              } catch {}
            }

            // Invalidate service worker caches
            if ("serviceWorker" in navigator) {
              try {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                  reg.update().catch(() => {});
                }
              } catch {}
            }

            // Force hard reload of the target URL with cache buster query parameter
            const targetUrl = new URL(window.location.href);
            targetUrl.searchParams.set("_v", now.toString());
            window.location.replace(targetUrl.toString());

            // Return pending promise so React remains in Suspense and does not crash to ErrorBoundary
            return new Promise<{ default: T }>(() => {});
          }
        }

        throw retryError;
      }
    }
  });
}
