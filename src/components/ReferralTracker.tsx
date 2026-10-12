import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackReferralAttribution, ensureUserReferralProfile } from "@/services/referralService";
import { useAuth } from "@/contexts/AuthContext";

export function ReferralTracker() {
  const location = useLocation();
  const { user } = useAuth();

  // 1. Detect and track ?ref=CODE from URL query parameters
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const searchParams = new URLSearchParams(location.search);
      const refCode = searchParams.get("ref");

      if (refCode) {
        trackReferralAttribution(refCode).then(() => {
          // Strip ?ref= query parameter cleanly from browser history to preserve SEO canonical URLs
          searchParams.delete("ref");
          const remainingQuery = searchParams.toString();
          const cleanUrl = location.pathname + (remainingQuery ? `?${remainingQuery}` : "") + location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }).catch((err) => {
          console.warn("Referral tracking failure:", err);
        });
      }
    } catch (e) {
      console.warn("Error parsing referral query parameter:", e);
    }
  }, [location.search, location.pathname, location.hash]);

  // 2. Automatically ensure user has referral profile & link attribution upon auth state
  useEffect(() => {
    if (user?.id) {
      ensureUserReferralProfile(user.id, user.email, user.displayName).catch((err) => {
        console.warn("Auto referral profile init notice:", err);
      });
    }
  }, [user?.id]);

  return null;
}
