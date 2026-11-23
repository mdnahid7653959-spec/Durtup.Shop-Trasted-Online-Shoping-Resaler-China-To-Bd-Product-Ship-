import { supabase } from "@/lib/firebaseAdapter";
import type { Product } from "@/components/products/ProductCard";

export interface RecentlyViewedProduct extends Product {
  viewed_at: string;
  is_out_of_stock?: boolean;
}

export const RECENTLY_VIEWED_STORAGE_KEY = "recently_viewed_products";
export const RECENTLY_VIEWED_EVENT = "durtup_recently_viewed_updated";
export const MAX_RECENTLY_VIEWED = 20;

/**
 * Dispatch custom window event so all open components re-render immediately
 */
function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_EVENT));
  }
}

/**
 * Sanitize and extract clean product snapshot
 */
function sanitizeProduct(p: any): RecentlyViewedProduct | null {
  if (!p) return null;
  const id = String(p.id || p._id || "").trim();
  const name = String(p.name || p.title || "").trim();
  if (!id || !name) return null;

  const slug = String(p.slug || `product-${id}`).trim();

  // Extract best image
  let image = "";
  if (typeof p.image === "string" && p.image) image = p.image;
  else if (typeof p.image_url === "string" && p.image_url) image = p.image_url;
  else if (Array.isArray(p.images) && p.images[0]) {
    image = typeof p.images[0] === "string" ? p.images[0] : p.images[0].image_url || p.images[0].url || "";
  } else if (Array.isArray(p.product_images) && p.product_images[0]) {
    const primary = p.product_images.find((img: any) => img.is_primary);
    const target = primary || p.product_images[0];
    image = typeof target === "string" ? target : target.image_url || target.url || "";
  }

  const price = Math.round(Number(p.discount_price || p.price || p.selling_price || p.regular_price || 0));
  const rawOriginal = p.originalPrice || (p.discount_price ? p.regular_price : undefined);
  const originalPrice = rawOriginal ? Math.round(Number(rawOriginal)) : undefined;

  const stock = typeof p.stock === "number" ? p.stock : (typeof p.stock_quantity === "number" ? p.stock_quantity : undefined);
  const isOutOfStock = Boolean(
    p.is_out_of_stock || 
    p.stock_status === "out_of_stock" || 
    (stock !== undefined && stock <= 0)
  );

  return {
    id,
    name,
    slug,
    image,
    price,
    originalPrice,
    rating: Number(p.rating || p.rating_average || 4.8),
    reviews: Number(p.reviews || p.rating_count || p.reviews_count || 15),
    sold: Number(p.sold || p.sold_count || 45),
    category: p.category || p.category_name || p.category_slug || "",
    category_name: p.category_name || p.category || "",
    stock,
    is_out_of_stock: isOutOfStock,
    viewed_at: p.viewed_at || new Date().toISOString(),
  };
}

/**
 * Get recently viewed products from localStorage (0ms synchronous read)
 */
export function getLocalRecentlyViewed(): RecentlyViewedProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    return list
      .map(sanitizeProduct)
      .filter((p): p is RecentlyViewedProduct => p !== null)
      .slice(0, MAX_RECENTLY_VIEWED);
  } catch (err) {
    console.warn("Failed to load local recently viewed:", err);
    return [];
  }
}

/**
 * Save recently viewed products to localStorage (capped at 20, no duplicates, most recent first)
 */
export function saveLocalRecentlyViewed(items: RecentlyViewedProduct[]) {
  if (typeof window === "undefined") return;
  try {
    const capped = items.slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(capped));
    notifyUpdate();
  } catch (err) {
    console.warn("Failed to save local recently viewed:", err);
  }
}

/**
 * Record a product view: automatically saves, moves to top, avoids duplicates, syncs with account
 */
export async function recordRecentlyViewedProduct(rawProduct: any, userId?: string | null) {
  const product = sanitizeProduct(rawProduct);
  if (!product) return;

  // 1. Update localStorage instantly (0ms)
  const existing = getLocalRecentlyViewed();
  // Remove duplicate if already present
  const filtered = existing.filter((p) => p.id !== product.id && p.slug !== product.slug);

  // Prepend new view at index 0
  const updated: RecentlyViewedProduct[] = [
    { ...product, viewed_at: new Date().toISOString() },
    ...filtered,
  ].slice(0, MAX_RECENTLY_VIEWED);

  saveLocalRecentlyViewed(updated);

  // 2. If logged in, sync to database in background
  if (userId) {
    try {
      await supabase
        .from("recently_viewed")
        .upsert(
          {
            user_id: userId,
            product_id: product.id,
            product_data: product,
            viewed_at: product.viewed_at,
            view_count: 1,
          },
          { onConflict: "user_id,product_id" }
        );
    } catch (dbErr) {
      // Non-blocking background sync warning
      console.warn("Background recently_viewed sync note:", dbErr);
    }
  }
}

/**
 * Fetch recently viewed products from database for logged in user
 */
export async function fetchUserRecentlyViewedFromDB(userId: string): Promise<RecentlyViewedProduct[]> {
  try {
    const { data, error } = await supabase
      .from("recently_viewed")
      .select("product_id, viewed_at, product_data")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(MAX_RECENTLY_VIEWED);

    if (error || !data) return [];

    return data
      .map((row: any) => {
        const item = row.product_data || { id: row.product_id };
        item.viewed_at = row.viewed_at || item.viewed_at;
        return sanitizeProduct(item);
      })
      .filter((p): p is RecentlyViewedProduct => p !== null);
  } catch (err) {
    console.warn("fetchUserRecentlyViewedFromDB warning:", err);
    return [];
  }
}

/**
 * Merge guest browsing history with user's account upon login
 */
export async function mergeGuestHistoryWithAccount(userId: string): Promise<RecentlyViewedProduct[]> {
  if (!userId) return getLocalRecentlyViewed();

  try {
    const localItems = getLocalRecentlyViewed();
    const dbItems = await fetchUserRecentlyViewedFromDB(userId);

    // Merge both lists: combine and deduplicate keeping latest viewed_at
    const mergedMap = new Map<string, RecentlyViewedProduct>();

    // Add DB items
    for (const item of dbItems) {
      mergedMap.set(item.id, item);
    }

    // Merge or overwrite with local items (guest items are usually more recent)
    for (const item of localItems) {
      const existing = mergedMap.get(item.id);
      if (!existing || new Date(item.viewed_at) > new Date(existing.viewed_at)) {
        mergedMap.set(item.id, item);
      }
    }

    const mergedList = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
      .slice(0, MAX_RECENTLY_VIEWED);

    // Save merged result back to localStorage
    saveLocalRecentlyViewed(mergedList);

    // Persist guest additions back to database
    for (const item of localItems) {
      await supabase
        .from("recently_viewed")
        .upsert(
          {
            user_id: userId,
            product_id: item.id,
            product_data: item,
            viewed_at: item.viewed_at,
            view_count: 1,
          },
          { onConflict: "user_id,product_id" }
        )
        .catch(() => {});
    }

    return mergedList;
  } catch (err) {
    console.warn("mergeGuestHistoryWithAccount error:", err);
    return getLocalRecentlyViewed();
  }
}

/**
 * Clear all recently viewed products (both local storage & database)
 */
export async function clearAllRecentlyViewed(userId?: string | null) {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
      notifyUpdate();
    } catch {}
  }

  if (userId) {
    try {
      await supabase
        .from("recently_viewed")
        .delete()
        .eq("user_id", userId);
    } catch (err) {
      console.warn("Failed to clear recently viewed from DB:", err);
    }
  }
}
