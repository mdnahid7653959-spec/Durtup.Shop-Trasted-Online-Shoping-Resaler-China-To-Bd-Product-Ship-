import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { findMohasagorProductSync } from "@/utils/mohasagorCache";
import { getDirectImageUrl, getSmartProductImage } from "@/utils/productImageHelper";
import { recordOrUpdateCartState } from "@/services/abandonedCartService";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  variant_id?: string | null;
  selected_variants?: Record<string, string>;
  color?: string | null;
  size?: string | null;
  variant_name?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    regular_price: number;
    discount_price: number | null;
    stock_quantity: number;
  };
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number, variants?: Record<string, string>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CART_STORAGE_KEY = "megamart_cart";
export const CART_OWNER_KEY = "megamart_cart_owner";

/**
 * Generates a canonical, order-independent, case-insensitive key for cart item variants.
 * Handles selected_variants objects, variant_id JSON strings, color, size, and variant_name.
 */
export function getNormalizedVariantKey(item: Partial<CartItem>): string {
  const map = new Map<string, string>();

  // 1. selected_variants map
  if (item.selected_variants && typeof item.selected_variants === "object") {
    for (const [k, v] of Object.entries(item.selected_variants)) {
      if (k && v !== undefined && v !== null) {
        map.set(k.toLowerCase().trim(), String(v).toLowerCase().trim());
      }
    }
  }

  // 2. variant_id (handles JSON stringified variants or raw SKU/variant id)
  if (item.variant_id && typeof item.variant_id === "string") {
    try {
      const parsed = JSON.parse(item.variant_id);
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (k && v !== undefined && v !== null && !map.has(k.toLowerCase().trim())) {
            map.set(k.toLowerCase().trim(), String(v).toLowerCase().trim());
          }
        }
      } else if (!map.has("variant_id")) {
        map.set("variant_id", item.variant_id.toLowerCase().trim());
      }
    } catch {
      if (!map.has("variant_id")) {
        map.set("variant_id", item.variant_id.toLowerCase().trim());
      }
    }
  }

  // 3. Direct color and size attributes
  if (item.color && !map.has("color")) {
    map.set("color", String(item.color).toLowerCase().trim());
  }
  if (item.size && !map.has("size")) {
    map.set("size", String(item.size).toLowerCase().trim());
  }

  // 4. Fallback to variant_name if map is empty
  if (map.size === 0 && item.variant_name && typeof item.variant_name === "string") {
    return item.variant_name.toLowerCase().trim();
  }

  if (map.size === 0) {
    return "";
  }

  // 5. Deterministic sorting ensures { Color: "Red", Size: "M" } === { size: "M", color: "Red" }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

/**
 * Merges guest cart items into customer remote cart items.
 * - Matches by normalized product_id and canonical variant key.
 * - Combines quantities (remote.quantity + guest.quantity) capped at product stock limits.
 * - Appends unique guest items.
 * - Preserves product metadata and images.
 */
