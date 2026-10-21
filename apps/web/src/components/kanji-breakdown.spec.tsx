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
});
