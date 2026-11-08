import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { FlashCardsProvider, useFlashCards } from "./FlashCardsContext";
import { Card, Deck, ReviewRating, StudyStats } from "@nipponic/shared";
import {
  getCardsAction,
  createCardAction,
  updateCardAction,
  reviewCardAction,
  deleteCardAction,
} from "@/actions/cards";
import {
  getDecksAction,
  getPublicDecksAction,
  createDeckAction,
  updateDeckAction,
  deleteDeckAction,
  addCardsToDeckAction,
  removeCardFromDeckAction,
  reorderDeckCardsAction,
} from "@/actions/decks";
import { getStudyStatsAction } from "@/actions/stats";
import {
  getCachedCards,
  saveCachedCards,
  getCachedDecks,
  saveCachedDecks,
  enqueueReview,
} from "@/lib/offline-db";
import { initOfflineSync, refreshPendingCount } from "@/services/offline-sync";

vi.mock("@/actions/cards", () => ({
  getCardsAction: vi.fn().mockResolvedValue([]),
  createCardAction: vi.fn().mockResolvedValue(null),
  updateCardAction: vi.fn().mockResolvedValue(null),
  reviewCardAction: vi.fn().mockResolvedValue(null),
  deleteCardAction: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/actions/decks", () => ({
  getDecksAction: vi.fn().mockResolvedValue([]),
  getPublicDecksAction: vi.fn().mockResolvedValue([]),
  createDeckAction: vi.fn().mockResolvedValue(null),
  updateDeckAction: vi.fn().mockResolvedValue(null),
  deleteDeckAction: vi.fn().mockResolvedValue(true),
  addCardsToDeckAction: vi.fn().mockResolvedValue(null),
  removeCardFromDeckAction: vi.fn().mockResolvedValue(null),
  reorderDeckCardsAction: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/actions/stats", () => ({
  getStudyStatsAction: vi.fn().mockResolvedValue(null),
}));

let mockIsAuthenticated = true;
let mockIsWakingServer = false;

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isWakingServer: mockIsWakingServer,
  }),
}));

vi.mock("@/services/notifications", () => ({
  syncCardNotifications: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/offline-db", () => ({
  getCachedCards: vi.fn().mockResolvedValue([]),
  saveCachedCards: vi.fn().mockResolvedValue(undefined),
  getCachedDecks: vi.fn().mockResolvedValue([]),
  saveCachedDecks: vi.fn().mockResolvedValue(undefined),
  enqueueReview: vi.fn().mockResolvedValue(undefined),
}));

let offlineSyncCallback: (() => void) | null = null;
vi.mock("@/services/offline-sync", () => ({
  initOfflineSync: vi.fn((cb) => {
    offlineSyncCallback = cb;
    return vi.fn();
  }),
  refreshPendingCount: vi.fn().mockResolvedValue(0),
}));

const mockStats: StudyStats = {
  streak: {
    current: 5,
    longest: 12,
    lastStudiedAt: "2026-10-18T10:00:00.000Z",
    isActiveToday: true,
  },
  today: {
    reviewsCount: 2,
    targetReviews: 20,
    retentionRate: 88,
  },
  cardsBreakdown: {
    total: 10,
    dueToday: 3,
    newCards: 2,
    learning: 3,
    mature: 5,
  },
  ratingsDistribution: {
    again: 1,
    hard: 2,
    good: 5,
    easy: 2,
    totalReviews: 10,
  },
  heatmap: [],
  forecast: [],
};

const makeMockCard = (id: string, overrides: Partial<Card> = {}): Card => ({
  id,
  jpText: `Japanese ${id}`,
  enText: `English ${id}`,
  interval: 1,
  easeFactor: 2.5,
  repetitions: 1,
  lapses: 0,
  nextReviewAt: "2026-10-18T10:00:00.000Z",
  lastReviewedAt: null,
  createdAt: "2026-10-18T00:00:00.000Z",
  updatedAt: "2026-10-18T00:00:00.000Z",
  ...overrides,
});

const makeMockDeck = (id: string, cards: Card[] = [], overrides: Partial<Deck> = {}): Deck => ({
  id,
  name: `Deck ${id}`,
  isPublic: false,
  cards,
  createdAt: "2026-10-18T00:00:00.000Z",
  updatedAt: "2026-10-18T00:00:00.000Z",
  ...overrides,
});

