import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { DeckGrid } from "./deck-grid";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import type { FlashCardsContextData, Deck, Card } from "@nipponic/shared";

vi.mock("@/components/delete-deck-modal", () => ({
  DeleteDeckModal: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-delete-deck-modal">
        <button onClick={onConfirm}>Confirm Delete Deck</button>
        <button onClick={onClose}>Cancel Delete Deck</button>
      </div>
    ) : null,
}));

describe("DeckGrid", () => {
  const mockSelectDeck = vi.fn();
  const mockCreateDeck = vi.fn();
  const mockDeleteDeck = vi.fn();
  const mockStartPlayingDeck = vi.fn();
  const mockSetActiveDeckTab = vi.fn();
  const mockAddDeckToMyDecks = vi.fn().mockResolvedValue({ id: "cloned-1" });

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

  const mockPublicDecks: Deck[] = [
    {
      id: "pub-1",
      name: "JLPT N1 Grammar",
      cards: [card2],
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
    publicDecks: mockPublicDecks,
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
    deleteDeck: mockDeleteDeck,
    addCardsToDeck: vi.fn(),
    removeCardFromDeck: vi.fn(),
    reorderDeckCards: vi.fn(),
    addDeckToMyDecks: mockAddDeckToMyDecks,
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

    const communityTab = screen.getByRole("tab", { name: /Community/i });
    fireEvent.click(communityTab);
    expect(mockSetActiveDeckTab).toHaveBeenCalledWith("public");
  });

  it("opens delete modal and confirms deletion of owner deck", async () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const deleteBtns = screen.getAllByTitle("Delete deck");
    fireEvent.click(deleteBtns[0]!);

    await waitFor(() => {
      expect(screen.getByTestId("mock-delete-deck-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete Deck" }));
    expect(mockDeleteDeck).toHaveBeenCalledWith("deck-1");
  });

  it("handles cancelling deck deletion", async () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const deleteBtns = screen.getAllByTitle("Delete deck");
    fireEvent.click(deleteBtns[0]!);

    await waitFor(() => {
      expect(screen.getByTestId("mock-delete-deck-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel Delete Deck" }));
    expect(screen.queryByTestId("mock-delete-deck-modal")).not.toBeInTheDocument();
    expect(mockDeleteDeck).not.toHaveBeenCalled();
  });

  it("uses default createDeck fallback when onCreateDeck prop is omitted", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [] })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const createBtn = screen.getByRole("button", { name: /Create New Deck/i });
    fireEvent.click(createBtn);
    expect(mockCreateDeck).toHaveBeenCalledWith("New Deck");
  });

  it("switches back to My Decks tab", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks, activeDeckTab: "app" })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const myDecksTab = screen.getByRole("tab", { name: /My Decks/i });
    fireEvent.click(myDecksTab);
    expect(mockSetActiveDeckTab).toHaveBeenCalledWith("my");
  });

  it("renders community tab decks and empty community state", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeDeckTab: "public",
        publicDecks: mockPublicDecks,
      })
    );

    const { rerender } = render(<DeckGrid onSelectDeck={mockSelectDeck} />);
    expect(screen.getByText("JLPT N1 Grammar")).toBeInTheDocument();

    // Empty community state
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeDeckTab: "public",
        publicDecks: [],
      })
    );
    rerender(<DeckGrid onSelectDeck={mockSelectDeck} />);
    expect(screen.getByText("No community decks available yet.")).toBeInTheDocument();
  });

  it("adds starter deck to personal collection from Starter Decks tab", async () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeDeckTab: "app",
        decks: [],
      })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    expect(screen.getByText("Hiragana Basic")).toBeInTheDocument();
    const addBtn = screen.getByRole("button", { name: /Add/i });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(mockAddDeckToMyDecks).toHaveBeenCalledWith(mockAppDecks[0]);
  });

  it("shows empty search result and clears search when clicking the empty-state clear button", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: mockDecks })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    const searchInput = screen.getByPlaceholderText("Search decks...");
    fireEvent.change(searchInput, { target: { value: "Nonexistent" } });

    expect(screen.getByText('No decks matching "Nonexistent"')).toBeInTheDocument();

    // Click the clear button inside empty search state
    const clearBtns = screen.getAllByRole("button", { name: /Clear search/i });
    const emptyStateClearBtn = clearBtns[clearBtns.length - 1]!;
    fireEvent.click(emptyStateClearBtn);

    expect(screen.getByText("Animals Vocabulary")).toBeInTheDocument();
  });

  it("renders singular '1 card' badge, 'Untitled Deck' fallback, and 'Public' badge for owner deck", () => {
    const singleCardDeck: Deck = {
      id: "deck-single",
      name: "",
      cards: [card1],
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [singleCardDeck] })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    expect(screen.getByText("Untitled Deck")).toBeInTheDocument();
    expect(screen.getByText("1 card")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("renders 'Added' badge when starter deck is already in user's decks", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeDeckTab: "app",
        decks: [
          {
            id: "user-deck-1",
            name: "Hiragana Basic", // matches mockAppDecks[0].name
            cards: [],
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add/i })).not.toBeInTheDocument();
  });

  it("renders 'No decks found.' when Starter Decks tab has no decks", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        activeDeckTab: "app",
        appDecks: [],
      })
    );

    render(<DeckGrid onSelectDeck={mockSelectDeck} />);

    expect(screen.getByText("No decks found.")).toBeInTheDocument();
  });
});
