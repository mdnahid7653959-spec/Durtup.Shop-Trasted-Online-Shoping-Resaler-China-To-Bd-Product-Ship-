import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { findMohasagorProductSync } from "@/utils/mohasagorCache";
import { supabase } from "@/lib/firebaseAdapter";
import { getSmartProductImage } from "@/utils/productImageHelper";

export interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    regular_price: number;
    discount_price: number | null;
    stock_quantity?: number | null;
  };
  image?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  itemCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "megamart_wishlist";

async function resolveProductInfo(productId: string): Promise<{
  id: string;
  name: string;
  slug: string;
  regular_price: number;
  discount_price: number | null;
  image: string;
  stock_quantity?: number;
}> {
  const pid = String(productId);
  const cleanId = pid.replace("product-", "").replace("supplier-", "");

  // 1. Check Mohasagor catalog via instant O(1) hash map
  const matched = findMohasagorProductSync(pid);
  if (matched) {
    return {
      id: String(matched.id),
      name: matched.name,
      slug: matched.slug || `product-${matched.id}`,
      regular_price: matched.originalPrice || matched.price || 0,
      discount_price: matched.originalPrice ? matched.price : null,
      image: getSmartProductImage(matched.name, matched.image, (matched as any).category || ""),
      stock_quantity: 50,
    };
  }

  // 2. Check Local Storage admin products
  try {
    const rawLocal = localStorage.getItem("enterprise_admin_products") || localStorage.getItem("local_products");
    if (rawLocal) {
      const list = JSON.parse(rawLocal);
      if (Array.isArray(list)) {
        const found = list.find((p: any) => String(p.id) === pid || p.slug === pid);
        if (found) {
          const img = found.images?.[0] || found.product_images?.[0]?.image_url || found.image_url || found.image;
          return {
            id: String(found.id),
            name: found.name || found.title || "Product",
            slug: found.slug || pid,
            regular_price: Number(found.regular_price || found.price || 0),
            discount_price: found.discount_price ? Number(found.discount_price) : null,
            image: getSmartProductImage(found.name || "", img, found.category || ""),
            stock_quantity: Number(found.stock_quantity || found.stock || 50),
          };
        }
      }
    }
  } catch {}

  // 3. Query Supabase
  try {
    const { data: dbProd } = await supabase
      .from("products")
      .select("id, name, slug, regular_price, discount_price, stock_quantity, image, product_images(image_url)")
      .or(`id.eq.${pid},slug.eq.${pid}`)
      .maybeSingle();

    if (dbProd) {
      const img = dbProd.image || dbProd.product_images?.[0]?.image_url;
      return {
        id: String(dbProd.id),
        name: dbProd.name,
        slug: dbProd.slug || pid,
        regular_price: Number(dbProd.regular_price || 0),
        discount_price: dbProd.discount_price ? Number(dbProd.discount_price) : null,
        image: getSmartProductImage(dbProd.name, img, ""),
        stock_quantity: dbProd.stock_quantity ?? 50,
      };
    }
  } catch {}

  return {
    id: pid,
    name: "Product",
    slug: `product-${cleanId}`,
    regular_price: 1000,
    discount_price: null,
    image: getSmartProductImage("Product", "", ""),
    stock_quantity: 50,
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const getLocalWishlist = useCallback(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const setLocalWishlist = useCallback((wishlist: any[]) => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, []);

  const syncWishlistToFirebase = useCallback(async (newItems: WishlistItem[]) => {
    const rawIds = newItems.map(i => i.product_id);
    setLocalWishlist(rawIds);
    const currentUserId = auth.currentUser?.uid || (user as any)?.uid || user?.id;
    if (currentUserId) {
      try {
        await setDoc(doc(db, "wishlists", currentUserId), {
          items: newItems,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Wishlist Firestore sync error:", e);
      }
    }
  }, [user, setLocalWishlist]);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      let rawItems: any[] = [];
      const currentUserId = auth.currentUser?.uid || (user as any)?.uid || user?.id;

      if (currentUserId) {
        try {
          const ref = doc(db, "wishlists", currentUserId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            rawItems = snap.data().items || [];
            // Keep local storage in sync with Firestore
            setLocalWishlist(rawItems.map((i: any) => typeof i === 'string' ? i : (i.product_id || i.id)));
          } else {
            const localWishlist = getLocalWishlist();
            if (Array.isArray(localWishlist) && localWishlist.length > 0) {
              rawItems = localWishlist;
              await setDoc(ref, { items: localWishlist, updatedAt: new Date().toISOString() }, { merge: true });
            } else {
              rawItems = [];
              setLocalWishlist([]);
            }
          }
        } catch {
          rawItems = getLocalWishlist();
        }
      } else {
        rawItems = getLocalWishlist();
      }

      if (!rawItems || rawItems.length === 0) {
        setItems([]);
        setLocalWishlist([]);
        setLoading(false);
        return;
      }

      const formatted: WishlistItem[] = await Promise.all(
        rawItems.map(async (item: any) => {
          const pid = typeof item === 'string' ? item : (item.product_id || item.id);
          const info = await resolveProductInfo(pid);
          return {
            id: `wish-${pid}`,
            product_id: pid,
            product: {
              id: info.id,
              name: info.name,
              slug: info.slug,
              regular_price: info.regular_price,
              discount_price: info.discount_price,
              stock_quantity: info.stock_quantity ?? 50,
            },
            image: info.image,
          };
        })
      );

      setItems(formatted);
      setLocalWishlist(formatted.map(i => i.product_id));
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [user, getLocalWishlist, setLocalWishlist]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    if (!productId) return false;
    const target = String(productId).replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
    return items.some(item => {
      const pid = String(item.product_id || "").replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
      const id = String(item.id || "").replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
      const prodId = String(item.product?.id || "").replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
      return pid === target || id === target || prodId === target;
    });
  }, [items]);

  const addToWishlist = useCallback(async (productId: string) => {
    if (!productId || isInWishlist(productId)) return;
    const cleanId = String(productId).replace(/^wish-/, "").replace(/^product-/, "").trim();
    const info = await resolveProductInfo(cleanId);

    const newItem: WishlistItem = {
      id: `wish-${cleanId}`,
      product_id: String(cleanId),
      product: {
        id: info.id,
        name: info.name,
        slug: info.slug,
        regular_price: info.regular_price,
        discount_price: info.discount_price,
        stock_quantity: info.stock_quantity ?? 50,
      },
      image: info.image,
    };

    let updated: WishlistItem[] = [];
    setItems(prev => {
      updated = [...prev, newItem];
      return updated;
    });

    await syncWishlistToFirebase(updated);

    toast({
      title: "Added to wishlist",
      description: "Item saved to your wishlist."
    });
  }, [isInWishlist, syncWishlistToFirebase, toast]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!productId) return;
    const target = String(productId).replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();

    let updated: WishlistItem[] = [];
    setItems(prev => {
      updated = prev.filter(item => {
        const pid = String(item.product_id || "").replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
        const id = String(item.id || "").replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
        const prodId = String(item.product?.id || "").replace(/^wish-/, "").replace(/^product-/, "").toLowerCase().trim();
        return pid !== target && id !== target && prodId !== target;
      });
      return updated;
    });

    await syncWishlistToFirebase(updated);

    toast({
      title: "Removed from wishlist",
      description: "Item removed from your wishlist."
    });
  }, [syncWishlistToFirebase, toast]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  const itemCount = useMemo(() => items.length, [items]);

  const value = useMemo(() => ({
    items,
    loading,
    itemCount,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  }), [items, loading, itemCount, isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
