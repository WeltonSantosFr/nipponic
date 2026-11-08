import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BottomNavigation } from "./bottom-navigation";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import type { FlashCardsContextData, Card } from "@nipponic/shared";

describe("BottomNavigation", () => {
  const mockSetActiveSidebarView = vi.fn();

  const createMockFlashcards = (
    overrides: Partial<FlashCardsContextData> = {}
  ): FlashCardsContextData => ({
    cards: [],
    decks: [],
    appDecks: [],
    publicDecks: [],
    activeDeckTab: "my",
    setActiveDeckTab: vi.fn(),
    selectedDeckId: null,
    selectedDeck: undefined,
    isCurrentDeckOwner: false,
    setSelectedDeckId: vi.fn(),
    activeSidebarView: "notes",
    setActiveSidebarView: mockSetActiveSidebarView,
    playingDeck: null,
    startPlayingDeck: vi.fn(),
    stopPlayingDeck: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reviewCard: vi.fn(),
    getDueCards: () => [],
    createDeck: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
    addCardsToDeck: vi.fn(),
    removeCardFromDeck: vi.fn(),
    reorderDeckCards: vi.fn(),
    addDeckToMyDecks: vi.fn(),
    refreshAll: vi.fn(),
    studyStats: null,
    refreshStats: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 4 navigation tabs properly", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ activeSidebarView: "notes" })
    );

    render(<BottomNavigation />);

    expect(screen.getByRole("tab", { name: /notes section/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /cards section/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /tutor section/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /stats section/i })).toBeInTheDocument();

    // Check active state
    expect(screen.getByRole("tab", { name: /notes section/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: /cards section/i })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("calls setActiveSidebarView when a tab is clicked", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ activeSidebarView: "notes" })
    );

    render(<BottomNavigation />);

    fireEvent.click(screen.getByRole("tab", { name: /cards section/i }));
    expect(mockSetActiveSidebarView).toHaveBeenCalledWith("flashcards");

    fireEvent.click(screen.getByRole("tab", { name: /stats section/i }));
    expect(mockSetActiveSidebarView).toHaveBeenCalledWith("stats");

    fireEvent.click(screen.getByRole("tab", { name: /tutor section/i }));
    expect(mockSetActiveSidebarView).toHaveBeenCalledWith("tutor");
  });

  it("renders badges for due cards and study streak", () => {
    const mockDueCard: Card = {
      id: "card-1",
      jpText: "犬",
      enText: "Dog",
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: "2026-01-01T00:00:00.000Z",
      lastReviewedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeSidebarView: "cards" as any,
        cards: [mockDueCard],
        getDueCards: () => [mockDueCard],
        studyStats: {
          streak: { current: 7, longest: 14, lastStudiedAt: null, isActiveToday: true },
          today: { reviewsCount: 5, targetReviews: 20, retentionRate: 100 },
          cardsBreakdown: { total: 10, dueToday: 1, newCards: 2, learning: 3, mature: 5 },
          ratingsDistribution: { again: 0, hard: 0, good: 5, easy: 0, totalReviews: 5 },
          heatmap: [],
          forecast: [],
        },
      })
    );

    render(<BottomNavigation />);

    expect(screen.getByText("1")).toBeInTheDocument(); // due card count badge
    expect(screen.getByText("7")).toBeInTheDocument(); // streak count badge
  });

  it("does not render when playingDeck is active", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        playingDeck: {
          id: "deck-1",
          name: "Playing Deck",
          cards: [],
          isPublic: false,
        },
      })
    );

    const { container } = render(<BottomNavigation />);
    expect(container).toBeEmptyDOMElement();
  });

  it("resets selected deck when clicking Cards tab while already on flashcards view", () => {
    const mockSetSelectedDeckId = vi.fn();
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeSidebarView: "flashcards",
        setSelectedDeckId: mockSetSelectedDeckId,
      })
    );

    render(<BottomNavigation />);

    fireEvent.click(screen.getByRole("tab", { name: /cards section/i }));
    expect(mockSetSelectedDeckId).toHaveBeenCalledWith(null);
    expect(mockSetActiveSidebarView).toHaveBeenCalledWith("flashcards");
  });

  it("renders 99+ badge when dueCount exceeds 99 and pluralizes cards in title", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        studyStats: {
          streak: { current: 0, longest: 0, lastStudiedAt: null, isActiveToday: false },
          today: { reviewsCount: 0, targetReviews: 20, retentionRate: 100 },
          cardsBreakdown: { total: 150, dueToday: 120, newCards: 2, learning: 3, mature: 5 },
          ratingsDistribution: { again: 0, hard: 0, good: 0, easy: 0, totalReviews: 0 },
          heatmap: [],
          forecast: [],
        },
      })
    );

    render(<BottomNavigation />);

    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.getByTitle("120 cards due for review")).toBeInTheDocument();
  });

  it("falls back to cards.filter(isCardDue) when studyStats and getDueCards are undefined", () => {
    const mockDueCard: Card = {
      id: "card-fallback-1",
      jpText: "猫",
      enText: "Cat",
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: "2020-01-01T00:00:00.000Z",
      lastReviewedAt: null,
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        cards: [mockDueCard],
        studyStats: null,
        getDueCards: undefined as any,
      })
    );

    render(<BottomNavigation />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByTitle("1 card due for review")).toBeInTheDocument();
  });

  it("does not render due badge when cards are reviewed and not due, even if studyStats is stale", () => {
    const mockReviewedCard: Card = {
      id: "card-reviewed-1",
      jpText: "犬",
      enText: "Dog",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      lapses: 0,
      nextReviewAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow (not due)
      lastReviewedAt: new Date().toISOString(),
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        cards: [mockReviewedCard],
        getDueCards: () => [],
        studyStats: {
          streak: { current: 1, longest: 1, lastStudiedAt: null, isActiveToday: true },
          today: { reviewsCount: 1, targetReviews: 20, retentionRate: 100 },
          cardsBreakdown: { total: 1, dueToday: 1, newCards: 0, learning: 1, mature: 0 }, // Stale server value
          ratingsDistribution: { again: 0, hard: 0, good: 1, easy: 0, totalReviews: 1 },
          heatmap: [],
          forecast: [],
        },
      })
    );

    render(<BottomNavigation />);

    expect(screen.queryByTitle(/due for review/i)).not.toBeInTheDocument();
  });
});
