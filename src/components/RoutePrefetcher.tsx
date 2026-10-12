import { useEffect } from "react";

// Route loader map for instant on-demand and idle prefetching
const routeLoaders: Record<string, () => Promise<any>> = {
  "/": () => import("@/pages/Index"),
  "/products": () => import("@/pages/Products"),
  "/categories": () => import("@/pages/Categories"),
  "/category": () => import("@/pages/CategoryPage"),
  "/product": () => import("@/pages/ProductDetail"),
  "/cart": () => import("@/pages/Cart"),
  "/checkout": () => import("@/pages/Checkout"),
  "/account": () => import("@/pages/Account"),
  "/orders": () => import("@/pages/Orders"),
  "/referrals": () => import("@/pages/Referrals"),
  "/refer": () => import("@/pages/Referrals"),
  "/wallet": () => import("@/pages/Wallet"),
  "/messages": () => import("@/pages/Messages"),
  "/wishlist": () => import("@/pages/Wishlist"),
  "/search": () => import("@/pages/Search"),
  "/login": () => import("@/pages/Login"),
  "/register": () => import("@/pages/Register"),
};

const prefetchedSet = new Set<string>();

/**
 * Instantly prefetch a route component chunk on hover/touch before the user finishes clicking
 * (Strictly excludes admin/staff modules to keep public storefront lightweight)
 */
export function prefetchRoute(href: string) {
  if (!href) return;
  const path = href.split("?")[0].split("#")[0].toLowerCase();

  // Block admin, staff, and internal dashboard routes from public prefetch
  if (path.startsWith("/admin") || path.startsWith("/staff") || path.startsWith("/seller") || path.startsWith("/reseller")) {
    return;
  }
  
  // Direct match
  if (routeLoaders[path] && !prefetchedSet.has(path)) {
    prefetchedSet.add(path);
    routeLoaders[path]().catch(() => {});
    return;
  }

  // Prefix match (e.g., /category/electronics, /product/item-1)
  if (path.startsWith("/category/") && !prefetchedSet.has("/category")) {
    prefetchedSet.add("/category");
    routeLoaders["/category"]?.()?.catch(() => {});
    return;
  }
  if ((path.startsWith("/product/") || path.startsWith("/p/") || path.startsWith("/item/")) && !prefetchedSet.has("/product")) {
    prefetchedSet.add("/product");
    routeLoaders["/product"]?.()?.catch(() => {});
    return;
  }
}

// Attach hover listener globally to all <a> and <button> elements with data-href or href
if (typeof window !== "undefined") {
  let touchTimer: ReturnType<typeof setTimeout> | null = null;

  const handlePointerInteraction = (e: Event) => {
    // Skip speculative prefetching if Save-Data is enabled
    if ((navigator as any)?.connection?.saveData) return;

    const target = (e.target as HTMLElement)?.closest("a[href], [data-prefetch-href]");
    if (!target) return;
    const href = target.getAttribute("href") || target.getAttribute("data-prefetch-href");
    if (href && (href.startsWith("/") || href.startsWith("#"))) {
      prefetchRoute(href);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if ((navigator as any)?.connection?.saveData) return;
    const target = (e.target as HTMLElement)?.closest("a[href], [data-prefetch-href]");
    if (!target) return;
    const href = target.getAttribute("href") || target.getAttribute("data-prefetch-href");
    if (!href || (!href.startsWith("/") && !href.startsWith("#"))) return;

    // Debounce touch by 80ms to prevent triggering downloads during scrolling swipes
    if (touchTimer) clearTimeout(touchTimer);
    touchTimer = setTimeout(() => {
      prefetchRoute(href);
    }, 80);
  };

  const cancelTouch = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
  };

  // Passive hover & touch listeners for lag-free click readiness without scroll thrashing
  window.addEventListener("mouseover", handlePointerInteraction, { passive: true });
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", cancelTouch, { passive: true });
  window.addEventListener("touchcancel", cancelTouch, { passive: true });
}

export function RoutePrefetcher() {
  useEffect(() => {
    // Only prefetch the most basic customer routes after a long idle period (10s)
    const customerRoutes = ["/products", "/cart"];

    const runIdlePrefetch = () => {
      customerRoutes.forEach((route) => prefetchRoute(route));
    };

    let timer: any;
    if ("requestIdleCallback" in window) {
      timer = (window as any).requestIdleCallback(runIdlePrefetch, { timeout: 10000 });
    } else {
      timer = setTimeout(runIdlePrefetch, 8000);
    }

    return () => {
      if (typeof window !== "undefined") {
        if ("cancelIdleCallback" in window) {
          (window as any).cancelIdleCallback(timer);
        } else {
          clearTimeout(timer);
        }
      }
    };
  }, []);

  return null;
}
