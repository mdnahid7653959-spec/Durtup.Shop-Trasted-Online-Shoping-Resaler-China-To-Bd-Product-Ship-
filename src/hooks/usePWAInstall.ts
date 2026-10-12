import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'durtup_pwa_prompt_dismissed_at';
const INSTALLED_KEY = 'durtup_pwa_is_installed';

// Global shared singleton state
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsPromptOpen = false;
let globalShowIOSGuide = false;
let globalShowAndroidGuide = false;
let globalIsInstalled = false;
let globalCanInstall = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

if (typeof window !== 'undefined') {
  // Check standalone mode initially
  globalIsInstalled = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    localStorage.getItem(INSTALLED_KEY) === 'true';

  // Listen for beforeinstallprompt globally
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    globalCanInstall = true;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(INSTALLED_KEY, 'true');
    globalIsInstalled = true;
    globalCanInstall = false;
    globalIsPromptOpen = false;
    globalShowIOSGuide = false;
    globalShowAndroidGuide = false;
    globalDeferredPrompt = null;
    localStorage.removeItem(DISMISS_KEY);
    notify();
  });
}

export function usePWAInstall() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // Device checks
  const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile|tablet/.test(ua) || (typeof window !== 'undefined' && window.innerWidth <= 768);

  const installApp = useCallback(async () => {
    // If iOS Safari
    if (isIOS) {
      globalIsPromptOpen = false;
      globalShowIOSGuide = true;
      globalShowAndroidGuide = false;
      notify();
      return false;
    }

    // If native browser prompt available (Android Chrome / Edge / Desktop Chrome)
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const { outcome } = await globalDeferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem(INSTALLED_KEY, 'true');
          globalIsInstalled = true;
          globalCanInstall = false;
          globalIsPromptOpen = false;
          globalShowAndroidGuide = false;
        }
        globalDeferredPrompt = null;
        notify();
        return outcome === 'accepted';
      } catch (err) {
        console.error('PWA install error:', err);
        globalIsPromptOpen = true;
        notify();
        return false;
      }
    } else {
      // Show full install popup / guided instructions
      globalIsPromptOpen = true;
      notify();
      return false;
    }
  }, [isIOS]);

  const dismissPrompt = useCallback((temporary = true) => {
    globalIsPromptOpen = false;
    globalShowIOSGuide = false;
    globalShowAndroidGuide = false;
    if (temporary) {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
    notify();
  }, []);

  const openPrompt = useCallback(() => {
    if (isIOS) {
      globalShowIOSGuide = true;
      globalIsPromptOpen = false;
      globalShowAndroidGuide = false;
    } else if (globalDeferredPrompt) {
      installApp();
    } else {
      globalIsPromptOpen = true;
    }
    notify();
  }, [isIOS, installApp]);

  const setShowIOSGuide = useCallback((val: boolean) => {
    globalShowIOSGuide = val;
    notify();
  }, []);

  const setShowAndroidGuide = useCallback((val: boolean) => {
    globalShowAndroidGuide = val;
    notify();
  }, []);

  return {
    canInstall: globalCanInstall,
    isInstalled: globalIsInstalled,
    isPromptOpen: globalIsPromptOpen,
    isIOS,
    isAndroid,
    isMobile,
    showIOSGuide: globalShowIOSGuide,
    setShowIOSGuide,
    showAndroidGuide: globalShowAndroidGuide,
    setShowAndroidGuide,
    installApp,
    dismissPrompt,
    openPrompt,
  };
}
