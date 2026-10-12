import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Force manual scroll restoration so browser never jerks user to the bottom of the previous page
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  try {
    window.history.scrollRestoration = "manual";
  } catch {}
}

const STORAGE_KEY = "durtup_nav_history_stack";

function getHistoryStack(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function setHistoryStack(stack: string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-50)));
  } catch {}
}

/**
 * Global tracker to record internal route navigations into sessionStorage.
 * Tracks distinct full paths (ignoring same-page hash changes).
 */
export function useAppHistoryTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only track actual route path + search, ignore hash jumps
    const currentUrl = location.pathname + (location.search ? location.search : "");
    const stack = getHistoryStack();
    const lastUrl = stack[stack.length - 1];

    if (lastUrl !== currentUrl) {
      stack.push(currentUrl);
      setHistoryStack(stack);
    }
  }, [location.pathname, location.search]);
}

/**
 * Smart Back hook:
 * One single click on Back immediately and cleanly returns to the previous page at the top.
 * If no previous page on this site, cleanly navigates to fallbackPath ('/').
 */
export function useSmartBack(fallbackPath: string = "/") {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }

    // Scroll to top instantly
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    const currentUrl = location.pathname + (location.search ? location.search : "");
    const stack = getHistoryStack();

    // Remove any trailing items matching current URL
    while (stack.length > 0 && stack[stack.length - 1] === currentUrl) {
      stack.pop();
    }

    if (stack.length > 0) {
      const targetPreviousUrl = stack.pop();
      setHistoryStack(stack);

      if (targetPreviousUrl) {
        navigate(targetPreviousUrl, { replace: false });
      } else if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath);
      }
    } else {
      // Fallback for direct entrance
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath);
      }
    }

    // Secondary instant scroll to top after route transition
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }, 20);
  }, [navigate, location.pathname, location.search, fallbackPath]);

  return handleBack;
}
