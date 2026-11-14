// Durtup.shop High-Speed E-commerce Application
import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/scroll-reset.css";

// Disable browser's automatic dirty scroll restoration so back button always lands cleanly at page top
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  try {
    window.history.scrollRestoration = "manual";
  } catch {}
}

// Global Vite Dynamic Import Error Auto-Healer
// Intercepts chunk mismatches (404/new hash after deploy) before React crashes
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event: any) => {
    console.warn("[Vite Preload] Chunk hash mismatch detected after deploy. Self-healing...", event);
    event.preventDefault();
    const lastReload = sessionStorage.getItem("vite_chunk_reload_ts");
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem("vite_chunk_reload_ts", now.toString());
      if ("caches" in window) {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("_v", now.toString());
          window.location.replace(url.toString());
        });
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set("_v", now.toString());
        window.location.replace(url.toString());
      }
    }
  });

  // Global unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (event) => {
    const reasonStr = String(event.reason?.message || event.reason || "");
    if (
      reasonStr.includes("Failed to fetch dynamically imported module") ||
      reasonStr.includes("Importing a module script failed") ||
      reasonStr.includes("error loading dynamically imported module") ||
      reasonStr.includes("Loading chunk")
    ) {
      event.preventDefault();
      console.warn("[ModuleLoad] Stale chunk detected in unhandled rejection. Healing...");
      const lastReload = sessionStorage.getItem("vite_chunk_reload_ts");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("vite_chunk_reload_ts", now.toString());
        if ("caches" in window) {
          caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).finally(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("_v", now.toString());
            window.location.replace(url.toString());
          });
        } else {
          const url = new URL(window.location.href);
          url.searchParams.set("_v", now.toString());
          window.location.replace(url.toString());
        }
      }
      return;
    }
    console.error("Unhandled promise rejection:", event.reason);
    event.preventDefault();
  });

  window.addEventListener("error", (event) => {
    const errorStr = String(event.error?.message || event.message || "");
    if (
      errorStr.includes("Failed to fetch dynamically imported module") ||
      errorStr.includes("Importing a module script failed") ||
      errorStr.includes("error loading dynamically imported module")
    ) {
      event.preventDefault();
      return;
    }
    console.error("Unhandled error:", event.error);
  });
}

// Manage Service Worker: Register for PWA installability and push notifications
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      console.log("[Storefront SW] Registered successfully:", reg.scope);
      // Immediately check for newer service worker version on server
      reg.update().catch(() => {});
    }).catch((err) => {
      console.warn("[Storefront SW] Registration warning:", err);
    });
  });
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
