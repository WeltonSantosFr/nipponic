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
});
