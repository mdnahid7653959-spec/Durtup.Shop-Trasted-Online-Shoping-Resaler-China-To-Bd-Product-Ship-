import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Allow browser native scroll restoration so returning to previous pages restores scroll position
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  try {
    window.history.scrollRestoration = "auto";
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
 * Seamlessly returns to the previous page in history, preserving scroll position and state.
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

    const currentUrl = location.pathname + (location.search ? location.search : "");
    const stack = getHistoryStack();

    // Remove any trailing items matching current URL
    while (stack.length > 0 && stack[stack.length - 1] === currentUrl) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack.pop();
      setHistoryStack(stack);

      // Perform a real browser history POP to restore previous page state & scroll
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath, { replace: true });
      }
    } else {
      // Fallback for direct entrance
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallbackPath, { replace: true });
      }
    }
  }, [navigate, location.pathname, location.search, fallbackPath]);

  return handleBack;
}