export function mergeCartItems(remoteItems: CartItem[] = [], guestItems: CartItem[] = []): CartItem[] {
  if (!Array.isArray(remoteItems)) remoteItems = [];
  if (!Array.isArray(guestItems)) guestItems = [];

  if (remoteItems.length === 0 && guestItems.length === 0) return [];
  if (remoteItems.length === 0) return [...guestItems];
  if (guestItems.length === 0) return [...remoteItems];

  const merged: CartItem[] = [];
  const matchedGuestIndices = new Set<number>();

  // 1. Process all remote items
  for (const remoteItem of remoteItems) {
    const remoteProdId = String(remoteItem.product_id || remoteItem.id || "").trim().toLowerCase();
    const remoteVarKey = getNormalizedVariantKey(remoteItem);

    // Look for matching guest item
    let matchIdx = -1;
    for (let i = 0; i < guestItems.length; i++) {
      if (matchedGuestIndices.has(i)) continue;
      const guestItem = guestItems[i];
      const guestProdId = String(guestItem.product_id || guestItem.id || "").trim().toLowerCase();
      const guestVarKey = getNormalizedVariantKey(guestItem);

      if (remoteProdId === guestProdId && remoteVarKey === guestVarKey) {
        matchIdx = i;
        break;
      }
    }

    if (matchIdx >= 0) {
      matchedGuestIndices.add(matchIdx);
      const guestItem = guestItems[matchIdx];

      const maxStock = Math.max(
        1,
        (typeof guestItem.product?.stock_quantity === "number" && guestItem.product.stock_quantity > 0)
          ? guestItem.product.stock_quantity
          : (typeof remoteItem.product?.stock_quantity === "number" && remoteItem.product.stock_quantity > 0)
            ? remoteItem.product.stock_quantity
            : 999
      );

      const combinedQuantity = Math.max(1, Math.min(
        (Number(remoteItem.quantity) || 1) + (Number(guestItem.quantity) || 1),
        maxStock
      ));

      merged.push({
        ...remoteItem,
        ...guestItem,
        id: remoteItem.id || guestItem.id || `cart-${remoteItem.product_id || guestItem.product_id}`,
        product_id: remoteItem.product_id || guestItem.product_id,
        quantity: combinedQuantity,
        product: {
          ...(remoteItem.product || {}),
          ...(guestItem.product || {}),
          stock_quantity: maxStock
        },
        image: guestItem.image || remoteItem.image
      });
    } else {
      merged.push({ ...remoteItem });
    }
  }

  // 2. Append unmatched guest items (with internal deduplication)
  for (let i = 0; i < guestItems.length; i++) {
    if (!matchedGuestIndices.has(i)) {
      const guestItem = guestItems[i];
      const guestProdId = String(guestItem.product_id || guestItem.id || "").trim().toLowerCase();
      const guestVarKey = getNormalizedVariantKey(guestItem);

      const existingInMerged = merged.find(m =>
        String(m.product_id || m.id || "").trim().toLowerCase() === guestProdId &&
        getNormalizedVariantKey(m) === guestVarKey
      );

      if (existingInMerged) {
        const maxStock = Math.max(
          1,
          typeof existingInMerged.product?.stock_quantity === "number" && existingInMerged.product.stock_quantity > 0
            ? existingInMerged.product.stock_quantity
            : 999
        );
        existingInMerged.quantity = Math.max(1, Math.min(
          existingInMerged.quantity + (Number(guestItem.quantity) || 1),
          maxStock
        ));
      } else {
        merged.push({ ...guestItem });
      }
    }
  }

  return merged;
}

