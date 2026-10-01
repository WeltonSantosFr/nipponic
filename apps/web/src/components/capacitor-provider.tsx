"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  initNotificationChannel,
  scheduleDailyReminder,
} from "@/services/notifications";
import { syncPendingReviews } from "@/services/offline-sync";

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Configure Status Bar on native mobile
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#09090b" }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // Initialize Notification Channel and ensure daily reminder is scheduled
    initNotificationChannel().catch(() => {});
    scheduleDailyReminder().catch(() => {});

    // Handle Android hardware back button
    const backButtonListenerPromise = App.addListener(
      "backButton",
      ({ canGoBack }) => {
        // Check if any dialog/modal is open in the DOM
        const openDialog = document.querySelector(
          '[role="dialog"], [data-state="open"]'
        );
        if (openDialog) {
          const escEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          });
          document.dispatchEvent(escEvent);
          return;
        }

        if (canGoBack && window.history.length > 1) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      }
    );

    // Refresh notifications when app is minimized / sent to background
    const appStateListenerPromise = App.addListener(
      "appStateChange",
      ({ isActive }) => {
        if (!isActive) {
          scheduleDailyReminder().catch(() => {});
        } else {
          syncPendingReviews().catch(() => {});
        }
      }
    );

    return () => {
      backButtonListenerPromise
        .then((handler) => handler.remove())
        .catch(() => {});
      appStateListenerPromise
        .then((handler) => handler.remove())
        .catch(() => {});
    };
  }, []);

  // Register Service Worker and preload page assets for offline resilience in production only
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
      window.location.hostname === "[::1]" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "10.0.2.2"
    );

    // In development or localhost, unregister existing service workers and purge caches
    // to avoid Turbopack HMR and stale chunk module factory errors
    if (process.env.NODE_ENV === "development" || isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});

      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key).catch(() => {});
          }
        }).catch(() => {});
      }
      return;
    }

    const cacheActivePageAssets = async () => {
      try {
        if (!("caches" in window)) return;
        const cache = await caches.open("nipponic-pwa-v1");

        // 1. Cache the current HTML document and root /
        const currentUrl = window.location.href;
        try {
          const pageRes = await fetch(currentUrl, { cache: "no-cache" });
          if (pageRes.ok) {
            await cache.put(currentUrl, pageRes.clone());
            await cache.put("/", pageRes.clone());
          }
        } catch {
          // Ignore fetch error if offline
        }

        // 2. Discover all loaded scripts and stylesheets on the current page
        const elements = Array.from(
          document.querySelectorAll<HTMLLinkElement | HTMLScriptElement>(
            "link[rel='stylesheet'], script[src]"
          )
        );

        const assetUrls = elements
          .map((el) => (el instanceof HTMLLinkElement ? el.href : el.src))
          .filter(
            (url) =>
              Boolean(url) &&
              (url.startsWith(window.location.origin) ||
                url.includes("/_next/static/"))
          );

        const uniqueUrls = Array.from(new Set(assetUrls));

        // 3. Cache all assets in parallel using force-cache
        await Promise.allSettled(
          uniqueUrls.map(async (url) => {
            try {
              const res = await fetch(url, { cache: "force-cache" });
              if (res.ok) {
                await cache.put(url, res);
              }
            } catch {
              // Ignore individual asset caching failures
            }
          })
        );
      } catch (err) {
        console.warn("[PWA Cache] Error pre-caching page assets:", err);
      }
    };

    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          reg.update().catch(() => {});
          cacheActivePageAssets();
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);

  return <>{children}</>;
}
