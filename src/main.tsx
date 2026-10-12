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

// Global error handler to prevent native app crashes from unhandled async errors
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("Unhandled error:", event.error);
});

// Manage Service Worker: Register for PWA installability and push notifications
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      console.log("[Storefront SW] Registered successfully:", reg.scope);
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
