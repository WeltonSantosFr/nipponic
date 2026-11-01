import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { DeckCardGridItem, DeckWorkspace } from "./deck-workspace";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import * as SpeechModule from "@/hooks/use-speech";
import type { Card, Deck, FlashCardsContextData } from "@nipponic/shared";

vi.mock("@/components/add-cards-modal", () => ({
  AddCardsModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-add-cards-modal">
        <button onClick={onClose}>Close Add Cards</button>
      </div>
    ) : null,
}));

describe("DeckCardGridItem", () => {
  const mockCard: Card = {
    id: "card-123",
    jpText: "猫",
    enText: "Cat",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    nextReviewAt: "2026-01-01T00:00:00.000Z",
    lastReviewedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders card content and handles translation toggle with card id", () => {
    const handleToggleReveal = vi.fn();
    const handleMoveCard = vi.fn();
    const handleRemoveCard = vi.fn();
    const handleSpeak = vi.fn();

    const { rerender } = render(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={3}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    expect(screen.getByText("猫")).toBeInTheDocument();
    expect(screen.getByText("Reveal translation")).toBeInTheDocument();

    // Toggle reveal button should pass card id
    fireEvent.click(screen.getByText("Reveal translation"));
    expect(handleToggleReveal).toHaveBeenCalledWith("card-123");

    // Re-render as revealed
    rerender(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={3}
        isRevealed={true}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    expect(screen.getByText("Cat")).toBeInTheDocument();
    expect(screen.getByText("Hide translation")).toBeInTheDocument();
  });

  it("triggers move right and remove callbacks with stable parameters", () => {
    const handleToggleReveal = vi.fn();
    const handleMoveCard = vi.fn();
    const handleRemoveCard = vi.fn();
    const handleSpeak = vi.fn();

    render(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={3}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    // Left button should be disabled for first item (index 0)
    const moveLeftBtn = screen.getByTitle("Move left/up");
    expect(moveLeftBtn).toBeDisabled();

    // Move right button should trigger onMoveCard(0, "right")
    const moveRightBtn = screen.getByTitle("Move right/down");
    fireEvent.click(moveRightBtn);
    expect(handleMoveCard).toHaveBeenCalledWith(0, "right");

    // Remove button should trigger onRemoveCard("card-123")
    const removeBtn = screen.getByTitle("Remove from deck");
    fireEvent.click(removeBtn);
    expect(handleRemoveCard).toHaveBeenCalledWith("card-123");

    // When index > 0, move left is enabled and triggers onMoveCard(1, "left")
    render(
      <DeckCardGridItem
        card={mockCard}
        index={1}
        total={3}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );
    const moveLeftBtns = screen.getAllByTitle("Move left/up");
    const moveLeftActive = moveLeftBtns[1]!;
    expect(moveLeftActive).not.toBeDisabled();
    fireEvent.click(moveLeftActive);
    expect(handleMoveCard).toHaveBeenCalledWith(1, "left");
  });

  it("handles audio playback triggering onSpeak and reflects isPlaying status", () => {
    const handleSpeak = vi.fn();
    const handleToggleReveal = vi.fn();
    const handleMoveCard = vi.fn();
    const handleRemoveCard = vi.fn();

    const { rerender } = render(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    const playBtn = screen.getByTitle("Listen to pronunciation");
    fireEvent.click(playBtn);
    expect(handleSpeak).toHaveBeenCalledWith("猫", "ja-JP");

    // When card is actively playing
    rerender(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={true}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    expect(screen.getByTitle("Listen to pronunciation")).toBeDisabled();
  });
});

describe("DeckWorkspace", () => {
  const mockSetSelectedDeckId = vi.fn();
  const mockCreateDeck = vi.fn();
  const mockUpdateDeck = vi.fn();
  const mockStartPlayingDeck = vi.fn();
  const mockRemoveCardFromDeck = vi.fn();
  const mockReorderDeckCards = vi.fn();
  const mockAddDeckToMyDecks = vi.fn().mockResolvedValue({ id: "d-cloned" });
  const mockSpeak = vi.fn();

  const mockCardDue: Card = {
    id: "card-due",
    jpText: "犬",
    enText: "Dog",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    nextReviewAt: "2020-01-01T00:00:00.000Z", // due
    lastReviewedAt: null,
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
  };

  const mockCardNotDue: Card = {
    id: "card-not-due",
    jpText: "猫",
    enText: "Cat",
    interval: 10,
    easeFactor: 2.5,
    repetitions: 3,
    lapses: 0,
    nextReviewAt: "2099-01-01T00:00:00.000Z",
    lastReviewedAt: null,
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
  };

  const mockDeck: Deck = {
    id: "deck-123",
    name: "Test Vocabulary",
    cards: [mockCardDue, mockCardNotDue],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createMockFlashcards = (
    overrides: Partial<FlashCardsContextData> = {}
  ): FlashCardsContextData => ({
    cards: [mockCardDue, mockCardNotDue],
    decks: [mockDeck],
    appDecks: [],
    publicDecks: [],
    activeDeckTab: "my",
    setActiveDeckTab: vi.fn(),
    selectedDeckId: "deck-123",
    selectedDeck: mockDeck,
    isCurrentDeckOwner: true,
    setSelectedDeckId: mockSetSelectedDeckId,
    activeSidebarView: "flashcards",
    setActiveSidebarView: vi.fn(),
    playingDeck: null,
    startPlayingDeck: mockStartPlayingDeck,
    stopPlayingDeck: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reviewCard: vi.fn(),
    getDueCards: () => [mockCardDue],
    createDeck: mockCreateDeck,
    updateDeck: mockUpdateDeck,
    deleteDeck: vi.fn(),
    addCardsToDeck: vi.fn(),
    removeCardFromDeck: mockRemoveCardFromDeck,
    reorderDeckCards: mockReorderDeckCards,
    addDeckToMyDecks: mockAddDeckToMyDecks,
    refreshAll: vi.fn(),
    studyStats: null,
    refreshStats: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(SpeechModule, "useSpeech").mockReturnValue({
      speak: mockSpeak,
      stop: vi.fn(),
      isPlaying: false,
      isLoading: false,
      supported: true,
      voices: [],
    } as any);
  });

  it("renders empty state notice when deck is undefined and decks.length === 0", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [] })
    );

    render(<DeckWorkspace deck={undefined} />);

    expect(screen.getByText("No deck selected")).toBeInTheDocument();
    expect(
      screen.getByText(/Select a deck from the sidebar or create a new pack/i)
    ).toBeInTheDocument();
  });

  it("renders DeckGrid when deck is undefined and decks.length > 0", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [mockDeck] })
    );

    render(<DeckWorkspace deck={undefined} />);

    expect(screen.getByTestId("decks-grid")).toBeInTheDocument();
    expect(screen.getByText("Test Vocabulary")).toBeInTheDocument();
  });

  it("renders Back to Decks button and resets selectedDeckId on click", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [mockDeck], selectedDeck: mockDeck })
    );

    render(<DeckWorkspace deck={mockDeck} />);

    const backButton = screen.getByRole("button", { name: /Back to Decks/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockSetSelectedDeckId).toHaveBeenCalledWith(null);
  });

  it("allows renaming deck and toggling public visibility", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards()
    );

    render(<DeckWorkspace deck={mockDeck} />);

    const nameInput = screen.getByPlaceholderText("Deck name...");
    fireEvent.change(nameInput, { target: { value: "New Vocabulary Name" } });
    expect(mockUpdateDeck).toHaveBeenCalledWith("deck-123", { name: "New Vocabulary Name" });

    // Toggle public/private
    const visibilityBtn = screen.getByTitle(/Private Deck: only visible to you/i);
    fireEvent.click(visibilityBtn);
    expect(mockUpdateDeck).toHaveBeenCalledWith("deck-123", { isPublic: true });
  });

  it("plays all cards or only due cards", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards()
    );

    render(<DeckWorkspace deck={mockDeck} />);

    // Play due cards
    const playDueBtn = screen.getByRole("button", { name: /Review Due \(1\)/i });
    fireEvent.click(playDueBtn);
    expect(mockStartPlayingDeck).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "deck-123",
        cards: [mockCardDue],
      })
    );

    // Play all cards
    const playAllBtn = screen.getByRole("button", { name: /Play All \(2\)/i });
    fireEvent.click(playAllBtn);
    expect(mockStartPlayingDeck).toHaveBeenCalledWith(mockDeck);
  });

  it("filters between All Cards and Due for Review", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards()
    );

    render(<DeckWorkspace deck={mockDeck} />);

    // Default: All cards (2 displayed)
    expect(screen.getByText("犬")).toBeInTheDocument();
    expect(screen.getByText("猫")).toBeInTheDocument();

    // Switch to Due for Review
    const dueFilterBtn = screen.getByRole("button", { name: /Due for Review/i });
    fireEvent.click(dueFilterBtn);

    expect(screen.getByText("犬")).toBeInTheDocument();
    expect(screen.queryByText("猫")).toBeNull();
  });

  it("opens AddCardsModal when clicking Add Cards", async () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards()
    );

    render(<DeckWorkspace deck={mockDeck} />);

    const addCardsBtn = screen.getByRole("button", { name: /Add Cards/i });
    fireEvent.click(addCardsBtn);

    await waitFor(() => {
      expect(screen.getByTestId("mock-add-cards-modal")).toBeInTheDocument();
    });
  });

  it("renders non-owner app deck and allows adding it to personal collection", async () => {
    const appDeck: Deck = {
      id: "app-deck-n5",
      name: "JLPT N5 Core App Deck",
      cards: [mockCardDue],
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        isCurrentDeckOwner: false,
        selectedDeckId: "app-deck-n5",
        selectedDeck: appDeck,
        decks: [],
      })
    );

    render(<DeckWorkspace deck={appDeck} />);

    expect(screen.getByText("App Deck")).toBeInTheDocument();
    const addToMyDecksBtn = screen.getByRole("button", { name: /Add to my Decks/i });
    await act(async () => {
      fireEvent.click(addToMyDecksBtn);
    });

    expect(mockAddDeckToMyDecks).toHaveBeenCalledWith(appDeck);
  });

  it("handles card reordering, removal, and reveal within DeckWorkspace", async () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards()
    );

    render(<DeckWorkspace deck={mockDeck} />);

    // Toggle reveal for first card (Dog)
    const revealBtns = screen.getAllByText("Reveal translation");
    fireEvent.click(revealBtns[0]!);
    expect(screen.getByText("Dog")).toBeInTheDocument();

    // Toggle hide translation
    const hideBtn = screen.getByText("Hide translation");
    fireEvent.click(hideBtn);
    expect(screen.queryByText("Dog")).not.toBeInTheDocument();

    // Pronunciation audio
    const speakBtns = screen.getAllByTitle("Listen to pronunciation");
    if (speakBtns.length > 0) {
      await act(async () => {
        fireEvent.click(speakBtns[0]!);
      });
      expect(mockSpeak).toHaveBeenCalledWith("犬", "ja-JP");
    }

    // Reorder card right
    const moveRightBtns = screen.getAllByTitle("Move right/down");
    fireEvent.click(moveRightBtns[0]!);
    expect(mockReorderDeckCards).toHaveBeenCalledWith("deck-123", ["card-not-due", "card-due"]);

    // Remove card
    const removeBtns = screen.getAllByTitle("Remove from deck");
    fireEvent.click(removeBtns[0]!);
    expect(mockRemoveCardFromDeck).toHaveBeenCalledWith("deck-123", "card-due");
  });

  it("handles empty states and AddCardsModal lifecycle", async () => {
    const emptyDeck: Deck = {
      id: "deck-empty",
      name: "Empty Deck",
      cards: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeckId: "deck-empty",
        selectedDeck: emptyDeck,
        decks: [emptyDeck],
      })
    );

    render(<DeckWorkspace deck={emptyDeck} />);

    expect(screen.getByText("No cards in this deck yet")).toBeInTheDocument();
    const addArsenalBtn = screen.getByRole("button", { name: /Add Cards from Arsenal/i });
    fireEvent.click(addArsenalBtn);

    await waitFor(() => {
      expect(screen.getByTestId("mock-add-cards-modal")).toBeInTheDocument();
    });

    // Close the modal
    fireEvent.click(screen.getByText("Close Add Cards"));
    await waitFor(() => {
      expect(screen.queryByTestId("mock-add-cards-modal")).toBeNull();
    });
  });

  it("handles all caught up empty state when filtering due cards", () => {
    // Deck with cards, but none due
    const caughtUpDeck: Deck = {
      id: "deck-caught-up",
      name: "Caught Up Deck",
      cards: [mockCardNotDue],
      isPublic: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeckId: "deck-caught-up",
        selectedDeck: caughtUpDeck,
        decks: [caughtUpDeck],
      })
    );

    render(<DeckWorkspace deck={caughtUpDeck} />);

    // Switch filter to Due
    const dueFilterBtn = screen.getByRole("button", { name: /Due for Review/i });
    fireEvent.click(dueFilterBtn);

    expect(screen.getByText(/All caught up!/i)).toBeInTheDocument();

    // Click All Cards filter tab
    const allCardsTab = screen.getByRole("button", { name: /^All Cards \(\d+\)$/i });
    fireEvent.click(allCardsTab);
    expect(screen.getByText("猫")).toBeInTheDocument();

    // Switch back to Due and test View All Cards button
    fireEvent.click(dueFilterBtn);
    const viewAllBtn = screen.getByRole("button", { name: /View All Cards/i });
    fireEvent.click(viewAllBtn);

    // Resets back to all
    expect(screen.getByText("猫")).toBeInTheDocument();
  });

  it("renders Public Deck badge for non-owner community deck", () => {
    const communityDeck: Deck = {
      id: "deck-community-456",
      name: "Community Shared Deck",
      cards: [mockCardNotDue],
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        isCurrentDeckOwner: false,
        selectedDeckId: "deck-community-456",
        selectedDeck: communityDeck,
        decks: [],
      })
    );

    render(<DeckWorkspace deck={communityDeck} />);

    expect(screen.getByText("Public Deck")).toBeInTheDocument();
  });

  it("renders DeckGrid when deck is null and handles deck selection and creation", async () => {
    const mockSetSelectedDeckId = vi.fn();
    const mockCreateDeck = vi.fn().mockResolvedValue({ id: "new-deck-1" });

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeckId: null,
        selectedDeck: undefined,
        setSelectedDeckId: mockSetSelectedDeckId,
        createDeck: mockCreateDeck,
        decks: [
          {
            id: "d-grid-1",
            name: "Grid Deck",
            cards: [],
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      })
    );

    render(<DeckWorkspace deck={undefined} />);

    // Click on deck in grid
    const deckItem = screen.getByText("Grid Deck");
    fireEvent.click(deckItem);
    expect(mockSetSelectedDeckId).toHaveBeenCalledWith("d-grid-1");

    // Click on create deck
    const createDeckBtn = screen.getByRole("button", { name: /New Deck/i });
    await act(async () => {
      fireEvent.click(createDeckBtn);
    });
    expect(mockCreateDeck).toHaveBeenCalledWith("New Deck");
  });

  it("renders empty state when deck is undefined and decks list is empty", async () => {
    const mockCreateDeck = vi.fn().mockResolvedValue({ id: "new-deck-1" });
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeckId: null,
        selectedDeck: undefined,
        decks: [],
        createDeck: mockCreateDeck,
      })
    );

    render(<DeckWorkspace deck={undefined} />);

    expect(screen.getByText("No deck selected")).toBeInTheDocument();
    const createDeckBtn = screen.getByRole("button", { name: "Create New Deck" });
    fireEvent.click(createDeckBtn);
    expect(mockCreateDeck).toHaveBeenCalledWith("New Deck");
  });

  it("renders Mastered badge and repetitions count correctly on card items", () => {
    const masteredCard: Card = {
      id: "c-mastered",
      jpText: "先生",
      enText: "Teacher",
      interval: 30,
      easeFactor: 2.5,
      repetitions: 4,
      lapses: 0,
      nextReviewAt: "2099-01-01T00:00:00.000Z",
      lastReviewedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const singleRepCard: Card = {
      ...masteredCard,
      id: "c-single-rep",
      interval: 1,
      repetitions: 1,
    };

    const zeroRepCard: Card = {
      ...masteredCard,
      id: "c-zero-rep",
      interval: 0,
      repetitions: 0,
    };

    const { rerender } = render(
      <DeckCardGridItem
        card={masteredCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={vi.fn()}
        onToggleReveal={vi.fn()}
        onMoveCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    );

    expect(screen.getByText("Mastered")).toBeInTheDocument();
    expect(screen.getByText("4 reps")).toBeInTheDocument();

    // Rerender with single rep
    rerender(
      <DeckCardGridItem
        card={singleRepCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={vi.fn()}
        onToggleReveal={vi.fn()}
        onMoveCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    );

    expect(screen.getByText("1 rep")).toBeInTheDocument();

    // Rerender with zero reps
    rerender(
      <DeckCardGridItem
        card={zeroRepCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={vi.fn()}
        onToggleReveal={vi.fn()}
        onMoveCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    );

    expect(screen.queryByText(/rep/i)).not.toBeInTheDocument();
  });

  it("toggles deck public/private status and renders Added to My Decks for community decks", async () => {
    const mockUpdateDeck = vi.fn().mockResolvedValue(undefined);
    const privateDeck: Deck = {
      id: "d-private",
      name: "Private Deck",
      cards: [],
      isPublic: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeck: privateDeck,
        updateDeck: mockUpdateDeck,
        decks: [privateDeck],
      })
    );

    const { rerender } = render(<DeckWorkspace deck={privateDeck} />);

    // Private deck shows Private button
    const privateBtn = screen.getByRole("button", { name: /Private/i });
    expect(privateBtn).toBeInTheDocument();
    fireEvent.click(privateBtn);
    expect(mockUpdateDeck).toHaveBeenCalledWith("d-private", { isPublic: true });

    // Community deck that is already added
    const communityDeck: Deck = {
      id: "d-comm",
      name: "Community Deck",
      cards: [],
      isPublic: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeck: communityDeck,
        isCurrentDeckOwner: false,
        decks: [{ id: "d-my-copy", name: "Community Deck", cards: [] } as any],
      })
    );

    rerender(<DeckWorkspace deck={communityDeck} />);
    expect(screen.getByRole("button", { name: "Added to My Decks" })).toBeDisabled();
  });

  it("toggles public deck to private when clicked by owner", () => {
    const publicDeck: Deck = {
      id: "d-pub",
      name: "Public Deck",
      cards: [],
      isPublic: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const mockUpdateDeck = vi.fn();
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({
        selectedDeck: publicDeck,
        updateDeck: mockUpdateDeck,
        isCurrentDeckOwner: true,
      })
    );

    render(<DeckWorkspace deck={publicDeck} />);
    const pubBtn = screen.getByRole("button", { name: /Public/i });
    expect(pubBtn).toBeInTheDocument();
    fireEvent.click(pubBtn);
    expect(mockUpdateDeck).toHaveBeenCalledWith("d-pub", { isPublic: false });
  });
});
