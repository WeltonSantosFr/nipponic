import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

describe("useKuromoji hook", () => {
  let mockTokenizer: any;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockTokenizer = {
      tokenize: vi.fn().mockReturnValue([]),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize tokenizer asynchronously and return it", async () => {
    vi.doMock("kuromoji", () => ({
      default: {
        builder: vi.fn().mockReturnValue({
          build: vi.fn().mockImplementation((cb) => {
            setTimeout(() => cb(null, mockTokenizer), 10);
          }),
        }),
      },
    }));

    const { useKuromoji } = await import("./use-kuromoji");
    const { result } = renderHook(() => useKuromoji());

    expect(result.current).toBeNull();

    await waitFor(() => {
      expect(result.current).toBe(mockTokenizer);
    });
  });

  it("should return cached tokenizer immediately if already initialized", async () => {
    vi.doMock("kuromoji", () => ({
      default: {
        builder: vi.fn().mockReturnValue({
          build: vi.fn().mockImplementation((cb) => {
            cb(null, mockTokenizer);
          }),
        }),
      },
    }));

    const { useKuromoji } = await import("./use-kuromoji");
    const hook1 = renderHook(() => useKuromoji());

    await waitFor(() => {
      expect(hook1.result.current).toBe(mockTokenizer);
    });

    // Second render should have it cached immediately
    const hook2 = renderHook(() => useKuromoji());
    expect(hook2.result.current).toBe(mockTokenizer);

    // Direct call to getTokenizerInstance should return resolved cached promise
    const { getTokenizerInstance } = await import("./use-kuromoji");
    const directResult = await getTokenizerInstance();
    expect(directResult).toBe(mockTokenizer);
  });

  it("should handle error when dictionary fails to load", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.doMock("kuromoji", () => ({
      default: {
        builder: vi.fn().mockReturnValue({
          build: vi.fn().mockImplementation((cb) => {
            cb(new Error("Failed to load dictionary files"));
          }),
        }),
      },
    }));

    const { useKuromoji } = await import("./use-kuromoji");
    const { result } = renderHook(() => useKuromoji());

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Error loading Kuromoji dictionary:",
        expect.any(Error)
      );
      expect(result.current).toBeNull();
    });

    errorSpy.mockRestore();
  });

  it("should handle error when kuromoji dynamic import fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.doMock("kuromoji", () => {
      throw new Error("Module not found");
    });

    const { useKuromoji } = await import("./use-kuromoji");
    const { result } = renderHook(() => useKuromoji());

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Error dynamically loading kuromoji module:",
        expect.any(Error)
      );
      expect(result.current).toBeNull();
    });

    errorSpy.mockRestore();
  });

  it("should not update state if component unmounts before tokenizer finishes loading", async () => {
    let triggerBuild: (() => void) | null = null;
    vi.doMock("kuromoji", () => ({
      default: {
        builder: () => ({
          build: (cb: any) => {
            triggerBuild = () => cb(null, mockTokenizer);
          },
        }),
      },
    }));

    const { useKuromoji } = await import("./use-kuromoji");
    const { result, unmount } = renderHook(() => useKuromoji());

    expect(result.current).toBeNull();
    unmount();
    if (triggerBuild) {
      (triggerBuild as () => void)();
    }

    expect(result.current).toBeNull();
  });

  it("should return the same in-flight promise when getTokenizerInstance is called concurrently", async () => {
    vi.doMock("kuromoji", () => ({
      default: {
        builder: () => ({
          build: (cb: any) => {
            setTimeout(() => cb(null, mockTokenizer), 10);
          },
        }),
      },
    }));

    const { getTokenizerInstance } = await import("./use-kuromoji");
    const p1 = getTokenizerInstance();
    const p2 = getTokenizerInstance();
    expect(p1).toBe(p2);
    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1).toBe(mockTokenizer);
    expect(res2).toBe(mockTokenizer);
  });
});
