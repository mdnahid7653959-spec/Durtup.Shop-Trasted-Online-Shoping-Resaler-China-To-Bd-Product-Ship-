/**
 * High-performance Instant Product Storage Cache
 * Provides 0ms first-render hydration for direct URLs, page reloads, and fast navigation.
 */
import type { Product } from "@/components/products/ProductCard";

const PREFIX = "durtup_fp_v17_";
const MAX_LOCAL_ITEMS = 40;

if (typeof window !== "undefined") {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("durtup_fp_") && !k.startsWith("durtup_fp_v17_")) {
        localStorage.removeItem(k);
      }
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("durtup_fp_") && !k.startsWith("durtup_fp_v17_")) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {}
}

function cleanKey(raw: string): string {
  if (!raw) return "";
  let k = String(raw).trim().toLowerCase();
  try {
    k = decodeURIComponent(k);
    if (k.includes("%")) {
      try { k = decodeURIComponent(k); } catch {}
    }
  } catch {}
  return k.split("?")[0].split("&")[0].split("#")[0].replace(/\/+$/, "");
}

export function getFastProduct(key: string): Product | null {
  if (typeof window === "undefined" || !key) return null;
  const target = cleanKey(key);
  if (!target) return null;

  const cleanId = target.replace(/^product-/, "").replace(/^supplier-/, "").replace(/^cj_/, "").replace(/^cj-/, "").replace(/^ecom-/, "").replace(/^ecom_/, "");
  const suffixMatch = target.match(/-(\d+)$/);
  const suffixId = suffixMatch ? suffixMatch[1] : (/^\d+$/.test(cleanId) ? cleanId : "");

  const candidateKeys = [
    target,
    `product-${target}`,
    cleanId,
    `product-${cleanId}`,
    suffixId,
    `product-${suffixId}`
  ].filter(Boolean);

  for (const k of candidateKeys) {
    try {
      const sess = sessionStorage.getItem(`${PREFIX}${k}`);
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed && (parsed.name || parsed.title)) return parsed;
      }
    } catch {}

    try {
      const loc = localStorage.getItem(`${PREFIX}${k}`);
      if (loc) {
        const parsed = JSON.parse(loc);
        if (parsed && (parsed.name || parsed.title)) return parsed;
      }
    } catch {}
  }

  return null;
}

export function saveFastProduct(product: any): void {
  if (typeof window === "undefined" || !product) return;
  const slug = cleanKey(product.slug || "");
  const id = cleanKey(String(product.id || ""));
  if (!slug && !id) return;

  const dataStr = JSON.stringify(product);

  const keysToSave = new Set<string>();
  if (slug) keysToSave.add(slug);
  if (id) keysToSave.add(id);

  const suffixMatch = slug.match(/-(\d+)$/);
  if (suffixMatch) keysToSave.add(suffixMatch[1]);

  keysToSave.forEach((k) => {
    try {
      sessionStorage.setItem(`${PREFIX}${k}`, dataStr);
    } catch {}
    try {
      localStorage.setItem(`${PREFIX}${k}`, dataStr);
    } catch {}
  });

  // Track index to prevent localStorage from growing indefinitely
  try {
    const indexKey = `${PREFIX}index`;
    const rawIndex = localStorage.getItem(indexKey);
    let index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    keysToSave.forEach(k => {
      index = [k, ...index.filter(item => item !== k)];
    });
    if (index.length > MAX_LOCAL_ITEMS) {
      const toRemove = index.slice(MAX_LOCAL_ITEMS);
      toRemove.forEach(oldKey => {
        try { localStorage.removeItem(`${PREFIX}${oldKey}`); } catch {}
      });
      index = index.slice(0, MAX_LOCAL_ITEMS);
    }
    localStorage.setItem(indexKey, JSON.stringify(index));
  } catch {}
}
