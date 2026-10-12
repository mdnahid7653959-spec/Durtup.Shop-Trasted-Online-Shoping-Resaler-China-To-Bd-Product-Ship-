/**
 * Google Analytics 4 (GA4) & Standard E-commerce Events Tracking Service
 * Safely dispatches standard e-commerce events to window.dataLayer / gtag
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface GAProductItem {
  item_id: string;
  item_name: string;
  price: number;
  item_category?: string;
  item_brand?: string;
  quantity?: number;
  currency?: string;
}

export class GoogleAnalyticsService {
  private static sendEvent(eventName: string, params: Record<string, any>) {
    if (typeof window === "undefined") return;

    try {
      // 1. Send via gtag if available
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
      }

      // 2. Push to dataLayer for Google Tag Manager (GTM)
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ecommerce: params,
      });
    } catch (err) {
      console.warn("GA Event Dispatch warning:", err);
    }
  }

  /** View Item List (Category or Search Result Listing) */
  public static trackViewItemList(items: GAProductItem[], listName: string = "Product List") {
    this.sendEvent("view_item_list", {
      item_list_name: listName,
      items: items.map((item, index) => ({
        ...item,
        index: index + 1,
        currency: item.currency || "BDT",
      })),
    });
  }

  /** View Product Detail */
  public static trackViewItem(product: GAProductItem) {
    this.sendEvent("view_item", {
      currency: product.currency || "BDT",
      value: product.price,
      items: [
        {
          ...product,
          quantity: 1,
          currency: product.currency || "BDT",
        },
      ],
    });
  }

  /** Add to Cart */
  public static trackAddToCart(product: GAProductItem, quantity: number = 1) {
    this.sendEvent("add_to_cart", {
      currency: product.currency || "BDT",
      value: product.price * quantity,
      items: [
        {
          ...product,
          quantity,
          currency: product.currency || "BDT",
        },
      ],
    });
  }

  /** Begin Checkout */
  public static trackBeginCheckout(items: GAProductItem[], totalValue: number) {
    this.sendEvent("begin_checkout", {
      currency: "BDT",
      value: totalValue,
      items: items.map((item) => ({
        ...item,
        currency: item.currency || "BDT",
      })),
    });
  }

  /** Purchase / Order Completed */
  public static trackPurchase(orderId: string, totalValue: number, items: GAProductItem[], shipping: number = 0) {
    this.sendEvent("purchase", {
      transaction_id: orderId,
      currency: "BDT",
      value: totalValue,
      shipping,
      items: items.map((item) => ({
        ...item,
        currency: item.currency || "BDT",
      })),
    });
  }

  /** Internal Search */
  public static trackSearch(searchTerm: string) {
    this.sendEvent("search", {
      search_term: searchTerm,
    });
  }
}
