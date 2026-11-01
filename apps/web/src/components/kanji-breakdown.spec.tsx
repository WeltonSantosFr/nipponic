import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { KanjiBreakdown } from "./kanji-breakdown";

// Mock useSpeech
vi.mock("@/hooks/use-speech", () => ({
  useSpeech: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    activeLang: null,
  }),
}));

describe("KanjiBreakdown", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders kana-only message when word has no kanji", () => {
    render(<KanjiBreakdown word="ありがとう" />);
    expect(
      screen.getByText("This word contains Kana only (no Kanji components).")
    ).toBeInTheDocument();
  });

  it("fetches and renders kanji info for words with kanji", async () => {
    const mockKanjiInfo = {
      kanji: "日",
      meanings: ["day", "sun", "Japan"],
      kunReadings: ["ひ", "-び"],
      onReadings: ["ニチ", "ジツ"],
      jlpt: "N5",
      grade: 1,
      strokeCount: 4,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockKanjiInfo,
    });
    global.fetch = fetchMock;

    render(<KanjiBreakdown word="日本" />);

    // Initial kanji button '日' should be present
    expect(screen.getByRole("button", { name: "日" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/day, sun, Japan/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/kanji?char=%E6%97%A5");
  });

  it("serves subsequent requests for the same kanji from the in-memory cache", async () => {
    const mockKanjiInfo = {
      kanji: "水",
      meanings: ["water"],
      kunReadings: ["みず"],
      onReadings: ["スイ"],
      jlpt: "N5",
      grade: 1,
      strokeCount: 4,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockKanjiInfo,
    });
    global.fetch = fetchMock;

    const { unmount } = render(<KanjiBreakdown word="水" />);

    await waitFor(() => {
      expect(screen.getByText(/water/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Unmount and re-render the same kanji
    unmount();

    render(<KanjiBreakdown word="水泳" />);

    // Should immediately display cached meaning without triggering another fetch for '水'
    await waitFor(() => {
      expect(screen.getByText(/water/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("handles fetch failure gracefully and shows error state", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<KanjiBreakdown word="火" />);

    await waitFor(() => {
      expect(screen.getByText(/Detailed Kanji info not found/i)).toBeInTheDocument();
    });
  });

  it("allows switching between multiple kanji characters and clicking readings to hear audio", async () => {
    const mockSpeak = vi.fn();
    const useSpeechModule = await import("@/hooks/use-speech");
    vi.spyOn(useSpeechModule, "useSpeech").mockReturnValue({
      speak: mockSpeak,
      stop: vi.fn(),
      isPlaying: false,
      activeLang: null,
    } as any);

    const mockKanjiTree = {
      kanji: "木",
      meanings: ["tree", "wood"],
      kunReadings: ["き"],
      onReadings: ["モク", "ボク"],
      jlpt: "N5",
      grade: 1,
      strokeCount: 4,
    };

    const mockKanjiForest = {
      kanji: "林",
      meanings: ["grove", "forest"],
      kunReadings: ["はやし"],
      onReadings: ["リン"],
      jlpt: "N4",
      grade: 1,
      strokeCount: 8,
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("%E6%9C%A8")) {
        return Promise.resolve({ ok: true, json: async () => mockKanjiTree });
      }
      return Promise.resolve({ ok: true, json: async () => mockKanjiForest });
    });

    const { fireEvent } = await import("@testing-library/react");
    render(<KanjiBreakdown word="木林" />);

    await waitFor(() => {
      expect(screen.getByText(/tree, wood/i)).toBeInTheDocument();
    });

    // Click Kun reading
    fireEvent.click(screen.getByText("き"));
    expect(mockSpeak).toHaveBeenCalledWith("き", "ja-JP");

    // Click On reading
    fireEvent.click(screen.getByText("モク"));
    expect(mockSpeak).toHaveBeenCalledWith("モク", "ja-JP");

    // Switch to second kanji '林'
    fireEvent.click(screen.getByRole("button", { name: "林" }));

    await waitFor(() => {
      expect(screen.getByText(/grove, forest/i)).toBeInTheDocument();
    });
  });

  it("deduplicates simultaneous in-flight requests and catches network errors", async () => {
    let resolveFirst: any;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    global.fetch = fetchMock;

    render(
      <>
        <KanjiBreakdown word="川" />
        <KanjiBreakdown word="川" />
      </>
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveFirst({ ok: false, status: 500 });
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it("renders Heisig keyword and empty readings dashes", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        kanji: "字",
        meanings: ["character"],
        kunReadings: [],
        onReadings: [],
        jlpt: "N5",
        grade: 1,
        strokeCount: 6,
        heisig: "character",
      }),
    });

    render(<KanjiBreakdown word="字" />);

    await waitFor(() => {
      expect(screen.getByText("Keyword: character")).toBeInTheDocument();
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("updates selected kanji when word prop changes", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        kanji: "山",
        meanings: ["mountain"],
        kunReadings: ["やま"],
        onReadings: ["サン"],
        jlpt: "N5",
        strokeCount: 3,
      }),
    });

    const { rerender } = render(<KanjiBreakdown word="火山" />);
    await waitFor(() => {
      expect(screen.getByText("mountain")).toBeInTheDocument();
    });

    rerender(<KanjiBreakdown word="山海" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "海" })).toBeInTheDocument();
    });
  });
});
