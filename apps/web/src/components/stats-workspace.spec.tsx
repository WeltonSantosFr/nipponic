import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StatsWorkspace } from "./stats-workspace";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import * as AuthContextModule from "@/contexts/AuthContext";
import type { StudyStats, Card, AuthContextData } from "@nipponic/shared";

describe("StatsWorkspace", () => {
  const mockRefreshStats = vi.fn().mockResolvedValue(undefined);
  const mockStartPlayingDeck = vi.fn();
  const mockDueCard: Card = {
    id: "card-1",
    jpText: "犬",
    enText: "Dog",
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: "2026-10-01T00:00:00.000Z",
    lastReviewedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };

  const createMockAuth = (overrides: Partial<AuthContextData> = {}): AuthContextData => ({
    user: null,
    isAuthenticated: false,
    isWakingServer: false,
    setIsWakingServer: vi.fn(),
    hasInitialToken: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    ...overrides,
  });

  const mockStudyStats: StudyStats = {
    streak: {
      current: 5,
      longest: 12,
      lastStudiedAt: "2026-10-31T12:00:00.000Z",
      isActiveToday: true,
    },
    today: {
      reviewsCount: 15,
      targetReviews: 20,
      retentionRate: 90,
    },
    cardsBreakdown: {
      total: 50,
      dueToday: 1,
      newCards: 10,
      learning: 25,
      mature: 15,
    },
    ratingsDistribution: {
      again: 2,
      hard: 4,
      good: 10,
      easy: 4,
      totalReviews: 20,
    },
    heatmap: Array.from({ length: 364 }, (_, i) => ({
      date: `2026-01-${String(i).padStart(3, "0")}`,
      count: i % 5 === 0 ? 3 : 0,
    })),
    forecast: [
      { date: "2026-10-31", dayLabel: "Today", count: 8 },
      { date: "2026-11-01", dayLabel: "Sun", count: 12 },
      { date: "2026-11-02", dayLabel: "Mon", count: 5 },
      { date: "2026-11-03", dayLabel: "Tue", count: 15 },
      { date: "2026-11-04", dayLabel: "Wed", count: 3 },
      { date: "2026-11-05", dayLabel: "Thu", count: 7 },
      { date: "2026-11-06", dayLabel: "Fri", count: 0 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders full dashboard stats correctly for authenticated user", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(
      createMockAuth({
        user: { sub: "user-1", username: "welton", email: "welton@example.com" },
        isAuthenticated: true,
      })
    );

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
      cards: [mockDueCard],
      decks: [],
      appDecks: [],
      publicDecks: [],
      activeDeckTab: "my",
      setActiveDeckTab: vi.fn(),
      selectedDeckId: null,
      selectedDeck: undefined,
      isCurrentDeckOwner: false,
      setSelectedDeckId: vi.fn(),
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
      stopPlayingDeck: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      reviewCard: vi.fn(),
      getDueCards: () => [mockDueCard],
      createDeck: vi.fn(),
      updateDeck: vi.fn(),
      deleteDeck: vi.fn(),
      addCardsToDeck: vi.fn(),
      removeCardFromDeck: vi.fn(),
      reorderDeckCards: vi.fn(),
      addDeckToMyDecks: vi.fn(),
      refreshAll: vi.fn(),
      studyStats: mockStudyStats,
      refreshStats: mockRefreshStats,
    });

    render(<StatsWorkspace />);

    // Header & Streak
    expect(screen.getByText("Study Statistics & Progress")).toBeInTheDocument();
    expect(screen.getAllByText("5")[0]).toBeInTheDocument();
    expect(screen.getByText("days streak")).toBeInTheDocument();
    expect(screen.getByText("Active Today")).toBeInTheDocument();
    expect(screen.getByText(/Best record:/i)).toBeInTheDocument();

    // Today's Reviews
    expect(screen.getByText("15 / 20")).toBeInTheDocument();
    expect(screen.getByText("90% correct")).toBeInTheDocument();

    // SRS Breakdown
    expect(screen.getByText("Spaced Repetition Memory Stages")).toBeInTheDocument();
    expect(screen.getByText("50 Total Cards")).toBeInTheDocument();
    expect(screen.getAllByText("10")[0]).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getAllByText("15")[0]).toBeInTheDocument();

    // Forecast & Heatmap
    expect(screen.getByText("7-Day Review Forecast")).toBeInTheDocument();
    expect(screen.getByText("Annual Study Consistency")).toBeInTheDocument();

    // Ratings Distribution
    expect(screen.getByText("Again (1)")).toBeInTheDocument();
    expect(screen.getByText("Hard (2)")).toBeInTheDocument();
    expect(screen.getByText("Good (3)")).toBeInTheDocument();
    expect(screen.getByText("Easy (4)")).toBeInTheDocument();
  });

  it("handles refresh action when refresh button is clicked", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(
      createMockAuth({
        isAuthenticated: true,
      })
    );

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
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
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
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
      studyStats: mockStudyStats,
      refreshStats: mockRefreshStats,
    });

    render(<StatsWorkspace />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRefreshStats).toHaveBeenCalled();
  });

  it("starts reviewing due cards when clicking review due button", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(
      createMockAuth({
        isAuthenticated: true,
      })
    );

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
      cards: [mockDueCard],
      decks: [],
      appDecks: [],
      publicDecks: [],
      activeDeckTab: "my",
      setActiveDeckTab: vi.fn(),
      selectedDeckId: null,
      selectedDeck: undefined,
      isCurrentDeckOwner: false,
      setSelectedDeckId: vi.fn(),
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
      stopPlayingDeck: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      reviewCard: vi.fn(),
      getDueCards: () => [mockDueCard],
      createDeck: vi.fn(),
      updateDeck: vi.fn(),
      deleteDeck: vi.fn(),
      addCardsToDeck: vi.fn(),
      removeCardFromDeck: vi.fn(),
      reorderDeckCards: vi.fn(),
      addDeckToMyDecks: vi.fn(),
      refreshAll: vi.fn(),
      studyStats: mockStudyStats,
      refreshStats: mockRefreshStats,
    });

    render(<StatsWorkspace />);

    const reviewBtn = screen.getByRole("button", { name: /review due cards now/i });
    fireEvent.click(reviewBtn);

    expect(mockStartPlayingDeck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "all-due",
        cards: [mockDueCard],
      })
    );
  });

  it("renders guest mode alert when user is unauthenticated", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(
      createMockAuth({
        isAuthenticated: false,
      })
    );

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
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
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
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
      refreshStats: mockRefreshStats,
    });

    render(<StatsWorkspace />);

    expect(screen.getByText("Guest Mode Active")).toBeInTheDocument();
    expect(
      screen.getByText(/sign in to sync your study streaks/i)
    ).toBeInTheDocument();
  });

  it("handles heatmap color variations, resting streak, and card stage calculations", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(
      createMockAuth({
        isAuthenticated: true,
      })
    );

    const learningCard: Card = {
      ...mockDueCard,
      id: "card-learning",
      repetitions: 2,
      interval: 10,
    };
    const matureCard: Card = {
      ...mockDueCard,
      id: "card-mature",
      repetitions: 5,
      interval: 30,
    };

    const variedHeatmapStats: StudyStats = {
      ...mockStudyStats,
      streak: {
        current: 1,
        longest: 0,
        lastStudiedAt: null,
        isActiveToday: false,
      },
      cardsBreakdown: {
        total: 0,
        dueToday: 0,
        newCards: 0,
        learning: 0,
        mature: 0,
      },
      heatmap: [
        { date: "2026-05-01", count: 25 },
        { date: "2026-05-02", count: 12 },
        { date: "2026-05-03", count: 6 },
        { date: "2026-05-04", count: 2 },
        { date: "2026-05-05", count: 0 },
      ],
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
      cards: [mockDueCard, learningCard, matureCard],
      decks: [],
      appDecks: [],
      publicDecks: [],
      activeDeckTab: "my",
      setActiveDeckTab: vi.fn(),
      selectedDeckId: null,
      selectedDeck: undefined,
      isCurrentDeckOwner: false,
      setSelectedDeckId: vi.fn(),
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
      stopPlayingDeck: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      reviewCard: vi.fn(),
      getDueCards: () => [mockDueCard],
      createDeck: vi.fn(),
      updateDeck: vi.fn(),
      deleteDeck: vi.fn(),
      addCardsToDeck: vi.fn(),
      removeCardFromDeck: vi.fn(),
      reorderDeckCards: vi.fn(),
      addDeckToMyDecks: vi.fn(),
      refreshAll: vi.fn(),
      studyStats: variedHeatmapStats,
      refreshStats: mockRefreshStats,
    });

    render(<StatsWorkspace />);

    // Resting badge and 1 day singular streak
    expect(screen.getByText("Resting")).toBeInTheDocument();
    expect(screen.getAllByText("1")[0]).toBeInTheDocument();
    expect(screen.getByText("day streak")).toBeInTheDocument();
    expect(screen.getByText("Review cards daily to build your streak!")).toBeInTheDocument();

    // Heatmap squares with different count thresholds
    expect(screen.getByTitle("25 reviews on 2026-05-01")).toHaveClass("bg-emerald-500");
    expect(screen.getByTitle("12 reviews on 2026-05-02")).toHaveClass("bg-emerald-500/80");
    expect(screen.getByTitle("6 reviews on 2026-05-03")).toHaveClass("bg-emerald-500/60");
    expect(screen.getByTitle("2 reviews on 2026-05-04")).toHaveClass("bg-emerald-500/35");
  });

  it("renders 'Goal Reached! 🎉' when reviews meet target, and handles singular heatmap day title", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(createMockAuth());

    const goalReachedStats: StudyStats = {
      ...mockStudyStats,
      today: {
        reviewsCount: 25,
        targetReviews: 20,
        retentionRate: 96,
      },
      heatmap: [
        { date: "2026-05-05", count: 1 },
      ],
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
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
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
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
      studyStats: goalReachedStats,
      refreshStats: mockRefreshStats,
    });

    render(<StatsWorkspace />);

    expect(screen.getByText("Goal Reached! 🎉")).toBeInTheDocument();
    expect(screen.getByTitle("1 review on 2026-05-05")).toBeInTheDocument();
  });

  it("handles fallback to cards.filter when getDueCards is undefined, and prevents starting review when empty", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue(createMockAuth());

    const duePastCard: Card = {
      ...mockDueCard,
      id: "card-past-due",
      nextReviewAt: "2020-01-01T00:00:00.000Z",
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
      cards: [duePastCard],
      decks: [],
      appDecks: [],
      publicDecks: [],
      activeDeckTab: "my",
      setActiveDeckTab: vi.fn(),
      selectedDeckId: null,
      selectedDeck: undefined,
      isCurrentDeckOwner: false,
      setSelectedDeckId: vi.fn(),
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
      stopPlayingDeck: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      reviewCard: vi.fn(),
      getDueCards: undefined as any,
      createDeck: vi.fn(),
      updateDeck: vi.fn(),
      deleteDeck: vi.fn(),
      addCardsToDeck: vi.fn(),
      removeCardFromDeck: vi.fn(),
      reorderDeckCards: vi.fn(),
      addDeckToMyDecks: vi.fn(),
      refreshAll: vi.fn(),
      studyStats: mockStudyStats,
      refreshStats: mockRefreshStats,
    });

    const { rerender } = render(<StatsWorkspace />);

    // Review button should be present because duePastCard is due
    const reviewBtn = screen.getByRole("button", { name: /Review Due Cards Now/i });
    expect(reviewBtn).toBeInTheDocument();
    fireEvent.click(reviewBtn);
    expect(mockStartPlayingDeck).toHaveBeenCalled();

    // Now test with 0 cards and getDueCards returning empty
    mockStartPlayingDeck.mockClear();
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
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
      activeSidebarView: "stats",
      setActiveSidebarView: vi.fn(),
      playingDeck: null,
      startPlayingDeck: mockStartPlayingDeck,
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
      studyStats: mockStudyStats,
      refreshStats: mockRefreshStats,
    });

    rerender(<StatsWorkspace />);
    expect(screen.getByText("All caught up! No reviews due right now.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Review Due Cards Now/i })).not.toBeInTheDocument();
  });
});
