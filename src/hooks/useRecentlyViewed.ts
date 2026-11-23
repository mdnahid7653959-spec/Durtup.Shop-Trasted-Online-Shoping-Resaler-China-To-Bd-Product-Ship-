import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLocalRecentlyViewed,
  recordRecentlyViewedProduct,
  mergeGuestHistoryWithAccount,
  clearAllRecentlyViewed,
  RECENTLY_VIEWED_EVENT,
  type RecentlyViewedProduct,
} from "@/services/recentlyViewedService";

export { type RecentlyViewedProduct } from "@/services/recentlyViewedService";

export function useRecentlyViewed() {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>(getLocalRecentlyViewed);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state from local storage or merged database list
  const refresh = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);
      try {
        const merged = await mergeGuestHistoryWithAccount(user.id);
        setRecentlyViewed(merged);
      } catch (err) {
        setRecentlyViewed(getLocalRecentlyViewed());
      } finally {
        setIsLoading(false);
      }
    } else {
      setRecentlyViewed(getLocalRecentlyViewed());
    }
  }, [user?.id]);

  // Initial load and listen for auth change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for real-time window updates across components
  useEffect(() => {
    const handleUpdate = () => {
      setRecentlyViewed(getLocalRecentlyViewed());
    };

    window.addEventListener(RECENTLY_VIEWED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Track product view
  const trackView = useCallback(
    async (productOrId: any) => {
      if (!productOrId) return;
      const productObj = typeof productOrId === "object" ? productOrId : { id: productOrId };
      await recordRecentlyViewedProduct(productObj, user?.id);
    },
    [user?.id]
  );

  // Clear all history
  const clearRecentlyViewed = useCallback(async () => {
    await clearAllRecentlyViewed(user?.id);
    setRecentlyViewed([]);
  }, [user?.id]);

  return {
    recentlyViewed,
    isLoading,
    trackView,
    clearRecentlyViewed,
    refetch: refresh,
  };
}
