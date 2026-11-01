import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile hook", () => {
  let listeners: ((e: any) => void)[] = [];
  const mockMql = {
    addEventListener: vi.fn((event: string, cb: (e: any) => void) => {
      if (event === "change") listeners.push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: (e: any) => void) => {
      listeners = listeners.filter((l) => l !== cb);
    }),
  };

  beforeEach(() => {
    listeners = [];
    vi.clearAllMocks();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mockMql));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return true when viewport width is below 768px", () => {
    window.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("should return false when viewport width is 768px or above", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("should update when window media query change event triggers", () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resizing to mobile
    act(() => {
      window.innerWidth = 400;
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it("should remove event listener on unmount", () => {
    window.innerWidth = 800;
    const { unmount } = renderHook(() => useIsMobile());
    expect(mockMql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    expect(mockMql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
