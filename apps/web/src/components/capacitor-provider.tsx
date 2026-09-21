"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Configure Status Bar on native mobile
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#09090b" }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

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

    return () => {
      backButtonListenerPromise
        .then((handler) => handler.remove())
        .catch(() => {});
    };
  }, []);

  return <>{children}</>;
}