function formatRawCartItem(item: any): CartItem {
  const matched = item.product ? null : findMohasagorProductSync(item.product_id || item.id);
  const prodData = item.product || (matched ? {
    id: matched.id,
    name: matched.name,
    slug: matched.slug,
    regular_price: matched.originalPrice || matched.price,
    discount_price: matched.price,
    stock_quantity: matched.stock_quantity ?? (matched as any).stock ?? 50
  } : {
    id: item.product_id || item.id || "item",
    name: item.name || "Product",
    slug: `product-${item.product_id || item.id}`,
    regular_price: item.price || 100,
    discount_price: null,
    stock_quantity: 50
  });

  // Resolve variant text
  let variantName = item.variant_name || null;
  if (!variantName && item.selected_variants) {
    variantName = Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(", ");
  } else if (!variantName && item.variant_id) {
    try {
      const parsed = JSON.parse(item.variant_id);
      if (typeof parsed === "object") {
        variantName = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(", ");
      }
    } catch {}
  }

  return {
    id: item.id || `cart-${item.product_id || item.id}`,
    product_id: item.product_id || item.id,
    quantity: item.quantity || 1,
    variant_id: item.variant_id || null,
    selected_variants: item.selected_variants || null,
    color: item.color || item.selected_variants?.Color || item.selected_variants?.color || null,
    size: item.size || item.selected_variants?.Size || item.selected_variants?.size || null,
    variant_name: variantName,
    product: prodData,
    image: getDirectImageUrl(item.image || matched?.image || matched?.product_images?.[0]?.image_url) || item.image || matched?.image || getSmartProductImage(prodData.name, "", "")
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const getLocalCart = useCallback((): any[] => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const cartVersionRef = useRef<number>(0);
  const inFlightFetchRef = useRef<Promise<void> | null>(null);
  const prevUserRef = useRef<string | null>(null);

  const setLocalCart = useCallback((cart: any[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, []);

  // Safe Logout Detection Effect
  useEffect(() => {
    const currentUid = auth.currentUser?.uid || (user as any)?.uid || user?.id || null;
    // If user transitioned from logged-in to logged-out
    if (prevUserRef.current && !currentUid) {
      setItems([]);
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_OWNER_KEY);
        localStorage.removeItem("cj_cart");
      } catch {}
    }
    prevUserRef.current = currentUid;
  }, [user]);

  // Multi-tab Storage Event Listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch {}
      } else if (e.key === CART_STORAGE_KEY && !e.newValue) {
        setItems([]);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const syncCartToFirebase = useCallback(async (newItems: CartItem[]) => {
    setLocalCart(newItems);
    const currentUserId = auth.currentUser?.uid || (user as any)?.uid || user?.id;
    if (currentUserId) {
      try {
        await setDoc(doc(db, "carts", currentUserId), {
          items: newItems,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Record or update abandoned cart tracking state in background
        recordOrUpdateCartState(currentUserId, newItems, {
          email: user?.email || undefined,
          name: (user as any)?.displayName || (user as any)?.full_name || undefined,
        }).catch(() => {});
      } catch (e) {
        console.error("Firestore cart sync error:", e);
      }
    }
  }, [user, setLocalCart]);

  const fetchCart = useCallback(async () => {
    if (inFlightFetchRef.current) {
      return inFlightFetchRef.current;
    }

    const opVersion = ++cartVersionRef.current;

    const runFetch = async () => {
      try {
        setLoading(true);
        let rawItems: any[] = [];
        const localCart = getLocalCart();
        const currentUserId = auth.currentUser?.uid || (user as any)?.uid || user?.id;
        const cartOwner = typeof window !== "undefined" ? localStorage.getItem(CART_OWNER_KEY) : null;

        if (currentUserId) {
          const cartRef = doc(db, "carts", currentUserId);
          let remoteItems: any[] = [];
          let docExists = false;

          try {
            const cartSnap = await getDoc(cartRef);
            if (cartSnap.exists()) {
              docExists = true;
              remoteItems = cartSnap.data().items || [];
            }
          } catch (readErr) {
            console.warn("Firestore cart fetch notice, falling back to local:", readErr);
          }

          // Case 1: Transition from Guest to Authenticated
          // Local cart has items AND owner is guest (or unassigned)
          const isGuestCart = !cartOwner || cartOwner === "guest";
          if (isGuestCart && Array.isArray(localCart) && localCart.length > 0) {
            // Perform Merge!
            const merged = mergeCartItems(remoteItems, localCart);
            rawItems = merged;

            // Sync merged back to Firestore
            try {
              await setDoc(cartRef, {
                items: merged,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (writeErr) {
              console.error("Firestore cart merge write error:", writeErr);
            }

            // Mark current user as the authoritative owner
            setLocalCart(merged);
            try {
              localStorage.setItem(CART_OWNER_KEY, currentUserId);
            } catch {}
          } 
          // Case 2: Different user was logged in previously on this machine
          else if (cartOwner && cartOwner !== "guest" && cartOwner !== currentUserId) {
            // Discard foreign local cart, load this user's remote items
            rawItems = remoteItems;
            setLocalCart(rawItems);
            try {
              localStorage.setItem(CART_OWNER_KEY, currentUserId);
            } catch {}
          }
          // Case 3: Returning session or page reload by the SAME authenticated user
          else if (docExists) {
            rawItems = remoteItems;
            setLocalCart(rawItems);
            try {
              localStorage.setItem(CART_OWNER_KEY, currentUserId);
            } catch {}
          }
          // Case 4: First time user sign-in with empty local cart
          else {
            rawItems = [];
            setLocalCart([]);
            try {
              localStorage.setItem(CART_OWNER_KEY, currentUserId);
            } catch {}
          }
        } else {
          // Unauthenticated guest browsing
          rawItems = localCart;
          try {
            if (!cartOwner) localStorage.setItem(CART_OWNER_KEY, "guest");
          } catch {}
        }

        // Check if another cart operation happened while this fetch was in flight
        if (opVersion !== cartVersionRef.current) {
          return;
        }

        if (!rawItems || rawItems.length === 0) {
          setItems([]);
          setLocalCart([]);
          return;
        }

        // Format items
        const formatted: CartItem[] = rawItems.map((item: any) => formatRawCartItem(item));

        setItems(formatted);
        setLocalCart(formatted);
      } catch (err) {
        console.error("Failed to load cart:", err);
      } finally {
        setLoading(false);
        inFlightFetchRef.current = null;
      }
    };

    inFlightFetchRef.current = runFetch();
    return inFlightFetchRef.current;
  }, [user, getLocalCart, setLocalCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productOrId: any, quantity: number = 1, variants?: Record<string, string>) => {
    try {
      const isObject = typeof productOrId === "object" && productOrId !== null;
      const productId = String(isObject ? (productOrId.id || productOrId.product_id) : productOrId);

      // Fast synchronous lookup
      const syncMatch = findMohasagorProductSync(productId);
      const targetProd = isObject ? productOrId : syncMatch;

      const variantKey = variants && Object.keys(variants).length > 0 ? JSON.stringify(variants) : "";
      const variantName = variants && Object.keys(variants).length > 0 
        ? Object.entries(variants).map(([k, v]) => `${k}: ${v}`).join(", ")
        : (isObject ? productOrId.variant_name || null : null);
      const color = variants?.Color || variants?.color || (isObject ? (productOrId.color || productOrId.selected_variants?.Color || productOrId.selected_variants?.color) : null);
      const size = variants?.Size || variants?.size || (isObject ? (productOrId.size || productOrId.selected_variants?.Size || productOrId.selected_variants?.size) : null);

      // Determine price accurately
      let regularPrice = 100;
      let discountPrice: number | null = null;

      if (targetProd) {
        const rawReg = Number(targetProd.regular_price || targetProd.originalPrice || targetProd.price || 0);
        const rawDisc = targetProd.discount_price !== undefined && targetProd.discount_price !== null 
          ? Number(targetProd.discount_price) 
          : (targetProd.price ? Number(targetProd.price) : null);

        if (rawDisc !== null && rawDisc > 0 && rawReg > rawDisc) {
          regularPrice = rawReg;
          discountPrice = rawDisc;
        } else if (rawDisc !== null && rawDisc > 0) {
          regularPrice = rawDisc;
          discountPrice = rawDisc;
        } else if (rawReg > 0) {
          regularPrice = rawReg;
          discountPrice = rawReg;
        }
      }

      // Determine authentic product image
      const rawCandidate = (isObject && (productOrId.image || productOrId.product_images?.[0]?.image_url || productOrId.images?.[0])) 
        ? (productOrId.image || productOrId.product_images?.[0]?.image_url || productOrId.images?.[0]) 
        : (targetProd?.image || targetProd?.product_images?.[0]?.image_url || targetProd?.images?.[0]);
      const prodImg = getDirectImageUrl(rawCandidate) || rawCandidate || getSmartProductImage(targetProd?.name || (productOrId as any)?.name || "", "", "");

      const candidateVarKey = getNormalizedVariantKey({ selected_variants: variants, variant_id: variantKey, color, size, variant_name: variantName });

      let updated: CartItem[] = [];
      setItems((prev) => {
        const existingIdx = prev.findIndex(item => {
          const itemProdId = String(item.product_id || item.id || "").trim().toLowerCase();
          const cleanProdId = productId.trim().toLowerCase();
          if (itemProdId !== cleanProdId) return false;
          return getNormalizedVariantKey(item) === candidateVarKey;
        });

        if (existingIdx > -1) {
          updated = prev.map((item, idx) => 
            idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          const newItem: CartItem = {
            id: `cart-${productId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            product_id: productId,
            quantity,
            variant_id: variantKey || null,
            selected_variants: variants || undefined,
            color,
            size,
            variant_name: variantName,
            product: {
              id: productId,
              name: targetProd ? (targetProd.name || targetProd.title || "Product") : (isObject ? (productOrId.name || "Product") : "Product"),
              slug: targetProd ? (targetProd.slug || `product-${productId}`) : (isObject ? (productOrId.slug || `product-${productId}`) : `product-${productId}`),
              regular_price: regularPrice,
              discount_price: discountPrice,
              stock_quantity: targetProd?.stock_quantity ?? (targetProd as any)?.stock ?? 50
            },
            image: prodImg
          };
          updated = [...prev, newItem];
        }
        return updated;
      });

      // Synchronize immediately to localStorage and trigger background Firebase sync
      const currentUserId = auth.currentUser?.uid || (user as any)?.uid || user?.id;
      try {
        localStorage.setItem(CART_OWNER_KEY, currentUserId || "guest");
      } catch {}

      setLocalCart(updated);
      syncCartToFirebase(updated).catch(() => {});

      toast({
        title: "Added to cart!",
        description: variantName ? `Selected: ${variantName}` : "Item has been added to your shopping cart."
      });
    } catch (err) {
      console.error("addToCart unexpected error:", err);
    }
  }, [setLocalCart, syncCartToFirebase, toast, user]);

  const removeItem = useCallback(async (targetId: string) => {
    if (!targetId) return;
    const targetStr = String(targetId).toLowerCase().trim();
    const cleanTarget = targetStr.replace(/^cart-/, "").replace(/^product-/, "");

    let updated: CartItem[] = [];
    setItems((prev) => {
      updated = prev.filter((item) => {
        const id = String(item.id || "").toLowerCase().trim();
        const pId = String(item.product_id || "").toLowerCase().trim();
        const prodId = String(item.product?.id || "").toLowerCase().trim();
        const cleanId = id.replace(/^cart-/, "").replace(/^product-/, "");
        const cleanPId = pId.replace(/^cart-/, "").replace(/^product-/, "");
        const cleanProdId = prodId.replace(/^cart-/, "").replace(/^product-/, "");

        const isMatch =
          id === targetStr ||
          pId === targetStr ||
          prodId === targetStr ||
          cleanId === cleanTarget ||
          cleanPId === cleanTarget ||
          cleanProdId === cleanTarget;

        return !isMatch;
      });
      return updated;
    });

    await syncCartToFirebase(updated);

    toast({
      title: "Item removed",
      description: "Item removed from your cart."
    });
  }, [syncCartToFirebase, toast]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    let updated: CartItem[] = [];
    setItems((prev) => {
      updated = prev.map(item => (item.id === itemId || item.product_id === itemId) ? { ...item, quantity } : item);
      return updated;
    });
    await syncCartToFirebase(updated);
  }, [removeItem, syncCartToFirebase]);

  const clearCart = useCallback(async () => {
    setItems([]);
    setLocalCart([]);
    await syncCartToFirebase([]);
  }, [setLocalCart, syncCartToFirebase]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = item.product.discount_price || item.product.regular_price;
      return acc + price * item.quantity;
    }, 0);
  }, [items]);

  const value = useMemo(() => ({
    items,
    loading,
    itemCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  }), [items, loading, itemCount, subtotal, addToCart, updateQuantity, removeItem, clearCart, fetchCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
