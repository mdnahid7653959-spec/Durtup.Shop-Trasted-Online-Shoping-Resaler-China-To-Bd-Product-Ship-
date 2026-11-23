/**
 * Durtup Hybrid Architecture API Client
 * Connects React Frontend with the Laravel & Redis Backend Service
 */

export interface HybridProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  supplier_sku?: string;
  category_id?: string;
  category?: { id: string; name: string; slug: string };
  wholesale_price: number;
  regular_price?: number;
  discount_price?: number;
  selling_price: number;
  stock_quantity: number;
  in_stock: boolean;
  status: string;
  short_description?: string;
  description?: string;
  rating: number;
  reviews_count: number;
  sold_count: number;
  is_featured: boolean;
  is_trending: boolean;
  free_shipping: boolean;
  image: string;
  images: string[];
  product_images?: Array<{ id: string; image_url: string; is_primary: boolean; sort_order: number }>;
  variants?: any[];
  source_url?: string;
  source_type?: string;
}

export interface CatalogQueryFilters {
  page?: number;
  per_page?: number;
  q?: string;
  category_id?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  sort?: "newest" | "popular" | "price_low_high" | "price_high_low" | "top_rated";
}

export interface CatalogResponse {
  success: boolean;
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    execution_time_ms: number;
    cached: boolean;
  };
  data: HybridProductItem[];
}

export class HybridApiClient {
  private static BASE_URL = "/api/v1";

  /**
   * Fetch paginated & filtered products with Redis-cached response.
   */
  public static async getProducts(filters: CatalogQueryFilters = {}): Promise<CatalogResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set("page", String(filters.page));
    if (filters.per_page) params.set("per_page", String(filters.per_page));
    if (filters.q) params.set("q", filters.q);
    if (filters.category_id) params.set("category_id", filters.category_id);
    if (filters.category_slug) params.set("category_slug", filters.category_slug);
    if (filters.min_price !== undefined) params.set("min_price", String(filters.min_price));
    if (filters.max_price !== undefined) params.set("max_price", String(filters.max_price));
    if (filters.in_stock_only !== undefined) params.set("in_stock_only", String(filters.in_stock_only));
    if (filters.sort) params.set("sort", filters.sort);

    const res = await fetch(`${this.BASE_URL}/products?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.statusText}`);
    return res.json();
  }

  /**
   * Fetch single product detail by ID or Slug.
   */
  public static async getProductDetail(idOrSlug: string): Promise<HybridProductItem> {
    const res = await fetch(`${this.BASE_URL}/products/${encodeURIComponent(idOrSlug)}`);
    if (!res.ok) throw new Error(`Failed to fetch product details: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  }

  /**
   * Fetch featured hot products.
   */
  public static async getFeaturedProducts(limit = 12): Promise<HybridProductItem[]> {
    const res = await fetch(`${this.BASE_URL}/products/featured?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch featured products`);
    const json = await res.json();
    return json.data || [];
  }

  /**
   * Fetch categories tree.
   */
  public static async getCategories(): Promise<any[]> {
    const res = await fetch(`${this.BASE_URL}/categories`);
    if (!res.ok) throw new Error(`Failed to fetch categories`);
    const json = await res.json();
    return json.data || [];
  }

  /**
   * Ingest product from supplier web link (China Dropship, 1688, Taobao, or any URL).
   */
  public static async importFromWebLink(url: string, overrides: Record<string, any> = {}): Promise<any> {
    const res = await fetch(`${this.BASE_URL}/suppliers/import-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, ...overrides }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to import web link");
    }
    return res.json();
  }

  /**
   * Check system health and Redis metrics.
   */
  public static async getHealth(): Promise<any> {
    const res = await fetch(`${this.BASE_URL}/health`);
    return res.json();
  }

  /**
   * Pre-warm Redis cache.
   */
  public static async warmCache(): Promise<any> {
    const res = await fetch(`${this.BASE_URL}/cache/warm`, { method: "POST" });
    return res.json();
  }

  /**
   * Clear Redis cache.
   */
  public static async clearCache(): Promise<any> {
    const res = await fetch(`${this.BASE_URL}/cache/clear`, { method: "POST" });
    return res.json();
  }
}
