import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeckGrid } from "./deck-grid";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import type { FlashCardsContextData, Deck, Card } from "@nipponic/shared";

describe("DeckGrid", () => {
  const mockSelectDeck = vi.fn();
  const mockCreateDeck = vi.fn();
  const mockStartPlayingDeck = vi.fn();
  const mockSetActiveDeckTab = vi.fn();

  const card1: Card = {
    id: "card-1",
    jpText: "猫",
    enText: "Cat",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    nextReviewAt: new Date(Date.now() - 3600000).toISOString(), // due
    lastReviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const card2: Card = {
    id: "card-2",
    jpText: "犬",
    enText: "Dog",
    interval: 10,
    easeFactor: 2.5,
    repetitions: 3,
    lapses: 0,
    nextReviewAt: new Date(Date.now() + 86400000).toISOString(), // not due
    lastReviewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCards: Card[] = [card1, card2];

  const mockDecks: Deck[] = [
    {
      id: "deck-1",
      name: "Animals Vocabulary",
      cards: mockCards,
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "deck-2",
      name: "Basic Verbs",
      cards: [],
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockAppDecks: Deck[] = [
    {
      id: "app-1",
      name: "Hiragana Basic",
      cards: [card1],
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const createMockFlashcards = (
    overrides: Partial<FlashCardsContextData> = {}
  ): FlashCardsContextData => ({
    cards: mockCards,
    decks: mockDecks,
    appDecks: mockAppDecks,
    publicDecks: [],
    activeDeckTab: "my",
    setActiveDeckTab: mockSetActiveDeckTab,
    selectedDeckId: null,
    selectedDeck: undefined,
    isCurrentDeckOwner: true,
    setSelectedDeckId: vi.fn(),
    activeSidebarView: "flashcards",
    setActiveSidebarView: vi.fn(),
    playingDeck: null,
    startPlayingDeck: mockStartPlayingDeck,
    stopPlayingDeck: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reviewCard: vi.fn(),
    getDueCards: () => [card1],
    createDeck: mockCreateDeck,
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

  it("renders empty state notice when user has 0 decks in My Decks", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [] })
    );

    render(
      <DeckGrid onSelectDeck={mockSelectDeck} onCreateDeck={mockCreateDeck} />
    );

    expect(screen.getByText("No deck selected")).toBeInTheDocument();
    expect(
      screen.getByText(/Select a deck from the sidebar or create a new pack/i)
    ).toBeInTheDocument();

    const createButton = screen.getByRole("button", {
      name: /Create New Deck/i,
    });
    fireEvent.click(createButton);
    expect(mockCreateDeck).toHaveBeenCalled();
  });

  it("renders responsive grid of decks when user has decks", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    expect(screen.getByTestId("decks-grid")).toBeInTheDocument();
    expect(screen.getByText("Animals Vocabulary")).toBeInTheDocument();
    expect(screen.getByText("Basic Verbs")).toBeInTheDocument();
    expect(screen.getByText("2 cards")).toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
  });

  it("displays due cards badge when a deck has cards ready for review", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    expect(screen.getByText("1 due")).toBeInTheDocument();
  });

  it("calls onSelectDeck when clicking on a deck card", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const deckCard = screen.getByTestId("deck-card-deck-1");
    fireEvent.click(deckCard);

    expect(mockSelectDeck).toHaveBeenCalledWith("deck-1");
  });

  it("starts flashcard study session directly when Study button is clicked", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const studyButton = screen.getByRole("button", { name: /Review/i });
    fireEvent.click(studyButton);

    expect(mockStartPlayingDeck).toHaveBeenCalledWith(mockDecks[0]);
    // Should NOT trigger onSelectDeck because event propagation is stopped
    expect(mockSelectDeck).not.toHaveBeenCalled();
  });

  it("filters decks in grid when typing into search input", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const searchInput = screen.getByPlaceholderText("Search decks...");
    fireEvent.change(searchInput, { target: { value: "Animals" } });

    expect(screen.getByText("Animals Vocabulary")).toBeInTheDocument();
    expect(screen.queryByText("Basic Verbs")).not.toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: /Clear search/i });
    fireEvent.click(clearButton);

    expect(screen.getByText("Basic Verbs")).toBeInTheDocument();
  });

  it("switches tabs between My Decks, Starter Decks, and Community", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks, activeDeckTab: "my" })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const starterTab = screen.getByRole("tab", { name: /Starter Decks/i });
    fireEvent.click(starterTab);

    expect(mockSetActiveDeckTab).toHaveBeenCalledWith("app");
  });
});
