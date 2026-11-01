import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("ThemeProvider", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("renders children wrapped inside NextThemesProvider", async () => {
    const { ThemeProvider } = await import("./theme-provider");

    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div data-testid="themed-child">Hello Dark Theme</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("themed-child")).toBeInTheDocument();
    expect(screen.getByText("Hello Dark Theme")).toBeInTheDocument();
  });

  it("filters out script tag console.error in development environment", async () => {
    const origError = vi.fn();
    console.error = origError;

    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    vi.resetModules();
    await import("./theme-provider");

    // Calling console.error with the false-positive message should be ignored
    console.error("Warning: Encountered a script tag while rendering React component");
    expect(origError).not.toHaveBeenCalled();

    // Calling console.error with any other message should call origError
    console.error("Another valid error");
    expect(origError).toHaveBeenCalledWith("Another valid error");
  });
});
