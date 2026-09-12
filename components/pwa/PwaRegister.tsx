"use client";

import React, { useEffect, useState } from "react";
import { Download, WifiOff, X, Check } from "lucide-react";

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // 1. Check if running as installed standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // 2. Register Service Worker safely
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[PWA] ServiceWorker registered with scope:", registration.scope);

            // Handle service worker updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[PWA] New version available. Refresh to update.");
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn("[PWA] ServiceWorker registration skipped/failed:", error);
          });
      });
    }

    // 3. Listen for PWA Install Prompt Event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Check if dismissed before
      const hasDismissed = localStorage.getItem("webhunt_pwa_dismissed");
      if (!hasDismissed) {
        setShowToast(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Listen for App Installed Event
    const handleAppInstalled = () => {
      console.log("[PWA] WebHunt Delta installed successfully");
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowToast(false);
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Network status monitoring
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User installation choice: ${outcome}`);
    if (outcome === "accepted") {
      setIsInstallable(false);
      setShowToast(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissToast = () => {
    setShowToast(false);
    localStorage.setItem("webhunt_pwa_dismissed", "true");
  };

  return (
    <>
      {/* Offline Status Warning Bar */}
      {isOffline && (
        <div className="bg-[#1f0e0e] border-b border-red-500/30 text-red-300 px-4 py-2 text-xs flex items-center justify-center space-x-2 fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
          <span>You are currently offline. Live lead scanning requires an internet connection.</span>
        </div>
      )}

      {/* Subtle Install Floating Banner (Only when installable and not in standalone mode) */}
      {isInstallable && !isStandalone && showToast && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-40px)] sm:w-auto bg-[#0D0D0D] border border-[rgba(0,72,187,0.4)] rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center justify-between space-x-3.5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#161616] border border-[rgba(0,72,187,0.3)] flex items-center justify-center text-[#0048BB] shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F8F3F0]">Install WebHunt Delta App</div>
              <div className="text-[11px] text-[#A8A196]">Fast standalone access on your device</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-[#0048BB] hover:bg-[#00388A] text-white text-xs font-semibold shadow-md shadow-[#0048BB]/20 transition shrink-0"
            >
              Install
            </button>
            <button
              onClick={handleDismissToast}
              className="p-1.5 rounded-lg text-[#A8A196] hover:text-[#F8F3F0] hover:bg-[#161616] transition shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
