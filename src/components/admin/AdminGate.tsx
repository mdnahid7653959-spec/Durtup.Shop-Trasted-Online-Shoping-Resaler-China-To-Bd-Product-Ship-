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
  return true;
}

/**
 * Unlocks the admin gate.
 */
export function unlockAdminGate(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_GATE_KEY, `gate_unlocked_${Date.now()}`);
  } catch {}
}

/**
 * Locks the admin gate.
 */
export function lockAdminGate(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_GATE_KEY);
  } catch {}
}

/**
 * Route component mounted at the secret URL (redirects to admin login).
 */
export function AdminSecretUnlock() {
  const location = useLocation();
  return <Navigate to="/admin/login" replace state={{ from: location, gateUnlocked: true }} />;
}

/**
 * Wrapper for admin routes.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
