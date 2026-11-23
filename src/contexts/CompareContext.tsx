import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product } from "@/components/products/ProductCard";
import { MAX_COMPARE_PRODUCTS } from "@/services/productCompareService";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const STORAGE_KEY = "durtup_compare_products_v1";

interface CompareContextType {
  compareItems: Product[];
  totalCount: number;
  maxLimit: number;
  isInCompare: (productId: string | number) => boolean;
  addToCompare: (product: Product) => { success: boolean; message: string; limitReached?: boolean };
  removeFromCompare: (productId: string | number) => void;
  clearCompare: () => void;
  isDockOpen: boolean;
  setDockOpen: (open: boolean) => void;
  toggleDock: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

function readLocalCompare(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return [];
}

function writeLocalCompare(items: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_PRODUCTS)));
    window.dispatchEvent(new CustomEvent("durtup_compare_updated"));
  } catch {}
}

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareItems, setCompareItems] = useState<Product[]>(readLocalCompare);
  const [isDockOpen, setDockOpen] = useState<boolean>(true);
  const { toast } = useToast();

  // Sync state across window events and tabs
  useEffect(() => {
    const handleUpdate = () => {
      setCompareItems(readLocalCompare());
    };

    window.addEventListener("durtup_compare_updated", handleUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) handleUpdate();
    });

    return () => {
      window.removeEventListener("durtup_compare_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const isInCompare = useCallback(
    (productId: string | number): boolean => {
      const targetId = String(productId);
      return compareItems.some((p) => String(p.id) === targetId || String(p.slug) === targetId);
    },
    [compareItems]
  );

  const addToCompare = useCallback(
    (product: Product): { success: boolean; message: string; limitReached?: boolean } => {
      const current = readLocalCompare();
      const targetId = String(product.id);

      // 1. Check if already added
      if (current.some((p) => String(p.id) === targetId)) {
        toast({
          title: "ইতিমধ্যে তালিকায় আছে",
          description: `"${product.name.slice(0, 30)}..." ইতিমধ্যে তুলনা তালিকায় যোগ করা আছে।`,
        });
        return { success: false, message: "ইতিমধ্যে যুক্ত আছে" };
      }

      // 2. Check maximum 4 products limit
      if (current.length >= MAX_COMPARE_PRODUCTS) {
        toast({
          title: "তুলনার সর্বোচ্চ সীমা পূর্ণ",
          description: `আপনি সর্বোচ্চ ${MAX_COMPARE_PRODUCTS}টি প্রোডাক্ট একসাথে তুলনা করতে পারবেন। নতুন প্রোডাক্ট যোগ করতে আগের যেকোনো একটি রিমুভ করুন।`,
          variant: "destructive",
        });
        return { success: false, message: "সর্বোচ্চ সীমা পূর্ণ", limitReached: true };
      }

      // 3. Add to list
      const updated = [...current, product];
      writeLocalCompare(updated);
      setCompareItems(updated);
      setDockOpen(true);

      // Toast notification with quick link to compare page
      toast({
        title: "তুলনা তালিকায় যোগ হয়েছে",
        description: `"${product.name.slice(0, 32)}..." সফলভাবে যোগ করা হয়েছে (${updated.length}/${MAX_COMPARE_PRODUCTS})।`,
        action: (
          <ToastAction
            altText="তুলনা দেখুন"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/compare";
              }
            }}
          >
            তুলনা দেখুন
          </ToastAction>
        ),
      });

      return { success: true, message: "সফলভাবে যোগ করা হয়েছে" };
    },
    [toast]
  );

  const removeFromCompare = useCallback(
    (productId: string | number) => {
      const current = readLocalCompare();
      const targetId = String(productId);
      const filtered = current.filter((p) => String(p.id) !== targetId && String(p.slug) !== targetId);
      writeLocalCompare(filtered);
      setCompareItems(filtered);

      toast({
        title: "তালিকা থেকে সরানো হয়েছে",
        description: "প্রোডাক্টটি তুলনা তালিকা থেকে সফলভাবে মুছে ফেলা হয়েছে।",
      });
    },
    [toast]
  );

  const clearCompare = useCallback(() => {
    writeLocalCompare([]);
    setCompareItems([]);
    toast({
      title: "তালিকা খালি করা হয়েছে",
      description: "তুলনা তালিকা থেকে সব প্রোডাক্ট মুছে ফেলা হয়েছে।",
    });
  }, [toast]);

  const toggleDock = useCallback(() => {
    setDockOpen((prev) => !prev);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        totalCount: compareItems.length,
        maxLimit: MAX_COMPARE_PRODUCTS,
        isInCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isDockOpen,
        setDockOpen,
        toggleDock,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export function useCompare(): CompareContextType {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
