import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";

export const ADMIN_GATE_KEY = "admin_gate_session_token_v2";

export const ADMIN_SECRET_PREFIX =
  "/nahid/dreem/e/comarce/467265@/apple789@/dreem/project";
export const ADMIN_SECRET_SLUG = "contole";
export const ADMIN_SECRET_PATH = `${ADMIN_SECRET_PREFIX}/${ADMIN_SECRET_SLUG}`;
export const ADMIN_SECRET_ROUTE = `${ADMIN_SECRET_PREFIX}/:unlockCode/*`;

/**
 * Checks if the current environment is running inside the official Durtup Electron Desktop App.
 */
export function isElectronApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // 1. Electron bridge exposed via preload script
    if (
      (window as any)?.durtupDesktopBridge?.isElectron === true ||
      (window as any)?.durtupDesktopBridge?.isDesktopAdmin === true
    ) {
      return true;
    }

    // 2. UserAgent inspection for Electron or DurtupDesktopApp
    const ua = (window.navigator?.userAgent || "").toLowerCase();
    if (
      ua.includes("electron") ||
      ua.includes("durtupdesktopapp") ||
      ua.includes("durtupdesktopadmin")
    ) {
      return true;
    }

    // 3. Process type renderer or versions in electron environment
    if (
      (window as any)?.process?.type === "renderer" ||
      Boolean((window as any)?.process?.versions?.electron)
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Checks if the admin portal is unlocked.
 * Automatically allowed when running in the official Electron Desktop App.
 * When accessed from a normal web browser/public link, this returns FALSE (404 Not Found),
 * unless intentionally unlocked via emergency secret URL in the current tab session.
 */
export function isAdminGateUnlocked(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Official Electron Desktop App is always authorized
  if (isElectronApp()) {
    return true;
  }

  // 2. Check temporary sessionStorage if unlocked via emergency secret URL
  try {
    // Clear any legacy insecure localStorage keys
    localStorage.removeItem("admin_gate_unlocked");
    localStorage.removeItem(ADMIN_GATE_KEY);

    const token = sessionStorage.getItem(ADMIN_GATE_KEY);
    return Boolean(token && token.startsWith("gate_unlocked_"));
  } catch {
    return false;
  }
}

/**
 * Unlocks the admin gate for the current tab session only.
 */
export function unlockAdminGate(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("admin_gate_unlocked");
    localStorage.removeItem(ADMIN_GATE_KEY);
    sessionStorage.setItem(ADMIN_GATE_KEY, `gate_unlocked_${Date.now()}`);
  } catch {}
}

/**
 * Locks the admin gate and clears all session gate tokens.
 */
export function lockAdminGate(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_GATE_KEY);
    sessionStorage.removeItem("admin_gate_unlocked");
    localStorage.removeItem("admin_gate_unlocked");
    localStorage.removeItem(ADMIN_GATE_KEY);
  } catch {}
}

/**
 * Route component mounted ONLY at the secret URL.
 * Unlocks the gate for this tab and navigates to the login screen.
 */
export function AdminSecretUnlock() {
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    unlockAdminGate();
    setReady(true);
  }, [location.pathname]);

  if (!ready) return null;
  return <Navigate to="/admin/login" replace state={{ from: location, gateUnlocked: true }} />;
}

/**
 * Wrapper for admin routes to guard them from direct access.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  if (!isAdminGateUnlocked()) {
    return <NotFound />;
  }
  return <>{children}</>;
}
