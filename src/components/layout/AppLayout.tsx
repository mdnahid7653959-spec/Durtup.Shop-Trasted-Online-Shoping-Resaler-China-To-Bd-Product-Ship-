import { ReactNode, useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAppHistoryTracker } from "@/hooks/useSmartBack";

const PushNotificationInitializer = lazy(() => import("@/components/PushNotificationInitializer").then(m => ({ default: m.PushNotificationInitializer })));

interface AppLayoutProps {
  children: ReactNode;
}

// Pages where mobile bottom nav and floating chatbot should NOT appear
// (admin, seller, staff portals, checkout, full-screen messages)
export function AppLayout({ children }: AppLayoutProps) {
  useAppHistoryTracker();
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  
  // Scroll to top on page/route navigation only if not already at top
  useEffect(() => {
    if (typeof window !== "undefined" && window.scrollY > 0) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname, location.search]);

  // Specific checks to exclude mobile bottom nav & floating chatbot
  const isCheckout = path === "/checkout" || path.startsWith("/checkout/");
  const isAdmin = path.startsWith("/admin");
  const isSeller = path.startsWith("/seller");
  const isStaff = path.startsWith("/staff");
  const isMessages = path.startsWith("/messages");
  const isProductDetail = 
    path.startsWith("/product/") || 
    path.startsWith("/products/") || 
    path.startsWith("/p/") || 
    path.startsWith("/item/") || 
    path.startsWith("/cj-product/");

  const shouldShowMobileNav = !isCheckout && !isAdmin && !isSeller && !isStaff && !isProductDetail;
  const shouldShowFloatingBot = !isCheckout && !isAdmin && !isSeller && !isStaff && !isMessages;

  return (
    <>
      <Suspense fallback={null}>
        <PushNotificationInitializer />
      </Suspense>
      {children}
      {shouldShowMobileNav && <MobileBottomNav />}
    </>
  );
}



