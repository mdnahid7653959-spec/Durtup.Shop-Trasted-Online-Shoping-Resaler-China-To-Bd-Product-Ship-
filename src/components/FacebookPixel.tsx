/* eslint-disable */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export function FacebookPixel() {
  const { rawSettings: settings } = useSiteSettings();
  const location = useLocation();
  const activePixelId = settings?.facebookPixelId || "1879220862970143";
  const initializedRef = useRef(false);

  // 1. Initialize Facebook Pixel SDK if not already in window
  useEffect(() => {
    if (!activePixelId) return;

    if (!window.fbq) {
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        "script",
        "https://connect.facebook.net/en_US/fbevents.js"
      );
    }

    if (window.fbq && !initializedRef.current) {
      window.fbq("init", activePixelId);
      initializedRef.current = true;
    }
  }, [activePixelId]);

  // 2. Track PageView on SPA Route Changes
  useEffect(() => {
    if (window.fbq && activePixelId) {
      window.fbq("track", "PageView");
    }
  }, [location.pathname, location.search, activePixelId]);

  if (!activePixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${activePixelId}&ev=PageView&noscript=1`}
        alt="Meta Pixel"
      />
    </noscript>
  );
}

// Helper functions to track events with Bangladesh BDT currency
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
};

export const trackAddToCart = (productId: string, productName: string, price: number, currency: string = "BDT") => {
  trackEvent("AddToCart", {
    content_ids: [productId],
    content_name: productName,
    content_type: "product",
    value: price,
    currency: currency,
  });
};

export const trackInitiateCheckout = (total: number, items: any[] = [], currency: string = "BDT") => {
  trackEvent("InitiateCheckout", {
    content_ids: items.map((i) => (i.product_id || i.id || "").toString()),
    content_type: "product",
    value: total,
    currency: currency,
    num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
  });
};

export const trackPurchase = (orderId: string, total: number, items: any[] = [], currency: string = "BDT") => {
  trackEvent("Purchase", {
    content_ids: items.map((i) => (i.product_id || i.id || "").toString()),
    content_type: "product",
    value: total,
    currency: currency,
    order_id: orderId,
    num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
  });
};

export const trackViewContent = (productId: string, productName: string, price: number, currency: string = "BDT") => {
  trackEvent("ViewContent", {
    content_ids: [productId],
    content_name: productName,
    content_type: "product",
    value: price,
    currency: currency,
  });
};

export const trackSearch = (searchQuery: string) => {
  trackEvent("Search", {
    search_string: searchQuery,
  });
};