describe("FlashCardsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsWakingServer = false;
    offlineSyncCallback = null;
    vi.mocked(getCardsAction).mockResolvedValue([]);
    vi.mocked(getDecksAction).mockResolvedValue([]);
    vi.mocked(getPublicDecksAction).mockResolvedValue([]);
    vi.mocked(getStudyStatsAction).mockResolvedValue(mockStats);
    vi.mocked(getCachedCards).mockResolvedValue([]);
    vi.mocked(getCachedDecks).mockResolvedValue([]);
    vi.mocked(updateDeckAction).mockResolvedValue(null);
    vi.mocked(deleteDeckAction).mockResolvedValue(true);
    vi.mocked(updateCardAction).mockResolvedValue(null);
    vi.mocked(deleteCardAction).mockResolvedValue(true);
    localStorage.clear();
  });

  afterEach(() => {
    mockIsAuthenticated = true;
    mockIsWakingServer = false;
  });

  describe("Initialization, Hydration & Sync", () => {
    it("hydrates cached cards and decks on startup if memory state is empty", async () => {
      const cachedC = [makeMockCard("cached-1")];
      const cachedD = [makeMockDeck("cached-deck-1", cachedC)];
      vi.mocked(getCachedCards).mockResolvedValue(cachedC);
      vi.mocked(getCachedDecks).mockResolvedValue(cachedD);
      mockIsWakingServer = true; // prevents network refresh on mount from overwriting cache

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(1);
        expect(result.current.cards[0]?.id).toBe("cached-1");
        expect(result.current.decks).toHaveLength(1);
        expect(result.current.decks[0]?.id).toBe("cached-deck-1");
      });
    });

    it("hydrates public decks from localStorage if available", async () => {
      const publicDecks = [makeMockDeck("pub-stored-1", [], { isPublic: true })];
      localStorage.setItem("nipponic.cached_public_decks", JSON.stringify(publicDecks));

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.publicDecks).toHaveLength(1);
        expect(result.current.publicDecks[0]?.id).toBe("pub-stored-1");
      });
    });

    it("handles offline cache hydration errors and corrupt localStorage safely", async () => {
      vi.mocked(getCachedCards).mockRejectedValue(new Error("IndexedDB unavailable"));
      localStorage.setItem("nipponic.cached_public_decks", "corrupted{{json");

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      expect(result.current.cards).toEqual([]);
      expect(result.current.decks).toEqual([]);
    });

    it("clears cards, decks, and publicDecks when user is not authenticated", async () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.cards).toEqual([]);
        expect(result.current.decks).toEqual([]);
        expect(result.current.publicDecks).toEqual([]);
      });
      expect(getCardsAction).not.toHaveBeenCalled();
    });

    it("sanitizes legacy PT deck names to English during refreshAll", async () => {
      const ptDecks: Deck[] = [
        makeMockDeck("deck-pt-1", [], { name: "Hiragana (Básico)" }),
        makeMockDeck("deck-pt-2", [], { name: "Katakana (Avançado)" }),
        makeMockDeck("deck-pt-3", [], { name: "Katakana (Basico)" }),
        makeMockDeck("deck-pt-4", [], { name: "Hiragana (Avancado)" }),
      ];
      vi.mocked(getDecksAction).mockResolvedValue(ptDecks);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.decks).toHaveLength(4);
        expect(result.current.decks[0]?.name).toBe("Hiragana (Basic)");
        expect(result.current.decks[1]?.name).toBe("Katakana (Advanced)");
        expect(result.current.decks[2]?.name).toBe("Katakana (Basic)");
        expect(result.current.decks[3]?.name).toBe("Hiragana (Advanced)");
      });

      expect(updateDeckAction).toHaveBeenCalledWith("deck-pt-1", { name: "Hiragana (Basic)" });
      expect(updateDeckAction).toHaveBeenCalledWith("deck-pt-2", { name: "Katakana (Advanced)" });
    });

    it("guards against network failure returning empty lists when cached items exist", async () => {
      const card = makeMockCard("existing-card-guard");
      const deck = makeMockDeck("existing-deck-guard", [card]);
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(1);
      });

      // Now network returns empty array
      vi.mocked(getCardsAction).mockResolvedValue([]);
      vi.mocked(getDecksAction).mockResolvedValue([]);

      await act(async () => {
        await result.current.refreshAll();
      });

      // Cache should be preserved
      expect(result.current.cards).toHaveLength(1);
      expect(result.current.cards[0]?.id).toBe("existing-card-guard");
    });

    it("stores fetched public decks in localStorage and caches cards/decks", async () => {
      const serverCards = [makeMockCard("server-c1")];
      const serverDecks = [makeMockDeck("server-d1")];
      const serverPublic = [makeMockDeck("server-pub1", [], { isPublic: true })];
      vi.mocked(getCardsAction).mockResolvedValue(serverCards);
      vi.mocked(getDecksAction).mockResolvedValue(serverDecks);
      vi.mocked(getPublicDecksAction).mockResolvedValue(serverPublic);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(1);
        expect(result.current.decks).toHaveLength(1);
        expect(result.current.publicDecks).toHaveLength(1);
      });

      expect(saveCachedCards).toHaveBeenCalledWith(serverCards);
      expect(saveCachedDecks).toHaveBeenCalledWith(serverDecks);
      expect(localStorage.getItem("nipponic.cached_public_decks")).toContain("server-pub1");
    });

    it("triggers refreshAll when offline sync fires", async () => {
      renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      expect(offlineSyncCallback).not.toBeNull();
      vi.mocked(getCardsAction).mockClear();

      await act(async () => {
        offlineSyncCallback?.();
      });

      expect(getCardsAction).toHaveBeenCalled();
    });

    it("skips refreshAll when offline (navigator.onLine === false)", async () => {
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      vi.mocked(getCardsAction).mockClear();
      await act(async () => {
        await result.current.refreshAll();
      });

      expect(getCardsAction).not.toHaveBeenCalled();
      Object.defineProperty(navigator, "onLine", { configurable: true, value: originalOnLine });
    });

    it("handles errors during refreshAll gracefully", async () => {
      vi.mocked(getCardsAction).mockRejectedValue(new Error("Network drop"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.refreshAll();
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error fetching flash cards/decks:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("UI View State & Selection", () => {
    it("manages selectedDeck, isCurrentDeckOwner, and tab states correctly", async () => {
      const myDeck = makeMockDeck("my-deck-1");
      const pubDeck = makeMockDeck("pub-deck-1", [], { isPublic: true });
      vi.mocked(getDecksAction).mockResolvedValue([myDeck]);
      vi.mocked(getPublicDecksAction).mockResolvedValue([pubDeck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.decks).toHaveLength(1);
      });

      // No deck selected
      expect(result.current.selectedDeck).toBeUndefined();
      expect(result.current.isCurrentDeckOwner).toBe(false);

      // Select user deck
      act(() => {
        result.current.setSelectedDeckId("my-deck-1");
      });
      expect(result.current.selectedDeck?.id).toBe("my-deck-1");
      expect(result.current.isCurrentDeckOwner).toBe(true);

      // Select public deck
      act(() => {
        result.current.setSelectedDeckId("pub-deck-1");
      });
      expect(result.current.selectedDeck?.id).toBe("pub-deck-1");
      expect(result.current.isCurrentDeckOwner).toBe(false);

      // Select app deck (from APP_DECKS)
      const appDeck = result.current.appDecks[0];
      if (appDeck) {
        act(() => {
          result.current.setSelectedDeckId(appDeck.id);
        });
        expect(result.current.selectedDeck?.id).toBe(appDeck.id);
        expect(result.current.isCurrentDeckOwner).toBe(false);
      }

      // Non-existent deck
      act(() => {
        result.current.setSelectedDeckId("non-existent");
      });
      expect(result.current.selectedDeck).toBeUndefined();
      expect(result.current.isCurrentDeckOwner).toBe(false);

      // Tab switching
      act(() => {
        result.current.setActiveDeckTab("public");
        result.current.setActiveSidebarView("flashcards");
      });
      expect(result.current.activeDeckTab).toBe("public");
      expect(result.current.activeSidebarView).toBe("flashcards");
    });

    it("manages playingDeck with startPlayingDeck and stopPlayingDeck", () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      const deck = makeMockDeck("play-deck-1");
      expect(result.current.playingDeck).toBeNull();

      act(() => {
        result.current.startPlayingDeck(deck);
      });
      expect(result.current.playingDeck?.id).toBe("play-deck-1");

      act(() => {
        result.current.stopPlayingDeck();
      });
      expect(result.current.playingDeck).toBeNull();
    });

    it("stopPlayingDeck refreshes studyStats when user finishes or cancels deck review", async () => {
      vi.mocked(getStudyStatsAction).mockClear();
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      const deck = makeMockDeck("play-deck-refresh");
      act(() => {
        result.current.startPlayingDeck(deck);
      });

      act(() => {
        result.current.stopPlayingDeck();
      });

      expect(result.current.playingDeck).toBeNull();
      expect(getStudyStatsAction).toHaveBeenCalled();
    });
  });

  describe("getDueCards", () => {
    it("returns due cards for all cards or for a specific deck", async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      const futureDate = new Date(Date.now() + 1000000).toISOString();

      const dueCard1 = makeMockCard("due-1", { nextReviewAt: pastDate });
      const futureCard = makeMockCard("future-1", { nextReviewAt: futureDate });
      const dueCard2 = makeMockCard("due-2", { nextReviewAt: pastDate });

      const deck = makeMockDeck("deck-due", [dueCard1, futureCard]);
      vi.mocked(getCardsAction).mockResolvedValue([dueCard1, futureCard, dueCard2]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(3);
      });

      const allDue = result.current.getDueCards();
      expect(allDue.map((c) => c.id)).toEqual(["due-1", "due-2"]);

      const deckDue = result.current.getDueCards("deck-due");
      expect(deckDue.map((c) => c.id)).toEqual(["due-1"]);

      const emptyDue = result.current.getDueCards("non-existent-deck");
      expect(emptyDue).toEqual([]);
    });

    it("returns due cards from decksRef even if not in cardsRef", async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      const dueInDeckOnly = makeMockCard("deck-only-due", { nextReviewAt: pastDate });
      const deck = makeMockDeck("deck-with-due", [dueInDeckOnly]);

      vi.mocked(getCardsAction).mockResolvedValue([]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.decks).toHaveLength(1);
      });

      const allDue = result.current.getDueCards();
      expect(allDue.map((c) => c.id)).toContain("deck-only-due");
    });
  });

  describe("Card Operations (CRUD)", () => {
    it("createCard creates card optimistically and synchronizes with backend", async () => {
      const serverCreated = makeMockCard("real-card-id", { jpText: "日本語", enText: "Japanese" });
      vi.mocked(createCardAction).mockResolvedValue(serverCreated);

      const deck = makeMockDeck("deck-target", []);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.decks).toHaveLength(1);
      });

      let created: any = null;
      await act(async () => {
        created = await result.current.createCard({ jpText: "日本語", enText: "Japanese" }, "deck-target");
      });

      expect(created?.id).toBe("real-card-id");
      expect(createCardAction).toHaveBeenCalledWith({ jpText: "日本語", enText: "Japanese" });
      expect(addCardsToDeckAction).toHaveBeenCalledWith("deck-target", ["real-card-id"]);
      expect(result.current.cards[0]?.id).toBe("real-card-id");
      expect(result.current.decks[0]?.cards[0]?.id).toBe("real-card-id");
    });

    it("createCard handles unauthenticated state by returning optimistic card", async () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let created: any = null;
      await act(async () => {
        created = await result.current.createCard({ jpText: "犬", enText: "Dog" });
      });

      expect(createCardAction).not.toHaveBeenCalled();
      expect(created?.id).toMatch(/^temp-card-/);
      expect(result.current.cards).toHaveLength(1);
    });

    it("createCard handles backend error gracefully", async () => {
      vi.mocked(createCardAction).mockRejectedValue(new Error("Database write failure"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let res: Card | null = null;
      await act(async () => {
        res = await result.current.createCard({ jpText: "猫", enText: "Cat" });
      });

      expect(res).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error creating card:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("updateCard updates state optimistically and calls backend", async () => {
      const card = makeMockCard("card-upd-1", { enText: "Old" });
      const deck = makeMockDeck("deck-upd-1", [card]);
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      const updatedServer = { ...card, enText: "New Meaning" };
      vi.mocked(updateCardAction).mockResolvedValue(updatedServer);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.cards).toHaveLength(1);
      });

      let res: any = null;
      await act(async () => {
        res = await result.current.updateCard("card-upd-1", { enText: "New Meaning" });
      });

      expect(updateCardAction).toHaveBeenCalledWith("card-upd-1", { enText: "New Meaning" });
      expect(res?.enText).toBe("New Meaning");
      expect(result.current.cards[0]?.enText).toBe("New Meaning");
      expect(result.current.decks[0]?.cards[0]?.enText).toBe("New Meaning");
    });

    it("updateCard does not call backend for temp card", async () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.updateCard("temp-card-99", { enText: "Temp" });
      });
      expect(updateCardAction).not.toHaveBeenCalled();
    });

    it("updateCard does not call backend when unauthenticated", async () => {
      mockIsAuthenticated = false;
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.updateCard("real-card", { enText: "Guest" });
      });
      expect(updateCardAction).not.toHaveBeenCalled();
    });

    it("updateCard handles backend failure gracefully", async () => {
      const card = makeMockCard("card-err-upd");
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(updateCardAction).mockRejectedValue(new Error("Update failed"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      let res: Card | null = null;
      await act(async () => {
        res = await result.current.updateCard("card-err-upd", { enText: "Failed" });
      });

      expect(res).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error updating card:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("deleteCard removes card from cards and decks and calls deleteCardAction", async () => {
      const card = makeMockCard("card-del-1");
      const deck = makeMockDeck("deck-del-1", [card]);
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      vi.mocked(deleteCardAction).mockResolvedValue(true);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      let success = false;
      await act(async () => {
        success = await result.current.deleteCard("card-del-1");
      });

      expect(success).toBe(true);
      expect(deleteCardAction).toHaveBeenCalledWith("card-del-1");
      expect(result.current.cards).toHaveLength(0);
      expect(result.current.decks[0]?.cards).toHaveLength(0);
    });

    it("deleteCard returns true immediately for temp cards without calling backend", async () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let success = false;
      await act(async () => {
        success = await result.current.deleteCard("temp-card-xyz");
      });

      expect(success).toBe(true);
      expect(deleteCardAction).not.toHaveBeenCalled();
    });

    it("deleteCard handles backend error and returns false", async () => {
      const card = makeMockCard("card-del-err");
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(deleteCardAction).mockRejectedValue(new Error("Delete failed"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      let success = true;
      await act(async () => {
        success = await result.current.deleteCard("card-del-err");
      });

      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("Error deleting card:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("Deck Operations", () => {
    it("createDeck creates deck and selects it", async () => {
      const card = makeMockCard("card-for-deck");
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      const serverDeck = makeMockDeck("real-deck-id", [card], { name: "Custom Deck" });
      vi.mocked(createDeckAction).mockResolvedValue(serverDeck);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      let created: any = null;
      await act(async () => {
        created = await result.current.createDeck("Custom Deck", ["card-for-deck"]);
      });

      expect(created?.id).toBe("real-deck-id");
      expect(result.current.selectedDeckId).toBe("real-deck-id");
      expect(result.current.activeDeckTab).toBe("my");
    });

    it("createDeck supports preloadedCards parameter directly", async () => {
      const preloaded = [makeMockCard("preloaded-1")];
      const serverDeck = makeMockDeck("deck-preloaded", preloaded, { name: "Preloaded" });
      vi.mocked(createDeckAction).mockResolvedValue(serverDeck);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let created: any = null;
      await act(async () => {
        created = await result.current.createDeck("Preloaded", ["preloaded-1"], preloaded);
      });

      expect(created?.id).toBe("deck-preloaded");
    });

    it("createDeck handles unauthenticated state gracefully", async () => {
      mockIsAuthenticated = false;

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let created: any = null;
      await act(async () => {
        created = await result.current.createDeck("Guest Deck");
      });

      expect(createDeckAction).not.toHaveBeenCalled();
      expect(created?.id).toMatch(/^temp-deck-/);
      expect(result.current.decks).toHaveLength(1);
    });

    it("createDeck handles backend error gracefully", async () => {
      vi.mocked(createDeckAction).mockRejectedValue(new Error("Deck create failed"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let res: Deck | null = null;
      await act(async () => {
        res = await result.current.createDeck("Fail Deck");
      });

      expect(res).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error creating deck:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("updateDeck updates deck metadata and calls backend", async () => {
      const deck = makeMockDeck("deck-upd-target", [], { name: "Original Name" });
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      const updatedServer = { ...deck, name: "Renamed Deck" };
      vi.mocked(updateDeckAction).mockResolvedValue(updatedServer);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      let res: any = null;
      await act(async () => {
        res = await result.current.updateDeck("deck-upd-target", { name: "Renamed Deck" });
      });

      expect(res?.name).toBe("Renamed Deck");
      expect(updateDeckAction).toHaveBeenCalledWith("deck-upd-target", { name: "Renamed Deck" });
      expect(result.current.decks[0]?.name).toBe("Renamed Deck");
    });

    it("updateDeck handles temp decks or unauthenticated state without calling backend", async () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.updateDeck("temp-deck-123", { name: "Offline Name" });
      });
      expect(updateDeckAction).not.toHaveBeenCalled();
    });

    it("deleteDeck removes deck and resets selectedDeckId and playingDeck if matching", async () => {
      const deck = makeMockDeck("deck-to-del");
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      vi.mocked(deleteDeckAction).mockResolvedValue(true);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      act(() => {
        result.current.setSelectedDeckId("deck-to-del");
        result.current.startPlayingDeck(deck);
      });
      expect(result.current.selectedDeckId).toBe("deck-to-del");
      expect(result.current.playingDeck?.id).toBe("deck-to-del");

      let success = false;
      await act(async () => {
        success = await result.current.deleteDeck("deck-to-del");
      });

      expect(success).toBe(true);
      expect(deleteDeckAction).toHaveBeenCalledWith("deck-to-del");
      expect(result.current.decks).toHaveLength(0);
      expect(result.current.selectedDeckId).toBeNull();
      expect(result.current.playingDeck).toBeNull();
    });

    it("addCardsToDeck adds cards to deck state and calls addCardsToDeckAction", async () => {
      const card1 = makeMockCard("c-add-1");
      const card2 = makeMockCard("c-add-2");
      const deck = makeMockDeck("deck-add-cards", [card1]);
      vi.mocked(getCardsAction).mockResolvedValue([card1, card2]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      const updatedDeck = { ...deck, cards: [card1, card2] };
      vi.mocked(addCardsToDeckAction).mockResolvedValue(updatedDeck);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(2));

      await act(async () => {
        await result.current.addCardsToDeck("deck-add-cards", ["c-add-2"]);
      });

      expect(addCardsToDeckAction).toHaveBeenCalledWith("deck-add-cards", ["c-add-2"]);
      expect(result.current.decks[0]?.cards).toHaveLength(2);
    });

    it("removeCardFromDeck removes card from deck and calls removeCardFromDeckAction", async () => {
      const card1 = makeMockCard("c-rem-1");
      const deck = makeMockDeck("deck-rem-cards", [card1]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      const updatedDeck = { ...deck, cards: [] };
      vi.mocked(removeCardFromDeckAction).mockResolvedValue(updatedDeck);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      await act(async () => {
        await result.current.removeCardFromDeck("deck-rem-cards", "c-rem-1");
      });

      expect(removeCardFromDeckAction).toHaveBeenCalledWith("deck-rem-cards", "c-rem-1");
      expect(result.current.decks[0]?.cards).toHaveLength(0);
    });

    it("reorderDeckCards reorders cards in deck and calls reorderDeckCardsAction", async () => {
      const card1 = makeMockCard("card-reorder-1");
      const card2 = makeMockCard("card-reorder-2");
      const deck = makeMockDeck("deck-reorder", [card1, card2]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      const reorderedDeck = { ...deck, cards: [card2, card1] };
      vi.mocked(reorderDeckCardsAction).mockResolvedValue(reorderedDeck);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      await act(async () => {
        await result.current.reorderDeckCards("deck-reorder", ["card-reorder-2", "card-reorder-1"]);
      });

      expect(reorderDeckCardsAction).toHaveBeenCalledWith("deck-reorder", [
        "card-reorder-2",
        "card-reorder-1",
      ]);
      expect(result.current.decks[0]?.cards[0]?.id).toBe("card-reorder-2");
      expect(result.current.decks[0]?.cards[1]?.id).toBe("card-reorder-1");
    });
  });

  describe("SRS Review Workflow", () => {
    it("reviewCard updates card review schedule online and refreshes stats", async () => {
      const card = makeMockCard("card-rev-online", { interval: 1, easeFactor: 2.5, repetitions: 1 });
      const deck = makeMockDeck("deck-rev", [card]);
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const persistedCard = {
        ...card,
        interval: 6,
        repetitions: 2,
        easeFactor: 2.6,
        lastReviewedAt: new Date().toISOString(),
      };
      vi.mocked(reviewCardAction).mockResolvedValue(persistedCard);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      act(() => {
        result.current.startPlayingDeck(deck);
      });

      let reviewed: any = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("card-rev-online", 3 as ReviewRating);
      });

      expect(reviewCardAction).toHaveBeenCalledWith("card-rev-online", 3);
      expect(reviewed?.interval).toBe(6);
      expect(saveCachedCards).toHaveBeenCalled();
      expect(saveCachedDecks).toHaveBeenCalled();
      expect(result.current.playingDeck?.cards[0]?.interval).toBe(6);
      expect(getStudyStatsAction).toHaveBeenCalled();
    });

    it("reviewCard optimistically updates studyStats dueToday and reviewsCount", async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      const card = makeMockCard("card-opt-due", { nextReviewAt: pastDate });
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      const initialStats = {
        streak: { current: 1, longest: 2, lastStudiedAt: null, isActiveToday: true },
        today: { reviewsCount: 0, targetReviews: 20, retentionRate: 100 },
        cardsBreakdown: { total: 1, dueToday: 1, newCards: 0, learning: 1, mature: 0 },
        ratingsDistribution: { again: 0, hard: 0, good: 0, easy: 0, totalReviews: 0 },
        heatmap: [],
        forecast: [],
      };
      vi.mocked(getStudyStatsAction)
        .mockResolvedValueOnce(initialStats)
        .mockResolvedValue({
          ...initialStats,
          today: { ...initialStats.today, reviewsCount: 1 },
          cardsBreakdown: { ...initialStats.cardsBreakdown, dueToday: 0 },
        });
      vi.mocked(reviewCardAction).mockResolvedValue({
        ...card,
        interval: 1,
        repetitions: 1,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.studyStats?.cardsBreakdown.dueToday).toBe(1);
      });

      await act(async () => {
        await result.current.reviewCard("card-opt-due", 3 as ReviewRating);
      });

      expect(result.current.studyStats?.cardsBreakdown.dueToday).toBe(0);
      expect(result.current.studyStats?.today.reviewsCount).toBe(1);
    });

    it("reviewCard handles offline mode by enqueueing review into IndexedDB queue", async () => {
      const card = makeMockCard("card-rev-offline");
      vi.mocked(getCardsAction).mockResolvedValue([card]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

      let reviewed: Card | null = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("card-rev-offline", 4 as ReviewRating);
      });

      expect(reviewCardAction).not.toHaveBeenCalled();
      expect(enqueueReview).toHaveBeenCalledWith("card-rev-offline", 4);
      expect(refreshPendingCount).toHaveBeenCalled();
      expect(reviewed).not.toBeNull();

      Object.defineProperty(navigator, "onLine", { configurable: true, value: originalOnLine });
    });

    it("reviewCard enqueues review when reviewCardAction fails on network error", async () => {
      const card = makeMockCard("card-rev-fail");
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(reviewCardAction).mockRejectedValue(new Error("Timeout during review"));

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      let reviewed: Card | null = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("card-rev-fail", 2 as ReviewRating);
      });

      expect(enqueueReview).toHaveBeenCalledWith("card-rev-fail", 2);
      expect(refreshPendingCount).toHaveBeenCalled();
      expect(reviewed).not.toBeNull();
    });

    it("reviewCard returns null if card is not found anywhere", async () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let reviewed: Card | null = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("unknown-card-id", 3 as ReviewRating);
      });

      expect(reviewed).toBeNull();
    });

    it("reviewCard handles temp cards and unauthenticated users without calling API", async () => {
      const tempCard = makeMockCard("temp-card-review");
      vi.mocked(getCardsAction).mockResolvedValue([tempCard]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      let reviewed: Card | null = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("temp-card-review", 1 as ReviewRating);
      });

      expect(reviewCardAction).not.toHaveBeenCalled();
      expect((reviewed as Card | null)?.repetitions).toBe(0);
    });
  });

  describe("refreshStats", () => {
    it("fetches and updates studyStats when authenticated", async () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.studyStats).toEqual(mockStats);
      });

      const updatedStats: StudyStats = {
        ...mockStats,
        today: {
          ...mockStats.today,
          reviewsCount: 15,
        },
        streak: {
          ...mockStats.streak,
          current: 6,
        },
      };
      vi.mocked(getStudyStatsAction).mockResolvedValue(updatedStats);

      await act(async () => {
        await result.current.refreshStats?.();
      });

      expect(result.current.studyStats?.today.reviewsCount).toBe(15);
    });

    it("does not fetch stats when unauthenticated", async () => {
      mockIsAuthenticated = false;
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      vi.mocked(getStudyStatsAction).mockClear();
      await act(async () => {
        await result.current.refreshStats?.();
      });

      expect(getStudyStatsAction).not.toHaveBeenCalled();
    });

    it("catches and logs error when getStudyStatsAction fails", async () => {
      vi.mocked(getStudyStatsAction).mockRejectedValue(new Error("Stats failure"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.refreshStats?.();
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error refreshing study stats:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("addDeckToMyDecks", () => {
    it("creates all cards concurrently instead of sequentially", async () => {
      let activeCreations = 0;
      let maxConcurrentCreations = 0;

      vi.mocked(createCardAction).mockImplementation(async (data) => {
        activeCreations++;
        maxConcurrentCreations = Math.max(maxConcurrentCreations, activeCreations);
        await new Promise((resolve) => setTimeout(resolve, 30));
        activeCreations--;
        return makeMockCard(`card_${Math.random().toString(36).slice(2, 7)}`, data);
      });

      vi.mocked(createDeckAction).mockImplementation(async (dto) =>
        makeMockDeck("deck_persisted_123", [], { name: dto.name })
      );

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      const sourceDeck: Deck = makeMockDeck("source_deck_1", [
        makeMockCard("sc_1", { jpText: "猫", enText: "Cat" }),
        makeMockCard("sc_2", { jpText: "犬", enText: "Dog" }),
        makeMockCard("sc_3", { jpText: "鳥", enText: "Bird" }),
      ], { name: "JLPT N5 Vocabulary", isPublic: true });

      await act(async () => {
        await result.current.addDeckToMyDecks(sourceDeck);
      });

      expect(createCardAction).toHaveBeenCalledTimes(3);
      expect(maxConcurrentCreations).toBe(3);
      expect(createDeckAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "JLPT N5 Vocabulary",
          isPublic: false,
          cardIds: expect.arrayContaining([expect.stringMatching(/^card_/)]),
        })
      );
      expect(result.current.selectedDeckId).toBe("deck_persisted_123");
      expect(result.current.activeDeckTab).toBe("my");
    });

    it("handles empty deck without error", async () => {
      vi.mocked(createDeckAction).mockImplementation(async (dto) =>
        makeMockDeck("deck_empty_123", [], { name: dto.name })
      );

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      const emptyDeck = makeMockDeck("empty_deck_1", [], { isPublic: true, name: "Empty Deck" });

      let created: Deck | null = null;
      await act(async () => {
        created = await result.current.addDeckToMyDecks(emptyDeck);
      });

      expect(createCardAction).not.toHaveBeenCalled();
      expect(createDeckAction).toHaveBeenCalledWith({
        name: "Empty Deck",
        isPublic: false,
        cardIds: [],
      });
      expect((created as Deck | null)?.id).toBe("deck_empty_123");
    });

    it("handles partial card creation network errors gracefully without dropping successful cards", async () => {
      let callCount = 0;
      vi.mocked(createCardAction).mockImplementation(async (data) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Network timeout");
        }
        return makeMockCard(`card_success_${callCount}`, data);
      });

      vi.mocked(createDeckAction).mockImplementation(async (dto) =>
        makeMockDeck("deck_partial_success", [], { name: dto.name })
      );

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      const sourceDeck = makeMockDeck("source_deck_partial", [
        makeMockCard("c1", { jpText: "太陽", enText: "Sun" }),
        makeMockCard("c2", { jpText: "月", enText: "Moon" }),
      ], { name: "Partial Test Deck", isPublic: true });

      let created: Deck | null = null;
      await act(async () => {
        created = await result.current.addDeckToMyDecks(sourceDeck);
      });

      expect(createCardAction).toHaveBeenCalledTimes(2);
      expect(createDeckAction).toHaveBeenCalledWith({
        name: "Partial Test Deck",
        isPublic: false,
        cardIds: ["card_success_1"],
      });
      expect((created as Deck | null)?.id).toBe("deck_partial_success");
    });
  });

  describe("Callback Stability", () => {
    it("maintains stable references for context callbacks across provider re-renders", () => {
      const { result, rerender } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      const initialCreateCard = result.current.createCard;
      const initialUpdateCard = result.current.updateCard;
      const initialDeleteCard = result.current.deleteCard;
      const initialCreateDeck = result.current.createDeck;
      const initialAddDeckToMyDecks = result.current.addDeckToMyDecks;
      const initialUpdateDeck = result.current.updateDeck;
      const initialAddCardsToDeck = result.current.addCardsToDeck;
      const initialRemoveCardFromDeck = result.current.removeCardFromDeck;
      const initialReorderDeckCards = result.current.reorderDeckCards;
      const initialGetDueCards = result.current.getDueCards;

      rerender();

      expect(result.current.createCard).toBe(initialCreateCard);
      expect(result.current.updateCard).toBe(initialUpdateCard);
      expect(result.current.deleteCard).toBe(initialDeleteCard);
      expect(result.current.createDeck).toBe(initialCreateDeck);
      expect(result.current.addDeckToMyDecks).toBe(initialAddDeckToMyDecks);
      expect(result.current.updateDeck).toBe(initialUpdateDeck);
      expect(result.current.addCardsToDeck).toBe(initialAddCardsToDeck);
      expect(result.current.removeCardFromDeck).toBe(initialRemoveCardFromDeck);
      expect(result.current.reorderDeckCards).toBe(initialReorderDeckCards);
      expect(result.current.getDueCards).toBe(initialGetDueCards);
    });
  });

  describe("Branch Edge Cases", () => {
    it("does not call addCardsToDeckAction if deckId is a temp deck", async () => {
      const serverCreated = makeMockCard("real-card-tmp-deck");
      vi.mocked(createCardAction).mockResolvedValue(serverCreated);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.createCard({ jpText: "火", enText: "Fire" }, "temp-deck-999");
      });

      expect(createCardAction).toHaveBeenCalled();
      expect(addCardsToDeckAction).not.toHaveBeenCalled();
    });

    it("returns optimistic card when createCardAction returns null or empty id", async () => {
      vi.mocked(createCardAction).mockResolvedValue(null);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let created: any = null;
      await act(async () => {
        created = await result.current.createCard({ jpText: "風", enText: "Wind" });
      });

      expect(created?.id).toMatch(/^temp-card-/);
    });

    it("returns optimistic deck when createDeckAction returns null or empty id", async () => {
      vi.mocked(createDeckAction).mockResolvedValue(null);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let created: any = null;
      await act(async () => {
        created = await result.current.createDeck("Optimistic Only");
      });

      expect(created?.id).toMatch(/^temp-deck-/);
    });

    it("reviewCard finds card in decksRef or appDecks", async () => {
      const cardInDeck = makeMockCard("card-in-deck-only");
      const deck = makeMockDeck("deck-with-card", [cardInDeck]);
      // Cards list is empty, but decks has the card
      vi.mocked(getCardsAction).mockResolvedValue([]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);
      vi.mocked(reviewCardAction).mockResolvedValue({
        ...cardInDeck,
        interval: 3,
        repetitions: 2,
        easeFactor: 2.5,
        lastReviewedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      let reviewed: any = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("card-in-deck-only", 3 as ReviewRating);
      });

      expect(reviewed?.interval).toBe(3);
    });

    it("reviewCard handles app-card- prefix without calling reviewCardAction", async () => {
      const appCard = makeMockCard("app-card-hiragana-a");
      const deck = makeMockDeck("app-deck", [appCard]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      let reviewed: Card | null = null;
      await act(async () => {
        reviewed = await result.current.reviewCard("app-card-hiragana-a", 4 as ReviewRating);
      });

      expect(reviewCardAction).not.toHaveBeenCalled();
      expect(reviewed).not.toBeNull();
    });

    it("reviewCard enqueues review into IndexedDB when reviewCardAction resolves with null", async () => {
      const card = makeMockCard("card-null-res");
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(reviewCardAction).mockResolvedValue(null);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.cards).toHaveLength(1));

      await act(async () => {
        await result.current.reviewCard("card-null-res", 3 as ReviewRating);
      });

      expect(enqueueReview).toHaveBeenCalledWith("card-null-res", 3);
      expect(refreshPendingCount).toHaveBeenCalled();
    });

    it("addCardsToDeck, removeCardFromDeck, and reorderDeckCards return early on temp deck", async () => {
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.addCardsToDeck("temp-deck-1", ["c1"]);
        await result.current.removeCardFromDeck("temp-deck-1", "c1");
        await result.current.reorderDeckCards("temp-deck-1", ["c1"]);
      });

      expect(addCardsToDeckAction).not.toHaveBeenCalled();
      expect(removeCardFromDeckAction).not.toHaveBeenCalled();
      expect(reorderDeckCardsAction).not.toHaveBeenCalled();
    });

    it("addCardsToDeck, removeCardFromDeck, and reorderDeckCards catch errors gracefully", async () => {
      vi.mocked(addCardsToDeckAction).mockRejectedValue(new Error("Add cards err"));
      vi.mocked(removeCardFromDeckAction).mockRejectedValue(new Error("Remove card err"));
      vi.mocked(reorderDeckCardsAction).mockRejectedValue(new Error("Reorder cards err"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await act(async () => {
        await result.current.addCardsToDeck("real-deck-1", ["c1"]);
        await result.current.removeCardFromDeck("real-deck-1", "c1");
        await result.current.reorderDeckCards("real-deck-1", ["c1"]);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error adding cards to deck:", expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith("Error removing card from deck:", expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith("Error reordering cards:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("updateDeck and deleteDeck catch errors gracefully and deleteDeck handles unauthenticated state", async () => {
      vi.mocked(updateDeckAction).mockRejectedValue(new Error("Update deck err"));
      vi.mocked(deleteDeckAction).mockRejectedValue(new Error("Delete deck err"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let updatedRes: Deck | null = null;
      let deleteRes = true;
      await act(async () => {
        updatedRes = await result.current.updateDeck("real-deck-id", { name: "New Name" });
        deleteRes = await result.current.deleteDeck("real-deck-id");
      });

      expect(updatedRes).toBeNull();
      expect(deleteRes).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("Error updating deck:", expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith("Error deleting deck:", expect.any(Error));
      consoleSpy.mockRestore();

      // deleteDeck when unauthenticated
      mockIsAuthenticated = false;
      const { result: unauthResult } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let unauthDelete = false;
      await act(async () => {
        unauthDelete = await unauthResult.current.deleteDeck("deck-to-del-unauth");
      });
      expect(unauthDelete).toBe(true);
    });

    it("guards against empty decks returned from network when cached decks exist", async () => {
      const card = makeMockCard("c1");
      const deck = makeMockDeck("d1", [card]);
      vi.mocked(getCardsAction).mockResolvedValue([card]);
      vi.mocked(getDecksAction).mockResolvedValue([deck]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(1));

      // Network returns cards but empty decks
      vi.mocked(getDecksAction).mockResolvedValue([]);
      await act(async () => {
        await result.current.refreshAll();
      });

      expect(result.current.decks).toHaveLength(1);
    });

    it("createCard respects provided custom SRS and review parameters", async () => {
      mockIsAuthenticated = false;
      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      let customCard: any = null;
      await act(async () => {
        customCard = await result.current.createCard({
          jpText: "木",
          enText: "Tree",
          interval: 5,
          easeFactor: 2.8,
          repetitions: 3,
          lapses: 1,
          nextReviewAt: "2026-11-01T00:00:00.000Z",
          lastReviewedAt: "2026-10-25T00:00:00.000Z",
        });
      });

      expect(customCard?.interval).toBe(5);
      expect(customCard?.easeFactor).toBe(2.8);
      expect(customCard?.repetitions).toBe(3);
      expect(customCard?.lapses).toBe(1);
      expect(customCard?.nextReviewAt).toBe("2026-11-01T00:00:00.000Z");
      expect(customCard?.lastReviewedAt).toBe("2026-10-25T00:00:00.000Z");
    });

    it("reviewCard finds card in APP_DECKS and reviews offline with decks containing the card", async () => {
      const { APP_DECKS } = await import("@/data/app-decks");
      const appCardId = APP_DECKS[0]?.cards[0]?.id;
      const cardOffline = makeMockCard("c-off-1");
      const deckOffline1 = makeMockDeck("d-off-1", [cardOffline]);
      const deckOffline2 = makeMockDeck("d-off-2", []); // non-matching deck
      vi.mocked(getCardsAction).mockResolvedValue([cardOffline]);
      vi.mocked(getDecksAction).mockResolvedValue([deckOffline1, deckOffline2]);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(2));

      // Review card from APP_DECKS
      if (appCardId) {
        let appReviewed: Card | null = null;
        await act(async () => {
          appReviewed = await result.current.reviewCard(appCardId, 3 as ReviewRating);
        });
        expect(appReviewed).not.toBeNull();
      }

      // Review card offline with populated decks
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });

      await act(async () => {
        await result.current.reviewCard("c-off-1", 4 as ReviewRating);
      });

      expect(saveCachedDecks).toHaveBeenCalled();
      Object.defineProperty(navigator, "onLine", { configurable: true, value: originalOnLine });
    });

    it("exercises non-matching deck branches in addCardsToDeck, removeCardFromDeck, and reorderDeckCards", async () => {
      const card1 = makeMockCard("c1");
      const card2 = makeMockCard("c2");
      const targetDeck = makeMockDeck("target-deck", [card1]);
      const otherDeck = makeMockDeck("other-deck", []);
      vi.mocked(getCardsAction).mockResolvedValue([card1, card2]);
      vi.mocked(getDecksAction).mockResolvedValue([targetDeck, otherDeck]);
      vi.mocked(addCardsToDeckAction).mockResolvedValue({ ...targetDeck, cards: [card1, card2] });
      vi.mocked(removeCardFromDeckAction).mockResolvedValue({ ...targetDeck, cards: [card2] });
      vi.mocked(reorderDeckCardsAction).mockResolvedValue({ ...targetDeck, cards: [card2, card1] });

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(2));

      // addCardsToDeck with existing card (filter out existing)
      await act(async () => {
        await result.current.addCardsToDeck("target-deck", ["c1", "c2"]);
      });

      // removeCardFromDeck on targetDeck while otherDeck is present
      await act(async () => {
        await result.current.removeCardFromDeck("target-deck", "c1");
      });

      // reorderDeckCards with non-existent id included
      await act(async () => {
        await result.current.reorderDeckCards("target-deck", ["c2", "c1", "non-existent-card"]);
      });

      expect(result.current.decks).toHaveLength(2);
    });

    it("handles null return from deck actions and multiple cards mapping in review, update, and create", async () => {
      const card1 = makeMockCard("multi-c1");
      const card2 = makeMockCard("multi-c2");
      const deck1 = makeMockDeck("deck-multi-1", [card1, card2]);
      const deck2 = makeMockDeck("deck-multi-2", []);
      vi.mocked(getCardsAction).mockResolvedValue([card1, card2]);
      vi.mocked(getDecksAction).mockResolvedValue([deck1, deck2]);

      // Return null from backend deck actions to cover falsy updated branches
      vi.mocked(addCardsToDeckAction).mockResolvedValue(null);
      vi.mocked(removeCardFromDeckAction).mockResolvedValue(null);
      vi.mocked(reorderDeckCardsAction).mockResolvedValue(null);

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => expect(result.current.decks).toHaveLength(2));

      // Test isCurrentDeckOwner when deck1 is selected while deck2 also exists
      act(() => {
        result.current.setSelectedDeckId("deck-multi-1");
        result.current.startPlayingDeck(deck1);
      });
      expect(result.current.isCurrentDeckOwner).toBe(true);

      // Deck actions returning null
      await act(async () => {
        await result.current.addCardsToDeck("deck-multi-1", ["multi-c2"]);
        await result.current.removeCardFromDeck("deck-multi-1", "multi-c2");
        await result.current.reorderDeckCards("deck-multi-1", ["multi-c2", "multi-c1"]);
      });

      // updateCard with multi-card deck to trigger c.id !== id branch
      vi.mocked(updateCardAction).mockResolvedValue({ ...card1, enText: "Updated 1" });
      await act(async () => {
        await result.current.updateCard("multi-c1", { enText: "Updated 1" });
      });

      // reviewCard with multi-card deck & playingDeck to trigger c.id !== cardId branches
      vi.mocked(reviewCardAction).mockResolvedValue({
        ...card1,
        interval: 2,
        repetitions: 2,
        easeFactor: 2.5,
        lastReviewedAt: new Date().toISOString(),
      });
      await act(async () => {
        await result.current.reviewCard("multi-c1", 3 as ReviewRating);
      });

      // createCard with multi-deck state to trigger d.id !== deckId
      vi.mocked(createCardAction).mockResolvedValue(makeMockCard("new-multi-card"));
      await act(async () => {
        await result.current.createCard({ jpText: "新", enText: "New" }, "deck-multi-1");
      });
    });

    it("handles localStorage write error when caching public decks safely", async () => {



      const serverPublic = [makeMockDeck("server-pub-err", [], { isPublic: true })];
      vi.mocked(getPublicDecksAction).mockResolvedValue(serverPublic);
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const { result } = renderHook(() => useFlashCards(), {
        wrapper: ({ children }) => <FlashCardsProvider>{children}</FlashCardsProvider>,
      });

      await waitFor(() => {
        expect(result.current.publicDecks).toHaveLength(1);
      });

      setItemSpy.mockRestore();
    });
  });
});

