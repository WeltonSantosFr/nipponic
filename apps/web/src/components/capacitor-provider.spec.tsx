import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CapacitorProvider } from "./capacitor-provider";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar } from "@capacitor/status-bar";
import {
  initNotificationChannel,
  scheduleDailyReminder,
} from "@/services/notifications";
import { syncPendingReviews } from "@/services/offline-sync";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn(),
    minimizeApp: vi.fn(),
  },
}));

vi.mock("@capacitor/status-bar", () => ({
  StatusBar: {
    setStyle: vi.fn().mockResolvedValue(undefined),
    setBackgroundColor: vi.fn().mockResolvedValue(undefined),
    setOverlaysWebView: vi.fn().mockResolvedValue(undefined),
  },
  Style: {
    Dark: "DARK",
  },
}));

vi.mock("@/services/notifications", () => ({
  initNotificationChannel: vi.fn().mockResolvedValue(undefined),
  scheduleDailyReminder: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/offline-sync", () => ({
  syncPendingReviews: vi.fn().mockResolvedValue(undefined),
}));

describe("CapacitorProvider", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, "readyState", {
      value: "complete",
      configurable: true,
    });
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistrations: vi.fn().mockResolvedValue([]),
        register: vi.fn().mockResolvedValue({ update: vi.fn().mockResolvedValue(undefined) }),
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "caches", {
      value: {
        keys: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(true),
        open: vi.fn().mockResolvedValue({ put: vi.fn().mockResolvedValue(undefined) }),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("renders children without native setup in web browser", () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    render(
      <CapacitorProvider>
        <div data-testid="child">Web Content</div>
      </CapacitorProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(StatusBar.setStyle).not.toHaveBeenCalled();
    expect(App.addListener).not.toHaveBeenCalled();
  });

  it("configures status bar and back button listener on native platform", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const mockRemove = vi.fn();
    vi.mocked(App.addListener).mockResolvedValue({ remove: mockRemove } as any);

    const { unmount } = render(
      <CapacitorProvider>
        <div data-testid="child">Native Content</div>
      </CapacitorProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: "DARK" });
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({
      color: "#09090b",
    });
    expect(StatusBar.setOverlaysWebView).toHaveBeenCalledWith({
      overlay: false,
    });
    expect(initNotificationChannel).toHaveBeenCalled();
    expect(App.addListener).toHaveBeenCalledWith(
      "backButton",
      expect.any(Function)
    );
    expect(App.addListener).toHaveBeenCalledWith(
      "appStateChange",
      expect.any(Function)
    );

    unmount();
    await Promise.resolve();
    expect(mockRemove).toHaveBeenCalled();
  });

  it("handles backButton event by minimizing when at root or cannot go back", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    let backButtonHandler: any = null;
    vi.mocked(App.addListener).mockImplementation(
      async (event: string, callback: any) => {
        if (event === "backButton") {
          backButtonHandler = callback;
        }
        return { remove: vi.fn() } as any;
      }
    );

    render(
      <CapacitorProvider>
        <div>Content</div>
      </CapacitorProvider>
    );

    expect(backButtonHandler).not.toBeNull();

    // Trigger back button with canGoBack = false
    backButtonHandler({ canGoBack: false });
    expect(App.minimizeApp).toHaveBeenCalled();
  });

  it("navigates back when canGoBack is true and history length > 1", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    let backButtonHandler: any = null;
    vi.mocked(App.addListener).mockImplementation(
      async (event: string, callback: any) => {
        if (event === "backButton") {
          backButtonHandler = callback;
        }
        return { remove: vi.fn() } as any;
      }
    );

    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    Object.defineProperty(window.history, "length", { value: 3, configurable: true });

    render(
      <CapacitorProvider>
        <div>Content</div>
      </CapacitorProvider>
    );

    expect(backButtonHandler).not.toBeNull();
    backButtonHandler({ canGoBack: true });
    expect(backSpy).toHaveBeenCalled();
    expect(App.minimizeApp).not.toHaveBeenCalled();
  });

  it("handles backButton by dispatching escape when dialog is open", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    let backButtonHandler: any = null;
    vi.mocked(App.addListener).mockImplementation(
      async (event: string, callback: any) => {
        if (event === "backButton") {
          backButtonHandler = callback;
        }
        return { remove: vi.fn() } as any;
      }
    );

    const dispatchSpy = vi.spyOn(document, "dispatchEvent");

    render(
      <CapacitorProvider>
        <div role="dialog">Modal Dialog</div>
      </CapacitorProvider>
    );

    expect(backButtonHandler).not.toBeNull();

    backButtonHandler({ canGoBack: true });
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ key: "Escape" })
    );
    expect(App.minimizeApp).not.toHaveBeenCalled();
  });

  it("handles appStateChange events for background and foreground", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    let appStateHandler: any = null;
    vi.mocked(App.addListener).mockImplementation(
      async (event: string, callback: any) => {
        if (event === "appStateChange") {
          appStateHandler = callback;
        }
        return { remove: vi.fn() } as any;
      }
    );

    render(
      <CapacitorProvider>
        <div>Content</div>
      </CapacitorProvider>
    );

    expect(appStateHandler).not.toBeNull();

    // Backgrounded
    appStateHandler({ isActive: false });
    expect(scheduleDailyReminder).toHaveBeenCalled();

    // Foregrounded
    appStateHandler({ isActive: true });
    expect(syncPendingReviews).toHaveBeenCalled();
  });

  it("unregisters service worker and clears caches in development or localhost", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const mockUnregister = vi.fn().mockResolvedValue(true);
    const mockGetRegistrations = vi.fn().mockResolvedValue([{ unregister: mockUnregister }]);
    const mockRegister = vi.fn();
    const mockDeleteCache = vi.fn().mockResolvedValue(true);
    const mockCacheKeys = vi.fn().mockResolvedValue(["nipponic-pwa-v1"]);

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistrations: mockGetRegistrations,
        register: mockRegister,
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(window, "caches", {
      value: {
        keys: mockCacheKeys,
        delete: mockDeleteCache,
      },
      configurable: true,
      writable: true,
    });

    render(
      <CapacitorProvider>
        <div>Dev Content</div>
      </CapacitorProvider>
    );

    expect(mockGetRegistrations).toHaveBeenCalled();
    await Promise.resolve();
    expect(mockUnregister).toHaveBeenCalled();
    expect(mockCacheKeys).toHaveBeenCalled();
    await Promise.resolve();
    expect(mockDeleteCache).toHaveBeenCalledWith("nipponic-pwa-v1");
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("registers service worker and caches page assets in production mode", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    Object.defineProperty(window, "location", {
      value: {
        hostname: "nipponic.app",
        origin: "https://nipponic.app",
        href: "https://nipponic.app/study",
      },
      writable: true,
      configurable: true,
    });

    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockRegister = vi.fn().mockResolvedValue({ update: mockUpdate });
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: mockRegister,
      },
      configurable: true,
      writable: true,
    });

    const mockPut = vi.fn().mockResolvedValue(undefined);
    const mockOpen = vi.fn().mockResolvedValue({ put: mockPut });
    Object.defineProperty(window, "caches", {
      value: {
        open: mockOpen,
      },
      configurable: true,
      writable: true,
    });

    // Add stylesheet link and script to document
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://nipponic.app/styles.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://nipponic.app/_next/static/chunks/app.js";
    document.body.appendChild(script);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      clone: () => ({ ok: true }),
    });
    global.fetch = mockFetch as any;

    render(
      <CapacitorProvider>
        <div>Prod Content</div>
      </CapacitorProvider>
    );

    expect(mockRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledWith("nipponic-pwa-v1");
  });

  it("attaches load event listener when document readyState is not complete in production", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    Object.defineProperty(window, "location", {
      value: {
        hostname: "nipponic.app",
        origin: "https://nipponic.app",
        href: "https://nipponic.app/",
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document, "readyState", {
      value: "loading",
      configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <CapacitorProvider>
        <div>Loading State</div>
      </CapacitorProvider>
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith("load", expect.any(Function));

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("load", expect.any(Function));
  });

  it("handles native initialization errors and cleanup rejection gracefully", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(StatusBar.setStyle).mockRejectedValueOnce(new Error("StatusBar failed"));
    vi.mocked(StatusBar.setBackgroundColor).mockRejectedValueOnce(new Error("StatusBar failed"));
    vi.mocked(StatusBar.setOverlaysWebView).mockRejectedValueOnce(new Error("StatusBar failed"));
    vi.mocked(initNotificationChannel).mockRejectedValueOnce(new Error("Init failed"));
    vi.mocked(scheduleDailyReminder).mockRejectedValueOnce(new Error("Reminder failed"));

    const mockRemove = vi.fn().mockRejectedValue(new Error("Remove failed"));
    vi.mocked(App.addListener).mockResolvedValue({ remove: mockRemove } as any);

    const { unmount } = render(
      <CapacitorProvider>
        <div>Error Testing</div>
      </CapacitorProvider>
    );

    unmount();
    await Promise.resolve();
    expect(mockRemove).toHaveBeenCalled();
  });

  it("handles appStateChange errors gracefully", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    let appStateHandler: any = null;
    vi.mocked(App.addListener).mockImplementation(
      async (event: string, callback: any) => {
        if (event === "appStateChange") {
          appStateHandler = callback;
        }
        return { remove: vi.fn() } as any;
      }
    );

    vi.mocked(scheduleDailyReminder).mockRejectedValueOnce(new Error("Reminder error"));
    vi.mocked(syncPendingReviews).mockRejectedValueOnce(new Error("Sync error"));

    render(
      <CapacitorProvider>
        <div>State Error</div>
      </CapacitorProvider>
    );

    expect(appStateHandler).not.toBeNull();
    appStateHandler({ isActive: false });
    appStateHandler({ isActive: true });
    await Promise.resolve();
  });

  it("handles service worker registration failure gracefully in production", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(window, "location", {
      value: {
        hostname: "nipponic.app",
        origin: "https://nipponic.app",
        href: "https://nipponic.app/",
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: vi.fn().mockRejectedValue(new Error("Registration failed")),
      },
      configurable: true,
      writable: true,
    });

    render(
      <CapacitorProvider>
        <div>Registration Error</div>
      </CapacitorProvider>
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(warnSpy).toHaveBeenCalledWith("[SW] Registration failed:", expect.any(Error));
    warnSpy.mockRestore();
  });

  it("handles service worker update failure and fetch failure gracefully in production", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    Object.defineProperty(window, "location", {
      value: {
        hostname: "nipponic.app",
        origin: "https://nipponic.app",
        href: "https://nipponic.app/",
      },
      writable: true,
      configurable: true,
    });

    const mockUpdate = vi.fn().mockRejectedValue(new Error("Update failed"));
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: vi.fn().mockResolvedValue({ update: mockUpdate }),
      },
      configurable: true,
      writable: true,
    });

    const mockPut = vi.fn().mockRejectedValue(new Error("Put failed"));
    Object.defineProperty(window, "caches", {
      value: {
        open: vi.fn().mockResolvedValue({ put: mockPut }),
      },
      configurable: true,
      writable: true,
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    render(
      <CapacitorProvider>
        <div>Fetch offline</div>
      </CapacitorProvider>
    );

    await Promise.resolve();
    await Promise.resolve();
  });

  it("handles unregister and cache delete rejections in development", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        getRegistrations: vi.fn().mockResolvedValue([
          {
            unregister: vi.fn().mockRejectedValue(new Error("Unregister failed")),
          },
        ]),
        register: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(window, "caches", {
      value: {
        keys: vi.fn().mockResolvedValue(["key-1"]),
        delete: vi.fn().mockRejectedValue(new Error("Delete failed")),
      },
      configurable: true,
      writable: true,
    });

    render(
      <CapacitorProvider>
        <div>Dev Catch Content</div>
      </CapacitorProvider>
    );

    await Promise.resolve();
    await Promise.resolve();
  });

  it("handles environment without serviceWorker in navigator", () => {
    const originalSW = navigator.serviceWorker;
    // @ts-ignore
    delete navigator.serviceWorker;

    render(
      <CapacitorProvider>
        <div>No SW Content</div>
      </CapacitorProvider>
    );

    expect(screen.getByText("No SW Content")).toBeInTheDocument();

    Object.defineProperty(navigator, "serviceWorker", {
      value: originalSW,
      configurable: true,
      writable: true,
    });
  });

  it("logs warning when cacheActivePageAssets fails", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    Object.defineProperty(window, "location", {
      value: { hostname: "nipponic.app" },
      writable: true,
      configurable: true,
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    Object.defineProperty(window, "caches", {
      value: {
        open: vi.fn().mockRejectedValue(new Error("Cache open failed")),
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: vi.fn().mockImplementation(() => {
          return Promise.resolve({
            update: vi.fn().mockResolvedValue(undefined),
          });
        }),
      },
      configurable: true,
      writable: true,
    });

    render(
      <CapacitorProvider>
        <div>Cache Fail Content</div>
      </CapacitorProvider>
    );

    await Promise.resolve();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 20));

    expect(warnSpy).toHaveBeenCalledWith(
      "[PWA Cache] Error pre-caching page assets:",
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });
});
