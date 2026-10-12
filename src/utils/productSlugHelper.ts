/**
 * Durtup.shop — Product Slug & Canonical URL Utility
 * Generates stable, unique, SEO-friendly slugs and handles canonical URL normalization.
 */

const BASE_URL = "https://durtup.shop";

/**
 * Converts any arbitrary text into a clean, URL-safe slug.
 * Removes dangerous characters, handles punctuation, and trims consecutive hyphens.
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with a hyphen
    .replace(/[\s_]+/g, "-")
    // Keep alphanumeric ASCII, Bengali Unicode characters (\u0980-\u09FF), and hyphens
    .replace(/[^\w\u0980-\u09FF-]/g, "")
    // Collapse multiple consecutive hyphens
    .replace(/--+/g, "-")
    // Trim leading and trailing hyphens
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Generates a stable, unique, SEO-friendly product slug.
 * If the product name doesn't contain the unique ID, optionally appends -{id}
 * to guarantee uniqueness between different products sharing identical names.
 */
export function generateProductSlug(name: string, id?: string | number): string {
  const baseSlug = slugify(name || "product");
  const strId = id ? String(id).trim().replace(/^product-/, "").replace(/^ecom-/, "") : "";

  // If the base slug already ends with the ID, or no ID provided, return baseSlug
  if (!strId || baseSlug.endsWith(`-${strId}`) || baseSlug === strId) {
    return baseSlug || (strId ? `product-${strId}` : "product");
  }

  // Limit slug text portion to ~60 characters for clean URLs
  const trimmedBase = baseSlug.length > 60 ? baseSlug.slice(0, 60).replace(/-+$/, "") : baseSlug;
  return `${trimmedBase}-${strId}`;
}

/**
 * Extracts a numeric product ID from a slug if it was appended as a suffix (e.g. "product-name-1234" -> "1234").
 */
export function extractProductIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();
  const match = clean.match(/-(\d+)$/);
  if (match) return match[1];
  if (/^\d+$/.test(clean)) return clean;
  const prefixMatch = clean.match(/^product-(\d+)$/);
  if (prefixMatch) return prefixMatch[1];
  return null;
}

/**
 * Returns the canonical relative path for a product: /product/{slug}
 */
export function getCanonicalProductPath(slug: string): string {
  const clean = slug.replace(/^\/+/, "").replace(/^product\//, "").replace(/^products\//, "");
  return `/product/${clean}`;
}

/**
 * Returns the full authoritative canonical URL: https://durtup.shop/product/{slug}
 */
export function getCanonicalProductUrl(slug: string): string {
  return `${BASE_URL}${getCanonicalProductPath(slug)}`;
}
