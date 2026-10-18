import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FlashCardsProvider, useFlashCards } from "./FlashCardsContext";
import { Deck } from "@nipponic/shared";
import { getCardsAction, createCardAction } from "@/actions/cards";
import {
  getDecksAction,
  getPublicDecksAction,
  createDeckAction,
} from "@/actions/decks";

vi.mock("@/actions/cards", () => ({
  getCardsAction: vi.fn(),
  createCardAction: vi.fn(),
  updateCardAction: vi.fn(),
  reviewCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
}));

vi.mock("@/actions/decks", () => ({
  getDecksAction: vi.fn(),
  getPublicDecksAction: vi.fn(),
  createDeckAction: vi.fn(),
  updateDeckAction: vi.fn(),
  deleteDeckAction: vi.fn(),
  addCardsToDeckAction: vi.fn(),
  removeCardFromDeckAction: vi.fn(),
  reorderDeckCardsAction: vi.fn(),
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

vi.mock("@/services/offline-sync", () => ({
  initOfflineSync: vi.fn(),
  refreshPendingCount: vi.fn().mockResolvedValue(0),
}));

describe("FlashCardsContext - addDeckToMyDecks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsWakingServer = false;
    vi.mocked(getCardsAction).mockResolvedValue([]);
    vi.mocked(getDecksAction).mockResolvedValue([]);
    vi.mocked(getPublicDecksAction).mockResolvedValue([]);
  });

  it("addDeckToMyDecks - should create all cards concurrently instead of sequentially to prevent UI freezing and performance bottlenecks", async () => {
    let activeCreations = 0;
    let maxConcurrentCreations = 0;

    vi.mocked(createCardAction).mockImplementation(async (data) => {
      activeCreations++;
      maxConcurrentCreations = Math.max(
        maxConcurrentCreations,
        activeCreations
      );
      // Simulate network latency for API call
      await new Promise((resolve) => setTimeout(resolve, 30));
      activeCreations--;
      return {
        id: `card_${Math.random().toString(36).slice(2, 7)}`,
        ...data,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    vi.mocked(createDeckAction).mockImplementation(async (dto) => ({
      id: "deck_persisted_123",
      name: dto.name,
      isPublic: false,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { result } = renderHook(() => useFlashCards(), {
      wrapper: ({ children }) => (
        <FlashCardsProvider>{children}</FlashCardsProvider>
      ),
    });

    const sourceDeck: Deck = {
      id: "source_deck_1",
      name: "JLPT N5 Vocabulary",
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: [
        {
          id: "sc_1",
          jpText: "猫",
          enText: "Cat",
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "sc_2",
          jpText: "犬",
          enText: "Dog",
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "sc_3",
          jpText: "鳥",
          enText: "Bird",
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    await act(async () => {
      await result.current.addDeckToMyDecks(sourceDeck);
    });

    // Verify all cards were created
    expect(createCardAction).toHaveBeenCalledTimes(3);

    // Concurrency verification: card creations MUST be executed concurrently in parallel,
    // not sequentially with blocking awaits per card.
    expect(maxConcurrentCreations).toBeGreaterThan(1);
    expect(maxConcurrentCreations).toBe(3);

    // Verify the deck was created with the new cards
    expect(createDeckAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "JLPT N5 Vocabulary",
        isPublic: false,
        cardIds: expect.arrayContaining([expect.stringMatching(/^card_/)]),
      })
    );

    // Verify UI state updates
    expect(result.current.selectedDeckId).toBe("deck_persisted_123");
    expect(result.current.activeDeckTab).toBe("my");
  });

  it("addDeckToMyDecks - should handle empty deck without error", async () => {
    vi.mocked(createDeckAction).mockImplementation(async (dto) => ({
      id: "deck_empty_123",
      name: dto.name,
      isPublic: false,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { result } = renderHook(() => useFlashCards(), {
      wrapper: ({ children }) => (
        <FlashCardsProvider>{children}</FlashCardsProvider>
      ),
    });

    const emptyDeck: Deck = {
      id: "empty_deck_1",
      name: "Empty Deck",
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: [],
    };

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

  it("addDeckToMyDecks - should handle unauthenticated user gracefully creating optimistic deck and cards", async () => {
    mockIsAuthenticated = false;

    const { result } = renderHook(() => useFlashCards(), {
      wrapper: ({ children }) => (
        <FlashCardsProvider>{children}</FlashCardsProvider>
      ),
    });

    const sourceDeck: Deck = {
      id: "source_deck_unauth",
      name: "Offline Deck",
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: [
        {
          id: "sc_unauth_1",
          jpText: "水",
          enText: "Water",
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    let created: Deck | null = null;
    await act(async () => {
      created = await result.current.addDeckToMyDecks(sourceDeck);
    });

    expect(createCardAction).not.toHaveBeenCalled();
    expect(createDeckAction).not.toHaveBeenCalled();
    expect(created).not.toBeNull();
    expect((created as Deck | null)?.name).toBe("Offline Deck");
    expect(result.current.activeDeckTab).toBe("my");
  });

  it("addDeckToMyDecks - should handle partial card creation network errors gracefully without dropping successful cards", async () => {
    let callCount = 0;
    vi.mocked(createCardAction).mockImplementation(async (data) => {
      callCount++;
      if (callCount === 2) {
        // Simulate network failure on card 2
        throw new Error("Network timeout");
      }
      return {
        id: `card_success_${callCount}`,
        ...data,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        lastReviewedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    vi.mocked(createDeckAction).mockImplementation(async (dto) => ({
      id: "deck_partial_success",
      name: dto.name,
      isPublic: false,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { result } = renderHook(() => useFlashCards(), {
      wrapper: ({ children }) => (
        <FlashCardsProvider>{children}</FlashCardsProvider>
      ),
    });

    const sourceDeck: Deck = {
      id: "source_deck_partial",
      name: "Partial Test Deck",
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cards: [
        {
          id: "c1",
          jpText: "太陽",
          enText: "Sun",
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "c2",
          jpText: "月",
          enText: "Moon",
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          lapses: 0,
          nextReviewAt: new Date().toISOString(),
          lastReviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    let created: Deck | null = null;
    await act(async () => {
      created = await result.current.addDeckToMyDecks(sourceDeck);
    });

    expect(createCardAction).toHaveBeenCalledTimes(2);
    // Only successful card (card_success_1) should be passed to createDeck
    expect(createDeckAction).toHaveBeenCalledWith({
      name: "Partial Test Deck",
      isPublic: false,
      cardIds: ["card_success_1"],
    });
    expect((created as Deck | null)?.id).toBe("deck_partial_success");
  });
});

