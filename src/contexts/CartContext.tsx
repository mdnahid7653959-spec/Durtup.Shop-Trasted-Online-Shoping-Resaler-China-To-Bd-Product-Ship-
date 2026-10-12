import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { findMohasagorProductSync } from "@/utils/mohasagorCache";

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

const CART_STORAGE_KEY = "megamart_cart";

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

  const setLocalCart = useCallback((cart: any[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
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
      } catch (e) {
        console.error("Firestore cart sync error:", e);
      }
    }
  }, [user, setLocalCart]);

  const fetchCart = useCallback(async () => {
    try {
      let rawItems: any[] = [];
      const localCart = getLocalCart();
      const currentUserId = auth.currentUser?.uid || (user as any)?.uid || user?.id;

      if (currentUserId) {
        const cartRef = doc(db, "carts", currentUserId);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          // Firestore is authoritative when user is logged in
          rawItems = cartSnap.data().items || [];
          setLocalCart(rawItems);
        } else {
          // First time user signs in: save local guest cart to Firestore once
          if (Array.isArray(localCart) && localCart.length > 0) {
            rawItems = localCart;
            await setDoc(cartRef, { items: localCart, updatedAt: new Date().toISOString() }, { merge: true });
          } else {
            rawItems = [];
            setLocalCart([]);
          }
        }
      } else {
        rawItems = localCart;
      }

      if (!rawItems || rawItems.length === 0) {
        setItems([]);
        setLocalCart([]);
        return;
      }

      const formatted: CartItem[] = rawItems.map((item: any) => {
        const matched = item.product ? null : findMohasagorProductSync(item.product_id || item.id);
        const prodData = item.product || (matched ? {
          id: matched.id,
          name: matched.name,
          slug: matched.slug,
          regular_price: matched.originalPrice || matched.price,
          discount_price: matched.price,
          stock_quantity: 50
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
          image: item.image || matched?.image || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"
        };
      });

      setItems(formatted);
      setLocalCart(formatted);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
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

      // Determine image
      const prodImg = (isObject && (productOrId.image || productOrId.product_images?.[0]?.image_url || productOrId.images?.[0])) 
        ? (productOrId.image || productOrId.product_images?.[0]?.image_url || productOrId.images?.[0]) 
        : (targetProd?.image || targetProd?.product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400");

      let updated: CartItem[] = [];
      setItems((prev) => {
        const existingIdx = prev.findIndex(item => 
          (item.product_id === productId || item.id === productId) && 
          (JSON.stringify(item.selected_variants || {}) === JSON.stringify(variants || {}) || item.variant_name === variantName)
        );

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
              stock_quantity: targetProd?.stock_quantity ?? targetProd?.stock ?? 50
            },
            image: prodImg
          };
          updated = [...prev, newItem];
        }
        return updated;
      });

      // Synchronize immediately to localStorage and trigger background Firebase sync
      setLocalCart(updated);
      syncCartToFirebase(updated).catch(() => {});

      toast({
        title: "Added to cart!",
        description: variantName ? `Selected: ${variantName}` : "Item has been added to your shopping cart."
      });
    } catch (err) {
      console.error("addToCart unexpected error:", err);
    }
  }, [setLocalCart, syncCartToFirebase, toast]);

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
    await syncCartToFirebase([]);
  }, [syncCartToFirebase]);

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
