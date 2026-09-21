import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CapacitorProvider } from "./capacitor-provider";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar } from "@capacitor/status-bar";

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

describe("CapacitorProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    render(
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
    expect(App.addListener).toHaveBeenCalledWith(
      "backButton",
      expect.any(Function)
    );
  });

  it("handles backButton event by minimizing when at root", async () => {
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
});
